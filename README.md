# EMIQ - Emissions Inquiry Platform for Jeedimetla

A comprehensive web application for tracking, managing, and verifying air quality emissions data in the Jeedimetla industrial area.

## 🎯 Overview

EMIQ is a role-based emissions tracking system designed for:
- **Contributors**: Submit emission data from industrial sources
- **Verifiers**: Review and approve/reject submitted data
- **Public Users**: View aggregated emissions on an interactive map

## 🔐 Authentication & Roles

The platform uses role-based access control (RBAC) with three main roles:

### Demo Accounts for Testing

For development and testing, quick-login buttons are available on the login page:

- **Contributor Account**
  - User ID: `MU012026`
  - Password: `contributor123`
  - Dashboard: Submit and track emission data submissions

- **Verifier Account**
  - User ID: `pcb012026`
  - Password: `verifier123`
  - Dashboard: Review and verify submissions

👉 **[Setup Instructions](./DEMO_ACCOUNTS_SETUP.md)** - Follow this guide to configure the demo accounts in your Supabase instance.

## ⚡ Quick Start

1. **Install dependencies**
   ```bash
   bun install
   ```

2. **Set up environment variables**
   - Create a `.env.local` file with your Supabase credentials

3. **Configure demo accounts**
   - Follow the [Demo Accounts Setup Guide](./DEMO_ACCOUNTS_SETUP.md)

4. **Run development server**
   ```bash
   bun run dev
   ```

5. **Login using demo credentials**
   - Go to `http://localhost:5173/auth`
   - Click the demo account buttons to test

## 📊 Features by Role

### 👤 Contributor Features
- Submit new emission data for grid cells
- Specify source type, industry, pollutant, and values
- Track submission status (Pending → Approved/Rejected)
- View personal submission history

### ✓ Verifier Features
- Review pending submissions from contributors
- Approve or reject submissions with comments
- Add confidence scores to verified data
- View audit trail of all reviews
- Access emission data by grid and source type

### 🌍 Public User Features
- View emissions map with color-coded grid cells
- Filter by pollutant type
- See aggregated emissions data
- No submission or verification capabilities

## 🏗️ Project Structure

```
src/
├── pages/                      # Page components
│   ├── Auth.tsx               # Login/signup page with demo account buttons
│   ├── Dashboard.tsx          # Role-based dashboard router
│   ├── Index.tsx              # Home page
│   └── NotFound.tsx           # 404 page
├── components/
│   ├── dashboards/            # Role-specific dashboards
│   │   ├── PublicDashboard.tsx
│   │   ├── ContributorDashboard.tsx
│   │   └── VerifierDashboard.tsx
│   ├── ui/                    # UI components (shadcn/ui)
│   ├── EmissionMap.tsx        # Interactive map
│   ├── Navbar.tsx             # Navigation bar
│   └── ProtectedRoute.tsx     # Route protection component
├── contexts/
│   └── AuthContext.tsx        # Authentication state management
├── hooks/
│   └── use-toast.ts           # Toast notification hook
├── integrations/
│   └── supabase/              # Supabase client and types
└── lib/
    ├── emissions.ts           # Emissions utilities
    └── utils.ts               # General utilities
```

## 🔒 Security

- **Role-based access control** enforced at database level (Supabase RLS policies)
- **Row-level security** on all tables
- **Automatic role assignment** when users create accounts
- **Audit trail** for all verification actions

## 📱 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Build Tool**: Vite
- **State Management**: React Context
- **Backend/DB**: Supabase (PostgreSQL + Auth)
- **Testing**: Vitest
- **Package Manager**: Bun

## 🚀 Deployment

### Production Checklist
- [ ] Remove demo account buttons from login page
- [ ] Configure production Supabase project
- [ ] Set up proper user authentication flow
- [ ] Configure environment variables
- [ ] Run security audit on RLS policies
- [ ] Test role-based access thoroughly
- [ ] Set up proper error monitoring
- [ ] Configure CI/CD pipeline

### Disabling Demo Accounts
To disable demo accounts in production, comment out the demo login section in `src/pages/Auth.tsx`.

## 📝 Database Schema

The system uses PostgreSQL with the following key tables:

- `auth.users` - Supabase authentication users
- `public.profiles` - User profile information
- `public.user_roles` - Role assignments
- `public.grids` - Geographic grid cells
- `public.emissions` - Aggregated emissions data
- `public.submissions` - Raw submission data
- `public.verification_logs` - Audit trail

See migrations in `supabase/migrations/` for full schema details.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly with different roles
4. Submit a pull request

## 📞 Support

For issues or questions:
1. Check the [Demo Accounts Setup Guide](./DEMO_ACCOUNTS_SETUP.md)
2. Review Supabase documentation
3. Check existing issues/discussions

---

**Created with ❤️ for air quality monitoring**

