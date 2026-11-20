# ISMAHUB LTD Technology Store Management System

A modern React + TypeScript storefront and retail operations experience. The interface includes:

- A responsive technology storefront and product catalog
- Separate customer account sign-in and registration at `/account`
- A staff-only management portal at `/admin`
- Product management and dashboard views

## Run locally

Configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` in a local `.env.local` file. Keep the secret key server-side; do not add it to a `VITE_` variable.

Start the API and Vite in separate terminals:

```bash
npm run dev:api
```

```bash
npm run dev
```

The Vite development server proxies `/api` requests to the local API on port 3000.

## Database setup

Apply the Supabase migrations in `supabase/migrations` in order before using the account flows. Customer registration also requires `20261118000009_customer_accounts.sql`. Email confirmation behavior follows the Supabase project’s Auth settings.

## Build

```bash
npm run build
```

