// api/match.js — Vercel serverless function
// POST /api/match → returns AI-matched properties

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { buyerProfile } = req.body || {}
  if (!buyerProfile) return res.status(400).json({ error: 'buyerProfile required' })

  // Guard: no Pinecone key = return empty gracefully
  if (!process.env.PINECONE_API_KEY) {
    return res.status(200).json({ matches: [] })
  }

  try {
    const { Pinecone } = await import('@pinecone-database/pinecone')
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    const index    = pinecone.index(process.env.PINECONE_INDEX_NAME || 'dealmatch-properties')

    const queryVector = await createEmbedding(buildBuyerText(buyerProfile))

    const results = await index.query({
      vector:          queryVector,
      topK:            20,
      includeMetadata: true,
      filter:          buildFilter(buyerProfile) || undefined,
    })

    const matches = results.matches.map(m => ({
      id:    m.id,
      score: m.score,
      ...m.metadata,
    }))

    return res.status(200).json({ matches })
  } catch (error) {
    console.error('Match API error:', error)
    return res.status(200).json({ matches: [] }) // fail gracefully
  }
}

function buildBuyerText(p) {
  return [
    `Looking for ${p.property_goal?.replace(/_/g, ' ')} property`,
    p.preferred_states?.length ? `in ${p.preferred_states.join(', ')}` : '',
    p.budget_max ? `Budget up to ₦${p.budget_max}` : '',
    p.property_types?.length ? `Property types: ${p.property_types.join(', ')}` : '',
    p.needs_financing ? 'needs mortgage financing' : '',
    p.features?.join(', ') || '',
    p.lifestyle_notes || '',
  ].filter(Boolean).join('. ')
}

function buildFilter(p) {
  const f = {}
  if (p.budget_max)             f.price         = { '$lte': Number(p.budget_max) }
  if (p.preferred_states?.length) f.state       = { '$in': p.preferred_states }
  if (p.property_types?.length)   f.property_type = { '$in': p.property_types }
  return Object.keys(f).length ? f : null
}

async function createEmbedding(_text) {
  // Replace with real embedding (OpenAI / Cohere) in production
  return Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
}
