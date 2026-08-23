# Rudra DS — Outstanding Fixes & Findings

Source: audit of `implementation_plan.md`, `steps.md`, `update_plan_MotoAdmin.md` against actual codebase state (2026-08-23). Those three files are now deleted — superseded by this one.

Classification:
- **Claude-fixable** — pure code change, no external access needed.
- **Needs human input first** — requires a decision or external data (Supabase dashboard, secrets, product call) before Claude can implement.
- **Human-side only** — outside the codebase entirely (dashboards, secrets, accounts, prioritization).

---

## Claude-fixable

- [x] Dedupe `Profile` type — `lib/auth.ts` now imports and re-exports it from `lib/types.ts` instead of redefining it.
- [x] Mutation double-click guard on `app/(app)/driving-school/instructors/page.tsx` — added a `pendingId` guard; `toggleActive()`/`handleDelete()` now bail out if another mutation is in flight, and both menu buttons disable while their instructor is pending.
- [ ] `components/landing-page.tsx` is a 35KB single-file component — split into lazy-loaded sections to help FCP/LCP on the public landing page. Not yet done — deferred, sizable mechanical refactor, lower urgency than the correctness/security fixes above.
- [x]/[ ] `proxy.ts` role check — **investigated, not safely automatable.** Supabase's `sb-*-auth-token` cookie holds the whole session object, `base64url`-encoded (optionally `base64-`-prefixed) and potentially chunked across `.0`/`.1`/... cookies for large sessions (confirmed by reading `node_modules/@supabase/ssr/dist/main/cookies.js`). Reliably decoding that at the edge to pull a role claim risks false-redirecting a real super_admin out of `/admin` if the parsing is even slightly wrong, and I can't test against your actual live cookie shape from here. The underlying security boundary is already sound — `app/admin/layout.tsx` and `requireSuperAdmin()` both do full DB-verified checks — the only gap is a `user`-role account's browser fetching the `/admin` RSC payload before the redirect fires, which is a minor perf/UX nit, not a data-exposure risk. Leaving proxy.ts untouched; flagging as needs-a-real-session-to-test rather than shipping a blind guess.
- [ ] Mark Attendance dead code — still blocked on your decision (see below), untouched.
- [ ] Write `scripts/send-notifications.js` — **bigger than "write the missing file", see new finding below.** Do not implement yet.

## Needs human input first

- [x] ~~`get_dashboard_stats` / `get_ds_dashboard_stats` missing from tracked SQL~~ — **resolved 2026-08-23.** You ran the schema cross-ref queries (`sql_queries/`), confirmed both functions are live in production, and their exact definitions are now committed in `supabase/schema.sql`.
- [ ] `app/(app)/dashboard/icon.png` is 2.1MB, served as a favicon/app icon. **Need:** confirm target size and how you want it compressed (no image tool is preinstalled in this environment — may need an external compressor or you supply a pre-resized file).
- [ ] Mark Attendance dead code (above) — **decide:** delete `mark-attendance-sheet.tsx` and accept the simplified no-instructor flow, or restore instructor selection in the new attendance UI to bring back auto-resolved vehicle/log linkage.

## Human-side only

- [ ] GitHub Actions repo secrets (`WHATSAPP_TOKEN`, `SUPABASE_KEY`/URL) must exist for `daily-notifications.yml` to work, even after the script is written.
- [ ] Meta WhatsApp Business API account + message templates need to actually exist and be approved.
- [ ] Supabase Dashboard access to retrieve the two missing RPC function definitions (see above).
- [ ] Product prioritization on `steps.md`'s old "Future Backlog" (public marketing pages, dashboard vehicles/documents/settings pages, admin demo-request review UI, user active/inactive toggle, org inline edit, `.env.example`, `hooks/` dir, vitest setup) — none of this is started; needs a decision on what's actually wanted before any of it becomes a Claude task.

---

## Additional findings — security/vulnerability sweep

### Claude-fixable

