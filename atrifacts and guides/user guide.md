# Rudra DS - Master User Guide

Welcome to the Rudra DS User Guide! This document provides a complete, step-by-step manual for using the Rudra DS platform. It is designed for both **Super Administrators** (those who own and run the entire SaaS platform) and **Driving School Administrators/Users** (the individual businesses using the software).

---

## Table of Contents

1. [Understanding User Roles](#1-understanding-user-roles)
2. [Getting Started (Login & Access)](#2-getting-started-login--access)
3. [Super Admin Guide (Platform Owners)](#3-super-admin-guide-platform-owners)
   - [Managing Organizations (Driving Schools)](#31-managing-organizations-driving-schools)
   - [Managing Users](#32-managing-users)
4. [Driving School Guide (Tenants)](#4-driving-school-guide-tenants)
   - [Dashboard Overview](#41-dashboard-overview)
   - [Managing Customers](#42-managing-customers)
   - [Managing Vehicles](#43-managing-vehicles)
   - [Managing Documents](#44-managing-documents)
   - [Settings & WhatsApp Reminders](#45-settings--whatsapp-reminders)

---

## 1. Understanding User Roles

Rudra DS is a "Multi-Tenant B2B Software as a Service (SaaS)" application. This means many businesses use the same software, but their data is kept completely separate and secure. 

There are two main types of users:

1. **Super Admin**: The platform owner. You can see everything across the entire platform. Your job is to create new Driving Schools (Organizations) and give the owners of those schools their login accounts. You use the `/admin` portal.
2. **User (Driving School Owner/Employee)**: The client. You can ONLY see the customers, vehicles, and documents that belong to your specific Driving School. You use the `/dashboard` portal.

---

## 2. Getting Started (Login & Access)

1. Navigate to the main application URL.
2. Enter your registered Email Address and Password.
3. Click **Sign In**.
4. The system will automatically detect your role:
   - If you are a **Super Admin**, you will be redirected to the **Master Admin Panel**.
   - If you are a **Driving School User**, you will be redirected to your specific **Business Dashboard**.

---

## 3. Super Admin Guide (Platform Owners)

If you have `super_admin` privileges, your main workspace is the **Admin Panel**.

### 3.1 Creating the First Super Admin Account
To create your very first Super Admin account to manage the platform, you must do this directly inside the **Supabase Dashboard** (since no admins exist yet to use the UI!):
1. Go to your Supabase Project Dashboard.
2. Navigate to **Authentication** -> **Users** and click **Add User** -> **Create New User**.
3. Enter your email and a strong password. Note: Supabase will automatically create a profile for you, but by default, it assigns the standard `user` role.
4. Navigate to the **Table Editor** -> select the `profiles` table.
5. Find the row with your newly created user ID/email, double-click the `role` cell, and change it from `user` to `super_admin`. 
6. Alternatively, you can run this SQL query in the Supabase SQL Editor: `UPDATE public.profiles SET role = 'super_admin' WHERE email = 'your-email@example.com';`
7. You can now log into the live application and access the master `/admin` portal!

### 3.2 Managing Organizations (Driving Schools)
Before a driving school can use the system, you must create an "Organization" for them.
* **Go to**: `Admin Panel` -> `Organizations`
* **Viewing**: You will see a list of all driving schools currently using the platform.
* **Adding a School**: Click "Add Organization". Fill out their Name, Contact Information, and create a unique "Slug" (a URL-friendly name like `rudra-driving-school`). Keep the "Active" toggle checked.
* **Editing/Deactivating**: You can click on an existing organization to update their phone number, email, or completely deactivate their account if they stop paying for the software.

### 3.2 Managing Users
After creating an Organization, you must create a User Account for the owner of that driving school so they can log in.
* **Go to**: `Admin Panel` -> `Users`
* **Adding a User**: Click "Add User". 
   * Enter their Full Name and Email Address.
   * **Crucial Step**: Select the specific "Organization" you just created from the dropdown menu. This connects the user securely to their business data.
   * Assign them a temporary password (they can reset it later).

---

## 4. Driving School Guide (Tenants)

If you are the owner or an employee of a Driving School, your main workspace is the **Dashboard**. Everything you do here is private and exclusive to your school.

### 4.1 Dashboard Overview
When you log in, you are greeted with the main Dashboard. Here you will see a high-level summary of your business:
* **Total Customers**: How many students/clients you have registered.
* **Total Vehicles**: Your fleet size.
* **Expiring Documents**: Alerts for any documents (like vehicle insurance or student licenses) that are expiring soon.

### 4.2 Managing Customers
Keep track of all the individuals taking driving lessons or renting vehicles.
* **Go to**: `Dashboard` -> `Customers`
* **Adding a Customer**: Click "New Customer".
   * Enter their Full Name, Email, Mobile Number, and **WhatsApp Number** (critical for automated notifications).
   * Note: The system will automatically generate a unique "Registration ID" (e.g., `RD-2024-XXXX`) for this customer upon saving. You do not need to create this manually!
* **Viewing/Editing**: Click any customer in the table to update their contact info or view the documents associated with them.

### 4.3 Managing Vehicles
Keep track of your fleet of cars, motorcycles, or trucks.
* **Go to**: `Dashboard` -> `Vehicles`
* **Adding a Vehicle**: Click "New Vehicle".
   * Enter the Vehicle Plate Number (e.g., `MH 12 AB 1234`), Type (Car/Bike), and Make/Model.
* **Viewing/Editing**: Click on a vehicle to see its history or the specific documents (PUC, Insurance, RC) tied to it.

### 4.4 Managing Documents
This is the core feature of the platform. You can attach important documents to either a specific **Customer** (like a Learner's License) or a specific **Vehicle** (like an Insurance Policy) and set expiration dates.
* **Go to**: `Dashboard` -> `Documents`
* **Uploading a Document**:
   1. Click "New Document".
   2. Choose the **Type of Document** (e.g., "Driving License", "Vehicle Insurance").
   3. Select the **Entity Type**: Does this document belong to a Customer or a Vehicle?
   4. Search and select the specific Customer or Vehicle from the dropdown.
   5. **Expiration Date**: Enter the exact date this document expires. *This step is critical for the WhatsApp reminders to function.*
   6. Upload the actual file/image of the document if required.

### 4.5 Settings & WhatsApp Reminders
Rudra DS has a powerful automated background system that sends out WhatsApp reminders when documents are about to expire. You can configure how this works for your specific school.
* **Go to**: `Dashboard` -> `Settings`
* **Notification Preferences**:
   * Here, you can configure how many days in advance the system should warn your customers (e.g., 30 days before, 15 days before, and 1 day before expiry).
   * Customize the specific text templates that get sent via the Meta WhatsApp API.
* *Note: The system checks for expiring documents automatically every single day at 9:00 AM IST. You do not have to click anything to send the messages; just ensure the Expiration Dates are entered accurately under the Documents tab!*

---
*Created automatically for Rudra DS using backend architectural analysis.*
