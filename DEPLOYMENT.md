# Smells Iconic Full E-Commerce Site — Deployment Guide

This is a Next.js e-commerce site with a full product catalog, detailed product pages, shopping cart, and a custom checkout page that charges cards directly via Square (no Shopify, no hosted redirect). Built in Smells Iconic's blush-and-cream, internet-archive aesthetic.

## What You Get

- **Homepage** with hero, featured products, brand story, and value proposition
- **Product catalog page** with all Smells Iconic body mists
- **Individual product detail pages** with full descriptions, scent notes, and product specifications
- **Shopping cart** (persists across pages via localStorage, sticky sidebar)
- **Custom single-page checkout** (`/checkout`, styled after Shopify's checkout) that charges Square directly
- **Deployed to Vercel** (free, automatic scaling, HTTPS included)

---

## Step 1: Set Up Square

1. Go to https://developer.squareup.com/apps and sign in (or create a Square account).
2. Create a new application.
3. On the **Credentials** tab (Sandbox sub-tab to start), grab the **Sandbox Access Token** and a **Sandbox Location ID** (Locations tab, or `https://connect.squareupsandbox.com/v2/locations` via the API). These go in `SQUARE_ACCESS_TOKEN` / `SQUARE_LOCATION_ID`.
4. Grab the **Sandbox Application ID** too — that's `NEXT_PUBLIC_SQUARE_APP_ID`, and reuse the same location ID as `NEXT_PUBLIC_SQUARE_LOCATION_ID` (safe to expose client-side; it's not a secret).
5. When you're ready to take real charges, switch to the **Production** sub-tab for a separate Application ID / Access Token / Location ID, and set `SQUARE_ENVIRONMENT` / `NEXT_PUBLIC_SQUARE_ENVIRONMENT` to `production`. **Production access requires Square to activate the account for live payments** (business verification, roughly analogous to Stripe/PayPal's own underwriting) — this is a common source of charges failing even with valid-looking credentials, so confirm everything works in `sandbox` first.

---

## Step 1B: Set Up Stripe (backup "or pay another way" options)

Square handles the card form. Below it, checkout also offers
Cash App Pay, Klarna, Afterpay, and Affirm as radio-button alternatives —
these are processed through Stripe, but the checkout UI never uses the word
"Stripe" anywhere a customer can see it; each shows only under its own name.

1. Go to https://dashboard.stripe.com and sign in (or create a Stripe account).
2. Make sure you're in **Test mode** (toggle, top right) while setting this up.
3. **Developers → API keys**: copy the **Publishable key** into
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and the **Secret key** into
   `STRIPE_SECRET_KEY`.
4. **Settings → Payment methods**: enable **Cash App Pay**, **Klarna**,
   **Afterpay/Clearpay**, and **Affirm**. A method that's coded here but not
   enabled in this list will simply fail when a customer picks it — this is
   the single most common reason one of these stops working.
