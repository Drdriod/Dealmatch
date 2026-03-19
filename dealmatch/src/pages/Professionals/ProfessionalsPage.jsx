import { useState } from 'react'
import { Check, Star, Shield, Users, TrendingUp } from 'lucide-react'
import { PROFESSIONAL_PLANS, subscribeProfessional, formatNaira } from '@/lib/paystack'
import { createProfessionalApplication } from '@/lib/supabase'
import { analytics } from '@/lib/posthog'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const PRO_CONFIG = [
  {
    type: 'surveyor',
    emoji: '📐',
    color: 'sage',
    bg: 'rgba(122,158,126,0.1)',
    title: 'Land Surveyor',
    headline: 'Get matched with land buyers automatically',
    desc: 'Stop chasing cold leads. When a buyer likes a land property, we connect them with you instantly.',
    stats: [{ icon: '📋', label: 'Avg. referrals/month', value: '22' }, { icon: '✅', label: 'Verified listings required', value: 'Yes' }],
  },
  {
    type: 'inspector',
    emoji: '🔍',
    color: 'terracotta',
    bg: 'rgba(201,106,58,0.08)',
    title: 'Property Inspector',
    headline: 'Serious buyers. Zero cold outreach.',
    desc: 'Buyers who just matched a property need an inspection. You get the lead at the exact moment intent is highest.',
    stats: [{ icon: '🔥', label: 'Avg. referrals/month', value: '35' }, { icon: '⭐', label: 'Featured placement', value: 'Yes' }],
    popular: true,
  },
  {
    type: 'lender',
    emoji: '🏦',
    color: 'gold',
    bg: 'rgba(212,168,83,0.1)',
    title: 'Mortgage Lender',
    headline: 'Pre-qualified leads at the moment they need you',
    desc: 'Buyers with an accepted offer need financing fast. We send them to you — no competition, no cold traffic.',
    stats: [{ icon: '💰', label: 'Avg. loan size referred', value: '₦32M' }, { icon: '📊', label: 'Buyer financial profile', value: 'Included' }],
  },
]

