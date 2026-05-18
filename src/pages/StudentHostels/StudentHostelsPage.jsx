/**
 * StudentHostelsPage — /student-hostels
 * ══════════════════════════════════════
 * Free for students to browse. Hostel owners pay a listing fee.
 * Students must verify their student status to view owner contact details.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Search, MapPin, Wifi, Zap, Droplets, Shield, ChevronDown,
  GraduationCap, Phone, MessageCircle, X, Check, Star,
  Building2, Users, DoorOpen, Filter, ChevronRight, ArrowRight,
  BookOpen, AlertCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────────────────────
const WHATSAPP = '2347057392060'

const ROOM_TYPES = {
  single:       { label: 'Single Room',        icon: '🛏️' },
  shared_2:     { label: 'Shared (2 per room)', icon: '🛏️🛏️' },
  shared_4:     { label: 'Shared (4 per room)', icon: '🏘️' },
  shared_6:     { label: 'Shared (6 per room)', icon: '🏠' },
  self_contain: { label: 'Self Contain',        icon: '🚿' },
  mini_flat:    { label: 'Mini Flat',           icon: '🏡' },
  '2_bedroom':  { label: '2 Bedroom',           icon: '🏢' },
}

const GENDER_LABELS = {
  male_only:   { label: 'Male Only',   color: '#5B8DEF' },
  female_only: { label: 'Female Only', color: '#C96A3A' },
  mixed:       { label: 'Mixed',       color: '#7A9E7E' },
}

const AMENITY_ICONS = {
  wifi: { icon: Wifi,    label: 'WiFi'       },
  gen:  { icon: Zap,     label: 'Generator'  },
  water:{ icon: Droplets,label: 'Water'      },
  security: { icon: Shield, label: 'Security'},
}

const fmt = (n) => n ? `₦${Number(n).toLocaleString()}` : '₦0'

// ─── Enquiry Modal ────────────────────────────────────────────────────────────
function EnquiryModal({ hostel, onClose }) {
  const { user, profile } = useAuth()
  const [form, setForm] = useState({
    name: profile?.full_name || '',
    phone: profile?.phone || '',
    email: user?.email || '',
    matric: '',
    message: '',
    moveIn: '',
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSend = async () => {
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return }
    setSending(true)
    try {
      await supabase.from('hostel_enquiries').insert({
        hostel_id:    hostel.id,
        student_id:   user?.id || null,
        student_name: form.name,
        student_phone: form.phone,
        student_email: form.email,
        matric_number: form.matric,
        message:      form.message,
        move_in_date: form.moveIn || null,
      })
      // Increment enquiry count
      await supabase.from('student_hostels').update({ enquiry_count: (hostel.enquiry_count || 0) + 1 }).eq('id', hostel.id)
    } catch {}

    const msg = encodeURIComponent(
      `🎓 *Student Hostel Enquiry — DealMatch*\n\n` +
      `Hostel: ${hostel.title}\n` +
      `Address: ${hostel.address}, ${hostel.city}\n` +
      `Near: ${hostel.institution_name}\n` +
      `Price: ${fmt(hostel.price_per_year)}/yr\n\n` +
      `Student Details:\n` +
      `Name: ${form.name}\n` +
      `Phone: ${form.phone}\n` +
      (form.email  ? `Email: ${form.email}\n`  : '') +
      (form.matric ? `Matric No: ${form.matric}\n` : '') +
      (form.moveIn ? `Move-in: ${form.moveIn}\n`   : '') +
      (form.message ? `\nMessage: ${form.message}` : '')
    )
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank')
    setSent(true)
    setSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ backgroundColor: 'rgba(26,18,16,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ backgroundColor: '#FFFAF5', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #F0E6D6' }}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display font-black text-lg" style={{ color: '#1A1210' }}>Enquire About Room</h3>
              <p className="text-sm mt-0.5" style={{ color: '#8A7E78' }}>{hostel.title}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(26,18,16,0.06)' }}>
              <X size={16} style={{ color: '#1A1210' }} />
            </button>
          </div>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(122,158,126,0.12)', border: '2px solid rgba(122,158,126,0.3)' }}>
              <Check size={28} style={{ color: '#7A9E7E' }} />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: '#1A1210' }}>Enquiry Sent!</h3>
            <p className="text-sm" style={{ color: '#8A7E78' }}>
              The hostel owner has been notified via WhatsApp. They'll contact you at <strong>{form.phone}</strong> shortly.
            </p>
            <button onClick={onClose} className="mt-5 w-full py-3 rounded-2xl font-bold text-sm"
              style={{ backgroundColor: '#1A1210', color: '#FFFAF5' }}>Done</button>
          </div>
        ) : (
          <div className="p-5 space-y-3">
            {[
              { key: 'name',    label: 'Full Name *',      type: 'text',  placeholder: 'Your full name' },
              { key: 'phone',   label: 'Phone Number *',   type: 'tel',   placeholder: '08012345678' },
              { key: 'email',   label: 'Email',            type: 'email', placeholder: 'your@email.com' },
              { key: 'matric',  label: 'Matric Number',    type: 'text',  placeholder: 'Optional — builds trust with owner' },
              { key: 'moveIn',  label: 'Move-in Date',     type: 'date',  placeholder: '' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#8A7E78' }}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ backgroundColor: '#F5EDE0', border: '1px solid #E8DDD2', color: '#1A1210' }} />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#8A7E78' }}>Message</label>
              <textarea value={form.message} onChange={set('message')} rows={3}
                placeholder="Any specific questions about the room?"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                style={{ backgroundColor: '#F5EDE0', border: '1px solid #E8DDD2', color: '#1A1210' }} />
            </div>
            <button onClick={handleSend} disabled={sending || !form.name || !form.phone}
              className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#1A1210', color: '#FFFAF5' }}>
              {sending
                ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <><MessageCircle size={16} /> Send Enquiry</>}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ─── Hostel Card ──────────────────────────────────────────────────────────────
function HostelCard({ hostel, isStudentVerified, onEnquire }) {
  const roomMeta   = ROOM_TYPES[hostel.room_type] || { label: hostel.room_type, icon: '🏠' }
  const genderMeta = GENDER_LABELS[hostel.gender_policy] || { label: hostel.gender_policy, color: '#888' }
  const amenities  = hostel.amenities || []
  const images     = hostel.images || []

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden hover:shadow-lg transition-shadow"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #F0E6D6', boxShadow: '0 2px 12px rgba(26,18,16,0.06)' }}>
      {/* Image */}
      <div className="relative h-48 overflow-hidden" style={{ backgroundColor: '#F5EDE0' }}>
        {images[0] ? (
          <img src={images[0]} alt={hostel.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 size={40} style={{ color: 'rgba(26,18,16,0.15)' }} />
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: genderMeta.color, color: '#fff' }}>
            {genderMeta.label}
          </span>
          {hostel.verified && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"
              style={{ backgroundColor: 'rgba(122,158,126,0.9)', color: '#fff' }}>
              <Check size={10} /> Verified
            </span>
          )}
        </div>
        {hostel.rooms_available > 0 && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: 'rgba(26,18,16,0.75)', color: '#fff' }}>
            {hostel.rooms_available} room{hostel.rooms_available !== 1 ? 's' : ''} left
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-base leading-tight" style={{ color: '#1A1210' }}>{hostel.title}</h3>
          <div className="text-right flex-shrink-0">
            <div className="font-black text-base" style={{ color: '#C96A3A' }}>{fmt(hostel.price_per_year)}</div>
            <div className="text-xs" style={{ color: '#8A7E78' }}>per year</div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin size={12} style={{ color: '#8A7E78', flexShrink: 0 }} />
          <span className="text-xs truncate" style={{ color: '#8A7E78' }}>{hostel.address}, {hostel.city}</span>
        </div>

        {/* Institution + distance */}
        {hostel.institution_name && (
          <div className="flex items-center gap-1.5 mb-3">
            <GraduationCap size={12} style={{ color: '#C96A3A', flexShrink: 0 }} />
            <span className="text-xs font-semibold" style={{ color: '#C96A3A' }}>
              Near {hostel.institution_name}
              {hostel.distance_label && <span style={{ color: '#8A7E78', fontWeight: 400 }}> · {hostel.distance_label}</span>}
            </span>
          </div>
        )}

        {/* Room type + amenities */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="px-2 py-1 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: '#F5EDE0', color: '#1A1210' }}>
            {roomMeta.icon} {roomMeta.label}
          </span>
          {amenities.slice(0, 3).map(a => {
            const meta = AMENITY_ICONS[a]
            if (!meta) return null
            const Icon = meta.icon
            return (
              <span key={a} className="px-2 py-1 rounded-lg text-xs flex items-center gap-1"
                style={{ backgroundColor: '#F5EDE0', color: '#8A7E78' }}>
                <Icon size={10} />{meta.label}
              </span>
            )
          })}
          {amenities.length > 3 && (
            <span className="text-xs" style={{ color: '#8A7E78' }}>+{amenities.length - 3} more</span>
          )}
        </div>

        {/* Fees breakdown */}
        {(hostel.caution_fee > 0 || hostel.agency_fee > 0) && (
          <div className="flex gap-3 mb-3 text-xs" style={{ color: '#8A7E78' }}>
            {hostel.caution_fee > 0 && <span>Caution: {fmt(hostel.caution_fee)}</span>}
            {hostel.agency_fee  > 0 && <span>Agency: {fmt(hostel.agency_fee)}</span>}
          </div>
        )}

        {/* CTA */}
        <button onClick={() => onEnquire(hostel)}
          className="w-full py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2"
          style={{ backgroundColor: '#1A1210', color: '#FFFAF5' }}>
          <MessageCircle size={15} /> Enquire Now — It's Free
        </button>

        {!isStudentVerified && (
          <p className="text-xs text-center mt-2" style={{ color: '#8A7E78' }}>
            <Link to="/student-verify" className="underline font-semibold" style={{ color: '#C96A3A' }}>
              Verify your student ID
            </Link> to get owner's direct contact
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentHostelsPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [hostels,    setHostels]    = useState([])
  const [institutions, setInstitutions] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [institution, setInstitution] = useState('all')
  const [roomType,   setRoomType]   = useState('all')
  const [gender,     setGender]     = useState('all')
  const [maxPrice,   setMaxPrice]   = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [enquireTarget, setEnquireTarget] = useState(null)

  const isStudentVerified = profile?.is_student_verified === true

  useEffect(() => {
    loadData()
  }, [institution, roomType, gender])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Load institutions for filter
      const { data: instData } = await supabase.from('institutions').select('id,name,short_name,state').order('name')
      setInstitutions(instData || [])

      // Load hostels
      let q = supabase.from('student_hostels')
        .select('*')
        .eq('status', 'active')
        .eq('listing_paid', true)
        .order('created_at', { ascending: false })

      if (institution !== 'all') q = q.eq('institution_id', institution)
      if (roomType   !== 'all') q = q.eq('room_type', roomType)
      if (gender     !== 'all') q = q.eq('gender_policy', gender)

      const { data } = await q
      setHostels(data || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [institution, roomType, gender])

  const filtered = hostels.filter(h => {
    if (search && !h.title?.toLowerCase().includes(search.toLowerCase()) &&
        !h.city?.toLowerCase().includes(search.toLowerCase()) &&
        !h.institution_name?.toLowerCase().includes(search.toLowerCase())) return false
    if (maxPrice && h.price_per_year > Number(maxPrice)) return false
    return true
  })

  return (
    <div style={{ backgroundColor: '#FFFAF5', minHeight: '100vh' }}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #1A1210 0%, #2D1F1A 50%, #1A1210 100%)', paddingTop: 80 }}>
        <div className="max-w-4xl mx-auto px-5 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-bold"
            style={{ backgroundColor: 'rgba(201,106,58,0.15)', color: '#C96A3A', border: '1px solid rgba(201,106,58,0.25)' }}>
            <GraduationCap size={13} /> Free for Students
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-3 leading-tight">
            Find Your Off-Campus<br />
            <span style={{ color: '#C96A3A' }}>Hostel</span> Near Your School
          </h1>
          <p className="text-base mb-8 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Browse verified off-campus hostels near your university or polytechnic.
            100% free for students — no hidden charges.
          </p>

          {/* Search bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(26,18,16,0.4)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by hostel name, school, or city…"
                className="w-full pl-11 pr-4 py-4 rounded-2xl text-sm outline-none"
                style={{ backgroundColor: '#FFFAF5', color: '#1A1210', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }} />
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
            {[
              { icon: '🆓', text: 'Free to browse' },
              { icon: '✅', text: 'Verified hostels' },
              { icon: '🎓', text: 'Student-first' },
              { icon: '📍', text: 'Near your campus' },
            ].map(b => (
              <div key={b.text} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <span>{b.icon}</span><span>{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #F0E6D6', position: 'sticky', top: 64, zIndex: 30 }}>
        <div className="max-w-6xl mx-auto px-5 py-3">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 hide-scrollbar">
            {/* Institution filter */}
            <div className="relative flex-shrink-0">
              <select value={institution} onChange={e => setInstitution(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                style={{ backgroundColor: institution !== 'all' ? '#C96A3A' : '#F5EDE0', color: institution !== 'all' ? '#fff' : '#1A1210', border: 'none', minWidth: 140 }}>
                <option value="all">All Schools</option>
                {institutions.map(i => <option key={i.id} value={i.id}>{i.short_name || i.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: institution !== 'all' ? '#fff' : '#8A7E78' }} />
            </div>

            {/* Room type */}
            <div className="relative flex-shrink-0">
              <select value={roomType} onChange={e => setRoomType(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 rounded-xl text-xs font-semibold outline-none cursor-pointer"
                style={{ backgroundColor: roomType !== 'all' ? '#C96A3A' : '#F5EDE0', color: roomType !== 'all' ? '#fff' : '#1A1210', border: 'none', minWidth: 130 }}>
                <option value="all">All Room Types</option>
                {Object.entries(ROOM_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: roomType !== 'all' ? '#fff' : '#8A7E78' }} />
            </div>

            {/* Gender policy */}
            {['all', 'male_only', 'female_only', 'mixed'].map(g => (
              <button key={g} onClick={() => setGender(g)}
                className="px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all"
                style={{ backgroundColor: gender === g ? '#1A1210' : '#F5EDE0', color: gender === g ? '#FFFAF5' : '#1A1210' }}>
                {g === 'all' ? 'Any Gender' : GENDER_LABELS[g]?.label}
              </button>
            ))}

            {/* Max price */}
            <div className="relative flex-shrink-0">
              <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} type="number"
                placeholder="Max price/yr"
                className="pl-3 pr-3 py-2 rounded-xl text-xs font-semibold outline-none"
                style={{ backgroundColor: '#F5EDE0', color: '#1A1210', border: 'none', width: 120 }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-5 py-8">

        {/* Student verification banner */}
        {!isStudentVerified && user && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 mb-6 flex items-start gap-3"
            style={{ backgroundColor: 'rgba(201,106,58,0.06)', border: '1px solid rgba(201,106,58,0.2)' }}>
            <GraduationCap size={18} style={{ color: '#C96A3A', flexShrink: 0, marginTop: 1 }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#1A1210' }}>Verify your student status to unlock owner contacts</p>
              <p className="text-xs mt-0.5" style={{ color: '#8A7E78' }}>
                Upload your student ID to get direct phone numbers and WhatsApp contacts of hostel owners.
              </p>
            </div>
            <Link to="/student-verify"
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
              style={{ backgroundColor: '#C96A3A', color: '#fff' }}>
              Verify Now
            </Link>
          </motion.div>
        )}

        {!user && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 mb-6 flex items-start gap-3"
            style={{ backgroundColor: 'rgba(26,18,16,0.04)', border: '1px solid #E8DDD2' }}>
            <AlertCircle size={18} style={{ color: '#8A7E78', flexShrink: 0, marginTop: 1 }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#1A1210' }}>Sign in to enquire and get owner contacts</p>
              <p className="text-xs mt-0.5" style={{ color: '#8A7E78' }}>It's free — no payment needed for students.</p>
            </div>
            <Link to="/auth" className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ backgroundColor: '#1A1210', color: '#FFFAF5' }}>Sign In</Link>
          </motion.div>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-lg" style={{ color: '#1A1210' }}>
              {loading ? 'Loading…' : `${filtered.length} hostel${filtered.length !== 1 ? 's' : ''} available`}
            </h2>
            {institution !== 'all' && (
              <p className="text-sm" style={{ color: '#8A7E78' }}>
                Near {institutions.find(i => i.id === institution)?.name || ''}
              </p>
            )}
          </div>
          <Link to="/list-hostel"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ backgroundColor: '#C96A3A', color: '#fff' }}>
            <Building2 size={14} /> List Your Hostel
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-3xl overflow-hidden animate-pulse" style={{ backgroundColor: '#F5EDE0', height: 360 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏠</div>
            <h3 className="font-bold text-lg mb-2" style={{ color: '#1A1210' }}>No hostels found</h3>
            <p className="text-sm mb-6" style={{ color: '#8A7E78' }}>
              {institution !== 'all' ? 'No hostels listed near this school yet.' : 'Try adjusting your filters.'}
            </p>
            <Link to="/list-hostel"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm"
              style={{ backgroundColor: '#1A1210', color: '#FFFAF5' }}>
              Be the first to list a hostel <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(h => (
              <HostelCard key={h.id} hostel={h} isStudentVerified={isStudentVerified}
                onEnquire={setEnquireTarget} />
            ))}
          </div>
        )}

        {/* CTA for hostel owners */}
        <div className="mt-12 rounded-3xl p-8 text-center"
          style={{ background: 'linear-gradient(135deg, #1A1210 0%, #2D1F1A 100%)' }}>
          <Building2 size={32} style={{ color: '#C96A3A', margin: '0 auto 12px' }} />
          <h3 className="font-display font-black text-xl text-white mb-2">
            Own a Hostel Near a University?
          </h3>
          <p className="text-sm mb-5 max-w-sm mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
            List your rooms and reach thousands of verified students actively looking for accommodation.
            Starting from ₦5,000/semester.
          </p>
          <Link to="/list-hostel"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: '#C96A3A', color: '#fff' }}>
            List Your Hostel <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Enquiry modal */}
      <AnimatePresence>
        {enquireTarget && (
          <EnquiryModal hostel={enquireTarget} onClose={() => setEnquireTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
