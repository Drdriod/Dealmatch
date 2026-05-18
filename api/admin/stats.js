// api/admin/stats.js
// Returns platform-wide stats for admin overview — bypasses RLS via service role

import { createClient } from '@supabase/supabase-js'
import { redisRateLimit } from '../../src/lib/redis.js'

const ALLOWED_ORIGIN = process.env.APP_URL || process.env.VITE_APP_URL || 'https://dealmatch-yvdm.vercel.app'
const ADMIN_ROLES    = new Set(['admin', 'agent', 'verifier'])
const ADMIN_EMAILS   = new Set(['divineandbassey@gmail.com', 'prosperwithbassey@gmail.com'])

function getServiceClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const rl = await redisRateLimit(req, 'admin_stats', 30, 60)
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests' })

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })

  const anonClient = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
  const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''))
  if (authErr || !user) return res.status(401).json({ error: 'Invalid session' })

  const { data: cp } = await anonClient.from('profiles').select('role').eq('id', user.id).single()
  if (!ADMIN_EMAILS.has(user.email) && !ADMIN_ROLES.has(cp?.role)) return res.status(403).json({ error: 'Forbidden' })

  const svc = getServiceClient()

  try {
    const [
      { count: totalUsers },
      { count: activeListings },
      { count: pendingListings },
      { count: totalPros },
      { count: pendingIdentity },
      { count: mortgageApps },
      { count: rentalEnquiries },
      { data: payments },
      { data: recentUsers },
      { data: recentProps },
    ] = await Promise.all([
      svc.from('profiles').select('*', { count: 'exact', head: true }),
      svc.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      svc.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
      svc.from('professional_applications').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      svc.from('profiles').select('*', { count: 'exact', head: true }).eq('identity_verification_status', 'submitted'),
      svc.from('mortgage_applications').select('*', { count: 'exact', head: true }),
      svc.from('rental_enquiries').select('*', { count: 'exact', head: true }),
      svc.from('payments').select('amount').eq('status', 'success'),
      svc.from('profiles').select('id,full_name,email,role,created_at').order('created_at', { ascending: false }).limit(5),
      svc.from('properties').select('id,title,status,created_at,profiles(full_name)').order('created_at', { ascending: false }).limit(8),
    ])

    const totalRevenue = (payments || []).reduce((s, p) => s + (p.amount || 0), 0)

    return res.status(200).json({
      totalUsers:      totalUsers      || 0,
      activeListings:  activeListings  || 0,
      pendingListings: pendingListings || 0,
      totalPros:       totalPros       || 0,
      pendingIdentity: pendingIdentity || 0,
      mortgageApps:    mortgageApps    || 0,
      rentalEnquiries: rentalEnquiries || 0,
      totalRevenue,
      recentUsers:     recentUsers || [],
      recentProps:     recentProps || [],
    })
  } catch (err) {
    console.error('Admin stats error:', err.message)
    return res.status(500).json({ error: 'Stats unavailable' })
  }
}
