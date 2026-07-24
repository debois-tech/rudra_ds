# Rudra DS — Complete Implementation Roadmap

> **Note:** Items marked with ~~strikethrough~~ are completed. The current focus is **Phase 5: Remaining DS Dialogs**.

---

## ✅ Completed Items

- ~~Setup: `.env.local` configured with Supabase credentials~~
- ~~Setup: Database migrations applied (schema, RLS, views, seed, demo_requests)~~
- ~~Setup: Super admin user created~~
- ~~Fix: `SUPABASE_SERVICE_ROLE_KEY` had invalid `your-` prefix~~
- ~~Fix: Hydration mismatch — added `suppressHydrationWarning` to `<body>` tag~~
- ~~Nav: Profile button made clickable in super admin sidebar with dropdown sign-out~~
- ~~Nav: Logo size reduced + org name moved from navbar to dashboard page~~
- ~~Fix: Middleware → Proxy migration (codemod)~~
- ~~Fix: Routing performance — proxy now uses `getSession()` (cookie read) instead of `getUser()` (API call), removed DB query from proxy~~
- ~~Phase 1: Route restructure — (app) route group, shared layout, app shell, module selector~~
- ~~Phase 2: Driving School — Database layer (6 tables, RLS, 3 views)~~
- ~~Phase 3: Driving School — TypeScript types + API client (`lib/ds-api.ts`)~~
- ~~Phase 4: Driving School — Frontend pages wired to real DB, CRUD dialogs for Instructors/Fleet/Students~~

---

## ~~Phase 1: Route Restructure — Module Selector + Shared Layout~~ ✅

~~Complete — moved routes to `(app)/` group, shared layout with dynamic sub-nav, module selector page, doc services shell.~~

---

## ~~Phase 2: Driving School — Database Layer~~ ✅

### ~~Step 2.1 — Create `supabase/ds_schema.sql`~~

~~6 new tables:~~

| # | Table | Purpose |
|---|-------|---------|
| 1 | `ds_instructors` | Driving school instructors (name, phone, licence_no, photo_url, is_active, org_id) |
| 2 | `ds_fleet_vehicles` | School-owned training vehicles (v_number, v_name, v_type, is_active, org_id) |
| 3 | `ds_driving_logs` | Instructor ↔ car daily mapping (log_date, instructor_id, vehicle_id, opted_at, released_at, notes, org_id) |
| 4 | `ds_students` | Enrolled driving students (name, phone, email, address, dob, enrollment_date, course_type, total_fee, status, notes, customer_id, org_id) |
| 5 | `ds_fee_payments` | Student fee records (student_id, amount, payment_date, payment_mode, note, org_id) |
| 6 | `ds_attendance` | Student attendance (attendance_date, student_id, instructor_id, vehicle_id, driving_log_id, notes, org_id) |

~~Files: `supabase/ds_schema.sql`, `supabase/ds_rls.sql`, `supabase/ds_views.sql` — run in order.~~

---

## ~~Phase 3: Driving School — Types & API Layer~~ ✅

### ~~Step 3.1 — Add TypeScript Types (`lib/types.ts`)~~

~~15+ new interfaces for DS entities.~~

### ~~Step 3.2 — Create `lib/ds-api.ts`~~

~~7 API objects: `instructorApi`, `fleetVehicleApi`, `drivingLogApi`, `studentApi`, `feePaymentApi`, `attendanceApi`, `dsDashboardApi`.~~

---

## ~~Phase 4: Driving School — Frontend Pages~~ ✅

~~All 8 DS pages wired from mock data to real API calls, including CRUD dialogs:~~

| Page | What was done |
|------|---------------|
| Overview | `dsDashboardApi.getStats()` — live counts |
| Instructors | List from DB + Add/Edit Sheet + Deactivate/Activate + Delete |
| Fleet | List from DB + Add/Edit Sheet + Deactivate/Activate + Delete |
| Daily Logs | Live table via `drivingLogApi.getByDate()` + Release action |
| Students List | List from DB with fee progress + Delete action |
| Enroll Student | Form submits via `studentApi.create()` |
| Student Profile | Three tabs from DB (overview, fees, attendance) |
| Attendance | Live date-filtered records via `attendanceApi.getByDate()` |

---

## Phase 5: Driving School — Remaining Dialogs

### Step 5.1 — Assign Car Dialog (Daily Logs)

A modal/dialog on the Daily Logs page to create a new driving log entry:
- Instructor dropdown (active instructors only)
- Vehicle dropdown (active fleet vehicles only)
- Time picker (defaults to now)
- Optional notes field
- Calls `drivingLogApi.create()` on submit
- Refreshes table after creation

### Step 5.2 — Mark Attendance Dialog

A modal/dialog on the Attendance page:
- Date picker (defaults to current date)
- Student dropdown (active students)
- Instructor dropdown (active instructors)
- **Auto-resolve**: vehicle/car auto-fills from the instructor's active driving log
- Calls `attendanceApi.mark()` on submit
- Refreshes list after creation

### Step 5.3 — Record Payment Dialog (Student Profile)

A modal/dialog in the Fees tab of the student profile:
- Amount (₹)
- Payment date (defaults to today)
- Payment mode dropdown (cash, UPI, bank transfer, card, other)
- Optional note
- Calls `feePaymentApi.create()` on submit
- Refreshes payment list and fee summary bar

### Step 5.4 — Edit Student (Student List / Profile)

Add edit capability for student details:
- Edit button on student profile or student list (MoreVertical menu)
- Opens a Sheet with pre-filled fields (name, phone, email, address, DOB, course, fee)
- Calls `studentApi.update()` on submit

---

## Future Backlog

### Public Pages
- `/features` — dedicated feature showcase
- `/pricing` — pricing comparison table
- `/about` — company info
- `/contact` — contact form (reuse `demo_requests` table)
- `/blog` — blog listing + post template

### Doc Services Enhancements
- Vehicles page (`/dashboard/vehicles`) — list all, CRUD
- Documents page (`/dashboard/documents`) — service-based document tracking
- Settings page (`/dashboard/settings`) — WhatsApp toggle, reminder config

### Admin Panel Gaps
- Demo request review UI
- User active/inactive toggle
- Organization inline edit form

### WhatsApp Notification System
- Notification script + GitHub workflow
- Notification logs table
- Meta Business API integration

### Infrastructure
- `.env.example`
- `hooks/` directory
- Test setup (vitest)
- Dead code cleanup
