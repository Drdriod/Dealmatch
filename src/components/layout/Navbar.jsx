import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Heart, Search, User, LogOut, Plus, Command } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { signOut } from '@/lib/supabase'
import SearchPalette from '@/components/ui/SearchPalette'
import { ThemeToggle } from '@/context/ThemeContext'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function Navbar() {
  const { isAuthenticated, profile } = useAuth()
  const [scrolled, setScrolled]       = useState(false)
  const [menuOpen, setMenuOpen]       = useState(false)
  const [searchOpen, setSearchOpen]   = useState(false)
  const location = useLocation()
  const navigate  = useNavigate()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location])

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(o => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <>
      <nav className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled || !isHome
          ? 'bg-cream/95 backdrop-blur-xl border-b border-deep/8 py-3 shadow-sm'
          : 'bg-transparent py-5'
      )}>
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex items-center gap-4">

          {/* Logo */}
          <Link to="/" className="font-display text-2xl font-black text-terracotta flex-shrink-0">
            Deal<span className="text-deep">Match</span>
          </Link>

          {/* Search bar — desktop */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex flex-1 max-w-xs items-center gap-3 px-4 py-2.5 bg-deep/5 hover:bg-deep/8 rounded-2xl text-left transition-colors group"
          >
            <Search size={14} className="text-deep/30 flex-shrink-0" />
            <span className="flex-1 text-sm text-deep/30">Search properties...</span>
            <kbd className="hidden lg:flex items-center gap-0.5 text-[10px] text-deep/20 bg-deep/8 px-1.5 py-0.5 rounded font-mono">
              <Command size={9} />K
            </kbd>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 ml-auto">
            <Link to="/browse"        className="text-sm font-medium text-deep/60 hover:text-deep transition-colors">Browse</Link>
            <Link to="/professionals" className="text-sm font-medium text-deep/60 hover:text-deep transition-colors">For Pros</Link>

            <ThemeToggle />

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/matches" className="flex items-center gap-1.5 text-sm font-medium text-deep/60 hover:text-deep px-3 py-2 rounded-xl hover:bg-deep/5 transition-all">
                  <Heart size={15} /> Matches
                </Link>
                <Link to="/list" className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border border-deep/15 hover:border-terracotta hover:bg-terracotta/5 text-deep transition-all">
                  <Plus size={14} /> List
                </Link>

                {/* Avatar dropdown */}
                <div className="relative group">
                  <button className="w-9 h-9 rounded-full bg-terracotta/10 flex items-center justify-center hover:bg-terracotta/20 transition-colors overflow-hidden border-2 border-transparent hover:border-terracotta/30">
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <User size={15} className="text-terracotta" />
                    }
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-card-hover overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0 border border-deep/8">
                    <div className="px-4 py-3 border-b border-deep/5">
                      <p className="text-xs font-semibold text-deep truncate">{profile?.full_name || 'Your Account'}</p>
                      <p className="text-xs text-deep/40 truncate mt-0.5">{profile?.role}</p>
                    </div>
                    <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-cream transition-colors">📊 Dashboard</Link>
                    <Link to="/profile"   className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-cream transition-colors"><User size={14} /> Profile</Link>
                    <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-terracotta hover:bg-terracotta/5 transition-colors">
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/auth" className="text-sm font-medium text-deep/60 hover:text-deep transition-colors">Sign In</Link>
                <Link to="/auth?tab=signup" className="btn-primary text-sm px-5 py-2.5">Get Started</Link>
              </div>
            )}
          </div>

          {/* Mobile: search + menu */}
          <div className="md:hidden flex items-center gap-2 ml-auto">
            <button onClick={() => setSearchOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-deep/5 transition-colors">
              <Search size={18} className="text-deep/60" />
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-deep/5 transition-colors">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-cream/98 backdrop-blur-xl border-t border-deep/8 overflow-hidden"
            >
              <div className="px-5 py-5 flex flex-col gap-1">
                <Link to="/browse"        className="text-base font-medium py-3 border-b border-deep/5">Browse Deals</Link>
                <Link to="/professionals" className="text-base font-medium py-3 border-b border-deep/5">For Professionals</Link>
                {isAuthenticated ? (
                  <>
                    <Link to="/matches"   className="text-base font-medium py-3 border-b border-deep/5">My Matches</Link>
                    <Link to="/dashboard" className="text-base font-medium py-3 border-b border-deep/5">Dashboard</Link>
                    <Link to="/list"      className="text-base font-medium py-3 border-b border-deep/5">List Property</Link>
                    <Link to="/profile"   className="text-base font-medium py-3 border-b border-deep/5">Profile</Link>
                    <button onClick={handleSignOut} className="text-left text-base font-medium py-3 text-terracotta">Sign Out</button>
                  </>
                ) : (
                  <>
                    <Link to="/auth" className="text-base font-medium py-3 border-b border-deep/5">Sign In</Link>
                    <Link to="/auth?tab=signup" className="btn-primary text-center text-sm mt-3">Get Started Free</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Search palette */}
      <SearchPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
