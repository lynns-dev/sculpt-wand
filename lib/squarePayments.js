// Square Web Payments SDK — client-side card tokenization.
//
// Unlike the old QuickBooks flow, Square doesn't let raw card values be
// typed into our own <input> fields. Instead we lazy-load square.js,
// initialize Square.payments(appId, locationId), and attach a `card`
// payment method to a container div — Square renders its own secure
// iframe-based card input inside it. tokenizeCard() then asks that
// attached card element for a single-use token, which is sent to
// /api/square-checkout and charged server-side via the Square Payments API.

const SDK_URL = {
  sandbox: 'https://sandbox.web.squarecdn.com/v1/square.js',
  production: 'https://web.squarecdn.com/v1/square.js',
};

function environment() {
  return process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
}

let sdkLoadPromise = null;

function loadSquareSdk() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Square SDK can only load in the browser.'));
  if (window.Square) return Promise.resolve(window.Square);
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-square-sdk]');
    const onLoad = () => (window.Square ? resolve(window.Square) : reject(new Error('Square SDK failed to load.')));
    if (existing) {
      existing.addEventListener('load', onLoad);
      existing.addEventListener('error', () => reject(new Error('Square SDK failed to load.')));
      return;
    }
    const script = document.createElement('script');
    script.src = SDK_URL[environment()];
    script.async = true;
    script.dataset.squareSdk = 'true';
    script.addEventListener('load', onLoad);
    script.addEventListener('error', () => reject(new Error('Square SDK failed to load.')));
    document.head.appendChild(script);
  });
  return sdkLoadPromise;
}

// Loads the SDK, initializes payments, and attaches a card element to the
// given container element ID. Returns the attached `card` instance — keep
// it around to call tokenizeCard(card) on submit and card.destroy() on
// unmount.
export async function attachCard(containerId, cardStyle) {
  const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID;
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
  if (!appId || !locationId) {
    throw new Error('Square is not configured (NEXT_PUBLIC_SQUARE_APP_ID / NEXT_PUBLIC_SQUARE_LOCATION_ID missing).');
  }

  const Square = await loadSquareSdk();
  const payments = Square.payments(appId, locationId);
  const card = await payments.card(cardStyle ? { style: cardStyle } : undefined);
  await card.attach(`#${containerId}`);
  return card;
}

// card: the attached card instance from attachCard(). Resolves to a
// single-use payment token string.
export async function tokenizeCard(card) {
  const result = await card.tokenize();
  if (result.status !== 'OK') {
    const detail = result.errors?.[0]?.message || 'Card tokenization failed. Please check your card details.';
    throw new Error(detail);
  }
  return result.token;
}
