import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, Calculator, Shield, Home, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const WHATSAPP = '2347057392060'

const LENDERS = [
  { id:'l1', name:'First Bank Mortgage',    rate:'18%–22%', max:'₦50M',  term:'15yr', logo:'🏦', badge:'Popular',   color:'#1A4FA0' },
  { id:'l2', name:'Access Bank Home Loans', rate:'19%–23%', max:'₦30M',  term:'20yr', logo:'🏦', badge:'Fast',      color:'#E31E25' },
  { id:'l3', name:'GTBank Mortgage',        rate:'17%–21%', max:'₦100M', term:'25yr', logo:'🏦', badge:'High Limit', color:'#F58220' },
  { id:'l4', name:'NHF (Federal Housing)',  rate:'6%',      max:'₦15M',  term:'30yr', logo:'🏛️', badge:'Lowest Rate',color:'#006633' },
  { id:'l5', name:'FMBN Home Loans',        rate:'6%–9%',   max:'₦15M',  term:'30yr', logo:'🏛️', badge:'Govt Backed',color:'#006633' },
  { id:'l6', name:'Stanbic IBTC Mortgage',  rate:'20%–24%', max:'₦150M', term:'20yr', logo:'🏦', badge:'Premium',   color:'#009FD9' },
]

const FAQS = [
  { q:'What is a mortgage?', a:'A mortgage is a loan to buy property. You pay back over 10–30 years with interest. The property is collateral — if you stop paying, the lender can reclaim it. DealMatch connects you with licensed Nigerian lenders who offer competitive rates.' },
  { q:'How much can I borrow?', a:'Typically up to 60–80% of the property value (Loan-to-Value ratio). So for a ₦20M property, you can borrow ₦12M–₦16M. Your income, employer, and credit history affect the exact amount.' },
  { q:'What documents do I need?', a:'Utility bill/proof of address, 6 months bank statements, employment letter + 3 months payslips (or 2 years accounts if self-employed), valid ID, and a Certificate of Occupancy on the property.' },
  { q:'What is the NHF scheme?', a:'The National Housing Fund is a government programme with rates as low as 6%. Any Nigerian worker contributing to NHF for at least 6 months can qualify for loans up to ₦15M. DealMatch can connect you directly with FMBN-accredited lenders.' },
  { q:'How long does approval take?', a:'Typically 2–8 weeks from application to disbursement. DealMatch lenders on our platform pre-qualify you first — this cuts the process to as little as 5 business days.' },
]

