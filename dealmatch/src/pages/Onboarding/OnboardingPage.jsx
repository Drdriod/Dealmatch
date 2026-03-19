import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { upsertProfile } from '@/lib/supabase'
import { analytics } from '@/lib/posthog'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ─── Data ──────────────────────────────────────────────────
const STATES = ['Akwa Ibom','Lagos','Abuja (FCT)','Rivers','Delta','Ogun','Kano','Oyo','Enugu','Anambra','Cross River','Imo','Edo','Kaduna','Plateau']

const PROPERTY_TYPES = [
  { id: 'land',        label: 'Land / Plot',      emoji: '🌿' },
  { id: 'apartment',   label: 'Apartment',         emoji: '🏢' },
  { id: 'duplex',      label: 'Duplex',            emoji: '🏘️' },
  { id: 'detached',    label: 'Detached House',    emoji: '🏡' },
  { id: 'terrace',     label: 'Terrace',           emoji: '🏠' },
  { id: 'commercial',  label: 'Commercial',        emoji: '🏬' },
]

const GOALS = [
  { id: 'family_home',   label: 'Family / Personal Home',  emoji: '❤️', desc: 'A place to live and raise a family' },
  { id: 'investment',    label: 'Investment / Rental',      emoji: '📈', desc: 'Generate monthly rental income' },
  { id: 'land_banking',  label: 'Land Banking',             emoji: '🏦', desc: 'Buy land, sell later for profit' },
  { id: 'development',   label: 'Development Project',      emoji: '🏗️', desc: 'Build and sell or lease' },
  { id: 'commercial_use',label: 'Commercial Use',           emoji: '💼', desc: 'Office, shop, or business space' },
]

const FEATURES = ['Swimming Pool','Boys Quarters','Gym','Gated Estate','Solar Power','Borehole','CCTV','Parking','Garden','Smart Home']

const BUDGETS = [
  { id: '0-5',    label: 'Under ₦5M',      min: 0,          max: 5_000_000 },
  { id: '5-15',   label: '₦5M – ₦15M',    min: 5_000_000,  max: 15_000_000 },
  { id: '15-30',  label: '₦15M – ₦30M',   min: 15_000_000, max: 30_000_000 },
  { id: '30-80',  label: '₦30M – ₦80M',   min: 30_000_000, max: 80_000_000 },
  { id: '80-200', label: '₦80M – ₦200M',  min: 80_000_000, max: 200_000_000 },
  { id: '200+',   label: '₦200M+',         min: 200_000_000,max: 999_000_000 },
]

