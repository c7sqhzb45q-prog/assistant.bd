# Lovable ↔ assistant.bd (API integration)

This repo includes a minimal API Gateway you can connect to a Lovable app.

## 1) Run the API Gateway locally

```bash
cd "/Users/sojib/Documents/New project/assistant.bd"
npm install
npm run -w @assistant.bd/api-gateway dev
```

Default URL: `http://localhost:3001`

Health check: `GET /health`

Billing:

- `GET /billing/plans` - list configured subscription plans.
- `POST /billing/checkout` - create a Stripe Checkout Session.
- `POST /billing/portal` - create a Stripe Customer Portal Session.
- `POST /billing/webhook` - Stripe webhook receiver for subscription events.

## 2) Get an OpenAPI spec (Swagger)

When the API Gateway is running:

- Swagger UI: `http://localhost:3001/docs`
- OpenAPI JSON: `http://localhost:3001/docs-json`

If you deploy the API publicly, the same paths work on your production domain.

## 3) Deploy (so Lovable can reach it)

Lovable needs a public HTTPS URL.

Options:
- Deploy the `assistant.bd` monorepo to your preferred host (Render/Fly.io/VPS/etc).
- For quick testing from your laptop, use a tunnel (e.g. ngrok) to expose `http://localhost:3001` as `https://...`.

## 4) Configure CORS for your Lovable app

Set `CORS_ORIGIN` in your API Gateway environment to your Lovable published URL (or your custom domain).

Examples:

```env
# single origin
CORS_ORIGIN=https://your-app.lovable.app

# multiple origins
CORS_ORIGIN=http://localhost:3000,https://your-app.lovable.app
```

## 5) Set up Supabase for data + auth

If you want login, users, API keys, or subscription state, wire up Supabase too.

See:

- `../SUPABASE_SETUP.md` - full setup guide
- `../SUPABASE_SCHEMA.sql` - copy/paste SQL for the database tables

Core env vars:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 6) In Lovable: integrate the API

### Option A: Quick testing

Paste this into Lovable:

> Integrate my API.  
> Base URL: `https://YOUR_PUBLIC_API_DOMAIN`  
> OpenAPI spec: `https://YOUR_PUBLIC_API_DOMAIN/docs-json`  
> No auth for now.  
> Create a simple “Health” check that calls `GET /health` and displays the response.

### Option B: Production with auth

If you have API keys or auth enabled, use Lovable secrets or an Edge Function so secrets stay server-side.

Paste this into Lovable:

> Integrate my API with authentication.  
> Base URL: `https://YOUR_PUBLIC_API_DOMAIN`  
> OpenAPI spec: `https://YOUR_PUBLIC_API_DOMAIN/docs-json`  
> Authentication: Bearer token stored in Cloud → Secrets as `MY_API_KEY`  
> Include header: `Authorization: Bearer ${MY_API_KEY}`  
> Create a health page plus a simple workflows list using the protected endpoints.
