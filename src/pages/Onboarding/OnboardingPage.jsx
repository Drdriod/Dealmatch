import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { analytics } from '@/lib/posthog'
import toast from 'react-hot-toast'

// ── Blueprint: removed 'agent' as selectable role
const ROLES = [
  { id:'buyer',    emoji:'🏠', label:"I want to Buy",    desc:'Looking for a property to purchase.' },
  { id:'seller',   emoji:'💼', label:"I want to Sell",   desc:'I have a property to list and sell.' },
  { id:'renter',   emoji:'🔑', label:"I want to Rent",   desc:'Looking for a rental property.' },
  { id:'landlord', emoji:'🏘️', label:"I'm a Landlord",  desc:'I have rental or hotel properties to list.' },
  { id:'investor', emoji:'📈', label:"I'm an Investor",  desc:'I buy properties for investment returns.' },
]

// ── Goals aligned per remaining role ─────────────────────────
const GOALS_BY_ROLE = {
  buyer:    [
    { id:'buy_home',      label:'Buy a Home',          emoji:'🏡' },
    { id:'buy_land',      label:'Buy Land',             emoji:'🌿' },
    { id:'investment',    label:'Property Investment',  emoji:'📈' },
    { id:'commercial',    label:'Commercial Property',  emoji:'🏬' },
  ],
  renter:   [
    { id:'short_term',    label:'Short-term Stay',      emoji:'🛎️' },
    { id:'long_term',     label:'Long-term Rental',     emoji:'🔑' },
    { id:'hotel',         label:'Hotel / Lodging',      emoji:'🏨' },
  ],
  seller:   [
    { id:'sell_property', label:'Sell My Property',     emoji:'💰' },
    { id:'joint_venture', label:'Joint Venture',         emoji:'🤝' },
    { id:'off_plan',      label:'Off-Plan Sale',         emoji:'🏗️' },
  ],
  landlord: [
    { id:'rental_income', label:'Rental Income',         emoji:'💰' },
    { id:'hotel_income',  label:'Hotel / Short-let',     emoji:'🏨' },
    { id:'both',          label:'Both Rental & Hotel',   emoji:'🏘️' },
  ],
  investor: [
    { id:'buy_land',      label:'Land Banking',          emoji:'🌿' },
    { id:'investment',    label:'Capital Appreciation',  emoji:'📈' },
    { id:'rental_income', label:'Rental Income',         emoji:'💰' },
    { id:'development',   label:'Property Development',  emoji:'🏗️' },
  ],
}

const ALL_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe', 
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
]

