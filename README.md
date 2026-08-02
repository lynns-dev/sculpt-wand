# Smells Iconic — E-commerce (Next.js + Square + Stripe)

Blush-and-cream storefront for Smells Iconic body mists. Next.js 14
(Pages Router) with a custom, Shopify-style single-page checkout that
charges cards via Square, with Cash App Pay/Klarna/Afterpay/
Affirm as backup "or choose another way to pay" options via Stripe —
customers only ever see each method's own name, never "Stripe".

Placeholder graphics stand in for real product photography — see
"Notes before launch" below for what to swap in.

## Deploy to Vercel

1. Push this folder to a new GitHub repository.
2. In Vercel, **Add New → Project** and import the repo. Framework preset:
   **Next.js** (auto-detected). No build settings to change.
3. Add these Environment Variables in Vercel (Project → Settings → Environment
   Variables), then redeploy:

   | Name | Value |
   |------|-------|
   | `SQUARE_ACCESS_TOKEN` / `SQUARE_LOCATION_ID` | Sandbox or Production access token + location ID from the Square Developer Dashboard |
   | `SQUARE_ENVIRONMENT` / `NEXT_PUBLIC_SQUARE_ENVIRONMENT` | `sandbox` or `production` (keep both in sync) |
   | `NEXT_PUBLIC_SQUARE_APP_ID` / `NEXT_PUBLIC_SQUARE_LOCATION_ID` | public app ID + location ID, used client-side to render Square's card form |
   | `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Vercel KV / Upstash Redis store, used by `/admin` (auth sessions) and other server-side stores |
   | `NEXT_PUBLIC_BASE_URL` | your deployed URL, e.g. `https://smells-iconic.vercel.app` |
   | `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | API keys from your Stripe Dashboard, power the Cash App Pay/Klarna/Afterpay/Affirm options |
   | `STRIPE_WEBHOOK_SECRET` | signing secret for a webhook endpoint pointed at `/api/stripe-webhook`, subscribed to `payment_intent.succeeded` |

The site builds and renders fully without Square or Stripe configured —
only the final **Pay now**/"or choose another way to pay" step on `/checkout`
needs them. Get Square credentials from the Square Developer Dashboard
(developer.squareup.com/apps) — Sandbox credentials work immediately, while
Production access tokens require Square to activate the account for live
payments first. Test everything in `sandbox` first. See `DEPLOYMENT.md` for
the full walkthrough, including the Stripe setup.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev
```

## Structure

- `pages/index.jsx` — homepage (hero, collection, Babygirl spotlight, honest-math, reviews, formula, ritual, newsletter)
- `pages/shop.jsx` — full catalog grid
- `pages/product/[id].jsx` — product detail (static-generated per product)
- `pages/checkout.jsx` — custom single-page checkout (contact, delivery, payment, order summary)
- `pages/success.jsx` — post-checkout thank-you
- `pages/api/square-checkout.js` — charges a Square payment token via the Square Payments API
- `lib/squarePayments.js` — client-side card tokenization via Square's Web Payments SDK (loads `square.js`, attaches a card element, tokenizes on submit)
- `pages/api/stripe-payment-intent.js` — creates a Stripe PaymentIntent for whichever "or pay another way" method the customer picked
- `pages/api/stripe-webhook.js` — the only thing that actually records an order for those methods, once Stripe confirms the redirect-based charge succeeded
- `lib/altPaymentMethods.js` — the 4 backup methods (Cash App Pay, Klarna, Afterpay, Affirm) and their Stripe method types, shared by the checkout UI and API routes
- `lib/stripeServer.js` / `lib/stripeClient.js` — server and client Stripe SDK setup
- `lib/products.js` — product data (edit scents/prices here)
- `lib/theme.js` — design tokens (colors, fonts, shared styles)
- `lib/useCart.js` — cart Context provider, persisted to `localStorage` so it survives navigating to `/checkout`
- `components/` — Header, CartDrawer, ProductVisual

## Notes before launch

- Card numbers are tokenized in the browser (`lib/squarePayments.js`, via
  Square's Web Payments SDK) before submission — the server only ever sees
  a one-time token, not raw card data.
- **Square access tokens for production require Square's own account
  activation** beyond just having Sandbox credentials — see Step 1 in
  `DEPLOYMENT.md`. Always confirm the full flow works in `sandbox` first.
- **Test the Cash App Pay/Klarna/Afterpay/Affirm flows end-to-end in Stripe
  test mode before launch.** Each is a redirect to the provider's own
  authorization page and back — that round trip can only be verified with
  real Stripe test-mode keys and Stripe's own test credentials for each
  method, not from a build/lint pass. Confirm `/api/stripe-webhook` is
  actually receiving `payment_intent.succeeded` and creating orders in
  `/admin` before enabling any of these for real customers. Also confirm
  each method is enabled in Stripe Dashboard → Settings → Payment methods —
  a method not enabled there simply won't work even though it's coded here.
- Ratings and reviews on the homepage/product pages are **placeholders**.
  Connect a verified-review app and display only real reviews before launch.
- Confirm scent names, notes, and prices in `lib/products.js` match your catalog.
- **Product/lifestyle images are placeholder SVGs** (`public/images/si-*.svg`,
  blush/cream cards with the wordmark). Replace them with real bottle and
  lifestyle photography before launch — keep the same filenames referenced in
  `lib/products.js` and no code changes are needed.
