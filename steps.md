# Rudra DS — Complete Implementation Roadmap

> **Note:** Items marked with ~~strikethrough~~ are completed. The current focus is the **Driving School module**.

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

---

## Phase 1: Route Restructure — Module Selector + Shared Layout

### Step 1.1 — Create `(app)` Route Group

Move existing routes into a shared route group so both modules share a parent layout:

```
app/
├── (app)/                    ← NEW route group
│   ├── layout.tsx            ← Shared layout: auth guard + top nav + floating sub-nav
│   ├── dashboard/            ← Doc Services module (existing routes moved here)
│   │   ├── page.tsx          ← Module selector (two big cards: Doc Services / Driving School)
│   │   ├── overview/page.tsx ← Current dashboard stats content (moved from /dashboard)
│   │   ├── customers/...     ← Unchanged
│   │   ├── services/
│   │   │   ├── page.tsx      ← New service wizard (currently at /dashboard/services)
│   │   │   └── overview/     ← Services list (currently at /dashboard/services/overview)
│   │   └── ...
│   └── driving-school/       ← Driving School module (new)
│       └── ...
├── dashboard/                ← DELETE after move (all content moved to (app))
├── admin/                    ← Unchanged
├── (auth)/login/             ← Unchanged
└── ...
```

**Affected files to create:**
- `app/(app)/layout.tsx` — Shared auth guard + top nav bar + floating sub-nav
- `app/(app)/dashboard/page.tsx` — Module selector (replaces current dashboard stats)

**Affected files to move/rename:**
- `app/dashboard/layout.tsx` → move logic into `app/(app)/layout.tsx`, then delete
- `app/dashboard/page.tsx` → move stats content to `app/(app)/dashboard/overview/page.tsx`
- `app/dashboard/dashboard-shell.tsx` → becomes the Doc Services shell (rename to `services-shell.tsx`)
- `app/dashboard/services/page.tsx` → move to `app/(app)/dashboard/services/new/page.tsx`

### Step 1.2 — Shared Layout (`app/(app)/layout.tsx`)

This layout wraps ALL authenticated pages (both modules). It contains:

1. **Auth guard** (server-side): checks session, fetches profile + org name (same as current `dashboard/layout.tsx`)
2. **Top nav bar**: Logo (left), profile dropdown with module switch options (right)
   - Profile dropdown: "Manage Services" → `/dashboard/overview` | "Manage Driving School" → `/driving-school` | Sign Out
3. **Floating sub-nav bar**: Centered horizontal pills below the top nav
   - Doc Services active: Overview | Customers | Services
   - Driving School active: Overview | Instructors | Fleet | Daily Logs | Students | Attendance
   - Module Selector active: hidden
4. **Main content area**: renders `{children}`

**Key behavior**: The sub-nav is dynamic based on `pathname`. If path starts with `/dashboard`, show doc services nav. If starts with `/driving-school`, show DS nav. If at `/dashboard` exactly (module selector), hide sub-nav.

### Step 1.3 — Module Selector (`app/(app)/dashboard/page.tsx`)

Two large cards filling the viewport:

```
┌──────────────────────────────────────────────┐
│  Welcome back, {name}!                        │
│  Select a module to get started               │
│                                               │
│  ┌────────────────┐  ┌────────────────────┐   │
│  │  📄             │  │  🚗                 │   │
│  │  Doc Services   │  │  Driving School     │   │
│  │                 │  │                     │   │
│  │  Manage         │  │  Manage students,   │   │
│  │  customers,     │  │  instructors,       │   │
│  │  services,      │  │  fleet, daily       │   │
│  │  documents      │  │  logs, attendance   │   │
│  │                 │  │                     │   │
│  │  [Enter →]      │  │  [Enter →]          │   │
│  └────────────────┘  └────────────────────┘   │
└──────────────────────────────────────────────┘
```

### Step 1.4 — Create Doc Services Shell (`components/services-shell.tsx`)

Extract the current `dashboard-shell.tsx` content into a dedicated component for the doc services module. Remove org name from it (already moved to dashboard page). Keep the existing nav (Overview, Customers, Services).

---

## Phase 2: Driving School — Database Layer

### Step 2.1 — Create `supabase/ds_schema.sql`

6 new tables (from `update_plan_MotoAdmin.md`):

| # | Table | Purpose |
|---|-------|---------|
| 1 | `ds_instructors` | Driving school instructors (name, phone, licence_no, photo_url, is_active, org_id) |
| 2 | `ds_fleet_vehicles` | School-owned training vehicles (v_number, v_name, v_type, is_active, org_id) |
| 3 | `ds_driving_logs` | Instructor ↔ car daily mapping (log_date, instructor_id, vehicle_id, opted_at, released_at, notes, org_id) |
| 4 | `ds_students` | Enrolled driving students (name, phone, email, address, dob, enrollment_date, course_type, total_fee, status, notes, customer_id, org_id) |
| 5 | `ds_fee_payments` | Student fee records (student_id, amount, payment_date, payment_mode, note, org_id) |
| 6 | `ds_attendance` | Student attendance (attendance_date, student_id, instructor_id, vehicle_id, driving_log_id, notes, org_id) |

Plus: `updated_at` triggers, indexes on `org_id`, unique constraints.

### Step 2.2 — Create `supabase/ds_rls.sql`

