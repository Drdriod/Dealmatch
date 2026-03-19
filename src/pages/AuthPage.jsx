import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { signUp, signIn, signInWithGoogle } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { analytics } from '@/lib/posthog'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const ROLES = [
  { id: 'buyer',     label: 'Buyer',             emoji: '🏡', desc: 'Looking to buy or invest' },
  { id: 'seller',    label: 'Seller / Developer', emoji: '🏗️', desc: 'Listing properties for sale' },
  { id: 'surveyor',  label: 'Land Surveyor',      emoji: '📐', desc: 'Offering survey services' },
  { id: 'inspector', label: 'Property Inspector', emoji: '🔍', desc: 'Offering inspection services' },
  { id: 'lender',    label: 'Mortgage Lender',    emoji: '🏦', desc: 'Offering financing' },
]

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>
)

export default function AuthPage() {
  const [params]    = useSearchParams()
  const navigate    = useNavigate()
  const [tab, setTab]           = useState(params.get('tab') === 'signup' ? 'signup' : 'signin')
  const [role, setRole]         = useState('buyer')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [form, setForm]         = useState({ fullName: '', email: '', password: '' })

  // OTP state
  const [otpSent, setOtpSent]   = useState(false)
  const [otp, setOtp]           = useState(['', '', '', '', '', ''])
  const [verifying, setVerifying] = useState(false)
  const [signupEmail, setSignupEmail] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  // ─── Sign Up ─────────────────────────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!form.fullName || !form.email || !form.password) return toast.error('Please fill all fields')
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    setLoading(true)
    const { error } = await signUp({
      email: form.email,
      password: form.password,
      metadata: { full_name: form.fullName, role },
    })
    setLoading(false)
    if (error) return toast.error(error.message)
    analytics.signedUp(role)
    setSignupEmail(form.email)
    setOtpSent(true)
    toast.success('Check your email for the 6-digit code!')
  }

  // ─── OTP input handlers ──────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // numbers only
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // one digit per box
    setOtp(newOtp)
    // Auto-focus next box
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    pasted.split('').forEach((digit, i) => { newOtp[i] = digit })
    setOtp(newOtp)
    document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus()
  }

  // ─── Verify OTP ──────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otp.join('')
    if (code.length < 6) return toast.error('Enter the complete 6-digit code')
    setVerifying(true)
    const { error } = await supabase.auth.verifyOtp({
      email: signupEmail,
      token: code,
      type: 'signup',
    })
    setVerifying(false)
    if (error) return toast.error('Invalid code. Please check and try again.')
    toast.success('Email confirmed! Welcome to DealMatch 🎉')
    navigate('/onboarding')
  }

  const handleResendOtp = async () => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: signupEmail,
    })
    if (error) return toast.error(error.message)
    toast.success('New code sent to your email!')
    setOtp(['', '', '', '', '', ''])
  }

  // ─── Sign In ─────────────────────────────────────────
  const handleSignIn = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Please fill all fields')
    setLoading(true)
    const { error } = await signIn({ email: form.email, password: form.password })
    setLoading(false)
    if (error) return toast.error(error.message)
    analytics.signedIn()
    navigate('/browse')
  }

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle()
    if (error) toast.error(error.message)
  }

  // ─── OTP Screen ──────────────────────────────────────
  if (otpSent) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-up text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-terracotta/10 flex items-center justify-center text-4xl mx-auto mb-6">
            📬
          </div>

          <h1 className="font-display text-3xl font-black text-deep mb-2">Check your email</h1>
          <p className="text-deep/50 text-sm mb-2 leading-relaxed">
            We sent a 6-digit code to
          </p>
          <p className="text-terracotta font-semibold text-sm mb-8">{signupEmail}</p>

          {/* OTP boxes */}
          <div className="flex gap-3 justify-center mb-8" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className={clsx(
                  'w-12 h-14 text-center text-xl font-black rounded-2xl border-2 outline-none transition-all bg-white',
                  digit
                    ? 'border-terracotta text-terracotta'
                    : 'border-deep/15 text-deep focus:border-terracotta'
                )}
              />
            ))}
          </div>

          {/* Verify button */}
          <button
            onClick={handleVerifyOtp}
            disabled={verifying || otp.join('').length < 6}
            className={clsx(
              'btn-primary w-full py-4 text-base mb-4',
              otp.join('').length < 6 && 'opacity-40 cursor-not-allowed'
            )}
          >
            {verifying ? 'Verifying...' : 'Confirm Email →'}
          </button>

          {/* Resend */}
          <p className="text-deep/40 text-sm">
            Didn't receive it?{' '}
            <button onClick={handleResendOtp} className="text-terracotta font-semibold hover:underline">
              Resend code
            </button>
          </p>

          {/* Back */}
          <button
            onClick={() => { setOtpSent(false); setOtp(['','','','','','']) }}
            className="mt-6 flex items-center gap-2 text-sm text-deep/40 hover:text-deep transition-colors mx-auto"
          >
            <ArrowLeft size={14} /> Back to signup
          </button>
        </div>
      </div>
    )
  }

  // ─── Main Auth Screen ─────────────────────────────────
  return (
    <div className="min-h-screen bg-cream flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-deep flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 30% 60%, rgba(201,106,58,0.2) 0%, transparent 60%), radial-gradient(ellipse 50% 70% at 80% 20%, rgba(212,168,83,0.1) 0%, transparent 50%)'
        }} />
        <Link to="/" className="font-display text-2xl font-black text-white relative z-10">
          Deal<span className="text-terracotta">Match</span>
        </Link>
        <div className="relative z-10">
          <p className="font-display text-5xl font-black text-white leading-tight mb-6">
            Your perfect<br /><em className="text-terracotta">property match</em><br />is waiting.
          </p>
          <div className="flex flex-col gap-4">
            {[
              { icon: '💘', text: 'Smart AI matching based on your lifestyle and goals' },
              { icon: '✅', text: 'Verified professionals — surveyors, inspectors, lenders' },
              { icon: '🔒', text: 'Secure title verification built into every deal' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm flex-shrink-0">{icon}</div>
                <p className="text-white/60 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/20 text-xs relative z-10">© {new Date().getFullYear()} DealMatch</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:max-w-lg">
        <div className="w-full max-w-md animate-fade-up">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-deep/40 hover:text-deep mb-8 transition-colors">
            <ArrowLeft size={14} /> Back to home
          </Link>

          {/* Tabs */}
          <div className="flex bg-deep/5 rounded-2xl p-1 mb-8">
            {[['signin','Sign In'],['signup','Create Account']].map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)}
                className={clsx('flex-1 py-3 rounded-xl text-sm font-semibold transition-all',
                  tab === t ? 'bg-white text-deep shadow-sm' : 'text-deep/40 hover:text-deep'
                )}>
                {l}
              </button>
            ))}
          </div>

          {tab === 'signup' ? (
            <form onSubmit={handleSignUp} className="space-y-5">
              <div>
                <h1 className="font-display text-3xl font-black mb-1">Create account 🏡</h1>
                <p className="text-deep/40 text-sm">Join thousands finding their perfect match.</p>
              </div>

              {/* Role selector */}
              <div>
                <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-3 block">I am a...</label>
                <div className="grid grid-cols-1 gap-2">
                  {ROLES.map(r => (
                    <button type="button" key={r.id} onClick={() => setRole(r.id)}
                      className={clsx('flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all',
                        role === r.id ? 'border-terracotta bg-terracotta/5' : 'border-deep/8 hover:border-deep/20'
                      )}>
                      <span className="text-xl">{r.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-deep">{r.label}</p>
                        <p className="text-xs text-deep/40">{r.desc}</p>
                      </div>
                      {role === r.id && (
                        <div className="ml-auto w-5 h-5 rounded-full bg-terracotta flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">Full Name</label>
                <input className="input" type="text" placeholder="e.g. Chioma Eze" value={form.fullName} onChange={set('fullName')} />
              </div>
              <div>
                <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">Email Address</label>
                <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
              </div>
              <div>
                <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">Password</label>
                <div className="relative">
                  <input className="input pr-12" type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={set('password')} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-deep/30 hover:text-deep/60">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full text-base py-4">
                {loading ? 'Creating account...' : 'Create Account →'}
              </button>

              <div className="relative text-center text-xs text-deep/30 py-2">
                <div className="absolute left-0 top-1/2 w-[42%] h-px bg-deep/10" />
                <div className="absolute right-0 top-1/2 w-[42%] h-px bg-deep/10" />
                or
              </div>

              <button type="button" onClick={handleGoogle}
                className="w-full py-4 rounded-2xl border border-deep/10 bg-white text-sm font-semibold text-deep hover:border-deep/20 transition-all flex items-center justify-center gap-3">
                <GoogleIcon /> Continue with Google
              </button>

              <p className="text-xs text-deep/30 text-center leading-relaxed">
                By signing up you agree to our <a href="#" className="text-terracotta underline">Terms</a> and <a href="#" className="text-terracotta underline">Privacy Policy</a>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-5">
              <div>
                <h1 className="font-display text-3xl font-black mb-1">Welcome back 👋</h1>
                <p className="text-deep/40 text-sm">Sign in to your DealMatch account.</p>
              </div>
              <div>
                <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">Email Address</label>
                <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
              </div>
              <div>
                <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">Password</label>
                <div className="relative">
                  <input className="input pr-12" type={showPass ? 'text' : 'password'} placeholder="Your password" value={form.password} onChange={set('password')} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-deep/30 hover:text-deep/60">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full text-base py-4">
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
              <div className="relative text-center text-xs text-deep/30 py-2">
                <div className="absolute left-0 top-1/2 w-[42%] h-px bg-deep/10" />
                <div className="absolute right-0 top-1/2 w-[42%] h-px bg-deep/10" />
                or
              </div>
              <button type="button" onClick={handleGoogle}
                className="w-full py-4 rounded-2xl border border-deep/10 bg-white text-sm font-semibold text-deep hover:border-deep/20 transition-all flex items-center justify-center gap-3">
                <GoogleIcon /> Continue with Google
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
