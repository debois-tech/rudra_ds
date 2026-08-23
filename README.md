# Rudra DS - Multi-Tenant Driving School Management Platform

Rudra DS is a modern, premium SaaS application designed to manage multiple driving schools from a single centralized platform. Built with Next.js and Supabase, it features strict tenant isolation, a dedicated Super Admin workspace, and comprehensive tools for driving school owners to manage their customers, vehicles, and documents.

## 🚀 Tech Stack

- **Frontend:** Next.js 16 (App Router), React, Tailwind CSS
- **UI Components:** shadcn/ui, Radix UI, Lucide Icons
- **Backend & Database:** Supabase (PostgreSQL), Supabase Auth
- **Security:** Row Level Security (RLS) for multi-tenancy

---

## ✨ Features

### Super Admin Dashboard (`/admin`)
- **Platform Overview:** View platform-wide statistics (total active schools, users, etc.).
- **Organization Management:** Create, view, activate, and deactivate driving schools (tenants).
- **User Management:** Create new users and assign them to specific driving schools. Cross-organization user viewing and deletion.
- **Strict Isolation:** Super Admins have an entirely separate UI workflow, isolating them from tenant-specific operations.

### Driving School Dashboard (`/dashboard`)
- **Tenant Isolation:** Users can only see and interact with data belonging to their specific driving school.
- **Customer Management:** Track students, contact details, and progress.
- **Vehicle Fleet:** Manage school vehicles.
- **Document Tracking:** Track expiring documents (licenses, insurances, PUCs) with automated status tracking.

---

## 🏗️ Architecture & Multi-Tenancy

This project relies heavily on **Supabase Row Level Security (RLS)** to enforce multi-tenancy.
1. **Organizations:** Every driving school is represented by a row in the `organizations` table.
2. **Profiles:** Users are linked to their respective `org_id` in the `profiles` table.
3. **RLS Policies:** Every database query natively filters data using `auth.uid()` and matches the user's `org_id`.
4. **Roles:** There are two user roles: `super_admin` (`org_id` is NULL) and `user` (belongs to a specific `org_id`).

---

## 🛠️ Local Setup Guide

### 1. Prerequisites
- Node.js 18+ and npm
- A Supabase Project (https://supabase.com)

### 2. Clone and Install Dependencies
```bash
git clone <your-repo-url>
cd rudra_ds
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and add your Supabase keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret_key
# Optional: Meta WhatsApp keys for notifications
META_WHATSAPP_PHONE_ID=your_meta_phone_id
META_WHATSAPP_TOKEN=your_meta_token
```
*(Find these keys in your Supabase Dashboard → Project Settings → API)*

### 4. Database Setup
Run these two files, in order, inside the Supabase SQL Editor:
1. `supabase/schema.sql` — full schema: tables, RLS policies, views, and dashboard RPC functions
2. `supabase/seed.sql` — optional demo/sample data

### 5. Create the Super Admin User
Since the platform is invite-only, there is no public signup. To create the first Super Admin:
1. Go to **Supabase Dashboard → Authentication → Users**.
2. Click **Add User** and create an account with your email and password.
3. Open the **SQL Editor** in Supabase and run this query to promote the user:
```sql
UPDATE profiles 
SET role = 'super_admin', org_id = NULL 
WHERE email = 'your-email@example.com';
```

### 6. Run the Application
```bash
npm run dev
```
Open `http://localhost:3000` in your browser. Upon logging in with your Super Admin credentials, you will be routed directly to the `/admin` portal.

---

## 📂 Project Structure

```text
rudra_ds/
├── app/
│   ├── (auth)/             # Login pages and auth callbacks
│   ├── admin/              # Super Admin dashboard (Platform Management)
│   ├── api/                # Server-side API routes (Admin ops via Service Role)
│   ├── dashboard/          # Driving School dashboard (Tenant operations)
│   └── page.tsx            # Root routing logic
├── components/             # Reusable UI elements (shadcn/ui, layout components)
├── lib/
│   ├── admin-api.ts        # Client wrapper for making calls to /api/admin
│   ├── api.ts              # RLS-protected database calls for tenants
│   ├── auth.ts             # Auth utility helpers
│   ├── supabase.ts         # Supabase client initializers
│   └── types.ts            # TypeScript interfaces
├── supabase/               # SQL schema definitions, migrations, and RLS policies
└── middleware.ts           # Route protection and role-based redirects
```

## 🔐 Security Notes
- **Client Components** (`use client`) only use the Supabase **Browser Client** combined with the Anon Key. Data access is strictly restricted by RLS on the database tier.
- **Server Components & API Routes** use the Supabase **Admin Client** (Service Role Key) completely securely, bypassing RLS to perform administrative tasks like creating organizations and provisioning users.
- **Middleware** actively blocks standard users from the `/admin` workspace and blocks Super Admins from the `/dashboard` workspace.