5. **Developers → Webhooks → Add endpoint**:
   - Endpoint URL: `https://YOUR_DOMAIN/api/stripe-webhook`
   - Events to send: `payment_intent.succeeded`
   - Copy the **Signing secret** it gives you into `STRIPE_WEBHOOK_SECRET`.
   - This webhook is not optional — it's the only place an order placed
     through one of these four methods actually gets recorded (see
     `pages/api/stripe-webhook.js` for why: these are redirect-based, so
     fulfillment can't happen synchronously the way it does for Square).
6. Test each method with Stripe's published test flows for that method
   (Stripe's docs for each payment method list a test scenario — there's no
   generic "test card number" equivalent for Klarna/Afterpay/Affirm since
   they redirect to a real-looking authorization step). Confirm the order
   shows up in `/admin` after each one.
7. Only after all four are confirmed working in test mode, switch the
   Dashboard to **Live mode** and repeat steps 3–5 with the live keys/webhook.

---

## Step 2: Deploy to Vercel

### Option A: Quick Deploy (Recommended)

1. Go to https://vercel.com and sign up (or log in with GitHub)
2. Click "New Project" → "Import Git Repository"
3. Select this repo
4. Click "Deploy"
5. After deployment, go to "Settings" → "Environment Variables"
6. Add:
   - `SQUARE_ACCESS_TOKEN` / `SQUARE_LOCATION_ID`: from Step 1
   - `SQUARE_ENVIRONMENT`, `NEXT_PUBLIC_SQUARE_APP_ID`, `NEXT_PUBLIC_SQUARE_LOCATION_ID`, `NEXT_PUBLIC_SQUARE_ENVIRONMENT`: from Step 1, both environment vars `sandbox` (or both `production` once activated — see Step 1)
   - `KV_REST_API_URL` / `KV_REST_API_TOKEN`: from a KV store (Vercel Storage → Marketplace → Upstash, or a standalone Upstash Redis database — same REST API either way)
   - `NEXT_PUBLIC_BASE_URL`: your Vercel domain (e.g., `https://smells-iconic.vercel.app`)
   - `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET`: from Step 1B
7. Redeploy by going to "Deployments" → last deployment → "Redeploy"
8. Point the Stripe webhook from Step 1B at this same deployed domain once you know it (Vercel gives you the URL after the first deploy — update the webhook endpoint URL in Stripe if you created it against a placeholder earlier)

### Option B: Deploy via Git

1. Push this folder to a GitHub repo
2. Connect that repo to Vercel
3. Add environment variables (same as above)
4. Vercel auto-deploys every push

---

## Step 3: Connect Your Domain (Squarespace)

1. In Vercel, go to "Settings" → "Domains"
2. Click "Add Domain"
3. Enter the domain you want (e.g., `checkout.smellsiconic.com`)
4. Vercel will show you nameservers or CNAME record to add
5. In Squarespace:
   - Go to Settings → Domains
   - Find your domain settings
   - Add the Vercel DNS records
   - Wait ~24 hours for DNS to propagate
6. Once DNS is live, Vercel will auto-generate an SSL certificate

---

## Step 4: Test the Checkout

1. Go to your deployed domain
2. Add a product to the cart and click "Checkout"
3. In sandbox mode, use one of Square's [test card numbers](https://developer.squareup.com/docs/testing/test-values)
4. Check your Square Sandbox Dashboard (Payments) — the charge should appear

---

## Customizing Products

All products live in `lib/products.js`.

To change them:
1. Edit `lib/products.js`
2. Update product names, prices, images, descriptions, scent notes
3. Push to GitHub (or redeploy to Vercel)
4. Changes go live automatically

---

## Site Structure

### Pages
- `/` — Homepage with hero, featured products, brand story
- `/shop` — Full product catalog
- `/product/[id]` — Individual product detail pages
- `/checkout` — Custom single-page checkout
- `/success` — Order confirmation page

### Components
- `Header.jsx` — Navigation, cart button, logo
- `CartDrawer.jsx` — Slide-in cart, links to `/checkout`
- Product data at `lib/products.js`

### Architecture
- **Frontend**: Next.js React app (all pages)
- **Cart state**: React Context (`lib/useCart.js`), persisted to `localStorage` so it survives navigation to `/checkout`
- **Backend**: Vercel serverless functions at `/api/square-checkout` (charges a card token via the Square Payments API)
- **Payments**: Square — card details are tokenized client-side (`lib/squarePayments.js`, via Square's Web Payments SDK) before ever reaching the server
- **Hosting**: Vercel (free tier handles all traffic)

---

## Security Notes

- `SQUARE_ACCESS_TOKEN` lives only in Vercel's environment variables (never in code)
- Card numbers are tokenized in the browser before submission — the server only ever sees a one-time token, not raw card data
- HTTPS is automatic (Vercel provides free SSL)

---

## Troubleshooting

**Charge fails and credentials look correct:**
- Double check `SQUARE_ACCESS_TOKEN` / `SQUARE_LOCATION_ID` and `SQUARE_ENVIRONMENT` all come from the same Sandbox-or-Production tab in the Square Developer Dashboard — mixing a Sandbox token with `SQUARE_ENVIRONMENT=production` (or vice versa) will fail
- For `production`, confirm the Square account has been activated for live payments (see Step 1) — this is the most common reason a charge fails even though the same flow works fine in `sandbox`

**"KV_REST_API_URL / KV_REST_API_TOKEN are not set" error:**
- Provision a KV store (Vercel Storage → Marketplace → Upstash, or a standalone Upstash Redis database) and add its REST URL/token to your environment variables

**Domain not connecting:**
- DNS can take 24–48 hours to propagate
- Check Vercel's domain status (should show green ✓)

---

## Next Steps

1. Deploy this to Vercel
2. Provision a KV store and add `KV_REST_API_URL` / `KV_REST_API_TOKEN`, plus Square's Sandbox credentials (`SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `NEXT_PUBLIC_SQUARE_APP_ID`, `NEXT_PUBLIC_SQUARE_LOCATION_ID`, both environment vars set to `sandbox` — see Step 1)
3. Test a full checkout with a Square sandbox test card
4. When ready for real charges, swap to the Production Application ID/Access Token/Location ID, switch `SQUARE_ENVIRONMENT` / `NEXT_PUBLIC_SQUARE_ENVIRONMENT` to `production`
5. Connect your domain
