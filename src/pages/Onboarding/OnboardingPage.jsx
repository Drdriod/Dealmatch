import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { analytics } from '@/lib/posthog'
import toast from 'react-hot-toast'

const ROLES = [
  { id:'buyer',    emoji:'🏠', label:"I want to Buy",      desc:'Looking for a property to purchase.' },
  { id:'seller',   emoji:'💼', label:"I want to Sell",     desc:'I have a property to list and sell.' },
  { id:'renter',   emoji:'🔑', label:"I want to Rent",     desc:'Looking for a rental property.' },
  { id:'landlord', emoji:'🏘️', label:"I'm a Landlord",    desc:'I have rental or hotel properties.' },
  { id:'agent',    emoji:'🤝', label:"I'm an Agent",       desc:'I represent buyers and sellers.' },
  { id:'investor', emoji:'📈', label:"I'm an Investor",    desc:'I buy properties for investment.' },
]

const GOALS = [
  { id:'buy_home',      label:'Buy a Home',         emoji:'🏡' },
  { id:'land_banking',  label:'Land Banking',        emoji:'🌿' },
  { id:'investment',    label:'Property Investment', emoji:'📈' },
  { id:'rental_income', label:'Rental Income',       emoji:'💰' },
  { id:'relocation',    label:'Relocation',          emoji:'🗺️' },
  { id:'commercial',    label:'Commercial Property', emoji:'🏬' },
]

