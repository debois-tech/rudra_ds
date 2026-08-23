# Rudra DS — Design System Audit & Consistency Plan

Purpose: this file is the source of truth for the visual language of the app — what actually exists today (audited directly from the code, not assumed), where it's inconsistent, and what the target unified system should be. Written 2026-08-23 as prep work before a consistency pass across the landing page, both dashboards, and the admin panel.

**How to read this doc**: Section 1 is the token layer that already exists but is barely used. Sections 2–5 are the actual per-area audit (evidence: file + line). Section 6 is the "keep this" list — things that are already consistent, don't touch. Section 7 is the proposed unified system. Section 8 is a page-by-page punch list for the actual migration.

---

## 1. The foundation layer that exists but is mostly ignored

`app/globals.css` + `components.json` define a real shadcn design-token system:

- **Style**: shadcn "new-york", base color "slate", CSS variables on, no class prefix.
- **Font**: Geist Sans (`--font-geist-sans`) for UI text, Geist Mono for monospace — set once in `app/layout.tsx`, applied via CSS var to `<body>`. This part *is* consistent — every page inherits it, nothing overrides it. Not an issue.
- **Color tokens** (`:root` in `globals.css`, oklch space):
  - `--primary: oklch(0.75 0.18 75)` → this is an **amber/gold hue (~75°)**. This is the one true "brand primary" baked into the token system.
  - `--background: oklch(0.985 ...)` (near-white), `--foreground` (near-black), `--card` (white), `--border`/`--input` (light slate-ish gray), `--destructive` (red), plus a full `--sidebar-*` set (dark, for a sidebar-style nav) and `--chart-1..5` (for data viz).
  - A parallel `.dark` block exists (dark backgrounds, brighter primary) — but nothing in the app currently toggles a `dark` class anywhere, so it's dead code today. Not a bug, just unused.
- **Radius scale**: one variable, `--radius: 0.625rem` (10px), with `sm/md/lg/xl/2xl/3xl/4xl` all derived from it via `calc()`. A single knob that would resize every themed radius at once — if components actually used the token classes.
- **Primitives** (`components/ui/*`) are real shadcn components wired to these tokens:
  - `Button` — `variant="default"` = `bg-primary text-primary-foreground`, base radius `rounded-md`, height `h-9` (size="default").
  - `Card` — `rounded-xl border shadow-sm`, `bg-card`.
  - `Input` — `h-9 rounded-md border-input`.

**The core problem**: almost no page actually uses these tokens or the primitives at their defaults. Every button, card, and input below is wrapped in a full custom `className` that hardcodes its own colors, radius, height, and shadow — re-deriving the design system from scratch, differently, on nearly every page. The token layer is a well-built system nobody uses.

---

## 2. Color — four different brand palettes, in one app

Grepped every gradient (`from-*-to-*`) and solid accent color across `app/` and `components/`. Four distinct visual identities emerged, split cleanly by area:

### 2a. Landing page + Login — **amber** (matches the actual `--primary` token)
- `components/landing-page.tsx`: hero headline gradient `from-amber-500 via-amber-600 to-orange-500` (line 428), CTA accents `text-amber-600`, badges `bg-amber-50 text-amber-600`, pricing card top-bar `from-amber-400 via-amber-500 to-orange-500` (line 594), footer CTA `from-amber-300 to-amber-500` (line 710). `selection:bg-amber-200` even themes text selection.
- `app/(auth)/login/page.tsx`: submit button `from-amber-400 to-amber-500` (line 131), input focus rings `focus:border-amber-300 focus:ring-amber-100`.
- `app/layout.tsx`: `<meta name="theme-color" content="#f59e0b">` (browser chrome color) — literally amber-500.

