import { useState, useEffect, useCallback } from 'react'
import { SlidersHorizontal, RefreshCw } from 'lucide-react'
import SwipeCard from '@/components/matching/SwipeCard'
import { getProperties } from '@/lib/supabase'
import { getAIMatches, explainMatchScore } from '@/lib/pinecone'
import { useVerificationGuard } from '@/hooks/useVerificationGuard'
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
  ['Within your budget','Family home goal','Has pool'],
  ['Land banking goal','In Akwa Ibom','Affordable'],
  ['Investment goal','Commercial type','High ROI area'],
  ['Family home goal','In Lagos','Estate living'],
  ['Land banking goal','Affordable','Clear title'],
  ['Investment goal','Has solar','Good location'],
]
const FILTERS = ['All','Land','Apartment','Duplex','Terrace','Commercial']

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
    let scored = list.map((p, i) => ({
      ...p,
      matchScore:   DEMO_SCORES[i % DEMO_SCORES.length],
      matchReasons: DEMO_REASONS[i % DEMO_REASONS.length],
    }))
    if (filter !== 'All') {
      scored = scored.filter(p => p.property_type === filter.toLowerCase())
    }
    if (!scored.length) { setEmpty(true); setLoading(false); return }
    setQueue(scored)
    setLoading(false)
  }, [filter])

  useEffect(() => { loadProperties() }, [loadProperties])

  const handleSwipe = (action, property) => {
    setQueue(q => {
      const next = q.filter(p => p.id !== property.id)
      if (!next.length) setEmpty(true)
      return next
    })
  }

  return (
    <div className="min-h-screen pt-20 pb-24" style={{ backgroundColor: '#F5EDE0' }}>
      <div className="max-w-sm mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-2xl font-black" style={{ color: '#1A1210' }}>
              Browse Deals 🏡
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#8A7E78' }}>
              {queue.length} propert{queue.length === 1 ? 'y' : 'ies'} matching your profile
            </p>
          </div>
          <button onClick={loadProperties}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(26,18,16,0.08)' }}>
            <RefreshCw size={16} style={{ color: '#5C4A3A' }} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto mb-6 pb-1" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-all flex-shrink-0"
              style={{
                backgroundColor: filter === f ? '#1A1210' : '#FFFFFF',
                color:           filter === f ? '#FFFFFF'  : '#5C4A3A',
                borderColor:     filter === f ? '#1A1210'  : '#E8DDD2',
              }}>
              {f}
            </button>
          ))}
        </div>

        {/* Swipe stack */}
        {loading && (
          <div className="flex items-center justify-center h-80">
            <div className="text-center">
              <div className="text-4xl mb-3 animate-bounce">🏠</div>
              <p className="text-sm" style={{ color: '#8A7E78' }}>Finding your matches...</p>
            </div>
          </div>
        )}

        {!loading && empty && (
          <div className="rounded-3xl p-10 text-center" style={{ backgroundColor: '#FFFAF5' }}>
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="font-display font-black text-xl mb-2" style={{ color: '#1A1210' }}>
              You've seen everything!
            </h3>
            <p className="text-sm mb-6" style={{ color: '#8A7E78' }}>
              Check your matches or refresh for new listings.
            </p>
            <button onClick={loadProperties} className="btn-primary px-8 py-3 text-sm">
              Refresh Listings
            </button>
          </div>
        )}

        {!loading && !empty && queue.length > 0 && (
          <div className="relative" style={{ height: 560 }}>
            {queue.slice(0, 3).reverse().map((property, i, arr) => {
              const isTop = i === arr.length - 1
              const scale = 1 - (arr.length - 1 - i) * 0.04
              const y     = (arr.length - 1 - i) * -8
              return (
                <div key={property.id}
                  className="absolute inset-0"
                  style={{
                    transform: `scale(${scale}) translateY(${y}px)`,
                    transformOrigin: 'bottom center',
                    zIndex: i,
                  }}>
                  {isTop && (
                    <SwipeCard
                      property={property}
                      matchScore={property.matchScore}
                      matchReasons={property.matchReasons}
                      onSwipe={handleSwipe}
                    />
                  )}
                  {!isTop && (
                    <div className="swipe-card w-full h-full opacity-60" />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Swipe hint */}
        {!loading && !empty && queue.length > 0 && (
          <div className="flex items-center justify-center gap-8 mt-6 text-xs" style={{ color: '#8A7E78' }}>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: '#C96A3A', color: '#C96A3A' }}>✕</div>
              <span>Pass</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: '#D4A853', color: '#D4A853' }}>★</div>
              <span>Super</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: '#7A9E7E', color: '#7A9E7E' }}>♥</div>
              <span>Match</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
