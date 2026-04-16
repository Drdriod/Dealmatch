import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Users, TrendingUp, DollarSign, Briefcase, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { initializePaystackPayment, PROFESSIONAL_PLANS, generateReference } from '@/lib/paystack'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const WHATSAPP = '2347057392060'

const PROS = [
  { id:'agent',       emoji:'🏘️', title:'Real Estate Agent',    desc:'Represent buyers & sellers. Get matched on every deal in your area.', monthly:15_000,  annual:144_000  },
  { id:'surveyor',    emoji:'📐', title:'Land Surveyor',         desc:'Get matched with land transactions needing your expertise.', monthly:25_000, annual:240_000 },
  { id:'inspector',   emoji:'🔍', title:'Property Inspector',    desc:'Receive inspection requests on matched properties.', monthly:35_000, annual:336_000 },
  { id:'valuer',      emoji:'📊', title:'Property Valuer',       desc:'Provide valuations for sale and mortgage deals.', monthly:30_000, annual:288_000 },
  { id:'lawyer',      emoji:'⚖️', title:'Real Estate Lawyer',    desc:'Review deeds, C of O transfers, and agreements.', monthly:45_000, annual:432_000 },
  { id:'lender',      emoji:'🏦', title:'Mortgage Lender',       desc:'Connect with pre-qualified buyers seeking financing.', monthly:75_000, annual:720_000 },
  { id:'architect',   emoji:'🏗️', title:'Architect / Designer',  desc:'Get hired for renovations and new builds.', monthly:30_000, annual:288_000 },
  { id:'contractor',  emoji:'🔨', title:'Building Contractor',   desc:'Match with property owners needing construction.', monthly:25_000, annual:240_000 },
]

