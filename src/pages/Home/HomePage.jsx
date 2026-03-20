import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Play, ChevronRight, MapPin, TrendingUp, Shield, Zap, Star } from 'lucide-react'
import { FadeUp, StaggerChildren, StaggerItem, SlideLeft, SlideRight } from '@/components/ui/ScrollReveal'
import AnimatedStat from '@/components/ui/AnimatedStat'
import { MapExplorer } from '@/components/maps/PropertyMap'
import HeroBackground from '@/components/ui/HeroBackground'

const MINI_CARDS = [
  { emoji:'🏡', title:'4-Bed Duplex, Lekki',  sub:'₦38.5M · For Sale', pct:'94%' },
  { emoji:'🌿', title:'Plot in Uyo, AKS',      sub:'₦8.5M · Land',      pct:'87%' },
  { emoji:'🏢', title:'Commercial, Abuja',      sub:'₦120M · Retail',    pct:'79%' },
]

const STEPS = [
  { num:'01', icon:'📋', title:'Tell us what you love',     desc:'Quick profile quiz — budget, property type, location, goals. The more you share, the smarter your matches.' },
  { num:'02', icon:'💘', title:'Swipe on your matches',     desc:'Our AI surfaces deals uniquely suited to you. Like, pass, or super-like to refine your feed over time.' },
  { num:'03', icon:'🤝', title:'Get your professional team',desc:'Connect with verified surveyors, inspectors, and lenders matched to your deal — not random referrals.' },
]

const TESTIMONIALS = [
  { stars:5, text:'I spent 6 months frustrated on other platforms. DealMatch showed me my first true match in 4 days. Closed in 3 weeks.', name:'Adaeze Okonkwo', role:'First-time buyer · Abuja', emoji:'👩🏾', tag:'₦22M deal' },
  { stars:5, text:'As an inspector, my client pipeline went from 2–3 referrals a week to 12. Every buyer I get from DealMatch is already serious.', name:'Emeka Nwosu', role:'Certified Inspector · Lagos', emoji:'👨🏽', tag:'35 referrals/mo' },
  { stars:5, text:'I listed three plots in Uyo and matched with buyers within 48 hours. The lender connection sealed two deals that would have stalled.', name:'Bassey Inyang', role:'Land Developer · Akwa Ibom', emoji:'👨🏿', tag:'3 plots sold' },
]

const CITIES = [
  { name:'Lagos', count:'4,200+', emoji:'🌊', desc:'Victoria Island, Lekki, Ikoyi' },
  { name:'Abuja', count:'2,800+', emoji:'🏛️', desc:'Wuse, Maitama, Gwarinpa' },
  { name:'Uyo',   count:'1,100+', emoji:'🌿', desc:'Uyo GRA, Ewet, Eket' },
  { name:'PH',    count:'1,600+', emoji:'⛽', desc:'GRA, Trans-Amadi, Rumuola' },
]

const MAP_PROPS = [
  { id:'1', title:'4-Bed Duplex',     price:38_500_000, city:'Victoria Island', state:'Lagos',     latitude:6.4281, longitude:3.4219 },
  { id:'2', title:'500sqm Land',      price:8_200_000,  city:'Uyo',            state:'Akwa Ibom', latitude:5.0510, longitude:7.9328 },
  { id:'3', title:'Commercial Plaza', price:120_000_000,city:'Wuse 2',          state:'Abuja',     latitude:9.0579, longitude:7.4951 },
  { id:'4', title:'3-Bed Terrace',    price:22_000_000, city:'Lekki Phase 1',  state:'Lagos',     latitude:6.4351, longitude:3.4747 },
  { id:'5', title:'Detached House',   price:55_000_000, city:'GRA',            state:'Rivers',    latitude:4.8156, longitude:7.0498 },
  { id:'6', title:'Luxury Apartment', price:45_000_000, city:'Ikoyi',          state:'Lagos',     latitude:6.4530, longitude:3.4362 },
]

