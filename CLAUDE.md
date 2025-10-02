# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Guadzefie is a farm-to-table e-commerce platform built with React, TypeScript, Vite, and Supabase. The application supports three user roles: **consumers** (regular shoppers), **farmers/vendors** (product sellers), and **admins** (platform managers).

## Common Commands

```bash
# Development
npm run dev                    # Start development server with HMR

# Building
npm run build                  # TypeScript compile + Vite build
npm run build:css              # Build and minify Tailwind CSS
npm run build:all              # Build CSS and production bundle
npm run preview                # Preview production build

# Code Quality
npm run lint                   # Run ESLint

# Database Operations
npm run apply-migration        # Apply database migrations
npm run apply-migrations       # Apply multiple migrations
npm run seed-database          # Seed database with initial data
npm run update-categories      # Update product categories
npm run set-admin             # Set admin privileges for a user
```

## Architecture

### Role-Based Routing

The application uses a hierarchical routing structure with role-based access control:

- **Public Routes** (`/`): MainLayout - Home, products, cart, auth pages
- **Consumer Routes** (`/consumer/*`): ConsumerLayout - Dashboard, orders, wishlist, addresses, profile
- **Farm Routes** (`/farm/*`): FarmLayout - Dashboard, products, orders, deliveries, customers, reports
- **Admin Routes** (`/admin/*`): AdminLayout - Dashboard, products, categories, discounts, orders, customers

Role authorization is enforced by [PrivateRoute](src/components/auth/PrivateRoute.tsx) component, which reads user data from localStorage and checks `is_admin` and `is_farm` flags.

### State Management

The application uses React Context API for global state:

- **[AuthContext](src/contexts/AuthContext.tsx)**: Authentication state, user sessions, sign in/out
  - Uses custom localStorage-based auth alongside Supabase auth
  - Creates "fake sessions" to work with Supabase RLS policies
  - Polls localStorage every 5 seconds to detect user changes

- **[ProductContext](src/contexts/ProductContext.tsx)**: Product catalog, cart, wishlist, recently viewed
  - Cart and wishlist persist to localStorage
  - Fetches products with category relationships using Supabase foreign keys
  - Uses `products_category_id_fkey` for category joins

- **[ShippingAddressContext](src/contexts/ShippingAddressContext.tsx)**: Delivery address management
  - Manages multiple addresses with default selection

- **[PaymentMethodContext](src/contexts/PaymentMethodContext.tsx)**: Payment method management

- **[VendorContext](src/contexts/VendorContext.tsx)**: Vendor/farm application and management

### Authentication Flow

The app uses a **hybrid authentication system**:

1. Primary: Custom auth stored in `localStorage.user` (JSON object with `id`, `email`, `is_farm`, `is_admin`)
2. Fallback: Supabase auth with session tokens

[AuthContext](src/contexts/AuthContext.tsx) creates "fake Supabase sessions" from localStorage user data to satisfy RLS policies. The [getCurrentUser()](src/lib/supabase.ts:99) helper in [supabase.ts](src/lib/supabase.ts) retrieves the current user.

### Database Integration

- **Backend**: Supabase (PostgreSQL)
- **Client**: [@supabase/supabase-js](https://www.npmjs.com/package/@supabase/supabase-js)
- **Connection**: [src/lib/supabase.ts](src/lib/supabase.ts) - Configured with custom localStorage wrapper and auth headers

**Important Database Patterns**:
- When fetching products with categories, always use the specific foreign key relationship: `categories!products_category_id_fkey(id, name, slug)`
- RLS policies rely on `auth.uid()` matching the user ID from fake sessions
- Custom auth headers (`X-Custom-User-Id`, `X-Custom-User-Email`) are added to all Supabase requests

### Migrations

Database schema changes are managed through SQL migration files in `scripts/migrations/`. Apply migrations with:
```bash
npm run apply-migration        # Single migration (interactive)
npm run apply-migrations       # All pending migrations
```

Common migrations include:
- [create_shipping_addresses_table.sql](scripts/migrations/create_shipping_addresses_table.sql) - Shipping address feature

### Theme System

The app supports dark/light mode:
- Theme preference stored in `localStorage.darkMode` (boolean)
- Applied via CSS classes on `document.documentElement` (`dark`/`light` class)
- System preference detection as fallback
- Theme toggle available in all authenticated layouts (Admin, Farm, Consumer)

### Payment Integration

- **Paystack**: Integrated via [react-paystack](https://www.npmjs.com/package/react-paystack)
- Payment flow: [CheckoutPage](src/pages/CheckoutPage.tsx) → [PaystackPayment](src/components/payment/PaystackPayment.tsx) → [OrderSuccessPage](src/pages/OrderSuccessPage.tsx)

## Key Files and Patterns

### Entry Points
- [src/main.tsx](src/main.tsx) - React app initialization
- [src/App.tsx](src/App.tsx) - Root component with all route definitions and context providers

### Layout Components
- [MainLayout](src/components/layout/MainLayout.tsx) - Public pages with Navbar and Footer
- [AdminLayout](src/components/layout/AdminLayout.tsx) - Admin dashboard with AdminSidebar
- [FarmLayout](src/components/layout/FarmLayout.tsx) - Farm dashboard with sidebar
- [ConsumerLayout](src/components/layout/ConsumerLayout.tsx) - Consumer portal with sidebar

### Critical Context Initialization Order
In [App.tsx](src/App.tsx), contexts are nested in this order (outer to inner):
1. HelmetProvider (SEO)
2. AuthProvider
3. ProductProvider
4. ShippingAddressProvider
5. PaymentMethodProvider

### Environment Variables
Configure in `.env` or `.env.local`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_SUPABASE_PROJECT_ID` - Supabase project ID (optional, defaults to `itbuxujsotcgexofbrwq`)

## Development Notes

### User Roles
- Consumer: `is_farm: false`, `is_admin: false`
- Farm/Vendor: `is_farm: true`, `is_admin: false`
- Admin: `is_admin: true`

Role precedence: Admin > Farm > Consumer

### Debugging Auth Issues
A debug helper is available in development mode:
```javascript
// In browser console
window.debugNavigation.checkAuth()  // Check current auth state
window.debugNavigation.clearAuth()  // Clear auth and redirect to login
```

### Product Queries
Always use the explicit foreign key when joining products with categories:
```typescript
supabase.from('products').select(`
  *,
  categories!products_category_id_fkey(id, name, slug)
`)
```

### Toast Notifications
Uses [react-hot-toast](https://www.npmjs.com/package/react-hot-toast) configured in [App.tsx](src/App.tsx) with theme-aware styling.

## Vendor Management System

The platform includes a vendor/farm management system:
- [VendorApplicationPage](src/pages/VendorApplicationPage.tsx) - Application form for new vendors
- [VendorManagementPage](src/pages/admin/VendorManagementPage.tsx) - Admin approval interface
- [VendorPerformancePage](src/pages/admin/VendorPerformancePage.tsx) - Performance analytics
- [VendorAnalyticsDashboard](src/pages/vendor/VendorAnalyticsDashboard.tsx) - Vendor-facing analytics
- [CommissionPayoutPage](src/pages/vendor/CommissionPayoutPage.tsx) - Commission tracking

Commission calculation utility: [src/utils/commissionCalculator.ts](src/utils/commissionCalculator.ts)
