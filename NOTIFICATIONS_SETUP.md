# WhatsApp Notification Setup Guide

This guide explains how to set up automated WhatsApp notifications for document expiry reminders.

## Overview

The system sends WhatsApp notifications to customers when their documents (or their vehicle's documents) are about to expire. Notifications are sent on configurable reminder days (default: 7, 3, 1, 0 days before expiry).

## Prerequisites

1. **Meta (Facebook) Business Account** with WhatsApp Business API access
2. **WhatsApp Business API Template** named `expiry_alert` approved
3. **GitHub Repository** with Actions enabled

## Step 1: Create WhatsApp Template

In your Meta Business Suite, create a template with:
- **Name:** `expiry_alert`
- **Language:** English
- **Body:** Example format:
  ```
  Hello {{1}}, 
  
  This is a reminder that your {{2}} is expiring in {{3}} days.
  
  Please renew it at the earliest.
  
  - Rudra Driving School
  ```
  Where:
  - `{{1}}` = Customer name
  - `{{2}}` = Document name (e.g., "Insurance (MH12AB1234)")
  - `{{3}}` = Days until expiry

## Step 2: Get WhatsApp API Credentials

From Meta Business Suite → WhatsApp → API Setup:
1. **Phone Number ID** - Your WhatsApp phone ID
2. **Access Token** - Generate a permanent access token

## Step 3: Configure GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret Name | Value |
|-------------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Your Supabase anon key |
| `WHATSAPP_TOKEN` | Meta WhatsApp API token |
| `WHATSAPP_PHONE_ID` | Meta WhatsApp phone number ID |

## Step 4: Configure Reminder Days (Optional)

In your Supabase `app_settings` table, add/update:
- **key:** `notification_days`
- **value:** `7,3,1,0` (comma-separated days)

## Step 5: Test the System

### Manual Test (from GitHub Actions)
1. Go to Actions tab in your GitHub repo
2. Select "Daily WhatsApp Alerts"
3. Click "Run workflow" → Run

### Local Test
```bash
# Set FORCE_SEND_ALL=true to test without waiting for specific days
FORCE_SEND_ALL=true node scripts/send-notifications.js
```

## Schedule

The workflow runs automatically at **9:00 AM IST daily** (configured in `.github/workflows/daily-notifications.yml`).

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No mobile number found" | Ensure customers have valid phone numbers |
| "Template not approved" | Wait for Meta to approve your template |
| "Invalid token" | Regenerate your WhatsApp API token |
| "Rate limit exceeded" | Meta limits ~250 msgs/day for test numbers |

## Files

- `scripts/send-notifications.js` - Main notification script
- `.github/workflows/daily-notifications.yml` - GitHub Actions workflow
- `app/dashboard/settings/page.tsx` - UI for notification settings
