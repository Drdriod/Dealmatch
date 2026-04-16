import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, ArrowLeft, ArrowRight, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import CommissionAgreement from '@/components/ui/CommissionAgreement'
import toast from 'react-hot-toast'

const STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara','Abuja (FCT)']

const HOTEL_FEATURES = ['Pool','Restaurant','Bar','Gym','Spa','Wifi','Generator','AC','Room Service','Conference Hall','Parking','Security','CCTV','Laundry']
const RENTAL_FEATURES = ['Furnished','Wifi','Generator','AC','Security','Parking','Borehole','Prepaid Meter','Pop Ceiling','Tiled Floor','Kitchen','Store']

export default function ListRentalPage() {
  const [params]    = useSearchParams()
  const type        = params.get('type') || 'rental'
  const isHotel     = type === 'hotel'
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [step,      setStep]    = useState(0)
  const [saving,    setSaving]  = useState(false)
  const [saved,     setSaved]   = useState(false)
  const [agreed,    setAgreed]  = useState(false)
  const [form,      setForm]    = useState({
    title: '', state: '', city: '', address: '',
    price: '', description: '', features: [], images: [],
    bedrooms: '', bathrooms: '', size_sqm: '',
    category: type,
  })

  const set    = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const toggle = (k, v) => setForm(f => ({
    ...f, [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v]
  }))

  const FEATURES = isHotel ? HOTEL_FEATURES : RENTAL_FEATURES

  const steps = [
    {
      title: 'Basics',
      valid: () => !!form.title && !!form.state && !!form.city,
      content: (
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-black" style={{ color: '#1A1210' }}>
            {isHotel ? 'List Your Hotel 🏨' : 'List Your Rental 🔑'}
          </h2>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'rgba(26,18,16,0.5)' }}>Property Name *</label>
            <input className="input" type="text" placeholder={isHotel ? 'e.g. The Grand Uyo Hotel' : 'e.g. 3-Bed Apartment, Lekki'} value={form.title} onChange={set('title')} style={{ backgroundColor: '#FFFFFF', color: '#1A1210' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'rgba(26,18,16,0.5)' }}>State *</label>
              <select className="select" value={form.state} onChange={set('state')} style={{ backgroundColor: '#FFFFFF', color: '#1A1210' }}>
                <option value="">Select...</option>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'rgba(26,18,16,0.5)' }}>City *</label>
              <input className="input" type="text" placeholder="City/Area" value={form.city} onChange={set('city')} style={{ backgroundColor: '#FFFFFF', color: '#1A1210' }} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'rgba(26,18,16,0.5)' }}>Address</label>
            <input className="input" type="text" placeholder="Full address" value={form.address} onChange={set('address')} style={{ backgroundColor: '#FFFFFF', color: '#1A1210' }} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'rgba(26,18,16,0.5)' }}>{isHotel ? 'Starting Price / Night (₦)' : 'Annual Rent (₦)'} *</label>
            <input className="input" type="number" placeholder="e.g. 35000" value={form.price} onChange={set('price')} style={{ backgroundColor: '#FFFFFF', color: '#1A1210' }} />
          </div>
        </div>
      ),
    },
    {
      title: 'Details',
      valid: () => !!form.size_sqm,
      content: (
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-black" style={{ color: '#1A1210' }}>Details & Features ✨</h2>
          {!isHotel && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'rgba(26,18,16,0.5)' }}>Bedrooms</label>
                <input className="input" type="number" min="0" placeholder="0" value={form.bedrooms} onChange={set('bedrooms')} style={{ backgroundColor: '#FFFFFF', color: '#1A1210' }} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'rgba(26,18,16,0.5)' }}>Bathrooms</label>
                <input className="input" type="number" min="0" placeholder="0" value={form.bathrooms} onChange={set('bathrooms')} style={{ backgroundColor: '#FFFFFF', color: '#1A1210' }} />
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'rgba(26,18,16,0.5)' }}>Size (sqm) *</label>
            <input className="input" type="number" min="0" placeholder="e.g. 120" value={form.size_sqm} onChange={set('size_sqm')} style={{ backgroundColor: '#FFFFFF', color: '#1A1210' }} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{ color: 'rgba(26,18,16,0.5)' }}>Features & Amenities</label>
            <div className="flex flex-wrap gap-2">
              {FEATURES.map(f => (
                <button key={f} type="button" onClick={() => toggle('features', f)}
                  className="px-3 py-2 rounded-full text-xs font-medium border-2 transition-all"
                  style={{
                    borderColor:     form.features.includes(f) ? '#C96A3A' : '#E8DDD2',
                    backgroundColor: form.features.includes(f) ? '#C96A3A' : '#FFFFFF',
                    color:           form.features.includes(f) ? '#FFFFFF'  : '#5C4A3A',
                  }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'rgba(26,18,16,0.5)' }}>Description</label>
            <textarea className="input resize-none" rows={5}
              placeholder="Describe the property, location, access, unique features..."
              value={form.description} onChange={set('description')}
              style={{ backgroundColor: '#FFFFFF', color: '#1A1210' }} />
          </div>
        </div>
      ),
    },
  ]

  const current = steps[step]
  const isLast  = step === steps.length - 1

  const handleSubmit = async () => {
    if (!agreed) { toast.error('Please agree to the commission terms'); return }
    if (!user?.id) { toast.error('You must be logged in'); return }
    setSaving(true)
    const { error } = await supabase.from('properties').insert({
      title:        form.title,
      property_type: isHotel ? 'hotel' : 'apartment',
      listing_type: isHotel ? 'Hotel' : 'Rental',
      price:        Number(form.price) || 0,
      state:        form.state,
      city:         form.city,
      address:      form.address || null,
      bedrooms:     form.bedrooms  ? Number(form.bedrooms)  : null,
      bathrooms:    form.bathrooms ? Number(form.bathrooms) : null,
      size_sqm:     Number(form.size_sqm) || 0,
      description:  form.description,
      features:     form.features,
      seller_id:    user.id,
      status:       'pending_review',
      category:     type,
    })
    setSaving(false)
    if (error) { toast.error('Could not publish: ' + error.message); return }
    setSaved(true)
  }

  if (saved) return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#FFFAF5' }}>
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-5">🎉</div>
        <h1 className="font-display text-3xl font-black mb-2" style={{ color: '#1A1210' }}>Listing Submitted!</h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: '#8A7E78' }}>
          Your {isHotel ? 'hotel' : 'rental'} listing is under review. We'll approve it within 24 hours.
        </p>
        <button onClick={() => navigate('/landlord')} className="btn-primary w-full py-4">Go to Dashboard →</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: '#FFFAF5' }}>
      <div className="max-w-lg mx-auto px-4">
        <div className="mb-8">
          <p className="text-sm mb-4" style={{ color: '#8A7E78' }}>Step {step + 1} of {steps.length} — {current.title}</p>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(26,18,16,0.08)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%`, backgroundColor: '#C96A3A' }} />
          </div>
        </div>
        <div>{current.content}</div>
        {isLast && <div className="mt-6"><CommissionAgreement category={isHotel ? 'hotel' : 'rental'} agreed={agreed} onChange={setAgreed} /></div>}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} disabled={saving}
              className="flex items-center gap-2 px-5 py-4 rounded-2xl text-sm font-semibold border"
              style={{ borderColor: '#E8DDD2', color: '#8A7E78', backgroundColor: '#FFFFFF' }}>
              <ArrowLeft size={16} />
            </button>
          )}
          <button
            onClick={() => {
              if (!current.valid()) { toast.error('Please complete required fields'); return }
              if (isLast) handleSubmit()
              else setStep(s => s + 1)
            }}
            disabled={saving || !current.valid()}
            className="btn-primary flex-1 py-4 flex items-center justify-center gap-2">
            {saving ? 'Publishing...' : isLast ? 'Submit Listing ✓' : <>Continue <ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}
