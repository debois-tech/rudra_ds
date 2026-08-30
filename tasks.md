# Rudra DS — Company Deployment Plan

Decided approach: **one repo, two deployments.** GitHub repo ownership transfers to the company account (not a duplicate repo). Same `main` branch deploys to two separate Vercel projects with two separate Supabase projects behind them:

- **Current Vercel deployment** (unchanged) → keeps pointing at the **current Supabase project** (the one with existing test/trial data) → this becomes the trial/demo instance for prospective driving schools.
- **New company Vercel project** → points at a **new company Supabase project** → this becomes production.

No code duplication, no sync problem — a push to `main` deploys to both automatically. The two deployments differ only in their env vars (which Supabase project each points to) and, if wanted later, custom domain.

Classification (same convention as `fixes.md`):
- **Claude-fixable** — I can do this directly once you give the go-ahead.
- **Needs your input first** — a decision or credential only you can provide, then I continue.
- **Human-side only** — account/dashboard actions outside anything I can touch (GitHub org admin, Vercel/Supabase dashboards).

---

## How to check `supabase/schema.sql` is up to date with the live DB

Repeat whenever unsure. Run these 7 queries in the Supabase SQL Editor of whichever project you're checking, save each result, hand them back to me to diff against `supabase/schema.sql`:

```sql
-- 1. All function definitions
select p.proname as function_name,
       pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;
```
```sql
-- 2. Full table/column schema
select table_name, column_name, data_type, is_nullable, column_default,
       character_maximum_length
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;
```
```sql
-- 3. All view definitions
select viewname, definition
from pg_views
where schemaname = 'public'
order by viewname;
```
```sql
-- 4. All RLS policies
select tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```
```sql
-- 5. All triggers
select event_object_table, trigger_name, action_timing, event_manipulation, action_statement
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table;
```
```sql
-- 6. All indexes
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
order by tablename;
```
```sql
-- 7. All constraints (PK/FK/UNIQUE/CHECK)
select conname, conrelid::regclass as table_name, pg_get_constraintdef(oid) as definition
from pg_constraint
where connamespace = 'public'::regnamespace
order by conrelid::regclass::text;
```

**Known state as of the last check (2026-08-23)** — re-verify, don't assume it still holds after the gap in work:
- `demo_requests` table was missing from production entirely (tracked in `schema.sql` but never applied live).
- `ds_driving_logs.student_1_id` through `student_5_id` — 5 unused columns existed live, not in `schema.sql`, not referenced anywhere in app code.
- Everything else matched exactly.

---

## Phase 0 — Re-verify the source of truth ✅ done

- [x] Re-ran all 7 queries against the current production Supabase project (results in `test_md/1-7.md`, now deleted). **Zero drift** — every function, table/column, view, RLS policy, trigger, index, and constraint matches `supabase/schema.sql` exactly, identical to the last check.
- [x] Two known gaps confirmed still open, unchanged: `demo_requests` table still missing from production; `ds_driving_logs.student_1_id..student_5_id` (+ 5 FKs) still present, still unused in app code. Neither blocks Phase 3 — `schema.sql` itself is correct and safe to apply fresh to the new company project (it already omits the stray student columns and includes `demo_requests`).

## Phase 1 — Repo housekeeping ✅ done (pnpm chosen)

- [x] Standardized on pnpm. `package-lock.json` deleted; `pnpm-lock.yaml` was actually stale relative to `package.json` (missing `@radix-ui/react-switch`, still listed two removed deps) — regenerated via a clean `pnpm install` after removing `node_modules`. Added `"packageManager": "pnpm@10.28.1"` to `package.json` for tooling clarity (Vercel/Corepack auto-detect off this field).
- [x] `pnpm run build` passes clean.
- [x] `pnpm run lint` runs — surfaced a real finding, not a regression: total went from 46 problems (10 errors) to 53 (17 errors) under pnpm. Confirmed this isn't a version change (both the old npm lockfile and new pnpm-lock.yaml pin `eslint-plugin-react-hooks` to the same `7.1.1`) — npm's flat `node_modules` was silently under-resolving that plugin for some files; pnpm's stricter resolution fixed that and now correctly lints files npm was skipping. The 7 newly-surfaced errors are pre-existing (same `setState`-in-`useEffect` pattern already flagged elsewhere in the codebase, plus a couple of unescaped-quote JSX issues) — not caused by anything from this session's edits, not blocking the migration. Left as-is pending a decision on whether to fix now or separately.

