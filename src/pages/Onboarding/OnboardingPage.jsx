import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { upsertProfile } from '@/lib/supabase'
import { analytics } from '@/lib/posthog'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ─── Data ──────────────────────────────────────────────────
const ROLES = [
  { id:'buyer',     label:'Buyer',             emoji:'🏡', desc:'Looking to buy or invest in property' },
  { id:'seller',    label:'Seller / Developer', emoji:'🏗️', desc:'Listing properties for sale' },
  { id:'surveyor',  label:'Land Surveyor',      emoji:'📐', desc:'Offering professional survey services' },
  { id:'inspector', label:'Property Inspector', emoji:'🔍', desc:'Offering inspection services' },
  { id:'lender',    label:'Mortgage Lender',    emoji:'🏦', desc:'Offering financing and mortgage services' },
]

const STATES = ['Akwa Ibom','Lagos','Abuja (FCT)','Rivers','Delta','Ogun','Kano','Oyo','Enugu','Anambra','Cross River','Imo','Edo','Kaduna','Plateau']

const PROPERTY_TYPES = [
  { id:'land',       label:'Land / Plot',   emoji:'🌿' },
  { id:'apartment',  label:'Apartment',     emoji:'🏢' },
  { id:'duplex',     label:'Duplex',        emoji:'🏘️' },
  { id:'detached',   label:'Detached House',emoji:'🏡' },
  { id:'terrace',    label:'Terrace',       emoji:'🏠' },
  { id:'commercial', label:'Commercial',    emoji:'🏬' },
]

const GOALS = [
  { id:'family_home',    label:'Family / Personal Home',  emoji:'❤️',  desc:'A place to live and raise a family' },
  { id:'investment',     label:'Investment / Rental',      emoji:'📈',  desc:'Generate monthly rental income' },
  { id:'land_banking',   label:'Land Banking',             emoji:'🏦',  desc:'Buy land, sell later for profit' },
  { id:'development',    label:'Development Project',      emoji:'🏗️', desc:'Build and sell or lease' },
  { id:'commercial_use', label:'Commercial Use',           emoji:'💼',  desc:'Office, shop, or business space' },
]

const BUDGETS = [
  { id:'0-5',    label:'Under ₦5M',     min:0,           max:5_000_000   },
  { id:'5-15',   label:'₦5M – ₦15M',   min:5_000_000,   max:15_000_000  },
  { id:'15-30',  label:'₦15M – ₦30M',  min:15_000_000,  max:30_000_000  },
  { id:'30-80',  label:'₦30M – ₦80M',  min:30_000_000,  max:80_000_000  },
  { id:'80-200', label:'₦80M – ₦200M', min:80_000_000,  max:200_000_000 },
  { id:'200+',   label:'₦200M+',        min:200_000_000, max:999_000_000 },
]

const FEATURES = ['Swimming Pool','Boys Quarters','Gym','Gated Estate','Solar Power','Borehole','CCTV','Parking','Garden','Smart Home']

// ─── Step: Role ────────────────────────────────────────────
const StepRole = ({ data, set }) => (
  <div className="space-y-4">
    <div>
      <h2 className="font-display text-3xl font-black mb-1" style={{color:'#1A1210'}}>Who are you? 👤</h2>
      <p className="text-sm leading-relaxed" style={{color:'#8A7E78'}}>
        This helps us personalise your entire experience on DealMatch.
      </p>
    </div>
    <div className="space-y-3 mt-4">
      {ROLES.map(r => (
        <button key={r.id} type="button" onClick={() => set('role', r.id)}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all"
          style={{
            borderColor: data.role === r.id ? '#C96A3A' : '#E8DDD2',
            backgroundColor: data.role === r.id ? 'rgba(201,106,58,0.05)' : '#FFFFFF',
          }}>
          <span className="text-2xl">{r.emoji}</span>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{color:'#1A1210'}}>{r.label}</p>
            <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>{r.desc}</p>
          </div>
          {data.role === r.id && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{backgroundColor:'#C96A3A'}}>
              <Check size={11} color="white" />
            </div>
          )}
        </button>
      ))}
    </div>
  </div>
)

// ─── Step: Goal ────────────────────────────────────────────
const StepGoal = ({ data, set }) => (
  <div className="space-y-4">
    <div>
      <h2 className="font-display text-3xl font-black mb-1" style={{color:'#1A1210'}}>What's your goal? 🎯</h2>
      <p className="text-sm" style={{color:'#8A7E78'}}>This shapes every match we show you.</p>
    </div>
    <div className="space-y-3 mt-4">
      {GOALS.map(g => (
        <button key={g.id} type="button" onClick={() => set('property_goal', g.id)}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all"
          style={{
            borderColor: data.property_goal === g.id ? '#C96A3A' : '#E8DDD2',
            backgroundColor: data.property_goal === g.id ? 'rgba(201,106,58,0.05)' : '#FFFFFF',
          }}>
          <span className="text-2xl">{g.emoji}</span>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{color:'#1A1210'}}>{g.label}</p>
            <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>{g.desc}</p>
          </div>
          {data.property_goal === g.id && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{backgroundColor:'#C96A3A'}}>
              <Check size={11} color="white" />
            </div>
          )}
        </button>
      ))}
    </div>
  </div>
)

