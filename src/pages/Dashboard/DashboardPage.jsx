import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [myListings, setMyListings] = useState([])
  const [myMatches,  setMyMatches]  = useState(0)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    if (!user) return
    loadDashboard()
    const channel = supabase
      .channel('swipes-changes')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'swipes',
        filter: `user_id=eq.${user.id}`
      }, () => loadDashboard())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  const loadDashboard = async () => {
    try {
      const { data: listings } = await supabase
        .from('properties')
        .select('id, title, price, status, category, created_at')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      setMyListings(listings || [])

      let matchCount = 0
      const { count: mc, error: matchErr } = await supabase
        .from('matches').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      if (!matchErr) { matchCount = mc || 0 } else {
        const { count: sc } = await supabase
          .from('swipes').select('*', { count: 'exact', head: true })
          .eq('user_id', user.id).in('action', ['like', 'super'])
        matchCount = sc || 0
      }
      setMyMatches(matchCount)
    } catch (err) {
      console.error('loadDashboard error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const verificationLevel = profile?.is_live_verified ? 'live' : profile?.avatar_url ? 'photo' : 'none'

  const QUICK_LINKS = [
    { to: '/browse',          icon: '🏠', label: 'Browse Properties' },
    { to: '/matches',         icon: '❤️',  label: 'My Matches'        },
    { to: '/list',            icon: '📋', label: 'List Property'     },
    { to: '/student-hostels', icon: '🎓', label: 'Student Hostels'   },
    { to: '/professionals',   icon: '🏗️', label: 'Professionals'     },
    { to: '/profile',         icon: '👤', label: 'My Profile'        },
  ]

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ backgroundColor: '#F5EDE0' }}>
      <div className="max-w-2xl mx-auto px-4">

        {/* Welcome */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-black" style={{ color: '#1A1210' }}>
            Hey, {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8A7E78' }}>Here's your DealMatch dashboard</p>
        </div>

        {/* Verification alert */}
        {verificationLevel !== 'live' && (
          <Link to="/verify-identity"
            className="flex items-center gap-3 p-4 rounded-2xl mb-5 border-2"
            style={{ backgroundColor: 'rgba(201,106,58,0.06)', borderColor: 'rgba(201,106,58,0.3)' }}>
            <span className="text-2xl">{verificationLevel === 'none' ? '⚠️' : '📸'}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: '#1A1210' }}>
                {verificationLevel === 'none' ? 'Complete your verification' : 'Finish Live Verification'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#8A7E78' }}>
                {verificationLevel === 'none'
                  ? 'Upload photo + live check to list and buy properties'
                  : 'Photo uploaded! Complete the live check to unlock full access'}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ backgroundColor: '#C96A3A', color: '#FFFFFF' }}>
              Verify Now <ArrowRight size={12} />
            </div>
          </Link>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: 'My Listings', value: myListings.length, icon: '🏠', link: '/list'    },
            { label: 'Matches',     value: myMatches,          icon: '❤️',  link: '/matches' },
          ].map(s => (
            <Link key={s.label} to={s.link}
              className="rounded-2xl p-4 text-center border transition-all hover:border-[#C96A3A]"
              style={{ backgroundColor: '#FFFAF5', borderColor: '#E8DDD2' }}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="font-display font-black text-2xl" style={{ color: '#C96A3A' }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#8A7E78' }}>{s.label}</p>
            </Link>
          ))}
        </div>

        {/* My Listings */}
        <div className="rounded-2xl border mb-6" style={{ backgroundColor: '#FFFAF5', borderColor: '#E8DDD2' }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#E8DDD2' }}>
            <h3 className="font-display font-black text-base" style={{ color: '#1A1210' }}>My Listings</h3>
            <Link to="/list" className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#C96A3A' }}>
              <Plus size={13} /> Add New
            </Link>
          </div>
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#C96A3A' }} />
            </div>
          ) : myListings.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">🏠</div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#1A1210' }}>No listings yet</p>
              <p className="text-xs mb-4" style={{ color: '#8A7E78' }}>List your first property to start matching with buyers</p>
              <Link to="/list" className="btn-primary text-sm px-6 py-2.5 inline-flex">List a Property →</Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#E8DDD2' }}>
              {myListings.map(listing => (
                <Link key={listing.id} to={`/property/${listing.id}`}
                  className="p-4 flex items-center gap-4 hover:bg-[#F9F5F0] transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: '#1A1210' }}>{listing.title}</p>
                    <p className="text-xs mt-1" style={{ color: '#8A7E78' }}>
                      ₦{Number(listing.price).toLocaleString()} · {listing.category}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1.5 rounded-full"
                    style={{
                      backgroundColor: listing.status === 'active' ? 'rgba(122,158,126,0.15)' : 'rgba(201,106,58,0.15)',
                      color: listing.status === 'active' ? '#5C8060' : '#8A6A20',
                    }}>
                    {listing.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-3">
          {QUICK_LINKS.map(({ to, icon, label }) => (
            <Link key={to} to={to}
              className="p-4 rounded-2xl border text-center transition-all hover:border-[#C96A3A] hover:-translate-y-0.5"
              style={{ backgroundColor: '#FFFAF5', borderColor: '#E8DDD2' }}>
              <div className="text-2xl mb-1.5">{icon}</div>
              <p className="text-xs font-semibold leading-tight" style={{ color: '#1A1210' }}>{label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
