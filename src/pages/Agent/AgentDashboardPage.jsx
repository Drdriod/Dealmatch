import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, MapPin, Phone, RefreshCw, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const STATUS_CFG = {
  pending_review:     { bg:'rgba(212,168,83,0.12)',  color:'#8A6A20', label:'Pending Review' },
  under_verification: { bg:'rgba(91,141,239,0.12)',  color:'#4A72C4', label:'Verifying' },
  active:             { bg:'rgba(122,158,126,0.12)', color:'#4A7A4E', label:'Active' },
  rejected:           { bg:'rgba(201,106,58,0.12)',  color:'#8A4A20', label:'Rejected' },
}

export default function AgentDashboardPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab]           = useState('assigned')
  const [listings, setListings] = useState([])
  const [identityQueue, setIdentityQueue] = useState([])
  const [loading, setLoading]   = useState(true)
  const [stats, setStats]       = useState({ assigned:0, completed:0, pending:0 })

  useEffect(() => {
    if (!user) return
    if (!['admin','agent'].includes(profile?.role)) { navigate('/'); return }
    loadAll()
  }, [user, profile])

  const loadAll = async () => {
    setLoading(true)
    await Promise.all([loadAssigned(), loadIdentity()])
    setLoading(false)
  }

  const loadAssigned = async () => {
    const { data } = await supabase
      .from('properties')
      .select('*, profiles(full_name, phone, email)')
      .eq('assigned_agent_id', user.id)
      .order('created_at', { ascending: false })
    const items = data || []
    setListings(items)
    setStats({
      assigned:  items.length,
      completed: items.filter(i => i.status === 'active').length,
      pending:   items.filter(i => ['pending_review','under_verification'].includes(i.status)).length,
    })
  }

  const loadIdentity = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, identity_verification_status, identity_photo_url, identity_selfie_url, identity_doc_type, created_at')
      .eq('identity_verification_status', 'submitted')
      .order('created_at', { ascending: true })
    setIdentityQueue(data || [])
  }

  const approveListing = async (id) => {
    await supabase.from('properties').update({ status:'active', verified_by:user.id, verified_at:new Date().toISOString() }).eq('id', id)
    toast.success('Listing approved and live')
    loadAssigned()
  }

  const rejectListing = async (id) => {
    const note = window.prompt('Reason for rejection (sent to seller):')
    if (!note) return
    await supabase.from('properties').update({ status:'rejected', verification_note:note, verified_by:user.id }).eq('id', id)
    toast.success('Listing rejected')
    loadAssigned()
  }

  const approveIdentity = async (pid) => {
    await supabase.from('profiles').update({
      identity_verification_status:'approved', identity_verified_at:new Date().toISOString(),
      identity_verified_by:user.id, is_live_verified:true,
    }).eq('id', pid)
    toast.success('Identity approved')
    loadIdentity()
  }

  const rejectIdentity = async (pid) => {
    const note = window.prompt('Reason for rejection:') || 'Documents unclear'
    await supabase.from('profiles').update({
      identity_verification_status:'rejected', identity_rejection_note:note, identity_verified_by:user.id,
    }).eq('id', pid)
    toast.success('Identity rejected')
    loadIdentity()
  }

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = '/admin-login' }

  const TABS = [
    { id:'assigned', label:'My Assignments', count: stats.pending },
    { id:'identity', label:'Identity Queue', count: identityQueue.length },
  ]

  return (
    <div className="min-h-screen" style={{backgroundColor:'#F5EDE0'}}>
      <div className="sticky top-0 z-10 border-b" style={{backgroundColor:'#1A1210', borderColor:'rgba(255,255,255,0.08)'}}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="font-display font-black text-lg text-white">Agent Portal</p>
            <p className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>{profile?.full_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadAll} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{backgroundColor:'rgba(255,255,255,0.08)'}}>
              <RefreshCw size={15} color="rgba(255,255,255,0.6)" />
            </button>
            <button onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{backgroundColor:'rgba(201,106,58,0.2)', color:'#C96A3A'}}>
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[{label:'Assigned',value:stats.assigned,color:'#C96A3A'},{label:'Verified',value:stats.completed,color:'#7A9E7E'},{label:'Pending',value:stats.pending,color:'#D4A853'}].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center border" style={{backgroundColor:'#FFFAF5', borderColor:'#E8DDD2'}}>
              <p className="font-display font-black text-2xl" style={{color:s.color}}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-5 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
              style={{ backgroundColor: tab===t.id ? '#1A1210' : '#FFFAF5', color: tab===t.id ? '#FFFFFF' : '#5C4A3A', border:'1px solid', borderColor: tab===t.id ? '#1A1210' : '#E8DDD2' }}>
              {t.label}
              {t.count > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{backgroundColor:'#C96A3A',color:'#FFFFFF'}}>{t.count}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor:'#C96A3A', borderTopColor:'transparent'}} />
          </div>
        ) : (
          <>
            {tab === 'assigned' && (
              <div className="space-y-3">
                {listings.length === 0 && (
                  <div className="text-center py-16 rounded-2xl border" style={{backgroundColor:'#FFFAF5', borderColor:'#E8DDD2'}}>
                    <p className="text-sm font-semibold" style={{color:'#1A1210'}}>No assignments yet</p>
                    <p className="text-xs mt-1" style={{color:'#8A7E78'}}>Listings assigned to you will appear here</p>
                  </div>
                )}
                {listings.map(listing => {
                  const s = STATUS_CFG[listing.status] || STATUS_CFG.pending_review
                  return (
                    <motion.div key={listing.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                      className="rounded-2xl border p-4" style={{backgroundColor:'#FFFAF5', borderColor:'#E8DDD2'}}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-sm" style={{color:'#1A1210'}}>{listing.title}</p>
                          <div className="flex items-center gap-1 mt-1"><MapPin size={11} style={{color:'#8A7E78'}} /><p className="text-xs" style={{color:'#8A7E78'}}>{listing.city}, {listing.state}</p></div>
                          <p className="text-xs mt-0.5 font-semibold" style={{color:'#C96A3A'}}>₦{Number(listing.price).toLocaleString()}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap" style={{backgroundColor:s.bg, color:s.color}}>{s.label}</span>
                      </div>
                      {listing.profiles && (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl mb-3" style={{backgroundColor:'rgba(26,18,16,0.04)'}}>
                          <div className="flex-1">
                            <p className="text-xs font-semibold" style={{color:'#1A1210'}}>{listing.profiles.full_name}</p>
                            <p className="text-[10px]" style={{color:'#8A7E78'}}>{listing.profiles.email}</p>
                          </div>
                          {listing.profiles.phone && (
                            <a href={`tel:${listing.profiles.phone}`} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold" style={{backgroundColor:'rgba(122,158,126,0.15)',color:'#4A7A4E'}}>
                              <Phone size={10} /> Call
                            </a>
                          )}
                        </div>
                      )}
                      {['pending_review','under_verification'].includes(listing.status) && (
                        <div className="flex gap-2">
                          <button onClick={() => rejectListing(listing.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold" style={{backgroundColor:'rgba(201,106,58,0.1)',color:'#C96A3A',border:'1px solid rgba(201,106,58,0.2)'}}>
                            <XCircle size={13} /> Decline
                          </button>
                          <button onClick={() => approveListing(listing.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold" style={{backgroundColor:'#1A1210',color:'#FFFFFF'}}>
                            <CheckCircle size={13} /> Approve
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
            {tab === 'identity' && (
              <div className="space-y-3">
                {identityQueue.length === 0 && (
                  <div className="text-center py-16 rounded-2xl border" style={{backgroundColor:'#FFFAF5', borderColor:'#E8DDD2'}}>
                    <p className="text-sm font-semibold" style={{color:'#1A1210'}}>No pending verifications</p>
                  </div>
                )}
                {identityQueue.map(p => (
                  <motion.div key={p.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                    className="rounded-2xl border p-4" style={{backgroundColor:'#FFFAF5', borderColor:'#E8DDD2'}}>
                    <p className="font-semibold text-sm mb-0.5" style={{color:'#1A1210'}}>{p.full_name}</p>
                    <p className="text-xs mb-3" style={{color:'#8A7E78'}}>{p.email} · ID: {(p.identity_doc_type||'unknown').toUpperCase()}</p>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {p.identity_photo_url && (
                        <a href={p.identity_photo_url} target="_blank" rel="noopener noreferrer">
                          <img src={p.identity_photo_url} alt="ID" className="w-full h-28 object-cover rounded-xl border" style={{borderColor:'#E8DDD2'}} />
                          <p className="text-[10px] text-center mt-1" style={{color:'#8A7E78'}}>ID Document</p>
                        </a>
                      )}
                      {p.identity_selfie_url && (
                        <a href={p.identity_selfie_url} target="_blank" rel="noopener noreferrer">
                          <img src={p.identity_selfie_url} alt="Selfie" className="w-full h-28 object-cover rounded-xl border" style={{borderColor:'#E8DDD2'}} />
                          <p className="text-[10px] text-center mt-1" style={{color:'#8A7E78'}}>Live Selfie</p>
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => rejectIdentity(p.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold" style={{backgroundColor:'rgba(201,106,58,0.1)',color:'#C96A3A',border:'1px solid rgba(201,106,58,0.2)'}}>
                        <XCircle size={13} /> Reject
                      </button>
                      <button onClick={() => approveIdentity(p.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold" style={{backgroundColor:'#1A1210',color:'#FFFFFF'}}>
                        <CheckCircle size={13} /> Approve
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
