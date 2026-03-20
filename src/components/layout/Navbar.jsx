import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Heart, Search, User, LogOut, Plus, Command } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { signOut } from '@/lib/supabase'
import SearchPalette from '@/components/ui/SearchPalette'
import { ThemeToggle } from '@/context/ThemeContext'
import toast from 'react-hot-toast'

const NAV_LINKS = [
  { to:'/browse',        label:'Buy' },
  { to:'/rentals',       label:'Rent' },
  { to:'/hotels',        label:'Hotels' },
  { to:'/list',          label:'Sell', highlight: true },
  { to:'/professionals', label:'For Pros' },
  { to:'/earn',          label:'Earn 💰', highlight: false, special: true },
]

export default function Navbar() {
  const { isAuthenticated, profile } = useAuth()
  const [scrolled, setScrolled]     = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()
  const navigate  = useNavigate()
  const isHome    = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location])

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(o => !o) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
    navigate('/')
  }

  const navBg     = scrolled || !isHome ? 'rgba(255,250,245,0.97)' : 'transparent'
  const navBorder = scrolled || !isHome ? '1px solid #E8DDD2' : '1px solid transparent'

  return (
    <>
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:50,
        backgroundColor: navBg,
        borderBottom: navBorder,
        backdropFilter: scrolled || !isHome ? 'blur(12px)' : 'none',
        transition: 'all 0.3s ease',
        padding: scrolled || !isHome ? '12px 0' : '20px 0',
        boxShadow: scrolled || !isHome ? '0 2px 20px rgba(26,18,16,0.06)' : 'none',
      }}>
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex items-center gap-4">

          {/* Logo */}
          <Link to="/" className="font-display text-2xl font-black flex-shrink-0" style={{color:'#C96A3A'}}>
            Deal<span style={{color:'#1A1210'}}>Match</span>
          </Link>

          {/* Search */}
          <button onClick={() => setSearchOpen(true)}
            className="hidden md:flex flex-1 max-w-xs items-center gap-3 px-4 py-2.5 rounded-2xl text-left transition-colors"
            style={{backgroundColor:'rgba(26,18,16,0.05)'}}>
            <Search size={14} style={{color:'rgba(26,18,16,0.3)', flexShrink:0}} />
            <span className="flex-1 text-sm" style={{color:'rgba(26,18,16,0.3)'}}>Search properties...</span>
            <kbd className="hidden lg:flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-mono"
              style={{color:'rgba(26,18,16,0.2)', backgroundColor:'rgba(26,18,16,0.08)'}}>
              <Command size={9} />K
            </kbd>
          </button>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-4 ml-auto">
            {NAV_LINKS.map(link => (
              <Link key={link.to} to={link.to}
                className="text-sm font-medium transition-all hover:opacity-90 px-3 py-1.5 rounded-full"
                style={{
                  color: link.highlight ? '#FFFFFF' : link.special ? '#D4A853' : 'rgba(26,18,16,0.65)',
                  backgroundColor: link.highlight ? '#C96A3A' : 'transparent',
                  fontWeight: link.highlight || link.special ? 600 : 500,
                  boxShadow: link.highlight ? '0 4px 12px rgba(201,106,58,0.3)' : 'none',
                }}>
                {link.label}
              </Link>
            ))}

            <ThemeToggle />

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/matches"
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl transition-all"
                  style={{color:'rgba(26,18,16,0.6)'}}>
                  <Heart size={15} /> Matches
                </Link>
                <div className="relative group">
                  <button className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden"
                    style={{backgroundColor:'rgba(201,106,58,0.1)', border:'2px solid transparent'}}>
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <User size={15} style={{color:'#C96A3A'}} />
                    }
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0"
                    style={{backgroundColor:'#FFFAF5', boxShadow:'0 20px 60px rgba(26,18,16,0.15)', border:'1px solid #E8DDD2'}}>
                    <div className="px-4 py-3 border-b" style={{borderColor:'#E8DDD2'}}>
                      <p className="text-xs font-semibold truncate" style={{color:'#1A1210'}}>{profile?.full_name || 'Your Account'}</p>
                      <p className="text-xs truncate mt-0.5 capitalize" style={{color:'#8A7E78'}}>{profile?.role}</p>
                    </div>
                    <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-[#F0E6D6]" style={{color:'#5C4A3A'}}>📊 Dashboard</Link>
                    <Link to="/profile"   className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-[#F0E6D6]" style={{color:'#5C4A3A'}}><User size={14} /> Profile</Link>
                    <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-[#F0E6D6]" style={{color:'#C96A3A'}}>
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/auth" className="text-sm font-medium transition-colors" style={{color:'rgba(26,18,16,0.6)'}}>Sign In</Link>
                <Link to="/auth?tab=signup" className="btn-primary text-sm px-5 py-2.5">Get Started</Link>
              </div>
            )}
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-2 ml-auto">
            <button onClick={() => setSearchOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-full">
              <Search size={18} style={{color:'rgba(26,18,16,0.6)'}} />
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 flex items-center justify-center rounded-full">
              {menuOpen ? <X size={20} style={{color:'#1A1210'}} /> : <Menu size={20} style={{color:'#1A1210'}} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
              transition={{duration:0.2}} className="md:hidden overflow-hidden border-t"
              style={{backgroundColor:'#FFFAF5', borderColor:'#E8DDD2'}}>
              <div className="px-5 py-5 flex flex-col gap-1">
                {NAV_LINKS.map(link => (
                  <Link key={link.to} to={link.to}
                    className="text-base font-medium py-3 border-b"
                    style={{
                      color: link.highlight ? '#C96A3A' : '#1A1210',
                      borderColor:'#E8DDD2',
                      fontWeight: link.highlight ? 700 : 500,
                    }}>
                    {link.label} {link.highlight ? '→' : ''}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <>
                    <Link to="/matches"   className="text-base font-medium py-3 border-b" style={{color:'#1A1210', borderColor:'#E8DDD2'}}>My Matches</Link>
                    <Link to="/dashboard" className="text-base font-medium py-3 border-b" style={{color:'#1A1210', borderColor:'#E8DDD2'}}>Dashboard</Link>
                    <Link to="/profile"   className="text-base font-medium py-3 border-b" style={{color:'#1A1210', borderColor:'#E8DDD2'}}>Profile</Link>
                    <button onClick={handleSignOut} className="text-left text-base font-medium py-3" style={{color:'#C96A3A'}}>Sign Out</button>
                  </>
                ) : (
                  <>
                    <Link to="/auth" className="text-base font-medium py-3 border-b" style={{color:'#1A1210', borderColor:'#E8DDD2'}}>Sign In</Link>
                    <Link to="/auth?tab=signup" className="btn-primary text-center text-sm mt-3">Get Started Free</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <SearchPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
