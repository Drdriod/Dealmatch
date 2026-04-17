import { useState, useEffect } from 'react'
import { Check, X, Eye, RefreshCw, Search, UserCheck, AlertTriangle, Home, MessageSquare, MapPin, Clock, ChevronDown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const ADMIN_EMAILS = ['divineandbassey@gmail.com']
const WHATSAPP     = '2347057392060'

const STATUS_CFG = {
  pending_review:      { bg:'rgba(212,168,83,0.12)',  color:'#8A6A20', label:'Pending Review' },
  under_verification:  { bg:'rgba(91,141,239,0.12)',  color:'#4A72C4', label:'Agent Assigned' },
  active:              { bg:'rgba(122,158,126,0.12)', color:'#5C8060', label:'Live' },
  rejected:            { bg:'rgba(201,106,58,0.12)',  color:'#C96A3A', label:'Rejected' },
}

const CRYPTO_CFG = {
  pending:   { bg:'rgba(212,168,83,0.12)',  color:'#8A6A20',  label:'Pending' },
  confirmed: { bg:'rgba(122,158,126,0.12)', color:'#5C8060',  label:'Confirmed' },
  failed:    { bg:'rgba(201,106,58,0.12)',  color:'#C96A3A',  label:'Failed' },
}

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab,           setTab]           = useState('listings')
  const [listings,      setListings]      = useState([])
  const [cryptoTxs,     setCryptoTxs]     = useState([])
  const [professionals, setProfessionals] = useState([])
  const [disputes,      setDisputes]      = useState([])
  const [agents,        setAgents]        = useState([])
  const [stats,         setStats]         = useState({})
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [filter,        setFilter]        = useState('all')
  const [expandedId,    setExpandedId]    = useState(null)
  const [assignModal,   setAssignModal]   = useState(null)

  useEffect(() => {
    if (!user) return
    if (!ADMIN_EMAILS.includes(user.email)) { navigate('/'); return }
    loadAll()
  }, [user])

  const loadAll = async () => {
    setLoading(true)
    await Promise.all([loadListings(), loadCryptoTxs(), loadProfessionals(), loadDisputes(), loadAgents(), loadStats()])
    setLoading(false)
  }

  const loadListings = async () => {
    const { data } = await supabase
      .from('properties')
      .select('*, profiles(full_name, email, phone)')
      .order('created_at', { ascending: false })
      .limit(100)
    setListings(data || [])
  }
  const loadCryptoTxs = async () => {
    const { data } = await supabase.from('crypto_payments').select('*').order('created_at',{ ascending:false }).limit(50)
    setCryptoTxs(data || [])
  }
  const loadProfessionals = async () => {
    const { data } = await supabase.from('professional_applications').select('*').order('created_at',{ ascending:false }).limit(50)
    setProfessionals(data || [])
  }
  const loadDisputes = async () => {
    const { data } = await supabase.from('disputes').select('*, properties(title)').order('created_at',{ ascending:false }).limit(50)
    setDisputes(data || [])
  }
  const loadAgents = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, phone').in('role',['agent','admin'])
    setAgents(data || [])
  }
  const loadStats = async () => {
    const [lr, pr, cr, dr] = await Promise.all([
      supabase.from('properties').select('status',{ count:'exact' }),
      supabase.from('professional_applications').select('status',{ count:'exact' }),
      supabase.from('crypto_payments').select('status',{ count:'exact' }),
      supabase.from('disputes').select('status',{ count:'exact' }),
    ])
    setStats({
      totalListings:   lr.count || 0,
      pendingListings: (lr.data||[]).filter(l => l.status === 'pending_review').length,
      pendingPros:     (pr.data||[]).filter(p => p.status === 'pending_payment').length,
      pendingCrypto:   (cr.data||[]).filter(c => c.status === 'pending').length,
      openDisputes:    (dr.data||[]).filter(d => d.status === 'open').length,
    })
  }

  // ── Listing actions ────────────────────────────────────
  const updateListingStatus = async (id, status, note='') => {
    await supabase.from('properties').update({ status, verification_note: note||null, updated_at: new Date().toISOString() }).eq('id', id)
    const listing = listings.find(l => l.id === id)
    toast.success(`${status === 'active' ? '✅ Approved' : status === 'rejected' ? '❌ Rejected' : '📋 Updated'}: ${listing?.title}`)
    const phone = listing?.profiles?.phone?.replace(/\D/g,'')
    if (phone) {
      const msg = status === 'active'
        ? encodeURIComponent(`✅ *DealMatch: Listing Approved!*\n\nHi ${listing.profiles?.full_name||'there'},\n\nYour property *"${listing.title}"* is now live on DealMatch.\n\n🌐 dealmatch-yvdm.vercel.app`)
        : encodeURIComponent(`❌ *DealMatch: Listing Not Approved*\n\nHi ${listing.profiles?.full_name||'there'},\n\nYour listing *"${listing.title}"* was not approved.\n${note ? `Reason: ${note}\n` : ''}\nContact: +234 705 739 2060`)
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
    }
    loadListings(); loadStats()
  }

  // ── Assign agent ───────────────────────────────────────
  const assignAgent = async (propertyId, agentId) => {
    await supabase.from('properties').update({ assigned_agent_id: agentId, status:'under_verification', updated_at: new Date().toISOString() }).eq('id', propertyId)
    await supabase.from('agent_assignments').insert({ property_id: propertyId, agent_id: agentId, assigned_by: user.id, status:'assigned' })
    const agent = agents.find(a => a.id === agentId)
    const listing = listings.find(l => l.id === propertyId)
    if (agent?.phone) {
      const msg = encodeURIComponent(`🏠 *New Property Assignment: DealMatch*\n\nHi ${agent.full_name},\n\nYou have been assigned to verify:\n*"${listing?.title}"*\n${listing?.city}, ${listing?.state}\n${listing?.address||''}\n\nPlease visit the property and complete verification in your agent dashboard.\n\n🌐 dealmatch-yvdm.vercel.app/verify`)
      window.open(`https://wa.me/${agent.phone.replace(/\D/g,'')}?text=${msg}`, '_blank')
    }
    toast.success(`Agent assigned: ${agent?.full_name}`)
    setAssignModal(null)
    loadListings()
  }

  // ── Dispute resolution ─────────────────────────────────
  const resolveDispute = async (id, resolution) => {
    await supabase.from('disputes').update({ status:'resolved', resolution }).eq('id', id)
    toast.success('Dispute resolved')
    loadDisputes(); loadStats()
  }

  // ── Crypto confirm ────────────────────────────────────
  const confirmCrypto = async (tx) => {
    await supabase.from('crypto_payments').update({ status:'confirmed', confirmed_at: new Date().toISOString() }).eq('id', tx.id)
    if (tx.user_phone) {
      const msg = encodeURIComponent(`✅ *DealMatch: Crypto Confirmed!*\n\nYour ${tx.usdt_amount} USDT payment has been verified.\nService: ${tx.description}\nRef: ${tx.reference}\n\nThank you!`)
      window.open(`https://wa.me/${tx.user_phone.replace(/\D/g,'')}?text=${msg}`, '_blank')
    }
    toast.success('Crypto confirmed!')
    loadCryptoTxs(); loadStats()
  }

  // ── Activate professional ──────────────────────────────
  const activatePro = async (pro) => {
    await supabase.from('professional_applications').update({ status:'active', activated_at: new Date().toISOString() }).eq('id', pro.id)
    if (pro.phone) {
      const msg = encodeURIComponent(`✅ *DealMatch: Professional Profile Active!*\n\nHi ${pro.full_name},\n\nYour profile as a *${pro.type}* is now live on DealMatch.\n\n🌐 dealmatch-yvdm.vercel.app/professionals`)
      window.open(`https://wa.me/${pro.phone.replace(/\D/g,'')}?text=${msg}`, '_blank')
    }
    toast.success(`${pro.full_name} activated!`)
    loadProfessionals(); loadStats()
  }

  const filteredListings = listings.filter(l => {
    const ms = !search || l.title?.toLowerCase().includes(search.toLowerCase()) || l.city?.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'all' || l.status === filter
    return ms && mf
  })

  if (!user || !ADMIN_EMAILS.includes(user.email)) return null

  const TABS = [
    { id:'listings',      label:'Listings',      badge: stats.pendingListings },
    { id:'crypto',        label:'Crypto Payments', badge: stats.pendingCrypto },
    { id:'professionals', label:'Professionals',  badge: stats.pendingPros },
    { id:'disputes',      label:'Disputes',       badge: stats.openDisputes },
  ]

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ backgroundColor:'#F5EDE0' }}>
      <div className="max-w-4xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-black" style={{ color:'#1A1210' }}>DealMatch Admin 🎛️</h1>
            <p className="text-xs mt-0.5" style={{ color:'#8A7E78' }}>Verification · Payments · Disputes</p>
          </div>
          <button onClick={loadAll} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor:'rgba(26,18,16,0.08)' }}>
            <RefreshCw size={16} style={{ color:'#5C4A3A' }} />
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label:'Listings',    value: stats.totalListings,   icon:'🏠', alert: stats.pendingListings },
            { label:'Pending',     value: stats.pendingListings, icon:'⏳', alert: stats.pendingListings > 0 },
            { label:'Crypto',      value: stats.pendingCrypto,   icon:'💎', alert: stats.pendingCrypto > 0 },
            { label:'Disputes',    value: stats.openDisputes,    icon:'🚩', alert: stats.openDisputes > 0 },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 border text-center"
              style={{ backgroundColor:'#FFFAF5', borderColor: s.alert ? 'rgba(201,106,58,0.3)' : '#E8DDD2' }}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="font-display font-black text-xl" style={{ color: s.alert ? '#C96A3A' : '#1A1210' }}>{s.value || 0}</p>
              <p className="text-xs" style={{ color:'#8A7E78' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto mb-5 pb-1" style={{ scrollbarWidth:'none' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap border flex-shrink-0 flex items-center gap-1.5 transition-all"
              style={{ backgroundColor: tab === t.id ? '#1A1210' : '#FFFFFF', color: tab === t.id ? '#FFFFFF' : '#5C4A3A', borderColor: tab === t.id ? '#1A1210' : '#E8DDD2' }}>
              {t.label}
              {t.badge > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: tab === t.id ? 'rgba(201,106,58,0.4)' : '#C96A3A', color:'#FFFFFF' }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-12" style={{ color:'#8A7E78' }}>Loading...</div>}

        {/* ── Listings ── */}
        {!loading && tab === 'listings' && (
          <>
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'#8A7E78' }} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                  className="input pl-9 text-sm" style={{ backgroundColor:'#FFFFFF', color:'#1A1210' }} />
              </div>
              <select value={filter} onChange={e => setFilter(e.target.value)} className="select text-sm w-44"
                style={{ backgroundColor:'#FFFFFF', color:'#1A1210' }}>
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              {filteredListings.map(l => {
                const s    = STATUS_CFG[l.status] || STATUS_CFG.pending_review
                const isEx = expandedId === l.id
                const img  = l.images?.[0]?.url
                return (
                  <div key={l.id} className="rounded-2xl border overflow-hidden"
                    style={{ backgroundColor:'#FFFAF5', borderColor: l.status === 'pending_review' ? 'rgba(212,168,83,0.4)' : '#E8DDD2' }}>
                    {/* Summary row */}
                    <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpandedId(isEx ? null : l.id)}>
                      <div className="w-16 h-14 rounded-xl overflow-hidden flex-shrink-0">
                        {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl" style={{ backgroundColor:'rgba(201,106,58,0.08)' }}>🏠</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color:'#1A1210' }}>{l.title}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color:'#8A7E78' }}>
                          <MapPin size={9} className="inline mr-0.5" />{l.city}, {l.state} · {l.profiles?.full_name || 'Unknown'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor:s.bg, color:s.color }}>{s.label}</span>
                          <span className="text-[10px]" style={{ color:'rgba(26,18,16,0.4)' }}>
                            <Clock size={8} className="inline mr-0.5" />{new Date(l.created_at).toLocaleDateString('en-NG')}
                          </span>
                        </div>
                      </div>
                      <ChevronDown size={14} style={{ color:'#8A7E78', transform: isEx ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }} />
                    </button>

                    {/* Expanded actions */}
                    <AnimatePresence>
                      {isEx && (
                        <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                          className="overflow-hidden border-t" style={{ borderColor:'#E8DDD2' }}>
                          <div className="p-4 space-y-3">
                            {/* Images */}
                            {l.images?.length > 0 && (
                              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
                                {l.images.map((img2, i) => <img key={i} src={img2.url} alt="" className="w-20 h-16 rounded-xl object-cover flex-shrink-0" />)}
                              </div>
                            )}
                            {/* Details grid */}
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              {[['Price', `₦${Number(l.price).toLocaleString()}`],['Type', l.property_type],['Category', l.category],
                                ['Size', l.size_sqm ? `${l.size_sqm}sqm` : 'N/A'],['Docs', l.documents?.length || 0],['Video', l.video_url ? '✅' : '❌']
                              ].map(([k,v]) => (
                                <div key={k} className="rounded-xl p-2" style={{ backgroundColor:'rgba(26,18,16,0.04)' }}>
                                  <span style={{ color:'#8A7E78' }}>{k}: </span><strong style={{ color:'#1A1210' }}>{v}</strong>
                                </div>
                              ))}
                            </div>
                            {/* Owner contact */}
                            <div className="rounded-xl p-3" style={{ backgroundColor:'rgba(26,18,16,0.04)' }}>
                              <p className="text-xs"><strong>{l.profiles?.full_name}</strong> · {l.profiles?.phone} · {l.profiles?.email}</p>
                            </div>
                            {/* Action buttons */}
                            <div className="flex gap-2 flex-wrap">
                              {l.status !== 'active' && (
                                <button onClick={() => updateListingStatus(l.id,'active')}
                                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold"
                                  style={{ backgroundColor:'rgba(122,158,126,0.15)', color:'#5C8060' }}>
                                  <Check size={12} /> Approve & Notify
                                </button>
                              )}
                              {l.status !== 'rejected' && (
                                <button onClick={() => updateListingStatus(l.id,'rejected')}
                                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border"
                                  style={{ borderColor:'rgba(201,106,58,0.3)', color:'#C96A3A' }}>
                                  <X size={12} /> Reject
                                </button>
                              )}
                              {l.status === 'pending_review' && agents.length > 0 && (
                                <button onClick={() => setAssignModal(l.id)}
                                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border"
                                  style={{ borderColor:'rgba(91,141,239,0.3)', color:'#4A72C4', backgroundColor:'rgba(91,141,239,0.06)' }}>
                                  <UserCheck size={12} /> Assign Agent
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── Crypto Payments ── */}
        {!loading && tab === 'crypto' && (
          <div className="space-y-3">
            {cryptoTxs.map(tx => {
              const s = CRYPTO_CFG[tx.status] || CRYPTO_CFG.pending
              return (
                <div key={tx.id} className="rounded-2xl border p-4" style={{ backgroundColor:'#FFFAF5', borderColor:'#E8DDD2' }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-sm" style={{ color:'#1A1210' }}>{tx.description}</p>
                      <p className="text-xs mt-0.5" style={{ color:'#8A7E78' }}>
                        {tx.user_name} · {tx.user_phone} · {tx.usdt_amount} {tx.coin || 'USDT'} · {tx.network_label || tx.network}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0" style={{ backgroundColor:s.bg, color:s.color }}>{s.label}</span>
                  </div>
                  {tx.tx_hash && <p className="text-[10px] font-mono mb-2 truncate" style={{ color:'#5C4A3A' }}>TX: {tx.tx_hash}</p>}
                  {tx.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => confirmCrypto(tx)}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor:'rgba(122,158,126,0.15)', color:'#5C8060' }}>
                        ✅ Confirm On-Chain
                      </button>
                      <button onClick={() => supabase.from('crypto_payments').update({ status:'failed' }).eq('id',tx.id).then(loadCryptoTxs)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold border" style={{ borderColor:'rgba(201,106,58,0.2)', color:'#C96A3A' }}>
                        ❌
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {cryptoTxs.length === 0 && <div className="text-center py-12" style={{ color:'#8A7E78' }}>No crypto transactions</div>}
          </div>
        )}

        {/* ── Professionals ── */}
        {!loading && tab === 'professionals' && (
          <div className="space-y-3">
            {professionals.map(pro => (
              <div key={pro.id} className="rounded-2xl border p-4"
                style={{ backgroundColor:'#FFFAF5', borderColor: pro.status === 'pending_payment' ? 'rgba(212,168,83,0.3)' : '#E8DDD2' }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-sm" style={{ color:'#1A1210' }}>{pro.full_name}</p>
                    <p className="text-xs mt-0.5 capitalize" style={{ color:'#8A7E78' }}>{pro.type} · {pro.coverage_areas}</p>
                    <p className="text-xs mt-0.5" style={{ color:'rgba(26,18,16,0.4)' }}>{pro.phone} · {pro.email}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: pro.status === 'active' ? 'rgba(122,158,126,0.12)' : 'rgba(212,168,83,0.12)', color: pro.status === 'active' ? '#5C8060' : '#8A6A20' }}>
                    {pro.status === 'active' ? 'Active' : 'Pending Payment'}
                  </span>
                </div>
                {pro.status !== 'active' && (
                  <button onClick={() => activatePro(pro)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor:'rgba(122,158,126,0.12)', color:'#5C8060' }}>
                    ✅ Activate & Notify
                  </button>
                )}
              </div>
            ))}
            {professionals.length === 0 && <div className="text-center py-12" style={{ color:'#8A7E78' }}>No applications</div>}
          </div>
        )}

        {/* ── Disputes ── */}
        {!loading && tab === 'disputes' && (
          <div className="space-y-3">
            {disputes.map(d => (
              <div key={d.id} className="rounded-2xl border p-4"
                style={{ backgroundColor:'#FFFAF5', borderColor: d.status === 'open' ? 'rgba(201,106,58,0.3)' : '#E8DDD2' }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-sm" style={{ color:'#C96A3A' }}>🚩 {d.reason}</p>
                    <p className="text-xs mt-0.5" style={{ color:'#8A7E78' }}>Property: {d.properties?.title || 'Unknown'}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color:'#5C4A3A' }}>{d.description}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 capitalize"
                    style={{ backgroundColor:'rgba(201,106,58,0.1)', color:'#C96A3A' }}>{d.status}</span>
                </div>
                {d.status === 'open' && (
                  <div className="flex gap-2">
                    <button onClick={() => resolveDispute(d.id, 'Resolved by DealMatch team')}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor:'rgba(122,158,126,0.12)', color:'#5C8060' }}>
                      ✅ Mark Resolved
                    </button>
                    <button onClick={() => resolveDispute(d.id, 'Dismissed: no evidence of wrongdoing')}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold border" style={{ borderColor:'#E8DDD2', color:'#8A7E78' }}>
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
            {disputes.length === 0 && <div className="text-center py-12" style={{ color:'#8A7E78' }}>No disputes filed</div>}
          </div>
        )}
      </div>

      {/* Assign Agent Modal */}
      <AnimatePresence>
        {assignModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
            style={{ backgroundColor:'rgba(26,18,16,0.85)', backdropFilter:'blur(8px)' }}
            onClick={e => e.target === e.currentTarget && setAssignModal(null)}>
            <motion.div initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }}
              className="w-full max-w-sm rounded-3xl overflow-hidden"
              style={{ backgroundColor:'#FFFAF5' }}>
              <div className="p-5 border-b" style={{ borderColor:'#E8DDD2' }}>
                <h3 className="font-display font-black text-lg" style={{ color:'#1A1210' }}>Assign Field Agent</h3>
                <p className="text-xs mt-0.5" style={{ color:'#8A7E78' }}>Select an agent to visit and verify this property</p>
              </div>
              <div className="p-4 space-y-2">
                {agents.length === 0 && <p className="text-sm text-center py-4" style={{ color:'#8A7E78' }}>No agents found. Set role to 'agent' in profiles table.</p>}
                {agents.map(a => (
                  <button key={a.id} onClick={() => assignAgent(assignModal, a.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all hover:border-orange-400"
                    style={{ borderColor:'#E8DDD2', backgroundColor:'#FFFFFF' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor:'rgba(201,106,58,0.1)', color:'#C96A3A' }}>
                      {a.full_name?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color:'#1A1210' }}>{a.full_name}</p>
                      <p className="text-xs" style={{ color:'#8A7E78' }}>{a.phone || 'No phone'}</p>
                    </div>
                    <UserCheck size={14} style={{ color:'#7A9E7E', marginLeft:'auto' }} />
                  </button>
                ))}
                <button onClick={() => setAssignModal(null)} className="w-full py-3 text-sm" style={{ color:'#8A7E78' }}>Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