const PROP_TYPES  = ['Land','Apartment','Duplex','Detached House','Terrace','Commercial','Hotel','Short-let']

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step,   setStep]   = useState(0)
  const [saving, setSaving] = useState(false)
  const [data,   setData]   = useState({
    role:'', property_goal:'', preferred_states:[],
    property_types:[], budget_min:'', budget_max:'',
    needs_financing:false, full_name:'', phone:'',
    referral_code: '',
  })

  const set       = (k, v) => setData(d => ({ ...d, [k]: v }))
  const toggleArr = (k, v) => setData(d => ({
    ...d, [k]: d[k].includes(v) ? d[k].filter(x => x !== v) : [...d[k], v]
  }))

  const goalsForRole = GOALS_BY_ROLE[data.role] || []

  const steps = [
    // Step 1: Role
    {
      title: "What's your role?",
      valid: () => !!data.role,
      content: (
        <div className="space-y-3">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">👋</div>
            <h2 className="font-display font-black text-2xl" style={{ color:'#1A1210' }}>Welcome to DealMatch!</h2>
            <p className="text-sm mt-1" style={{ color:'#8A7E78' }}>Tell us how you'll be using the platform.</p>
          </div>
          {ROLES.map(r => (
            <button key={r.id} onClick={() => { set('role', r.id); set('property_goal', '') }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all"
              style={{ borderColor: data.role === r.id ? '#C96A3A' : '#E8DDD2', backgroundColor: data.role === r.id ? 'rgba(201,106,58,0.05)' : '#FFFFFF' }}>
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
    // Step 2: Goal (aligned to role)
    {
      title: 'Your goal',
      valid: () => !!data.property_goal,
      content: (
        <div>
          <div className="mb-5">
            <h2 className="font-display font-black text-2xl" style={{ color:'#1A1210' }}>What's your goal? 🎯</h2>
            <p className="text-sm mt-1" style={{ color:'#8A7E78' }}>This helps us match you with the right properties.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {goalsForRole.map(g => (
              <button key={g.id} onClick={() => set('property_goal', g.id)}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all"
                style={{ borderColor: data.property_goal === g.id ? '#C96A3A' : '#E8DDD2', backgroundColor: data.property_goal === g.id ? 'rgba(201,106,58,0.05)' : '#FFFFFF' }}>
                <span className="text-3xl">{g.emoji}</span>
                <span className="text-xs font-semibold text-center" style={{ color:'#1A1210' }}>{g.label}</span>
                {data.property_goal === g.id && <Check size={12} style={{ color:'#C96A3A' }} />}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    // Step 3: Preferences (Unique per role)
    {
      title: 'Preferences',
      valid: () => {
        if (data.role === 'buyer' || data.role === 'renter' || data.role === 'investor') return !!data.budget_max;
        if (data.role === 'landlord' || data.role === 'seller') return data.preferred_states.length > 0;
        return true;
      },
      content: (
        <div className="space-y-5">
          <div>
            <h2 className="font-display font-black text-2xl" style={{ color:'#1A1210' }}>
              {data.role === 'landlord' || data.role === 'seller' ? 'Listing Preferences 📍' : 'Your preferences 📍'}
            </h2>
            <p className="text-sm mt-1" style={{ color:'#8A7E78' }}>
              {data.role === 'landlord' || data.role === 'seller' 
                ? 'Tell us where your properties are located.' 
                : 'Tell us where and what you\'re looking for.'}
            </p>
          </div>
          
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:'rgba(26,18,16,0.5)' }}>
              {data.role === 'landlord' || data.role === 'seller' ? 'Primary States of Operation' : 'Preferred States'}
            </label>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 border rounded-xl" style={{ borderColor: '#E8DDD2' }}>
              {ALL_STATES.map(s => (
                <button key={s} onClick={() => toggleArr('preferred_states', s)}
                  className="px-3 py-2 rounded-full text-xs font-medium border-2 transition-all"
                  style={{ borderColor: data.preferred_states.includes(s) ? '#C96A3A' : '#E8DDD2', backgroundColor: data.preferred_states.includes(s) ? '#C96A3A' : '#FFFFFF', color: data.preferred_states.includes(s) ? '#FFFFFF' : '#5C4A3A' }}>
                  {s}
                </button>
              ))}
            </div>
            <p className="text-[10px] mt-2" style={{ color:'#8A7E78' }}>You can select multiple states.</p>
          </div>

          {(data.role === 'buyer' || data.role === 'renter' || data.role === 'investor') && (
            <>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:'rgba(26,18,16,0.5)' }}>Property Types</label>
                <div className="flex flex-wrap gap-2">
                  {PROP_TYPES.map(t => (
                    <button key={t} onClick={() => toggleArr('property_types', t)}
                      className="px-3 py-2 rounded-full text-xs font-medium border-2 transition-all"
                      style={{ borderColor: data.property_types.includes(t) ? '#7A9E7E' : '#E8DDD2', backgroundColor: data.property_types.includes(t) ? '#7A9E7E' : '#FFFFFF', color: data.property_types.includes(t) ? '#FFFFFF' : '#5C4A3A' }}>
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
              
              {/* Mortgage financing option - only show for buyer/investor and specific goals */}
              {(data.role === 'buyer' || data.role === 'investor') && 
               (data.property_goal === 'buy_home' || data.property_goal === 'commercial' || data.property_goal === 'investment') && (
                <div className="flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all"
                  style={{ borderColor: data.needs_financing ? '#C96A3A' : '#E8DDD2', backgroundColor: data.needs_financing ? 'rgba(201,106,58,0.05)' : '#FFFFFF' }}
                  onClick={() => set('needs_financing', !data.needs_financing)}>
                  <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ borderColor: data.needs_financing ? '#C96A3A' : '#E8DDD2', backgroundColor: data.needs_financing ? '#C96A3A' : '#FFFFFF' }}>
                    {data.needs_financing && <Check size={10} color="white" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color:'#1A1210' }}>I need mortgage financing</p>
                    <p className="text-xs" style={{ color:'#8A7E78' }}>We'll match you with lenders</p>
                  </div>
                </div>
              )}
            </>
          )}

          {(data.role === 'landlord' || data.role === 'seller') && (
            <div className="space-y-4">
              <div className="rounded-2xl p-4 border" style={{ backgroundColor:'rgba(122,158,126,0.06)', borderColor:'rgba(122,158,126,0.25)' }}>
                <p className="text-sm font-semibold mb-1" style={{ color:'#5C8060' }}>✅ Listing Focus</p>
                <p className="text-xs" style={{ color:'#8A7E78' }}>As a {data.role}, we'll prioritize showing your listings to buyers in your primary states.</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:'rgba(26,18,16,0.5)' }}>Typical Property Types You Handle</label>
                <div className="flex flex-wrap gap-2">
                  {PROP_TYPES.map(t => (
                    <button key={t} onClick={() => toggleArr('property_types', t)}
                      className="px-3 py-2 rounded-full text-xs font-medium border-2 transition-all"
                      style={{ borderColor: data.property_types.includes(t) ? '#7A9E7E' : '#E8DDD2', backgroundColor: data.property_types.includes(t) ? '#7A9E7E' : '#FFFFFF', color: data.property_types.includes(t) ? '#FFFFFF' : '#5C4A3A' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ),
    },
    // Step 4: Personal details (FIXED: saves correctly before proceeding)
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
          {/* Verification notice */}
          <div className="rounded-2xl p-4 border-2" style={{ backgroundColor:'rgba(212,168,83,0.06)', borderColor:'rgba(212,168,83,0.3)' }}>
            <p className="text-sm font-semibold mb-1" style={{ color:'#1A1210' }}>🔐 Next: Identity Verification</p>
            <p className="text-xs leading-relaxed" style={{ color:'#8A7E78' }}>
              After setup, you'll be asked to upload a valid ID and complete a live face check. This keeps DealMatch scam-free and unlocks buying, selling, and listing features.
            </p>
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
    if (!data.phone) { toast.error('Phone number is required'); return }
    
    setSaving(true)

    try {
      // Check for duplicate phone number
      const { data: existingPhone } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', data.phone)
        .neq('id', user.id)
        .maybeSingle()
      
      if (existingPhone) {
        toast.error('This phone number is already registered with another account')
        setSaving(false)
        return
      }

      // ── Blueprint: Step 4 always saves correctly before proceeding ──
      const payload = {
        id:                   user.id,
        role:                 data.role,
        full_name:            data.full_name,
        phone:                data.phone || null,
        property_goal:        data.property_goal,
        preferred_states:     data.preferred_states,
        property_types:       data.property_types,
        budget_min:           (data.budget_min && data.role !== 'landlord' && data.role !== 'seller') ? Number(data.budget_min) : null,
        budget_max:           (data.budget_max && data.role !== 'landlord' && data.role !== 'seller') ? Number(data.budget_max) : null,
        needs_financing:      data.needs_financing,
        onboarding_completed: true,
        updated_at:           new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })

      if (error) throw error

      analytics.onboardingDone({ role: data.role, goal: data.property_goal })
      await refreshProfile()
      // ── Blueprint: redirect to post-onboarding verification ──
      navigate('/verify-identity')
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
            {saving ? 'Saving...' : isLast ? 'Complete Setup 🎉' : <>Next <ArrowRight size={15} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}
