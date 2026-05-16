// Vercel serverless function — POST /api/create-checkout-session
// Deploy to Vercel. Set STRIPE_SECRET_KEY in Vercel env vars.
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PRODUCTS = {
  starter: {
    name: 'XCOPY::ARENA — Starter Pack (10 cards)',
    description: '10 random cards, 1 Legendary guaranteed. Physical edition.',
    unit_amount: 1499,   // $14.99
  },
  doom: {
    name: 'XCOPY::ARENA — Doom Pack (10 cards)',
    description: '10 cards, 2 Legendary guaranteed. Doom-weighted.',
    unit_amount: 1999,
  },
  legendary: {
    name: 'XCOPY::ARENA — Legendary Pack (10 cards)',
    description: '10 cards, 4 Legendary guaranteed. Premium collector.',
    unit_amount: 2999,
  },
  collector: {
    name: 'XCOPY::ARENA — Collector Box (50 cards)',
    description: '5 boosters + 1 exclusive holographic. Full set guarantee.',
    unit_amount: 9999,
  },
}

// Flat-rate shipping (USD cents)
const SHIPPING_US   = { name: 'Standard — US',            amount: 599  }
const SHIPPING_INTL = { name: 'Standard — International', amount: 1599 }
const SHIPPING_FREE = { name: 'Free Shipping',             amount: 0    }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { productId, quantity = 1, successUrl, cancelUrl } = req.body

  const product = PRODUCTS[productId]
  if (!product) {
    return res.status(400).json({ error: 'Invalid product' })
  }

  const qty = Math.max(1, Math.min(10, parseInt(quantity)))
  const isFreeShipping = productId === 'collector' && qty >= 2

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.unit_amount,
          },
          quantity: qty,
        },
      ],
      shipping_address_collection: {
        allowed_countries: [
          'US','CA','MX','GB','DE','FR','ES','IT','NL','AU','JP',
          'BR','AR','CL','CO','PE','SE','NO','DK','FI','PL','PT',
          'BE','AT','CH','CZ','HU','RO','BG','HR','SK','SI',
          'NZ','SG','HK','KR','TW','TH','MY','PH','ID',
        ],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            display_name: isFreeShipping ? SHIPPING_FREE.name : SHIPPING_US.name,
            fixed_amount: {
              amount: isFreeShipping ? 0 : SHIPPING_US.amount,
              currency: 'usd',
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            display_name: isFreeShipping ? SHIPPING_FREE.name : SHIPPING_INTL.name,
            fixed_amount: {
              amount: isFreeShipping ? 0 : SHIPPING_INTL.amount,
              currency: 'usd',
            },
          },
        },
      ],
      custom_fields: [
        {
          key: 'order_notes',
          label: { type: 'custom', custom: 'Order notes (optional)' },
          type: 'text',
          optional: true,
        },
      ],
      metadata: { productId, quantity: qty, source: 'xcopy.fun' },
      success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  cancelUrl  || `${process.env.NEXT_PUBLIC_SITE_URL}/#store`,
    })

    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err)
    res.status(500).json({ error: err.message })
  }
}