// ─── AMG Partnership section ───────────────────────────────
function AMGSection() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', phone:'', email:'', city:'' })
  const [sent, setSent] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleJoin = () => {
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return }
    const msg = encodeURIComponent(
      `💼 *AMG Partnership Enquiry — DealMatch*\n\n` +
      `Name: ${form.name}\nPhone: ${form.phone}\n` +
      (form.email ? `Email: ${form.email}\n` : '') +
      (form.city  ? `City: ${form.city}\n`   : '') +
      `\nI'm interested in the AMG business partnership opportunity on DealMatch.`
    )
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank')
    setSent(true)
    setShowForm(false)
    toast.success('Your interest has been sent! Divine will reach out.')
  }

  return (
    <div className="rounded-3xl overflow-hidden mb-8" style={{ backgroundColor:'#1A1210' }}>
      <div className="p-6 relative">
        <div className="absolute inset-0 opacity-10"
          style={{ background:'radial-gradient(ellipse at 80% 20%, #D4A853 0%, transparent 60%)' }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ backgroundColor:'rgba(212,168,83,0.2)' }}>🤝</div>
            <div>
              <h3 className="font-display font-black text-xl" style={{ color:'#FFFFFF' }}>AMG Business Partnership</h3>
              <p className="text-xs" style={{ color:'rgba(255,255,255,0.45)' }}>Passive network income opportunity</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed mb-5" style={{ color:'rgba(255,255,255,0.6)' }}>
            Partner with DealMatch as an AMG network affiliate. Refer property deals, professionals, and users — earn passive commissions on every transaction within your network. Build a real estate income stream without owning property.
          </p>

          {/* AMG Benefits */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { icon:'💰', label:'₦2,000', desc:'Per professional referred' },
              { icon:'🏡', label:'0.5%',   desc:'On every deal your network closes' },
              { icon:'👤', label:'₦500',   desc:'Per new user signup' },
              { icon:'📈', label:'Passive', desc:'Income while you sleep' },
            ].map(b => (
              <div key={b.label} className="rounded-2xl p-3 text-center"
                style={{ backgroundColor:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-xl mb-1">{b.icon}</div>
                <p className="font-black text-base" style={{ color:'#D4A853' }}>{b.label}</p>
                <p className="text-[10px]" style={{ color:'rgba(255,255,255,0.35)' }}>{b.desc}</p>
              </div>
            ))}
          </div>

          {!showForm ? (
            <button onClick={() => setShowForm(true)}
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor:'#D4A853', color:'#1A1210' }}>
              Join AMG Partnership <ArrowRight size={15} />
            </button>
          ) : (
            <div className="space-y-3">
              {[
                { label:'Your Name *',  key:'name',  type:'text',  placeholder:'Full name' },
                { label:'Phone *',      key:'phone', type:'tel',   placeholder:'+234 800 000 0000' },
                { label:'Email',        key:'email', type:'email', placeholder:'Optional' },
                { label:'City',         key:'city',  type:'text',  placeholder:'Your city' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-bold mb-1 block" style={{ color:'rgba(255,255,255,0.45)' }}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder}
                    className="input text-sm" style={{ backgroundColor:'rgba(255,255,255,0.08)', color:'#FFFFFF', borderColor:'rgba(255,255,255,0.15)' }} />
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)' }}>
                  Cancel
                </button>
                <button onClick={handleJoin} disabled={!form.name || !form.phone}
                  className="flex-1 py-3 rounded-xl text-sm font-bold"
                  style={{ backgroundColor:'#D4A853', color:'#1A1210', opacity: (!form.name || !form.phone) ? 0.6 : 1 }}>
                  Send via WhatsApp →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EarnPage() {
  const { user, profile } = useAuth()
  const [applying,   setApplying]   = useState(null)
  const [form, setForm] = useState({ full_name:'', phone:'', company:'', license_no:'', years_exp:'', coverage_areas:'', bio:'', plan:'monthly' })
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const pro = PROS.find(p => p.id === applying)

  const handleApply = async () => {
    if (!form.full_name || !form.phone) { toast.error('Name and phone required'); return }
    if (!user?.email)                   { toast.error('Please sign in first'); return }
    setSubmitting(true)
    const amount = form.plan === 'annual' ? pro.annual : pro.monthly
    await initializePaystackPayment({
      email: user.email, amount,
      reference: generateReference(),
      metadata: { type:'professional_subscription', professional_id: applying, plan_type: form.plan, full_name: form.full_name, phone: form.phone },
      onSuccess: async response => {
        await supabase.from('professional_applications').insert({
          user_id: user.id, type: applying, full_name: form.full_name,
          company: form.company, phone: form.phone, email: user.email,
          license_no: form.license_no, years_exp: Number(form.years_exp) || 0,
          coverage_areas: form.coverage_areas, bio: form.bio,
          monthly_fee: pro.monthly, status:'pending_payment',
        })
        setSubmitting(false); setDone(true); setApplying(null)
      },
      onClose: () => setSubmitting(false),
    })
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor:'#FFFAF5' }}>
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-5">🎉</div>
        <h1 className="font-display font-black text-2xl mb-2" style={{ color:'#1A1210' }}>Application Submitted!</h1>
        <p className="text-sm mb-8" style={{ color:'#8A7E78' }}>We'll activate your professional listing within 24 hours. You'll get a WhatsApp notification once live.</p>
        <Link to="/dashboard" className="btn-primary w-full py-4 inline-flex justify-center">Go to Dashboard →</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ backgroundColor:'#F5EDE0' }}>
      <div className="max-w-2xl mx-auto px-4">

        {/* Hero */}
        <div className="rounded-3xl p-7 mb-8 text-center relative overflow-hidden" style={{ backgroundColor:'#1A1210' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background:'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(212,168,83,0.25) 0%, transparent 70%)' }} />
          <div className="relative">
            <h1 className="font-display font-black text-3xl text-white mb-2">Earn on DealMatch 💰</h1>
            <p className="text-sm leading-relaxed mb-6" style={{ color:'rgba(255,255,255,0.55)' }}>
              Three ways to earn: become a verified professional, join the AMG partnership programme, or refer buyers and sellers for passive income.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[['👤','New User','₦500'],['💼','Pro Sub','₦2,000'],['🏡','Deal Close','0.5%']].map(([icon, label, val]) => (
                <div key={label}>
                  <p className="text-xl mb-1">{icon}</p>
                  <p className="font-black text-sm" style={{ color:'#D4A853' }}>{val}</p>
                  <p className="text-xs" style={{ color:'rgba(255,255,255,0.35)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AMG Partnership — from README */}
        <AMGSection />

        {/* Referral shortcut */}
        <div className="rounded-2xl p-5 border mb-8 flex items-center justify-between"
          style={{ backgroundColor:'#FFFAF5', borderColor:'#E8DDD2' }}>
          <div>
            <h3 className="font-display font-black text-base" style={{ color:'#1A1210' }}>Your Referral Link 🔗</h3>
            <p className="text-xs mt-0.5" style={{ color:'#8A7E78' }}>Share and earn on every signup + deal</p>
          </div>
          <Link to="/dashboard" className="btn-primary px-5 py-2.5 text-xs whitespace-nowrap">Get Link →</Link>
        </div>

        {/* Professional categories */}
        <h2 className="font-display font-black text-xl mb-4" style={{ color:'#1A1210' }}>Professional Listings</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {PROS.map(p => (
            <motion.div key={p.id} whileHover={{ y:-2 }} onClick={() => setApplying(p.id)}
              className="rounded-2xl border p-5 cursor-pointer transition-all"
              style={{ backgroundColor:'#FFFAF5', borderColor:'#E8DDD2' }}>
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{p.emoji}</span>
                <div>
                  <h3 className="font-display font-black text-base" style={{ color:'#1A1210' }}>{p.title}</h3>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color:'#8A7E78' }}>{p.desc}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor:'#E8DDD2' }}>
                <p className="font-black text-base" style={{ color:'#C96A3A' }}>₦{p.monthly.toLocaleString()}<span className="text-xs font-normal">/mo</span></p>
                <span className="text-xs font-semibold flex items-center gap-1" style={{ color:'#C96A3A' }}>Apply <ArrowRight size={12} /></span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Apply Modal */}
      <AnimatePresence>
        {applying && pro && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
            style={{ backgroundColor:'rgba(26,18,16,0.85)', backdropFilter:'blur(8px)' }}
            onClick={e => e.target === e.currentTarget && setApplying(null)}>
            <motion.div initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }}
              className="w-full max-w-md rounded-3xl overflow-hidden flex flex-col"
              style={{ backgroundColor:'#FFFAF5', maxHeight:'90vh' }}>
              <div className="p-5 border-b flex items-center gap-3" style={{ borderColor:'#E8DDD2' }}>
                <span className="text-3xl">{pro.emoji}</span>
                <div className="flex-1">
                  <h3 className="font-display font-black text-lg" style={{ color:'#1A1210' }}>Apply as {pro.title}</h3>
                  <p className="text-xs" style={{ color:'#8A7E78' }}>₦{pro.monthly.toLocaleString()}/mo · ₦{pro.annual.toLocaleString()}/yr</p>
                </div>
                <button onClick={() => setApplying(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor:'rgba(26,18,16,0.08)', color:'#5C4A3A' }}>✕</button>
              </div>
              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                {[
                  { label:'Full Name *',  key:'full_name',      type:'text',   placeholder:'Your full name' },
                  { label:'Phone *',      key:'phone',          type:'tel',    placeholder:'+234 800 000 0000' },
                  { label:'Company',      key:'company',        type:'text',   placeholder:'Company / firm (optional)' },
                  { label:'License No.',  key:'license_no',     type:'text',   placeholder:'Professional license number' },
                  { label:'Years Exp',    key:'years_exp',      type:'number', placeholder:'5' },
                  { label:'Coverage Areas', key:'coverage_areas', type:'text', placeholder:'e.g. Lagos, Akwa Ibom' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'rgba(26,18,16,0.5)' }}>{f.label}</label>
                    <input type={f.type} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder}
                      className="input text-sm" style={{ backgroundColor:'#FFFFFF', color:'#1A1210' }} />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'rgba(26,18,16,0.5)' }}>Short Bio</label>
                  <textarea value={form.bio} onChange={set('bio')} placeholder="Brief description of your expertise..." rows={3}
                    className="input resize-none text-sm" style={{ backgroundColor:'#FFFFFF', color:'#1A1210' }} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:'rgba(26,18,16,0.5)' }}>Plan</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[['monthly',`Monthly — ₦${pro.monthly.toLocaleString()}`],['annual',`Annual — ₦${pro.annual.toLocaleString()}`]].map(([v,l]) => (
                      <button key={v} type="button" onClick={() => setForm(f => ({ ...f, plan:v }))}
                        className="py-3 rounded-xl text-sm font-semibold border-2 transition-all"
                        style={{ borderColor: form.plan === v ? '#C96A3A' : '#E8DDD2', color: form.plan === v ? '#C96A3A' : '#8A7E78', backgroundColor: form.plan === v ? 'rgba(201,106,58,0.05)' : '#FFFFFF' }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleApply} disabled={submitting || !form.full_name || !form.phone}
                  className="btn-primary w-full py-4"
                  style={{ opacity: (!form.full_name || !form.phone) ? 0.5 : 1 }}>
                  {submitting ? 'Processing...' : `Pay ₦${(form.plan === 'annual' ? pro.annual : pro.monthly).toLocaleString()} & Apply →`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
