import { createClient } from '@supabase/supabase-js'

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(
  supabaseUrl    || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

// ─── Auth ──────────────────────────────────────────────────
export const signUp = async ({ email, password, metadata }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
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

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// ─── Profiles ──────────────────────────────────────────────
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export const upsertProfile = async (profile) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single()
  return { data, error }
}

// ─── Properties ────────────────────────────────────────────
export const getProperties = async ({ limit = 20, offset = 0, filters = {} } = {}) => {
  let query = supabase
    .from('properties')
    .select(`
      *,
      seller:profiles!properties_seller_id_fkey(full_name, avatar_url),
      images:property_images(url, is_primary)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filters.type)     query = query.eq('property_type', filters.type)
  if (filters.minPrice) query = query.gte('price', filters.minPrice)
  if (filters.maxPrice) query = query.lte('price', filters.maxPrice)
  if (filters.state)    query = query.eq('state', filters.state)

  const { data, error } = await query
  return { data, error }
}

export const getPropertyById = async (id) => {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      seller:profiles!properties_seller_id_fkey(full_name, avatar_url, phone, email),
      images:property_images(url, is_primary, caption)
    `)
    .eq('id', id)
    .single()
  return { data, error }
}

export const createProperty = async (property) => {
  const { data, error } = await supabase
    .from('properties')
    .insert(property)
    .select()
    .single()
  return { data, error }
}

// ─── Swipes ────────────────────────────────────────────────
export const recordSwipe = async ({ userId, propertyId, action }) => {
  const { data, error } = await supabase
    .from('swipes')
    .upsert(
      { user_id: userId, property_id: propertyId, action },
      { onConflict: 'user_id,property_id' }
    )
  return { data, error }
}

export const getUserSwipes = async (userId) => {
  const { data, error } = await supabase
    .from('swipes')
    .select('property_id, action')
    .eq('user_id', userId)
  return { data, error }
}

// ─── Matches ───────────────────────────────────────────────
export const saveMatch = async ({ userId, propertyId, matchScore, matchReasons }) => {
  const { data, error } = await supabase
    .from('matches')
    .upsert(
      { user_id: userId, property_id: propertyId, match_score: matchScore, match_reasons: matchReasons },
      { onConflict: 'user_id,property_id' }
    )
    .select()
    .single()
  return { data, error }
}

export const getUserMatches = async (userId) => {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      property:properties(
        *,
        images:property_images(url, is_primary)
      )
    `)
    .eq('user_id', userId)
    .order('match_score', { ascending: false })
  return { data, error }
}

// ─── Professionals ─────────────────────────────────────────
export const getProfessionals = async ({ type } = {}) => {
  let query = supabase
    .from('professionals')
    .select('*')
    .eq('is_active', true)
    .eq('is_verified', true)

  if (type) query = query.eq('professional_type', type)

  const { data, error } = await query
  return { data, error }
}

export const createProfessionalApplication = async (application) => {
  const { data, error } = await supabase
    .from('professional_applications')
    .insert(application)
    .select()
    .single()
  return { data, error }
}
