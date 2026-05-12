# Role-Based Authentication Implementation Guide

## 📋 What Has Been Implemented

This guide explains the role-based authentication system that has been implemented for the EMIQ platform.

## ✅ Features Implemented

### 1. **Demo Account Login Buttons** ⚡
- **Location**: Auth page (`/auth`)
- **Features**: 
  - One-click login for Contributor account
  - One-click login for Verifier account
  - Buttons appear under "Demo Accounts" section
  - Both load directly without manual credential entry

### 2. **Credentials Configured** 🔑

#### Contributor Account
```
User ID: MU012026
Password: contributor123
Role: contributor
Access: Contributor Dashboard - submit and track emission data
```

#### Verifier Account
```
User ID: pcb012026
Password: verifier123
Role: verifier
Access: Verifier Dashboard - review and verify submissions
```

### 3. **Role-Based Dashboard Routing** 🎯
- **Public Users**: See public emissions map
- **Contributors**: See submission form and tracking dashboard
- **Verifiers**: See review dashboard with all submissions
- **Unauthenticated Users**: Redirected to login with helpful message

### 4. **Access Control Components** 🔒
- **ProtectedRoute.tsx**: Reusable component for route protection
- **Dashboard.tsx**: Enhanced with role-based rendering
- **AuthContext.tsx**: Existing role management system
- **Supabase RLS**: Database-level security policies

## 🚀 Quick Start for Users

### For Testing/Development

1. **Navigate to login page**: `http://localhost:5173/auth`

2. **Click demo account button**:
   - Click "👤 Contributor Login" for contributor dashboard
   - Click "✓ Verifier Login" for verifier dashboard

3. **Automatic redirection**: After login, you're taken to the appropriate dashboard

### For Production Setup

1. **Assign roles** (follow [DEMO_ACCOUNTS_SETUP.md](./DEMO_ACCOUNTS_SETUP.md)):
   ```sql
   INSERT INTO public.user_roles (user_id, role) 
   VALUES 
     ('MU012026', 'contributor'),
     ('pcb012026', 'verifier');
   ```

2. **Verify**: Login buttons should work immediately

## 📁 Files Modified/Created

### Modified Files
1. **src/pages/Auth.tsx**
   - Added `performLogin()` helper function
   - Added `handleDemoLogin()` function
   - Added demo account buttons UI
   
2. **src/pages/Dashboard.tsx**
   - Added Alert component for unauthenticated users
   - Improved role-based rendering logic
   - Added helpful sign-in message

3. **README.md**
   - Complete project documentation
   - Setup instructions
   - Feature overview

### New Files Created
1. **src/components/ProtectedRoute.tsx**
   - Route protection wrapper component
   - Can be used for additional protected routes
   
2. **src/config/demoAccounts.ts**
   - Demo account configuration
   - Role descriptions and permissions
   - Feature access matrix
   
3. **DEMO_ACCOUNTS_SETUP.md**
   - Detailed setup instructions
   - Supabase configuration guide
   - Production considerations

4. **supabase/seed-demo-accounts.sql**
   - SQL helper script
   - Role assignment queries
   - Cleanup/reset commands

## 🔐 Security Architecture

### Authentication Flow
```
User clicks demo button
    ↓
Credentials: User ID + Password
    ↓
Supabase Auth (user_id/password)
    ↓
Session created in auth.users table
    ↓
AuthContext fetches role from user_roles table
    ↓
Role assigned (public_user, contributor, or verifier)
    ↓
Dashboard rendered based on role
```

### Database Security
- **Row-Level Security (RLS)**: Enabled on all tables
- **Role-based policies**: Different access for each role
- **Audit trail**: All actions logged in verification_logs table
- **Data isolation**: Each role only sees relevant data

### Frontend Security
- **Protected components**: Dashboard checks user + role
- **Context-based auth**: React Context for state management
- **Supabase JWT**: Secure token-based authentication
- **Route protection**: Unauthenticated users redirected to `/auth`

## 🎯 User Workflows

### Contributor Workflow
1. Click "👤 Contributor Login" button
2. Redirected to Contributor Dashboard
3. Can submit emission data
4. Can track submission status
5. Can view personal submissions

### Verifier Workflow
1. Click "✓ Verifier Login" button
2. Redirected to Verifier Dashboard
3. Can review pending submissions
4. Can approve/reject with notes
5. Can view all submissions and audit trail

### Public User Workflow
1. Visit app without logging in
2. Can view public dashboard
3. Can see emissions map
4. View-only access
5. Can click login to become contributor/verifier

## 🧪 Testing Checklist

- [ ] Demo buttons appear on auth page
- [ ] Contributor button logs in with correct credentials
- [ ] Verifier button logs in with correct credentials
- [ ] Contributor sees contributor dashboard
- [ ] Verifier sees verifier dashboard
- [ ] Logout and login works
- [ ] Unauthenticated users see alert on dashboard
- [ ] Manual login with email/password works
- [ ] Signup with role selection works
- [ ] Role is properly persisted in database

## 🛠️ Customization

### Changing Demo Credentials
Edit `src/pages/Auth.tsx` in the demo button onClick handlers:
```typescript
onClick={() => handleDemoLogin("NEW_USER_ID", "newpassword123")}
// Change the user ID and password as needed
```

Also update the button in your demo UI to reflect the new credentials.

### Adding More Roles
1. Update the `AppRole` type in `AuthContext.tsx`
2. Add new dashboard component in `components/dashboards/`
3. Update `Dashboard.tsx` with new role case
4. Create RLS policies in Supabase migrations

### Disabling Demo Buttons (for Production)
Comment out the demo section in `src/pages/Auth.tsx`:
```typescript
{/* Demo Accounts Section - Disabled for production */}
```

## 📚 Related Documentation

- [Setup Guide](./DEMO_ACCOUNTS_SETUP.md) - Detailed Supabase setup
- [README.md](./README.md) - Project overview
- [supabase/seed-demo-accounts.sql](./supabase/seed-demo-accounts.sql) - SQL setup script
- [src/config/demoAccounts.ts](./src/config/demoAccounts.ts) - Configuration reference

## ❓ Troubleshooting

### Demo buttons don't work
- [ ] Check Supabase connection
- [ ] Verify demo accounts exist in Supabase
- [ ] Check browser console for errors
- [ ] Ensure roles are assigned in user_roles table

### Login redirects to auth page
- [ ] Check if user is properly created in Supabase
- [ ] Verify role is in user_roles table
- [ ] Check Supabase RLS policies

### Wrong dashboard displayed
- [ ] Verify role in Supabase Dashboard
- [ ] Check user_roles table for correct assignment
- [ ] Clear browser cache/cookies

## 🚀 Next Steps

1. ✅ Setup demo accounts in Supabase
2. ✅ Test login flows
3. ✅ Verify dashboards display correctly
4. Add additional features as needed
5. Configure production environment
6. Disable demo accounts for production
7. Set up user management system

---

**Implementation complete! The system is ready for testing and development.**
