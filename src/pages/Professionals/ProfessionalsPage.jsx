import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ArrowRight, Star, Shield, Users, TrendingUp } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { analytics } from '@/lib/posthog'
import toast from 'react-hot-toast'

const WHATSAPP = '2347057392060'

const PROFESSIONALS = [
  {
    id:       'surveyor',
    emoji:    '📐',
    title:    'Land Surveyor',
    desc:     'Verify land boundaries, produce survey plans, confirm titles',
    price:    25000,
    badge:    'Most Listed',
    features: ['Matched to land & plot buyers', 'Boundary dispute cases', 'Survey plan requests', 'Title verification jobs'],
    color:    '#7A9E7E',
  },
  {
    id:       'inspector',
    emoji:    '🔍',
    title:    'Property Inspector',
    desc:     'Inspect buildings for structural integrity and defects',
    price:    35000,
    badge:    'Most Popular',
    hot:      true,
    features: ['Unlimited buyer referrals', 'Pre-purchase inspections', 'Rental property checks', 'Post-construction reports'],
    color:    '#C96A3A',
  },
  {
    id:       'valuer',
    emoji:    '⚖️',
    title:    'Property Valuer',
    desc:     'Provide certified property valuations for sales and mortgages',
    price:    30000,
    badge:    'High Demand',
    features: ['Bank valuation requests', 'Insurance valuations', 'Sale price guidance', 'Estate valuations'],
    color:    '#D4A853',
  },
  {
    id:       'lawyer',
    emoji:    '⚖️',
    title:    'Real Estate Lawyer',
    desc:     'Handle title searches, deed of assignment, C of O processing',
    price:    45000,
    badge:    'Essential',
    features: ['Title search requests', 'Deed of assignment', 'C of O processing', 'Tenancy agreements'],
    color:    '#5C4A3A',
  },
  {
    id:       'lender',
    emoji:    '🏦',
    title:    'Mortgage Lender',
    desc:     'Provide home loans and mortgage financing to qualified buyers',
    price:    75000,
    badge:    'Premium',
    features: ['Pre-qualified buyer leads', 'Home loan requests', 'NHF mortgage cases', 'Commercial property loans'],
    color:    '#1A1210',
  },
  {
    id:       'architect',
    emoji:    '📏',
    title:    'Architect',
    desc:     'Design building plans, renovation projects, structural designs',
    price:    30000,
    badge:    null,
    features: ['New build design requests', 'Renovation plans', 'Building approvals', 'Structural drawings'],
    color:    '#8A7E78',
  },
  {
    id:       'agent',
    emoji:    '🤝',
    title:    'Estate Agent',
    desc:     'Help buyers and sellers close property deals professionally',
    price:    20000,
    badge:    'Entry Level',
    features: ['Buyer-seller matching', 'Property viewings', 'Negotiation support', 'Deal closing assistance'],
    color:    '#7A9E7E',
  },
  {
    id:       'contractor',
    emoji:    '🏗️',
    title:    'Building Contractor',
    desc:     'Construction, renovation, and property development services',
    price:    25000,
    badge:    null,
    features: ['New construction leads', 'Renovation projects', 'Finishing jobs', 'Development contracts'],
    color:    '#8A7E78',
  },
]

const STATS = [
  { value:'840+', label:'Active Professionals' },
  { value:'12k+', label:'Buyer Connections' },
  { value:'₦2.3B', label:'Deals Facilitated' },
  { value:'4.8★', label:'Average Rating' },
]