// ─── Calculator ──────────────────────────────────────────────
function MortgageCalculator() {
  const [form, setForm] = useState({ price: '20000000', down: '20', rate: '20', term: '15' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const propertyValue = Number(form.price)       || 0
  const downPercent   = Number(form.down)         || 20
  const annualRate    = Number(form.rate)         || 20
  const termYears     = Number(form.term)         || 15

  const downAmount    = propertyValue * (downPercent / 100)
  const loanAmount    = propertyValue - downAmount
  const monthlyRate   = annualRate / 100 / 12
  const numPayments   = termYears * 12
  const monthlyPay    = loanAmount > 0 && monthlyRate > 0
    ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
    : 0
  const totalCost     = monthlyPay * numPayments
  const totalInterest = totalCost - loanAmount

  const fmt = (n) => n ? `₦${Math.round(n).toLocaleString()}` : '₦0'

  return (
    <div className="rounded-3xl overflow-hidden border" style={{ backgroundColor:'#FFFAF5', borderColor:'#E8DDD2' }}>
      <div className="p-5 border-b flex items-center gap-3" style={{ borderColor:'#E8DDD2', backgroundColor:'#1A1210' }}>
        <Calculator size={20} style={{ color:'#C96A3A' }} />
        <h3 className="font-display font-black text-lg text-white">Mortgage Calculator</h3>
      </div>
      <div className="p-5 grid md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          {[
            { label:'Property Value (₦)', key:'price', placeholder:'20000000', type:'number' },
            { label:'Down Payment (%)',   key:'down',  placeholder:'20',       type:'number' },
            { label:'Annual Rate (%)',    key:'rate',  placeholder:'20',       type:'number' },
            { label:'Loan Term (years)',  key:'term',  placeholder:'15',       type:'number' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'rgba(26,18,16,0.5)' }}>{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder}
                className="input text-sm" style={{ backgroundColor:'#FFFFFF', color:'#1A1210' }} />
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl p-4 text-center" style={{ backgroundColor:'#1A1210' }}>
            <p className="text-xs mb-1" style={{ color:'rgba(255,255,255,0.4)' }}>Monthly Payment</p>
            <p className="font-display font-black text-3xl" style={{ color:'#C96A3A' }}>{fmt(monthlyPay)}</p>
            <p className="text-xs mt-1" style={{ color:'rgba(255,255,255,0.3)' }}>per month for {termYears} years</p>
          </div>
          {[
            { label:'Loan Amount',     value: fmt(loanAmount) },
            { label:'Down Payment',    value: fmt(downAmount) },
            { label:'Total Interest',  value: fmt(totalInterest) },
            { label:'Total Cost',      value: fmt(totalCost) },
          ].map(r => (
            <div key={r.label} className="flex justify-between items-center px-3 py-2 rounded-xl"
              style={{ backgroundColor:'rgba(26,18,16,0.04)' }}>
              <span className="text-xs" style={{ color:'#8A7E78' }}>{r.label}</span>
              <span className="text-sm font-bold" style={{ color:'#1A1210' }}>{r.value}</span>
            </div>
          ))}
          <p className="text-[10px] text-center mt-1" style={{ color:'#8A7E78' }}>
            *Estimates only. Final rates depend on your lender and profile.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Application Form ────────────────────────────────────────
function ApplicationForm({ lender, onClose }) {
  const { user, profile } = useAuth()
  const [form, setForm] = useState({
    full_name:       profile?.full_name || '',
    phone:           profile?.phone     || '',
    email:           user?.email        || '',
    monthly_income:  '',
    employment_type: 'employed',
    property_value:  '',
    down_payment:    '',
    loan_term_years: '15',
    property_type:   '',
    property_state:  '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const loanNeeded   = form.property_value && form.down_payment ? Number(form.property_value) - Number(form.down_payment) : null
  const affordability = form.monthly_income ? Number(form.monthly_income) * 0.33 : null

  const handleSubmit = async () => {
    if (!form.full_name || !form.phone || !form.property_value) {
      toast.error('Please fill all required fields'); return
    }
    setSubmitting(true)
    try {
      await supabase.from('mortgage_applications').insert({
        user_id:          user?.id || null,
        full_name:        form.full_name,
        phone:            form.phone,
        email:            form.email,
        monthly_income:   Number(form.monthly_income) || null,
        employment_type:  form.employment_type,
        property_value:   Number(form.property_value) || null,
        down_payment:     Number(form.down_payment)   || null,
        loan_term_years:  Number(form.loan_term_years),
        property_type:    form.property_type,
        property_state:   form.property_state,
        lender_id:        lender?.id || null,
        status:           'pending',
      })

      // Notify via WhatsApp
      const msg = encodeURIComponent(
        `🏠 *Mortgage Application — DealMatch*\n\n` +
        `Applicant: ${form.full_name}\nPhone: ${form.phone}\n` +
        (form.email ? `Email: ${form.email}\n` : '') +
        `Lender Preferred: ${lender?.name || 'Any'}\n` +
        `Property Value: ₦${Number(form.property_value).toLocaleString()}\n` +
        (form.down_payment ? `Down Payment: ₦${Number(form.down_payment).toLocaleString()}\n` : '') +
        `Employment: ${form.employment_type}\n` +
        (form.monthly_income ? `Monthly Income: ₦${Number(form.monthly_income).toLocaleString()}\n` : '') +
        `Term: ${form.loan_term_years} years\n` +
        `State: ${form.property_state || 'Not specified'}`
      )
      window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank')
      setSubmitted(true)
    } catch (err) {
      toast.error('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ backgroundColor:'rgba(26,18,16,0.88)', backdropFilter:'blur(10px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }}
        className="w-full max-w-md rounded-3xl overflow-hidden flex flex-col"
        style={{ backgroundColor:'#FFFAF5', maxHeight:'92vh' }}>

        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor:'#E8DDD2' }}>
          <div>
            <h3 className="font-display font-black text-lg" style={{ color:'#1A1210' }}>
              Apply: {lender?.name || 'Mortgage Application'}
            </h3>
            {lender && <p className="text-xs mt-0.5" style={{ color:'#C96A3A' }}>{lender.rate} · Up to {lender.max}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor:'rgba(26,18,16,0.08)' }}>✕</button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🏠</div>
            <h3 className="font-display font-black text-xl mb-2" style={{ color:'#1A1210' }}>Application Submitted!</h3>
            <p className="text-sm mb-6" style={{ color:'#8A7E78' }}>
              DealMatch will connect you with a verified lender within 24 hours. You'll be contacted at <strong>{form.phone}</strong>.
            </p>
            <button onClick={onClose} className="btn-primary w-full py-3">Done ✓</button>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            {[
              { label:'Full Name *',    key:'full_name',     type:'text',   placeholder:'Your full name' },
              { label:'Phone *',        key:'phone',         type:'tel',    placeholder:'+234 800 000 0000' },
              { label:'Email',          key:'email',         type:'email',  placeholder:'For updates' },
              { label:'Monthly Income', key:'monthly_income',type:'number', placeholder:'e.g. 500000' },
              { label:'Property Value (₦) *', key:'property_value', type:'number', placeholder:'e.g. 20000000' },
              { label:'Down Payment (₦)',      key:'down_payment',   type:'number', placeholder:'e.g. 4000000' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'rgba(26,18,16,0.5)' }}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder}
                  className="input text-sm" style={{ backgroundColor:'#FFFFFF', color:'#1A1210' }} />
              </div>
            ))}

            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:'rgba(26,18,16,0.5)' }}>Employment Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[['employed','Employed'],['self_employed','Self-Employed'],['business_owner','Business Owner'],['retired','Retired']].map(([v,l]) => (
                  <button key={v} type="button" onClick={() => setForm(f => ({ ...f, employment_type: v }))}
                    className="py-2.5 rounded-xl text-xs font-semibold border-2 transition-all"
                    style={{ borderColor: form.employment_type === v ? '#C96A3A' : '#E8DDD2', color: form.employment_type === v ? '#C96A3A' : '#8A7E78', backgroundColor: form.employment_type === v ? 'rgba(201,106,58,0.05)' : '#FFFFFF' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'rgba(26,18,16,0.5)' }}>Loan Term</label>
                <select value={form.loan_term_years} onChange={set('loan_term_years')} className="select text-sm"
                  style={{ backgroundColor:'#FFFFFF', color:'#1A1210' }}>
                  {[5,10,15,20,25,30].map(y => <option key={y} value={y}>{y} years</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color:'rgba(26,18,16,0.5)' }}>Property State</label>
                <input type="text" value={form.property_state} onChange={set('property_state')} placeholder="e.g. Lagos"
                  className="input text-sm" style={{ backgroundColor:'#FFFFFF', color:'#1A1210' }} />
              </div>
            </div>

            {/* Affordability preview */}
            {loanNeeded && (
              <div className="rounded-2xl p-3" style={{ backgroundColor:'rgba(201,106,58,0.06)', border:'1px solid rgba(201,106,58,0.2)' }}>
                <p className="text-xs font-bold mb-1" style={{ color:'#C96A3A' }}>Loan Summary</p>
                <div className="text-xs space-y-0.5" style={{ color:'#8A7E78' }}>
                  <div className="flex justify-between"><span>Loan needed</span><strong style={{ color:'#1A1210' }}>₦{Math.round(loanNeeded).toLocaleString()}</strong></div>
                  {affordability && <div className="flex justify-between"><span>Max affordable monthly (33% rule)</span><strong style={{ color:'#7A9E7E' }}>₦{Math.round(affordability).toLocaleString()}</strong></div>}
                </div>
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting || !form.full_name || !form.phone || !form.property_value}
              className="btn-primary w-full py-4"
              style={{ opacity: (!form.full_name || !form.phone || !form.property_value) ? 0.5 : 1 }}>
              {submitting ? 'Submitting...' : 'Submit Application →'}
            </button>
            <p className="text-xs text-center" style={{ color:'#8A7E78' }}>
              A DealMatch agent will contact you within 24 hours to match you with the best lender.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function MortgagePage() {
  const [applyLender, setApplyLender] = useState(null)
  const [openFaq,     setOpenFaq]     = useState(null)
  const [showCalc,    setShowCalc]    = useState(false)

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ backgroundColor:'#FAF6F0' }}>

      {/* Hero */}
      <section className="py-20 px-6 relative overflow-hidden" style={{ backgroundColor:'#1A1210' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background:'radial-gradient(ellipse 60% 80% at 30% 60%, rgba(201,106,58,0.2) 0%, transparent 60%)' }} />
        <div className="max-w-4xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
            style={{ backgroundColor:'rgba(201,106,58,0.15)', color:'#E8C4A0', border:'1px solid rgba(201,106,58,0.3)' }}>
            🏠 Home Ownership Made Easy
          </div>
          <h1 className="font-display font-black leading-tight mb-6" style={{ fontSize:'clamp(2.2rem,5vw,4rem)', color:'#FFFFFF' }}>
            Get a home with a mortgage.<br />
            <span style={{ color:'#C96A3A' }}>DealMatch connects you to the best lenders.</span>
          </h1>
          <p className="text-lg leading-relaxed mb-10 max-w-2xl mx-auto" style={{ color:'rgba(255,255,255,0.55)' }}>
            Stop paying rent forever. DealMatch partners with Nigeria's top mortgage lenders — NHF, commercial banks, and housing funds — to give you a clear path to home ownership. Apply once, we connect you to the right lender.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={() => setApplyLender({ id:'any', name:'Best Available Lender' })}
              className="btn-primary px-8 py-4 text-base flex items-center gap-2">
              Apply for Mortgage <ArrowRight size={16} />
            </button>
            <button onClick={() => setShowCalc(true)}
              className="px-8 py-4 text-base rounded-full font-semibold border-2 flex items-center gap-2"
              style={{ borderColor:'rgba(255,255,255,0.3)', color:'#FFFFFF' }}>
              <Calculator size={16} /> Calculate Payments
            </button>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-14 max-w-2xl mx-auto">
            {[
              { label:'Partner Lenders', value:'6+' },
              { label:'Lowest Rate',     value:'6%' },
              { label:'Max Loan',        value:'₦150M' },
            ].map(s => (
              <div key={s.label}>
                <p className="font-display font-black text-3xl" style={{ color:'#C96A3A' }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color:'rgba(255,255,255,0.4)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why mortgage through DealMatch */}
      <section className="py-16 px-6" style={{ backgroundColor:'#FFFFFF' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-black text-3xl mb-3" style={{ color:'#1A1210' }}>Why use DealMatch for your mortgage?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon:'🏦', title:'Pre-qualified in 24hrs', desc:'Submit once — we match you with the lender most likely to approve your profile. No wasted applications.' },
              { icon:'📉', title:'Access government rates', desc:'We connect you directly to NHF and FMBN accredited channels where rates start at just 6% per annum.' },
              { icon:'🏡', title:'Property + mortgage in one', desc:'Browse verified properties on DealMatch and apply for a mortgage on the same property in one flow.' },
              { icon:'🤝', title:'Expert support',           desc:'Our mortgage desk agents guide you from application to disbursement — no confusing paperwork alone.' },
              { icon:'🔒', title:'Verified lenders only',    desc:'Every lender on DealMatch is licensed by the Central Bank of Nigeria. No unlicensed operators.' },
              { icon:'⚡', title:'Fast-track approval',      desc:'Organised applicants get approvals in as little as 5 business days with our fast-track document guide.' },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity:0, y:10 }} whileInView={{ opacity:1, y:0 }} transition={{ delay: i*0.08 }} viewport={{ once:true }}
                className="rounded-2xl p-5 border" style={{ backgroundColor:'#FAF6F0', borderColor:'#E8DDD2' }}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-display font-black text-base mb-2" style={{ color:'#1A1210' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color:'#8A7E78' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-16 px-6" style={{ backgroundColor:'#F5EDE0' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-display font-black text-3xl" style={{ color:'#1A1210' }}>Calculate Your Monthly Payment</h2>
            <p className="text-sm mt-2" style={{ color:'#8A7E78' }}>Adjust the numbers to see what you can afford</p>
          </div>
          <MortgageCalculator />
        </div>
      </section>

      {/* Lenders */}
      <section className="py-16 px-6" style={{ backgroundColor:'#FFFFFF' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display font-black text-3xl mb-2" style={{ color:'#1A1210' }}>Our Partner Lenders</h2>
            <p className="text-sm" style={{ color:'#8A7E78' }}>Licensed Nigerian mortgage providers — apply directly through DealMatch</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {LENDERS.map(l => (
              <div key={l.id} className="rounded-2xl border p-5 flex items-start gap-4"
                style={{ backgroundColor:'#FAF6F0', borderColor:'#E8DDD2' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor:`${l.color}15`, border:`1.5px solid ${l.color}30` }}>
                  {l.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-display font-black text-base" style={{ color:'#1A1210' }}>{l.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                      style={{ backgroundColor:`${l.color}15`, color:l.color }}>{l.badge}</span>
                  </div>
                  <div className="flex gap-4 text-xs mb-3" style={{ color:'#8A7E78' }}>
                    <span>Rate: <strong style={{ color:'#1A1210' }}>{l.rate}</strong></span>
                    <span>Max: <strong style={{ color:'#1A1210' }}>{l.max}</strong></span>
                    <span>Term: <strong style={{ color:'#1A1210' }}>{l.term}</strong></span>
                  </div>
                  <button onClick={() => setApplyLender(l)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold"
                    style={{ backgroundColor:'#C96A3A', color:'#FFFFFF' }}>
                    Apply with {l.name.split(' ')[0]} →
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl p-5 border-2 text-center"
            style={{ borderColor:'rgba(201,106,58,0.3)', backgroundColor:'rgba(201,106,58,0.04)' }}>
            <p className="font-semibold text-sm mb-2" style={{ color:'#1A1210' }}>Not sure which lender to pick?</p>
            <p className="text-xs mb-4" style={{ color:'#8A7E78' }}>Submit a general application and our team will match you to the best option for your income, property, and state.</p>
            <button onClick={() => setApplyLender({ id:'any', name:'Best Available Lender' })}
              className="btn-primary px-8 py-3 text-sm">
              Match Me to a Lender →
            </button>
          </div>
        </div>
      </section>

      {/* NHF highlight */}
      <section className="py-16 px-6" style={{ backgroundColor:'#1A1210' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-5xl mb-4">🏛️</div>
          <h2 className="font-display font-black text-3xl mb-4 text-white">NHF Loan at just 6% per year</h2>
          <p className="text-base leading-relaxed mb-8 max-w-2xl mx-auto" style={{ color:'rgba(255,255,255,0.55)' }}>
            The National Housing Fund is Nigeria's most affordable mortgage scheme. Any worker contributing to NHF for at least 6 months qualifies for a loan up to ₦15M at <strong style={{ color:'#C96A3A' }}>6% per annum</strong> — far below commercial rates. DealMatch connects you directly with FMBN-accredited lenders who process NHF loans.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label:'Interest Rate', value:'6%/yr' },
              { label:'Max Loan',      value:'₦15M' },
              { label:'Max Term',      value:'30 yrs' },
              { label:'Eligibility',   value:'NHF member 6+ months' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4" style={{ backgroundColor:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)' }}>
                <p className="font-display font-black text-xl mb-1" style={{ color:'#D4A853' }}>{s.value}</p>
                <p className="text-xs" style={{ color:'rgba(255,255,255,0.4)' }}>{s.label}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setApplyLender({ id:'nhf', name:'NHF / FMBN Loan' })}
            className="btn-primary px-10 py-4 text-base">
            Apply for NHF Loan →
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6" style={{ backgroundColor:'#FAF6F0' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-black text-3xl" style={{ color:'#1A1210' }}>How it works</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { n:'01', icon:'📝', title:'Submit your details', desc:'Fill a short form with your income, employment, and target property value.' },
              { n:'02', icon:'🤝', title:'We match you',        desc:'DealMatch team reviews your profile and connects you with the best-fit lender within 24 hours.' },
              { n:'03', icon:'📋', title:'Document review',     desc:'The lender reviews your documents — bank statements, ID, employment proof.' },
              { n:'04', icon:'🏠', title:'Get your home',       desc:'Loan approved and disbursed. Move into your new home with a clear repayment plan.' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="font-display font-black text-6xl mb-2 leading-none" style={{ color:'rgba(201,106,58,0.08)' }}>{s.n}</div>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-display font-black text-lg mb-2" style={{ color:'#1A1210' }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color:'#8A7E78' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-6" style={{ backgroundColor:'#FFFFFF' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-black text-3xl mb-8 text-center" style={{ color:'#1A1210' }}>Mortgage FAQs</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-2xl border overflow-hidden" style={{ borderColor:'#E8DDD2', backgroundColor:'#FFFAF5' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left">
                  <span className="font-semibold text-sm pr-4" style={{ color:'#1A1210' }}>{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={16} style={{ color:'#C96A3A', flexShrink:0 }} /> : <ChevronDown size={16} style={{ color:'#8A7E78', flexShrink:0 }} />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color:'#8A7E78' }}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {applyLender && <ApplicationForm lender={applyLender} onClose={() => setApplyLender(null)} />}
      </AnimatePresence>
    </div>
  )
}