### 2b. Driving-school module — **amber**, matches landing/login
- `app/(app)/app-shell.tsx` (shared shell for *both* dashboards): user avatar gradient `from-amber-400 to-amber-600` (lines 99, 209).
- `instructors/page.tsx`, `logs/page.tsx`: primary CTA `from-amber-400 to-amber-600` / `to-amber-500`.
- Admin nav-active state also amber (`bg-amber-600/10 text-amber-400`).
- **But not fully consistent internally**: `students/page.tsx` and `students/[id]/page.tsx` use an **emerald** gradient (`from-emerald-400 to-emerald-600`, lines 87 and 70 respectively) for the student avatar/header instead of amber — an unexplained one-off deviation within the same module.

### 2c. General dashboard (customers/services) — **purple → indigo**, a different brand entirely
- `dashboard/customers/page.tsx` (line 76), `customers/new/page.tsx` (264), `customers/[id]/page.tsx` (111, 155), `customers/[id]/edit/page.tsx` (241), `services/overview/page.tsx` (74): every primary CTA ("Give Service", "New Service", customer avatar) uses `from-purple-600 to-indigo-600`.
- This is a **completely different accent color** from the amber used one route group up in the *same app shell*, for conceptually identical actions (primary CTA button).
- One partial exception: `dashboard/services/new/page.tsx`'s final submit button (line 503) uses amber (`from-amber-400 to-amber-500`) — so even within the purple/indigo-branded customer & services area, the actual "confirm and create" button reverts to amber. Two brand colors *on the same user flow*.

### 2d. Admin panel — **dark slate + amber**, a fourth visual mode
- `app/admin/admin-shell.tsx`: entire shell is dark (`bg-slate-900` body, `bg-slate-950` sidebar, white text, amber-400 accents for active nav/branding).
- Every admin page heading is `text-white` (`admin/page.tsx:36`, `admin/users/page.tsx:48`, `admin/organizations/page.tsx:45`, `admin/organizations/[id]/page.tsx:105`) — inverted from the dashboard's `text-slate-900` headings.
- This is the only part of the app in a dark visual mode; everything else (landing, login, both dashboards) is light. Not necessarily wrong (admin-as-distinct-mode is a legitimate pattern) but it's undocumented and the amber accent is reused without the rest of the palette matching, so it reads as "half-themed dark mode" rather than an intentional second theme.

### Status/badge colors — the one thing that IS consistent
Across driving-school (`instructors`, `fleet`, `students`, `attendance`) and general dashboard (`overview/_components/badges.tsx`, `status-bars.tsx`), the semantic mapping is the same everywhere: **emerald = active/good/present**, **red = inactive/dropped/cancelled**, uniformly `bg-{color}-50 text-{color}-600` pill style, `rounded` (not `rounded-full`), `text-[11px] font-medium`, `px-2 py-0.5`. Don't touch this pattern — replicate it where missing.

---

## 3. Typography — no consistent heading scale

Grepped every `<h1>` page title across the app:

| Area | Pattern | Example |
|---|---|---|
| `dashboard/customers`, `customers/new`, `customers/[id]`, `customers/[id]/edit`, `services/overview`, `services/new` | `text-3xl font-bold tracking-tight text-slate-900` | `customers/page.tsx:72` |
| `dashboard` (root), `dashboard/overview`, driving-school **all 6 pages** (`page.tsx`, `instructors`, `attendance`, `students`, `students/new`, `logs`, `fleet`) | `text-2xl font-bold text-slate-900 tracking-tight` | `instructors/page.tsx:122` |
| `admin/page.tsx`, `admin/users/page.tsx`, `admin/organizations/page.tsx` | `text-3xl font-bold text-white` (no `tracking-tight`) | `admin/page.tsx:36` |
| `admin/organizations/new`, `admin/organizations/[id]` | `text-2xl font-bold text-white` | `admin/organizations/new/page.tsx:78` |
| `login/page.tsx` | `text-[22px] font-bold text-slate-900 tracking-tight` (a one-off pixel value, matches neither 2xl (24px) nor xl (20px)) | `login/page.tsx:78` |
| Landing hero | `text-4xl sm:text-5xl md:text-7xl font-extrabold` | `landing-page.tsx:424` |

So there are effectively **six different page-title treatments** for what is structurally the same UI role ("this is the page you're on"), with no logic tying the choice of `2xl` vs `3xl` to page type (list pages and detail pages both appear in both buckets) — it looks like whichever size the page happened to be built with.

