// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const WHATSAPP_TOKEN = process.env.META_WHATSAPP_TOKEN;
const PHONE_ID = process.env.META_WHATSAPP_PHONE_ID;

if (!SUPABASE_URL || !SUPABASE_KEY || !WHATSAPP_TOKEN) {
  console.error("❌ Missing configuration. Check .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to send WhatsApp message
async function sendWhatsApp(to, studentName, docType, daysLeft) {
  const url = `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`;
  
  const body = {
    messaging_product: "whatsapp",
    to: "91" + to,
    type: "template",
    template: {
      name: "expiry_alert", // <--- matches the name we just created
      language: { code: "en_US" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: studentName }, // Replaces {{1}}
            { type: "text", text: docType },     // Replaces {{2}}
            { type: "text", text: String(daysLeft) } // Replaces {{3}}
          ]
        }
      ]
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    return await response.json();
  } catch (error) {
    console.error("WhatsApp API Error:", error);
    return null;
  }
}

async function checkAndNotify() {
  console.log("🔍 Checking for expiring documents...");

  const { data: docs, error } = await supabase
    .from('v_documents_full')
    .select('*')
    .eq('status', 'active');

  if (error) {
    console.error("DB Error:", error.message);
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let sentCount = 0;

  for (const doc of docs) {
    const expDate = new Date(doc.exp_date);
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Check for 30, 7, 1, or 0 days
    if ([30, 7, 1, 0].includes(diffDays)) {
      console.log(`⚠️ Alert: ${doc.doc_type_name} expires in ${diffDays} days.`);
      
      // Get the correct name (Person or Vehicle Owner)
      // Note: In our View, 'person_name' might be null if it's a vehicle doc, 
      // so we should handle that. For now, we assume person_name exists.
      const name = doc.person_name || "Student"; 
      const mobile = doc.person_mobile; 
      
      if (mobile) {
        console.log(`   -> Sending Custom Alert to ${name} (${mobile})...`);
        
        // PASS THE DATA HERE
        const result = await sendWhatsApp(mobile, name, doc.doc_type_name, diffDays);
        
        if (result && result.messages) {
          console.log("   ✅ Dynamic Message Sent!");
          sentCount++;
          
          await supabase.from('notifications_log').insert({
            doc_id: doc.doc_id,
            notification_type: 'whatsapp',
            status: 'sent',
            days_before: diffDays,
            message_content: `Template: expiry_alert | Data: ${name}, ${diffDays} days`
          });
        } else {
          console.log("   ❌ Failed:", JSON.stringify(result));
        }
      } else {
        console.log("   ❌ No mobile number linked.");
      }
    }
  }

  console.log(`\n🎉 Job Complete. Sent ${sentCount} notifications.`);
}

checkAndNotify();