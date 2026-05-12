# Demo Accounts Setup Guide

This document explains how to set up the demo accounts for testing the Contributor and Verifier roles.

## Demo Credentials

The application includes quick-login buttons for two demo accounts:

### Contributor Account
- **User ID**: `MU012026`
- **Password**: `contributor123`
- **Role**: `contributor`

### Verifier Account
- **User ID**: `pcb012026`
- **Password**: `verifier123`
- **Role**: `verifier`

## Setup Instructions

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following query to assign roles:
```sql
INSERT INTO public.user_roles (user_id, role) 
VALUES 
  ('MU012026', 'contributor'),
  ('pcb012026', 'verifier')
ON CONFLICT (user_id, role) DO NOTHING;
```

4. Verify the roles were assigned:
```sql
SELECT user_id, role FROM public.user_roles 
WHERE user_id IN ('MU012026', 'pcb012026');
```

## Verification

After setup, you should be able to:

1. Go to the login page (`/auth`)
2. See "Demo Accounts" section with two quick-login buttons
3. Click "👤 Contributor Login" to test the contributor dashboard
4. Click "✓ Verifier Login" to test the verifier dashboard

## What Each Role Can Do

### Contributor
- **Access**: Contributor Dashboard
- **Permissions**: Submit new emission data for grid cells
- **View**: Their own submissions and status

### Verifier
- **Access**: Verifier Dashboard
- **Permissions**: Review and approve/reject contributor submissions
- **Capabilities**: Add verification notes and confidence scores

### Public User
- **Access**: Public Dashboard
- **Permissions**: View-only access to the emissions map
- **Restrictions**: Cannot submit or verify data

## Resetting Demo Accounts

If you need to reset the demo accounts:

1. Delete any associated records from the `user_roles` table:
```sql
DELETE FROM public.user_roles 
WHERE user_id IN ('MU012026', 'pcb012026');
```
2. Recreate them following the setup instructions above

## Production Considerations

For production:
- **Do NOT use demo accounts** in live environments
- Remove or disable the demo account buttons from the login page
- Use your organization's proper user management system
- Implement strong password requirements
- Use proper SSO/OAuth integrations if available
