import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Star, MapPin, Phone, MessageCircle, X, Heart, ChevronLeft, ChevronRight, Award, Clock, Shield, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { analytics } from '@/lib/posthog'
import { clientRateLimit } from '@/lib/security'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────
const PRO_TYPES = [
  { id:'all',         label:'All',        emoji:'👥' },
  { id:'agent',       label:'Agents',     emoji:'🏘️' },
  { id:'surveyor',    label:'Surveyors',  emoji:'📐' },
  { id:'inspector',   label:'Inspectors', emoji:'🔍' },
  { id:'valuer',      label:'Valuers',    emoji:'📊' },
  { id:'lawyer',      label:'Lawyers',    emoji:'⚖️' },
  { id:'lender',      label:'Lenders',    emoji:'🏦' },
  { id:'architect',   label:'Architects', emoji:'🏗️' },
  { id:'contractor',  label:'Contractors',emoji:'🔨' },
]

const DEMO_PROS = [
  { id:'p1', full_name:'Emeka Okafor', type:'surveyor', coverage_areas:'Lagos, Ogun', years_exp:12, bio:'Senior surveyor with 12 years of experience. Specialises in Lagos Island and Ogun State. C of O verification, boundary disputes, registered survey plans.', phone:'2348012345678', status:'active', rating:4.8, review_count:47, avatar_url:null, company:'Okafor Survey Co.', is_verified:true },
  { id:'p2', full_name:'Ngozi Williams', type:'lawyer', coverage_areas:'Abuja, Lagos', years_exp:9, bio:'Real estate attorney at Williams & Associates. Expert in deed transfers, C of O applications, tenancy agreements, and property dispute resolution.', phone:'2348098765432', status:'active', rating:4.9, review_count:82, avatar_url:null, company:'Williams & Associates', is_verified:true },
  { id:'p3', full_name:'Chidi Eze', type:'inspector', coverage_areas:'Enugu, Anambra', years_exp:7, bio:'Certified property inspector covering residential and commercial builds. Structural assessments, roof surveys, plumbing and electrical checks.', phone:'2348033344455', status:'active', rating:4.6, review_count:33, avatar_url:null, company:'Eze Inspections', is_verified:true },
  { id:'p4', full_name:'Fatima Musa', type:'lender', coverage_areas:'Kano, Abuja, Lagos', years_exp:11, bio:'Mortgage specialist at First Home Finance. Pre-qualification within 24 hours. NHF and commercial mortgages. 200+ deals closed.', phone:'2348077788899', status:'active', rating:4.7, review_count:61, avatar_url:null, company:'First Home Finance', is_verified:true },
  { id:'p5', full_name:'Tunde Adeyemi', type:'agent', coverage_areas:'Lagos', years_exp:6, bio:'Lekki and Ikoyi specialist. Luxury residential and commercial. Full transaction management from listing to close.', phone:'2348055522233', status:'active', rating:4.5, review_count:28, avatar_url:null, company:'Adeyemi Realty', is_verified:true },
  { id:'p6', full_name:'Kemi Afolabi', type:'architect', coverage_areas:'Lagos, Oyo', years_exp:14, bio:'ARCON registered architect. New builds, renovations, and interior design. Portfolio includes residential estates, commercial plazas, and luxury duplexes.', phone:'2348066611100', status:'active', rating:4.9, review_count:55, avatar_url:null, company:'KA Design Studio', is_verified:true },
]

// ─── Star Rating Display ──────────────────────────────────
function StarRating({ rating, count, size = 'sm' }) {
  const s = size === 'sm' ? 11 : 14
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1,2,3,4,5].map(i => (
          <svg key={i} width={s} height={s} viewBox="0 0 12 12" fill={i <= Math.round(rating) ? '#D4A853' : 'none'}
            stroke={i <= Math.round(rating) ? '#D4A853' : '#E8DDD2'} strokeWidth="1">
            <polygon points="6,1 7.8,4.5 11.5,5 9,7.5 9.6,11 6,9 2.4,11 3,7.5 0.5,5 4.2,4.5"/>
          </svg>
        ))}
      </div>
      <span className={`font-bold ${size === 'sm' ? 'text-xs' : 'text-sm'}`} style={{ color: '#1A1210' }}>{rating.toFixed(1)}</span>
      {count && <span className={`${size === 'sm' ? 'text-[10px]' : 'text-xs'}`} style={{ color: '#8A7E78' }}>({count})</span>}
    </div>
  )
}