// ─── Step: Budget ──────────────────────────────────────────
const StepBudget = ({ data, set }) => (
  <div className="space-y-4">
    <div>
      <h2 className="font-display text-3xl font-black mb-1" style={{color:'#1A1210'}}>What's your budget? 💰</h2>
      <p className="text-sm" style={{color:'#8A7E78'}}>We'll only show you deals you can actually afford.</p>
    </div>
    <div className="grid grid-cols-2 gap-3 mt-4">
      {BUDGETS.map(b => (
        <button key={b.id} type="button"
          onClick={() => { set('budget_min', b.min); set('budget_max', b.max) }}
          className="p-4 rounded-2xl border-2 text-left transition-all"
          style={{
            borderColor: data.budget_max === b.max ? '#C96A3A' : '#E8DDD2',
            backgroundColor: data.budget_max === b.max ? 'rgba(201,106,58,0.05)' : '#FFFFFF',
          }}>
          <p className="font-bold text-sm" style={{color:'#1A1210'}}>{b.label}</p>
        </button>
      ))}
    </div>
    <div className="mt-2 p-4 rounded-2xl border" style={{backgroundColor:'rgba(26,18,16,0.02)', borderColor:'#E8DDD2'}}>
      <p className="text-xs font-semibold mb-2" style={{color:'#8A7E78'}}>Need financing?</p>
      <div className="flex gap-3">
        {[['yes','Yes, I need a mortgage'],['no','No, I have funds']].map(([v,l]) => (
          <button key={v} type="button" onClick={() => set('needs_financing', v === 'yes')}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all"
            style={{
              borderColor: data.needs_financing === (v === 'yes') ? '#C96A3A' : '#E8DDD2',
              color: data.needs_financing === (v === 'yes') ? '#C96A3A' : '#8A7E78',
              backgroundColor: data.needs_financing === (v === 'yes') ? 'rgba(201,106,58,0.05)' : '#FFFFFF',
            }}>
            {l}
          </button>
        ))}
      </div>
    </div>
  </div>
)

