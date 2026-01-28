# Rudra Driving School - Management System

A Next.js dashboard for tracking students, vehicles, and document expiries with automated WhatsApp notifications.

## Tech Stack
- **Frontend:** Next.js 15, Tailwind CSS, Shadcn UI
- **Backend:** Supabase (PostgreSQL)
- **Notifications:** Meta WhatsApp Business API

## Setup
1. Run `npm install`
2. Configure `.env.local` with Supabase and Meta credentials.
3. Run `npm run dev`

## Cron Job (Notifications)
To send notifications daily, the script `scripts/send-notifications.js` must be scheduled (e.g., using GitHub Actions or a CRON job).