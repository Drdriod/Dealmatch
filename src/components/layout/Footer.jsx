import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-deep text-white">
      <div className="max-w-7xl mx-auto px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="font-display text-3xl font-black mb-4">
              Deal<span className="text-terracotta">Match</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Nigeria's smartest real estate matching platform. Find your perfect property, connect with verified professionals, and close with confidence.
            </p>
            <div className="flex gap-3 mt-6">
              {['𝕏', 'in', '📘'].map((icon, i) => (
                <button key={i} className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-sm transition-colors">
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-white/30 mb-5">Platform</h4>
            <ul className="space-y-3">
              {['Browse Deals', 'My Matches', 'List a Property', 'Deal Alerts', 'How It Works'].map(item => (
                <li key={item}><a href="#" className="text-sm text-white/50 hover:text-blush transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-white/30 mb-5">Professionals</h4>
            <ul className="space-y-3">
              {['Land Surveyors', 'Property Inspectors', 'Mortgage Lenders', 'Real Estate Agents', 'Developers'].map(item => (
                <li key={item}><a href="#" className="text-sm text-white/50 hover:text-blush transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/8 pt-8 flex flex-col md:flex-row justify-between gap-4 text-xs text-white/25">
          <div>
          <p>© {new Date().getFullYear()} DealMatch. All rights reserved.</p>
          <p className="mt-1 text-xs" style={{color:'rgba(255,255,255,0.2)'}}>Every match is a connection, every connection is a home ❤️</p>
        </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white/50 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white/50 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white/50 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
      {/* Legal links */}
        <div className="border-t mt-8 pt-6 flex flex-wrap justify-center gap-4 text-xs" style={{borderColor:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.3)'}}>
        <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
        <span>·</span>
        <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
        <span>·</span>
        <a href="/escrow" className="hover:text-white transition-colors">Escrow</a>
        <span>·</span>
        <a href="/earn" className="hover:text-white transition-colors">Earn 💰</a>
        <span>·</span>
        <span>© {new Date().getFullYear()} DealMatch</span>
      </div>
    </footer>
  )
}
