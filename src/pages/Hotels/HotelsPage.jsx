import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Star, X, Search, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const DEALMATCH_WA = '2347057392060'

const DEMO_HOTELS = [
  { id:'h1', name:'The Meridian Uyo', city:'Uyo', state:'Akwa Ibom', price_per_night:35_000, rating:4.8, reviews:124, type:'Hotel', rooms:45, amenities:['WiFi','Pool','Restaurant','Gym','Parking','AC'], description:'A premium hotel in the heart of Uyo offering world-class hospitality.', images:[{url:'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',is_primary:true}] },
  { id:'h2', name:'Lagos Executive Suites', city:'Victoria Island', state:'Lagos', price_per_night:85_000, rating:4.9, reviews:287, type:'Boutique Hotel', rooms:20, amenities:['WiFi','Bar','Concierge','Room Service','Gym','Pool'], description:'Luxury boutique hotel with stunning ocean views.', images:[{url:'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',is_primary:true}] },
  { id:'h3', name:'Abuja Transit Inn', city:'Garki', state:'Abuja', price_per_night:22_000, rating:4.3, reviews:89, type:'Budget Hotel', rooms:60, amenities:['WiFi','Restaurant','Parking','AC','Security'], description:'Clean and comfortable hotel near the city centre.', images:[{url:'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',is_primary:true}] },
  { id:'h4', name:'Rivers View Resort', city:'Port Harcourt', state:'Rivers', price_per_night:55_000, rating:4.6, reviews:156, type:'Resort', rooms:80, amenities:['WiFi','Pool','Spa','Restaurant','Bar','Beach Access'], description:'Stunning riverside resort offering unmatched relaxation.', images:[{url:'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',is_primary:true}] },
  { id:'h5', name:'Enugu Heritage Hotel', city:'Enugu', state:'Enugu', price_per_night:18_000, rating:4.1, reviews:67, type:'Budget Hotel', rooms:35, amenities:['WiFi','Restaurant','Parking','Generator','Security'], description:'Affordable hotel in Enugu with warm hospitality.', images:[{url:'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',is_primary:true}] },
  { id:'h6', name:'Calabar Grand Hotel', city:'Calabar', state:'Cross River', price_per_night:28_000, rating:4.4, reviews:112, type:'Hotel', rooms:55, amenities:['WiFi','Pool','Restaurant','Gym','Parking','Spa'], description:'Grand hotel offering premium comfort in Calabar.', images:[{url:'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',is_primary:true}] },
]

const HOTEL_TYPES = [
  { id:'all',    label:'All Hotels', icon:'🏨' },
  { id:'luxury', label:'Luxury',     icon:'💎' },
  { id:'budget', label:'Budget',     icon:'💰' },
  { id:'resort', label:'Resorts',    icon:'🌴' },
]

const AMENITY_ICONS = { WiFi:'📶', Pool:'🏊', Restaurant:'🍽️', Gym:'💪', Parking:'🅿️', Spa:'💆', Bar:'🍹', AC:'❄️', Security:'🔒' }

