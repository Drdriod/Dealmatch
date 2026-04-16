import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { signUp, signIn, signInWithGoogle, resetPassword, supabase } from '@/lib/supabase'
import { analytics } from '@/lib/posthog'
import toast from 'react-hot-toast'
import clsx from 'clsx'

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
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [form, setForm]         = useState({ fullName: '', email: '', password: '', referralCode: params.get('ref') || '' })

  // OTP state
  const [otpSent, setOtpSent]     = useState(false)
  const [otp, setOtp]             = useState(['','','','','',''])
  const [verifying, setVerifying] = useState(false)
  const [signupEmail, setSignupEmail] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  // ─── Sign Up — no role here anymore ──────────────────
  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!form.fullName || !form.email || !form.password) return toast.error('Please fill all fields')
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    setLoading(true)
    const { error } = await signUp({
      email:    form.email,
      password: form.password,
      fullName: form.fullName,
      referralCode: form.referralCode,
    })
    setLoading(false)
    if (error) return toast.error(error.message)
    analytics.signedUp('unknown')
    setSignupEmail(form.email)
    setOtpSent(true)
    toast.success('Check your email for the 6-digit code!')
  }

  // ─── OTP handlers ─────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus()
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

  const handleVerifyOtp = async () => {
    const code = otp.join('')
    if (code.length < 6) return toast.error('Enter the complete 6-digit code')
    setVerifying(true)
    const { error } = await supabase.auth.verifyOtp({
      email: signupEmail,
      token: code,
      type:  'signup',
    })
    setVerifying(false)
    if (error) return toast.error('Invalid code. Please check and try again.')
    toast.success('Email confirmed! Welcome to DealMatch 🎉')
    navigate('/onboarding')
  }

  const handleResendOtp = async () => {
    const { error } = await supabase.auth.resend({ type: 'signup', email: signupEmail })
    if (error) return toast.error(error.message)
    toast.success('New code sent!')
    setOtp(['','','','','',''])
  }

  // ─── Sign In ──────────────────────────────────────────
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

  const handleFacebook = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) toast.error(error.message)
  }

  const handleApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) toast.error(error.message)
  }

  const handleForgotPassword = async () => {
    if (!form.email) return toast.error('Please enter your email address first')
    const { error } = await resetPassword(form.email)
    if (error) return toast.error(error.message)
    toast.success('Password reset link sent to your email!')
  }

  // ─── OTP screen ───────────────────────────────────────
  if (otpSent) {
    return (
      <div style={{backgroundColor:'#FFFAF5'}} className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
            style={{backgroundColor:'rgba(201,106,58,0.1)'}}>📬</div>
          <h1 className="font-display text-3xl font-black mb-2" style={{color:'#1A1210'}}>Check your email</h1>
          <p className="text-sm mb-2 leading-relaxed" style={{color:'#8A7E78'}}>We sent a 6-digit code to</p>
          <p className="font-semibold text-sm mb-8" style={{color:'#C96A3A'}}>{signupEmail}</p>

          <div className="flex gap-3 justify-center mb-8" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input key={i} id={`otp-${i}`} type="text" inputMode="numeric"
                maxLength={1} value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: digit ? '#C96A3A' : '#E8DDD2',
                  color: digit ? '#C96A3A' : '#1A1210',
                }}
                className="w-12 h-14 text-center text-xl font-black rounded-2xl border-2 outline-none transition-all"
              />
            ))}
          </div>

          <button onClick={handleVerifyOtp} disabled={verifying || otp.join('').length < 6}
            className={clsx('btn-primary w-full py-4 text-base mb-4',
              otp.join('').length < 6 && 'opacity-40 cursor-not-allowed'
            )}>
            {verifying ? 'Verifying...' : 'Confirm Email →'}
          </button>

          <p style={{color:'#8A7E78'}} className="text-sm">
            Didn't receive it?{' '}
            <button onClick={handleResendOtp} style={{color:'#C96A3A'}} className="font-semibold hover:underline">
              Resend code
            </button>
          </p>

          <button onClick={() => { setOtpSent(false); setOtp(['','','','','','']) }}
            className="mt-6 flex items-center gap-2 text-sm mx-auto transition-colors"
            style={{color:'#8A7E78'}}>
            <ArrowLeft size={14} /> Back to signup
          </button>
        </div>
      </div>
    )
  }

  // ─── Main auth screen ─────────────────────────────────
  return (
    <div style={{backgroundColor:'#FFFAF5'}} className="min-h-screen flex">

      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-deep flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background:'radial-gradient(ellipse 80% 60% at 30% 60%, rgba(201,106,58,0.2) 0%, transparent 60%)'
        }} />
        <Link to="/" className="font-display text-2xl font-black text-white relative z-10">
          Deal<span style={{color:'#C96A3A'}}>Match</span>
        </Link>
        <div className="relative z-10">
          <p className="font-display text-5xl font-black text-white leading-tight mb-6">
            Your perfect<br /><em style={{color:'#C96A3A'}}>property match</em><br />is waiting.
          </p>
          <div className="flex flex-col gap-4">
            {[
              { icon:'⭕', text:'Smart AI matching based on your lifestyle and goals' },
              { icon:'✅', text:'Verified professionals — surveyors, inspectors, lenders' },
              { icon:'🔒', text:'Secure title verification built into every deal' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                  style={{backgroundColor:'rgba(255,255,255,0.1)'}}>{icon}</div>
                <p className="text-sm" style={{color:'rgba(255,255,255,0.6)'}}>{text}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs relative z-10" style={{color:'rgba(255,255,255,0.2)'}}>
          © {new Date().getFullYear()} DealMatch
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
            style={{color:'rgba(26,18,16,0.4)'}}>
            <ArrowLeft size={14} /> Back to home
          </Link>

          {/* Tabs */}
          <div className="flex rounded-2xl p-1 mb-8" style={{backgroundColor:'rgba(26,18,16,0.05)'}}>
            {[['signin','Sign In'],['signup','Create Account']].map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{
                  backgroundColor: tab === t ? '#FFFFFF' : 'transparent',
                  color: tab === t ? '#1A1210' : 'rgba(26,18,16,0.4)',
                  boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}>
                {l}
              </button>
            ))}
          </div>

          {tab === 'signup' ? (
            <form onSubmit={handleSignUp} className="space-y-5">
              <div>
                <h1 className="font-display text-3xl font-black mb-1" style={{color:'#1A1210'}}>
                  Create account 🏡
                </h1>
                <p className="text-sm" style={{color:'rgba(26,18,16,0.4)'}}>
                  Join thousands finding their perfect match.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block"
                  style={{color:'rgba(26,18,16,0.5)'}}>Full Name</label>
                <input className="input" type="text" placeholder="e.g. John Doe"
                  value={form.fullName} onChange={set('fullName')}
                  style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block"
                  style={{color:'rgba(26,18,16,0.5)'}}>Email Address</label>
                <input className="input" type="email" placeholder="you@example.com"
                  value={form.email} onChange={set('email')}
                  style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block"
                  style={{color:'rgba(26,18,16,0.5)'}}>Referral Code (Optional)</label>
                <input className="input" type="text" placeholder="e.g. DM123456"
                  value={form.referralCode} onChange={set('referralCode')}
                  style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block"
                  style={{color:'rgba(26,18,16,0.5)'}}>Password</label>
                <div className="relative">
                  <input className="input pr-12" type={showPass ? 'text' : 'password'}
                    placeholder="Min. 8 characters" value={form.password} onChange={set('password')}
                    style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{color:'rgba(26,18,16,0.3)'}}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {tab === 'signin' && (
                  <div className="flex justify-end mt-1">
                    <button type="button" onClick={handleForgotPassword}
                      className="text-xs font-semibold hover:underline" style={{color:'#C96A3A'}}>
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full text-base py-4">
                {loading ? 'Creating account...' : 'Continue →'}
              </button>

              <div className="relative text-center text-xs py-2" style={{color:'rgba(26,18,16,0.3)'}}>
                <div className="absolute left-0 top-1/2 w-[42%] h-px" style={{backgroundColor:'rgba(26,18,16,0.1)'}} />
                <div className="absolute right-0 top-1/2 w-[42%] h-px" style={{backgroundColor:'rgba(26,18,16,0.1)'}} />
                or
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button type="button" onClick={handleGoogle}
                  className="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-3 transition-all"
                  style={{border:'1px solid #E8DDD2', backgroundColor:'#FFFFFF', color:'#1A1210'}}>
                  <GoogleIcon /> Continue with Google
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={handleFacebook}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl border font-semibold text-xs transition-all hover:bg-white"
                    style={{borderColor:'#E8DDD2', backgroundColor:'#FFFFFF', color:'#1A1210'}}>
                    🔵 Facebook
                  </button>
                  <button type="button" onClick={handleApple}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl border font-semibold text-xs transition-all hover:bg-white"
                    style={{borderColor:'#E8DDD2', backgroundColor:'#FFFFFF', color:'#1A1210'}}>
                    🍎 Apple
                  </button>
                </div>
              </div>

              <p className="text-xs text-center leading-relaxed" style={{color:'rgba(26,18,16,0.3)'}}>
                By signing up you agree to our{' '}
                <a href="#" style={{color:'#C96A3A'}} className="underline">Terms</a> and{' '}
                <a href="#" style={{color:'#C96A3A'}} className="underline">Privacy Policy</a>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-5">
              <div>
                <h1 className="font-display text-3xl font-black mb-1" style={{color:'#1A1210'}}>
                  Welcome back 👋
                </h1>
                <p className="text-sm" style={{color:'rgba(26,18,16,0.4)'}}>
                  Sign in to your DealMatch account.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block"
                  style={{color:'rgba(26,18,16,0.5)'}}>Email Address</label>
                <input className="input" type="email" placeholder="you@example.com"
                  value={form.email} onChange={set('email')}
                  style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block"
                  style={{color:'rgba(26,18,16,0.5)'}}>Password</label>
                <div className="relative">
                  <input className="input pr-12" type={showPass ? 'text' : 'password'}
                    placeholder="Your password" value={form.password} onChange={set('password')}
                    style={{backgroundColor:'#FFFFFF', color:'#1A1210'}} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{color:'rgba(26,18,16,0.3)'}}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {tab === 'signin' && (
                  <div className="flex justify-end mt-1">
                    <button type="button" onClick={handleForgotPassword}
                      className="text-xs font-semibold hover:underline" style={{color:'#C96A3A'}}>
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full text-base py-4">
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>

              <div className="relative text-center text-xs py-2" style={{color:'rgba(26,18,16,0.3)'}}>
                <div className="absolute left-0 top-1/2 w-[42%] h-px" style={{backgroundColor:'rgba(26,18,16,0.1)'}} />
                <div className="absolute right-0 top-1/2 w-[42%] h-px" style={{backgroundColor:'rgba(26,18,16,0.1)'}} />
                or
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button type="button" onClick={handleGoogle}
                  className="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-3 transition-all"
                  style={{border:'1px solid #E8DDD2', backgroundColor:'#FFFFFF', color:'#1A1210'}}>
                  <GoogleIcon /> Continue with Google
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={handleFacebook}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl border font-semibold text-xs transition-all hover:bg-white"
                    style={{borderColor:'#E8DDD2', backgroundColor:'#FFFFFF', color:'#1A1210'}}>
                    🔵 Facebook
                  </button>
                  <button type="button" onClick={handleApple}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl border font-semibold text-xs transition-all hover:bg-white"
                    style={{borderColor:'#E8DDD2', backgroundColor:'#FFFFFF', color:'#1A1210'}}>
                    🍎 Apple
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