// ─── Step: Location ────────────────────────────────────────
const StepLocation = ({ data, set }) => {
  const selected = data.preferred_states || []
  const toggle   = (s) => set('preferred_states', selected.includes(s) ? selected.filter(x => x !== s) : [...selected, s])
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-3xl font-black mb-1" style={{color:'#1A1210'}}>Where do you want to buy? 📍</h2>
        <p className="text-sm" style={{color:'#8A7E78'}}>Select all states you're open to.</p>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        {STATES.map(s => (
          <button key={s} type="button" onClick={() => toggle(s)}
            className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-all"
            style={{
              borderColor: selected.includes(s) ? '#C96A3A' : '#E8DDD2',
              backgroundColor: selected.includes(s) ? '#C96A3A' : '#FFFFFF',
              color: selected.includes(s) ? '#FFFFFF' : '#5C4A3A',
            }}>
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Step: Property Types ──────────────────────────────────
const StepTypes = ({ data, set }) => {
  const selected = data.property_types || []
  const toggle   = (t) => set('property_types', selected.includes(t) ? selected.filter(x => x !== t) : [...selected, t])
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-3xl font-black mb-1" style={{color:'#1A1210'}}>What type of property? 🏠</h2>
        <p className="text-sm" style={{color:'#8A7E78'}}>Select all you're interested in.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        {PROPERTY_TYPES.map(p => (
          <button key={p.id} type="button" onClick={() => toggle(p.id)}
            className="p-4 rounded-2xl border-2 text-left transition-all"
            style={{
              borderColor: selected.includes(p.id) ? '#C96A3A' : '#E8DDD2',
              backgroundColor: selected.includes(p.id) ? 'rgba(201,106,58,0.05)' : '#FFFFFF',
            }}>
            <span className="text-2xl block mb-2">{p.emoji}</span>
            <p className="text-sm font-semibold" style={{color:'#1A1210'}}>{p.label}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Step: Features ────────────────────────────────────────
const StepFeatures = ({ data, set }) => {
  const selected = data.features || []
  const toggle   = (f) => set('features', selected.includes(f) ? selected.filter(x => x !== f) : [...selected, f])
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-3xl font-black mb-1" style={{color:'#1A1210'}}>Must-have features? ✨</h2>
        <p className="text-sm" style={{color:'#8A7E78'}}>Optional — select any that matter to you.</p>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        {FEATURES.map(f => (
          <button key={f} type="button" onClick={() => toggle(f)}
            className="px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all"
            style={{
              borderColor: selected.includes(f) ? '#C96A3A' : '#E8DDD2',
              backgroundColor: selected.includes(f) ? '#C96A3A' : '#FFFFFF',
              color: selected.includes(f) ? '#FFFFFF' : '#5C4A3A',
            }}>
            {f}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>
          Anything else? (optional)
        </label>
        <textarea className="input resize-none" rows={3}
          placeholder="e.g. Close to a school, quiet neighbourhood, near the waterfront..."
          value={data.lifestyle_notes || ''}
          onChange={e => set('lifestyle_notes', e.target.value)}
          style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
      </div>
    </div>
  )
}

// ─── All steps ─────────────────────────────────────────────
const ALL_STEPS = [
  { id:'role',     component: StepRole,     validate: d => !!d.role,                             label:'Who you are' },
  { id:'goal',     component: StepGoal,     validate: d => !!d.property_goal,                    label:'Your goal' },
  { id:'budget',   component: StepBudget,   validate: d => !!d.budget_max,                       label:'Your budget' },
  { id:'location', component: StepLocation, validate: d => (d.preferred_states||[]).length > 0,  label:'Location' },
  { id:'types',    component: StepTypes,    validate: d => (d.property_types||[]).length > 0,    label:'Property type' },
  { id:'features', component: StepFeatures, validate: () => true,                                label:'Features' },
]

// Non-buyer roles skip everything after role selection
const NON_BUYER_ROLES = ['seller','surveyor','inspector','lender']

// ─── Main component ────────────────────────────────────────
export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step,   setStep]   = useState(0)
  const [saving, setSaving] = useState(false)
  const [data,   setData]   = useState({
    role: '', property_goal: '', budget_min: 0, budget_max: 0,
    needs_financing: false, preferred_states: [], property_types: [],
    features: [], lifestyle_notes: '',
  })

  const set = (k, v) => setData(d => ({ ...d, [k]: v }))

  // If non-buyer role selected, only show role step
  const steps = data.role && NON_BUYER_ROLES.includes(data.role)
    ? [ALL_STEPS[0]]
    : ALL_STEPS

  const currentStep = steps[step]
  const StepComponent = currentStep.component
  const canProceed = currentStep.validate(data)
  const isLast = step === steps.length - 1
  const progress = ((step + 1) / steps.length) * 100

  const next = () => {
    if (!canProceed) { toast.error('Please complete this step first'); return }
    if (isLast) save()
    else setStep(s => s + 1)
  }

  const save = async () => {
    setSaving(true)
    const { error } = await upsertProfile({
      id:                   user.id,
      full_name:            profile?.full_name || user.user_metadata?.full_name,
      role:                 data.role || 'buyer',
      buyer_preferences:    data,
      onboarding_completed: true,
      updated_at:           new Date().toISOString(),
    })
    setSaving(false)
    if (error) { toast.error('Could not save profile'); return }
    analytics.onboardingDone(data)
    await refreshProfile()
    toast.success('All set! Finding your matches... 🎉')
    // Non-buyers go to professionals page, buyers go to browse
    navigate(NON_BUYER_ROLES.includes(data.role) ? '/professionals' : '/browse')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{backgroundColor:'#FFFAF5'}}>

      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between max-w-lg mx-auto w-full">
        <span className="font-display text-xl font-black" style={{color:'#C96A3A'}}>DealMatch</span>
        <span className="text-xs font-medium" style={{color:'rgba(26,18,16,0.3)'}}>
          {step + 1} of {steps.length}
        </span>
      </div>

      {/* Progress */}
      <div className="px-6 max-w-lg mx-auto w-full mb-8">
        <div className="h-1.5 rounded-full overflow-hidden" style={{backgroundColor:'rgba(26,18,16,0.08)'}}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{width:`${progress}%`, backgroundColor:'#C96A3A'}} />
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((s, i) => (
            <div key={s.id} className="w-2 h-2 rounded-full transition-all"
              style={{backgroundColor: i <= step ? '#C96A3A' : 'rgba(26,18,16,0.1)'}} />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 max-w-lg mx-auto w-full">
        <StepComponent data={data} set={set} />
      </div>

      {/* Navigation */}
      <div className="px-6 py-8 max-w-lg mx-auto w-full flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-2 px-5 py-4 rounded-2xl text-sm font-semibold transition-all"
            style={{border:'1.5px solid #E8DDD2', color:'rgba(26,18,16,0.5)', backgroundColor:'#FFFFFF'}}>
            <ArrowLeft size={16} /> Back
          </button>
        )}
        <button onClick={next} disabled={saving || !canProceed}
          className={clsx('btn-primary flex-1 flex items-center justify-center gap-2 text-base py-4',
            !canProceed && 'opacity-40 cursor-not-allowed'
          )}>
          {saving ? 'Saving...' : isLast
            ? (NON_BUYER_ROLES.includes(data.role) ? 'Go to Professionals →' : 'Find My Matches ❤️')
            : <>{step === 0 ? 'Get Started' : 'Continue'} <ArrowRight size={16} /></>
          }
        </button>
      </div>
    </div>
  )
}
