import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Copy, Share2, Check, Home, Heart, Users, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_APP_URL || window.location.origin

function generateCode(userId) {
  // Generate a short unique code from user ID
  return 'DM' + userId.replace(/-/g,'').substring(0,6).toUpperCase()
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [referralCode, setReferralCode]   = useState('')
  const [referralStats, setReferralStats] = useState({ count:0, earnings:0 })
  const [copied, setCopied]               = useState(false)
  const [myListings, setMyListings]       = useState([])
  const [myMatches, setMyMatches]         = useState(0)
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    if (!user) return
    loadDashboard()
  }, [user])

  const loadDashboard = async () => {
  try {
    // Generate or fetch referral code
    const { data: prof } = await supabase
      .from('profiles')
      .select('referral_code, referral_earnings')
      .eq('id', user.id)
      .single()

    let code = prof?.referral_code
    if (!code) {
      code = generateCode(user.id)
      await supabase.from('profiles').update({ referral_code: code }).eq('id', user.id)
    }
    setReferralCode(code)
    setReferralStats({ count: 0, earnings: prof?.referral_earnings || 0 })

    // Fetch listings
    const { data: listings } = await supabase
      .from('properties')
      .select('id, title, price, status, category, created_at')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    setMyListings(listings || [])

    // Fetch matches count
    const { count } = await supabase
      .from('matches')
      .select('*', { count:'exact', head:true })
      .eq('user_id', user.id)
    setMyMatches(count || 0)
    } catch (err) {
    console.error("loadDashboard error:", err.message)
    } finally {
    setLoading(false)
  }
}

  const referralLink = `${BASE_URL}?ref=${referralCode}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    const text = `🏡 Join me on DealMatch: Nigeria's smartest property platform!\n\nFind your perfect property, book hotels, and connect with verified professionals.\n\nSign up with my link:\n${referralLink}\n\nUse my code: *${referralCode}*`
    if (navigator.share) {
      await navigator.share({ title:'Join DealMatch', text })
    } else {
      await navigator.clipboard.writeText(text)
      toast.success('Share text copied!')
    }
  }

  const handleWhatsAppShare = () => {
    const msg = encodeURIComponent(
      `🏡 Join me on DealMatch: Nigeria's smartest property platform!\n\nFind your perfect property, book hotels, and connect with verified professionals.\n\nSign up here: ${referralLink}\n\nUse my code: *${referralCode}*`
    )
    window.open('https://wa.me/?text=' + msg, '_blank')
  }

  const verificationLevel = profile?.is_live_verified ? 'live' : profile?.avatar_url ? 'photo' : 'none'

  return (
    <div className="min-h-screen pt-20 pb-16" style={{backgroundColor:'#F5EDE0'}}>
      <div className="max-w-2xl mx-auto px-4">

        {/* Welcome */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-black" style={{color:'#1A1210'}}>
            Hey, {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-sm mt-1" style={{color:'#8A7E78'}}>
            Here's your DealMatch dashboard
          </p>
        </div>

        {/* Verification alert */}
        {verificationLevel !== 'live' && (
          <Link to="/verify"
            className="flex items-center gap-3 p-4 rounded-2xl mb-5 border-2"
            style={{backgroundColor:'rgba(201,106,58,0.06)', borderColor:'rgba(201,106,58,0.3)'}}>
            <span className="text-2xl">{verificationLevel === 'none' ? '⚠️' : '📸'}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{color:'#1A1210'}}>
                {verificationLevel === 'none' ? 'Complete your verification' : 'Finish Live Verification'}
              </p>
              <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>
                {verificationLevel === 'none' 
                  ? 'Upload photo + live check to list and buy properties' 
                  : 'Photo uploaded! Complete the live check to unlock full access'}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold" style={{backgroundColor:'#C96A3A', color:'#FFFFFF'}}>
              Verify Now <ArrowRight size={12} />
            </div>
          </Link>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label:'My Listings', value: myListings.length, icon:'🏠', link:'/list' },
            { label:'Matches',     value: myMatches,         icon:'⭕', link:'/matches' },
            { label:'Referrals',   value: referralStats.count, icon:'👥', link:null },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center border"
              style={{backgroundColor:'#FFFAF5', borderColor:'#E8DDD2'}}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="font-display font-black text-2xl" style={{color:'#C96A3A'}}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── REFERRAL SECTION ── */}
        <div className="rounded-2xl overflow-hidden mb-6"
          style={{backgroundColor:'#1A1210', boxShadow:'0 8px 32px rgba(26,18,16,0.2)'}}>

          {/* Header */}
          <div className="p-5 border-b" style={{borderColor:'rgba(255,255,255,0.08)'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{color:'rgba(255,255,255,0.4)'}}>
                  Your Referral Link
                </p>
                <h3 className="font-display font-black text-xl" style={{color:'#FFFFFF'}}>
                  Invite & Earn 💰
                </h3>
              </div>
              <div className="text-right">
                <p className="font-display font-black text-2xl" style={{color:'#C96A3A'}}>
                  ₦{referralStats.earnings.toLocaleString()}
                </p>
                <p className="text-xs" style={{color:'rgba(255,255,255,0.3)'}}>earned so far</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            {/* Referral code */}
            <div className="flex items-center justify-between p-3 rounded-2xl mb-3"
              style={{backgroundColor:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)'}}>
              <div>
                <p className="text-xs mb-0.5" style={{color:'rgba(255,255,255,0.4)'}}>Your code</p>
                <p className="font-display font-black text-xl tracking-widest" style={{color:'#C96A3A'}}>
                  {referralCode || '...'}
                </p>
              </div>
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={{backgroundColor: copied ? '#7A9E7E' : '#C96A3A', color:'#FFFFFF'}}>
                {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy Code</>}
              </button>
            </div>

            {/* Full link */}
            <div className="p-3 rounded-2xl mb-4"
              style={{backgroundColor:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)'}}>
              <p className="text-xs mb-1" style={{color:'rgba(255,255,255,0.3)'}}>Your referral link</p>
              <p className="text-xs font-mono break-all" style={{color:'rgba(255,255,255,0.6)'}}>
                {referralLink}
              </p>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button onClick={handleCopy}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs font-semibold transition-all"
                style={{backgroundColor:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)'}}>
                <Copy size={16} />
                Copy Link
              </button>
              <button onClick={handleWhatsAppShare}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs font-semibold"
                style={{backgroundColor:'#25D366', color:'#FFFFFF'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </button>
              <button onClick={handleShare}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs font-semibold"
                style={{backgroundColor:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)'}}>
                <Share2 size={16} />
                Share
              </button>
            </div>

            {/* Earnings breakdown */}
            <div className="mt-4 p-3 rounded-2xl" style={{backgroundColor:'rgba(255,255,255,0.04)'}}>
              <p className="text-xs font-bold mb-2" style={{color:'rgba(255,255,255,0.4)'}}>How you earn</p>
              <div className="space-y-1.5 text-xs" style={{color:'rgba(255,255,255,0.5)'}}>
                <p>👤 New user signs up via your link → <strong style={{color:'#D4A853'}}>₦500</strong></p>
                <p>💼 Professional subscribes via your link → <strong style={{color:'#D4A853'}}>₦2,000</strong></p>
                <p>🏡 Property deal closes via your referral → <strong style={{color:'#D4A853'}}>0.5% commission</strong></p>
              </div>
            </div>
          </div>
        </div>

        {/* My Listings */}
        <div className="rounded-2xl border mb-6" style={{backgroundColor:'#FFFAF5', borderColor:'#E8DDD2'}}>
          <div className="p-4 border-b flex items-center justify-between" style={{borderColor:'#E8DDD2'}}>
            <h3 className="font-display font-black text-base" style={{color:'#1A1210'}}>My Listings</h3>
            <Link to="/list" className="flex items-center gap-1 text-xs font-semibold" style={{color:'#C96A3A'}}>
              <Plus size={13} /> Add New
            </Link>
          </div>
          {myListings.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">🏠</div>
              <p className="text-sm font-semibold mb-1" style={{color:'#1A1210'}}>No listings yet</p>
              <p className="text-xs mb-4" style={{color:'#8A7E78'}}>List your first property to start matching with buyers</p>
              <Link to="/list" className="btn-primary text-sm px-6 py-2.5 inline-flex">
                List a Property →
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{borderColor:'#E8DDD2'}}>
              {myListings.map(listing => (
                <Link key={listing.id} to={`/property/${listing.id}`}
                  className="p-4 flex items-center gap-4 hover:bg-[#F9F5F0] transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{color:'#1A1210'}}>{listing.title}</p>
                    <p className="text-xs mt-1" style={{color:'#8A7E78'}}>
                      ₦{Number(listing.price).toLocaleString()} · {listing.category}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1.5 rounded-full"
                    style={{
                      backgroundColor: listing.status === 'active' ? 'rgba(122,158,126,0.15)' : 'rgba(201,106,58,0.15)',
                      color: listing.status === 'active' ? '#5C8060' : '#8A6A20'
                    }}>
                    {listing.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/profile" className="p-4 rounded-2xl border text-center transition-all hover:border-[#C96A3A]"
            style={{backgroundColor:'#FFFAF5', borderColor:'#E8DDD2'}}>
            <div className="text-2xl mb-2">👤</div>
            <p className="text-sm font-semibold" style={{color:'#1A1210'}}>Profile</p>
          </Link>
          <Link to="/verify" className="p-4 rounded-2xl border text-center transition-all hover:border-[#C96A3A]"
            style={{backgroundColor:'#FFFAF5', borderColor:'#E8DDD2'}}>
            <div className="text-2xl mb-2">✓</div>
            <p className="text-sm font-semibold" style={{color:'#1A1210'}}>Verify</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
