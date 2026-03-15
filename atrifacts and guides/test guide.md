# Rudra DS - Comprehensive Manual Testing Guide

This document is designed for Quality Assurance (QA) testers. Its purpose is to verify that all core functionalities of the Rudra DS application (aside from WhatsApp notifications) are working flawlessly. 

You do not need to be a developer to follow this guide. Follow the **Test Steps** exactly as written, use the provided **Test Data**, and verify the **Expected Results**.

---

## Prerequisites (Tester Setup)
Before starting these tests, you must have access to two things:
1. **The Live Application URL** (e.g., `localhost:3000` or the live Vercel URL).
2. **Access to the Supabase Database Dashboard** (specifically the "Table Editor" view) so you can visually verify that data is actually saving.

---

## Test Phase 1: Super Admin Portal
*Objective: Verify the platform owner can successfully create and manage new Driving Schools.*

### Test Case 1.1: Super Admin Login
* **Goal**: Ensure super admins can log in and access the master portal.
* **Test Data**: Use your provided Super Admin email (e.g., `admin@test.com`) and Password.
* **Steps**:
   1. Navigate to the application URL.
   2. Enter the Super Admin Email and Password.
   3. Click "Sign In."
* **Expected Result**: 
   * The application immediately redirects you to the `/admin/organizations` page.
   * You should see a sidebar with "Organizations" and "Users".

### Test Case 1.2: Creating a New Organization (Driving School)
* **Goal**: Ensure new driving schools can be registered.
* **Test Data**:
   * Name: `QA Test Driving School`
   * Slug: `qa-test-school`
   * Phone: `9999999999`
   * Email: `contact@qatestschool.com`
* **Steps**:
   1. On the Admin portal, go to **Organizations**.
   2. Click "Add Organization".
   3. Fill in the Test Data exactly as written above.
   4. Click "Submit" or "Save".
* **Expected Result (UI)**: The table updates instantly and displays "QA Test Driving School".
* **Expected Result (Database)**: 
   1. Open Supabase -> Table Editor -> `organizations` table.
   2. You should see a new row with the name "QA Test Driving School".
   3. Note down the `id` (a long string of letters/numbers) for this new row.

### Test Case 1.3: Creating the School Owner (User Account)
* **Goal**: Ensure a login account can be created and linked to the new school.
* **Test Data**:
   * Name: `John QA Owner`
   * Email: `john.qa@qatestschool.com`
   * Password: `TestPassword123!`
   * Organization: `QA Test Driving School`
* **Steps**:
   1. On the Admin portal, go to **Users**.
   2. Click "Add User".
   3. Enter the test Name, Email, and Password.
   4. From the dropdown, select the "QA Test Driving School" you just created.
   5. Click "Save".
* **Expected Result (UI)**: The user appears in the User Table.
* **Expected Result (Database)**: 
   1. Open Supabase -> Table Editor -> `profiles` table.
   2. Search for the email `john.qa@qatestschool.com`.
   3. Verify that the `role` is exactly `user`.
   4. Verify that the `org_id` perfectly matches the `id` you noted down in Test 1.2.

---

## Test Phase 2: Driving School Dashboard
*Objective: Verify that a Driving School owner can manage their own specific customers, vehicles, and documents securely.*

### Test Case 2.1: Tenant Login and Isolation
* **Goal**: Ensure the driving school owner logs in securely and cannot access Super Admin pages.
* **Steps**:
   1. **Log out** of the Super Admin account.
   2. Log back in using the credentials from Test 1.3 (`john.qa@qatestschool.com` / `TestPassword123!`).
* **Expected Result**: 
   * You are redirected to `/dashboard`, NOT the Admin Panel.
   * If you manually type `/admin/organizations` in the URL bar and press enter, the application should block you or redirect you back to the dashboard ("Unauthorized").

### Test Case 2.2: Adding a Customer
* **Goal**: Verify customers save correctly and Auto-Registration IDs work.
* **Test Data**:
   * Full Name: `Alice QA Student`
   * Email: `alice@test.com`
   * Mobile: `8888888888`
   * WhatsApp: `8888888888`
* **Steps**:
   1. In the Dashboard sidebar, click **Customers**.
   2. Click "New Customer".
   3. Enter the Test Data.
   4. Click "Save".
* **Expected Result (UI)**: The table displays Alice QA Student. **Important:** The table should display a newly generated "Registration ID" next to her name (e.g., `RD-2024-...`).
* **Expected Result (Database)**: 
   1. Open Supabase -> Table Editor -> `customers` table.
   2. A row for Alice exists.
   3. The `org_id` correctly matches "QA Test Driving School".

### Test Case 2.3: Adding a Vehicle
* **Goal**: Verify vehicles can be added to the fleet.
* **Test Data**:
   * Plate Number: `MH 12 QA 9999`
   * Type: `Car`
   * Make/Model: `Maruti Swift`
* **Steps**:
   1. Go to **Vehicles**.
   2. Click "New Vehicle".
   3. Input Test Data.
   4. Click "Save".
* **Expected Result (UI)**: The vehicle appears in the table.
* **Expected Result (Database)**: 
   1. Open Supabase -> Table Editor -> `vehicles` table.
   2. A row for the Maruti Swift exists.
   3. The `org_id` correctly matches "QA Test Driving School".

### Test Case 2.4: Uploading an Expiring Document
* **Goal**: Ensure documents can be attached to Customers/Vehicles.
* **Test Data**:
   * Document Type: `Vehicle Insurance`
   * Belongs to: `Vehicle`
   * Select Vehicle: `MH 12 QA 9999`
   * Expiration Date: Select a date **exactly 30 days from today**.
* **Steps**:
   1. Go to **Documents**.
   2. Click "New Document".
   3. Use the dropdowns to input the Test Data.
   4. Upload any dummy image file (e.g., a blank PNG).
   5. Click "Save".
* **Expected Result (UI)**: The document appears in the active documents list.
* **Expected Result (Database)**: 
   1. Open Supabase -> Table Editor -> `documents` table.
   2. A row exists for this document linking to the vehicle's ID.
   3. Check the `updated_at` column. It should perfectly match your current time (proving the timestamp triggers we discussed are working!).

### Test Case 2.5: Application Settings Validation
* **Goal**: Verify settings save uniquely per organization.
* **Steps**:
   1. Go to **Settings**.
   2. In the "Notification Days" field, change it from the default to `45, 10, 2`.
   3. Click "Save Settings".
* **Expected Result (Database)**: 
   1. Open Supabase -> Table Editor -> `app_settings` table.
   2. The `value` column for this school should successfully reflect `45, 10, 2` instead of the defaults.

---
*End of Manual QA Test Cycle. If all Expected Results match actual behavior, the core database schema, constraints, and platform APIs are confirmed stable.*
