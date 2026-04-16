import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// ─── Auth helpers ─────────────────────────────────────────
export const signUp = async ({ email, password, fullName }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  return { data, error }
}

export const signIn = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset`,
  })
  return { data, error }
}

// ─── Profile helpers ──────────────────────────────────────
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

// ─── Property helpers ─────────────────────────────────────
export const createProperty = async (payload) => {
  const { data, error } = await supabase
    .from('properties')
    .insert(payload)
    .select()
    .single()
  return { data, error }
}

export const getProperties = async ({ limit = 20, filters = {} } = {}) => {
  let query = supabase
    .from('properties')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters.state)         query = query.eq('state', filters.state)
  if (filters.city)          query = query.ilike('city', `%${filters.city}%`)
  if (filters.property_type) query = query.eq('property_type', filters.property_type)
  if (filters.listing_type)  query = query.eq('listing_type', filters.listing_type)
  if (filters.min_price)     query = query.gte('price', filters.min_price)
  if (filters.max_price)     query = query.lte('price', filters.max_price)
  if (filters.category)      query = query.eq('category', filters.category)

  const { data, error } = await query
  return { data, error }
}

export const getProperty = async (id) => {
  const { data, error } = await supabase
    .from('properties')
    .select('*, profiles(full_name, phone, avatar_url)')
    .eq('id', id)
    .single()
  return { data, error }
}

// ─── Swipe / Match helpers ────────────────────────────────
export const recordSwipe = async ({ userId, propertyId, action }) => {
  const { error } = await supabase.from('swipes').upsert({
    user_id:     userId,
    property_id: propertyId,
    action,
    created_at:  new Date().toISOString(),
  }, { onConflict: 'user_id,property_id' })
  return { error }
}

export const getMatches = async (userId) => {
  const { data, error } = await supabase
    .from('swipes')
    .select('*, properties(*)')
    .eq('user_id', userId)
    .in('action', ['like', 'super'])
    .order('created_at', { ascending: false })
  return { data, error }
}

// ─── Onboarding ───────────────────────────────────────────
export const completeOnboarding = async (userId, profileData) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...profileData,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

// ─── Avatar upload ────────────────────────────────────────
export const uploadAvatar = async (userId, file) => {
  const ext      = file.name.split('.').pop()
  const fileName = `${userId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { cacheControl: '3600', upsert: true, contentType: file.type })

  if (uploadError) return { url: null, error: uploadError }

  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
  return { url: data.publicUrl, error: null }
}
