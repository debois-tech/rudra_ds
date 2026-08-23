# Rudra DS — Outstanding Fixes & Findings

Source: audit of `implementation_plan.md`, `steps.md`, `update_plan_MotoAdmin.md` against actual codebase state (2026-08-23). Those three files are now deleted — superseded by this one.

Classification:
- **Claude-fixable** — pure code change, no external access needed.
- **Needs human input first** — requires a decision or external data (Supabase dashboard, secrets, product call) before Claude can implement.
- **Human-side only** — outside the codebase entirely (dashboards, secrets, accounts, prioritization).

---

## Claude-fixable

- [ ] Dedupe `Profile` type — defined separately in `lib/auth.ts` and `lib/types.ts`, diverging imports. Keep one canonical version in `types.ts`, re-export from `auth.ts`.
- [ ] Mutation double-click guard missing on `app/(app)/driving-school/instructors/page.tsx` — `toggleActive()` / `handleDelete()` buttons have no `disabled` state during the async call (logs page already does this correctly, instructors doesn't).
- [ ] `components/landing-page.tsx` is a 35KB single-file component — split into lazy-loaded sections to help FCP/LCP on the public landing page.
- [ ] `proxy.ts` does not check role — only checks that a plausible `sb-*-auth-token` cookie exists, so a `user`-role account can reach `/admin`'s RSC payload before the client-side check redirects them. Decode the JWT role claim (without verifying signature) in the proxy to gate `/admin` earlier.
- [ ] Mark Attendance — `app/(app)/driving-school/attendance/_components/mark-attendance-sheet.tsx` is dead code (not imported anywhere). The attendance page was redesigned (keyboard-nav toggle list) and now calls `attendanceApi.mark()` without `instructor_id`, so the PRD's auto-resolve-vehicle-from-instructor behavior never fires (`vehicle_id`/`driving_log_id` always end up null). Needs a product decision first — see below — then Claude implements either path.
- [ ] Write `scripts/send-notifications.js` — referenced by `.github/workflows/daily-notifications.yml` but never committed, so the daily cron fails every run. Spec available in `atrifacts and guides/architecture_overview.md` (§4 Background Automations) and the workflow's env vars.

## Needs human input first

- [ ] `get_dashboard_stats` and `get_ds_dashboard_stats` Postgres RPC functions are called from `lib/api.ts:363` and `lib/ds-api.ts:505` but do not exist in any tracked `supabase/*.sql` file — they were hand-applied directly in Supabase and never saved to the repo. **Need:** paste the live function source from Supabase Dashboard → Database → Functions, then Claude commits it into a new `supabase/*.sql` file so a fresh DB setup doesn't silently break both dashboards.
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

- [ ] **Mass assignment in `PATCH /api/admin/organizations`** ([route.ts:60-65](app/api/admin/organizations/route.ts#L60-L65)) — `const { id, ...updates } = body` spreads the *entire* request body straight into `.update(updates)` with no field allow-list. Any extra key in the JSON body gets written to the `organizations` row. Gated behind `requireSuperAdmin`, so not an auth bypass, but still bad practice — one typo'd payload can corrupt columns it wasn't meant to touch. Fix: explicitly allow-list `{ name, slug, phone, email, address, is_active }`.
- [ ] **No input validation on `POST /api/admin/users`** ([route.ts:38-48](app/api/admin/users/route.ts#L38-L48)) — `body.role` is stored as-is (`role: body.role || 'user'`) with no check against the `user_role` enum (`super_admin`/`user`), and `email`/`password` aren't validated before being sent to `supabase.auth.admin.createUser()`. Also gated behind super-admin, but a malformed/garbage `role` value silently corrupts `user_metadata`. Fix: validate `role` against the enum and `email`/`password` shape before calling the admin API.
- [ ] **Public `demo_requests` insert has no field limits** — `supabase/demo_requests.sql` policy is `WITH CHECK (true)` for anon inserts, and `full_name`/`school_name` are unbounded `TEXT` (only `phone` is capped at `VARCHAR(15)`). Since the landing page writes directly from the browser with the public anon key ([landing-page.tsx:140](components/landing-page.tsx#L140)), nothing stops a scripted flood of inserts with huge payloads. Cheap partial fix Claude can do now: add `CHECK (length(full_name) < 200)` / `CHECK (length(school_name) < 200)` constraints. Real rate-limiting needs the human-side item below.

### Needs human input first

- [ ] **`demo_requests` has no rate limiting or bot protection** — beyond the field-length constraints above, there's nothing stopping automated spam (no CAPTCHA, no honeypot, no per-IP throttle). Real fix is either (a) route the insert through a Next.js API route with rate limiting — Claude can build this, or (b) add hCaptcha/Cloudflare Turnstile — **needs you to create the account/site key first**, then Claude wires it in.

### Verified — no action needed

- `supabase/views.sql` and `supabase/ds_views.sql` — every view correctly declares `WITH (security_invoker = true)`, so the cross-tenant leak fixed in the recent commit (`1c2aa0f`) is holding across both the general and driving-school view sets. Confirmed by direct read, not just trusting the commit message.
- No `dangerouslySetInnerHTML` usage renders user input — the only two occurrences (`app/layout.tsx`, `components/landing-page.tsx`) are static JSON-LD SEO blocks built from hardcoded objects, not user data.
- No hardcoded secrets, `eval()`, or `child_process`/`exec()` calls found in `app/` or `lib/`.
