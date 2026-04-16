import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Eye, Pause, Trash2, RefreshCw, Search, Filter } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

// Admin email — only this user sees the admin panel
const ADMIN_EMAIL = 'divineandbassey@gmail.com'
const WHATSAPP    = '2347057392060'

const STATUS_COLORS = {
  pending_review: { bg:'rgba(212,168,83,0.12)', color:'#8A6A20', label:'Pending Review' },
  active:         { bg:'rgba(122,158,126,0.12)', color:'#5C8060', label:'Active' },
  paused:         { bg:'rgba(26,18,16,0.08)',    color:'#8A7E78', label:'Paused' },
  rejected:       { bg:'rgba(201,106,58,0.12)',  color:'#C96A3A', label:'Rejected' },
  sold:           { bg:'rgba(122,158,126,0.12)', color:'#5C8060', label:'Sold' },
}

const CRYPTO_STATUS = {
  pending:   { bg:'rgba(212,168,83,0.12)', color:'#8A6A20',  label:'Pending' },
  confirmed: { bg:'rgba(122,158,126,0.12)', color:'#5C8060', label:'Confirmed' },
  failed:    { bg:'rgba(201,106,58,0.12)', color:'#C96A3A',  label:'Failed' },
}

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab]               = useState('listings')
  const [listings, setListings]     = useState([])
  const [cryptoTxs, setCryptoTxs]   = useState([])
  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState('all')
  const [stats, setStats]           = useState({})

  useEffect(() => {
    if (!user) return
    if (user.email !== ADMIN_EMAIL) {
      navigate('/')
      return
    }
    loadAll()
  }, [user])

  const loadAll = async () => {
    setLoading(true)
    await Promise.all([loadListings(), loadCryptoTxs(), loadProfessionals(), loadStats()])
    setLoading(false)
  }

  const loadListings = async () => {
  try {
    const { data } = await supabase
      .from('properties')
      .select('*, profiles(full_name, email, phone)')
      .order('created_at', { ascending: false })
      .limit(100)
    setListings(data || [])
    } catch (err) {
    console.error("loadListings error:", err.message)
  }
}

  const loadCryptoTxs = async () => {
  try {
    const { data } = await supabase
      .from('crypto_payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setCryptoTxs(data || [])
    } catch (err) {
    console.error("loadCryptoTxs error:", err.message)
  }
}

  const loadProfessionals = async () => {
  try {
    const { data } = await supabase
      .from('professional_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setProfessionals(data || [])
    } catch (err) {
    console.error("loadProfessionals error:", err.message)
  }
}

  const loadStats = async () => {
    const [listRes, proRes, cryptoRes] = await Promise.all([
      supabase.from('properties').select('status', { count:'exact' }),
      supabase.from('professional_applications').select('status', { count:'exact' }),
      supabase.from('crypto_payments').select('status', { count:'exact' }),
    ])
    setStats({
      totalListings:    listRes.count || 0,
      pendingListings:  (listRes.data || []).filter(l => l.status === 'pending_review').length,
      totalPros:        proRes.count || 0,
      pendingPros:      (proRes.data || []).filter(p => p.status === 'pending_payment').length,
      pendingCrypto:    (cryptoRes.data || []).filter(c => c.status === 'pending').length,
    })
  }

  const updateListingStatus = async (id, status) => {
    const { error } = await supabase
      .from('properties')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { toast.error('Update failed: ' + error.message); return }
    toast.success('Listing ' + status)
    loadListings()
    loadStats()

    // Notify lister via WhatsApp if approved
    const listing = listings.find(l => l.id === id)
    if (status === 'active' && listing?.profiles?.phone) {
      const msg = encodeURIComponent(
        '✅ *DealMatch — Listing Approved!*\n\n' +
        'Hi ' + (listing.profiles?.full_name || 'there') + ',\n\n' +
        'Your property listing *"' + listing.title + '"* has been reviewed and approved. It is now live on DealMatch and matching with buyers/renters.\n\n' +
        '🌐 dealmatch-yvdm.vercel.app'
      )
      window.open('https://wa.me/' + listing.profiles.phone.replace(/\D/g,'') + '?text=' + msg, '_blank')
    }
    if (status === 'rejected' && listing?.profiles?.phone) {
      const msg = encodeURIComponent(
        '❌ *DealMatch — Listing Not Approved*\n\n' +
        'Hi ' + (listing.profiles?.full_name || 'there') + ',\n\n' +
        'Your listing *"' + listing.title + '"* could not be approved at this time. Please contact DealMatch for more information.\n\n' +
        'WhatsApp: +234 705 739 2060'
      )
      window.open('https://wa.me/' + listing.profiles.phone.replace(/\D/g,'') + '?text=' + msg, '_blank')
    }
  }

  const confirmCryptoPayment = async (tx) => {
    const { error } = await supabase
      .from('crypto_payments')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', tx.id)
    if (error) { toast.error('Failed to confirm'); return }
    toast.success('Crypto payment confirmed!')

    // Notify user
    if (tx.user_phone) {
      const msg = encodeURIComponent(
        '✅ *DealMatch — Crypto Payment Confirmed!*\n\n' +
        'Your payment of ' + tx.usdt_amount + ' USDT has been confirmed on-chain.\n' +
        'Reference: ' + tx.reference + '\n' +
        'Service: ' + tx.description + '\n\n' +
        'Your service is now active. Thank you!'
      )
      window.open('https://wa.me/' + tx.user_phone.replace(/\D/g,'') + '?text=' + msg, '_blank')
    }
    loadCryptoTxs()
    loadStats()
  }

  const rejectCryptoPayment = async (tx) => {
    const { error } = await supabase
      .from('crypto_payments')
      .update({ status: 'failed' })
      .eq('id', tx.id)
    if (error) { toast.error('Failed to update'); return }
    toast.success('Payment marked as failed')
    loadCryptoTxs()
  }

  const activateProfessional = async (pro) => {
    const { error } = await supabase
      .from('professional_applications')
      .update({ status: 'active', activated_at: new Date().toISOString() })
      .eq('id', pro.id)
    if (error) { toast.error('Failed'); return }
    toast.success(pro.full_name + ' activated!')
    if (pro.phone) {
      const msg = encodeURIComponent(
        '✅ *DealMatch — Professional Listing Active!*\n\n' +
        'Hi ' + pro.full_name + ',\n\n' +
        'Your professional profile as a *' + pro.type + '* is now live on DealMatch. Clients will start seeing and contacting you.\n\n' +
        '🌐 dealmatch-yvdm.vercel.app/professionals'
      )
      window.open('https://wa.me/' + pro.phone.replace(/\D/g,'') + '?text=' + msg, '_blank')
    }
    loadProfessionals()
    loadStats()
  }

  const filteredListings = listings.filter(l => {
    const matchSearch = !search || l.title?.toLowerCase().includes(search.toLowerCase()) ||
      l.city?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || l.status === filter
    return matchSearch && matchFilter
  })

  if (!user || user.email !== ADMIN_EMAIL) return null

  return (
    <div className="min-h-screen pt-20 pb-16" style={{backgroundColor:'#F5EDE0'}}>
      <div className="max-w-4xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-black" style={{color:'#1A1210'}}>
              DealMatch Admin 🎛️
            </h1>
            <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>Full control panel</p>
          </div>
          <button onClick={loadAll}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{backgroundColor:'rgba(26,18,16,0.08)'}}>
            <RefreshCw size={16} style={{color:'#5C4A3A'}} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label:'Total Listings',  value: stats.totalListings || 0,   icon:'🏠', alert: false },
            { label:'Pending Review',  value: stats.pendingListings || 0, icon:'⏳', alert: stats.pendingListings > 0 },
            { label:'Pending Crypto',  value: stats.pendingCrypto || 0,   icon:'💎', alert: stats.pendingCrypto > 0 },
            { label:'Pending Pros',    value: stats.pendingPros || 0,     icon:'💼', alert: stats.pendingPros > 0 },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 border text-center"
              style={{
                backgroundColor: s.alert ? 'rgba(212,168,83,0.08)' : '#FFFAF5',
                borderColor: s.alert ? 'rgba(212,168,83,0.3)' : '#E8DDD2',
              }}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="font-display font-black text-2xl" style={{color: s.alert ? '#8A6A20' : '#C96A3A'}}>
                {s.value}
              </p>
              <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto" style={{scrollbarWidth:'none'}}>
          {[
            { id:'listings',      label:'Listings', badge: stats.pendingListings },
            { id:'crypto',        label:'Crypto Payments', badge: stats.pendingCrypto },
            { id:'professionals', label:'Professionals', badge: stats.pendingPros },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 border transition-all"
              style={{
                backgroundColor: tab === t.id ? '#1A1210' : '#FFFFFF',
                color: tab === t.id ? '#FFFFFF' : '#5C4A3A',
                borderColor: tab === t.id ? '#1A1210' : '#E8DDD2',
              }}>
              {t.label}
              {t.badge > 0 && (
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{backgroundColor:'#C96A3A', color:'#FFFFFF'}}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Listings Tab */}
        {tab === 'listings' && (
          <div>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'#8A7E78'}} />
                <input className="input text-sm pl-9" type="text" placeholder="Search listings..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
              </div>
              <select className="select text-sm" value={filter} onChange={e => setFilter(e.target.value)}
                style={{backgroundColor:'#FFFFFF', color:'#1A1210'}}>
                <option value="all">All</option>
                <option value="pending_review">Pending</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-12" style={{color:'#8A7E78'}}>Loading...</div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-12" style={{color:'#8A7E78'}}>No listings found</div>
            ) : (
              <div className="space-y-3">
                {filteredListings.map(listing => {
                  const sc = STATUS_COLORS[listing.status] || STATUS_COLORS.paused
                  return (
                    <div key={listing.id} className="rounded-2xl border p-4"
                      style={{
                        backgroundColor: listing.status === 'pending_review' ? 'rgba(212,168,83,0.04)' : '#FFFAF5',
                        borderColor: listing.status === 'pending_review' ? 'rgba(212,168,83,0.3)' : '#E8DDD2',
                      }}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm" style={{color:'#1A1210'}}>{listing.title}</p>
                          <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>
                            {listing.city}, {listing.state} · ₦{Number(listing.price).toLocaleString()}
                          </p>
                          {listing.profiles && (
                            <p className="text-xs mt-0.5" style={{color:'rgba(26,18,16,0.4)'}}>
                              By: {listing.profiles.full_name} · {listing.profiles.phone}
                            </p>
                          )}
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                          style={{backgroundColor: sc.bg, color: sc.color}}>
                          {sc.label}
                        </span>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {listing.status === 'pending_review' && (
                          <>
                            <button onClick={() => updateListingStatus(listing.id, 'active')}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                              style={{backgroundColor:'rgba(122,158,126,0.12)', color:'#5C8060'}}>
                              <Check size={12} /> Approve & Notify
                            </button>
                            <button onClick={() => updateListingStatus(listing.id, 'rejected')}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                              style={{backgroundColor:'rgba(201,106,58,0.1)', color:'#C96A3A'}}>
                              <X size={12} /> Reject & Notify
                            </button>
                          </>
                        )}
                        {listing.status === 'active' && (
                          <button onClick={() => updateListingStatus(listing.id, 'paused')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                            style={{backgroundColor:'rgba(26,18,16,0.08)', color:'#5C4A3A'}}>
                            <Pause size={12} /> Pause
                          </button>
                        )}
                        {listing.status === 'paused' && (
                          <button onClick={() => updateListingStatus(listing.id, 'active')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                            style={{backgroundColor:'rgba(122,158,126,0.12)', color:'#5C8060'}}>
                            <Check size={12} /> Re-activate
                          </button>
                        )}
                        <button onClick={() => window.open('/property/' + listing.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border"
                          style={{borderColor:'#E8DDD2', color:'#8A7E78', backgroundColor:'#FFFFFF'}}>
                          <Eye size={12} /> View
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Crypto Payments Tab */}
        {tab === 'crypto' && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12" style={{color:'#8A7E78'}}>Loading...</div>
            ) : cryptoTxs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">💎</div>
                <p style={{color:'#8A7E78'}}>No crypto transactions yet</p>
              </div>
            ) : cryptoTxs.map(tx => {
              const sc = CRYPTO_STATUS[tx.status] || CRYPTO_STATUS.pending
              return (
                <div key={tx.id} className="rounded-2xl border p-4"
                  style={{
                    backgroundColor: tx.status === 'pending' ? 'rgba(212,168,83,0.04)' : '#FFFAF5',
                    borderColor: tx.status === 'pending' ? 'rgba(212,168,83,0.3)' : '#E8DDD2',
                  }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-sm" style={{color:'#1A1210'}}>{tx.description}</p>
                      <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>
                        {tx.usdt_amount} USDT · {tx.network}
                      </p>
                      <p className="text-xs mt-0.5" style={{color:'rgba(26,18,16,0.4)'}}>
                        {tx.user_name} · {tx.user_phone}
                      </p>
                      <p className="text-xs mt-0.5 font-mono" style={{color:'#C96A3A'}}>
                        Ref: {tx.reference}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                      style={{backgroundColor: sc.bg, color: sc.color}}>
                      {sc.label}
                    </span>
                  </div>

                  {tx.tx_hash && (
                    <div className="p-2 rounded-xl mb-3 text-xs font-mono break-all"
                      style={{backgroundColor:'rgba(26,18,16,0.04)', color:'#5C4A3A'}}>
                      TX: {tx.tx_hash}
                    </div>
                  )}

                  {tx.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => confirmCryptoPayment(tx)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold"
                        style={{backgroundColor:'rgba(122,158,126,0.12)', color:'#5C8060'}}>
                        <Check size={12} /> Confirm & Notify User
                      </button>
                      <button onClick={() => rejectCryptoPayment(tx)}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold border"
                        style={{borderColor:'rgba(201,106,58,0.2)', color:'#C96A3A', backgroundColor:'rgba(201,106,58,0.05)'}}>
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Professionals Tab */}
        {tab === 'professionals' && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12" style={{color:'#8A7E78'}}>Loading...</div>
            ) : professionals.length === 0 ? (
              <div className="text-center py-12" style={{color:'#8A7E78'}}>No applications yet</div>
            ) : professionals.map(pro => (
              <div key={pro.id} className="rounded-2xl border p-4"
                style={{
                  backgroundColor: pro.status === 'pending_payment' ? 'rgba(212,168,83,0.04)' : '#FFFAF5',
                  borderColor: pro.status === 'pending_payment' ? 'rgba(212,168,83,0.3)' : '#E8DDD2',
                }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-sm" style={{color:'#1A1210'}}>{pro.full_name}</p>
                    <p className="text-xs mt-0.5 capitalize" style={{color:'#8A7E78'}}>
                      {pro.type} · {pro.coverage_areas}
                    </p>
                    <p className="text-xs mt-0.5" style={{color:'rgba(26,18,16,0.4)'}}>
                      {pro.phone} · {pro.email}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                    style={{
                      backgroundColor: pro.status === 'active' ? 'rgba(122,158,126,0.12)' : 'rgba(212,168,83,0.12)',
                      color: pro.status === 'active' ? '#5C8060' : '#8A6A20',
                    }}>
                    {pro.status === 'active' ? 'Active' : 'Pending Payment'}
                  </span>
                </div>
                {pro.status !== 'active' && (
                  <button onClick={() => activateProfessional(pro)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold"
                    style={{backgroundColor:'rgba(122,158,126,0.12)', color:'#5C8060'}}>
                    <Check size={12} /> Activate & Notify
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
