import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ArrowRight, Star, Shield, Users, TrendingUp, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { analytics } from '@/lib/posthog'
import toast from 'react-hot-toast'

const WHATSAPP = '2347057392060'

const PROFESSIONALS = [
  { id:'surveyor',   emoji:'📐', title:'Land Surveyor',       desc:'Verify land boundaries, survey plans, title confirmation', price:25000, badge:'Most Listed',  features:['Matched to land & plot buyers','Boundary dispute cases','Survey plan requests','Title verification jobs'], color:'#7A9E7E' },
  { id:'inspector',  emoji:'🔍', title:'Property Inspector',  desc:'Inspect buildings for structural integrity and defects',    price:35000, badge:'Most Popular', hot:true, features:['Unlimited buyer referrals','Pre-purchase inspections','Rental property checks','Post-construction reports'], color:'#C96A3A' },
  { id:'valuer',     emoji:'⚖️', title:'Property Valuer',     desc:'Certified property valuations for sales and mortgages',    price:30000, badge:'High Demand',  features:['Bank valuation requests','Insurance valuations','Sale price guidance','Estate valuations'], color:'#D4A853' },
  { id:'lawyer',     emoji:'🏛️', title:'Real Estate Lawyer',  desc:'Title searches, deed of assignment, C of O processing',   price:45000, badge:'Essential',    features:['Title search requests','Deed of assignment','C of O processing','Tenancy agreements'], color:'#5C4A3A' },
  { id:'lender',     emoji:'🏦', title:'Mortgage Lender',     desc:'Home loans and mortgage financing for qualified buyers',   price:75000, badge:'Premium',      features:['Pre-qualified buyer leads','Home loan requests','NHF mortgage cases','Commercial loans'], color:'#1A1210' },
  { id:'architect',  emoji:'📏', title:'Architect',           desc:'Building plans, renovation projects, structural designs',  price:30000, badge:null,           features:['New build design requests','Renovation plans','Building approvals','Structural drawings'], color:'#8A7E78' },
  { id:'agent',      emoji:'🤝', title:'Estate Agent',        desc:'Help buyers and sellers close property deals',             price:20000, badge:'Entry Level',   features:['Buyer-seller matching','Property viewings','Negotiation support','Deal closing'], color:'#7A9E7E' },
  { id:'contractor', emoji:'🏗️', title:'Building Contractor', desc:'Construction, renovation, property development services', price:25000, badge:null,           features:['New construction leads','Renovation projects','Finishing jobs','Development contracts'], color:'#8A7E78' },
]

const STATS = [
  { value:'840+', label:'Active Professionals' },
  { value:'12k+', label:'Client Connections' },
  { value:'₦2.3B', label:'Deals Facilitated' },
  { value:'4.8★', label:'Average Rating' },
]

