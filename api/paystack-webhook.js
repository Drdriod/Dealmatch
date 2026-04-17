// Paystack Webhook Handler: verifies payment events server-side
// Deployed as Vercel serverless function at /api/paystack-webhook

import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// ✅ SECURITY: timing-safe HMAC comparison (prevents timing attacks)
function verifySignature(secret, body, signature) {
  if (!secret || !signature) return false
  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(body))
    .digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
  } catch {
    return false
  }
}

// ✅ SECURITY: idempotency guard: track processed references in memory
// In production replace with Redis or a DB table
const processedRefs = new Set()

export default async function handler(req, res) {
  // ✅ SECURITY: method guard
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret    = process.env.PAYSTACK_SECRET_KEY
  const signature = req.headers['x-paystack-signature']

  // ✅ SECURITY: reject if no secret configured
  if (!secret) {
    console.error('PAYSTACK_SECRET_KEY not set')
    return res.status(500).json({ error: 'Server misconfiguration' })
  }

  // ✅ SECURITY: timing-safe signature check
  if (!verifySignature(secret, req.body, signature)) {
    console.error('Invalid Paystack webhook signature')
    return res.status(400).json({ error: 'Invalid signature' })
  }

  const event = req.body

  // ✅ SECURITY: validate event shape
  if (!event?.event || !event?.data) {
    return res.status(400).json({ error: 'Malformed event' })
  }

  try {
    switch (event.event) {

      case 'charge.success': {
        const { reference, amount, customer, metadata } = event.data
        if (!reference) break

        // ✅ SECURITY: idempotency: skip already-processed references
        if (processedRefs.has(reference)) {
          console.log('Duplicate webhook, skipping:', reference)
          break
        }
        processedRefs.add(reference)
        // Evict after 24h to prevent unbounded growth
        setTimeout(() => processedRefs.delete(reference), 86400000)

        const amountNgn = amount / 100

        // Activate in Supabase using service role
        if (process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
          const supabase = createClient(
            process.env.VITE_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
          )

          if (metadata?.type === 'professional_subscription') {
            const expiresAt = metadata.plan_type === 'annual'
              ? new Date(Date.now() + 365 * 86400000).toISOString()
              : new Date(Date.now() +  30 * 86400000).toISOString()
            await supabase.from('professionals')
              .update({
                is_active: true,
                subscription_plan: metadata.plan_type || 'monthly',
                subscription_started_at: new Date().toISOString(),
                subscription_expires_at: expiresAt,
              })
              .eq('email', customer.email)
            console.log('Professional activated:', customer.email)
          }

          if (metadata?.type === 'rental_listing_fee') {
            await supabase.from('properties')
              .update({ status: 'active' })
              .eq('payment_ref', reference)
            console.log('Rental listing activated:', reference)
          }

          if (metadata?.type === 'escrow_payment') {
            await supabase.from('escrow_transactions')
              .update({ status: 'funded', funded_at: new Date().toISOString() })
              .eq('payment_ref', reference)
            console.log('Escrow funded:', reference)
          }

          // Log every charge.success to payments table
          await supabase.from('payments').upsert({
            reference,
            amount:       amountNgn,
            currency:     'NGN',
            payment_type: metadata?.type || 'unknown',
            email:        customer.email,
            status:       'success',
            verified_at:  new Date().toISOString(),
          }, { onConflict: 'reference', ignoreDuplicates: true })
        }
        break
      }

      case 'transfer.success':
        console.log('Transfer successful:', event.data.reference)
        break

      case 'transfer.failed':
        console.error('Transfer failed:', event.data.reference)
        break

      case 'charge.dispute.create':
        console.warn('Dispute created:', event.data.reference)
        break

      default:
        // Don't log unknown events in detail: potential info leak
        break
    }

    return res.status(200).json({ received: true })

  } catch (err) {
    console.error('Webhook processing error:', err.message)
    return res.status(500).json({ error: 'Processing failed' })
  }
}
