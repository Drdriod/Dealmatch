import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, TrendingUp, Users, Home, Star, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

const INCOME_STREAMS = [
  {
    icon: '🏡',
    title: 'DealMatch Property Commission',
    desc: 'Earn 1.5% on every property sale, 3% on rentals, and 8% on hotel/short-let bookings closed through your referrals on DealMatch.',
    example: 'Example: Refer a seller who closes a ₦50M deal = ₦750,000',
    color: '#C96A3A',
  },
  {
    icon: '🌐',
    title: 'AMG Partnership Income',
    desc: 'Join our exclusive business partnership with a globally recognised network. Build a team and earn passive income from their activity — every month, automatically.',
    example: 'Binary compensation structure — earn from both left and right legs',
    color: '#7A9E7E',
  },
  {
    icon: '👥',
    title: 'DealMatch Referral Bonus',
    desc: 'Refer professionals (surveyors, inspectors, lenders) to list on DealMatch. Earn ₦2,000 for every professional who subscribes through your recommendation.',
    example: 'Refer 10 professionals = ₦20,000/month recurring',
    color: '#D4A853',
  },
]

const STEPS = [
  { num: '01', title: 'Express Interest', desc: 'Fill the short form below. No commitment yet — just tell us you\'re interested.' },
  { num: '02', title: 'Personal Consultation', desc: 'Divine contacts you directly on WhatsApp to explain the full opportunity and answer your questions.' },
  { num: '03', title: 'Get Registered', desc: 'Once you decide to join, you\'re personally registered into the partnership network and fully set up.' },
  { num: '04', title: 'Start Earning', desc: 'Begin referring properties, people, and professionals. Watch your income grow from multiple streams.' },
]

const FAQS = [
  {
    q: 'Is this a pyramid scheme?',
    a: 'No. DealMatch is a licensed real estate technology platform. The AMG partnership is a legitimate network marketing business registered in Nigeria. You earn from real services — property deals and product sales — not just from recruiting.',
  },
  {
    q: 'How much does it cost to join?',
    a: 'Joining DealMatch as a referral partner is completely free. The AMG business partnership has a registration investment which Divine will explain to you personally during your consultation call.',
  },
  {
    q: 'Do I need real estate experience?',
    a: 'No. If you know people looking to buy, sell, rent, or invest in property — you can earn. We provide all the tools, training, and support you need.',
  },
  {
    q: 'How do I get paid?',
    a: 'DealMatch commissions are paid directly to your bank account via Paystack once a deal closes. AMG earnings follow their standard encashment process.',
  },
  {
    q: 'Can I do this part-time?',
    a: 'Yes. Many of our top earners started part-time. You work at your own pace — refer when you can, earn when deals close.',
  },
]

const WHATSAPP_NUMBER = '2347057392060'