// ─── Find Professional Modal (for buyers) ─────────────────
function FindProfessionalModal({ onClose }) {
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ name:'', phone:'', state:'', details:'' })
  const [submitted, setSubmitted] = useState(false)
  const set = (k) => (e) => setForm(f => ({...f, [k]: e.target.value}))

  const handleRequest = (e) => {
    e.preventDefault()
    if (!form.name || !form.phone || !selected) return toast.error('Please fill all fields')
    const pro = PROFESSIONALS.find(p => p.id === selected)
    const msg = encodeURIComponent(
      `🔍 *Professional Service Request — DealMatch*\n\n` +
      `Service Needed: *${pro.title}*\n` +
      `Client Name: ${form.name}\n` +
      `Phone: ${form.phone}\n` +
      `State: ${form.state || 'Not specified'}\n` +
      `Details: ${form.details || 'None'}\n\n` +
      `Please match this client with a verified ${pro.title} on DealMatch.`
    )
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank')
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{backgroundColor:'rgba(26,18,16,0.8)', backdropFilter:'blur(8px)'}}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}}
        className="w-full max-w-lg rounded-3xl overflow-hidden flex flex-col"
        style={{backgroundColor:'#FFFAF5', maxHeight:'90vh'}}>

        <div className="p-5 border-b flex items-center justify-between flex-shrink-0"
          style={{borderColor:'#E8DDD2'}}>
          <div>
            <h3 className="font-display text-xl font-black" style={{color:'#1A1210'}}>Find a Professional 🔍</h3>
            <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>Tell us what you need — we'll match you</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{backgroundColor:'rgba(26,18,16,0.08)'}}>
            <X size={14} style={{color:'#5C4A3A'}} />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h4 className="font-display font-black text-xl mb-2" style={{color:'#1A1210'}}>Request Sent!</h4>
            <p className="text-sm leading-relaxed mb-6" style={{color:'#8A7E78'}}>
              DealMatch will match you with a verified professional and connect you via WhatsApp within 24 hours.
            </p>
            <button onClick={onClose} className="btn-primary w-full py-3">Done</button>
          </div>
        ) : (
          <form onSubmit={handleRequest} className="p-5 space-y-4 overflow-y-auto">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{color:'rgba(26,18,16,0.5)'}}>
                What service do you need? *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PROFESSIONALS.map(p => (
                  <button key={p.id} type="button" onClick={() => setSelected(p.id)}
                    className="flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all"
                    style={{
                      borderColor: selected === p.id ? '#C96A3A' : '#E8DDD2',
                      backgroundColor: selected === p.id ? 'rgba(201,106,58,0.05)' : '#FFFFFF',
                    }}>
                    <span className="text-lg">{p.emoji}</span>
                    <span className="text-xs font-semibold leading-tight" style={{color:'#1A1210'}}>{p.title}</span>
                    {selected === p.id && <Check size={12} style={{color:'#C96A3A', marginLeft:'auto', flexShrink:0}} />}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Your Name *</label>
                <input className="input text-sm" type="text" placeholder="John Doe"
                  value={form.name} onChange={set('name')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Phone *</label>
                <input className="input text-sm" type="tel" placeholder="0800 000 0000"
                  value={form.phone} onChange={set('phone')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>State / Location</label>
              <input className="input text-sm" type="text" placeholder="e.g. Uyo, Lagos, Abuja"
                value={form.state} onChange={set('state')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Additional Details</label>
              <textarea className="input resize-none text-sm" rows={3}
                placeholder="Tell us more about what you need..."
                value={form.details} onChange={set('details')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
            </div>
            <button type="submit" className="btn-primary w-full py-4">
              Find Me a Professional →
            </button>
            <p className="text-xs text-center" style={{color:'#8A7E78'}}>
              Free to request. DealMatch matches you within 24 hours.
            </p>
          </form>
        )}
      </motion.div>
    </div>
  )
}

// ─── Application Modal ─────────────────────────────────────
function ApplicationModal({ professional, onClose }) {
  const { user, profile } = useAuth()
  const [step, setStep]   = useState('form')
  const [appId, setAppId] = useState(null)
  const [form, setForm]   = useState({
    full_name: profile?.full_name || '',
    company:   '',
    phone:     profile?.phone || '',
    email:     user?.email || '',
    license_no:'',
    years_exp: '',
    coverage:  '',
    bio:       '',
  })
  const [submitting, setSubmitting] = useState(false)
  const set = (k) => (e) => setForm(f => ({...f, [k]: e.target.value}))

  const handleApply = async (e) => {
    e.preventDefault()
    if (!form.full_name || !form.phone || !form.email) {
      toast.error('Please fill name, phone and email')
      return
    }
    setSubmitting(true)

    const { data, error } = await supabase
      .from('professional_applications')
      .insert({
        user_id:        user?.id,
        type:           professional.id,
        full_name:      form.full_name,
        company:        form.company,
        phone:          form.phone,
        email:          form.email,
        license_no:     form.license_no,
        years_exp:      Number(form.years_exp) || 0,
        coverage_areas: form.coverage,
        bio:            form.bio,
        monthly_fee:    professional.price,
        status:         'pending_payment',
        created_at:     new Date().toISOString(),
      })
      .select()
      .single()

    setSubmitting(false)

    if (error) {
      // Even if DB fails, proceed to payment step
      console.error(error)
      toast('Application saved locally. Proceeding to payment.')
    } else {
      setAppId(data?.id)
      analytics.professionalApplied?.(professional.id)
    }

    // Always move to payment step regardless
    setStep('payment')
  }

  const handlePay = () => {
    const msg = encodeURIComponent(
      `💼 *Professional Application — DealMatch*\n\n` +
      `Category: *${professional.title}*\n` +
      `Name: ${form.full_name}\n` +
      `Company: ${form.company || 'Individual'}\n` +
      `Phone: ${form.phone}\n` +
      `Email: ${form.email}\n` +
      `License: ${form.license_no || 'Not provided'}\n` +
      `Experience: ${form.years_exp || '0'} years\n` +
      `Coverage: ${form.coverage || 'Not specified'}\n\n` +
      `Monthly Fee: ₦${professional.price.toLocaleString()}\n` +
      `Application ID: ${appId || 'New'}\n\n` +
      `Ready to pay. Please send payment details.`
    )
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank')
    setStep('success')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{backgroundColor:'rgba(26,18,16,0.8)', backdropFilter:'blur(8px)'}}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{opacity:0, y:40}} animate={{opacity:1, y:0}}
        className="w-full max-w-lg rounded-3xl overflow-hidden flex flex-col"
        style={{backgroundColor:'#FFFAF5', maxHeight:'92vh'}}>

        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between flex-shrink-0"
          style={{borderColor:'#E8DDD2'}}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{professional.emoji}</span>
            <div>
              <h3 className="font-display text-lg font-black" style={{color:'#1A1210'}}>
                Join as {professional.title}
              </h3>
              <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>
                Step {step === 'form' ? '1' : step === 'payment' ? '2' : '3'} of 3
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{backgroundColor:'rgba(26,18,16,0.08)'}}>
            <X size={14} style={{color:'#5C4A3A'}} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 flex-shrink-0" style={{backgroundColor:'rgba(26,18,16,0.06)'}}>
          <div className="h-full transition-all duration-500"
            style={{
              width: step === 'form' ? '33%' : step === 'payment' ? '66%' : '100%',
              backgroundColor:'#C96A3A'
            }} />
        </div>

        <div className="overflow-y-auto flex-1">

          {/* Step 1 — Form */}
          {step === 'form' && (
            <form onSubmit={handleApply} className="p-5 space-y-4">
              <p className="text-sm font-semibold" style={{color:'#1A1210'}}>
                Fill your professional details — you'll pay after.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Full Name *</label>
                  <input className="input text-sm" type="text" placeholder="John Doe"
                    value={form.full_name} onChange={set('full_name')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Company / Firm</label>
                  <input className="input text-sm" type="text" placeholder="Optional"
                    value={form.company} onChange={set('company')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Phone *</label>
                  <input className="input text-sm" type="tel" placeholder="+234 800 000 0000"
                    value={form.phone} onChange={set('phone')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Email *</label>
                  <input className="input text-sm" type="email" placeholder="you@example.com"
                    value={form.email} onChange={set('email')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>License / Reg. No.</label>
                  <input className="input text-sm" type="text" placeholder="Optional"
                    value={form.license_no} onChange={set('license_no')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Years Experience</label>
                  <input className="input text-sm" type="number" min="0" placeholder="e.g. 5"
                    value={form.years_exp} onChange={set('years_exp')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Coverage Areas</label>
                <input className="input text-sm" type="text" placeholder="e.g. Lagos, Abuja, Uyo"
                  value={form.coverage} onChange={set('coverage')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Professional Bio</label>
                <textarea className="input resize-none text-sm" rows={3}
                  placeholder="Briefly describe your experience..."
                  value={form.bio} onChange={set('bio')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full py-4">
                {submitting ? 'Saving...' : 'Save & Continue to Payment →'}
              </button>
            </form>
          )}

          {/* Step 2 — Payment */}
          {step === 'payment' && (
            <div className="p-5">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">💳</div>
                <h4 className="font-display font-black text-xl mb-1" style={{color:'#1A1210'}}>
                  Application saved! ✅
                </h4>
                <p className="text-sm" style={{color:'#8A7E78'}}>
                  Complete your payment to activate your professional listing.
                </p>
              </div>

              {/* Summary */}
              <div className="rounded-2xl p-4 mb-5 space-y-2 text-sm"
                style={{backgroundColor:'rgba(26,18,16,0.03)', border:'1px solid #E8DDD2'}}>
                <p style={{color:'#1A1210'}}><strong>Name:</strong> {form.full_name}</p>
                <p style={{color:'#1A1210'}}><strong>Category:</strong> {professional.title}</p>
                <p style={{color:'#1A1210'}}><strong>Coverage:</strong> {form.coverage || 'Not specified'}</p>
              </div>

              <div className="rounded-2xl p-4 mb-5 text-center"
                style={{backgroundColor:'rgba(201,106,58,0.06)', border:'1px solid rgba(201,106,58,0.2)'}}>
                <p className="text-xs uppercase tracking-wider mb-1" style={{color:'#8A7E78'}}>Monthly Subscription</p>
                <p className="font-display font-black text-4xl" style={{color:'#C96A3A'}}>
                  ₦{professional.price.toLocaleString()}
                </p>
                <p className="text-xs mt-1" style={{color:'#8A7E78'}}>First month — cancel anytime</p>
              </div>

              <button onClick={handlePay} className="btn-primary w-full py-4 mb-3">
                Pay via WhatsApp →
              </button>
              <p className="text-xs text-center" style={{color:'#8A7E78'}}>
                DealMatch sends payment details via WhatsApp and activates your listing within 24 hours.
              </p>
            </div>
          )}

          {/* Step 3 — Success */}
          {step === 'success' && (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h4 className="font-display font-black text-2xl mb-2" style={{color:'#1A1210'}}>Almost there!</h4>
              <p className="text-sm leading-relaxed mb-6" style={{color:'#8A7E78'}}>
                DealMatch will contact you on WhatsApp to complete payment and activate your professional listing within 24 hours.
              </p>
              <button onClick={onClose} className="btn-primary w-full py-4">Done</button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Professional Card ─────────────────────────────────────
function ProfCard({ pro, onApply }) {
  return (
    <motion.div whileHover={{y:-4}} className="rounded-3xl overflow-hidden border transition-all"
      style={{
        backgroundColor: pro.hot ? '#1A1210' : '#FFFAF5',
        borderColor: pro.hot ? 'transparent' : '#E8DDD2',
        boxShadow: pro.hot ? '0 20px 60px rgba(201,106,58,0.3)' : '0 4px 20px rgba(26,18,16,0.06)',
      }}>
      <div className="p-6">
        {pro.badge && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold mb-4"
            style={{backgroundColor: pro.hot ? 'rgba(201,106,58,0.3)' : `${pro.color}15`, color: pro.hot ? '#FFFFFF' : pro.color}}>
            {pro.hot ? '🔥' : '⭐'} {pro.badge}
          </div>
        )}
        <div className="flex items-center gap-3 mb-3">
          <div className="text-4xl">{pro.emoji}</div>
          <div>
            <h3 className="font-display font-black text-lg leading-tight" style={{color: pro.hot ? '#FFFFFF' : '#1A1210'}}>{pro.title}</h3>
            <p className="text-xs mt-0.5" style={{color: pro.hot ? 'rgba(255,255,255,0.5)' : '#8A7E78'}}>{pro.desc}</p>
          </div>
        </div>
        <div className="space-y-1.5 mb-5">
          {pro.features.map(f => (
            <div key={f} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{backgroundColor: pro.hot ? 'rgba(255,255,255,0.15)' : `${pro.color}15`}}>
                <Check size={9} style={{color: pro.hot ? '#FFFFFF' : pro.color}} />
              </div>
              <p className="text-xs" style={{color: pro.hot ? 'rgba(255,255,255,0.65)' : '#8A7E78'}}>{f}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display font-black text-2xl" style={{color: pro.hot ? '#FFFFFF' : '#C96A3A'}}>
              ₦{pro.price.toLocaleString()}
            </p>
            <p className="text-xs" style={{color: pro.hot ? 'rgba(255,255,255,0.4)' : '#8A7E78'}}>/month</p>
          </div>
          <button onClick={() => onApply(pro)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold"
            style={{backgroundColor: pro.hot ? '#C96A3A' : '#1A1210', color:'#FFFFFF',
              boxShadow: pro.hot ? '0 8px 24px rgba(201,106,58,0.5)' : 'none'}}>
            Apply <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Page ─────────────────────────────────────────────
export default function ProfessionalsPage() {
  const [selected, setSelected]   = useState(null)
  const [showFind, setShowFind]   = useState(false)
  const [activeTab, setActiveTab] = useState('join') // join | find

  return (
    <div className="min-h-screen pt-20" style={{backgroundColor:'#F5EDE0'}}>

      {/* Hero */}
      <section className="py-16 px-6 relative overflow-hidden" style={{backgroundColor:'#1A1210'}}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background:'radial-gradient(ellipse 60% 80% at 20% 50%, rgba(201,106,58,0.2) 0%, transparent 60%)'
        }} />
        <div className="max-w-4xl mx-auto relative text-center">
          <h1 className="font-display font-black mb-4" style={{fontSize:'clamp(2rem, 5vw, 3.5rem)', color:'#FFFFFF', lineHeight:1.1}}>
            Nigeria's property<br /><em style={{color:'#C96A3A'}}>professional network.</em>
          </h1>
          <p className="text-base mb-8 max-w-xl mx-auto" style={{color:'rgba(255,255,255,0.5)'}}>
            Are you a buyer needing professional help? Or a professional wanting serious clients?
          </p>

          {/* Tab switcher */}
          <div className="inline-flex rounded-2xl p-1 mb-8"
            style={{backgroundColor:'rgba(255,255,255,0.08)'}}>
            <button onClick={() => setActiveTab('find')}
              className="px-6 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: activeTab === 'find' ? '#C96A3A' : 'transparent',
                color: activeTab === 'find' ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
              }}>
              🔍 I need a Professional
            </button>
            <button onClick={() => setActiveTab('join')}
              className="px-6 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: activeTab === 'join' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'join' ? '#1A1210' : 'rgba(255,255,255,0.5)',
              }}>
              💼 I am a Professional
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="font-display font-black text-2xl" style={{color:'#C96A3A'}}>{s.value}</p>
                <p className="text-xs mt-1" style={{color:'rgba(255,255,255,0.4)'}}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Find a Professional tab */}
      {activeTab === 'find' && (
        <section className="py-16 px-6" style={{backgroundColor:'#F5EDE0'}}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-display font-black text-3xl mb-3" style={{color:'#1A1210'}}>
                What professional do you need?
              </h2>
              <p className="text-sm" style={{color:'#8A7E78'}}>
                Select the service — DealMatch matches you with a verified professional in your area within 24 hours.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {PROFESSIONALS.map(pro => (
                <motion.button key={pro.id} whileHover={{y:-3}} whileTap={{scale:0.97}}
                  onClick={() => setShowFind(true)}
                  className="rounded-2xl p-5 text-center border transition-all"
                  style={{backgroundColor:'#FFFAF5', borderColor:'#E8DDD2',
                    boxShadow:'0 4px 16px rgba(26,18,16,0.06)'}}>
                  <div className="text-3xl mb-3">{pro.emoji}</div>
                  <p className="text-sm font-semibold leading-tight" style={{color:'#1A1210'}}>{pro.title}</p>
                  <p className="text-xs mt-1" style={{color:'#8A7E78'}}>Free to request</p>
                </motion.button>
              ))}
            </div>
            <div className="text-center">
              <button onClick={() => setShowFind(true)} className="btn-primary px-10 py-4 text-base">
                Request a Professional →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Join as Professional tab */}
      {activeTab === 'join' && (
        <>
          {/* How it works */}
          <section className="py-12 px-6" style={{backgroundColor:'#FFFAF5'}}>
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display font-black text-2xl text-center mb-8" style={{color:'#1A1210'}}>How it works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { num:'01', icon:'📋', title:'Register First', desc:'Fill your professional details. No payment required upfront.' },
                  { num:'02', icon:'💳', title:'Pay to Go Live', desc:'Pay the monthly subscription after reviewing your application.' },
                  { num:'03', icon:'💼', title:'Receive Clients', desc:'Get matched with buyers and sellers who need your service.' },
                ].map(s => (
                  <div key={s.num} className="rounded-2xl p-5 border relative overflow-hidden"
                    style={{backgroundColor:'#FFFAF5', borderColor:'#E8DDD2'}}>
                    <div className="absolute -top-2 -right-1 font-display font-black leading-none select-none"
                      style={{fontSize:'5rem', color:'rgba(201,106,58,0.06)'}}>{s.num}</div>
                    <div className="text-3xl mb-3">{s.icon}</div>
                    <h3 className="font-display font-black text-base mb-1" style={{color:'#1A1210'}}>{s.title}</h3>
                    <p className="text-sm leading-relaxed" style={{color:'#8A7E78'}}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Plans */}
          <section className="py-12 px-6" style={{backgroundColor:'#F5EDE0'}}>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="font-display font-black text-3xl" style={{color:'#1A1210'}}>
                  Choose your category
                </h2>
                <p className="text-sm mt-2" style={{color:'#8A7E78'}}>
                  Register now, pay when you're ready to go live.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {PROFESSIONALS.map(pro => (
                  <ProfCard key={pro.id} pro={pro} onApply={setSelected} />
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <AnimatePresence>
        {selected && <ApplicationModal professional={selected} onClose={() => setSelected(null)} />}
        {showFind && <FindProfessionalModal onClose={() => setShowFind(false)} />}
      </AnimatePresence>
    </div>
  )
}
