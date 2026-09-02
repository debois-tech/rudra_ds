# Rudra DS — Outstanding Fixes & Findings

Source: audit of `implementation_plan.md`, `steps.md`, `update_plan_MotoAdmin.md` against actual codebase state (2026-08-23). Those three files are now deleted — superseded by this one.

Classification:
- **Claude-fixable** — pure code change, no external access needed.
- **Needs human input first** — requires a decision or external data (Supabase dashboard, secrets, product call) before Claude can implement.
- **Human-side only** — outside the codebase entirely (dashboards, secrets, accounts, prioritization).

---

## Removed — confirmed done (2026-09-02)

- [x] Dedupe `Profile` type — `lib/auth.ts:3` imports from `lib/types.ts`.
- [x] Mutation double-click guard on instructors page — `pendingId` guard at line 26, guards in `toggleActive()`/`handleDelete()`.
- [x] Mass assignment in `PATCH /api/admin/organizations` — explicit allow-list destructure at line 61.
- [x] Input validation on `POST /api/admin/users` — email regex, ≥8 password, role enum check at lines 40-48.
- [x] `demo_requests` CHECK constraints — `full_name` and `school_name` length checks present in `supabase/schema.sql:225,227`.
- [x] Services 404 fix — all 6 link targets now point to `/dashboard/services/new`.
- [x] `proxy.ts` role check — investigated, correctly left as cookie-existence check only; full auth boundary enforced server-side by `requireSuperAdmin()` and RLS.
- [x] Views security — all views declare `WITH (security_invoker = true)`.
- [x] No `dangerouslySetInnerHTML` on user input — only static JSON-LD blocks.
- [x] No hardcoded secrets, `eval()`, or `exec()` in `app/` or `lib/`.
- [x] `demo_requests` table — confirmed exists in production.
- [x] 5 unused `ds_driving_logs` columns — confirmed don't exist in production.
- [x] Mark Attendance dead code — deleted `mark-attendance-sheet.tsx` and `_components/` dir. Live toggle flow in `attendance/page.tsx` is correct.

---

## Claude-fixable

- [ ] `components/landing-page.tsx` is a 777-line single-file component — split into lazy-loaded sections to help FCP/LCP on the public landing page. Deferred, sizable mechanical refactor.

## Human-side only

- [ ] Product prioritization on old "Future Backlog" — none started, needs decision on what's wanted.

## Backlog

- [ ] `scripts/send-notifications.js` — WhatsApp document-expiry reminders. No `app_settings` for threshold, no `notification_logs` for dedup. Needs trigger-rule decision. **Blocked on:** Meta WhatsApp Business API account + message templates approved, GitHub Actions repo secrets (`WHATSAPP_TOKEN`, `SUPABASE_KEY`/URL).
- [ ] `demo_requests` rate limiting / bot protection — no CAPTCHA, honeypot, or per-IP throttle. Options: (a) Next.js API route with in-memory or Redis rate limiting, (b) hCaptcha/Turnstile. Blocked on account/key creation.
- [ ] `app/(app)/dashboard/icon.png` is 2.1MB favicon — compression deferred.