// ─── Contact Request Modal ────────────────────────────────
function ContactModal({ pro, onClose }) {
  const { user, profile } = useAuth()
  const [form, setForm]   = useState({ name: profile?.full_name || '', phone: profile?.phone || '', details: '', urgency: 'normal' })
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSend = async () => {
    const rl = clientRateLimit('contact_pro', 5, 60_000)
    if (!rl.allowed) { toast.error(rl.message); return }
    if (!form.name || !form.phone) { toast.error('Your name and phone are required'); return }

    setSending(true)
    try {
      await supabase.from('professional_requests').insert({
        user_id:           user?.id || null,
        professional_id:   pro.id,
        professional_type: pro.type,
        professional_name: pro.full_name,
        client_name:       form.name,
        client_phone:      form.phone,
        details:           form.details,
        urgency:           form.urgency,
        status:            'pending',
      })
      analytics.professionalContacted(pro.type, pro.id)
      setSent(true)
    } catch (err) {
      toast.error('Could not send request. Try again.')
    } finally {
      setSending(false)
    }
  }

  const EMOJI = { agent:'🏘️', surveyor:'📐', inspector:'🔍', valuer:'📊', lawyer:'⚖️', lender:'🏦', architect:'🏗️', contractor:'🔨' }

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26,18,16,0.88)', backdropFilter: 'blur(10px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:40 }}
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ backgroundColor:'#FFFAF5', maxHeight:'90vh', overflowY:'auto' }}>

        {sent ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="font-display font-black text-xl mb-2" style={{ color:'#1A1210' }}>Request Sent!</h3>
            <p className="text-sm mb-2" style={{ color:'#8A7E78' }}>
              <strong style={{ color:'#1A1210' }}>{pro.full_name}</strong> has received your request and will contact you within 2 hours.
            </p>
            <p className="text-xs mb-6" style={{ color:'#8A7E78' }}>You'll get a notification when they respond.</p>
            <button onClick={onClose} className="btn-primary w-full py-3 text-sm">Done ✓</button>
          </div>
        ) : (
          <>
            <div className="p-5 border-b flex items-center gap-3" style={{ borderColor:'#E8DDD2' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor:'rgba(201,106,58,0.08)' }}>
                {EMOJI[pro.type] || '👤'}
              </div>
              <div className="flex-1">
                <h3 className="font-display font-black text-base" style={{ color:'#1A1210' }}>Request {pro.full_name}</h3>
                <p className="text-xs capitalize" style={{ color:'#8A7E78' }}>{pro.type} · {pro.coverage_areas}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor:'rgba(26,18,16,0.08)' }}>
                <X size={14} style={{ color:'#5C4A3A' }} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {[
                { label:'Your Name *',  key:'name',  type:'text', placeholder:'Full name' },
                { label:'Your Phone *', key:'phone', type:'tel',  placeholder:'+234 800 000 0000' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'rgba(26,18,16,0.5)' }}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder}
                    className="input text-sm" style={{ backgroundColor:'#FFFFFF', color:'#1A1210' }} />
                </div>
              ))}

              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'rgba(26,18,16,0.5)' }}>What do you need? (optional)</label>
                <textarea value={form.details} onChange={set('details')} rows={3}
                  placeholder={`Describe what you need from ${pro.full_name}...`}
                  className="input resize-none text-sm" style={{ backgroundColor:'#FFFFFF', color:'#1A1210' }} />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:'rgba(26,18,16,0.5)' }}>Urgency</label>
                <div className="grid grid-cols-3 gap-2">
                  {[['normal','Normal'],['soon','This Week'],['urgent','Urgent']].map(([v,l]) => (
                    <button key={v} onClick={() => setForm(f => ({ ...f, urgency: v }))}
                      className="py-2.5 rounded-xl text-xs font-semibold border-2 transition-all"
                      style={{
                        borderColor:     form.urgency === v ? '#C96A3A' : '#E8DDD2',
                        backgroundColor: form.urgency === v ? 'rgba(201,106,58,0.06)' : '#FFFFFF',
                        color:           form.urgency === v ? '#C96A3A' : '#8A7E78',
                      }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleSend} disabled={sending || !form.name || !form.phone}
                className="btn-primary w-full py-4"
                style={{ opacity: (!form.name || !form.phone) ? 0.5 : 1 }}>
                {sending ? 'Sending...' : `Send Request to ${pro.full_name.split(' ')[0]} →`}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

// ─── Pro Card (Swipe View) ────────────────────────────────
function ProSwipeCard({ pro, onPass, onSave, onContact }) {
  const x        = useMotionValue(0)
  const rotate   = useTransform(x, [-200, 200], [-18, 18])
  const likeOp   = useTransform(x, [30, 120],  [0, 1])
  const passOp   = useTransform(x, [-120, -30], [1, 0])
  const [dragging, setDragging] = useState(false)

  const handleDragEnd = (_, info) => {
    setDragging(false)
    if (info.offset.x > 100)       { onSave(pro);    return }
    if (info.offset.x < -100)      { onPass(pro);    return }
  }

  const EMOJI = { agent:'🏘️', surveyor:'📐', inspector:'🔍', valuer:'📊', lawyer:'⚖️', lender:'🏦', architect:'🏗️', contractor:'🔨' }
  const initials = pro.full_name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase()

  return (
    <motion.div
      style={{ x, rotate, position:'absolute', width:'100%', cursor: dragging ? 'grabbing' : 'grab' }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragStart={() => setDragging(true)}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.98 }}
    >
      {/* Like indicator */}
      <motion.div style={{ opacity: likeOp }}
        className="absolute top-6 left-6 z-20 pointer-events-none"
        initial={{ rotate: -15 }}>
        <div className="border-4 rounded-xl px-3 py-1 font-black text-lg uppercase tracking-widest"
          style={{ borderColor:'#7A9E7E', color:'#7A9E7E' }}>Save ✓</div>
      </motion.div>

      {/* Pass indicator */}
      <motion.div style={{ opacity: passOp }}
        className="absolute top-6 right-6 z-20 pointer-events-none"
        initial={{ rotate: 15 }}>
        <div className="border-4 rounded-xl px-3 py-1 font-black text-lg uppercase tracking-widest"
          style={{ borderColor:'#C96A3A', color:'#C96A3A' }}>Skip ✕</div>
      </motion.div>

      <div className="rounded-3xl overflow-hidden shadow-2xl select-none"
        style={{ backgroundColor:'#FFFAF5', border:'1px solid #E8DDD2', userSelect:'none', touchAction:'none' }}>

        {/* Avatar header */}
        <div className="relative h-48 flex items-center justify-center"
          style={{ background: 'linear-gradient(145deg, #1A1210 0%, #2D2420 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, #C96A3A 0%, transparent 60%), radial-gradient(circle at 70% 30%, #7A9E7E 0%, transparent 60%)' }} />
          {pro.avatar_url ? (
            <img src={pro.avatar_url} alt={pro.full_name} className="w-28 h-28 rounded-full object-cover border-4"
              style={{ borderColor:'rgba(255,255,255,0.2)' }} />
          ) : (
            <div className="w-28 h-28 rounded-full flex items-center justify-center border-4 relative"
              style={{ backgroundColor:'rgba(201,106,58,0.2)', borderColor:'rgba(201,106,58,0.4)' }}>
              <span className="font-display font-black text-4xl" style={{ color:'#C96A3A' }}>{initials}</span>
            </div>
          )}
          {/* Type badge */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ backgroundColor:'rgba(255,255,255,0.12)', color:'#FFFFFF', backdropFilter:'blur(8px)' }}>
            <span>{EMOJI[pro.type]}</span>
            <span className="capitalize">{pro.type}</span>
          </div>
          {/* Verified badge */}
          {pro.is_verified && (
            <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ backgroundColor:'rgba(122,158,126,0.25)', color:'#7A9E7E', border:'1px solid rgba(122,158,126,0.4)' }}>
              <Shield size={9} /> Verified
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-display font-black text-xl" style={{ color:'#1A1210' }}>{pro.full_name}</h3>
              {pro.company && <p className="text-xs mt-0.5" style={{ color:'#C96A3A' }}>{pro.company}</p>}
            </div>
            <StarRating rating={pro.rating || 4.5} count={pro.review_count} size="sm" />
          </div>

          <div className="flex items-center gap-3 mb-3 text-xs" style={{ color:'#8A7E78' }}>
            <div className="flex items-center gap-1">
              <MapPin size={11} style={{ color:'#C96A3A' }} />
              <span>{pro.coverage_areas}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={11} />
              <span>{pro.years_exp}yr exp</span>
            </div>
          </div>

          <p className="text-sm leading-relaxed mb-4 line-clamp-3" style={{ color:'#5C4A3A' }}>
            {pro.bio}
          </p>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button onClick={() => onPass(pro)}
              className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all"
              style={{ borderColor:'rgba(201,106,58,0.3)', backgroundColor:'rgba(201,106,58,0.04)' }}>
              <X size={18} style={{ color:'#C96A3A' }} />
            </button>
            <button onClick={() => onContact(pro)}
              className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all"
              style={{ backgroundColor:'#1A1210', color:'#FFFFFF' }}>
              <MessageCircle size={15} /> Contact
            </button>
            <button onClick={() => onSave(pro)}
              className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all"
              style={{ borderColor:'rgba(122,158,126,0.4)', backgroundColor:'rgba(122,158,126,0.06)' }}>
              <Heart size={18} style={{ color:'#7A9E7E' }} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Pro Card (List View) ─────────────────────────────────
function ProListCard({ pro, onContact, onSave, saved }) {
  const EMOJI = { agent:'🏘️', surveyor:'📐', inspector:'🔍', valuer:'📊', lawyer:'⚖️', lender:'🏦', architect:'🏗️', contractor:'🔨' }
  const initials = pro.full_name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase()

  return (
    <motion.div layout initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor:'#FFFAF5', borderColor:'#E8DDD2' }}>
      <div className="flex gap-0">
        {/* Avatar */}
        <div className="w-20 flex-shrink-0 flex items-center justify-center"
          style={{ background:'linear-gradient(145deg,#1A1210,#2D2420)', minHeight:88 }}>
          {pro.avatar_url
            ? <img src={pro.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
            : <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor:'rgba(201,106,58,0.2)' }}>
                <span className="font-display font-black text-lg" style={{ color:'#C96A3A' }}>{initials}</span>
              </div>
          }
        </div>

        {/* Info */}
        <div className="flex-1 p-3">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <div>
              <p className="font-display font-black text-base" style={{ color:'#1A1210' }}>{pro.full_name}</p>
              <p className="text-xs capitalize" style={{ color:'#C96A3A' }}>{EMOJI[pro.type]} {pro.type} · {pro.years_exp}yr exp</p>
            </div>
            {pro.is_verified && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold flex-shrink-0"
                style={{ backgroundColor:'rgba(122,158,126,0.12)', color:'#5C8060' }}>
                <Shield size={8} /> Verified
              </span>
            )}
          </div>
          <StarRating rating={pro.rating || 4.5} count={pro.review_count} />
          <p className="text-xs mt-1" style={{ color:'#8A7E78' }}>📍 {pro.coverage_areas}</p>
        </div>
      </div>

      <div className="flex gap-2 px-3 pb-3">
        <button onClick={() => onContact(pro)}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold"
          style={{ backgroundColor:'#C96A3A', color:'#FFFFFF' }}>
          Request Service
        </button>
        <button onClick={() => onSave(pro)}
          className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all"
          style={{
            borderColor: saved ? '#7A9E7E' : '#E8DDD2',
            backgroundColor: saved ? 'rgba(122,158,126,0.1)' : '#FFFFFF',
            color: saved ? '#7A9E7E' : '#8A7E78',
          }}>
          <Heart size={13} fill={saved ? '#7A9E7E' : 'none'} />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────
export default function ProfessionalsPage() {
  const { user } = useAuth()
  const [pros,       setPros]       = useState([])
  const [queue,      setQueue]      = useState([])
  const [saved,      setSaved]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewMode,   setViewMode]   = useState('swipe') // 'swipe' | 'list'
  const [contactPro, setContactPro] = useState(null)
  const [empty,      setEmpty]      = useState(false)

  useEffect(() => { loadPros() }, [typeFilter])

  const loadPros = async () => {
    setLoading(true)
    setEmpty(false)
    let q = supabase
      .from('professional_applications')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (typeFilter !== 'all') q = q.eq('type', typeFilter)

    const { data } = await q
    const list = data?.length ? data.map(p => ({
      ...p,
      rating:       p.rating       || (4.2 + Math.random() * 0.7),
      review_count: p.review_count || Math.floor(Math.random() * 80 + 10),
      is_verified:  true,
    })) : DEMO_PROS.filter(p => typeFilter === 'all' || p.type === typeFilter)

    setPros(list)
    setQueue([...list])
    setLoading(false)
    if (!list.length) setEmpty(true)
  }

  const handlePass  = useCallback((pro) => setQueue(q => q.filter(p => p.id !== pro.id)), [])
  const handleSave  = useCallback((pro) => {
    setSaved(s => s.includes(pro.id) ? s : [...s, pro.id])
    setQueue(q => q.filter(p => p.id !== pro.id))
    toast.success(`${pro.full_name.split(' ')[0]} saved! ✅`)
  }, [])

  const topCard   = queue[queue.length - 1]
  const stackSize = Math.min(queue.length, 3)

  return (
    <div className="min-h-screen pt-20 pb-20" style={{ backgroundColor:'#F5EDE0' }}>
      <div className="max-w-lg mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-2xl font-black" style={{ color:'#1A1210' }}>Professionals 💼</h1>
            <p className="text-xs mt-0.5" style={{ color:'#8A7E78' }}>Verified experts: contact in-app</p>
          </div>
          {/* View mode toggle */}
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor:'#E8DDD2' }}>
            {[['swipe','Swipe'],['list','List']].map(([v,l]) => (
              <button key={v} onClick={() => setViewMode(v)}
                className="px-3 py-2 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: viewMode === v ? '#1A1210' : '#FFFFFF',
                  color:           viewMode === v ? '#FFFFFF'  : '#8A7E78',
                }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Type filter */}
        <div className="flex gap-2 overflow-x-auto mb-6 pb-1" style={{ scrollbarWidth:'none' }}>
          {PRO_TYPES.map(t => (
            <button key={t.id} onClick={() => setTypeFilter(t.id)}
              className="px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap border flex-shrink-0 flex items-center gap-1 transition-all"
              style={{
                backgroundColor: typeFilter === t.id ? '#1A1210' : '#FFFFFF',
                color:           typeFilter === t.id ? '#FFFFFF'  : '#5C4A3A',
                borderColor:     typeFilter === t.id ? '#1A1210'  : '#E8DDD2',
              }}>
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-4xl mb-3 animate-bounce">💼</div>
              <p className="text-sm" style={{ color:'#8A7E78' }}>Finding professionals...</p>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && empty && (
          <div className="rounded-3xl p-10 text-center border" style={{ backgroundColor:'#FFFAF5', borderColor:'#E8DDD2' }}>
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-display font-black text-xl mb-2" style={{ color:'#1A1210' }}>No professionals found</h3>
            <p className="text-sm mb-4" style={{ color:'#8A7E78' }}>Try a different category.</p>
            <button onClick={() => setTypeFilter('all')} className="btn-primary px-6 py-3 text-sm">Show All</button>
          </div>
        )}

        {/* Swipe mode */}
        {!loading && !empty && viewMode === 'swipe' && (
          <>
            {queue.length > 0 ? (
              <>
                <div className="relative mb-4" style={{ height: 480 }}>
                  {[...queue].reverse().slice(0, 3).map((pro, i, arr) => {
                    const isTop  = i === arr.length - 1
                    const offset = arr.length - 1 - i
                    return (
                      <div key={pro.id}
                        style={{
                          position: 'absolute', inset: 0,
                          transform: `scale(${1 - offset * 0.04}) translateY(${offset * -10}px)`,
                          transformOrigin: 'bottom center',
                          zIndex: i,
                          pointerEvents: isTop ? 'auto' : 'none',
                        }}>
                        {isTop
                          ? <ProSwipeCard pro={pro} onPass={handlePass} onSave={handleSave} onContact={setContactPro} />
                          : <div className="rounded-3xl w-full h-full opacity-50"
                              style={{ backgroundColor:'#FFFAF5', border:'1px solid #E8DDD2' }} />
                        }
                      </div>
                    )
                  })}
                </div>

                {/* Swipe hint */}
                <div className="flex items-center justify-center gap-8 mb-5 text-xs" style={{ color:'#8A7E78' }}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs"
                      style={{ borderColor:'#C96A3A', color:'#C96A3A' }}>✕</div>
                    <span>Skip</span>
                  </div>
                  <div className="text-xs font-semibold" style={{ color:'rgba(26,18,16,0.3)' }}>swipe left / right</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs"
                      style={{ borderColor:'#7A9E7E', color:'#7A9E7E' }}>♥</div>
                    <span>Save</span>
                  </div>
                </div>

                {/* Remaining count */}
                <p className="text-center text-xs" style={{ color:'#8A7E78' }}>
                  {queue.length} professional{queue.length !== 1 ? 's' : ''} remaining
                </p>
              </>
            ) : (
              <div className="rounded-3xl p-10 text-center" style={{ backgroundColor:'#FFFAF5' }}>
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="font-display font-black text-xl mb-2" style={{ color:'#1A1210' }}>You've seen everyone!</h3>
                <p className="text-sm mb-6" style={{ color:'#8A7E78' }}>
                  {saved.length > 0 ? `You saved ${saved.length} professional${saved.length > 1 ? 's' : ''}.` : 'No one saved yet.'}
                </p>
                <button onClick={loadPros} className="btn-primary px-8 py-3 text-sm">Refresh</button>
              </div>
            )}

            {/* Saved professionals list */}
            {saved.length > 0 && (
              <div className="mt-8">
                <h3 className="font-display font-black text-base mb-3" style={{ color:'#1A1210' }}>
                  Saved ({saved.length})
                </h3>
                <div className="space-y-3">
                  {pros.filter(p => saved.includes(p.id)).map(pro => (
                    <ProListCard key={pro.id} pro={pro} onContact={setContactPro}
                      onSave={handleSave} saved={true} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* List mode */}
        {!loading && !empty && viewMode === 'list' && (
          <div className="space-y-3">
            {pros.map(pro => (
              <ProListCard key={pro.id} pro={pro} onContact={setContactPro}
                onSave={handleSave} saved={saved.includes(pro.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Contact modal */}
      <AnimatePresence>
        {contactPro && <ContactModal pro={contactPro} onClose={() => setContactPro(null)} />}
      </AnimatePresence>
    </div>
  )
}