// ─── Simple Booking Modal — no agreement needed ────────────
function BookingModal({ hotel, onClose }) {
  const [form, setForm]   = useState({ name:'', phone:'', email:'', checkin:'', checkout:'', guests:1, rooms:1, special:'' })
  const [submitted, setSubmitted] = useState(false)
  const set = (k) => (e) => setForm(f => ({...f, [k]: e.target.value}))

  const nights = form.checkin && form.checkout
    ? Math.max(1, Math.ceil((new Date(form.checkout) - new Date(form.checkin)) / (1000*60*60*24)))
    : 1

  const total = hotel.price_per_night * nights * Number(form.rooms)

  const handleBook = (e) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.checkin || !form.checkout) {
      toast.error('Please fill all required fields')
      return
    }

    // All bookings go to DealMatch — not hotel directly
    const msg = encodeURIComponent(
      `🏨 *Hotel Booking Request — DealMatch*\n\n` +
      `Hotel: *${hotel.name}*\n` +
      `Location: ${hotel.city}, ${hotel.state}\n` +
      `Type: ${hotel.type}\n\n` +
      `Guest: ${form.name}\n` +
      `Phone: ${form.phone}\n` +
      `Email: ${form.email || 'Not provided'}\n\n` +
      `Check-in: ${form.checkin}\n` +
      `Check-out: ${form.checkout}\n` +
      `Nights: ${nights}\n` +
      `Guests: ${form.guests} | Rooms: ${form.rooms}\n` +
      `Special Requests: ${form.special || 'None'}\n\n` +
      `💰 Total: ₦${total.toLocaleString()}\n\n` +
      `Please confirm availability and process this booking.`
    )

    window.open(`https://wa.me/${DEALMATCH_WA}?text=${msg}`, '_blank')
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{backgroundColor:'rgba(26,18,16,0.75)', backdropFilter:'blur(8px)'}}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{opacity:0, y:40}} animate={{opacity:1, y:0}}
        className="w-full max-w-md rounded-3xl overflow-hidden flex flex-col"
        style={{backgroundColor:'#FFFAF5', maxHeight:'90vh'}}>

        <div className="p-5 border-b flex items-center justify-between flex-shrink-0"
          style={{borderColor:'#E8DDD2'}}>
          <div>
            <h3 className="font-display text-xl font-black" style={{color:'#1A1210'}}>
              {submitted ? 'Booking Sent! 🎉' : 'Book Your Stay 🏨'}
            </h3>
            <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>{hotel.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{backgroundColor:'rgba(26,18,16,0.08)'}}>
            <X size={14} style={{color:'#5C4A3A'}} />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h4 className="font-display font-black text-xl mb-2" style={{color:'#1A1210'}}>Request Received!</h4>
            <p className="text-sm leading-relaxed mb-2" style={{color:'#8A7E78'}}>
              DealMatch is processing your booking request for <strong>{hotel.name}</strong>.
            </p>
            <p className="text-sm font-semibold mb-6" style={{color:'#C96A3A'}}>
              You'll receive a confirmation on WhatsApp within 2 hours.
            </p>
            <div className="p-4 rounded-2xl mb-5 text-left text-xs space-y-1"
              style={{backgroundColor:'rgba(201,106,58,0.06)', border:'1px solid rgba(201,106,58,0.15)', color:'#5C4A3A'}}>
              <p>📅 Check-in: <strong>{form.checkin}</strong></p>
              <p>📅 Check-out: <strong>{form.checkout}</strong></p>
              <p>👥 {form.guests} guest{form.guests > 1 ? 's' : ''} · {form.rooms} room{form.rooms > 1 ? 's' : ''}</p>
              <p>💰 Total: <strong style={{color:'#C96A3A'}}>₦{total.toLocaleString()}</strong></p>
            </div>
            <button onClick={onClose} className="btn-primary w-full py-3">Done</button>
          </div>
        ) : (
          <form onSubmit={handleBook} className="p-5 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{color:'rgba(26,18,16,0.5)'}}>Full Name *</label>
                <input className="input text-sm py-3" type="text" placeholder="John Doe"
                  value={form.name} onChange={set('name')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{color:'rgba(26,18,16,0.5)'}}>Phone *</label>
                <input className="input text-sm py-3" type="tel" placeholder="0800 000 0000"
                  value={form.phone} onChange={set('phone')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{color:'rgba(26,18,16,0.5)'}}>Email</label>
              <input className="input text-sm py-3" type="email" placeholder="you@example.com"
                value={form.email} onChange={set('email')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{color:'rgba(26,18,16,0.5)'}}>Check-in *</label>
                <input className="input text-sm py-3" type="date" value={form.checkin} onChange={set('checkin')}
                  min={new Date().toISOString().split('T')[0]}
                  style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{color:'rgba(26,18,16,0.5)'}}>Check-out *</label>
                <input className="input text-sm py-3" type="date" value={form.checkout} onChange={set('checkout')}
                  min={form.checkin || new Date().toISOString().split('T')[0]}
                  style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{color:'rgba(26,18,16,0.5)'}}>Guests</label>
                <select className="select text-sm py-3" value={form.guests} onChange={set('guests')}
                  style={{backgroundColor:'#FFFFFF', color:'#1A1210'}}>
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{color:'rgba(26,18,16,0.5)'}}>Rooms</label>
                <select className="select text-sm py-3" value={form.rooms} onChange={set('rooms')}
                  style={{backgroundColor:'#FFFFFF', color:'#1A1210'}}>
                  {[1,2,3,4,5].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{color:'rgba(26,18,16,0.5)'}}>Special Requests</label>
              <input className="input text-sm py-3" type="text"
                placeholder="e.g. Early check-in, ground floor room..."
                value={form.special} onChange={set('special')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
            </div>

            {/* Price summary */}
            {form.checkin && form.checkout && (
              <div className="p-3 rounded-2xl text-sm"
                style={{backgroundColor:'rgba(201,106,58,0.06)', border:'1px solid rgba(201,106,58,0.15)'}}>
                <div className="flex justify-between mb-1" style={{color:'#8A7E78'}}>
                  <span>₦{hotel.price_per_night.toLocaleString()} × {nights} night{nights>1?'s':''} × {form.rooms} room{form.rooms>1?'s':''}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span style={{color:'#1A1210'}}>Total</span>
                  <span style={{color:'#C96A3A', fontWeight:900}}>₦{total.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* DealMatch middleman note */}
            <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
              style={{backgroundColor:'rgba(122,158,126,0.08)', border:'1px solid rgba(122,158,126,0.2)'}}>
              <span style={{color:'#7A9E7E', flexShrink:0}}>🛡️</span>
              <p style={{color:'#5C8060'}}>
                Your booking is processed by DealMatch. We'll confirm availability, handle your reservation, and send you all details on WhatsApp.
              </p>
            </div>

            <button type="submit" className="btn-primary w-full py-4 text-base">
              Request Booking →
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}

// ─── Hotel Card ────────────────────────────────────────────
function HotelCard({ hotel, onBook }) {
  const img = hotel.images?.find(i => i.is_primary)?.url || hotel.images?.[0]?.url
  return (
    <motion.div whileHover={{y:-4}} className="rounded-2xl overflow-hidden border cursor-pointer"
      style={{backgroundColor:'#FFFAF5', borderColor:'#E8DDD2', boxShadow:'0 4px 20px rgba(26,18,16,0.06)'}}>
      <div className="relative h-48 overflow-hidden" style={{backgroundColor:'#F0E6D6'}}>
        {img
          ? <img src={img} alt={hotel.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-5xl">🏨</div>}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold"
          style={{backgroundColor:'rgba(26,18,16,0.7)', color:'#FFFFFF', backdropFilter:'blur(4px)'}}>
          🏨 {hotel.type}
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{backgroundColor:'rgba(212,168,83,0.95)', color:'#1A1210'}}>
          ⭐ {hotel.rating}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display font-black text-base leading-tight mb-1" style={{color:'#1A1210'}}>{hotel.name}</h3>
        <div className="flex items-center gap-1 text-xs mb-1" style={{color:'#8A7E78'}}>
          <MapPin size={11} />{hotel.city}, {hotel.state}
        </div>
        <p className="text-xs mb-3" style={{color:'rgba(26,18,16,0.4)'}}>
          {hotel.reviews} reviews · {hotel.rooms} rooms
        </p>
        <div className="flex flex-wrap gap-1 mb-4">
          {hotel.amenities.slice(0,4).map(a => (
            <span key={a} className="text-xs px-2 py-0.5 rounded-full"
              style={{backgroundColor:'rgba(212,168,83,0.12)', color:'#8A6A20'}}>
              {AMENITY_ICONS[a] || '✓'} {a}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display font-black text-lg" style={{color:'#C96A3A'}}>
              ₦{hotel.price_per_night.toLocaleString()}
            </p>
            <p className="text-xs" style={{color:'#8A7E78'}}>per night</p>
          </div>
          <button onClick={() => onBook(hotel)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{backgroundColor:'#1A1210', color:'#FFFFFF'}}>
            Book Stay →
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function HotelsPage() {
  const [search, setSearch] = useState('')
  const [booking, setBooking] = useState(null)
  const [filter, setFilter]   = useState('all')

  const filtered = DEMO_HOTELS.filter(h => {
    const matchSearch = !search ||
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.city.toLowerCase().includes(search.toLowerCase()) ||
      h.state.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' ||
      (filter === 'luxury' && h.price_per_night >= 50_000) ||
      (filter === 'budget' && h.price_per_night < 30_000) ||
      (filter === 'resort' && h.type === 'Resort')
    return matchSearch && matchFilter
  })

  return (
    <div className="min-h-screen pt-20 pb-16" style={{backgroundColor:'#F5EDE0'}}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-black mb-1" style={{color:'#1A1210'}}>Hotels & Lodging 🏨</h1>
          <p className="text-sm" style={{color:'#8A7E78'}}>Book hotels across Nigeria — processed by DealMatch, no stress</p>
        </div>

        <div className="relative mb-5">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{color:'#8A7E78'}} />
          <input type="text" placeholder="Search by hotel name, city or state..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border text-sm outline-none"
            style={{backgroundColor:'#FFFFFF', borderColor:'#E8DDD2', color:'#1A1210'}} />
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto" style={{scrollbarWidth:'none'}}>
          {HOTEL_TYPES.map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0"
              style={{
                backgroundColor: filter === t.id ? '#1A1210' : '#FFFFFF',
                color: filter === t.id ? '#FFFFFF' : '#5C4A3A',
                border: `1.5px solid ${filter === t.id ? '#1A1210' : '#E8DDD2'}`,
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* List hotel CTA */}
        <Link to="/list-rental?type=hotel"
          className="flex items-center justify-between p-4 rounded-2xl mb-6 border"
          style={{backgroundColor:'#1A1210', borderColor:'#2D2420'}}>
          <div>
            <p className="font-semibold text-sm" style={{color:'#FFFFFF'}}>Are you a hotel or lodge owner?</p>
            <p className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.4)'}}>List your property and get bookings through DealMatch</p>
          </div>
          <div className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{backgroundColor:'#D4A853', color:'#1A1210'}}>
            List Hotel →
          </div>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.length === 0 ? (
            <div className="col-span-2 py-20 text-center">
              <div className="text-5xl mb-4">🏨</div>
              <p className="font-display text-xl font-black mb-2" style={{color:'#1A1210'}}>No hotels found</p>
            </div>
          ) : filtered.map(hotel => (
            <HotelCard key={hotel.id} hotel={hotel} onBook={setBooking} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {booking && <BookingModal hotel={booking} onClose={() => setBooking(null)} />}
      </AnimatePresence>
    </div>
  )
}
