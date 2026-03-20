import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Upload, Video, Image, X, Check } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { createProperty } from '@/lib/supabase'
import { analytics } from '@/lib/posthog'
import toast from 'react-hot-toast'
import CommissionAgreement from '@/components/ui/CommissionAgreement'
import clsx from 'clsx'

const LISTING_CATEGORIES = [
  { id:'rental',  label:'Long-term Rental',  emoji:'🔑', desc:'Monthly or yearly rent' },
  { id:'shortlet',label:'Short-let / Airbnb',emoji:'🌙', desc:'Daily or weekly stays' },
  { id:'hotel',   label:'Hotel / Lodge',      emoji:'🏨', desc:'Professional hospitality' },
]

const PROPERTY_TYPES = [
  { id:'apartment', label:'Apartment',  emoji:'🏢' },
  { id:'duplex',    label:'Duplex',     emoji:'🏡' },
  { id:'room',      label:'Single Room',emoji:'🛏️' },
  { id:'hotel',     label:'Hotel',      emoji:'🏨' },
  { id:'lodge',     label:'Lodge',      emoji:'🏠' },
  { id:'villa',     label:'Villa',      emoji:'🏰' },
]

const AMENITIES_LIST = ['WiFi','AC','Generator','Parking','Security','Borehole','CCTV','Furnished','Kitchen','Washing Machine','Netflix','Workspace','Pool','Gym','Restaurant','Bar']

const STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara','Abuja (FCT)']

const INITIAL = {
  category:'', property_type:'', title:'', description:'',
  state:'', city:'', address:'', price:'', price_period:'month',
  bedrooms:'', bathrooms:'', max_guests:'',
  amenities:[], rules:'', contact_phone:'', contact_email:'',
  images:[], video_url:'', custom_terms:'',
}

