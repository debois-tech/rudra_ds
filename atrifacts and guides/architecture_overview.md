# Architecture and Database Analysis

Based on the provided PostgreSQL schema, database metadata (screenshots), and the repository structure, here is a detailed breakdown of the application.

## 1. Application Overview

**Rudra DS** is a B2B SaaS (multi-tenant) application built for businesses (specifically, driving schools) to manage their customers, vehicles, documents (like licenses, PUC, insurance), and automated document renewal reminders.

### Tech Stack
- **Framework:** Next.js 14/15 (App Router)
- **Styling:** Tailwind CSS, Radix UI components
- **Database & Auth:** Supabase (PostgreSQL), `@supabase/ssr`
- **Forms & Validation:** React Hook Form, Zod
- **Background Jobs:** GitHub Actions + Node.js Scripts (for WhatsApp Notifications via Meta API)

## 2. Database Structure

The database is heavily customized with RLS (Row Level Security), triggers, and functions to support multi-tenancy (`org_id`) and automated constraints. 

### Core Tables
1. **`organizations`**
   - The root entity of the multi-tenant architecture. Every other table is associated with a specific organization via `org_id` to strictly isolate data.
   - Contains `name`, `slug`, `contact info`, and `is_active` status.

2. **`profiles`**
   - Extends the core `auth.users` table for application users.
   - Tied to `org_id` and has a `role` enum (`super_admin` or `user`).
   - Managed automatically (e.g., a function `handle_new_user()` and trigger populates it when a new Auth user signs up).

3. **`customers`** & **`vehicles`**
   - **`customers`**: End-users of the driving school. Tracks name, mobile, WhatsApp number, email, and a unique Auto-Generated Registration ID (`c_registration_id`).
   - **`vehicles`**: Belong to customers (`owner_id` foreign key) and are tied to an `org_id`.

4. **`document_types`** & **`documents`**
   - **`document_types`**: Pre-defined or org-specific types of documents (e.g., "Driving License", "Car Insurance"). Differentiates between `entity_type` (customer vs. vehicle).
   - **`documents`**: The actual document record. Links to `doc_type_id` and an `entity_id` (representing either a customer or a vehicle). Validated with an `exp_date` which is critical for the reminder system.

5. **`notification_logs`**
   - Audit trail for WhatsApp reminders sent to customers regarding their document expiries.
   - Links back to `doc_id` and `customer_id`. Records days before expiry when the alert was triggered.

6. **`app_settings`**
   - Key-value JSONB store for organization-level configurations (e.g., custom `notification_days`). Unique on [(key, org_id)](file:///c:/Users/Omkar/Desktop/RDC/rudra_ds/middleware.ts#17-28).

### Database Triggers, Functions & Indexes
- **Automated Timestamps**: Triggers (`update_updated_at`, `update_updated_at_column`) exist on nearly all tables to automatically refresh the `updated_at` column BEFORE UPDATE.
- **Auto-Registration IDs**: A trigger on `customers` (`set_registration_id` runs `generate_registration_id()`) automatically generates a format-specific registration string BEFORE INSERT.
- **Auth and Security Functions**: Includes `is_super_admin()`, `get_user_org_id()`, and `handle_new_user()` which help maintain strict RLS policies and handle user creation flows securely from the database level.
- **Indexes**: heavily optimized for rapid filtering by Org (`idx_customers_org_id`, `idx_vehicles_org_id`, etc.) and cron-job queries (`idx_documents_exp_date`, `idx_notification_logs_doc`).
- **Enums**: `user_role` (`super_admin`, `user`).

## 3. Application Structure

The Next.js Application is divided cleanly separating marketing, authentication, multi-tenant dashboards, and a super-admin portal.

- **[middleware.ts](file:///c:/Users/Omkar/Desktop/RDC/rudra_ds/middleware.ts)**: The central traffic controller. Enforces route protection based on the Supabase authenticated session. It checks the `profiles.role` DB enum and routes `super_admin` to `/admin` and `user` to `/dashboard`.
- **`app/(auth) / login`**: Public routes for signing into the application.
- **`app/admin`**: The master control panel reserved for `super_admin` users (to manage the whole SaaS, like managing tenants/organizations).
- **`app/api/admin`**: Backend API routes restricted to `super_admin`.
- **`app/dashboard`**: The multi-tenant B2B portal where a specific driving school employee (`user`) logs in to manage:
  - `/customers`, `/vehicles`, `/documents`
  - `/settings` (e.g., editing `app_settings` for WhatsApp templates/reminder days)
- **`lib/`**: Centralized logic.
  - `admin-api.ts` / `api.ts`: API abstractions bridging the UI and the DB.
  - `auth.ts`, `supabase.ts`: Supabase SSR client initialization and session management.
  - `types.ts`: Typings for DB Schemas and Application Data.

## 4. Background Automations
Based on `NOTIFICATIONS_SETUP.md`, the platform does not rely purely on Next.js API routes for cron jobs. Instead, it utilizes **GitHub Actions**:
- A workflow `.github/workflows/daily-notifications.yml` triggers a Node.js script (`scripts/send-notifications.js`) daily at 9:00 AM IST.
- This script reads document expirations and `app_settings` configurations via the Supabase Admin API, and dispatches dynamic templates to the **Meta WhatsApp Business API**.
- It then writes confirmation logs back to the `notification_logs` table.

## Summary

Rudra DS is a well-structured, multi-tenant B2B platform with robust database-level constraints. The heavy lifting for referential integrity, automated timestamps, and tenant isolation is handled at the PostgreSQL level, freeing up the Next.js stack to focus strictly on UI/UX, routing, and form validation.
