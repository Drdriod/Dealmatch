import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Check, ArrowLeft, ArrowRight, X } from 'lucide-react'
import { createProperty } from '@/lib/supabase'
import { indexProperty } from '@/lib/pinecone'
import { analytics } from '@/lib/posthog'
import { useAuth } from '@/context/AuthContext'
import { useVerificationGuard } from '@/hooks/useVerificationGuard'
import toast from 'react-hot-toast'
import CommissionAgreement from '@/components/ui/CommissionAgreement'
import clsx from 'clsx'

const STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa',
  'Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger',
  'Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe',
  'Zamfara','Abuja (FCT)',
]
const FEATURES = [
  'Swimming Pool','Boys Quarters','Gym','Gated Estate','Solar Power',
  'Borehole','CCTV','Parking','Garden','Smart Home','Prepaid Meter','Perforated Fence',
]
const TYPES = [
  { id:'land',       label:'Land / Plot',      emoji:'🌿' },
  { id:'apartment',  label:'Apartment',         emoji:'🏢' },
  { id:'duplex',     label:'Duplex',            emoji:'🏘️' },
  { id:'detached',   label:'Detached House',    emoji:'🏡' },
  { id:'terrace',    label:'Terrace',           emoji:'🏠' },
  { id:'commercial', label:'Commercial',        emoji:'🏬' },
]
const DOCS = [
  'Certificate of Occupancy (C of O)',
  'Right of Occupancy (R of O)',
  'Deed of Assignment',
  'Registered Survey Plan',
  'Building Approval',
  'Gazette',
]
const LISTING_TYPES = ['For Sale','Joint Venture','Off-Plan']

const INITIAL = {
  title:'', property_type:'', listing_type:'For Sale',
  price:'', state:'', city:'', address:'',
  bedrooms:'', bathrooms:'', size_sqm:'',
  description:'', features:[], documents:[],
  images:[], video_url:'',
}