// ─── Step components ───────────────────────────────────────
const StepGoal = ({ data, set }) => (
  <div className="space-y-4">
    <div>
      <h2 className="font-display text-3xl font-black mb-1">What's your goal? 🎯</h2>
      <p className="text-deep/40 text-sm">This shapes every match we show you.</p>
    </div>
    <div className="space-y-3 mt-6">
      {GOALS.map(g => (
        <button key={g.id} type="button" onClick={() => set('property_goal', g.id)}
          className={clsx('w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all',
            data.property_goal === g.id ? 'border-terracotta bg-terracotta/5' : 'border-deep/8 hover:border-deep/20'
          )}>
          <span className="text-2xl">{g.emoji}</span>
          <div className="flex-1">
            <p className="font-semibold text-deep text-sm">{g.label}</p>
            <p className="text-xs text-deep/40 mt-0.5">{g.desc}</p>
          </div>
          {data.property_goal === g.id && (
            <div className="w-5 h-5 rounded-full bg-terracotta flex items-center justify-center flex-shrink-0">
              <Check size={11} className="text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  </div>
)

const StepBudget = ({ data, set }) => (
  <div className="space-y-4">
    <div>
      <h2 className="font-display text-3xl font-black mb-1">What's your budget? 💰</h2>
      <p className="text-deep/40 text-sm">We'll only show you deals you can actually afford.</p>
    </div>
    <div className="grid grid-cols-2 gap-3 mt-6">
      {BUDGETS.map(b => (
        <button key={b.id} type="button" onClick={() => { set('budget_min', b.min); set('budget_max', b.max) }}
          className={clsx('p-4 rounded-2xl border-2 text-left transition-all',
            data.budget_max === b.max ? 'border-terracotta bg-terracotta/5' : 'border-deep/8 hover:border-deep/20'
          )}>
          <p className="font-bold text-deep text-sm">{b.label}</p>
        </button>
      ))}
    </div>
    <div className="mt-4 p-4 rounded-2xl bg-deep/3 border border-deep/8">
      <p className="text-xs font-semibold text-deep/50 mb-2">Need financing?</p>
      <div className="flex gap-3">
        {[['yes','Yes, I need a mortgage'],['no','No, I have funds']].map(([v,l]) => (
          <button key={v} type="button" onClick={() => set('needs_financing', v === 'yes')}
            className={clsx('flex-1 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all',
              data.needs_financing === (v === 'yes') ? 'border-terracotta bg-terracotta/5 text-terracotta' : 'border-deep/10 text-deep/50'
            )}>
            {l}
          </button>
        ))}
      </div>
    </div>
  </div>
)

const StepLocation = ({ data, set }) => {
  const selected = data.preferred_states || []
  const toggle = (s) => {
    const next = selected.includes(s) ? selected.filter(x => x !== s) : [...selected, s]
    set('preferred_states', next)
  }
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-3xl font-black mb-1">Where do you want to buy? 📍</h2>
        <p className="text-deep/40 text-sm">Select all states you're open to. You can change this anytime.</p>
      </div>
      <div className="flex flex-wrap gap-2 mt-6">
        {STATES.map(s => (
          <button key={s} type="button" onClick={() => toggle(s)}
            className={clsx('px-4 py-2 rounded-full text-sm font-medium border-2 transition-all',
              selected.includes(s) ? 'border-terracotta bg-terracotta text-white' : 'border-deep/10 text-deep/60 hover:border-deep/25'
            )}>
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

const StepPropertyTypes = ({ data, set }) => {
  const selected = data.property_types || []
  const toggle = (t) => {
    const next = selected.includes(t) ? selected.filter(x => x !== t) : [...selected, t]
    set('property_types', next)
  }
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-3xl font-black mb-1">What type of property? 🏠</h2>
        <p className="text-deep/40 text-sm">Select all you're interested in.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-6">
        {PROPERTY_TYPES.map(p => (
          <button key={p.id} type="button" onClick={() => toggle(p.id)}
            className={clsx('p-4 rounded-2xl border-2 text-left transition-all',
              selected.includes(p.id) ? 'border-terracotta bg-terracotta/5' : 'border-deep/8 hover:border-deep/15'
            )}>
            <span className="text-2xl block mb-2">{p.emoji}</span>
            <p className="text-sm font-semibold text-deep">{p.label}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

const StepFeatures = ({ data, set }) => {
  const selected = data.features || []
  const toggle = (f) => {
    const next = selected.includes(f) ? selected.filter(x => x !== f) : [...selected, f]
    set('features', next)
  }
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-3xl font-black mb-1">Must-have features? ✨</h2>
        <p className="text-deep/40 text-sm">Optional — select any features that matter to you.</p>
      </div>
      <div className="flex flex-wrap gap-2 mt-6">
        {FEATURES.map(f => (
          <button key={f} type="button" onClick={() => toggle(f)}
            className={clsx('px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all',
              selected.includes(f) ? 'border-terracotta bg-terracotta text-white' : 'border-deep/10 text-deep/60 hover:border-deep/25'
            )}>
            {f}
          </button>
        ))}
      </div>
      <div className="mt-6">
        <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">Anything else? (optional)</label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="e.g. Close to a school, quiet neighbourhood, near the waterfront..."
          value={data.lifestyle_notes || ''}
          onChange={e => set('lifestyle_notes', e.target.value)}
        />
      </div>
    </div>
  )
}

const BUYER_STEPS = [
  { id: 'goal',   component: StepGoal,          validate: d => !!d.property_goal },
  { id: 'budget', component: StepBudget,         validate: d => !!d.budget_max },
  { id: 'location', component: StepLocation,     validate: d => (d.preferred_states||[]).length > 0 },
  { id: 'types',  component: StepPropertyTypes,  validate: d => (d.property_types||[]).length > 0 },
  { id: 'features', component: StepFeatures,     validate: () => true },
]

// ─── Main component ────────────────────────────────────────
export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep]       = useState(0)
  const [saving, setSaving]   = useState(false)
  const [data, setData]       = useState({
    property_goal: '',
    budget_min: 0,
    budget_max: 0,
    needs_financing: false,
    preferred_states: [],
    property_types: [],
    features: [],
    lifestyle_notes: '',
  })

  const set = (key, value) => setData(d => ({ ...d, [key]: value }))

  const steps = BUYER_STEPS  // extend for seller/professional roles later
  const currentStep = steps[step]
  const StepComponent = currentStep.component
  const canProceed = currentStep.validate(data)
  const isLast = step === steps.length - 1

  const next = () => {
    if (!canProceed) { toast.error('Please complete this step first'); return }
    if (isLast) save()
    else setStep(s => s + 1)
  }

  const save = async () => {
    setSaving(true)
    const { error } = await upsertProfile({
      id: user.id,
      full_name: profile?.full_name || user.user_metadata?.full_name,
      role: profile?.role || user.user_metadata?.role || 'buyer',
      buyer_preferences: data,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) { toast.error('Could not save profile'); return }
    analytics.onboardingDone(data)
    await refreshProfile()
    toast.success('Profile saved! Finding your matches...')
    navigate('/browse')
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between max-w-lg mx-auto w-full">
        <span className="font-display text-xl font-black text-terracotta">DealMatch</span>
        <span className="text-xs text-deep/30 font-medium">{step + 1} of {steps.length}</span>
      </div>

      {/* Progress bar */}
      <div className="px-6 max-w-lg mx-auto w-full mb-8">
        <div className="h-1.5 bg-deep/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-terracotta rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((s, i) => (
            <div key={s.id} className={clsx('w-2 h-2 rounded-full transition-all', i <= step ? 'bg-terracotta' : 'bg-deep/10')} />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 max-w-lg mx-auto w-full animate-fade-up">
        <StepComponent data={data} set={set} />
      </div>

      {/* Navigation */}
      <div className="px-6 py-8 max-w-lg mx-auto w-full flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-2 px-5 py-4 rounded-2xl border border-deep/10 text-sm font-semibold text-deep/60 hover:text-deep hover:border-deep/20 transition-all">
            <ArrowLeft size={16} /> Back
          </button>
        )}
        <button onClick={next} disabled={saving || !canProceed}
          className={clsx('btn-primary flex-1 flex items-center justify-center gap-2 text-base py-4 transition-all',
            !canProceed && 'opacity-40 cursor-not-allowed'
          )}>
          {saving ? 'Saving...' : isLast ? 'Find My Matches ❤️' : (
            <>{step === 0 ? 'Get Started' : 'Continue'} <ArrowRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  )
}