const STATES = ['Lagos','Abuja','Rivers','Akwa Ibom','Delta','Oyo','Kano','Anambra','Enugu','Cross River','Edo','Imo']
const PROP_TYPES = ['Land','Apartment','Duplex','Detached House','Terrace','Commercial']

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step,   setStep]   = useState(0)
  const [saving, setSaving] = useState(false)
  const [data,   setData]   = useState({
    role: '', property_goal: '', preferred_states: [],
    property_types: [], budget_min: '', budget_max: '',
    needs_financing: false, full_name: '', phone: '',
  })

  const set       = (k, v) => setData(d => ({ ...d, [k]: v }))
  const toggleArr = (k, v) => setData(d => ({
    ...d, [k]: d[k].includes(v) ? d[k].filter(x => x !== v) : [...d[k], v]
  }))

  const steps = [
    {
      title: "What's your role?",
      valid: () => !!data.role,
      content: (
        <div className="space-y-3">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">👋</div>
            <h2 className="font-display font-black text-2xl" style={{ color:'#1A1210' }}>Welcome to DealMatch!</h2>
            <p className="text-sm mt-1" style={{ color:'#8A7E78' }}>Tell us how you'll use the platform.</p>
          </div>
          {ROLES.map(r => (
            <button key={r.id} onClick={() => set('role', r.id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all"
              style={{
                borderColor:     data.role === r.id ? '#C96A3A' : '#E8DDD2',
                backgroundColor: data.role === r.id ? 'rgba(201,106,58,0.05)' : '#FFFFFF',
              }}>
              <span className="text-2xl flex-shrink-0">{r.emoji}</span>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color:'#1A1210' }}>{r.label}</p>
                <p className="text-xs mt-0.5" style={{ color:'#8A7E78' }}>{r.desc}</p>
              </div>
              {data.role === r.id && <Check size={16} style={{ color:'#C96A3A', flexShrink:0 }} />}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Your goal',
      valid: () => !!data.property_goal,
      content: (
        <div>
          <div className="mb-5">
            <h2 className="font-display font-black text-2xl" style={{ color:'#1A1210' }}>What's your goal? 🎯</h2>
            <p className="text-sm mt-1" style={{ color:'#8A7E78' }}>This helps us match you better.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {GOALS.map(g => (
              <button key={g.id} onClick={() => set('property_goal', g.id)}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all"
                style={{
                  borderColor:     data.property_goal === g.id ? '#C96A3A' : '#E8DDD2',
                  backgroundColor: data.property_goal === g.id ? 'rgba(201,106,58,0.05)' : '#FFFFFF',
                }}>
                <span className="text-3xl">{g.emoji}</span>
                <span className="text-xs font-semibold text-center" style={{ color:'#1A1210' }}>{g.label}</span>
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Preferences',
      valid: () => !!data.budget_max,
      content: (
        <div className="space-y-5">
          <div>
            <h2 className="font-display font-black text-2xl" style={{ color:'#1A1210' }}>Your preferences 📍</h2>
            <p className="text-sm mt-1" style={{ color:'#8A7E78' }}>Tell us what you're looking for.</p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:'rgba(26,18,16,0.5)' }}>Preferred States</label>
            <div className="flex flex-wrap gap-2">
              {STATES.map(s => (
                <button key={s} onClick={() => toggleArr('preferred_states', s)}
                  className="px-3 py-2 rounded-full text-xs font-medium border-2 transition-all"
                  style={{
                    borderColor:     data.preferred_states.includes(s) ? '#C96A3A' : '#E8DDD2',
                    backgroundColor: data.preferred_states.includes(s) ? '#C96A3A' : '#FFFFFF',
                    color:           data.preferred_states.includes(s) ? '#FFFFFF'  : '#5C4A3A',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:'rgba(26,18,16,0.5)' }}>Property Types</label>
            <div className="flex flex-wrap gap-2">
              {PROP_TYPES.map(t => (
                <button key={t} onClick={() => toggleArr('property_types', t)}
                  className="px-3 py-2 rounded-full text-xs font-medium border-2 transition-all"
                  style={{
                    borderColor:     data.property_types.includes(t) ? '#7A9E7E' : '#E8DDD2',
                    backgroundColor: data.property_types.includes(t) ? '#7A9E7E' : '#FFFFFF',
                    color:           data.property_types.includes(t) ? '#FFFFFF'  : '#5C4A3A',
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:'rgba(26,18,16,0.5)' }}>Min Budget (₦)</label>
              <input type="number" className="input text-sm" placeholder="e.g. 5000000"
                value={data.budget_min} onChange={e => set('budget_min', e.target.value)}
                style={{ backgroundColor:'#FFFFFF', color:'#1A1210' }} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:'rgba(26,18,16,0.5)' }}>Max Budget (₦) *</label>
              <input type="number" className="input text-sm" placeholder="e.g. 50000000"
                value={data.budget_max} onChange={e => set('budget_max', e.target.value)}
                style={{ backgroundColor:'#FFFFFF', color:'#1A1210' }} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Your details',
      valid: () => !!data.full_name,
      content: (
        <div className="space-y-4">
          <div>
            <h2 className="font-display font-black text-2xl" style={{ color:'#1A1210' }}>Almost done! 🎉</h2>
            <p className="text-sm mt-1" style={{ color:'#8A7E78' }}>A few final details for your profile.</p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:'rgba(26,18,16,0.5)' }}>Full Name *</label>
            <input type="text" className="input" placeholder="Your full name"
              value={data.full_name} onChange={e => set('full_name', e.target.value)}
              style={{ backgroundColor:'#FFFFFF', color:'#1A1210' }} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:'rgba(26,18,16,0.5)' }}>WhatsApp Phone</label>
            <input type="tel" className="input" placeholder="+234 800 000 0000"
              value={data.phone} onChange={e => set('phone', e.target.value)}
              style={{ backgroundColor:'#FFFFFF', color:'#1A1210' }} />
          </div>
          <div className="flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all"
            style={{
              borderColor:     data.needs_financing ? '#C96A3A' : '#E8DDD2',
              backgroundColor: data.needs_financing ? 'rgba(201,106,58,0.05)' : '#FFFFFF',
            }}
            onClick={() => set('needs_financing', !data.needs_financing)}>
            <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                borderColor:     data.needs_financing ? '#C96A3A' : '#E8DDD2',
                backgroundColor: data.needs_financing ? '#C96A3A' : '#FFFFFF',
              }}>
              {data.needs_financing && <Check size={10} color="white" />}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color:'#1A1210' }}>I need mortgage financing</p>
              <p className="text-xs" style={{ color:'#8A7E78' }}>We'll match you with lenders</p>
            </div>
          </div>
        </div>
      ),
    },
  ]

  const current = steps[step]
  const isLast  = step === steps.length - 1

  const handleNext = async () => {
    if (!current.valid()) { toast.error('Please complete this step'); return }
    if (!isLast) { setStep(s => s + 1); return }

    if (!user?.id) { toast.error('Not signed in'); return }
    setSaving(true)

    try {
      // ✅ FIX: single upsert call — avoids AbortError "Lock broken by steal" race condition
      // Previous code called completeOnboarding() which internally called supabase twice
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id:                 user.id,
          role:               data.role,
          full_name:          data.full_name,
          phone:              data.phone,
          property_goal:      data.property_goal,
          preferred_states:   data.preferred_states,
          property_types:     data.property_types,
          budget_min:         data.budget_min  ? Number(data.budget_min)  : null,
          budget_max:         data.budget_max  ? Number(data.budget_max)  : null,
          needs_financing:    data.needs_financing,
          onboarding_completed: true,
          updated_at:         new Date().toISOString(),
        }, { onConflict: 'id' })

      if (error) throw error

      analytics.onboardingDone({ role: data.role, goal: data.property_goal })
      await refreshProfile()
      navigate('/browse')
    } catch (err) {
      console.error('Onboarding save error:', err)
      toast.error('Could not save: ' + (err.message || 'Please try again'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor:'#FFFAF5' }}>
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs mb-3" style={{ color:'#8A7E78' }}>
            <span>Step {step + 1} of {steps.length}</span>
            <span>{current.title}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor:'rgba(26,18,16,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width:`${((step + 1) / steps.length) * 100}%`, backgroundColor:'#C96A3A' }} />
          </div>
        </div>

        {current.content}

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} disabled={saving}
              className="px-5 py-4 rounded-2xl text-sm font-semibold border"
              style={{ borderColor:'#E8DDD2', color:'#8A7E78', backgroundColor:'#FFFFFF' }}>
              ←
            </button>
          )}
          <button onClick={handleNext} disabled={saving || !current.valid()}
            className="btn-primary flex-1 py-4 flex items-center justify-center gap-2"
            style={{ opacity: current.valid() ? 1 : 0.5 }}>
            {saving ? 'Saving...' : isLast ? 'Start Matching 🎉' : <>Next <ArrowRight size={15} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}
