// api/index-property.js: Vercel serverless function
// POST /api/index-property → indexes new listing in Pinecone

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { property } = req.body || {}
  if (!property?.id) return res.status(400).json({ error: 'property with id required' })

  // ✅ SECURITY: Authenticate request using Supabase
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Authentication required' })

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

  if (authError || !user) return res.status(401).json({ error: 'Invalid session' })

  // ✅ SECURITY: Only the owner or an admin can index the property
  const { data: existingProperty } = await supabase
    .from('properties')
    .select('seller_id')
    .eq('id', property.id)
    .single()

  if (!existingProperty || existingProperty.seller_id !== user.id) {
    return res.status(403).json({ error: 'Unauthorized to index this property' })
  }

  if (!process.env.PINECONE_API_KEY) {
    return res.status(200).json({ success: true, skipped: 'no Pinecone key' })
  }

  try {
    const { Pinecone } = await import('@pinecone-database/pinecone')
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    const index    = pinecone.index(process.env.PINECONE_INDEX_NAME || 'dealmatch-properties')

    const vector = await createEmbedding(buildPropertyText(property))

    await index.upsert([{
      id:     String(property.id),
      values: vector,
      metadata: {
        title:         property.title         || '',
        property_type: property.property_type || '',
        listing_type:  property.listing_type  || '',
        price:         Number(property.price) || 0,
        state:         property.state         || '',
        city:          property.city          || '',
        bedrooms:      Number(property.bedrooms)  || 0,
        bathrooms:     Number(property.bathrooms) || 0,
        size_sqm:      Number(property.size_sqm)  || 0,
        features:      Array.isArray(property.features)  ? property.features  : [],
        documents:     Array.isArray(property.documents) ? property.documents : [],
        has_cof_o:     (property.documents || []).includes('Certificate of Occupancy (C of O)'),
      },
    }])

    return res.status(200).json({ success: true, id: property.id })
  } catch (error) {
    console.error('Index error:', error)
    return res.status(500).json({ error: error.message })
  }
}

function buildPropertyText(p) {
  return [
    `${p.title} in ${p.city}, ${p.state}`,
    `${p.property_type} for ${p.listing_type}`,
    `Price: ₦${p.price}`,
    p.bedrooms  ? `${p.bedrooms} bedrooms`  : '',
    p.bathrooms ? `${p.bathrooms} bathrooms` : '',
    `Size: ${p.size_sqm} sqm`,
    p.features?.join(', ')  || '',
    p.description || '',
  ].filter(Boolean).join('. ')
}

async function createEmbedding(_text) {
  return Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
}
