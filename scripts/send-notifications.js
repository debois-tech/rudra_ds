require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// --- ⚙️ CONTROL PANEL --------------------------------------------------
const TEMPLATE_NAME = "expiry_alert"; // Your Meta WhatsApp Template Name

// 🟢 TRUE  = Test Mode (Ignores dates, sends to ALL docs with valid mobile)
// 🔴 FALSE = Production Mode (Only sends on configured reminder days)
const FORCE_SEND_ALL = process.env.FORCE_SEND_ALL === 'true' || false;

// Default reminder days if app_settings not configured
const DEFAULT_REMINDER_DAYS = [7, 3, 1, 0];
// -----------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const token = process.env.META_WHATSAPP_TOKEN;
const phoneId = process.env.META_WHATSAPP_PHONE_ID;

// Get reminder days from app_settings
const getReminderDays = async () => {
  try {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'notification_days')
      .single();

    if (data?.value) {
      return data.value.split(',').map(d => parseInt(d.trim())).filter(n => !isNaN(n));
    }
  } catch (e) {
    console.log('⚠️ Using default reminder days');
  }
  return DEFAULT_REMINDER_DAYS;
};

const getDaysDifference = (expiryDateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateString);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
};

const formatMobileNumber = (mobile) => {
  if (!mobile) return null;

  // Remove spaces, dashes, parentheses, or + signs
  let formatted = mobile.replace(/\D/g, '');

  // If number is 10 digits (Indian format), add 91
  if (formatted.length === 10) {
    formatted = '91' + formatted;
  }

  return formatted;
};

const sendMessage = async (mobile, name, docName, daysLeft, vehicleInfo = "") => {
  const formattedNumber = formatMobileNumber(mobile);

  if (!formattedNumber) {
    console.log(`      ⚠️ Skipping ${name}: No mobile number found.`);
    return { success: false, reason: 'no_mobile' };
  }

  // Customize message for vehicle documents
  let finalDocName = docName;
  if (vehicleInfo) finalDocName = `${docName} (${vehicleInfo})`;

  console.log(`   🚀 Sending to ${name} (${formattedNumber}): "${finalDocName}" (Due in ${daysLeft} days)`);

  try {
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedNumber,
          type: "template",
          template: {
            name: TEMPLATE_NAME,
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: name },
                  { type: "text", text: finalDocName },
                  { type: "text", text: String(daysLeft) }
                ]
              }
            ]
          }
        }),
      }
    );

    if (response.ok) {
      console.log(`      ✅ WhatsApp Sent!`);
      return { success: true };
    } else {
      const err = await response.json();
      console.log(`      ❌ WhatsApp Failed: ${err.error?.message}`);
      return { success: false, reason: err.error?.message };
    }
  } catch (e) {
    console.error(`      ❌ Network Error`, e.message);
    return { success: false, reason: 'network_error' };
  }
};

const logNotification = async (docId, daysLeft, status, errorMsg = null) => {
  try {
    await supabase.from('notification_logs').insert({
      doc_id: docId,
      days_before: daysLeft,
      status: status,
      error_message: errorMsg,
    });
  } catch (e) {
    console.log('⚠️ Could not log notification:', e.message);
  }
};

const run = async () => {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`🚀 RUDRA DS - Document Expiry Notification System`);
  console.log(`📅 Run Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  console.log(`🔧 Mode: ${FORCE_SEND_ALL ? '🔥 TEST (Send All)' : '🛡️ PRODUCTION (Scheduled Days)'}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Get configured reminder days
  const reminderDays = await getReminderDays();
  console.log(`📌 Reminder Days: ${reminderDays.join(', ')} days before expiry\n`);

  // Fetch all documents with expiry dates
  const { data: documents, error } = await supabase
    .from('documents')
    .select('*, document_types(doc_type_name)')
    .not('exp_date', 'is', null);

  if (error) {
    console.error("❌ Database Error:", error.message);
    return;
  }

  console.log(`🔍 Found ${documents.length} total documents with expiry dates.\n`);

  let sentCount = 0;
  let skippedCount = 0;

  for (const doc of documents) {
    const daysLeft = getDaysDifference(doc.exp_date);
    const shouldSend = FORCE_SEND_ALL || reminderDays.includes(daysLeft);

    if (!shouldSend) {
      skippedCount++;
      continue;
    }

    console.log(`\n📄 Processing Doc ID: ${doc.doc_id}`);
    console.log(`   Type: ${doc.document_types?.doc_type_name || 'Unknown'}`);
    console.log(`   Expiry: ${doc.exp_date} (${daysLeft} days left)`);

    // Find the owner based on entity type
    let ownerName = null;
    let ownerMobile = null;
    let vehicleInfo = "";

    if (doc.entity_type === 'customer') {
      // Document belongs to a customer directly
      const { data: customer } = await supabase
        .from('customers')
        .select('c_name, c_mobile')
        .eq('c_id', doc.entity_id)
        .single();

      if (customer) {
        ownerName = customer.c_name;
        ownerMobile = customer.c_mobile;
      }
    }
    else if (doc.entity_type === 'vehicle') {
      // Document belongs to a vehicle - find the vehicle's owner
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('v_number, v_name, owner_id, customers(c_name, c_mobile)')
        .eq('v_id', doc.entity_id)
        .single();

      if (vehicle && vehicle.customers) {
        ownerName = vehicle.customers.c_name;
        ownerMobile = vehicle.customers.c_mobile;
        vehicleInfo = vehicle.v_number;
      }
    }

    if (ownerName && ownerMobile) {
      const result = await sendMessage(
        ownerMobile,
        ownerName,
        doc.document_types?.doc_type_name || "Document",
        daysLeft,
        vehicleInfo
      );

      // Log the notification
      await logNotification(
        doc.doc_id,
        daysLeft,
        result.success ? 'sent' : 'failed',
        result.reason || null
      );

      if (result.success) sentCount++;
    } else {
      console.log(`   ⚠️ Skipped: Owner not found for entity ${doc.entity_id}`);
      skippedCount++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`🏁 COMPLETED`);
  console.log(`   ✅ Sent: ${sentCount} notifications`);
  console.log(`   ⏭️ Skipped: ${skippedCount} documents`);
  console.log('═══════════════════════════════════════════════════════════════');
};

run();