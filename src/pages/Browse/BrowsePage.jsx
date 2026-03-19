import { useState, useEffect, useCallback } from 'react'
import { SlidersHorizontal, RefreshCw } from 'lucide-react'
import SwipeCard from '@/components/matching/SwipeCard'
import { getProperties } from '@/lib/supabase'
import { getAIMatches, explainMatchScore } from '@/lib/pinecone'
import { useAuth } from '@/context/AuthContext'
import clsx from 'clsx'

const DEMO_PROPERTIES = [
  { id:'1', title:'4-Bed Detached Duplex',   property_type:'duplex',     listing_type:'For Sale', price:38_500_000,  city:'Victoria Island', state:'Lagos',     bedrooms:4, bathrooms:4, size_sqm:380, features:['Pool','BQ','Parking'], images:[] },
  { id:'2', title:'500sqm Dry Land',          property_type:'land',       listing_type:'For Sale', price:8_200_000,   city:'Uyo',             state:'Akwa Ibom', size_sqm:500, features:['C of O','Fenced'], images:[] },
  { id:'3', title:'Commercial Plaza',         property_type:'commercial',  listing_type:'For Sale', price:120_000_000, city:'Wuse 2',          state:'Abuja',     size_sqm:1200, features:['12 Units','Car Park'], images:[] },
  { id:'4', title:'3-Bed Terrace',            property_type:'terrace',    listing_type:'For Sale', price:22_000_000,  city:'Lekki Phase 1',   state:'Lagos',     bedrooms:3, bathrooms:3, size_sqm:220, features:['Estate','BQ'], images:[] },
  { id:'5', title:'200sqm Plot',              property_type:'land',       listing_type:'For Sale', price:4_500_000,   city:'Eket',            state:'Akwa Ibom', size_sqm:200, features:['Title Clear'], images:[] },
  { id:'6', title:'2-Bed Apartment',          property_type:'apartment',  listing_type:'For Sale', price:18_000_000,  city:'Ikeja GRA',       state:'Lagos',     bedrooms:2, bathrooms:2, size_sqm:140, features:['Solar','Security'], images:[] },
]

const DEMO_SCORES   = [92, 88, 76, 95, 83, 79]
const DEMO_REASONS  = [
  ['Within your budget', 'Family home goal', 'Has pool'],
  ['Land banking goal',  'In Akwa Ibom',     'Affordable'],
  ['Investment goal',    'Commercial type',  'High ROI area'],
  ['Family home goal',   'In Lagos',         'Estate living'],
  ['Land banking goal',  'Affordable',       'Clear title'],
  ['Investment goal',    'Has solar',        'Good location'],
]

const FILTERS = ['All', 'Land', 'Apartment', 'Duplex', 'Terrace', 'Commercial']

export default function BrowsePage() {
  const { profile } = useAuth()
  const [queue,   setQueue]   = useState([])
  const [filter,  setFilter]  = useState('All')
  const [loading, setLoading] = useState(true)
  const [empty,   setEmpty]   = useState(false)

  const loadProperties = useCallback(async () => {
    setLoading(true)
    setEmpty(false)

    const { data } = await getProperties({ limit: 20 })
    const list = data?.length ? data : DEMO_PROPERTIES

    // Score with demo values as fallback
    let scored = list.map((p, i) => ({
      ...p,
      matchScore:   DEMO_SCORES[i % DEMO_SCORES.length],
      matchReasons: DEMO_REASONS[i % DEMO_REASONS.length],
    }))

    // Try AI matching; silently fall back
    const prefs = profile?.buyer_preferences
    if (prefs) {
      try {
        const { matches } = await getAIMatches(prefs)
        if (matches?.length) {
          scored = matches.map(m => {
            const prop     = list.find(p => p.id === m.id) || list[0]
            const explained = explainMatchScore(m.score, prop, prefs)
            return { ...prop, matchScore: explained.score, matchReasons: explained.reasons }
          })
        }
      } catch (_) { /* keep demo scores */ }
    }

    scored.sort((a, b) => b.matchScore - a.matchScore)

    const filtered = filter === 'All'
      ? scored
      : scored.filter(p => p.property_type === filter.toLowerCase())

    setQueue(filtered)
    setLoading(false)
  }, [filter, profile])

  useEffect(() => { loadProperties() }, [loadProperties])

  const handleSwipe = useCallback((action, property) => {
    setQueue(q => {
      const next = q.filter(p => p.id !== property.id)
      if (next.length === 0) setEmpty(true)
      return next
    })
  }, [])

  const currentCard = queue[0]
  const nextCard    = queue[1]

  return (
    <div className="min-h-screen bg-cream pt-20 pb-10">
      <div className="max-w-lg mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-black text-deep">
              {profile?.full_name ? `Hey, ${profile.full_name.split(' ')[0]} 👋` : 'Browse Deals'}
            </h1>
            <p className="text-sm text-deep/40 mt-0.5">
              {loading ? 'Loading...' : `${queue.length} matches waiting`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadProperties}
              className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-deep/40 hover:text-deep transition-colors">
              <RefreshCw size={16} />
            </button>
            <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-deep/40 hover:text-deep transition-colors">
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto mb-8 -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0',
                filter === f ? 'bg-terracotta text-white shadow-glow' : 'bg-white text-deep/50 hover:text-deep'
              )}>
              {f}
            </button>
          ))}
        </div>

        {/* Card stack */}
        <div className="relative flex justify-center" style={{ height: 580 }}>
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="text-4xl animate-float">🏡</div>
              <p className="text-deep/30 text-sm">Finding your matches...</p>
            </div>
          ) : empty ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center px-8">
              <div className="text-6xl">🎉</div>
              <h3 className="font-display text-2xl font-black text-deep">You've seen them all!</h3>
              <p className="text-deep/40 text-sm leading-relaxed">
                Check back soon or change your filter for more deals.
              </p>
              <button onClick={loadProperties}
                className="btn-primary flex items-center gap-2 text-sm px-6 py-3">
                <RefreshCw size={14} /> Refresh Matches
              </button>
            </div>
          ) : (
            <>
              {/* Background (next) card */}
              {nextCard && (
                <div className="absolute inset-0 flex justify-center items-center pointer-events-none"
                  style={{ transform: 'scale(0.94) translateY(12px)', zIndex: 1 }}>
                  <div className="w-full max-w-sm bg-white rounded-[2rem] opacity-60"
                    style={{ height: 460, boxShadow: '0 12px 40px rgba(26,18,16,0.1)' }} />
                </div>
              )}

              {/* Active card */}
              {currentCard && (
                <div className="absolute inset-0 flex justify-center items-start" style={{ zIndex: 2 }}>
                  <SwipeCard
                    property={currentCard}
                    matchScore={currentCard.matchScore}
                    matchReasons={currentCard.matchReasons}
                    onSwipe={handleSwipe}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Swipe hints */}
        {!loading && !empty && (
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-deep/25">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-deep/8 flex items-center justify-center">✕</span> Pass
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center text-gold">★</span> Super like
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-terracotta/15 flex items-center justify-center">❤️</span> Like
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