export default function EarnPage() {
  const [form, setForm] = useState({ name:'', phone:'', email:'', state:'', interest:'both' })
  const [submitted, setSubmitted] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  const set = (k) => (e) => setForm(f => ({...f, [k]: e.target.value}))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.state) return toast.error('Please fill your name, phone and state')

    // Send to WhatsApp
    const msg = encodeURIComponent(
      `🤝 *New Earn with DealMatch Interest*\n\n` +
      `Name: ${form.name}\n` +
      `Phone: ${form.phone}\n` +
      `Email: ${form.email || 'Not provided'}\n` +
      `State: ${form.state}\n` +
      `Interest: ${form.interest === 'both' ? 'Both DealMatch + AMG' : form.interest === 'dealmatch' ? 'DealMatch referrals only' : 'AMG partnership'}\n\n` +
      `Please reach out to discuss the opportunity.`
    )
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank')
    setSubmitted(true)
    toast.success('Request sent! Divine will contact you shortly.')
  }

  return (
    <div className="min-h-screen pt-20" style={{backgroundColor:'#FFFAF5'}}>

      {/* ── Hero ── */}
      <section className="py-20 px-6 relative overflow-hidden" style={{backgroundColor:'#1A1210'}}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background:'radial-gradient(ellipse 60% 80% at 30% 60%, rgba(201,106,58,0.2) 0%, transparent 60%), radial-gradient(ellipse 40% 60% at 80% 20%, rgba(212,168,83,0.1) 0%, transparent 50%)'
        }} />
        <div className="max-w-4xl mx-auto relative text-center">
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.5}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
            style={{backgroundColor:'rgba(201,106,58,0.15)', color:'#E8C4A0', border:'1px solid rgba(201,106,58,0.3)'}}>
            💰 Income Opportunity
          </motion.div>

          <motion.h1 initial={{opacity:0, y:30}} animate={{opacity:1, y:0}} transition={{duration:0.6, delay:0.1}}
            className="font-display font-black leading-tight mb-6"
            style={{fontSize:'clamp(2.5rem, 6vw, 4.5rem)', color:'#FFFFFF'}}>
            Turn property connections<br />
            into <em style={{color:'#C96A3A'}}>real income.</em>
          </motion.h1>

          <motion.p initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.5, delay:0.2}}
            className="text-lg leading-relaxed mb-10 max-w-2xl mx-auto"
            style={{color:'rgba(255,255,255,0.55)'}}>
            DealMatch is building Nigeria's largest property network. Join us as a partner and earn from every deal, referral, and connection — while also accessing a proven global income system.
          </motion.p>

          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.5, delay:0.3}}
            className="flex flex-wrap gap-6 justify-center">
            {[
              { label:'Active Partners', value:'340+' },
              { label:'Avg Monthly Earning', value:'₦85,000' },
              { label:'Deals Closed', value:'₦2.3B+' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="font-display font-black text-3xl" style={{color:'#C96A3A'}}>{s.value}</p>
                <p className="text-xs mt-1" style={{color:'rgba(255,255,255,0.4)'}}>{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Income Streams ── */}
      <section className="py-20 px-6" style={{backgroundColor:'#F5EDE0'}}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#C96A3A'}}>Three Ways to Earn</p>
            <h2 className="font-display font-black text-4xl" style={{color:'#1A1210'}}>
              Multiple income streams.<br /><em style={{color:'#C96A3A'}}>One platform.</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {INCOME_STREAMS.map((s, i) => (
              <motion.div key={i} initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}}
                transition={{delay:i*0.1}} viewport={{once:true}}
                className="rounded-3xl p-6 border"
                style={{backgroundColor:'#FFFAF5', borderColor:'#E8DDD2', boxShadow:'0 4px 20px rgba(26,18,16,0.06)'}}>
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="font-display font-black text-lg mb-3" style={{color:'#1A1210'}}>{s.title}</h3>
                <p className="text-sm leading-relaxed mb-4" style={{color:'#8A7E78'}}>{s.desc}</p>
                <div className="p-3 rounded-xl text-xs font-semibold"
                  style={{backgroundColor:`${s.color}15`, color:s.color}}>
                  💡 {s.example}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AMG explanation ── */}
      <section className="py-20 px-6" style={{backgroundColor:'#FFFFFF'}}>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#7A9E7E'}}>The AMG Partnership</p>
            <h2 className="font-display font-black text-3xl mb-4" style={{color:'#1A1210'}}>
              A global income system<br />built on real products.
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{color:'#8A7E78'}}>
              Our AMG partnership is with a globally recognised network marketing company operating in Nigeria. You build a team, they build their own teams, and you earn passively from the activity of everyone in your network — month after month.
            </p>
            <p className="text-sm leading-relaxed mb-8" style={{color:'#8A7E78'}}>
              DealMatch gives you the perfect audience — people already thinking about investment, property, and building wealth. Converting them into your network is natural and powerful.
            </p>
            <div className="space-y-3">
              {[
                'Binary compensation structure — left and right legs',
                'Passive income from your entire network depth',
                'Personal registration — you are guided every step',
                'Stacks with your DealMatch property earnings',
              ].map(point => (
                <div key={point} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{backgroundColor:'rgba(122,158,126,0.15)'}}>
                    <Check size={11} style={{color:'#7A9E7E'}} />
                  </div>
                  <p className="text-sm" style={{color:'#5C4A3A'}}>{point}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Binary tree visual */}
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-xs">
              {/* You */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-center"
                  style={{backgroundColor:'#C96A3A', boxShadow:'0 8px 24px rgba(201,106,58,0.4)'}}>
                  <span className="text-2xl">👤</span>
                  <span className="text-[9px] font-bold text-white mt-0.5">YOU</span>
                </div>
              </div>
              {/* Line down */}
              <div className="flex justify-center mb-2">
                <div className="w-px h-8" style={{backgroundColor:'#E8DDD2'}} />
              </div>
              {/* Level 1 */}
              <div className="flex justify-between px-8 mb-2 relative">
                <div className="absolute left-1/2 top-0 w-[60%] h-px -translate-x-1/2" style={{backgroundColor:'#E8DDD2'}} />
                {[1,2].map(n => (
                  <div key={n} className="w-12 h-12 rounded-xl flex flex-col items-center justify-center"
                    style={{backgroundColor:'#7A9E7E'}}>
                    <span className="text-lg">👤</span>
                    <span className="text-[8px] font-bold text-white">{n}</span>
                  </div>
                ))}
              </div>
              {/* Lines */}
              <div className="flex justify-between px-12 mb-2">
                {[1,2].map(n => <div key={n} className="w-px h-6" style={{backgroundColor:'#E8DDD2'}} />)}
              </div>
              {/* Level 2 */}
              <div className="flex justify-between px-4 mb-2">
                {[3,4,5,6].map(n => (
                  <div key={n} className="w-10 h-10 rounded-xl flex flex-col items-center justify-center"
                    style={{backgroundColor: n <= 4 ? '#D4A853' : '#E8DDD2'}}>
                    <span className="text-sm">{n <= 4 ? '👤' : '⬜'}</span>
                    <span className="text-[7px] font-bold" style={{color: n <= 4 ? 'white' : '#8A7E78'}}>{n}</span>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs mt-4" style={{color:'#8A7E78'}}>
                Your network grows deeper — you earn from every level
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6" style={{backgroundColor:'#F5EDE0'}}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display font-black text-4xl" style={{color:'#1A1210'}}>
              How it works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="relative">
                <div className="font-display font-black text-6xl mb-3 leading-none"
                  style={{color:'rgba(201,106,58,0.08)'}}>
                  {s.num}
                </div>
                <h3 className="font-display font-black text-lg mb-2" style={{color:'#1A1210'}}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{color:'#8A7E78'}}>{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 -right-3 z-10">
                    <ArrowRight size={16} style={{color:'#E8DDD2'}} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interest Form ── */}
      <section className="py-20 px-6" style={{backgroundColor:'#1A1210'}}>
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'rgba(255,255,255,0.4)'}}>Ready to Start?</p>
            <h2 className="font-display font-black text-4xl mb-4" style={{color:'#FFFFFF'}}>
              Express your interest
            </h2>
            <p className="text-sm leading-relaxed" style={{color:'rgba(255,255,255,0.5)'}}>
              No commitment. Just fill this form and Divine will reach out personally to walk you through everything.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-6">🎉</div>
              <h3 className="font-display font-black text-3xl mb-3" style={{color:'#FFFFFF'}}>
                Request received!
              </h3>
              <p className="text-sm leading-relaxed mb-8" style={{color:'rgba(255,255,255,0.5)'}}>
                Divine will contact you on WhatsApp within 24 hours to discuss the opportunity personally.
              </p>
              <button
                onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank')}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold mx-auto"
                style={{backgroundColor:'#25D366', color:'#FFFFFF'}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Chat with Divine Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(255,255,255,0.4)'}}>Full Name *</label>
                  <input className="input" type="text" placeholder="John Doe"
                    value={form.name} onChange={set('name')}
                    style={{backgroundColor:'rgba(255,255,255,0.08)', color:'#FFFFFF', border:'1px solid rgba(255,255,255,0.1)'}} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(255,255,255,0.4)'}}>Phone *</label>
                  <input className="input" type="tel" placeholder="0800 000 0000"
                    value={form.phone} onChange={set('phone')}
                    style={{backgroundColor:'rgba(255,255,255,0.08)', color:'#FFFFFF', border:'1px solid rgba(255,255,255,0.1)'}} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(255,255,255,0.4)'}}>Email</label>
                <input className="input" type="email" placeholder="you@example.com"
                  value={form.email} onChange={set('email')}
                  style={{backgroundColor:'rgba(255,255,255,0.08)', color:'#FFFFFF', border:'1px solid rgba(255,255,255,0.1)'}} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(255,255,255,0.4)'}}>State *</label>
                <input className="input" type="text" placeholder="e.g. Akwa Ibom, Lagos, Abuja..."
                  value={form.state} onChange={set('state')}
                  style={{backgroundColor:'rgba(255,255,255,0.08)', color:'#FFFFFF', border:'1px solid rgba(255,255,255,0.1)'}} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{color:'rgba(255,255,255,0.4)'}}>I'm interested in...</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id:'both',      label:'Both — DealMatch referrals + AMG partnership', emoji:'💰' },
                    { id:'dealmatch', label:'DealMatch property referrals only',             emoji:'🏡' },
                    { id:'amg',       label:'AMG business partnership only',                 emoji:'🌐' },
                  ].map(opt => (
                    <button key={opt.id} type="button"
                      onClick={() => setForm(f => ({...f, interest: opt.id}))}
                      className="flex items-center gap-3 p-3 rounded-2xl text-left transition-all border"
                      style={{
                        borderColor: form.interest === opt.id ? '#C96A3A' : 'rgba(255,255,255,0.1)',
                        backgroundColor: form.interest === opt.id ? 'rgba(201,106,58,0.15)' : 'rgba(255,255,255,0.05)',
                        color: '#FFFFFF',
                      }}>
                      <span>{opt.emoji}</span>
                      <span className="text-sm font-medium">{opt.label}</span>
                      {form.interest === opt.id && <Check size={14} style={{color:'#C96A3A', marginLeft:'auto'}} />}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit"
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
                style={{backgroundColor:'#C96A3A', color:'#FFFFFF', boxShadow:'0 8px 24px rgba(201,106,58,0.4)'}}>
                Send My Interest <ArrowRight size={18} />
              </button>

              <p className="text-center text-xs" style={{color:'rgba(255,255,255,0.3)'}}>
                No spam. Divine contacts you personally. No obligation to join.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── FAQs ── */}
      <section className="py-20 px-6" style={{backgroundColor:'#FFFAF5'}}>
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-black text-3xl mb-10 text-center" style={{color:'#1A1210'}}>
            Common questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-2xl border overflow-hidden"
                style={{borderColor:'#E8DDD2', backgroundColor:'#FFFFFF'}}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left">
                  <span className="font-semibold text-sm pr-4" style={{color:'#1A1210'}}>{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp size={16} style={{color:'#C96A3A', flexShrink:0}} />
                    : <ChevronDown size={16} style={{color:'#8A7E78', flexShrink:0}} />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm leading-relaxed" style={{color:'#8A7E78'}}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 px-6 text-center" style={{backgroundColor:'#C96A3A'}}>
        <h2 className="font-display font-black text-4xl mb-4" style={{color:'#FFFFFF'}}>
          Your network is your net worth.
        </h2>
        <p className="text-lg mb-8 max-w-xl mx-auto" style={{color:'rgba(255,255,255,0.7)'}}>
          Every person you know who needs a house, wants to invest, or is looking for extra income — is an opportunity. Start today.
        </p>
        <button
          onClick={() => document.querySelector('form')?.scrollIntoView({behavior:'smooth'})}
          className="px-10 py-5 rounded-full font-bold text-lg transition-all hover:-translate-y-1"
          style={{backgroundColor:'#FFFFFF', color:'#C96A3A', boxShadow:'0 16px 48px rgba(0,0,0,0.2)'}}>
          I Want to Earn →
        </button>
      </section>
    </div>
  )
}
