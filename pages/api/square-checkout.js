// Charges a Square payment token via the Square Payments API.
//
// Card details are tokenized client-side by Square's Web Payments SDK
// (lib/squarePayments.js) — this route only ever sees the resulting
// single-use token, never raw card data.

import { fulfillOrder } from '../../lib/orderFulfillment';

const API_BASE = {
  sandbox: 'https://connect.squareupsandbox.com',
  production: 'https://connect.squareup.com',
};

const SQUARE_VERSION = '2024-01-18';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const environment = process.env.SQUARE_ENVIRONMENT === 'production' ? 'production' : 'sandbox';

  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID || process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
  if (!accessToken || !locationId) {
    return res.status(500).json({ error: 'SQUARE_ACCESS_TOKEN / SQUARE_LOCATION_ID are not set.' });
  }

  try {
    const { token, amount, items, eventId, url, paymentMethod, attribution, email } = req.body;

    if (!token) return res.status(400).json({ error: 'Missing card token' });
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (!items || items.length === 0) return res.status(400).json({ error: 'No items in cart' });

    const idempotencyKey = `si-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const response = await fetch(`${API_BASE[environment]}/v2/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Square-Version': SQUARE_VERSION,
      },
      body: JSON.stringify({
        source_id: token,
        idempotency_key: idempotencyKey,
        location_id: locationId,
        amount_money: {
          amount: Math.round(Number(amount) * 100),
          currency: 'USD',
        },
        autocomplete: true,
        buyer_email_address: email || undefined,
      }),
    });

    const raw = await response.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      console.error('Square charge — non-JSON response:', response.status, raw.slice(0, 500));
      return res.status(502).json({ error: `Square returned an unexpected response (${response.status}): ${raw.slice(0, 200) || 'empty body'}` });
    }

    if (!response.ok) {
      console.error('Square charge failed:', response.status, JSON.stringify(data));
      const message = data?.errors?.[0]?.detail || data?.errors?.[0]?.code || `Charge failed (${response.status})`;
      return res.status(response.status).json({ error: message });
    }

    const payment = data.payment;

    await fulfillOrder({
      id: payment.id,
      amount: Number(amount),
      items,
      eventId,
      url,
      req,
      paymentMethod: paymentMethod || 'Card',
      attribution,
    });

    return res.status(200).json({ id: payment.id, status: payment.status });
  } catch (error) {
    console.error('Square Payments error:', error);
    return res.status(500).json({ error: error.message });
  }
}
