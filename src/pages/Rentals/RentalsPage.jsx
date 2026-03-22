import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Grid, Layers, MapPin, Bed, Bath, Maximize, Heart, X, Star, Search, SlidersHorizontal, RefreshCw } from 'lucide-react'
import { getProperties } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { analytics } from '@/lib/posthog'
import { recordSwipe } from '@/lib/supabase'
import toast from 'react-hot-toast'
import DealAgreement from '@/components/ui/DealAgreement'
import clsx from 'clsx'

const formatPrice = (n, period) => {
  if (!n) return '₦0'
  const formatted = n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M` : `₦${n.toLocaleString()}`
  return period ? `${formatted}/${period}` : formatted
}

const DEMO_RENTALS = [
  { id:'r1', title:'Luxury 3-Bed Apartment', category:'rental', listing_type:'For Rent', price:250_000, price_period:'month', property_type:'apartment', city:'Lekki Phase 1', state:'Lagos', bedrooms:3, bathrooms:3, size_sqm:180, features:['Fully Furnished','24/7 Security','Generator','Swimming Pool'], description:'A stunning fully furnished apartment in the heart of Lekki. Perfect for professionals and families.', images:[{url:'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',is_primary:true}], video_url:'', contact_phone:'+2347057392060', landlord_name:'Divine Bassey' },
  { id:'r2', title:'Cozy 2-Bed Flat', category:'rental', listing_type:'For Rent', price:120_000, price_period:'month', property_type:'apartment', city:'Wuse 2', state:'Abuja', bedrooms:2, bathrooms:2, size_sqm:110, features:['DSTV','Generator','Parking','Security'], description:'Modern 2-bedroom flat in a serene estate. Ideal for young couples or small families.', images:[{url:'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',is_primary:true}], video_url:'', contact_phone:'+2347057392060', landlord_name:'James Okafor' },
  { id:'r3', title:'1-Bed Studio Short-let', category:'shortlet', listing_type:'Short-let', price:25_000, price_period:'night', property_type:'apartment', city:'Victoria Island', state:'Lagos', bedrooms:1, bathrooms:1, size_sqm:60, features:['WiFi','Netflix','AC','Kitchen'], description:'Stylish studio apartment available for short stays. Fully serviced, great location.', images:[{url:'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',is_primary:true}], video_url:'', contact_phone:'+2347057392060', landlord_name:'Amaka Hotels' },
  { id:'r4', title:'Spacious 4-Bed Duplex', category:'rental', listing_type:'For Rent', price:450_000, price_period:'month', property_type:'duplex', city:'GRA Phase 2', state:'Rivers', bedrooms:4, bathrooms:4, size_sqm:320, features:['BQ','Pool','Smart Home','Garden'], description:'Executive duplex with boys quarters in a secured GRA estate. Ideal for executives.', images:[{url:'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',is_primary:true}], video_url:'', contact_phone:'+2347057392060', landlord_name:'Emeka Properties' },
  { id:'r5', title:'Modern Studio Short-let', category:'shortlet', listing_type:'Short-let', price:18_000, price_period:'night', property_type:'apartment', city:'Uyo', state:'Akwa Ibom', bedrooms:1, bathrooms:1, size_sqm:45, features:['WiFi','AC','Workspace','Netflix'], description:'Clean and modern studio perfect for business travellers and tourists visiting Uyo.', images:[{url:'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',is_primary:true}], video_url:'', contact_phone:'+2347057392060', landlord_name:'Uyo Stays' },
  { id:'r6', title:'3-Bed Terrace Rental', category:'rental', listing_type:'For Rent', price:200_000, price_period:'month', property_type:'terrace', city:'Ikeja GRA', state:'Lagos', bedrooms:3, bathrooms:3, size_sqm:200, features:['Estate','Parking','Borehole','CCTV'], description:'Well-maintained terrace in a secure Ikeja GRA estate. Close to airport and major offices.', images:[{url:'https://images.unsplash.com/photo-1582063289852-62e3ba2747f8?w=800&q=80',is_primary:true}], video_url:'', contact_phone:'+2347057392060', landlord_name:'Lagos Homes' },
]

const CATEGORY_TABS = [
  { id:'all',     label:'All',        icon:'🏠' },
  { id:'rental',  label:'For Rent',   icon:'🔑' },
  { id:'shortlet',label:'Short-let',  icon:'🌙' },
]

// ─── Interest Modal ────────────────────────────────────────
function InterestModal({ property, onClose }) {
  const [form, setForm] = useState({ name:'', phone:'', email:'', move_in:'', message:'' })
  const [step, setStep] = useState('form') // 'form' | 'success'
  const set = (k) => (e) => setForm(f => ({...f, [k]: e.target.value}))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.phone) return toast.error('Please fill your name and phone')
    setStep('success')
    analytics.matchContacted(property.id)
  }

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hello! I'm interested in renting: *${property.title}* in ${property.city}, ${property.state}.\n\nPrice: ${formatPrice(property.price, property.price_period)}\n\nMy name: ${form.name || 'Interested Renter'}\nPhone: ${form.phone || 'See above'}`
    )
    window.open(`https://wa.me/${(property.contact_phone || '2347057392060').replace(/\D/g,'')}?text=${msg}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{backgroundColor:'rgba(26,18,16,0.7)', backdropFilter:'blur(8px)'}}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{opacity:0, y:40}} animate={{opacity:1, y:0}} exit={{opacity:0, y:40}}
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{backgroundColor:'#FFFAF5'}}>

        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between" style={{borderColor:'#E8DDD2'}}>
          <div>
            <h3 className="font-display text-xl font-black" style={{color:'#1A1210'}}>
              {step === 'form' ? 'Express Interest 🏠' : 'Request Sent! 🎉'}
            </h3>
            <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>{property.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{backgroundColor:'rgba(26,18,16,0.08)'}}>
            <X size={14} style={{color:'#5C4A3A'}} />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{color:'rgba(26,18,16,0.5)'}}>Full Name *</label>
                <input className="input text-sm py-3" type="text" placeholder="John Doe" value={form.name} onChange={set('name')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{color:'rgba(26,18,16,0.5)'}}>Phone *</label>
                <input className="input text-sm py-3" type="tel" placeholder="0800 000 0000" value={form.phone} onChange={set('phone')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{color:'rgba(26,18,16,0.5)'}}>Email</label>
              <input className="input text-sm py-3" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{color:'rgba(26,18,16,0.5)'}}>
                {property.category === 'shortlet' ? 'Check-in Date' : 'Move-in Date'}
              </label>
              <input className="input text-sm py-3" type="date" value={form.move_in} onChange={set('move_in')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{color:'rgba(26,18,16,0.5)'}}>Message (optional)</label>
              <textarea className="input resize-none text-sm" rows={2} placeholder="Any questions or special requirements..." value={form.message} onChange={set('message')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button type="button" onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all"
                style={{backgroundColor:'#25D366', color:'#FFFFFF'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </button>
              <button type="submit" className="btn-primary py-3 text-sm">
                Send Interest →
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="font-display text-2xl font-black mb-2" style={{color:'#1A1210'}}>Interest sent!</h3>
            <p className="text-sm leading-relaxed mb-6" style={{color:'#8A7E78'}}>
              {property.landlord_name || 'The landlord'} will contact you within 24 hours. You can also reach them directly on WhatsApp.
            </p>
            <div className="flex gap-3">
              <button onClick={handleWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
                style={{backgroundColor:'#25D366', color:'#FFFFFF'}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Chat Now
              </button>
              <button onClick={onClose} className="flex-1 py-3 rounded-2xl text-sm font-semibold border-2"
                style={{borderColor:'#E8DDD2', color:'#5C4A3A', backgroundColor:'#FFFFFF'}}>
                Close
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ─── Rental Card (Grid view) ───────────────────────────────
function RentalCard({ property, onInterest }) {
  const img = property.images?.find(i => i.is_primary)?.url || property.images?.[0]?.url
  const isShortlet = property.category === 'shortlet'

  return (
    <motion.div whileHover={{y:-4}} className="rounded-2xl overflow-hidden border"
      style={{backgroundColor:'#FFFAF5', borderColor:'#E8DDD2', boxShadow:'0 4px 20px rgba(26,18,16,0.06)'}}>
      {/* Image */}
      <div className="relative h-48 overflow-hidden" style={{backgroundColor:'#F0E6D6'}}>
        {img
          ? <img src={img} alt={property.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-5xl">🏠</div>
        }
        {/* Category badge */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold"
          style={{
            backgroundColor: isShortlet ? '#1A1210' : '#C96A3A',
            color: '#FFFFFF',
          }}>
          {isShortlet ? '🌙 Short-let' : '🔑 For Rent'}
        </div>
        {/* Video indicator */}
        {property.video_url && (
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
            style={{backgroundColor:'rgba(26,18,16,0.6)'}}>
            <span className="text-white text-xs">▶</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-display font-black text-base leading-tight mb-1" style={{color:'#1A1210'}}>
          {property.title}
        </h3>
        <div className="flex items-center gap-1 text-xs mb-3" style={{color:'#8A7E78'}}>
          <MapPin size={11} />{property.city}, {property.state}
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 text-xs mb-3" style={{color:'#8A7E78'}}>
          {property.bedrooms  && <span className="flex items-center gap-1"><Bed size={11} /> {property.bedrooms} bed</span>}
          {property.bathrooms && <span className="flex items-center gap-1"><Bath size={11} /> {property.bathrooms} bath</span>}
          {property.size_sqm  && <span className="flex items-center gap-1"><Maximize size={11} /> {property.size_sqm}sqm</span>}
        </div>

        {/* Features */}
        {property.features?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {property.features.slice(0,3).map(f => (
              <span key={f} className="text-xs px-2 py-0.5 rounded-full"
                style={{backgroundColor:'rgba(201,106,58,0.08)', color:'#C96A3A'}}>
                {f}
              </span>
            ))}
            {property.features.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{backgroundColor:'rgba(26,18,16,0.05)', color:'#8A7E78'}}>
                +{property.features.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display font-black text-lg" style={{color:'#C96A3A'}}>
              {formatPrice(property.price, property.price_period)}
            </p>
          </div>
          <button onClick={() => onInterest(property)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{backgroundColor:'#C96A3A', color:'#FFFFFF'}}>
            {isShortlet ? 'Book Now' : 'I\'m Interested'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Swipe Card for Rentals ────────────────────────────────
function RentalSwipeCard({ property, onSwipe, onInterest }) {
  const [offset, setOffset]   = useState({x:0, y:0})
  const [exiting, setExiting] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const startPos = useRef(null)
  const hasDragged = useRef(false)
  const cardRef = useRef(null)
  const img = property.images?.find(i => i.is_primary)?.url || property.images?.[0]?.url
  const isShortlet = property.category === 'shortlet'

  const onPointerDown = (e) => {
    if (e.target.closest('[data-action]')) return
    startPos.current = { x: e.clientX, y: e.clientY }
    hasDragged.current = false
    cardRef.current?.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!startPos.current) return
    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y
    if (Math.abs(dx) > 5) { hasDragged.current = true; setIsDragging(true) }
    if (hasDragged.current) setOffset({ x: dx, y: dy * 0.3 })
  }

  const onPointerUp = () => {
    if (!startPos.current) return
    startPos.current = null
    setIsDragging(false)
    if (!hasDragged.current) { setOffset({x:0, y:0}); return }
    if (offset.x > 100) swipe('like')
    else if (offset.x < -100) swipe('pass')
    else setOffset({x:0, y:0})
  }

  const swipe = (action) => {
    if (exiting) return
    setExiting(action)
    setTimeout(() => onSwipe(action, property), 380)
    if (action === 'like') toast.success('Added to your saved! ❤️')
  }

  const rotation = isDragging ? offset.x / 20 : 0
  const likeOpacity = Math.max(0, Math.min(1, offset.x / 80))
  const passOpacity = Math.max(0, Math.min(1, -offset.x / 80))

  let transform = `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`
  let opacity = 1
  if (exiting === 'like') { transform = 'translateX(130vw) rotate(20deg)'; opacity = 0 }
  if (exiting === 'pass') { transform = 'translateX(-130vw) rotate(-20deg)'; opacity = 0 }

  return (
    <div ref={cardRef}
      className="w-full max-w-sm mx-auto rounded-[2rem] overflow-hidden select-none"
      style={{
        transform, opacity,
        transition: isDragging ? 'none' : 'transform 0.38s ease, opacity 0.38s ease',
        touchAction: 'none',
        backgroundColor: '#FFFAF5',
        boxShadow: '0 24px 80px rgba(26,18,16,0.18)',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Like/Pass indicators */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none" style={{opacity: likeOpacity, transform:'rotate(-15deg)'}}>
        <div className="border-4 border-[#7A9E7E] text-[#7A9E7E] font-black text-xl px-4 py-1 rounded-xl uppercase tracking-widest">Save ❤️</div>
      </div>
      <div className="absolute top-6 right-6 z-20 pointer-events-none" style={{opacity: passOpacity, transform:'rotate(15deg)'}}>
        <div className="border-4 border-[#C96A3A] text-[#C96A3A] font-black text-xl px-4 py-1 rounded-xl uppercase tracking-widest">Skip ✕</div>
      </div>

      {/* Image */}
      <div className="relative h-64" style={{backgroundColor:'#F0E6D6'}}>
        {img
          ? <img src={img} alt={property.title} className="w-full h-full object-cover pointer-events-none" draggable={false} />
          : <div className="w-full h-full flex items-center justify-center text-7xl">🏠</div>
        }
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold"
          style={{backgroundColor: isShortlet ? '#1A1210' : '#C96A3A', color:'#FFFFFF'}}>
          {isShortlet ? '🌙 Short-let' : '🔑 For Rent'}
        </div>
        <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full text-sm font-black"
          style={{backgroundColor:'#C96A3A', color:'#FFFFFF', boxShadow:'0 4px 16px rgba(201,106,58,0.5)'}}>
          {formatPrice(property.price, property.price_period)}
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-display text-2xl font-black leading-tight mb-1" style={{color:'#1A1210'}}>{property.title}</h3>
        <div className="flex items-center gap-1.5 text-sm mb-3" style={{color:'#8A7E78'}}>
          <MapPin size={13} />{property.city}, {property.state}
        </div>
        <div className="flex items-center gap-4 text-sm mb-4" style={{color:'#8A7E78'}}>
          {property.bedrooms  && <span className="flex items-center gap-1"><Bed size={13} /> {property.bedrooms} bed</span>}
          {property.bathrooms && <span className="flex items-center gap-1"><Bath size={13} /> {property.bathrooms} bath</span>}
          {property.size_sqm  && <span className="flex items-center gap-1"><Maximize size={13} /> {property.size_sqm}sqm</span>}
        </div>
        {property.features?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {property.features.slice(0,3).map(f => (
              <span key={f} className="text-xs px-2.5 py-1 rounded-full"
                style={{backgroundColor:'rgba(201,106,58,0.08)', color:'#C96A3A'}}>{f}</span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 px-5 pb-5">
        <button data-action="pass" onClick={() => swipe('pass')}
          className="flex-1 h-14 rounded-2xl flex items-center justify-center transition-all"
          style={{backgroundColor:'rgba(26,18,16,0.05)'}}>
          <X size={22} style={{color:'rgba(26,18,16,0.4)'}} />
        </button>
        <button data-action="interest" onClick={() => onInterest(property)}
          className="flex-1 h-14 rounded-2xl flex items-center justify-center font-semibold text-sm transition-all"
          style={{backgroundColor:'#C96A3A', color:'#FFFFFF', boxShadow:'0 8px 24px rgba(201,106,58,0.4)'}}>
          {isShortlet ? 'Book Now' : "I'm Interested"}
        </button>
        <button data-action="like" onClick={() => swipe('like')}
          className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all"
          style={{backgroundColor:'rgba(122,158,126,0.15)'}}>
          <Heart size={20} style={{color:'#7A9E7E'}} />
        </button>
      </div>
    </div>
  )
}

// Need useRef
import { useRef } from 'react'

// ─── Main Page ─────────────────────────────────────────────
export default function RentalsPage() {
  const { user } = useAuth() || {}
  const [view, setView]         = useState('grid')  // 'grid' | 'swipe'
  const [category, setCategory] = useState('all')
  const [search, setSearch]     = useState('')
  const [rentals, setRentals]   = useState(DEMO_RENTALS)
  const [queue, setQueue]       = useState(DEMO_RENTALS)
  const [loading, setLoading]   = useState(false)
  const [interest, setInterest] = useState(null)
  const [agreement, setAgreement] = useState(null)

  const filtered = rentals.filter(r => {
    const matchCat = category === 'all' || r.category === category
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase()) ||
      r.state.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleSwipe = (action, property) => {
    setQueue(q => q.filter(p => p.id !== property.id))
  }

  const currentCard = queue.filter(p => category === 'all' || p.category === category)[0]
  const nextCard    = queue.filter(p => category === 'all' || p.category === category)[1]

  return (
    <div className="min-h-screen pt-20 pb-16" style={{backgroundColor:'#F5EDE0'}}>
      <div className="max-w-4xl mx-auto px-4">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-black mb-1" style={{color:'#1A1210'}}>
            Rentals & Short-lets 🔑
          </h1>
          <p className="text-sm" style={{color:'#8A7E78'}}>
            Find your next home or short stay — no agents, no stress
          </p>
        </div>

        {/* Search + view toggle */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{color:'#8A7E78'}} />
            <input type="text" placeholder="Search by city, state or name..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border text-sm outline-none"
              style={{backgroundColor:'#FFFFFF', borderColor:'#E8DDD2', color:'#1A1210'}} />
          </div>
          <div className="flex rounded-2xl overflow-hidden border" style={{borderColor:'#E8DDD2', backgroundColor:'#FFFFFF'}}>
            <button onClick={() => setView('grid')}
              className="px-4 py-3 flex items-center justify-center transition-all"
              style={{backgroundColor: view === 'grid' ? '#C96A3A' : 'transparent'}}>
              <Grid size={16} style={{color: view === 'grid' ? '#FFFFFF' : '#8A7E78'}} />
            </button>
            <button onClick={() => setView('swipe')}
              className="px-4 py-3 flex items-center justify-center transition-all"
              style={{backgroundColor: view === 'swipe' ? '#C96A3A' : 'transparent'}}>
              <Layers size={16} style={{color: view === 'swipe' ? '#FFFFFF' : '#8A7E78'}} />
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto" style={{scrollbarWidth:'none'}}>
          {CATEGORY_TABS.map(tab => (
            <button key={tab.id} onClick={() => setCategory(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0"
              style={{
                backgroundColor: category === tab.id ? '#C96A3A' : '#FFFFFF',
                color: category === tab.id ? '#FFFFFF' : '#5C4A3A',
                border: `1.5px solid ${category === tab.id ? '#C96A3A' : '#E8DDD2'}`,
              }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* List your property CTA */}
        <Link to="/list-rental"
          className="flex items-center justify-between p-4 rounded-2xl mb-6 border transition-all hover:-translate-y-0.5"
          style={{backgroundColor:'#1A1210', borderColor:'#2D2420'}}>
          <div>
            <p className="font-semibold text-sm" style={{color:'#FFFFFF'}}>Are you a landlord or hotel owner?</p>
            <p className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.4)'}}>List your property and get bookings directly</p>
          </div>
          <div className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{backgroundColor:'#C96A3A', color:'#FFFFFF'}}>
            List Now →
          </div>
        </Link>

        {/* Grid view */}
        {view === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.length === 0 ? (
              <div className="col-span-2 py-20 text-center">
                <div className="text-5xl mb-4">🏠</div>
                <p className="font-display text-xl font-black mb-2" style={{color:'#1A1210'}}>No listings found</p>
                <p className="text-sm" style={{color:'#8A7E78'}}>Try a different category or search term</p>
              </div>
            ) : (
              filtered.map(property => (
                <RentalCard key={property.id} property={property} onInterest={setAgreement} />
              ))
            )}
          </div>
        )}

        {/* Swipe view */}
        {view === 'swipe' && (
          <div>
            <div className="relative flex justify-center" style={{height:580}}>
              {!currentCard ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center px-8">
                  <div className="text-6xl">🎉</div>
                  <h3 className="font-display text-2xl font-black" style={{color:'#1A1210'}}>You've seen them all!</h3>
                  <button onClick={() => setQueue(DEMO_RENTALS)} className="btn-primary text-sm px-6 py-3">
                    <RefreshCw size={14} className="mr-2 inline" /> Refresh
                  </button>
                </div>
              ) : (
                <>
                  {nextCard && (
                    <div className="absolute inset-0 flex justify-center items-center pointer-events-none"
                      style={{transform:'scale(0.94) translateY(12px)', zIndex:1}}>
                      <div className="w-full max-w-sm rounded-[2rem] opacity-60"
                        style={{height:460, backgroundColor:'#FFFAF5', boxShadow:'0 12px 40px rgba(26,18,16,0.1)'}} />
                    </div>
                  )}
                  <div className="absolute inset-0 flex justify-center items-start" style={{zIndex:2}}>
                    <RentalSwipeCard
                      property={currentCard}
                      onSwipe={handleSwipe}
                      onInterest={setAgreement}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs" style={{color:'rgba(26,18,16,0.3)'}}>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{backgroundColor:'rgba(26,18,16,0.08)'}}>✕</span> Skip
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{backgroundColor:'rgba(201,106,58,0.15)'}}>🔑</span> Interested
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{backgroundColor:'rgba(122,158,126,0.15)'}}>❤️</span> Save
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Interest modal */}
      <AnimatePresence>
        {agreement && <DealAgreement property={agreement} category={agreement.category || 'rental'} onClose={() => setAgreement(null)} onAccepted={() => { setAgreement(null); toast.success('Agreement submitted! DealMatch will contact you shortly.') }} />}
      </AnimatePresence>
    </div>
  )
}
