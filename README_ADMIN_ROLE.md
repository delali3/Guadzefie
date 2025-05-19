# Admin Role Implementation

This document outlines the changes made to implement admin role functionality in the Guadzefie application.

## Database Changes

1. Added `is_admin` field to the `users` table through migration file `migrations/add_admin_role.sql`:
   - Boolean field defaulting to `false`
   - Created an index for faster queries
   - Added RLS policies for admin users
   - Created utility functions to grant/revoke admin privileges

## Authentication Flow Changes

1. Updated `PrivateRoute` component (`src/components/auth/PrivateRoute.tsx`):
   - Modified role detection to check for `is_admin` field rather than user metadata
   - Updated routing logic to handle admin role appropriately

2. Updated `LoginPage` component (`src/pages/auth/LoginPage.tsx`):
   - Added `is_admin` field to session data stored in localStorage
   - Updated logging to include admin status information

3. Updated `RegisterPage` component (`src/pages/auth/RegisterPage.tsx`):
   - Added `is_admin` field with default value of `false` to new user records

## Admin Management

1. Created admin management script (`scripts/set_admin_privileges.ts`):
   - Command-line tool to grant/revoke admin privileges
   - Usage: `npm run set-admin -- user@example.com` or `npm run set-admin -- user@example.com --revoke`
   - Added script to `package.json`

## How to Make a User an Admin

There are two ways to make a user an admin:

1. Using the script:
   ```
   npm run set-admin -- user@example.com
   ```

2. Using SQL (via Supabase dashboard):
   ```sql
   UPDATE users
   SET is_admin = true
   WHERE email = 'user@example.com';
   ```

## How Admin Login Works

1. Users log in through the standard login process
2. During login, the `is_admin` field is retrieved and stored in the user session
3. `PrivateRoute` checks for `is_admin: true` to grant access to admin routes
4. Admin users are redirected to `/admin` dashboard automatically

## Security Considerations

1. Row-Level Security (RLS) policies have been updated to allow admin users to access all data
2. Admin privileges are checked on both client and server sides
3. Database functions for granting/revoking admin privileges use `SECURITY DEFINER` to ensure they run with appropriate privileges 