- [x] **Mass assignment in `PATCH /api/admin/organizations`** — now destructures an explicit allow-list (`name, slug, phone, email, address, is_active`) instead of spreading the raw body into `.update()`.
- [x] **No input validation on `POST /api/admin/users`** — now validates `email` format, `password` length (≥8), and `role` against the `super_admin`/`user` enum before calling `supabase.auth.admin.createUser()`, returning `400` on failure.
- [x] **Public `demo_requests` insert has no field limits** — the new `supabase/schema.sql` adds `CHECK (length(full_name) < 200)` / `CHECK (length(school_name) < 200)` on the table definition. Still needs to be applied to production — see the live-DB cross-reference section below (the table doesn't exist there yet at all).

### Needs human input first

- [ ] **`demo_requests` has no rate limiting or bot protection** — beyond the field-length constraints above, there's nothing stopping automated spam (no CAPTCHA, no honeypot, no per-IP throttle). Real fix is either (a) route the insert through a Next.js API route with rate limiting — Claude can build this, or (b) add hCaptcha/Cloudflare Turnstile — **needs you to create the account/site key first**, then Claude wires it in.

### Verified — no action needed

- `supabase/views.sql` and `supabase/ds_views.sql` (now merged into `supabase/schema.sql`) — every view correctly declares `WITH (security_invoker = true)`, so the cross-tenant leak fixed in the recent commit (`1c2aa0f`) is holding across both the general and driving-school view sets. Confirmed by direct read, not just trusting the commit message.
- No `dangerouslySetInnerHTML` usage renders user input — the only two occurrences (`app/layout.tsx`, `components/landing-page.tsx`) are static JSON-LD SEO blocks built from hardcoded objects, not user data.
- No hardcoded secrets, `eval()`, or `child_process`/`exec()` calls found in `app/` or `lib/`.

---

## Live-DB vs. tracked-SQL cross-reference (2026-08-23)

You ran the 7 introspection queries against the production Supabase project (`sql_queries/`). Cross-referenced every table, column, function, view, RLS policy, index, and constraint against what was tracked in `supabase/*.sql`. Result folded into the new consolidated `supabase/schema.sql`; findings below.

### Needs human input first (mutates production DB)

- [ ] **`demo_requests` table doesn't exist in production**, even though `demo_requests.sql` was tracked in the repo and the landing page's "Book a Demo" form ([landing-page.tsx:140](components/landing-page.tsx#L140)) inserts into it on every submission. Confirmed absent from all three live introspection queries (columns, RLS policies, constraints) — not a paste-truncation artifact, it's genuinely missing. **Every demo request submitted through the live site right now silently fails** (caught by a try/catch, shown as a generic "Something went wrong" toast). This adds required functionality (it's literally the site's lead-capture form), so: **need you to run the `demo_requests` section of the new `supabase/schema.sql` (table + 2 RLS policies, plus the `CHECK` length constraints we added) against production.**
- [ ] **5 unused columns on `ds_driving_logs` in production, not in any tracked file, not referenced anywhere in app code**: `student_1_id` through `student_5_id`, each with its own FK to `ds_students`. Grepped the entire codebase — zero references. This is dead schema from an abandoned feature (looks like an early "log covers multiple students" idea that was replaced by the separate `ds_attendance` table). **Flagged useless — recommend dropping.** SQL to run in production:
  ```sql
  ALTER TABLE public.ds_driving_logs
    DROP COLUMN student_1_id,
    DROP COLUMN student_2_id,
    DROP COLUMN student_3_id,
    DROP COLUMN student_4_id,
    DROP COLUMN student_5_id;
  ```
  (Drops the 5 FK constraints automatically along with the columns.) Deliberately left out of the new `schema.sql` either way — a fresh DB shouldn't get these back.

### Verified — no action needed

- All other tables (`organizations`, `profiles`, `customers`, `vehicles`, `service_types`, `services`, `ds_instructors`, `ds_fleet_vehicles`, `ds_students`, `ds_fee_payments`, `ds_attendance`), every RLS policy, every trigger, and every index in production match the tracked SQL files exactly — no other drift found.
- Removed `supabase/.schema.sql.swp`, a vim swap file that had been accidentally committed — pure junk, no functional connection to anything.

---

## Fixed 2026-08-23 — `/dashboard/services` 404s (reported via tunneled traffic logs)

Root cause: `app/(app)/dashboard/services/page.tsx` doesn't exist — only `services/new/page.tsx` and `services/overview/page.tsx` do — but **6 links across the app pointed at the bare `/dashboard/services` path** (some with `?customer=<id>` appended), expecting it to be the "create service" form. `services/new/page.tsx` already reads and pre-fills a `customer` search param, confirming that was always the intended target. Fixed all 6:

- `customers/page.tsx` (row action button), `customers/[id]/page.tsx` ×2 ("Give Service", "Add Record") → now `/dashboard/services/new?customer=${id}`
- `dashboard/overview/page.tsx` (quick-add "Service" button), `services/overview/page.tsx` ×2 ("New Service", "Create First Service") → now `/dashboard/services/new`

## New finding — `scripts/send-notifications.js` spec is stale, not just missing

Went to write the missing notification script per `atrifacts and guides/architecture_overview.md` §4, and found that doc's data model doesn't match the actual database: it describes `document_types`, `documents`, `notification_logs`, and `app_settings` tables — **none of which exist** in `supabase/schema.sql` or production (confirmed against the live cross-reference above). The real expiry data lives on `services.expiry_date` directly (already queried by `dashboardApi.getExpiringDocuments()` in `lib/api.ts`).

This means writing the script isn't just filling in a missing file — there's no `app_settings` table for a per-org configurable reminder threshold, and no `notification_logs` table to dedupe sends (without one, a script that checks "expiry within N days" naively would re-send the same WhatsApp reminder to the same customer every day it's within the window, not just once). A workable version can dodge the dedup problem by triggering only on an *exact*-day match (`expiry_date - today = N`) rather than a range, so each document fires exactly once — but that's a product decision (what N, exact-match vs. range-with-log) with a real consequence: this script sends actual WhatsApp messages to actual customers. **Not implementing this blind — needs a decision on the trigger rule before I write it.**