// ─── Application Modal ─────────────────────────────────────
function ApplicationModal({ professional, onClose }) {
  const { user, profile } = useAuth()
  const [step, setStep]   = useState('form') // form | payment | success
  const [form, setForm]   = useState({
    full_name:    profile?.full_name || '',
    company:      '',
    phone:        profile?.phone || '',
    email:        user?.email || '',
    license_no:   '',
    years_exp:    '',
    coverage:     '',
    bio:          '',
  })
  const [submitting, setSubmitting] = useState(false)
  const set = (k) => (e) => setForm(f => ({...f, [k]: e.target.value}))

  const handleApply = async (e) => {
    e.preventDefault()
    if (!form.full_name || !form.phone || !form.email) {
      toast.error('Please fill all required fields')
      return
    }
    setSubmitting(true)

    const { error } = await supabase.from('professional_applications').insert({
      user_id:       user?.id,
      type:          professional.id,
      full_name:     form.full_name,
      company:       form.company,
      phone:         form.phone,
      email:         form.email,
      license_no:    form.license_no,
      years_exp:     form.years_exp,
      coverage_areas:form.coverage,
      bio:           form.bio,
      monthly_fee:   professional.price,
      status:        'pending_payment',
      created_at:    new Date().toISOString(),
    })

    setSubmitting(false)
    if (error) { toast.error('Could not submit application'); return }
    analytics.professionalApplied(professional.id)
    setStep('payment')
  }

  const handlePaystack = () => {
    // Notify DealMatch via WhatsApp
    const msg = encodeURIComponent(
      `💼 *New Professional Application — DealMatch*\n\n` +
      `Type: *${professional.title}*\n` +
      `Name: ${form.full_name}\n` +
      `Company: ${form.company || 'Individual'}\n` +
      `Phone: ${form.phone}\n` +
      `Email: ${form.email}\n` +
      `License: ${form.license_no || 'Not provided'}\n` +
      `Experience: ${form.years_exp} years\n` +
      `Coverage: ${form.coverage}\n\n` +
      `Monthly Fee: ₦${professional.price.toLocaleString()}\n\n` +
      `Please process payment and activate their listing.`
    )
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank')
    setStep('success')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{backgroundColor:'rgba(26,18,16,0.8)', backdropFilter:'blur(8px)'}}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{opacity:0,y:40}} animate={{opacity:1,y:0}}
        className="w-full max-w-lg rounded-3xl overflow-hidden flex flex-col"
        style={{backgroundColor:'#FFFAF5', maxHeight:'90vh'}}>

        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between flex-shrink-0"
          style={{borderColor:'#E8DDD2'}}>
          <div className="flex items-center gap-3">
            <div className="text-3xl">{professional.emoji}</div>
            <div>
              <h3 className="font-display text-lg font-black" style={{color:'#1A1210'}}>
                Join as {professional.title}
              </h3>
              <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>
                ₦{professional.price.toLocaleString()}/month
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{backgroundColor:'rgba(26,18,16,0.08)'}}>
            <X size={14} style={{color:'#5C4A3A'}} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">

          {step === 'form' && (
            <form onSubmit={handleApply} className="p-5 space-y-4">
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
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Coverage Areas *</label>
                <input className="input text-sm" type="text" placeholder="e.g. Lagos, Abuja, Uyo"
                  value={form.coverage} onChange={set('coverage')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Professional Bio</label>
                <textarea className="input resize-none text-sm" rows={3}
                  placeholder="Briefly describe your experience and what you offer..."
                  value={form.bio} onChange={set('bio')} style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
              </div>
              <div className="p-4 rounded-2xl" style={{backgroundColor:'rgba(201,106,58,0.06)', border:'1px solid rgba(201,106,58,0.2)'}}>
                <p className="text-xs font-bold mb-1" style={{color:'#C96A3A'}}>Monthly Subscription</p>
                <p className="font-display font-black text-2xl" style={{color:'#1A1210'}}>
                  ₦{professional.price.toLocaleString()}<span className="text-sm font-normal" style={{color:'#8A7E78'}}>/month</span>
                </p>
                <p className="text-xs mt-1" style={{color:'#8A7E78'}}>
                  Your listing goes live within 24 hours after payment verification.
                </p>
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full py-4">
                {submitting ? 'Submitting...' : 'Submit Application →'}
              </button>
            </form>
          )}

          {step === 'payment' && (
            <div className="p-5">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">💳</div>
                <h4 className="font-display font-black text-xl mb-2" style={{color:'#1A1210'}}>Complete Payment</h4>
                <p className="text-sm" style={{color:'#8A7E78'}}>
                  Your application is submitted. Complete your monthly subscription payment to go live.
                </p>
              </div>
              <div className="p-4 rounded-2xl mb-5 text-center"
                style={{backgroundColor:'rgba(201,106,58,0.06)', border:'1px solid rgba(201,106,58,0.15)'}}>
                <p className="text-xs uppercase tracking-wider mb-1" style={{color:'#8A7E78'}}>Amount Due</p>
                <p className="font-display font-black text-3xl" style={{color:'#C96A3A'}}>
                  ₦{professional.price.toLocaleString()}
                </p>
                <p className="text-xs mt-1" style={{color:'#8A7E78'}}>First month subscription</p>
              </div>
              <button onClick={handlePaystack} className="btn-primary w-full py-4 mb-3">
                Pay via WhatsApp / Transfer →
              </button>
              <p className="text-xs text-center" style={{color:'#8A7E78'}}>
                DealMatch will send payment details via WhatsApp and activate your listing within 24 hours.
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h4 className="font-display font-black text-2xl mb-2" style={{color:'#1A1210'}}>Application Received!</h4>
              <p className="text-sm leading-relaxed mb-6" style={{color:'#8A7E78'}}>
                DealMatch will contact you on WhatsApp within 24 hours to complete payment and activate your professional listing.
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
    <motion.div whileHover={{y:-4}}
      className="rounded-3xl overflow-hidden border transition-all"
      style={{
        backgroundColor: pro.hot ? '#1A1210' : '#FFFAF5',
        borderColor: pro.hot ? 'transparent' : '#E8DDD2',
        boxShadow: pro.hot ? '0 20px 60px rgba(201,106,58,0.3)' : '0 4px 20px rgba(26,18,16,0.06)',
      }}>
      <div className="p-6">
        {/* Badge */}
        {pro.badge && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold mb-4"
            style={{
              backgroundColor: pro.hot ? 'rgba(201,106,58,0.3)' : `${pro.color}15`,
              color: pro.hot ? '#FFFFFF' : pro.color,
            }}>
            {pro.hot ? '🔥' : '⭐'} {pro.badge}
          </div>
        )}

        {/* Icon + title */}
        <div className="flex items-center gap-3 mb-3">
          <div className="text-4xl">{pro.emoji}</div>
          <div>
            <h3 className="font-display font-black text-lg leading-tight"
              style={{color: pro.hot ? '#FFFFFF' : '#1A1210'}}>
              {pro.title}
            </h3>
            <p className="text-xs mt-0.5" style={{color: pro.hot ? 'rgba(255,255,255,0.5)' : '#8A7E78'}}>
              {pro.desc}
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-1.5 mb-5">
          {pro.features.map(f => (
            <div key={f} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{backgroundColor: pro.hot ? 'rgba(255,255,255,0.15)' : `${pro.color}15`}}>
                <Check size={9} style={{color: pro.hot ? '#FFFFFF' : pro.color}} />
              </div>
              <p className="text-xs" style={{color: pro.hot ? 'rgba(255,255,255,0.65)' : '#8A7E78'}}>
                {f}
              </p>
            </div>
          ))}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display font-black text-2xl"
              style={{color: pro.hot ? '#FFFFFF' : '#C96A3A'}}>
              ₦{pro.price.toLocaleString()}
            </p>
            <p className="text-xs" style={{color: pro.hot ? 'rgba(255,255,255,0.4)' : '#8A7E78'}}>/month</p>
          </div>
          <button onClick={() => onApply(pro)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all"
            style={{
              backgroundColor: pro.hot ? '#C96A3A' : '#1A1210',
              color: '#FFFFFF',
              boxShadow: pro.hot ? '0 8px 24px rgba(201,106,58,0.5)' : 'none',
            }}>
            Apply <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Page ─────────────────────────────────────────────
export default function ProfessionalsPage() {
  const [selected, setSelected] = useState(null)

  return (
    <div className="min-h-screen pt-20" style={{backgroundColor:'#F5EDE0'}}>

      {/* Hero */}
      <section className="py-20 px-6 relative overflow-hidden" style={{backgroundColor:'#1A1210'}}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background:'radial-gradient(ellipse 60% 80% at 20% 50%, rgba(201,106,58,0.2) 0%, transparent 60%)'
        }} />
        <div className="max-w-4xl mx-auto relative text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{color:'rgba(255,255,255,0.4)'}}>
            For Professionals
          </p>
          <h1 className="font-display font-black mb-4" style={{
            fontSize:'clamp(2.5rem, 6vw, 4rem)', color:'#FFFFFF', lineHeight:1.1
          }}>
            Get matched with<br /><em style={{color:'#C96A3A'}}>motivated clients.</em>
          </h1>
          <p className="text-lg mb-10 max-w-2xl mx-auto" style={{color:'rgba(255,255,255,0.5)'}}>
            Stop chasing cold leads. DealMatch sends you clients who are already in the middle of a property transaction and need exactly your service.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="font-display font-black text-3xl" style={{color:'#C96A3A'}}>{s.value}</p>
                <p className="text-xs mt-1" style={{color:'rgba(255,255,255,0.4)'}}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6" style={{backgroundColor:'#FFFAF5'}}>
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-black text-3xl text-center mb-10" style={{color:'#1A1210'}}>
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num:'01', icon:'📋', title:'Apply & Pay', desc:'Submit your professional details and pay the monthly subscription fee.' },
              { num:'02', icon:'✅', title:'Get Verified', desc:'DealMatch verifies your credentials and activates your listing within 24 hours.' },
              { num:'03', icon:'💼', title:'Receive Clients', desc:'Buyers, sellers and landlords who need your service are matched directly to you.' },
            ].map((s, i) => (
              <div key={s.num} className="rounded-2xl p-6 border relative overflow-hidden"
                style={{backgroundColor:'#FFFAF5', borderColor:'#E8DDD2'}}>
                <div className="absolute -top-3 -right-2 font-display font-black leading-none select-none"
                  style={{fontSize:'6rem', color:'rgba(201,106,58,0.06)'}}>
                  {s.num}
                </div>
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className="font-display font-black text-lg mb-2" style={{color:'#1A1210'}}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{color:'#8A7E78'}}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional plans */}
      <section className="py-16 px-6" style={{backgroundColor:'#F5EDE0'}}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#C96A3A'}}>
              Choose Your Plan
            </p>
            <h2 className="font-display font-black text-4xl" style={{color:'#1A1210'}}>
              8 professional categories
            </h2>
            <p className="text-sm mt-3" style={{color:'#8A7E78'}}>
              All plans include unlimited client referrals, verified badge, and priority matching.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PROFESSIONALS.map(pro => (
              <ProfCard key={pro.id} pro={pro} onApply={setSelected} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="py-16 px-6" style={{backgroundColor:'#FFFAF5'}}>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {[
            { icon:<Shield size={24} style={{color:'#7A9E7E'}} />, title:'Verified Badge', desc:'Your profile shows a verified professional badge that builds instant trust.' },
            { icon:<Users size={24} style={{color:'#C96A3A'}} />, title:'Serious Clients', desc:'Every referral comes from a buyer or seller already committed to a deal.' },
            { icon:<TrendingUp size={24} style={{color:'#D4A853'}} />, title:'Cancel Anytime', desc:'No long-term contract. Pay monthly and cancel if it doesn\'t work for you.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{backgroundColor:'rgba(26,18,16,0.05)'}}>
                {icon}
              </div>
              <h3 className="font-display font-black text-lg" style={{color:'#1A1210'}}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{color:'#8A7E78'}}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {selected && <ApplicationModal professional={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  )
}
