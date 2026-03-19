// api/payments/verify.js — Vercel serverless function
// POST /api/payments/verify → verify Paystack payment + activate professional

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { reference } = req.body || {}
  if (!reference) return res.status(400).json({ error: 'reference required' })

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return res.status(500).json({ error: 'Paystack secret key not configured' })
  }

  try {
    // 1. Verify with Paystack
    const paystackRes  = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization:  `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })
    const paystackData = await paystackRes.json()

    if (!paystackData.status || paystackData.data?.status !== 'success') {
      return res.status(400).json({ success: false, error: 'Payment not successful' })
    }

    const { metadata, amount, customer } = paystackData.data

    // 2. Activate professional in Supabase
    if (process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      )

      const expiresAt = metadata?.plan_type === 'annual'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() +  30 * 24 * 60 * 60 * 1000).toISOString()

      await supabase
        .from('professionals')
        .update({
          is_active:               true,
          subscription_plan:       metadata?.plan_type,
          subscription_started_at: new Date().toISOString(),
          subscription_expires_at: expiresAt,
        })
        .eq('email', customer.email)

      // Log payment
      await supabase.from('payments').insert({
        reference,
        amount:            amount / 100,
        currency:          'NGN',
        professional_type: metadata?.professional_type,
        plan_type:         metadata?.plan_type,
        email:             customer.email,
        status:            'success',
      })
    }

    return res.status(200).json({ success: true, reference })
  } catch (error) {
    console.error('Verification error:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}
