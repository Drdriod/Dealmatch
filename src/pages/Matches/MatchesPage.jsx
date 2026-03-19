import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MapPin, ChevronRight } from 'lucide-react'
import { getUserMatches } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const formatPrice = (n) => {
  if (!n) return '₦0'
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
  return `₦${(n / 1_000).toFixed(0)}K`
}

const DEMO_MATCHES = [
  { id:'1', match_score:95, property:{ id:'1', title:'3-Bed Terrace',    property_type:'terrace',  price:22_000_000, city:'Lekki Phase 1', state:'Lagos',      images:[] } },
  { id:'2', match_score:92, property:{ id:'2', title:'4-Bed Duplex',     property_type:'duplex',   price:38_500_000, city:'Victoria Island',state:'Lagos',      images:[] } },
  { id:'3', match_score:88, property:{ id:'3', title:'500sqm Land Plot', property_type:'land',     price:8_200_000,  city:'Uyo',           state:'Akwa Ibom',  images:[] } },
]

const PROP_EMOJI = { land:'🌿', apartment:'🏢', duplex:'🏡', detached:'🏡', terrace:'🏠', commercial:'🏬' }

export default function MatchesPage() {
  const { user }    = useAuth()
  const [matches,  setMatches]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('all')

  useEffect(() => {
    ;(async () => {
      if (user) {
        const { data } = await getUserMatches(user.id)
        setMatches(data?.length ? data : DEMO_MATCHES)
      } else {
        setMatches(DEMO_MATCHES)
      }
      setLoading(false)
    })()
  }, [user])

  const displayed = tab === 'shortlisted'
    ? matches.filter(m => m.is_shortlisted)
    : matches

  return (
    <div className="min-h-screen bg-cream pt-20 pb-10">
      <div className="max-w-2xl mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black text-deep mb-1 flex items-center gap-3">
            <Heart size={24} className="text-terracotta" fill="currentColor" />
            My Matches
          </h1>
          <p className="text-deep/40 text-sm">{matches.length} properties you liked</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-deep/5 rounded-2xl p-1 mb-6 w-fit">
          {[['all','All Matches'],['shortlisted','Shortlisted']].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t ? 'bg-white text-deep shadow-sm' : 'text-deep/40 hover:text-deep'
              }`}>
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-8 h-8 border-2 border-deep/10 border-t-terracotta rounded-full animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-5 text-center">
            <div className="text-6xl">💔</div>
            <h3 className="font-display text-2xl font-black">No matches yet</h3>
            <p className="text-deep/40 text-sm max-w-xs">
              {tab === 'shortlisted'
                ? 'Shortlist properties from your matches to see them here.'
                : 'Start swiping to find properties you love.'}
            </p>
            <Link to="/browse" className="btn-primary text-sm px-6 py-3">Start Browsing</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((match) => {
              const p = match.property
              if (!p) return null
              const img = p.images?.find(i => i.is_primary)?.url || p.images?.[0]?.url
              return (
                <Link key={match.id} to={`/property/${p.id}`}
                  className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm hover:shadow-card transition-all group">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-blush to-terracotta/20 flex items-center justify-center text-3xl">
                    {img
                      ? <img src={img} alt={p.title} className="w-full h-full object-cover" />
                      : (PROP_EMOJI[p.property_type] || '🏡')
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-deep text-sm leading-tight">{p.title}</h3>
                      <span className="text-xs font-bold text-terracotta ml-2 flex-shrink-0">
                        {match.match_score}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-deep/40 mt-1">
                      <MapPin size={11} />{p.city}, {p.state}
                    </div>
                    <p className="font-display font-black text-deep mt-1.5">{formatPrice(p.price)}</p>
                  </div>
                  <ChevronRight size={16} className="text-deep/20 group-hover:text-terracotta transition-colors flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        )}

        {/* Connect with professionals CTA */}
        {!loading && matches.length > 0 && (
          <div className="mt-8 p-6 bg-deep rounded-3xl text-white relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 60% 80% at 80% 50%, rgba(201,106,58,0.2) 0%, transparent 60%)' }} />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Ready to close?</p>
              <h3 className="font-display text-xl font-black mb-1">Get your dream team</h3>
              <p className="text-white/50 text-sm mb-4 leading-relaxed">
                Connect with verified surveyors, inspectors, and lenders matched to your properties.
              </p>
              <Link to="/professionals"
                className="inline-flex items-center gap-2 bg-terracotta text-white text-sm font-semibold px-5 py-3 rounded-full shadow-glow hover:-translate-y-0.5 transition-all">
                Find Professionals <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