Label/caption styling is more consistent: the `text-[11px] uppercase tracking-wider font-bold text-slate-500` (or `font-semibold`) pattern for form field labels and section eyebrows recurs across driving-school forms, `services/new`, and card headers — worth keeping as the standard label style.

---

## 4. Spacing & sizing — no shared scale

### Button/input heights
Grepped every `h-{n}` paired with a `rounded-*` class on interactive elements. Found **six different heights** used for what are all "primary action button" or "form input" roles with no evident pattern:
- `h-8` — small icon/action buttons (`students/[id]/page.tsx:100,201,225`, `logs/page.tsx:142`)
- `h-9` — most page-header CTA buttons across driving-school (`instructors`, `fleet`, `logs`, `students`, `driving-school` root) — this is the closest thing to a dominant convention
- `h-10` — customer/service CTAs (`dashboard/customers/page.tsx:76`, `services/overview/page.tsx:74`), and most Sheet form buttons (`assign-car-sheet.tsx`, `release-car-sheet.tsx`, `edit-student-sheet.tsx`, `record-payment-sheet.tsx`)
- `h-11` — login page inputs and submit button
- `h-12` — `services/new` step-1 search input, "Total Cost" input
- `h-14` — `customers/new/page.tsx:264` submit button, `services/new/page.tsx` final submit button, `attendance/page.tsx:175` search bar

### Border radius
Similarly ad hoc — `rounded-md` (shadcn default, rarely seen in practice), `rounded-lg` (admin panel nav links, some badges), `rounded-xl` (most buttons/inputs), `rounded-2xl` (most Cards, some buttons, Sheets), `rounded-3xl`/`rounded-4xl` tokens defined but never referenced anywhere in the codebase. No page uses the `rounded-{size}` token classes (`rounded-xl` here means the literal Tailwind utility resolving to its own fixed value, not `--radius-xl` from the theme — confirmed by `components.json`'s `prefix: ""` and the fact `--radius-xl` isn't referenced via `rounded-(--radius-xl)` anywhere). So even where two pages both say "rounded-xl," it's coincidence, not a shared token.

