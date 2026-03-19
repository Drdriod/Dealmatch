import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, ChevronRight, Plus, MapPin, Heart } from 'lucide-react'
import { getUserMatches, getProperties } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const formatPrice = (n) => {
  if (!n) return '₦0'
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
  return `₦${(n / 1_000).toFixed(0)}K`
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [matches,  setMatches]  = useState([])
  const [listings, setListings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const role = profile?.role || 'buyer'

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const [{ data: m }, { data: l }] = await Promise.all([
        getUserMatches(user.id),
        getProperties(),
      ])
      setMatches(m  || [])
      setListings(l || [])
      setLoading(false)
    })()
  }, [user])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  const stats = role === 'buyer'
    ? [
        { icon: '❤️',  label: 'Matches',          value: matches.length, color: 'text-terracotta' },
        { icon: '👀',  label: 'Properties Viewed', value: 24,             color: 'text-deep' },
        { icon: '⭐',  label: 'Super Liked',        value: 3,              color: 'text-gold' },
        { icon: '🤝',  label: 'Pro Contacts',       value: 2,              color: 'text-sage' },
      ]
    : [
        { icon: '🏗️', label: 'Active Listings',    value: listings.length, color: 'text-terracotta' },
        { icon: '👀', label: 'Total Views',          value: 142,             color: 'text-deep' },
        { icon: '❤️', label: 'Total Likes',          value: 38,              color: 'text-sage' },
        { icon: '💬', label: 'Enquiries',            value: 7,               color: 'text-gold' },
      ]

  const listItems = role === 'buyer' ? matches.slice(0, 4) : listings.slice(0, 4)

  return (
    <div className="min-h-screen bg-cream pt-20 pb-10">
      <div className="max-w-3xl mx-auto px-4">

        {/* Greeting */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black text-deep">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-deep/40 text-sm mt-1">
            {role === 'buyer'
              ? "Here's what's happening with your property search."
              : "Here's your listings overview."}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className={`font-display text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-deep/40 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link to="/browse"
            className="bg-terracotta text-white rounded-2xl p-5 flex items-center justify-between group hover:bg-terracotta-600 transition-colors">
            <div>
              <p className="font-display text-lg font-black">Browse Deals</p>
              <p className="text-white/60 text-xs mt-0.5">Find new matches</p>
            </div>
            <Heart size={22} className="group-hover:scale-110 transition-transform" />
          </Link>

          {role === 'buyer' ? (
            <Link to="/professionals"
              className="bg-white rounded-2xl p-5 flex items-center justify-between group hover:shadow-card transition-all">
              <div>
                <p className="font-display text-lg font-black text-deep">Find Pros</p>
                <p className="text-deep/40 text-xs mt-0.5">Surveyors, inspectors</p>
              </div>
              <span className="text-2xl group-hover:scale-110 transition-transform">🤝</span>
            </Link>
          ) : (
            <Link to="/list"
              className="bg-white rounded-2xl p-5 flex items-center justify-between group hover:shadow-card transition-all">
              <div>
                <p className="font-display text-lg font-black text-deep">Add Listing</p>
                <p className="text-deep/40 text-xs mt-0.5">List a property</p>
              </div>
              <Plus size={22} className="text-terracotta group-hover:scale-110 transition-transform" />
            </Link>
          )}
        </div>

        {/* Recent items */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-black">
              {role === 'buyer' ? 'Recent Matches' : 'Your Listings'}
            </h2>
            <Link
              to={role === 'buyer' ? '/matches' : '/list'}
              className="text-xs text-terracotta font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              {role === 'buyer' ? 'View all' : 'Add new'} <ChevronRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <div className="w-6 h-6 border-2 border-deep/10 border-t-terracotta rounded-full animate-spin mx-auto" />
            </div>
          ) : listItems.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-4xl mb-3">{role === 'buyer' ? '💘' : '🏗️'}</div>
              <p className="text-deep/40 text-sm">
                {role === 'buyer'
                  ? 'Start swiping to see your matches here.'
                  : 'List your first property to get started.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {listItems.map((item, i) => {
                const p = role === 'buyer' ? item.property : item
                if (!p) return null
                const EMOJI = { land:'🌿', apartment:'🏢', duplex:'🏡', detached:'🏡', terrace:'🏠', commercial:'🏬' }
                return (
                  <Link key={item.id || i} to={`/property/${p.id}`}
                    className="flex items-center gap-3 py-3 border-b border-deep/5 last:border-0 group hover:bg-cream -mx-2 px-2 rounded-xl transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center text-xl flex-shrink-0">
                      {EMOJI[p.property_type] || '🏡'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-deep text-sm truncate">{p.title || 'Untitled'}</p>
                      <div className="flex items-center gap-1 text-xs text-deep/40 mt-0.5">
                        <MapPin size={10} />{p.city}, {p.state}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-display font-black text-sm text-deep">{formatPrice(p.price)}</p>
                      {role === 'buyer' && item.match_score && (
                        <p className="text-xs text-terracotta font-bold">{item.match_score}% match</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