// ─── Application modal ─────────────────────────────────────
function ApplyModal({ pro, onClose }) {
  const { user } = useAuth()
  const [plan, setPlan]       = useState('monthly')
  const [step, setStep]       = useState('form') // 'form' | 'pay'
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({
    full_name: '', email: user?.email || '', phone: '',
    coverage_areas: '', license_number: '', company_name: '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const planData = PROFESSIONAL_PLANS[pro.type]
  const amount   = plan === 'annual' ? planData.annualFee : planData.monthlyFee

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name || !form.email || !form.phone) return toast.error('Please fill required fields')
    setSaving(true)
    const { error } = await createProfessionalApplication({
      ...form,
      professional_type: pro.type,
      user_id: user?.id,
      plan_type: plan,
      status: 'pending',
    })
    setSaving(false)
    if (error) return toast.error('Could not submit. Please try again.')
    setStep('pay')
  }

  const handlePayment = () => {
    analytics.subscriptionStarted(pro.type, plan)
    subscribeProfessional({
      professional: { ...form, professional_type: pro.type, id: 'pending' },
      planType: plan,
      onSuccess: (res) => {
        analytics.subscriptionCompleted(pro.type, plan, amount)
        toast.success('Payment confirmed! Your profile will be live within 24 hours. 🎉')
        onClose()
      },
      onClose: () => toast('Payment cancelled'),
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="p-6 border-b border-deep/8 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-black">{pro.emoji} Join as {pro.title}</h2>
            <p className="text-sm text-deep/40 mt-0.5">Get matched with motivated buyers</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-deep/5 hover:bg-deep/10 flex items-center justify-center text-deep/40 transition-colors">✕</button>
        </div>

        <div className="p-6">
          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Plan selector */}
              <div>
                <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-3 block">Choose Plan</label>
                <div className="grid grid-cols-2 gap-3">
                  {[['monthly','Monthly', planData.monthlyFee],['annual','Annual (Save 20%)', planData.annualFee]].map(([v,l,price]) => (
                    <button key={v} type="button" onClick={() => setPlan(v)}
                      className={clsx('p-3 rounded-2xl border-2 text-left transition-all',
                        plan === v ? 'border-terracotta bg-terracotta/5' : 'border-deep/8'
                      )}>
                      <p className="text-xs font-bold text-deep">{l}</p>
                      <p className="font-display font-black text-terracotta mt-1">{formatNaira(price)}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">Full Name / Company *</label>
                <input className="input" type="text" placeholder="e.g. Biodun Survey Associates" value={form.full_name} onChange={set('full_name')} required />
              </div>
              <div>
                <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">Email *</label>
                <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
              </div>
              <div>
                <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">Phone *</label>
                <input className="input" type="tel" placeholder="+234 800 000 0000" value={form.phone} onChange={set('phone')} required />
              </div>
              <div>
                <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">Coverage Areas</label>
                <input className="input" type="text" placeholder="e.g. Lagos, Abuja, Uyo" value={form.coverage_areas} onChange={set('coverage_areas')} />
              </div>
              <div>
                <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">License / Certification Number</label>
                <input className="input" type="text" placeholder="e.g. SURCON-12345" value={form.license_number} onChange={set('license_number')} />
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full py-4 text-base mt-2">
                {saving ? 'Submitting...' : 'Continue to Payment →'}
              </button>
              <p className="text-xs text-deep/30 text-center">Your listing goes live within 24 hours after payment and verification.</p>
            </form>
          ) : (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 rounded-full bg-sage/15 flex items-center justify-center text-3xl mx-auto">✅</div>
              <div>
                <h3 className="font-display text-2xl font-black mb-2">Application received!</h3>
                <p className="text-deep/40 text-sm leading-relaxed">Complete payment to activate your listing. You'll receive a confirmation email and your profile will go live within 24 hours.</p>
              </div>
              <div className="bg-cream rounded-2xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-deep/50">{pro.title} Listing</span>
                  <span className="font-semibold capitalize">{plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-deep">Total</span>
                  <span className="font-display font-black text-terracotta text-lg">{formatNaira(amount)}</span>
                </div>
              </div>
              <button onClick={handlePayment} className="btn-primary w-full py-4 text-base">
                Pay {formatNaira(amount)} with Paystack →
              </button>
              <p className="text-xs text-deep/30">Secured by Paystack · Cancel anytime</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────
export default function ProfessionalsPage() {
  const [applying, setApplying] = useState(null) // pro config object

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <div className="bg-deep pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 80% at 70% 50%, rgba(201,106,58,0.15) 0%, transparent 60%)' }} />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="badge bg-terracotta/20 text-terracotta mb-6 mx-auto w-fit">For Professionals</div>
          <h1 className="font-display text-5xl md:text-6xl font-black text-white leading-tight mb-6">
            Stop chasing leads.<br /><em className="text-terracotta">Get matched to them.</em>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
            Buyers on DealMatch are already in love with a property. They need a surveyor, inspector, or lender — we send them straight to you.
          </p>
        </div>

        {/* Stats */}
        <div className="max-w-2xl mx-auto mt-12 grid grid-cols-3 gap-4 relative">
          {[['840+','Professionals Listed'],['12,400+','Active Buyers'],['₦2.3B','Deals Facilitated']].map(([v,l]) => (
            <div key={l} className="text-center">
              <p className="font-display text-3xl font-black text-blush">{v}</p>
              <p className="text-white/30 text-xs mt-1">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="section-tag">Listing Plans</p>
          <h2 className="section-title mb-4">Choose your <em className="text-terracotta">professional plan</em></h2>
          <p className="section-sub mx-auto text-center">One flat monthly fee. Unlimited exposure to motivated, pre-matched buyers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PRO_CONFIG.map((pro) => {
            const plan = PROFESSIONAL_PLANS[pro.type]
            return (
              <div key={pro.type}
                className={clsx('bg-white rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-card-hover relative',
                  pro.popular ? 'shadow-card-hover ring-2 ring-terracotta' : 'shadow-card'
                )}>
                {pro.popular && (
                  <div className="absolute top-5 right-5 bg-terracotta text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                {/* Header */}
                <div className="p-7 pb-5" style={{ background: pro.bg }}>
                  <div className="text-4xl mb-4">{pro.emoji}</div>
                  <h3 className="font-display text-2xl font-black mb-2">{pro.title}</h3>
                  <p className="text-deep/50 text-sm leading-relaxed">{pro.desc}</p>
                </div>

                {/* Pricing */}
                <div className="px-7 py-5 border-t border-deep/5">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-display text-3xl font-black text-deep">{formatNaira(plan.monthlyFee)}</span>
                    <span className="text-deep/30 text-sm">/ month</span>
                  </div>
                  <p className="text-xs text-deep/30">{formatNaira(plan.annualFee)} billed annually (save 20%)</p>
                </div>

                {/* Features */}
                <div className="px-7 pb-6">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-3 text-sm text-charcoal">
                        <div className="w-5 h-5 rounded-full bg-sage/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check size={11} className="text-sage" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button onClick={() => setApplying(pro)}
                    className={clsx('w-full py-4 rounded-2xl text-sm font-bold transition-all',
                      pro.popular
                        ? 'btn-primary'
                        : 'border-2 border-deep/10 hover:border-terracotta hover:text-terracotta text-deep/60'
                    )}>
                    Join as {pro.title} →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Trust section */}
      <div className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="font-display text-3xl font-black mb-10">Why professionals choose DealMatch</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Shield size={24} className="text-sage" />, title: 'Verified buyers only', desc: 'Every buyer completes an onboarding profile. No time-wasters.' },
              { icon: <TrendingUp size={24} className="text-terracotta" />, title: 'Intent-matched leads', desc: 'Leads arrive at the moment they need you — not before, not after.' },
              { icon: <Users size={24} className="text-gold" />, title: 'Full control', desc: 'Manage your coverage areas, availability, and profile from your dashboard.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center">{icon}</div>
                <h4 className="font-semibold text-deep">{title}</h4>
                <p className="text-deep/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Apply modal */}
      {applying && <ApplyModal pro={applying} onClose={() => setApplying(null)} />}
    </div>
  )
}