RLS policies for all 6 tables:
- Super admins: full access
- Users: CRUD within own `org_id`

### Step 2.3 — Create `supabase/ds_views.sql`

| View | Description |
|------|-------------|
| `v_ds_driving_logs` | Logs joined with instructor name + vehicle number |
| `v_ds_attendance` | Attendance joined with student name, instructor name, vehicle number |
| `v_ds_student_dashboard` | Students with total paid, pending balance, attendance count |

### Step 2.4 — Run in Supabase SQL Editor

Run files in order:
1. `supabase/ds_schema.sql`
2. `supabase/ds_rls.sql`
3. `supabase/ds_views.sql`

---

## Phase 3: Driving School — Types & API Layer

### Step 3.1 — Add TypeScript Types (`lib/types.ts`)

Add interfaces:
- `DsInstructor`, `DsInstructorFormData`
- `DsFleetVehicle`, `DsFleetVehicleFormData`
- `DsDrivingLog`, `DsDrivingLogFormData`, `DsDrivingLogView`
- `DsStudent`, `DsStudentFormData`, `DsStudentDashboardView`
- `DsFeePayment`, `DsFeePaymentFormData`
- `DsAttendance`, `DsAttendanceFormData`, `DsAttendanceView`

### Step 3.2 — Create `lib/ds-api.ts`

New API module following `lib/api.ts` pattern:

| API Object | Methods |
|------------|---------|
| `instructorApi` | `getAll()`, `getById(id)`, `create(data)`, `update(id, data)`, `delete(id)` |
| `fleetVehicleApi` | `getAll()`, `getById(id)`, `create(data)`, `update(id, data)`, `delete(id)` |
| `drivingLogApi` | `getByDate(date)`, `getByDateRange(from, to)`, `create(data)`, `release(id)` |
| `studentApi` | `getAll()`, `getById(id)`, `search(query)`, `create(data)`, `update(id, data)`, `delete(id)` |
| `feePaymentApi` | `getByStudent(studentId)`, `create(data)` |
| `attendanceApi` | `getByDate(date)`, `getByStudent(studentId)`, `mark(data)`, `delete(id)` |
| `dsDashboardApi` | `getStats()` — active students, today's logs count, fee collection summary |

---

## Phase 4: Driving School — Frontend Pages

### Step 4.1 — Create Driving School Shell (`components/driving-shell.tsx`)

Similar to doc services shell but with DS-specific nav items. Same warm-ivory theme, same layout pattern. Nav items:

- Overview (`/driving-school`)
- Instructors (`/driving-school/instructors`)
- Fleet (`/driving-school/fleet`)
- Daily Logs (`/driving-school/logs`)
- Students (`/driving-school/students`)
- Attendance (`/driving-school/attendance`)

### Step 4.2 — Driving School Overview (`app/(app)/driving-school/page.tsx`)

Summary cards:
- Today's active logs count
- Active students count
- Fee collection this month (₹)
- Pending fees total (₹)
- Quick-action buttons: Assign Car, Enroll Student, Mark Attendance

### Step 4.3 — Instructors (`app/(app)/driving-school/instructors/page.tsx`)

List with search + Add/Edit dialog:
- Fields: name, phone, licence number, photo (optional)
- Status badge: Active (green) / Inactive (red)
- Edit and deactivate actions

### Step 4.4 — Fleet (`app/(app)/driving-school/fleet/page.tsx`)

List with filters + Add/Edit dialog:
- Fields: vehicle number, name/model, type (car/bike/truck/other)
- Status badge: Available / In Use / Maintenance
- Edit and retire actions

### Step 4.5 — Daily Logs (`app/(app)/driving-school/logs/page.tsx`)

Core operational page:
- Date picker (defaults to today)
- Table: Instructor | Car | Opted At | Released At | Status | Actions
- "Assign Car" button opens a dialog: instructor dropdown + vehicle dropdown + time
- "Release" quick-action button on active rows (sets `released_at` to now)
- Status: 🟢 In Use (no release time) / ⚪ Completed

### Step 4.6 — Students List (`app/(app)/driving-school/students/page.tsx`)

Enrollment list with search:
- Cards/rows: name, phone, course type, fee summary (total/paid/pending)
- Status badge: Active / Completed / Dropped
- Click → Student profile page

### Step 4.7 — Enroll Student (`app/(app)/driving-school/students/new/page.tsx`)

Form:
- Personal info: name, phone, email, address, DOB
- Enrollment: date, course type (dropdown: LMV, MCWG, HMV, etc.)
- Fee setup: total fee amount
- On submit: create student record
- **Option A**: optionally auto-create a linked `customers` record

### Step 4.8 — Student Profile (`app/(app)/driving-school/students/[id]/page.tsx`)

Tabs:
- **Overview**: Personal info, enrollment details, fee summary bar (Total | Paid | Pending)
- **Fees**: Payment history table + "Record Payment" button (amount, date, mode, note)
- **Attendance**: Date-wise attendance list with instructor/car info

### Step 4.9 — Attendance (`app/(app)/driving-school/attendance/page.tsx`)

Date-filtered list:
- "Mark Attendance" dialog: select student → select instructor → car auto-resolves from driving log → save
- Table: Date | Student | Instructor | Car | Notes

---

## Future Backlog (After Driving School Module)

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
