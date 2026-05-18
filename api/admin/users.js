// api/admin/users.js
// Admin-only endpoint — fetches all users using service role key (bypasses RLS)
// Protected: only admin/agent/verifier roles can call this

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
function getAnonClient() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!['GET','POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' })

  const rl = await redisRateLimit(req, 'admin_users', 60, 60)
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests' })

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })

  const anonClient = getAnonClient()
  const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''))
  if (authErr || !user) return res.status(401).json({ error: 'Invalid session' })

  const { data: callerProfile } = await anonClient.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = ADMIN_EMAILS.has(user.email) || ADMIN_ROLES.has(callerProfile?.role)
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' })

  const svc = getServiceClient()

  if (req.method === 'GET') {
    const page   = Math.max(0, parseInt(req.query.page  || '0'))
    const limit  = Math.min(100, parseInt(req.query.limit || '50'))
    const search = (req.query.search || '').trim().substring(0, 100)
    const role   = req.query.role || ''
    const from   = page * limit
    const to     = from + limit - 1

    let q = svc.from('profiles')
      .select('id,full_name,email,phone,role,is_photo_verified,is_live_verified,onboarding_completed,created_at,identity_verification_status,is_deactivated', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    if (role)   q = q.eq('role', role)

    const { data, count, error } = await q
    if (error) { console.error(error.message); return res.status(500).json({ error: 'Fetch failed' }) }
    return res.status(200).json({ users: data || [], total: count || 0, page, limit })
  }

  if (req.method === 'POST') {
    const { action, userId, role: newRole, reason } = req.body || {}
    if (!userId || typeof userId !== 'string') return res.status(400).json({ error: 'userId required' })

    const { data: target } = await svc.from('profiles').select('email,role').eq('id', userId).single()
    if (ADMIN_EMAILS.has(target?.email)) return res.status(403).json({ error: 'Cannot modify superadmin' })

    const ALLOWED_ACTIONS = new Set(['set_role','suspend','unsuspend','deactivate'])
    if (!ALLOWED_ACTIONS.has(action)) return res.status(400).json({ error: 'Invalid action' })
    const ALLOWED_ROLES = new Set(['buyer','seller','renter','landlord','agent','investor','student','verifier','admin','suspended'])
    if (action === 'set_role' && !ALLOWED_ROLES.has(newRole)) return res.status(400).json({ error: 'Invalid role' })

    let update = {}
    if (action === 'set_role')   update = { role: newRole }
    if (action === 'suspend')    update = { role: 'suspended' }
    if (action === 'unsuspend')  update = { role: target?.role === 'suspended' ? 'buyer' : target?.role }
    if (action === 'deactivate') update = { is_deactivated: true }

    const { error: updateErr } = await svc.from('profiles').update(update).eq('id', userId)
    if (updateErr) { console.error(updateErr.message); return res.status(500).json({ error: 'Update failed' }) }

    await svc.from('admin_audit_log').insert({
      action: `admin_${action}`, target_id: userId,
      performed_by: user.id,
      metadata: { new_role: newRole, reason: reason?.substring(0, 200) },
      created_at: new Date().toISOString(),
    }).catch(() => {})

    return res.status(200).json({ success: true })
  }
}