export default function ListPropertyPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const { check } = useVerificationGuard()
  const [step,   setStep]   = useState(0)
  const [saving, setSaving] = useState(false)
  const [form,   setForm]   = useState(INITIAL)
  const [agreed, setAgreed] = useState(false)

  const set     = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setE    = (k) => (e) => set(k, e.target.value)
  const toggle  = (k, v) => set(k, form[k].includes(v) ? form[k].filter(x => x !== v) : [...form[k], v])
  const isLandType = form.property_type === 'land' || form.property_type === 'commercial'

  const steps = [
    {
      title: 'Property basics',
      valid: () => !!form.property_type && !!form.title,
      content: (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-2xl font-black mb-1" style={{color:'#1A1210'}}>Property basics 🏡</h2>
            <p className="text-sm" style={{color:'#8A7E78'}}>Tell us what type of property you're selling.</p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{color:'rgba(26,18,16,0.5)'}}>Property Type *</label>
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map(t => (
                <button key={t.id} type="button" onClick={() => set('property_type', t.id)}
                  className="p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3"
                  style={{
                    borderColor: form.property_type === t.id ? '#C96A3A' : '#E8DDD2',
                    backgroundColor: form.property_type === t.id ? 'rgba(201,106,58,0.05)' : '#FFFFFF',
                  }}>
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-sm font-semibold" style={{color:'#1A1210'}}>{t.label}</span>
                  {form.property_type === t.id && <Check size={14} style={{color:'#C96A3A', marginLeft:'auto', flexShrink:0}} />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{color:'rgba(26,18,16,0.5)'}}>Listing Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {LISTING_TYPES.map(lt => (
                <button key={lt} type="button" onClick={() => set('listing_type', lt)}
                  className="py-3 rounded-xl border-2 text-sm font-semibold transition-all"
                  style={{
                    borderColor: form.listing_type === lt ? '#C96A3A' : '#E8DDD2',
                    color: form.listing_type === lt ? '#C96A3A' : '#8A7E78',
                    backgroundColor: form.listing_type === lt ? 'rgba(201,106,58,0.05)' : '#FFFFFF',
                  }}>
                  {lt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Property Title *</label>
            <input className="input" type="text"
              placeholder="e.g. 4-Bed Detached Duplex with Pool"
              value={form.title} onChange={setE('title')}
              style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
          </div>
        </div>
      ),
    },
    {
      title: 'Location & price',
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
            <input className="input" type="text" placeholder="e.g. Lekki Phase 1"
              value={form.city} onChange={setE('city')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Street Address (optional)</label>
            <input className="input" type="text" placeholder="Shared with serious buyers only"
              value={form.address} onChange={setE('address')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Asking Price (₦) *</label>
            <input className="input" type="number" min="0" placeholder="e.g. 38500000"
              value={form.price} onChange={setE('price')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
            {form.price && (
              <p className="text-xs mt-1.5" style={{color:'#8A7E78'}}>
                = ₦{Number(form.price).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Details & features',
      valid: () => !!form.size_sqm,
      content: (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-2xl font-black mb-1" style={{color:'#1A1210'}}>Details & Features ✨</h2>
            <p className="text-sm" style={{color:'#8A7E78'}}>Size, rooms, and what's included.</p>
          </div>
          <div className={clsx('grid gap-3', isLandType ? 'grid-cols-1' : 'grid-cols-3')}>
            {!isLandType && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Beds</label>
                  <input className="input" type="number" min="0" placeholder="0"
                    value={form.bedrooms} onChange={setE('bedrooms')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Baths</label>
                  <input className="input" type="number" min="0" placeholder="0"
                    value={form.bathrooms} onChange={setE('bathrooms')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
                </div>
              </>
            )}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Size (sqm) *</label>
              <input className="input" type="number" min="0" placeholder="e.g. 400"
                value={form.size_sqm} onChange={setE('size_sqm')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{color:'rgba(26,18,16,0.5)'}}>Features & Amenities</label>
            <div className="flex flex-wrap gap-2">
              {FEATURES.map(f => (
                <button key={f} type="button" onClick={() => toggle('features', f)}
                  className="px-3 py-2 rounded-full text-xs font-medium border-2 transition-all"
                  style={{
                    borderColor: form.features.includes(f) ? '#C96A3A' : '#E8DDD2',
                    backgroundColor: form.features.includes(f) ? '#C96A3A' : '#FFFFFF',
                    color: form.features.includes(f) ? '#FFFFFF' : '#5C4A3A',
                  }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{color:'rgba(26,18,16,0.5)'}}>Available Documents</label>
            <div className="flex flex-wrap gap-2">
              {DOCS.map(d => (
                <button key={d} type="button" onClick={() => toggle('documents', d)}
                  className="px-3 py-2 rounded-full text-xs font-medium border-2 transition-all"
                  style={{
                    borderColor: form.documents.includes(d) ? '#7A9E7E' : '#E8DDD2',
                    backgroundColor: form.documents.includes(d) ? '#7A9E7E' : '#FFFFFF',
                    color: form.documents.includes(d) ? '#FFFFFF' : '#5C4A3A',
                  }}>
                  {d}
                </button>
              ))}
            </div>
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
            <p className="text-sm" style={{color:'#8A7E78'}}>
              Properties with photos and videos get 5× more enquiries. Show the land, building, surroundings — everything.
            </p>
          </div>

          {/* Photo upload */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{color:'rgba(26,18,16,0.5)'}}>
              Photos {form.images.length > 0 && `(${form.images.length} uploaded)`}
            </label>
            <div
              className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all"
              style={{borderColor: form.images.length > 0 ? '#C96A3A' : '#E8DDD2', backgroundColor:'rgba(201,106,58,0.02)'}}
              onClick={() => document.getElementById('prop-photo-upload').click()}>
              <div className="text-4xl mb-3">📷</div>
              <p className="font-semibold text-sm mb-1" style={{color:'#1A1210'}}>
                {form.images.length > 0 ? 'Tap to add more photos' : 'Tap to upload photos'}
              </p>
              <p className="text-xs" style={{color:'#8A7E78'}}>
                JPG, PNG up to 10MB. Show front, rooms, compound, surroundings.
              </p>
              <input id="prop-photo-upload" type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files)
                  const newImgs = files.map((f, i) => ({
                    url: URL.createObjectURL(f),
                    is_primary: form.images.length === 0 && i === 0,
                    file: f,
                  }))
                  set('images', [...form.images, ...newImgs])
                  toast.success(`${files.length} photo${files.length > 1 ? 's' : ''} added!`)
                }} />
            </div>

            {/* Photo preview grid */}
            {form.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {form.images.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2"
                    style={{borderColor: img.is_primary ? '#C96A3A' : '#E8DDD2'}}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    {img.is_primary && (
                      <div className="absolute bottom-0 left-0 right-0 text-center text-[10px] py-0.5 font-bold"
                        style={{backgroundColor:'rgba(201,106,58,0.9)', color:'#FFFFFF'}}>
                        Main
                      </div>
                    )}
                    <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center gap-1 opacity-0 hover:opacity-100 transition-opacity"
                      style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
                      {!img.is_primary && (
                        <button
                          onClick={(e) => { e.stopPropagation(); const imgs = [...form.images]; imgs.forEach(x => x.is_primary = false); imgs[i].is_primary = true; set('images', imgs) }}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{backgroundColor:'#C96A3A', color:'#FFFFFF'}}>
                          Main
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); set('images', form.images.filter((_, j) => j !== i)) }}
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{backgroundColor:'rgba(26,18,16,0.8)'}}>
                        <X size={10} color="white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video upload */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{color:'rgba(26,18,16,0.5)'}}>
              Video Tour (optional but strongly recommended)
            </label>
            <div
              className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all"
              style={{
                borderColor: form.video_url ? '#7A9E7E' : '#E8DDD2',
                backgroundColor: form.video_url ? 'rgba(122,158,126,0.04)' : 'rgba(212,168,83,0.02)',
              }}
              onClick={() => !form.video_url && document.getElementById('prop-video-upload').click()}>
              <div className="text-4xl mb-3">{form.video_url ? '✅' : '🎬'}</div>
              <p className="font-semibold text-sm mb-1" style={{color:'#1A1210'}}>
                {form.video_url ? 'Video uploaded!' : 'Record or upload a video tour'}
              </p>
              <p className="text-xs" style={{color:'#8A7E78'}}>
                Walk through the property on camera. Max 2 minutes. MP4 or MOV.
              </p>
              <input id="prop-video-upload" type="file" accept="video/*" className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) {
                    set('video_url', URL.createObjectURL(file))
                    toast.success('Video added! Buyers will love this.')
                  }
                }} />
            </div>

            {form.video_url && (
              <div className="mt-3 relative rounded-2xl overflow-hidden">
                <video src={form.video_url} controls className="w-full rounded-2xl" style={{maxHeight:220}} />
                <button
                  onClick={() => set('video_url', '')}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{backgroundColor:'rgba(26,18,16,0.7)'}}>
                  <X size={12} color="white" />
                </button>
              </div>
            )}

            {/* YouTube / link alternative */}
            <div className="mt-3">
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>
                Or paste a YouTube / Loom link
              </label>
              <input className="input" type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={form.video_url?.startsWith('blob') ? '' : form.video_url}
                onChange={setE('video_url')}
                style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
            </div>
          </div>

          <div className="p-4 rounded-2xl" style={{backgroundColor:'rgba(212,168,83,0.08)', border:'1px solid rgba(212,168,83,0.2)'}}>
            <p className="text-xs font-semibold mb-1" style={{color:'#8A6A20'}}>💡 Pro tip</p>
            <p className="text-xs leading-relaxed" style={{color:'#8A7E78'}}>
              Listings with a video tour get 5× more serious enquiries. Just walk through the property on your phone — no editing needed.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Description',
      valid: () => form.description.length >= 50,
      content: (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-2xl font-black mb-1" style={{color:'#1A1210'}}>Description 📝</h2>
            <p className="text-sm" style={{color:'#8A7E78'}}>Describe the property in your own words.</p>
          </div>
          <div>
            <textarea className="input resize-none" rows={8}
              placeholder="Describe the property — location, features, access roads, nearby landmarks, title status, and why it's a great buy. Minimum 50 characters."
              value={form.description} onChange={setE('description')}
              style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
            <p className="text-xs mt-1.5" style={{color: form.description.length >= 50 ? '#7A9E7E' : '#8A7E78'}}>
              {form.description.length} / 50 min characters
            </p>
          </div>
          <div className="p-4 rounded-2xl" style={{backgroundColor:'rgba(212,168,83,0.08)', border:'1px solid rgba(212,168,83,0.2)'}}>
            <p className="text-xs font-semibold mb-1" style={{color:'#8A6A20'}}>💡 Pro tip</p>
            <p className="text-xs leading-relaxed" style={{color:'#8A7E78'}}>
              Listings with detailed descriptions get 3× more matches. Mention proximity to landmarks, road access, and title status.
            </p>
          </div>
        </div>
      ),
    },
  ]

  const current = steps[step]
  const isLast  = step === steps.length - 1

  const handleNext = () => {
    // Check verification on first step
    if (step === 0 && !check('sell')) return
    if (!current.valid()) { toast.error('Please complete all required fields'); return }
    if (isLast) handleSubmit()
    else setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    if (!agreed) { toast.error('Please agree to the commission terms to publish'); return }
    setSaving(true)
    const payload = {
      ...form,
      price:     Number(form.price),
      bedrooms:  form.bedrooms  ? Number(form.bedrooms)  : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      size_sqm:  Number(form.size_sqm),
      seller_id: user.id,
      status:    'active',
      category:  'sale',
    }
    const { data, error } = await createProperty(payload)
    if (error) {
      toast.error('Could not list property. Please try again.')
      setSaving(false)
      return
    }
    await indexProperty(data)
    analytics.propertyListed(data.id, data.property_type)
    toast.success('Property listed and now matching buyers! 🎉')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen pt-24 pb-16" style={{backgroundColor:'#FFFAF5'}}>
      <div className="max-w-lg mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black mb-1" style={{color:'#1A1210'}}>List a Property 🏗️</h1>
          <p className="text-sm" style={{color:'#8A7E78'}}>Step {step + 1} of {steps.length} — {current.title}</p>
          <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{backgroundColor:'rgba(26,18,16,0.08)'}}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{width:`${((step + 1) / steps.length) * 100}%`, backgroundColor:'#C96A3A'}} />
          </div>
        </div>

        {/* Step content */}
        <div>{current.content}</div>

        {/* Commission Agreement */}
        <div className="mt-6">
          <CommissionAgreement category="sale" agreed={agreed} onChange={setAgreed} />
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
            {saving
              ? 'Publishing...'
              : isLast
                ? 'Publish Listing ✓'
                : <>{step === 0 ? 'Continue' : 'Continue'} <ArrowRight size={16} /></>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