export default function ListRentalPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [step, setStep]     = useState(0)
  const [saving, setSaving] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [form, setForm]     = useState(INITIAL)

  const set     = (k, v) => setForm(f => ({...f, [k]: v}))
  const setE    = (k) => (e) => set(k, e.target.value)
  const toggle  = (k, v) => set(k, form[k].includes(v) ? form[k].filter(x => x !== v) : [...form[k], v])

  const PRICE_PERIODS = form.category === 'shortlet' || form.category === 'hotel'
    ? ['night', 'week']
    : ['month', 'year']

  const steps = [
    {
      title: 'What are you listing?',
      valid: () => !!form.category,
      content: (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-2xl font-black mb-1" style={{color:'#1A1210'}}>What are you listing? 🏠</h2>
            <p className="text-sm" style={{color:'#8A7E78'}}>Choose the type of listing you want to create.</p>
          </div>
          <div className="space-y-3 mt-4">
            {LISTING_CATEGORIES.map(c => (
              <button key={c.id} type="button" onClick={() => set('category', c.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all"
                style={{
                  borderColor: form.category === c.id ? '#C96A3A' : '#E8DDD2',
                  backgroundColor: form.category === c.id ? 'rgba(201,106,58,0.05)' : '#FFFFFF',
                }}>
                <span className="text-3xl">{c.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold" style={{color:'#1A1210'}}>{c.label}</p>
                  <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>{c.desc}</p>
                </div>
                {form.category === c.id && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{backgroundColor:'#C96A3A'}}>
                    <Check size={12} color="white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Property details',
      valid: () => !!form.property_type && !!form.title,
      content: (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-2xl font-black mb-1" style={{color:'#1A1210'}}>Property Details 🏡</h2>
            <p className="text-sm" style={{color:'#8A7E78'}}>Tell us about your property.</p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{color:'rgba(26,18,16,0.5)'}}>Property Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {PROPERTY_TYPES.map(t => (
                <button key={t.id} type="button" onClick={() => set('property_type', t.id)}
                  className="flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all"
                  style={{
                    borderColor: form.property_type === t.id ? '#C96A3A' : '#E8DDD2',
                    backgroundColor: form.property_type === t.id ? 'rgba(201,106,58,0.05)' : '#FFFFFF',
                  }}>
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-sm font-semibold" style={{color:'#1A1210'}}>{t.label}</span>
                  {form.property_type === t.id && <Check size={12} style={{color:'#C96A3A'}} className="ml-auto" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Listing Title *</label>
            <input className="input" type="text" placeholder={form.category === 'hotel' ? 'e.g. The Grand Hotel Uyo' : 'e.g. Cozy 2-Bed Apartment in Lekki'}
              value={form.title} onChange={setE('title')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Description</label>
            <textarea className="input resize-none" rows={4}
              placeholder="Describe your property. What makes it special? Nearby landmarks? Access roads?"
              value={form.description} onChange={setE('description')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
          </div>
        </div>
      ),
    },
    {
      title: 'Location & Price',
      valid: () => !!form.state && !!form.city && !!form.price,
      content: (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-2xl font-black mb-1" style={{color:'#1A1210'}}>Location & Price 📍</h2>
            <p className="text-sm" style={{color:'#8A7E78'}}>Where is it and how much?</p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>State *</label>
            <select className="select" value={form.state} onChange={setE('state')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}}>
              <option value="">Select state...</option>
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>City / Area *</label>
            <input className="input" type="text" placeholder="e.g. Lekki Phase 1" value={form.city} onChange={setE('city')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Full Address (optional)</label>
            <input className="input" type="text" placeholder="Street address" value={form.address} onChange={setE('address')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Price (₦) *</label>
            <div className="flex gap-3">
              <input className="input flex-1" type="number" placeholder="e.g. 150000" value={form.price} onChange={setE('price')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
              <select className="select w-36" value={form.price_period} onChange={setE('price_period')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}}>
                {PRICE_PERIODS.map(p => <option key={p} value={p}>per {p}</option>)}
              </select>
            </div>
            {form.price && <p className="text-xs mt-1" style={{color:'#8A7E78'}}>= ₦{Number(form.price).toLocaleString()} per {form.price_period}</p>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Bedrooms</label>
              <input className="input" type="number" min="0" placeholder="0" value={form.bedrooms} onChange={setE('bedrooms')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Bathrooms</label>
              <input className="input" type="number" min="0" placeholder="0" value={form.bathrooms} onChange={setE('bathrooms')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Max Guests</label>
              <input className="input" type="number" min="1" placeholder="2" value={form.max_guests} onChange={setE('max_guests')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Amenities & Rules',
      valid: () => true,
      content: (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-2xl font-black mb-1" style={{color:'#1A1210'}}>Amenities & Rules ✨</h2>
            <p className="text-sm" style={{color:'#8A7E78'}}>What's available and any house rules?</p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{color:'rgba(26,18,16,0.5)'}}>Available Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_LIST.map(a => (
                <button key={a} type="button" onClick={() => toggle('amenities', a)}
                  className="px-3 py-2 rounded-full text-sm font-medium border-2 transition-all"
                  style={{
                    borderColor: form.amenities.includes(a) ? '#C96A3A' : '#E8DDD2',
                    backgroundColor: form.amenities.includes(a) ? '#C96A3A' : '#FFFFFF',
                    color: form.amenities.includes(a) ? '#FFFFFF' : '#5C4A3A',
                  }}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>House Rules (optional)</label>
            <textarea className="input resize-none" rows={3}
              placeholder="e.g. No smoking, No pets, Quiet hours after 10pm..."
              value={form.rules} onChange={setE('rules')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
          </div>
        </div>
      ),
    },
    {
      title: 'Photos & Video',
      valid: () => true,
      content: (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-2xl font-black mb-1" style={{color:'#1A1210'}}>Photos & Video 📸</h2>
            <p className="text-sm" style={{color:'#8A7E78'}}>Great visuals get 5× more enquiries. Add photos and a short video tour.</p>
          </div>

          {/* Photo upload */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{color:'rgba(26,18,16,0.5)'}}>Photos</label>
            <div className="border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer hover:border-terracotta"
              style={{borderColor:'#E8DDD2', backgroundColor:'rgba(201,106,58,0.02)'}}
              onClick={() => document.getElementById('photo-upload').click()}>
              <div className="text-4xl mb-3">📸</div>
              <p className="font-semibold text-sm mb-1" style={{color:'#1A1210'}}>Tap to upload photos</p>
              <p className="text-xs" style={{color:'#8A7E78'}}>JPG, PNG up to 10MB each. Upload at least 3 photos.</p>
              <input id="photo-upload" type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files)
                  const urls  = files.map(f => ({ url: URL.createObjectURL(f), is_primary: false }))
                  if (urls.length > 0) urls[0].is_primary = true
                  set('images', [...form.images, ...urls])
                  toast.success(`${files.length} photo${files.length > 1 ? 's' : ''} added!`)
                }} />
            </div>
            {form.images.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {form.images.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    {img.is_primary && (
                      <div className="absolute bottom-0 left-0 right-0 text-center text-xs py-0.5 font-bold"
                        style={{backgroundColor:'rgba(201,106,58,0.9)', color:'#FFFFFF'}}>Main</div>
                    )}
                    <button onClick={() => set('images', form.images.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{backgroundColor:'rgba(26,18,16,0.7)'}}>
                      <X size={10} color="white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video upload */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{color:'rgba(26,18,16,0.5)'}}>
              Short Video Tour (optional but recommended)
            </label>
            <div className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer"
              style={{borderColor:'#E8DDD2', backgroundColor:'rgba(212,168,83,0.03)'}}
              onClick={() => document.getElementById('video-upload').click()}>
              <div className="text-4xl mb-3">🎬</div>
              <p className="font-semibold text-sm mb-1" style={{color:'#1A1210'}}>
                {form.video_url ? '✅ Video uploaded!' : 'Tap to record or upload a video tour'}
              </p>
              <p className="text-xs" style={{color:'#8A7E78'}}>Max 60 seconds. Show rooms, view, and key features.</p>
              <input id="video-upload" type="file" accept="video/*" className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) {
                    set('video_url', URL.createObjectURL(file))
                    toast.success('Video added!')
                  }
                }} />
            </div>
            {form.video_url && (
              <div className="mt-3 relative rounded-2xl overflow-hidden">
                <video src={form.video_url} controls className="w-full rounded-2xl" style={{maxHeight:200}} />
                <button onClick={() => set('video_url', '')}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{backgroundColor:'rgba(26,18,16,0.7)'}}>
                  <X size={12} color="white" />
                </button>
              </div>
            )}
          </div>

          {/* Video URL alternative */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>
              Or paste a video link (YouTube / Loom)
            </label>
            <input className="input" type="url" placeholder="https://youtube.com/watch?v=..."
              value={form.video_url.startsWith('blob') ? '' : form.video_url}
              onChange={setE('video_url')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
          </div>
        </div>
      ),
    },
    {
      title: 'Contact Details',
      valid: () => !!form.contact_phone,
      content: (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-2xl font-black mb-1" style={{color:'#1A1210'}}>Contact Details 📞</h2>
            <p className="text-sm" style={{color:'#8A7E78'}}>How should interested renters reach you?</p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>WhatsApp / Phone *</label>
            <input className="input" type="tel" placeholder="+234 800 000 0000" value={form.contact_phone} onChange={setE('contact_phone')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
            <p className="text-xs mt-1" style={{color:'#8A7E78'}}>Renters will contact you directly on this number.</p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Email (optional)</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.contact_email} onChange={setE('contact_email')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
          </div>

          {/* Summary */}
          <div className="p-4 rounded-2xl border" style={{backgroundColor:'rgba(201,106,58,0.04)', borderColor:'rgba(201,106,58,0.2)'}}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'rgba(26,18,16,0.4)'}}>Listing Summary</p>
            <div className="space-y-1.5 text-sm" style={{color:'#5C4A3A'}}>
              <p>🏠 <strong>{form.title || 'Untitled'}</strong></p>
              <p>📍 {form.city && form.state ? `${form.city}, ${form.state}` : 'Location not set'}</p>
              <p>💰 {form.price ? `₦${Number(form.price).toLocaleString()} per ${form.price_period}` : 'Price not set'}</p>
              <p>✨ {form.amenities.length > 0 ? form.amenities.slice(0,3).join(', ') : 'No amenities added'}</p>
              <p>📸 {form.images.length} photo{form.images.length !== 1 ? 's' : ''} · {form.video_url ? '1 video' : 'No video'}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl" style={{backgroundColor:'rgba(122,158,126,0.08)', border:'1px solid rgba(122,158,126,0.2)'}}>
            <p className="text-xs font-semibold mb-1" style={{color:'#5C8060'}}>💡 Listing fee</p>
            <p className="text-xs leading-relaxed" style={{color:'#8A7E78'}}>
              Listing fee: <strong>₦15,000/month</strong>. Your listing goes live after payment and verification within 24 hours.
            </p>
          </div>
        </div>
      ),
    },
  ]

  const current = steps[step]
  const isLast  = step === steps.length - 1

  const handleNext = () => {
    if (!current.valid()) { toast.error('Please complete required fields'); return }
    if (isLast) handleSubmit()
    else setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    if (!agreed) { toast.error('Please agree to the commission terms to publish'); return }
    setSaving(true)
    const payload = {
      title:         form.title,
      description:   form.description,
      property_type: form.property_type,
      listing_type:  form.category === 'hotel' ? 'Hotel' : form.category === 'shortlet' ? 'Short-let' : 'For Rent',
      price:         Number(form.price),
      price_period:  form.price_period,
      state:         form.state,
      city:          form.city,
      address:       form.address,
      bedrooms:      Number(form.bedrooms) || null,
      bathrooms:     Number(form.bathrooms) || null,
      features:      form.amenities,
      contact_phone: form.contact_phone,
      contact_email: form.contact_email,
      seller_id:     user?.id,
      status:        'active',
      category:      form.category,
    }
    const { data, error } = await createProperty(payload)
    setSaving(false)
    if (error) { toast.error('Could not publish listing'); return }
    analytics.propertyListed(data?.id, form.category)
    toast.success('Listing submitted! Goes live after verification. 🎉')
    navigate(form.category === 'hotel' ? '/hotels' : '/rentals')
  }

  return (
    <div className="min-h-screen flex flex-col pt-20 pb-16" style={{backgroundColor:'#FFFAF5'}}>
      <div className="max-w-lg mx-auto px-4 w-full">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-black mb-1" style={{color:'#1A1210'}}>
            {form.category === 'hotel' ? 'List Your Hotel 🏨' : 'List Your Property 🏠'}
          </h1>
          <p className="text-sm" style={{color:'#8A7E78'}}>Step {step + 1} of {steps.length} — {current.title}</p>
          <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{backgroundColor:'rgba(26,18,16,0.08)'}}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{width:`${((step + 1) / steps.length) * 100}%`, backgroundColor:'#C96A3A'}} />
          </div>
        </div>

        {/* Content */}
        <div>{current.content}</div>

        {/* Commission Agreement */}
        <div className="mt-6">
          <CommissionAgreement category={form.category || 'rental'} agreed={agreed} onChange={setAgreed} />
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-5 py-4 rounded-2xl text-sm font-semibold transition-all"
              style={{border:'1.5px solid #E8DDD2', color:'rgba(26,18,16,0.5)', backgroundColor:'#FFFFFF'}}>
              <ArrowLeft size={16} />
            </button>
          )}
          <button onClick={handleNext} disabled={saving || !current.valid()}
            className={clsx('btn-primary flex-1 flex items-center justify-center gap-2 py-4',
              !current.valid() && 'opacity-40 cursor-not-allowed'
            )}>
            {saving ? 'Publishing...' : isLast ? 'Publish Listing ✓' : <>{step === 0 ? 'Get Started' : 'Continue'} <ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}
// Commission patch applied via append - see CommissionAgreement component