## Phase 2 — Transfer repo ownership to the company account ✅ done

- [x] Repo transferred: `github.com/omkar-kokane/rudra_ds` → `github.com/debois-tech/rudra_ds`. Local `origin` remote updated to match, confirmed via `git remote -v`.
- [x] Collaborator access: confirmed you have owner access on the company account, and no one else has a local clone of this repo — nothing further needed here.
- [ ] **Needs your input / verify**: check the current Vercel project's Git integration still shows the repo as connected (Project Settings → Git) — the GitHub App connection can need re-authorization after an ownership change. If it shows disconnected or asks to re-approve, that's a few clicks, not a rebuild.

## Phase 3 — New company Supabase project

- [ ] **Human-side only**: create the new Supabase project under the company account.
- [ ] **Human-side only**: run the Phase-0-verified `supabase/schema.sql` in the new project's SQL Editor. Do **not** run `seed.sql` here — it's sample/demo data, has no place in the production database.
- [ ] **Needs your input**: grab the new project's URL, anon key, and service role key from Settings → API — needed for Phase 4.

## Phase 4 — New company Vercel project

- [ ] **Human-side only**: create a new Vercel project under the company account, import the (now company-owned) GitHub repo, same `main` branch.
- [ ] **Human-side only**: set env vars on this project to the Phase 3 Supabase credentials — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Paste these directly into Vercel's dashboard, not into chat.
- [ ] **Needs your input**: domain for this deployment — a Vercel-provided `*.vercel.app` URL to start, or a custom domain from day one?

## Phase 5 — First admin user on the new project

- [ ] **Human-side only**: bootstrap the first super_admin on the *new* company Supabase project — same steps as `README.md` already documents: Supabase Dashboard → Authentication → Users → Add User, then `UPDATE profiles SET role = 'super_admin', org_id = NULL WHERE email = '...'` against the new project. (The current/trial Supabase project already has its own admin — untouched.)

## Phase 6 — Verify both deployments independently

- [ ] **Claude-fixable**: walk through a smoke test on the new company deployment with you — login, create a test org via `/admin`, create a customer/service, create an instructor/student in the driving-school module, confirm RLS isolation holds (same multi-tenancy check already validated once).
- [ ] **Claude-fixable**: confirm the existing/trial deployment still builds and runs correctly post-transfer — nothing about its code or DB changed, but worth confirming the Vercel↔GitHub link survived Phase 2 cleanly.

## Phase 7 — Documentation

- [ ] **Claude-fixable**: `CLAUDE.md` is gitignored, so it's local-only regardless of repo ownership — no action needed there from the transfer itself.
- [ ] **Needs your input**: does `README.md` need a line noting two live deployments exist off this one repo (trial vs. production, distinguished only by which Supabase project the env vars point to)? Small addition, worth having so it's not a surprise to the next person who opens the repo.

---

## Deferred / not blocking this migration

- `scripts/send-notifications.js` (WhatsApp reminders) — still doesn't exist per `fixes.md`; the workflow no-ops on the current repo already. Not part of this migration either way — fix it once, on the shared repo, and both deployments get it for free once it exists (that's the whole point of the single-repo approach).
- `demo_requests` table + `student_1-5` column cleanup on the *current* Supabase project — separate from this migration, still pending from `fixes.md`, only affects the trial instance.

## What I need from you to start

1. Run the 7 SQL queries (Phase 0) against the current live DB.
2. Pick a package manager (Phase 1).
3. Say when you're ready to actually kick off the GitHub transfer (Phase 2) — that one's irreversible-ish in the sense that it changes the repo's URL/owner immediately, so I'll wait for an explicit go before treating it as done and moving to Phase 3+.
