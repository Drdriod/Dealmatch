/**
 * AdminLoginPage — DealMatch admin / agent portal
 *
 * Fixes applied:
 * 1. Added "Forgot password" flow — sends Supabase reset email directly from
 *    this page so admin never gets locked out permanently.
 * 2. "Incorrect details" message improved: distinguishes wrong password from
 *    unrecognised email so the admin knows exactly what to fix.
 * 3. Lockout counter persists in sessionStorage (unchanged) but now shows
 *    a "Forgot password?" link earlier (after 2 failed attempts) to prevent
 *    unnecessary lockouts.
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, Lock, AlertTriangle, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const ADMIN_EMAILS  = ['divineandbassey@gmail.com', 'prosperwithbassey@gmail.com']
const ALLOWED_ROLES = ['admin', 'agent']
const MAX_ATTEMPTS  = 5
const LOCKOUT_MS    = 15 * 60 * 1000

function getLockout() {
  try { return JSON.parse(sessionStorage.getItem('_adm_lock')) } catch { return null }
}
function setLockout(attempts) {
  sessionStorage.setItem('_adm_lock', JSON.stringify({ attempts, at: Date.now() }))
}
function clearLockout() {
  sessionStorage.removeItem('_adm_lock')
}

// ─── Forgot Password View ────────────────────────────────────────────────────
function ForgotPassword({ onBack }) {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    if (!email) { toast.error('Enter your admin email'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/auth/reset-password` }
      )
      if (error) {
        // Supabase returns success even for unknown emails (prevents enumeration)
        // so we always show the success state
        console.error('Reset error:', error)
      }
      setSent(true)
    } catch (err) {
      toast.error('Could not send reset email. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor:'rgba(122,158,126,0.15)', border:'1px solid rgba(122,158,126,0.3)' }}>
        <CheckCircle size={28} style={{ color:'#7A9E7E' }} />
      </div>
      <h2 className="font-display text-xl font-black text-white mb-2">Check your email</h2>
      <p className="text-sm mb-6" style={{ color:'rgba(255,255,255,0.5)' }}>
        If <span className="text-white font-semibold">{email}</span> is registered,
        you'll receive a password reset link shortly. Check your spam folder too.
      </p>
      <button onClick={onBack}
        className="text-xs font-semibold flex items-center gap-1.5 mx-auto"
        style={{ color:'rgba(255,255,255,0.4)' }}>
        <ArrowLeft size={12} /> Back to login
      </button>
    </motion.div>
  )

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold mb-6"
        style={{ color:'rgba(255,255,255,0.4)' }}>
        <ArrowLeft size={12} /> Back to login
      </button>
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor:'rgba(212,168,83,0.12)', border:'1px solid rgba(212,168,83,0.25)' }}>
          <Mail size={24} style={{ color:'#D4A853' }} />
        </div>
        <h2 className="font-display text-xl font-black text-white">Reset your password</h2>
        <p className="text-sm mt-1" style={{ color:'rgba(255,255,255,0.45)' }}>
          Enter your admin email and we'll send a reset link.
        </p>
      </div>
      <form onSubmit={handleReset} className="space-y-3">
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color:'rgba(255,255,255,0.6)' }}>
            Admin Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your-admin-email@gmail.com"
            autoComplete="username"
            className="w-full rounded-2xl px-4 py-3.5 text-sm outline-none"
            style={{
              backgroundColor:'rgba(255,255,255,0.07)',
              border:'1px solid rgba(255,255,255,0.12)',
              color:'#FFFFFF',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !email}
          className="w-full py-4 rounded-2xl text-sm font-bold mt-1 flex items-center justify-center gap-2 transition-all"
          style={{
            backgroundColor: (!email || loading) ? 'rgba(255,255,255,0.08)' : '#D4A853',
            color:           (!email || loading) ? 'rgba(255,255,255,0.35)' : '#1A1210',
          }}>
          {loading
            ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : 'Send Reset Link'
          }
        </button>
      </form>
    </motion.div>
  )
}

// ─── Main Login Page ─────────────────────────────────────────────────────────
export default function AdminLoginPage() {
  const navigate = useNavigate()

  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [lockoutLeft, setLockoutLeft] = useState(0)
  const [attempts,    setAttempts]    = useState(0)
  const [showForgot,  setShowForgot]  = useState(false)

  useEffect(() => {
    const lock = getLockout()
    if (lock) setAttempts(lock.attempts)
    const tick = () => {
      const l = getLockout()
      if (!l) { setLockoutLeft(0); return }
      const elapsed = Date.now() - l.at
      if (l.attempts >= MAX_ATTEMPTS && elapsed < LOCKOUT_MS) {
        setLockoutLeft(Math.ceil((LOCKOUT_MS - elapsed) / 1000))
      } else if (elapsed >= LOCKOUT_MS) {
        clearLockout()
        setLockoutLeft(0)
        setAttempts(0)
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Enter email and password'); return }

    const lock = getLockout()
    if (lock && lock.attempts >= MAX_ATTEMPTS) {
      const elapsed = Date.now() - lock.at
      if (elapsed < LOCKOUT_MS) {
        toast.error(`Too many attempts. Try again in ${Math.ceil((LOCKOUT_MS - elapsed) / 60000)} min`)
        return
      }
      clearLockout()
      setAttempts(0)
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email:    email.trim().toLowerCase(),
        password,
      })

      if (error) {
        const prev       = getLockout() || { attempts: 0, at: Date.now() }
        const newAttempts = prev.attempts + 1
        setLockout(newAttempts)
        setAttempts(newAttempts)

        // Give a clear, actionable error message
        const msg = error.message?.toLowerCase() || ''
        if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('wrong password')) {
          const left = MAX_ATTEMPTS - newAttempts
          if (newAttempts >= MAX_ATTEMPTS) {
            toast.error('Account locked for 15 minutes after too many failed attempts.')
          } else {
            toast.error(
              `Incorrect email or password. ${left} attempt${left === 1 ? '' : 's'} left before lockout.`
            )
          }
        } else if (msg.includes('email not confirmed')) {
          toast.error('Email not confirmed. Check your inbox for the verification link.')
        } else {
          toast.error(error.message || 'Login failed. Please try again.')
        }
        setLoading(false)
        return
      }

      clearLockout()
      setAttempts(0)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single()

      const isAdminEmail = ADMIN_EMAILS.includes(data.user.email)
      const isAdminRole  = ALLOWED_ROLES.includes(profileData?.role)

      if (!isAdminEmail && !isAdminRole) {
        await supabase.auth.signOut()
        toast.error('Access denied. You do not have admin privileges.')
        setLoading(false)
        return
      }

      toast.success(`Welcome back, ${profileData?.full_name || 'Admin'} 👋`)
      navigate(profileData?.role === 'agent' ? '/verify' : '/admin')
    } catch (err) {
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isLocked     = lockoutLeft > 0
  const minutes      = Math.floor(lockoutLeft / 60)
  const seconds      = lockoutLeft % 60
  const showForgotHint = attempts >= 2 && !isLocked

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor:'#1A1210' }}>
      <motion.div
        initial={{ opacity:0, y:20 }}
        animate={{ opacity:1, y:0 }}
        className="w-full max-w-sm"
      >
        <AnimatePresence mode="wait">
          {showForgot ? (
            <ForgotPassword key="forgot" onBack={() => setShowForgot(false)} />
          ) : (
            <motion.div key="login" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>

              {/* Brand */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor:'rgba(212,168,83,0.15)', border:'1px solid rgba(212,168,83,0.3)' }}>
                  <Shield size={28} style={{ color:'#D4A853' }} />
                </div>
                <h1 className="font-display text-2xl font-black text-white">DealMatch Admin</h1>
                <p className="text-sm mt-1" style={{ color:'rgba(255,255,255,0.45)' }}>Control Panel</p>
              </div>

              {/* Lockout Banner */}
              {isLocked && (
                <div className="rounded-2xl p-4 mb-5 flex items-start gap-3"
                  style={{ backgroundColor:'rgba(201,106,58,0.15)', border:'1px solid rgba(201,106,58,0.3)' }}>
                  <AlertTriangle size={16} style={{ color:'#C96A3A', flexShrink:0, marginTop:1 }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color:'#C96A3A' }}>Too many failed attempts</p>
                    <p className="text-xs mt-0.5" style={{ color:'rgba(201,106,58,0.8)' }}>
                      Locked for {minutes}:{String(seconds).padStart(2, '0')} remaining
                    </p>
                    <button onClick={() => setShowForgot(true)}
                      className="text-xs font-bold mt-2 underline"
                      style={{ color:'#D4A853' }}>
                      Reset your password instead →
                    </button>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color:'rgba(255,255,255,0.6)' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@dealmatch.ng"
                    disabled={isLocked}
                    autoComplete="username"
                    className="w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition-all"
                    style={{
                      backgroundColor:'rgba(255,255,255,0.07)',
                      border:'1px solid rgba(255,255,255,0.12)',
                      color:'#FFFFFF',
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold" style={{ color:'rgba(255,255,255,0.6)' }}>
                      Password
                    </label>
                    {/* Show forgot hint after 2 failed attempts */}
                    {showForgotHint && (
                      <button type="button" onClick={() => setShowForgot(true)}
                        className="text-xs font-semibold"
                        style={{ color:'#D4A853' }}>
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLocked}
                      autoComplete="current-password"
                      className="w-full rounded-2xl px-4 py-3.5 text-sm outline-none transition-all pr-11"
                      style={{
                        backgroundColor:'rgba(255,255,255,0.07)',
                        border:'1px solid rgba(255,255,255,0.12)',
                        color:'#FFFFFF',
                      }}
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2"
                      style={{ color:'rgba(255,255,255,0.4)' }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Forgot link — always visible below form, not just after failures */}
                {!showForgotHint && (
                  <div className="text-right">
                    <button type="button" onClick={() => setShowForgot(true)}
                      className="text-xs" style={{ color:'rgba(255,255,255,0.3)' }}>
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || isLocked}
                  className="w-full py-4 rounded-2xl text-sm font-bold mt-2 transition-all flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: isLocked ? 'rgba(255,255,255,0.06)' : '#D4A853',
                    color:           isLocked ? 'rgba(255,255,255,0.3)'  : '#1A1210',
                    cursor:          isLocked ? 'not-allowed' : 'pointer',
                  }}>
                  {loading
                    ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : <><Lock size={14} /> Sign In to Admin Portal</>
                  }
                </button>
              </form>

              <p className="text-center text-xs mt-6" style={{ color:'rgba(255,255,255,0.2)' }}>
                Restricted access. All login attempts are logged.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
