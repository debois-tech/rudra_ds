// Cron-triggered edge function: sends WhatsApp expiry reminders at each
// threshold in REMINDER_DAYS (default 3 days out + 1 day out). Dedup via
// notification_log so each (service, expiry cycle, threshold) only fires once.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const REMINDER_DAYS = (Deno.env.get("WHATSAPP_REMINDER_DAYS") ?? "3,1")
  .split(",")
  .map((n) => Number(n.trim()))
  .filter((n) => Number.isFinite(n))

const COUNTRY_CODE = Deno.env.get("WHATSAPP_COUNTRY_CODE") ?? "91"
const TEMPLATE_NAME = Deno.env.get("WHATSAPP_TEMPLATE_NAME") ?? "expiry_reminder_test"
const TEMPLATE_LANG = Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "en"

const WHATSAPP_TOKEN = Deno.env.get("META_WHATSAPP_TOKEN")!
const WHATSAPP_PHONE_ID = Deno.env.get("META_WHATSAPP_PHONE_ID")!

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

function dateFrom(daysAhead: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toISOString().split("T")[0]
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(dateStr))
}

async function sendWhatsApp(toMobile: string, serviceName: string, expiryDate: string) {
  const res = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: `${COUNTRY_CODE}${toMobile}`,
      type: "template",
      template: {
        name: TEMPLATE_NAME,
        language: { code: TEMPLATE_LANG },
        components: [{
          type: "body",
          parameters: [
            { type: "text", text: serviceName },
            { type: "text", text: formatDate(expiryDate) },
          ],
        }],
      },
    }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(body))
  return body
}

async function processThreshold(daysBefore: number) {
  const expiry = dateFrom(daysBefore)
  const result = { threshold: daysBefore, checked: 0, sent: 0, skipped: 0, failed: 0 }

  const { data: services, error: svcErr } = await supabase
    .from("v_services_overview")
    .select("s_id, customer_id, service_name, expiry_date, org_id")
    .eq("status", "active")
    .eq("expiry_date", expiry)
  if (svcErr) throw svcErr
  if (!services?.length) return result
  result.checked = services.length

  const { data: sentLog } = await supabase
    .from("notification_log")
    .select("service_id")
    .eq("expiry_date", expiry)
    .eq("days_before", daysBefore)
    .eq("channel", "whatsapp")
    .in("service_id", services.map((s) => s.s_id))
  const alreadySent = new Set((sentLog ?? []).map((r) => r.service_id))

  const pending = services.filter((s) => !alreadySent.has(s.s_id))
  result.skipped = services.length - pending.length
  if (!pending.length) return result

  const { data: customers } = await supabase
    .from("customers")
    .select("c_id, c_whatsapp, c_mobile")
    .in("c_id", pending.map((s) => s.customer_id))
  const mobileByCustomer = new Map((customers ?? []).map((c) => [c.c_id, c.c_whatsapp || c.c_mobile]))

  for (const svc of pending) {
    const mobile = mobileByCustomer.get(svc.customer_id)
    if (!mobile) continue

    try {
      await sendWhatsApp(mobile, svc.service_name, svc.expiry_date)
    } catch (e) {
      result.failed++
      console.error(`send failed for service ${svc.s_id} (${daysBefore}d):`, e)
      continue
    }

    result.sent++
    const { error: logErr } = await supabase.from("notification_log").insert({
      service_id: svc.s_id,
      org_id: svc.org_id,
      expiry_date: svc.expiry_date,
      days_before: daysBefore,
      channel: "whatsapp",
    })
    if (logErr) console.error(`log insert failed for service ${svc.s_id} (${daysBefore}d, message still sent):`, logErr)
  }

  return result
}

Deno.serve(async () => {
  try {
    const results = []
    for (const daysBefore of REMINDER_DAYS) {
      results.push(await processThreshold(daysBefore))
    }
    return Response.json({ results })
  } catch (e) {
    console.error(e)
    return Response.json({ error: String(e) }, { status: 500 })
  }
})
