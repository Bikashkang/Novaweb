# Novadoc - Healthcare Appointment Booking Platform

Novadoc is a modern healthcare platform that enables patients to find doctors, book appointments (video or in-clinic), and manage their healthcare needs. The platform supports multiple user roles (patients, doctors, and admins) with role-based access control.

## 🏗️ Architecture

This is a monorepo containing:

- **Frontend**: Next.js 14 application with React, TypeScript, and Tailwind CSS
- **Backend API**: NestJS REST API (currently minimal, can be extended)
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS) policies
- **Authentication**: Supabase Auth (email/password and phone OTP)

## ✨ Features

### For Patients
- Browse and search for doctors
- Book appointments (video consultations or in-clinic visits)
- View appointment history and status
- Real-time appointment status updates
- Book diagnostic tests

### For Doctors
- View and manage appointment bookings
- Accept/decline appointment requests
- Access patient information for their appointments
- Manage appointment status

### For Admins
- Manage user roles (patient, doctor, admin)
- Assign doctor identifiers (slugs)
- View all users and profiles
- Full system administration capabilities

## 🛠️ Tech Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Database & Auth**: Supabase
- **Backend**: NestJS
- **Language**: TypeScript
- **Validation**: Zod

## 📁 Project Structure

```
novaweb/
├── apps/
│   └── api/                 # NestJS API backend
│       └── src/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── admin/           # Admin pages
│   │   ├── auth/            # Authentication pages
│   │   ├── dashboard/       # User dashboard
│   │   ├── doctor/          # Doctor-specific pages
│   │   ├── doctors/         # Doctor listing and booking
│   │   └── my/              # Patient-specific pages
│   ├── components/          # React components
│   ├── lib/                 # Utility libraries
│   │   └── supabase/        # Supabase client configuration
│   └── styles/              # Global styles
├── supabase/
│   ├── migrations/          # Database migrations
│   └── schema.sql           # Database schema
└── package.json
```

## 🗄️ Database Schema

### Core Tables

#### `profiles`
Extended user profiles linked to Supabase Auth users:
- `id` (UUID, FK to auth.users)
- `role` (patient | doctor | admin)
- `doctor_slug` (unique identifier for doctors)
- `full_name`, `phone`
- `created_at`, `updated_at`

#### `appointments`
Appointment bookings:
- `id` (bigint, primary key)
- `patient_id` (UUID, FK to auth.users)
- `doctor_id` (UUID, FK to auth.users)
- `doctor_identifier` (text, FK to profiles.doctor_slug)
- `appt_date` (date)
- `appt_time` (text)
- `appt_type` (video | in_clinic)
- `status` (pending | accepted | declined | cancelled)
- `created_at` (timestamptz)

### Row Level Security (RLS)

The database uses Supabase RLS policies to enforce security:

- **Profiles**: Users can read/update their own profile. Admins can read/update all profiles. Doctors can read patient profiles for their appointments.
- **Appointments**: Patients can create and view their own appointments. Doctors can view and update appointments assigned to them. Role changes are restricted to admins only.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd novaweb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   
   Run the migrations in order:
   ```bash
   # Apply migrations using Supabase CLI or dashboard
   supabase migration up
   ```
   
   Or manually execute the SQL files in `supabase/migrations/` in chronological order.

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Start the API server** (optional, in a separate terminal)
   ```bash
   cd apps/api
   npm run start:dev
   ```

The application will be available at `http://localhost:3000`.

## 🔐 Authentication

The platform supports multiple authentication methods:

1. **Email/Password**: Traditional sign-up and sign-in
2. **Phone OTP**: SMS-based authentication

After authentication, users are redirected to the dashboard where their role determines available features.

## 👥 User Roles

### Patient (Default)
- Browse doctors
- Book appointments
- View own appointments
- Book diagnostic tests

### Doctor
- All patient capabilities
- View and manage appointment bookings
- Accept/decline appointments
- Access patient information for appointments

### Admin
- All system capabilities
- Manage user roles
- Assign doctor identifiers
- View all users and profiles

## 📱 Key Pages

- `/` - Homepage with doctor search and categories
- `/auth/sign-in` - Sign in page
- `/auth/sign-up` - Sign up page
- `/auth/phone-otp` - Phone OTP authentication
- `/dashboard` - User dashboard (role-based)
- `/doctors` - Browse and book doctors
- `/my/bookings` - Patient appointment history
- `/doctor/bookings` - Doctor appointment management
- `/admin/roles` - Admin role management
- `/diagnostics` - Diagnostic test booking

## 🔄 How It Works

### Appointment Booking Flow

1. **Patient browses doctors** (`/doctors`)
   - System fetches all profiles with `role = 'doctor'`
   - Displays doctor cards with booking interface

2. **Patient selects appointment details**
   - Date (future dates only)
   - Time (15-minute slots from 00:00 to 23:45)
   - Type (video or in-clinic)

3. **Appointment creation**
   - System inserts into `appointments` table
   - RLS ensures patient can only create appointments for themselves
   - Status defaults to `pending`

4. **Real-time updates**
   - Patients see status updates via Supabase realtime subscriptions
   - Doctors can update appointment status (accept/decline)

### Role Management

- Roles are stored in the `profiles` table
- Only admins can change roles (enforced by database trigger)
- Doctor role requires a `doctor_slug` for appointment matching
- Admins assign doctor slugs via `/admin/roles`

### Security

- **Authentication**: Handled by Supabase Auth
- **Authorization**: Enforced by RLS policies at the database level
- **Data Access**: Users can only access data they're authorized to see
- **Role Changes**: Protected by database triggers (admin-only)

## 🧪 Development

### Running Tests

```bash
# Frontend (if tests are added)
npm test

# API tests
cd apps/api
npm test
```

### Building for Production

```bash
# Build frontend
npm run build

# Start production server
npm start

# Build API
cd apps/api
npm run build
npm run start:prod
```

## 📝 Database Migrations

Migrations are located in `supabase/migrations/` and should be applied in order:

1. `20251031070000_init.sql` - Initial schema (profiles, appointments, RLS)
2. `20251031071000_profiles_rls_fix.sql` - RLS policy fixes
3. `20251031071500_profiles_doctor_patient_read.sql` - Doctor-patient profile access
4. `20251031072500_admins_table_and_policies.sql` - Admin policies
5. `20251031073500_fix_profiles_recursion.sql` - Fix recursive policy issues
6. `20251031074500_appointments_doctor_id_and_rls.sql` - Add doctor_id to appointments
7. `20251031075500_remove_recursive_profiles_policy.sql` - Remove recursive policies
8. `20251031080500_drop_status_check.sql` - Remove status constraint
9. `20251101090000_admin_list_users_rpc.sql` - Admin RPC function
10. `20251101090500_profiles_backfill_and_trigger.sql` - Profile backfill and triggers

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🐛 Troubleshooting

### Common Issues

**"Missing Supabase env vars"**
- Ensure `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**RLS Policy Errors**
- Verify migrations have been applied in order
- Check that user roles are correctly set in the `profiles` table

**Appointment Booking Fails**
- Ensure doctor has a `doctor_slug` set
- Verify user is authenticated
- Check RLS policies allow the operation

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)



