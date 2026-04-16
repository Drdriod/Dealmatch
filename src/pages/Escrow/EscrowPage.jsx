import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { initializePaystackPayment, generateReference } from '@/lib/paystack'
import CryptoPayment from '@/components/ui/CryptoPayment'
import toast from 'react-hot-toast'

const WHATSAPP = '2347057392060'

const HOW_IT_WORKS = [
  { icon:'💰', title:'Tenant deposits funds',  desc:'Tenant pays rent or deposit to DealMatch — not directly to landlord.' },
  { icon:'🔍', title:'DealMatch verifies',     desc:'We confirm property details, agreement terms, and both parties have signed.' },
  { icon:'🏠', title:'Tenant moves in',        desc:'Once tenant confirms successful move-in, funds are released to landlord.' },
  { icon:'✅', title:'Deal complete',          desc:'DealMatch deducts commission and sends balance to landlord within 24 hours.' },
]

// ─── Request Modal ────────────────────────────────────────
function EscrowRequestModal({ onClose }) {
  const { user, profile } = useAuth()
  const [form, setForm] = useState({
    type: 'rental', property_title: '', property_address: '',
    landlord_name: '', landlord_phone: '',
    tenant_name:  profile?.full_name || '',
    tenant_phone: profile?.phone     || '',
    tenant_email: user?.email        || '',
    amount: '', move_in_date: '', duration: '12',
  })
  const [submitted,  setSubmitted]  = useState(false)
  const [showCrypto, setShowCrypto] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const commission       = form.amount ? Math.round(Number(form.amount) * 0.03) : 0
  const landlordReceives = form.amount ? Number(form.amount) - commission : 0

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.property_title || !form.landlord_phone || !form.amount) {
      toast.error('Please fill all required fields'); return
    }
    const email = form.tenant_email || user?.email || ''
    if (!email) { toast.error('Please provide your email for payment'); return }

    await initializePaystackPayment({
      email, amount: Number(form.amount),
      reference: generateReference(),
      metadata: {
        type: 'escrow_payment', property_title: form.property_title,
        property_address: form.property_address, landlord_name: form.landlord_name,
        landlord_phone: form.landlord_phone, tenant_name: form.tenant_name,
        tenant_phone: form.tenant_phone, move_in_date: form.move_in_date,
        duration: form.duration, commission, landlord_receives: landlordReceives,
      },
      onSuccess: response => {
        const msg = encodeURIComponent(
          '✅ *Escrow Payment Received — DealMatch*\n\n' +
          'Property: ' + form.property_title + '\n' +
          'Tenant: ' + form.tenant_name + ' | ' + form.tenant_phone + '\n' +
          'Landlord: ' + form.landlord_name + ' | ' + form.landlord_phone + '\n' +
          'Amount: ₦' + Number(form.amount).toLocaleString() + '\n' +
          'Paystack Ref: ' + response.reference
        )
        window.open('https://wa.me/' + WHATSAPP + '?text=' + msg, '_blank')
        setSubmitted(true)
      },
      onClose: () => toast('Payment cancelled.'),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ backgroundColor:'rgba(26,18,16,0.85)', backdropFilter:'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }}
        className="w-full max-w-lg rounded-3xl overflow-hidden flex flex-col"
        style={{ backgroundColor:'#FFFAF5', maxHeight:'92vh' }}>

        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor:'#E8DDD2' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor:'rgba(122,158,126,0.15)' }}>
              <Shield size={18} style={{ color:'#7A9E7E' }} />
            </div>
            <div>
              <h3 className="font-display text-lg font-black" style={{ color:'#1A1210' }}>Request Escrow</h3>
              <p className="text-xs" style={{ color:'#8A7E78' }}>Protected transaction</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor:'rgba(26,18,16,0.08)' }}>
            <X size={14} style={{ color:'#5C4A3A' }} />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h4 className="font-display font-black text-xl mb-2" style={{ color:'#1A1210' }}>Escrow Initiated!</h4>
            <p className="text-sm leading-relaxed mb-6" style={{ color:'#8A7E78' }}>
              Payment received. DealMatch will confirm your escrow and notify both parties within 2 hours.
            </p>
            <button onClick={onClose} className="btn-primary w-full py-3">Done ✓</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
            {/* Transaction type */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:'rgba(26,18,16,0.5)' }}>Transaction Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[['rental','Monthly Rental'],['sale','Property Sale']].map(([v,l]) => (
                  <button key={v} type="button" onClick={() => setForm(f => ({ ...f, type:v }))}
                    className="py-3 rounded-2xl text-sm font-semibold border-2 transition-all"
                    style={{
                      borderColor:     form.type === v ? '#C96A3A' : '#E8DDD2',
                      backgroundColor: form.type === v ? 'rgba(201,106,58,0.05)' : '#FFFFFF',
                      color:           form.type === v ? '#C96A3A' : '#8A7E78',
                    }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {[
              { label:'Property Title *',  key:'property_title',   type:'text', placeholder:'e.g. 3-Bed Apartment, Lekki' },
              { label:'Property Address',  key:'property_address', type:'text', placeholder:'Full address' },
              { label:'Landlord Name',     key:'landlord_name',    type:'text', placeholder:'Full name' },
              { label:'Landlord Phone *',  key:'landlord_phone',   type:'tel',  placeholder:'0800 000 0000' },
              { label:'Your Name',         key:'tenant_name',      type:'text', placeholder:'Your name' },
              { label:'Your Phone',        key:'tenant_phone',     type:'tel',  placeholder:'Your phone' },
              { label:'Your Email',        key:'tenant_email',     type:'email',placeholder:'For payment receipt' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:'rgba(26,18,16,0.5)' }}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder}
                  className="input text-sm" style={{ backgroundColor:'#FFFFFF', color:'#1A1210' }} />
              </div>
            ))}

            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:'rgba(26,18,16,0.5)' }}>Amount (₦) *</label>
              <input type="number" value={form.amount} onChange={set('amount')} placeholder="e.g. 1200000"
                className="input text-sm" style={{ backgroundColor:'#FFFFFF', color:'#1A1210' }} />
            </div>

            {form.amount && (
              <div className="rounded-2xl p-4" style={{ backgroundColor:'rgba(122,158,126,0.08)', border:'1px solid rgba(122,158,126,0.2)' }}>
                <p className="text-xs font-bold mb-2" style={{ color:'#5C8060' }}>Breakdown</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span style={{ color:'#8A7E78' }}>Total</span><strong style={{ color:'#1A1210' }}>₦{Number(form.amount).toLocaleString()}</strong></div>
                  <div className="flex justify-between"><span style={{ color:'#8A7E78' }}>Commission (3%)</span><strong style={{ color:'#C96A3A' }}>-₦{commission.toLocaleString()}</strong></div>
                  <div className="flex justify-between border-t pt-1" style={{ borderColor:'rgba(122,158,126,0.2)' }}>
                    <span style={{ color:'#5C8060', fontWeight:700 }}>Landlord receives</span>
                    <strong style={{ color:'#5C8060' }}>₦{landlordReceives.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:'rgba(26,18,16,0.5)' }}>Move-in Date</label>
                <input type="date" value={form.move_in_date} onChange={set('move_in_date')}
                  className="input text-sm" style={{ backgroundColor:'#FFFFFF', color:'#1A1210' }} />
              </div>
              {form.type === 'rental' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:'rgba(26,18,16,0.5)' }}>Duration</label>
                  <select value={form.duration} onChange={set('duration')} className="select text-sm"
                    style={{ backgroundColor:'#FFFFFF', color:'#1A1210' }}>
                    {[1,3,6,12,24].map(n => <option key={n} value={n}>{n} month{n>1?'s':''}</option>)}
                  </select>
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary w-full py-4">💳 Pay with Card/Bank →</button>
            <button type="button" onClick={() => setShowCrypto(true)}
              className="w-full py-4 rounded-2xl text-sm font-semibold border-2"
              style={{ borderColor:'rgba(26,18,16,0.15)', color:'#1A1210', backgroundColor:'rgba(26,18,16,0.03)' }}>
              💎 Pay with USDT / Crypto
            </button>
            <p className="text-xs text-center" style={{ color:'#8A7E78' }}>Funds held securely until move-in confirmed.</p>
          </form>
        )}
      </motion.div>

      {/* ✅ FIX: CryptoPayment lives INSIDE the modal so showCrypto is in scope */}
      <AnimatePresence>
        {showCrypto && (
          <CryptoPayment
            usdtAmount={5}
            description="DealMatch Escrow Payment"
            onClose={() => setShowCrypto(false)}
            onConfirmed={() => { setShowCrypto(false); setSubmitted(true) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────
export default function EscrowPage() {
  const [showModal, setShowModal] = useState(false)
  // ✅ FIX: removed showCrypto from here — it was causing crash (undefined var in render)

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ backgroundColor:'#F5EDE0' }}>
      <div className="max-w-2xl mx-auto px-4">

        {/* Hero */}
        <div className="rounded-3xl p-8 mb-6 text-center relative overflow-hidden" style={{ backgroundColor:'#1A1210' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background:'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(122,158,126,0.2) 0%, transparent 70%)' }} />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor:'rgba(122,158,126,0.2)' }}>
              <Shield size={32} style={{ color:'#7A9E7E' }} />
            </div>
            <h1 className="font-display font-black text-3xl mb-3" style={{ color:'#FFFFFF' }}>
              DealMatch Escrow 🔒
            </h1>
            <p className="text-sm leading-relaxed mb-6" style={{ color:'rgba(255,255,255,0.55)' }}>
              Pay your rent or property deposit safely through DealMatch. Funds held securely — released only after you confirm everything is in order.
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary px-8 py-4 text-base">
              Request Escrow Protection →
            </button>
          </div>
        </div>

        {/* How it works */}
        <div className="rounded-2xl p-6 mb-6 border" style={{ backgroundColor:'#FFFAF5', borderColor:'#E8DDD2' }}>
          <h2 className="font-display font-black text-xl mb-5" style={{ color:'#1A1210' }}>How it works</h2>
          <div className="space-y-4">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor:'rgba(26,18,16,0.04)', border:'1px solid #E8DDD2' }}>
                  {s.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color:'#1A1210' }}>{s.title}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color:'#8A7E78' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        {[
          { icon:'🔒', title:'Your money is safe',      desc:'Funds held by DealMatch until move-in confirmed. Landlord cannot access until you approve.' },
          { icon:'📋', title:'Legal protection',         desc:'Every escrow is documented. Both parties protected by DealMatch agreement.' },
          { icon:'🚫', title:'No bypass possible',       desc:'Contact details only shared after escrow initiated. Deals cannot happen outside platform.' },
          { icon:'⚡', title:'Fast release',             desc:'Once you confirm move-in, landlord receives funds within 24 hours.' },
        ].map(b => (
          <div key={b.title} className="rounded-2xl p-4 border flex gap-3 mb-3"
            style={{ backgroundColor:'#FFFAF5', borderColor:'#E8DDD2' }}>
            <span className="text-2xl flex-shrink-0">{b.icon}</span>
            <div>
              <p className="font-semibold text-sm" style={{ color:'#1A1210' }}>{b.title}</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color:'#8A7E78' }}>{b.desc}</p>
            </div>
          </div>
        ))}

        <button onClick={() => setShowModal(true)} className="btn-primary w-full py-4 text-base mt-3">
          Get Escrow Protection →
        </button>
      </div>

      <AnimatePresence>
        {showModal && <EscrowRequestModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  )
}
