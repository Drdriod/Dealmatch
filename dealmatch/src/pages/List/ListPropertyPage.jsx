import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Check, ArrowLeft, ArrowRight } from 'lucide-react'
import { createProperty } from '@/lib/supabase'
import { indexProperty } from '@/lib/pinecone'
import { analytics } from '@/lib/posthog'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATES = [
  'Akwa Ibom','Lagos','Abuja (FCT)','Rivers','Delta','Ogun',
  'Kano','Oyo','Enugu','Anambra','Cross River','Imo','Edo','Kaduna','Plateau',
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
const LISTING_TYPES = ['For Sale','For Rent','Joint Venture','Off-Plan']

const INITIAL = {
  title:'', property_type:'', listing_type:'For Sale',
  price:'', state:'', city:'', address:'',
  bedrooms:'', bathrooms:'', size_sqm:'',
  description:'', features:[], documents:[],
}

export default function ListPropertyPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [step,   setStep]   = useState(0)
  const [saving, setSaving] = useState(false)
  const [form,   setForm]   = useState(INITIAL)

  const set     = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setE    = (k) => (e) => set(k, e.target.value)
  const toggle  = (k, v) => set(k, form[k].includes(v)
    ? form[k].filter(x => x !== v)
    : [...form[k], v])

  const isLandType = form.property_type === 'land' || form.property_type === 'commercial'

  // ─── Step definitions ────────────────────────────────────
  const steps = [
    {
      title: 'Property basics',
      valid: () => !!form.property_type && !!form.title,
      content: (
        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-3 block">Property Type *</label>
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map(t => (
                <button key={t.id} type="button" onClick={() => set('property_type', t.id)}
                  className={clsx('p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3',
                    form.property_type === t.id ? 'border-terracotta bg-terracotta/5' : 'border-deep/8 hover:border-deep/15'
                  )}>
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-sm font-semibold">{t.label}</span>
                  {form.property_type === t.id && <Check size={14} className="ml-auto text-terracotta flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-3 block">Listing Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {LISTING_TYPES.map(lt => (
                <button key={lt} type="button" onClick={() => set('listing_type', lt)}
                  className={clsx('py-3 rounded-xl border-2 text-sm font-semibold transition-all',
                    form.listing_type === lt ? 'border-terracotta bg-terracotta/5 text-terracotta' : 'border-deep/8 text-deep/50'
                  )}>
                  {lt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">Property Title *</label>
            <input className="input" type="text"
              placeholder="e.g. 4-Bed Detached Duplex with Pool"
              value={form.title} onChange={setE('title')} />
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
            <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">State *</label>
            <select className="select" value={form.state} onChange={setE('state')}>
              <option value="">Select state...</option>
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">City / Area *</label>
            <input className="input" type="text"
              placeholder="e.g. Lekki Phase 1"
              value={form.city} onChange={setE('city')} />
          </div>
          <div>
            <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">Street Address (optional)</label>
            <input className="input" type="text"
              placeholder="Shared with serious buyers only"
              value={form.address} onChange={setE('address')} />
          </div>
          <div>
            <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">Asking Price (₦) *</label>
            <input className="input" type="number" min="0"
              placeholder="e.g. 38500000"
              value={form.price} onChange={setE('price')} />
            {form.price && (
              <p className="text-xs text-deep/40 mt-1.5">
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
          <div className={clsx('grid gap-3', isLandType ? 'grid-cols-1' : 'grid-cols-3')}>
            {!isLandType && (
              <>
                <div>
                  <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">Beds</label>
                  <input className="input" type="number" min="0" placeholder="0"
                    value={form.bedrooms} onChange={setE('bedrooms')} />
                </div>
                <div>
                  <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">Baths</label>
                  <input className="input" type="number" min="0" placeholder="0"
                    value={form.bathrooms} onChange={setE('bathrooms')} />
                </div>
              </>
            )}
            <div>
              <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">Size (sqm) *</label>
              <input className="input" type="number" min="0" placeholder="e.g. 400"
                value={form.size_sqm} onChange={setE('size_sqm')} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-3 block">Features & Amenities</label>
            <div className="flex flex-wrap gap-2">
              {FEATURES.map(f => (
                <button key={f} type="button" onClick={() => toggle('features', f)}
                  className={clsx('px-3 py-2 rounded-full text-xs font-medium border-2 transition-all',
                    form.features.includes(f)
                      ? 'border-terracotta bg-terracotta text-white'
                      : 'border-deep/10 text-deep/50 hover:border-deep/25'
                  )}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-3 block">Available Documents</label>
            <div className="flex flex-wrap gap-2">
              {DOCS.map(d => (
                <button key={d} type="button" onClick={() => toggle('documents', d)}
                  className={clsx('px-3 py-2 rounded-full text-xs font-medium border-2 transition-all',
                    form.documents.includes(d)
                      ? 'border-sage bg-sage text-white'
                      : 'border-deep/10 text-deep/50 hover:border-deep/25'
                  )}>
                  {d}
                </button>
              ))}
            </div>
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
            <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">Property Description *</label>
            <textarea className="input resize-none" rows={8}
              placeholder="Describe the property — location, features, access roads, nearby landmarks, title status, and why it's a great buy. Minimum 50 characters."
              value={form.description} onChange={setE('description')} />
            <p className={clsx('text-xs mt-1.5', form.description.length >= 50 ? 'text-sage' : 'text-deep/30')}>
              {form.description.length} / 50 min characters
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-gold/8 border border-gold/20">
            <p className="text-xs font-semibold text-charcoal mb-1">💡 Pro tip</p>
            <p className="text-xs text-deep/50 leading-relaxed">
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
    if (!current.valid()) { toast.error('Please complete all required fields'); return }
    if (isLast) handleSubmit()
    else setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setSaving(true)
    const payload = {
      ...form,
      price:     Number(form.price),
      bedrooms:  form.bedrooms  ? Number(form.bedrooms)  : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      size_sqm:  Number(form.size_sqm),
      seller_id: user.id,
      status:    'active',
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
    <div className="min-h-screen bg-cream pt-24 pb-16">
      <div className="max-w-lg mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black mb-1">List a Property 🏗️</h1>
          <p className="text-deep/40 text-sm">Step {step + 1} of {steps.length} — {current.title}</p>
          <div className="mt-4 h-1.5 bg-deep/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-terracotta rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="animate-fade-up">{current.content}</div>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-5 py-4 rounded-2xl border border-deep/10 text-sm font-semibold text-deep/60 hover:text-deep transition-all">
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
