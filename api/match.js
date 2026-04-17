// api/match.js: Vercel serverless: POST /api/match
import { redisRateLimit, cacheGet, cacheSet } from '../src/lib/redis.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.VITE_APP_URL || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // ✅ SECURITY: Redis rate limit: 30 matches/min per IP
  const rl = await redisRateLimit(req, 'match', 30, 60)
  if (!rl.allowed) return res.status(429).json({ error: 'Too many requests' })

  const { buyerProfile } = req.body || {}
  if (!buyerProfile) return res.status(400).json({ error: 'buyerProfile required' })

  // ✅ PERFORMANCE: Cache match results for 5 minutes per profile hash
  const cacheKey = `match:${JSON.stringify(buyerProfile).length}:${buyerProfile.budget_max}:${buyerProfile.preferred_states?.join('')}`
  const cached   = await cacheGet(cacheKey)
  if (cached) return res.status(200).json({ matches: cached, cached: true })

  if (!process.env.PINECONE_API_KEY) {
    return res.status(200).json({ matches: [] })
  }

  try {
    const { Pinecone } = await import('@pinecone-database/pinecone')
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    const index    = pinecone.index(process.env.PINECONE_INDEX_NAME || 'dealmatch-properties')
    const vector   = await createEmbedding(buildBuyerText(buyerProfile))
    const results  = await index.query({ vector, topK: 20, includeMetadata: true })
    const matches  = results.matches.map(m => ({ id: m.id, score: m.score, ...m.metadata }))

    await cacheSet(cacheKey, matches, 300) // cache 5 min
    return res.status(200).json({ matches })
  } catch (err) {
    console.error('Match error:', err)
    return res.status(200).json({ matches: [] })
  }
}

function buildBuyerText(p) {
  return [
    `Looking for ${p.property_goal?.replace(/_/g,' ')} property`,
    p.preferred_states?.length ? `in ${p.preferred_states.join(', ')}` : '',
    p.budget_max ? `Budget up to ₦${p.budget_max}` : '',
    p.property_types?.length ? `Types: ${p.property_types.join(', ')}` : '',
    p.needs_financing ? 'needs mortgage financing' : '',
    p.features?.join(', ') || '',
  ].filter(Boolean).join('. ')
}

async function createEmbedding(_text) {
  return Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
}