export default function HomePage() {
  const [videoOpen, setVideoOpen] = useState(false)

  return (
    <div className="overflow-x-hidden">

      {/* ════════ HERO ════════ */}
      <section className="min-h-screen flex items-center px-5 pt-24 pb-16 relative overflow-hidden bg-[#F5EDE0]">

        {/* Animated canvas background — people ↔ properties chain */}
        <HeroBackground />

        {/* Warm radial overlays on top of canvas */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Centre glow so text stays readable */}
          <div style={{
            position:'absolute', inset:0,
            background:'radial-gradient(ellipse 55% 70% at 50% 50%, rgba(245,237,224,0.97) 0%, rgba(245,237,224,0.90) 40%, rgba(245,237,224,0.2) 100%)'
          }} />
          {/* Left warm accent */}
          <div style={{
            position:'absolute', inset:0,
            background:'radial-gradient(ellipse 35% 50% at 5% 50%, rgba(201,106,58,0.10) 0%, transparent 70%)'
          }} />
          {/* Right sage accent */}
          <div style={{
            position:'absolute', inset:0,
            background:'radial-gradient(ellipse 35% 50% at 95% 50%, rgba(122,158,126,0.10) 0%, transparent 70%)'
          }} />
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">

          {/* Left — copy */}
          <div>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
              className="inline-flex items-center gap-2 bg-terracotta/10 border border-terracotta/25 px-4 py-2 rounded-full text-xs font-bold text-terracotta tracking-widest uppercase mb-8">
              <motion.span animate={{scale:[1,1.4,1]}} transition={{repeat:Infinity,duration:1.5,repeatDelay:2}}>❤️</motion.span>
              Every match is a connection. Every connection is a home.
            </motion.div>

            <motion.h1 initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.1,ease:[0.22,1,0.36,1]}}
              className="font-display text-5xl md:text-6xl lg:text-[5.5rem] font-black leading-[0.92] text-deep mb-6">
              Find your<br /><em className="text-terracotta">perfect</em><br />property match.
            </motion.h1>

            <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5,delay:0.2}}
              className="text-deep/55 text-lg leading-relaxed max-w-md mb-10">
              People and properties — brought together like they were always meant to be. Swipe, match, and connect with deals tailored to your life, your goals, and your future.
            </motion.p>

            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5,delay:0.3}}
              className="flex gap-3 flex-wrap mb-10">
              <Link to="/auth?tab=signup" className="btn-primary flex items-center gap-2 text-base">
                Start Matching Free <ArrowRight size={16} />
              </Link>
              <button onClick={() => setVideoOpen(true)}
                className="flex items-center gap-3 px-6 py-4 rounded-full border border-deep/15 hover:border-terracotta/40 bg-white/60 backdrop-blur transition-all text-sm font-medium text-deep">
                <div className="w-7 h-7 rounded-full bg-terracotta/10 flex items-center justify-center">
                  <Play size={11} fill="currentColor" className="text-terracotta ml-0.5" />
                </div>
                Watch Demo
              </button>
            </motion.div>

            {/* Social proof */}
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.5,delay:0.4}}
              className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {['🧑🏾','👩🏽','👨🏿','👩🏾','🧔🏽'].map((e,i) => (
                  <motion.div key={i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:0.5+i*0.06}}
                    className="w-9 h-9 rounded-full bg-white border-2 border-cream flex items-center justify-center text-sm shadow-sm">{e}
                  </motion.div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-deep">12,400+ buyers matched</p>
                <p className="text-xs text-deep/40">Fastest-growing property platform in Nigeria</p>
              </div>
            </motion.div>
          </div>

          {/* Right — floating match cards */}
          <div className="hidden lg:flex flex-col gap-3 max-w-[300px] ml-auto">
            {MINI_CARDS.map((c, i) => (
              <motion.div key={i}
                initial={{opacity:0,x:40}} animate={{opacity:1,x:0}}
                transition={{duration:0.6,delay:0.3+i*0.12,ease:[0.22,1,0.36,1]}}
                whileHover={{x:-6,transition:{duration:0.2}}}
                className="bg-white/85 backdrop-blur-sm border border-white/80 rounded-2xl p-4 flex items-center gap-3 shadow-card cursor-default">
                <div className="w-11 h-11 rounded-xl bg-cream flex items-center justify-center text-xl flex-shrink-0 shadow-sm">{c.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-deep truncate">{c.title}</p>
                  <p className="text-xs text-deep/40 mt-0.5">{c.sub}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="text-sm font-black text-terracotta">{c.pct}</span>
                  <p className="text-xs text-deep/30">match</p>
                </div>
              </motion.div>
            ))}

            <motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}}
              transition={{duration:0.6,delay:0.7,ease:[0.22,1,0.36,1]}}
              className="bg-terracotta rounded-2xl p-5 text-white shadow-glow mt-1">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider opacity-60">Today's Top Match</p>
                <motion.div animate={{scale:[1,1.3,1]}} transition={{repeat:Infinity,duration:2}}><Star size={14} fill="white" /></motion.div>
              </div>
              <p className="font-display text-xl font-black">3-Bed Terrace</p>
              <p className="text-sm opacity-70 mb-3">Lekki Phase 1 · ₦22M</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-white rounded-full" initial={{width:'0%'}} animate={{width:'95%'}} transition={{duration:1.5,delay:1,ease:'easeOut'}} />
                </div>
                <span className="text-xs font-black">95%</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════ STATS ════════ */}
      <div className="bg-deep py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <AnimatedStat value="12400" suffix="+" label="Verified Listings" />
          <AnimatedStat value="2.3" prefix="₦" suffix="B" label="Deals Closed" />
          <AnimatedStat value="840" suffix="+" label="Licensed Professionals" />
          <AnimatedStat value="97" suffix="%" label="Match Satisfaction" />
        </div>
      </div>

      {/* ════════ HOW IT WORKS ════════ */}
      <section id="how" className="py-24 px-6" style={{backgroundColor:"#F5EDE0"}}>
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="section-tag">The Process</p>
            <h2 className="section-title mb-4">Dating for deals.<br /><em className="text-terracotta">Seriously.</em></h2>
            <p className="section-sub mx-auto text-center">We took everything frustrating about property hunting and made it feel like falling in love.</p>
          </FadeUp>
          <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-6" stagger={0.15}>
            {STEPS.map(s => (
              <StaggerItem key={s.num}>
                <div className="group rounded-3xl p-8 relative overflow-hidden hover:shadow-card transition-all duration-300 hover:-translate-y-2 border border-[#E8DDD2]" style={{backgroundColor:"#FFFAF5"}}>
                  <div className="font-display text-[7rem] font-black absolute -top-4 -right-3 leading-none pointer-events-none select-none" style={{color:"rgba(201,106,58,0.08)"}}>{s.num}</div>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform shadow-sm" style={{backgroundColor:"#FFFFFF"}}>{s.icon}</div>
                  <h3 className="font-display text-xl font-black mb-3 leading-tight" style={{color:"#1A1210"}}>{s.title}</h3>
                  <p className="text-[#5C4A3A] text-sm leading-[1.8] tracking-wide">{s.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ════════ CITIES ════════ */}
      <section className="py-24 px-6" style={{backgroundColor:"#F5EDE0"}}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-14 flex-wrap gap-4">
            <FadeUp>
              <p className="section-tag">Browse by Location</p>
              <h2 className="section-title">Top cities for <em className="text-terracotta">property deals.</em></h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <Link to="/browse" className="flex items-center gap-1 text-sm font-semibold text-terracotta hover:gap-2 transition-all">
                View all <ChevronRight size={15} />
              </Link>
            </FadeUp>
          </div>
          <StaggerChildren className="grid grid-cols-2 md:grid-cols-4 gap-5" stagger={0.1}>
            {CITIES.map(city => (
              <StaggerItem key={city.name}>
                <Link to={`/browse?state=${city.name}`}
                  className="group rounded-2xl p-5 shadow-sm hover:shadow-card transition-all duration-300 hover:-translate-y-1 flex flex-col gap-3 border border-[#E8DDD2] hover:border-terracotta/40" style={{backgroundColor:"#FFFAF5"}}>
                  <div className="text-3xl">{city.emoji}</div>
                  <div>
                    <h3 className="font-display text-lg font-black text-deep group-hover:text-terracotta transition-colors">{city.name}</h3>
                    <p className="text-xs text-deep/40 mt-0.5">{city.desc}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-sm font-bold text-terracotta">{city.count} listings</span>
                    <div className="w-7 h-7 rounded-full bg-deep/8 group-hover:bg-terracotta flex items-center justify-center transition-colors">
                      <ArrowRight size={12} className="text-deep/40 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ════════ MAP EXPLORER ════════ */}
      <section className="py-24 px-6" style={{backgroundColor:"#FFFFFF"}}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <SlideLeft>
              <p className="section-tag">Explore on Map</p>
              <h2 className="section-title mb-4">Find properties by <em className="text-terracotta">location.</em></h2>
              <p className="section-sub mb-6">Browse all listings across Nigeria on an interactive Google Map. Click any marker to preview the property, then dive deeper.</p>
              <div className="flex flex-wrap gap-2 mb-8">
                {['📍 Location-based search','🔍 Zoom to any area','🏷️ Price on map','📊 Nearby amenities'].map(label => (
                  <span key={label} className="text-xs text-deep/60 bg-cream px-3 py-2 rounded-full border border-deep/8">{label}</span>
                ))}
              </div>
              <Link to="/browse?view=map" className="btn-primary flex items-center gap-2 w-fit">
                Open Map View <MapPin size={15} />
              </Link>
            </SlideLeft>
            <SlideRight>
              <MapExplorer properties={MAP_PROPS} />
            </SlideRight>
          </div>
        </div>
      </section>

      {/* ════════ PROFESSIONALS ════════ */}
      <section className="py-24 px-6 bg-deep relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse 60% 80% at 80% 50%, rgba(201,106,58,0.15) 0%, transparent 60%)'}} />
        <div className="max-w-6xl mx-auto relative grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <SlideLeft>
            <p className="section-tag" style={{color:'#E8C4A0'}}>For Professionals</p>
            <h2 className="section-title text-white mb-4">Get matched with <em className="text-terracotta">motivated buyers.</em></h2>
            <p className="text-white/40 text-lg leading-relaxed mb-8">Surveyors, inspectors, and lenders — stop chasing cold leads. We send you buyers already in love with a property.</p>
            <Link to="/professionals" className="btn-primary flex items-center gap-2 w-fit">
              See Professional Plans <ArrowRight size={16} />
            </Link>
          </SlideLeft>
          <StaggerChildren className="space-y-4" stagger={0.1}>
            {[
              { emoji:'📐', type:'Land Surveyor',     price:'₦25,000', desc:'Matched to land and plot buyers automatically', hot:false },
              { emoji:'🔍', type:'Property Inspector', price:'₦35,000', desc:'Most popular — unlimited deal referrals',       hot:true  },
              { emoji:'🏦', type:'Mortgage Lender',   price:'₦75,000', desc:'Buyers who need financing at the right moment', hot:false },
            ].map(p => (
              <StaggerItem key={p.type}>
                <div className={`rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.02] cursor-default ${p.hot ? 'bg-terracotta shadow-glow' : 'bg-white/6 hover:bg-white/10'}`}>
                  <span className="text-2xl">{p.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-white">{p.type}</p>
                    <p className={`text-xs mt-0.5 ${p.hot?'text-white/70':'text-white/40'}`}>{p.desc}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-display font-black ${p.hot?'text-white':'text-blush'}`}>{p.price}</p>
                    <p className={`text-xs ${p.hot?'text-white/60':'text-white/30'}`}>/month</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ════════ TESTIMONIALS ════════ */}
      <section className="py-24 px-6" style={{backgroundColor:"#F5EDE0"}}>
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="section-tag">Love Stories</p>
            <h2 className="section-title mb-4">They found <em className="text-terracotta">the one.</em></h2>
            <p className="section-sub mx-auto text-center">Real people. Real deals. Real matches.</p>
          </FadeUp>
          <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-6" stagger={0.12}>
            {TESTIMONIALS.map(t => (
              <StaggerItem key={t.name}>
                <div className="rounded-3xl p-8 shadow-sm border border-[#E8DDD2] hover:shadow-card hover:-translate-y-1 transition-all duration-300 flex flex-col h-full" style={{backgroundColor:"#FFFAF5"}}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gold text-base">{'★'.repeat(t.stars)}</div>
                    <span className="text-xs bg-sage/10 text-sage font-bold px-3 py-1 rounded-full">{t.tag}</span>
                  </div>
                  <p className="text-deep/70 text-sm leading-relaxed italic flex-1 mb-6">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center text-2xl">{t.emoji}</div>
                    <div>
                      <p className="font-semibold text-sm text-deep">{t.name}</p>
                      <p className="text-xs text-deep/40 mt-0.5">{t.role}</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ════════ TRUST BADGES ════════ */}
      <section className="py-16 px-6 bg-white border-y border-deep/5">
        <div className="max-w-4xl mx-auto">
          <FadeUp className="text-center mb-10">
            <p className="text-xs font-bold text-deep/30 uppercase tracking-widest">Trusted & Verified</p>
          </FadeUp>
          <StaggerChildren className="grid grid-cols-2 md:grid-cols-4 gap-6" stagger={0.1}>
            {[
              { icon:<Shield size={20} className="text-sage" />,       title:'Verified Listings',   desc:'Every property manually reviewed' },
              { icon:<Zap size={20} className="text-gold" />,           title:'AI-Powered Matching', desc:'Pinecone semantic vector search' },
              { icon:<TrendingUp size={20} className="text-terracotta" />,title:'Secure Payments',  desc:'Powered by Paystack & Stripe' },
              { icon:<Star size={20} className="text-deep/50" />,       title:'Pro Vetted Network',  desc:'Licensed and certified professionals' },
            ].map(({ icon, title, desc }) => (
              <StaggerItem key={title}>
                <div className="text-center flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center" style={{backgroundColor:"#FFFAF5"}}>{icon}</div>
                  <p className="text-sm font-semibold text-deep">{title}</p>
                  <p className="text-xs text-deep/40 leading-relaxed">{desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ════════ FINAL CTA ════════ */}
      <section className="py-28 px-6 bg-terracotta relative overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div className="absolute w-[500px] h-[500px] rounded-full opacity-10 bg-white"
            style={{top:'-20%',left:'-10%'}}
            animate={{rotate:360}} transition={{duration:30,repeat:Infinity,ease:'linear'}} />
          <motion.div className="absolute w-[300px] h-[300px] rounded-full opacity-8 bg-white"
            style={{bottom:'-10%',right:'10%'}}
            animate={{rotate:-360}} transition={{duration:20,repeat:Infinity,ease:'linear'}} />
        </div>
        <FadeUp className="relative max-w-2xl mx-auto">
          <motion.div animate={{y:[0,-8,0]}} transition={{duration:2,repeat:Infinity,ease:'easeInOut'}} className="text-5xl mb-6">🏡</motion.div>
          <h2 className="font-display text-5xl md:text-6xl font-black text-white leading-tight mb-5">
            Your perfect deal<br />is already waiting.
          </h2>
          <p className="text-white/70 text-lg mb-10 leading-relaxed">
            Somewhere in Nigeria right now, there is a property that fits your life exactly. And someone like you is looking for it. Let DealMatch bring you together.
          </p>
          <Link to="/auth?tab=signup"
            className="inline-flex items-center gap-3 bg-white text-terracotta font-bold text-lg px-10 py-5 rounded-full shadow-[0_16px_48px_rgba(0,0,0,0.2)] hover:-translate-y-1 hover:shadow-[0_24px_64px_rgba(0,0,0,0.3)] transition-all">
            Find My Match ❤️
          </Link>
          <p className="text-white/40 text-sm mt-5">Free to join · No credit card required</p>
        </FadeUp>
      </section>

      {/* Video modal */}
      {videoOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6"
          onClick={() => setVideoOpen(false)}>
          <div className="w-full max-w-3xl aspect-video bg-deep rounded-3xl flex items-center justify-center"
            onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <p className="text-white/40 text-sm">Video demo coming soon</p>
              <p className="text-white/20 text-xs mt-1">Add your Loom or YouTube embed here</p>
            </div>
          </div>
          <button onClick={() => setVideoOpen(false)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">✕
          </button>
        </div>
      )}
    </div>
  )
}
