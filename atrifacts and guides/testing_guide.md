# Rudra DS: Comprehensive Testing Guide

This guide provides step-by-step instructions to manually test and verify the multi-tenant architecture, security rules, and user flows of the Rudra DS application.

## Prerequisites for Testing
Ensure you have access to the Supabase Dashboard for your project. You will need to view the database tables and authentication logs.

---

## Phase 1: Super Admin Validation

**Objective:** Verify that Super Admins can manage the platform and are isolated from tenant workspaces.

1.  **Login as Super Admin:**
    *   Navigate to `localhost:3000`.
    *   Log in using the Super Admin credentials created via SQL during setup.
    *   *Expected Result:* You should be immediately redirected to the `/admin` dashboard.
2.  **Workspace Isolation (Middleware Check):**
    *   While logged in as Super Admin, manually change the URL to `localhost:3000/dashboard`.
    *   *Expected Result:* You should be instantly redirected back to `/admin`.
3.  **Organization Management:**
    *   Go to the Organizations tab in the admin panel.
    *   Create two new organizations: "Test Driving School A" and "Test Driving School B".
    *   *Expected Result:* Organizations appear in the list. Check the Supabase `organizations` table to confirm the rows exist.
4.  **User Provisioning:**
    *   Go to the Users tab.
    *   Create User A (`userA@example.com`) and assign them to "Test Driving School A".
    *   Create User B (`userB@example.com`) and assign them to "Test Driving School B".
    *   *Expected Result:* Users appear in the list. Check the Supabase `profiles` table to ensure their `org_id` matches the correct organizations and their role is `user`.
5.  **Sign Out:** Log out of the Super Admin account.

---

## Phase 2: Tenant Isolation & Data Security

**Objective:** Verify that Tenant Users can only see their own data and cannot bypass Row Level Security.

1.  **Login as Tenant A:**
    *   Log in using `userA@example.com`.
    *   *Expected Result:* You should be redirected to `/dashboard`.
2.  **Workspace Isolation For Tenants:**
    *   Manually change the URL to `localhost:3000/admin`.
    *   *Expected Result:* You should be instantly redirected back to `/dashboard`.
3.  **Data Creation (Tenant A):**
    *   Navigate to the Customers section. Add a new customer: "Alice".
    *   Navigate to the Vehicles section. Add a new vehicle: "Car A".
    *   *Verification:* Open the Supabase Database dashboard. Look at the `customers` and `vehicles` tables. Verify that Alice and Car A have the `org_id` corresponding to "Test Driving School A".
4.  **Backend API Security Check:**
    *   While logged in as Tenant A, open the browser's developer console (F12).
    *   Attempt to hit a Super Admin API route via fetch:
        ```javascript
        fetch('/api/admin/organizations').then(r => console.log(r.status))
        ```
    *   *Expected Result:* It should log `403` (Forbidden). The middleware blocked the request.
5.  **Sign Out:** Log out of User A.
6.  **Tenant B Isolation Check:**
    *   Log in using `userB@example.com`.
    *   *Expected Result:* You are on `/dashboard`. The UI should show 0 Customers and 0 Vehicles. "Alice" and "Car A" must NOT be visible.
    *   Add a customer: "Bob".
7.  **Sign Out:** Log out.

---

## Phase 3: Platform Stability Check

**Objective:** Ensure standard Next.js build and routing function correctly.

1.  **Public Routes:**
    *   Without being logged in, visit `localhost:3000` or `localhost:3000/login`.
    *   *Expected Result:* Pages load successfully without redirects.
2.  **Protected Route Enforcement:**
    *   Without being logged in, directly visit `localhost:3000/dashboard` or `localhost:3000/admin`.
    *   *Expected Result:* You are redirected to `/login?redirect=/...`.
3.  **Database Triggers:**
    *   (Optional DB test): As a Super Admin, delete an organization from the Supabase UI.
    *   *Expected Result:* All associated customers, vehicles, and documents for that organization should be automatically deleted (Cascade Delete rule). Nullify linked profiles.
