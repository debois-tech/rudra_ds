# Changes & Fixes Summary

## 1. Environment
- Fixed `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` — had a `your-` prefix that made the JWT invalid. This caused all admin API routes to fail with "Failed to fetch organizations".

## 2. Hydration Fix
- Added `suppressHydrationWarning` to `<body>` tag in `app/layout.tsx` — browser extensions (Grammarly) inject `data-new-gr-c-s-check-loaded` and `data-gr-ext-installed` attributes client-side, causing React hydration mismatch errors.

## 3. Middleware → Proxy Migration
- Renamed `middleware.ts` → `proxy.ts` and renamed the exported function from `middleware` to `proxy` (Next.js 16 deprecation). Used the official codemod: `npx @next/codemod@canary middleware-to-proxy .`

## 4. Routing Performance
- **Problem:** `proxy.ts` called `supabase.auth.getUser()` (HTTP API call to Supabase, 200-500ms) + queried the `profiles` DB table on **every single page navigation and API request**.
- **Fix:** Replaced `getUser()` with `getSession()` (reads session cookie locally — zero network calls). Removed the profile DB query from the proxy. Deferred JWT verification to the server layout.

## 5. Super Admin UI
- Made the profile section in the admin sidebar clickable — opens a dropdown with the user's name/email and a "Sign out" button. Previously it was static text with a separate Sign Out button below it.

## 6. Dashboard Logo
- Reduced logo size on desktop: `h-10 w-[180px] scale-[1.8]` → `h-9 w-[150px] scale-[1.5]`
- Reduced on mobile: `h-10 w-[120px] scale-[1.4]` → `h-9 w-[110px] scale-[1.3]`
- Removed the organization name badge from the navbar (was overlapping with nav links). Moved it to the dashboard page above the greeting message via React context (`DashboardOrgContext`).

## 7. Phase 1 — Route Restructure (Driving School Module Prep)

### 7a. Route Group
- Created `app/(app)/` route group that wraps both modules under a shared parent layout.
- Moved all files from `app/dashboard/` → `app/(app)/dashboard/`. Deleted old `app/dashboard/`.
- Routes remain the same (route groups don't affect URLs).

### 7b. Shared Layout (`app/(app)/layout.tsx`)
- Server component handling auth guard (getUser + profile + orgName fetch).
- Renders `AppShell` client component.

### 7c. App Shell (`app/(app)/app-shell.tsx`)
- **Top nav bar:** Logo (left) + profile dropdown with module switch options (right).
- **Profile dropdown:** User info → "Manage Services" / "Manage Driving School" separators → Sign out.
- **Floating sub-nav bar:** Centered pill-style tabs below top nav. Dynamic based on active module:
  - Doc Services: Overview | Customers | Services
  - Driving School: Overview | Instructors | Fleet | Daily Logs | Students | Attendance
  - Hidden when on the module selector page.
- **Mobile:** Hamburger menu with section-aware nav items + module switch.
- Provides `DashboardOrgContext` for org name.

### 7d. Module Selector (`/dashboard`)
- Replaced the old stats dashboard with two large cards: "Doc Services" and "Driving School".
- Clean centered layout with icon, description, and "Enter →" link.

### 7e. Route Fix
- Moved new service wizard from `/dashboard/services` → `/dashboard/services/new`.

### 7f. Driving School Pages (all with static/mock data — no DB calls yet)
| Route | Page |
|-------|------|
| `/driving-school` | Overview with 4 stat cards + 3 quick-link cards |
| `/driving-school/instructors` | Searchable list with status badges |
| `/driving-school/fleet` | Filterable list with Available/In Use/Maintenance badges |
| `/driving-school/logs` | Daily logs table with date picker and Release action |
| `/driving-school/students` | Student list with fee progress bars |
| `/driving-school/students/new` | Enrollment form (course type, fee, personal info) |
| `/driving-school/students/[id]` | Profile with Overview/Fees/Attendance tabs |
| `/driving-school/attendance` | Date-filtered attendance records |
