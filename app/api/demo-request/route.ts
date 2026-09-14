import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

// Bots fill hidden fields and submit instantly — real users take at least a
// few seconds to type three fields. Both checks are silent: a bot that trips
// them still gets a 200 "ok" response so it doesn't learn to adapt.
const MIN_FILL_MS = 3000;

export async function POST(req: Request) {
  const body = await req.json();
  const { full_name, phone, school_name, hp, t } = body;

  const tooFast = typeof t !== 'number' || Date.now() - t < MIN_FILL_MS;
  if (hp || tooFast) {
    return NextResponse.json({ ok: true });
  }

  if (!full_name?.trim() || !phone?.trim() || !school_name?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('demo_requests').insert({
    full_name: full_name.trim().slice(0, 199),
    phone: phone.trim().slice(0, 15),
    school_name: school_name.trim().slice(0, 199),
  });
  if (error) {
    console.error('demo_requests insert failed:', error);
    return NextResponse.json({ error: 'Could not save request' }, { status: 500 });
  }

  // Email notification disabled until a Resend API key is available —
  // see notifyDemoRequest() below. Re-enable by uncommenting this call.
  // notifyDemoRequest(full_name.trim(), phone.trim(), school_name.trim()).catch((e) =>
  //   console.error('demo request notification failed:', e)
  // );

  return NextResponse.json({ ok: true });
}

// async function notifyDemoRequest(fullName: string, phone: string, schoolName: string) {
//   const apiKey = process.env.RESEND_API_KEY;
//   const to = process.env.DEMO_NOTIFY_EMAIL;
//   if (!apiKey || !to) return;
//
//   await fetch('https://api.resend.com/emails', {
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${apiKey}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       from: 'MotoAdmin <onboarding@resend.dev>',
//       to,
//       subject: `New demo request — ${schoolName}`,
//       text: `${fullName}\n${phone}\n${schoolName}`,
//     }),
//   });
// }
