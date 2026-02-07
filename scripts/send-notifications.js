require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// --- ⚙️ CONTROL PANEL --------------------------------------------------
const TEMPLATE_NAME = "expiry_alert"; // Ensure this matches your Meta Template Name

// 🟢 TRUE  = Test Mode (Ignores dates, sends to ALL valid docs)
// 🔴 FALSE = Production Mode (Only sends 7 days, 1 day, 0 days before)
const FORCE_SEND_ALL = true; 
// -----------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const token = process.env.META_WHATSAPP_TOKEN;
const phoneId = process.env.META_WHATSAPP_PHONE_ID;

const getDaysDifference = (expiryDateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  const expiry = new Date(expiryDateString);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24)); 
};

const sendMessage = async (mobile, name, docName, daysLeft, vehicleInfo = "") => {
  if (!mobile) {
    console.log(`      ⚠️ Skipping ${name}: No mobile number found.`);
    return;
  }
  
  // --- 1. CLEAN & FORMAT NUMBER (The "91" Fix) ---
  // Remove spaces, dashes, parentheses, or + signs
  let formattedNumber = mobile.replace(/\D/g, '');

  // If number is 10 digits (e.g. 98220...), add 91
  if (formattedNumber.length === 10) {
    formattedNumber = '91' + formattedNumber;
  }
  // If it's already 12 digits (e.g. 9198220...), keep it. 
  // If it's something else, we try sending it as-is but warn the user.
  else if (formattedNumber.length !== 12) {
    console.warn(`      ⚠️ Warning: Number ${formattedNumber} length seems odd (${formattedNumber.length} digits). Trying anyway...`);
  }

  // Customize Message for Vehicle
  let finalDocName = docName;
  if (vehicleInfo) finalDocName = `${docName} (${vehicleInfo})`;

  console.log(`   🚀 Sending to ${name} (${formattedNumber}): "${finalDocName}" (Due: ${daysLeft} days)`);

  try {
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedNumber,
          type: "template",
          template: {
            name: TEMPLATE_NAME,
            language: { code: "en" }, // Changed to 'en' per your fix
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

    if (response.ok) console.log(`      ✅ WhatsApp Sent!`);
    else {
      const err = await response.json();
      console.log(`      ❌ WhatsApp Failed: ${err.error?.message}`);
    }
  } catch (e) { console.error(`      ❌ Network Error`, e); }
};

const run = async () => {
  console.log(`🚀 Script Started | Mode: ${FORCE_SEND_ALL ? '🔥 TEST (Send All)' : '🛡️ STRICT (7/1/0 Days)'}`);

  const { data: documents, error } = await supabase
    .from('documents')
    .select('*, document_types(doc_type_name)')
    .not('exp_date', 'is', null);

  if (error) return console.error("❌ DB Error:", error.message);
  console.log(`🔍 Found ${documents.length} total documents.`);

  for (const doc of documents) {
    const daysLeft = getDaysDifference(doc.exp_date);
    const isCritical = (daysLeft === 7 || daysLeft === 1 || daysLeft === 0);

    if (!FORCE_SEND_ALL && !isCritical) continue; 

    // Find Owner Logic
    let owner = null;
    let vehicleStr = "";

    if (doc.entity_type === 'person') {
      const { data: p } = await supabase.from('persons').select('*').eq('p_id', doc.entity_id).single();
      owner = p;
    } 
    else if (doc.entity_type === 'vehicle') {
      const { data: v } = await supabase.from('vehicles').select('*, persons(*)').eq('v_id', doc.entity_id).single();
      if (v && v.persons) {
        owner = v.persons;
        vehicleStr = v.v_number;
      }
    }

    if (owner) {
      await sendMessage(
        owner.p_mobile, // Pass the DB number directly
        owner.p_name,
        doc.document_types?.doc_type_name || "Document",
        daysLeft,
        vehicleStr
      );
    } else {
      console.log(`   ⚠️ Skipped Doc ID ${doc.doc_id}: Owner not found.`);
    }
  }
  console.log("🏁 Script Finished.");
};

run();