### Page container widths
- `max-w-3xl` — `customers/[id]/edit`, `services/new`
- `max-w-4xl` — `customers/new`
- `max-w-5xl` — `customers/[id]`
- `max-w-7xl` — `customers`, `services/overview`, `dashboard/loading`
- Driving-school pages mostly use **no max-width container at all** (full-bleed within the shell's padded `<main>`), unlike every general-dashboard page which wraps content in a centered `max-w-*` box. This is a real structural inconsistency, not just a size choice — driving-school pages look "wider/fuller" than dashboard pages at the same shell width.

---

## 5. Component & flow patterns — three different CRUD paradigms

Same underlying operation (create/edit a record) is implemented three structurally different ways depending on which page you're on:

1. **Sheet (slide-over panel)** — driving-school `instructors`, `fleet`, `students/[id]` edit, `students/[id]` record-payment, `logs` assign/release-car. Uses `components/ui/sheet.tsx`.
2. **Full separate page** — `dashboard/customers/new`, `dashboard/customers/[id]/edit`, `driving-school/students/new`. A dedicated route, not an overlay.
3. **Multi-step wizard on one page** — `dashboard/services/new` (3-step: customer → category → details, with a step-indicator component).

None of these is wrong on its own, but there's no rule for *when* to use which — `students` uses a full page for "new" but a Sheet for "edit," while `instructors`/`fleet` use a Sheet for both create and edit. A user moving between driving-school sub-pages hits three different interaction models for the same kind of task.

Delete confirmation is also inconsistent: `instructors`/`fleet` use the browser's native `confirm()` (`if (!confirm('Delete this instructor?...'))`), while nothing else in the app uses a styled confirmation dialog — so it's at least *consistently* native, just visually jarring against an otherwise fully custom-styled UI.

Dropdown/action menus: `instructors` and `fleet` build a custom `menuOpen` + `useRef` click-outside dropdown from scratch (see `instructors/page.tsx:25-48`) instead of using Radix `DropdownMenu` (already a project dependency per `package.json`). Reinventing a primitive that's one import away.

---

## 6. What's already consistent — don't touch these

- **Font**: Geist Sans/Mono everywhere, set once, never overridden. Leave as-is.
- **Status badge semantics**: emerald=active/good, red=inactive/bad, same pill shape (`rounded text-[11px] font-medium px-2 py-0.5 bg-{c}-50 text-{c}-600`) across both dashboards. Extend this pattern to any page missing it, don't invent a new one.
- **Form field label style**: `text-[11px] uppercase tracking-wider font-bold text-slate-500` (or `font-semibold`) — recurs enough to be the de facto standard. Formalize it.
- **Toast notifications**: `sonner` used uniformly for success/error feedback across every mutation in every module — no inconsistency found here.
- **Security headers, RLS, auth flow**: out of scope for this doc, already covered in `fixes.md` — not a design concern.

---

## 7. Proposed unified system

The goal: one accent color, one radius scale, one heading scale, one button-height scale, one container convention, applied everywhere except the admin panel (which gets to keep a *deliberate*, documented dark mode rather than an accidental one).

### 7a. Color
- **Single brand accent: amber**, matching the existing `--primary` token, the landing page, the login page, most of the driving-school module, and the browser `theme-color` meta tag. It's already the majority pattern and the one baked into the token layer — cheapest and most coherent choice, not a new color.
- **Retire the purple/indigo scheme** from `dashboard/customers/*` and `services/overview` — replace every `from-purple-600 to-indigo-600` with the amber gradient used everywhere else (`from-amber-400 to-amber-600` for avatars/icons, `from-amber-400 to-amber-500` for primary CTA buttons, matching what `services/new`'s submit button and the shared `app-shell.tsx` avatar already use).
- **Fix the `students` module emerald deviation** — its avatar/header gradient should match the rest of driving-school (amber), reserving emerald exclusively for the "active/success" status-badge role it already owns everywhere else. Using it as *both* a brand accent and a status color is the specific thing to eliminate.
- Actually route buttons/badges through `bg-primary`/`text-primary-foreground` (the shadcn token classes) wherever a literal `bg-amber-500` etc. is used today, so a future rebrand is a one-line CSS var change instead of a repo-wide find/replace.
- **Admin panel**: keep dark mode, but make it deliberate — document it as the one intentionally distinct area (matches its "separate workspace for a different kind of user" purpose per `CLAUDE.md`), and make sure it's using the actual `.dark` token block from `globals.css` (via a `dark` class on its root) instead of hardcoded `slate-900`/`slate-950`/`text-white` literals, so it inherits the same primary/border/card tokens as everything else instead of being a fully separate hand-rolled palette.

### 7b. Radius
Standardize on the token scale that already exists in `globals.css` instead of literal Tailwind radius utilities:
- Buttons/inputs: `rounded-xl` (≈ `--radius-xl`)
- Cards/Sheets/panels: `rounded-2xl` (≈ `--radius-2xl`)
- Small pills/badges: `rounded` (current status-badge convention — keep)
- Avatars/icon-only buttons: `rounded-full` (current convention — keep)
- Drop `rounded-lg`/`rounded-md` from page-level components entirely (fine to keep as shadcn's own internal default for primitives not yet migrated).

### 7c. Typography
One heading scale for page titles, used everywhere a page has a top-level `<h1>`:
- `text-2xl font-bold tracking-tight text-slate-900` (light areas) — this is already the majority pattern (driving-school module + dashboard overview), so **promote it to the standard** and bring `dashboard/customers`, `services/overview`, `customers/new/[id]/edit` down from `text-3xl` to match, rather than the reverse (less visual disruption, matches more existing pages).
- Admin panel keeps its own heading treatment (`text-3xl`/`text-2xl font-bold text-white`) as part of its deliberate dark-mode identity — but standardize *within* admin to one size (currently split between 2xl and 3xl for no clear reason — `organizations/new` and `organizations/[id]` should match `admin/page.tsx`'s 3xl, since they're peer top-level pages, not sub-pages).
- Fix `login/page.tsx`'s one-off `text-[22px]` to `text-2xl` (24px) — negligible visual difference, removes the only magic-number heading size in the app.

### 7d. Sizing
- Primary CTA buttons: `h-10` (splits the difference between the `h-9` driving-school convention and the `h-10`/`h-11` dashboard convention; matches Sheet-form submit buttons, which are already the single most common height in the codebase).
- Compact/icon-action buttons: `h-8`, `size="icon"` variants — keep as-is, already reasonably consistent.
- Form inputs inside Sheets/pages: `h-11` (matches the login page and most Sheet forms already).
- Retire `h-12`/`h-14` one-offs (`services/new` search input and submit, `customers/new` submit, `attendance` search bar) down to `h-11`/`h-10`.

### 7e. Layout containers
- List/overview pages (customers, services, instructors, fleet, students, attendance, logs): `max-w-7xl mx-auto`.
- Single-record detail/edit pages (customer detail, student profile): `max-w-5xl mx-auto`.
- Forms/wizards (new customer, new service, enroll student): `max-w-3xl mx-auto`.
- Apply the same convention to driving-school pages, which currently use no container at all — wrap them the same way general-dashboard pages already are, so both modules feel like the same width/density under the shared shell.

### 7f. Flow patterns
- **Sheets for anything editable inline from a list** (instructors, fleet, students edit, payments) — this is already the majority pattern, keep it.
- **Full pages only for genuinely multi-section creation flows** (new student enrollment, which has personal-info + fee-setup sections) — keep `students/new` as a full page, but reconsider whether `dashboard/customers/new` (a flat single-section form) should become a Sheet instead, for consistency with everything else of similar complexity.
- **Multi-step wizard reserved for flows with a real branching decision** (`services/new`'s category choice determines which fields appear next) — this is the only flow that actually needs it; don't introduce wizards elsewhere.
- Replace the native `confirm()` delete dialogs in `instructors`/`fleet` with a small styled confirmation (a `Dialog` from the existing shadcn primitives, or extend `Sheet`) to match the rest of the app's fully custom visual language.
- Replace the hand-rolled `menuOpen`/click-outside dropdowns in `instructors`/`fleet` with Radix `DropdownMenu` (already a dependency, not currently imported anywhere in the app despite being available).

---

## 8. Migration punch list (for the actual consistency pass)

Grouped by area, roughly in the order that minimizes risk (shared primitives first, then leaf pages):

1. `components/ui/button.tsx` — no change needed to the component itself; the fix is in call sites.
2. `app/(app)/app-shell.tsx` — already amber, confirm it's the reference implementation other pages should match.
3. **General dashboard** (`app/(app)/dashboard/**`) — the biggest single change: retire purple/indigo → amber across `customers/page.tsx`, `customers/new/page.tsx`, `customers/[id]/page.tsx`, `customers/[id]/edit/page.tsx`, `services/overview/page.tsx`; bring `text-3xl` headings down to `text-2xl`; standardize container widths per 7e; standardize button/input heights per 7d.
4. **Driving-school module** (`app/(app)/driving-school/**`) — fix `students/page.tsx` + `students/[id]/page.tsx` emerald→amber deviation; add missing `max-w-*` containers per 7e; replace native `confirm()` and custom dropdown in `instructors`/`fleet` with `Dialog`/`DropdownMenu`.
5. **Login page** — fix the `text-[22px]` → `text-2xl` one-off; otherwise already on-brand, minimal change.
6. **Admin panel** — decide (needs a product call, not just a code change) whether to formalize as a real `.dark`-token-driven theme per 7a, or leave the hand-rolled dark palette as intentionally separate; either way, unify its own internal 2xl/3xl heading split.
7. **Landing page** — already the most internally consistent area (single amber identity throughout); lowest priority, spot-check only.

This document should be updated as the migration proceeds — check items off or note deviations directly in Section 8 rather than starting a new file.
