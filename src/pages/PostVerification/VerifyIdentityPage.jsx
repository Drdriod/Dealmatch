/**
 * VerifyIdentityPage — /verify-identity
 * ══════════════════════════════════════
 * Universal identity verification for ALL non-student roles.
 *
 * ROLE SYSTEM:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ Role         │ Verification Required For                        │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ buyer        │ Expressing interest in buying / deal agreements  │
 * │ seller       │ Listing a property for sale                      │
 * │ renter       │ Signing tenancy agreements / escrow payments     │
 * │ landlord     │ Listing properties / receiving escrow payouts    │
 * │ investor     │ Deal agreements / escrow payments                │
 * │ agent        │ All client-facing deal actions                   │
 * │ lender       │ All lending and mortgage actions                 │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * SKIP POLICY:
 * - Users may skip verification to browse, swipe, book hotels/short-lets
 * - Verification wall blocks ONLY: buying interest, listing, tenancy, escrow
 * - Skip preference is stored in profile.verification_skipped = true
 * - On any blocked action, user is redirected back here
 *
 * STUDENT CONFLICT:
 * - Students use /student-verify (separate flow, separate table)
 * - This page is shown only to non-student roles
 * - Students who also want to buy/sell use BOTH flows independently
 */

import React, { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Shield, Camera, Upload, Check, ArrowRight, X,
  ArrowLeft, Info, Lock, Eye, SkipForward,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const ID_TYPES = [
  { id:'nin',      label:'NIN Slip / Card',        emoji:'🪪' },
  { id:'voters',   label:"Voter's Card",            emoji:'🗳️' },
  { id:'passport', label:'International Passport',  emoji:'🛂' },
  { id:'drivers',  label:"Driver's License",        emoji:'🚗' },
]

// What each role needs to verify for
const ROLE_LABELS = {
  buyer:    'express interest in buying a property',
  seller:   'list your property for sale',
  renter:   'sign tenancy agreements and make escrow payments',
  landlord: 'list properties and receive escrow payouts',
  investor: 'make deal agreements and escrow payments',
  agent:    'act on behalf of clients in deals',
  lender:   'approve and manage mortgage applications',
}

export default function VerifyIdentityPage() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const idFileRef = useRef(null)

  // Where to redirect after skip or completion
  const returnTo = location.state?.returnTo || null

  const [step,        setStep]        = useState(0) // 0=intro, 1=ID, 2=face, 3=done
  const [idType,      setIdType]      = useState('')
  const [idFile,      setIdFile]      = useState(null)
  const [idPreview,   setIdPreview]   = useState(null)
  const [faceCapture, setFaceCapture] = useState(null)
  const [streaming,   setStreaming]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [cameraErr,   setCameraErr]   = useState('')
  const [skipping,    setSkipping]    = useState(false)

  const role      = profile?.role || 'buyer'
  const roleLabel = ROLE_LABELS[role] || 'complete transactions'
  const alreadySubmitted = profile?.identity_verification_status === 'submitted'
  const alreadyVerified  = profile?.is_photo_verified && profile?.is_live_verified

  // ── Skip verification ────────────────────────────────────────────
  const handleSkip = async () => {
    setSkipping(true)
    try {
      await supabase.from('profiles')
        .update({ verification_skipped: true })
        .eq('id', user.id)
      await refreshProfile()
      toast('Verification skipped. You can verify anytime from your profile.', {
        icon: 'ℹ️', duration: 4000,
      })
      if (returnTo) {
        navigate(returnTo, { replace: true })
      } else {
        // Route to role-appropriate home
        if (role === 'landlord' || role === 'seller') navigate('/landlord', { replace: true })
        else if (role === 'lender') navigate('/lender', { replace: true })
        else navigate('/browse', { replace: true })
      }
    } catch {
      toast.error('Could not skip. Please try again.')
    }
    setSkipping(false)
  }

  // ── ID document upload ───────────────────────────────────────────
  const handleIdUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      toast.error('Please upload a JPG, PNG or WEBP image'); return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB'); return
    }
    setIdFile(file)
    setIdPreview(URL.createObjectURL(file))
  }

  // ── Webcam liveness ───────────────────────────────────────────────
  const startCamera = async () => {
    setCameraErr('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode:'user', width:480, height:360 },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setStreaming(true)
      }
    } catch {
      setCameraErr('Camera access denied. Please allow camera access in your browser settings.')
    }
  }

  const stopCamera = () => {
    videoRef.current?.srcObject?.getTracks().forEach(t => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setStreaming(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    canvasRef.current.width  = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    ctx.drawImage(videoRef.current, 0, 0)
    setFaceCapture(canvasRef.current.toDataURL('image/jpeg', 0.85))
    stopCamera()
    toast.success('Face captured! ✅')
  }

  const retakePhoto = () => {
    setFaceCapture(null)
    startCamera()
  }

  // ── Final submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!idFile && !idPreview) { toast.error('Please upload your ID document'); return }
    if (!faceCapture) { toast.error('Please take a selfie'); return }
    if (!idType) { toast.error('Please select your ID type'); return }
    setSaving(true)

    try {
      const { data: freshProfile } = await supabase
        .from('profiles').select('is_live_verified').eq('id', user.id).single()
      if (freshProfile?.is_live_verified) {
        toast.success('You are already verified!')
        navigate(returnTo || '/browse', { replace: true })
        return
      }

      // Upload ID doc
      const idPath  = `identity-docs/${user.id}/id_${Date.now()}.jpg`
      const facePath = `identity-docs/${user.id}/face_${Date.now()}.jpg`
      let   idBucket = 'identity-docs', faceBucket = 'identity-docs'

      if (idFile) {
        let { error: idErr } = await supabase.storage.from('identity-docs').upload(idPath, idFile, { upsert:true })
        if (idErr) {
          await supabase.storage.from('avatars').upload(idPath, idFile, { upsert:true })
          idBucket = 'avatars'
        }
      }

      // Upload selfie
      const faceResponse = await fetch(faceCapture)
      const faceBlob = await faceResponse.blob()
      let { error: faceErr } = await supabase.storage.from('identity-docs').upload(facePath, faceBlob, { upsert:true, contentType:'image/jpeg' })
      if (faceErr) {
        await supabase.storage.from('avatars').upload(facePath, faceBlob, { upsert:true, contentType:'image/jpeg' })
        faceBucket = 'avatars'
      }

      const { data: idUrl }   = supabase.storage.from(idBucket).getPublicUrl(idPath)
      const { data: faceUrl } = supabase.storage.from(faceBucket).getPublicUrl(facePath)

      await supabase.from('profiles').update({
        identity_photo_url:           idUrl.publicUrl,
        identity_selfie_url:          faceUrl.publicUrl,
        identity_doc_type:            idType,
        identity_verification_status: 'submitted',
        verification_skipped:         false,
        // SECURITY: is_photo_verified / is_live_verified set ONLY by admin
      }).eq('id', user.id)

      await refreshProfile()
      setStep(3)

    } catch (err) {
      console.error('Identity verification error:', err)
      toast.error('Submission failed — please try again')
    } finally {
      setSaving(false)
    }
  }

  const handleDone = () => {
    if (returnTo) navigate(returnTo, { replace: true })
    else if (role === 'landlord' || role === 'seller') navigate('/landlord', { replace: true })
    else if (role === 'lender') navigate('/lender', { replace: true })
    else navigate('/browse', { replace: true })
  }

  // Already verified
  if (alreadyVerified) {
    return (
      <div style={{ backgroundColor:'#FFFAF5', minHeight:'100vh', paddingTop:80 }}>
        <div className="max-w-sm mx-auto px-5 py-10 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor:'rgba(122,158,126,0.12)' }}>
            <Shield size={36} style={{ color:'#7A9E7E' }} />
          </div>
          <h1 className="font-display font-black text-2xl mb-2" style={{ color:'#1A1210' }}>You're Verified ✅</h1>
          <p className="text-sm mb-8" style={{ color:'#8A7E78' }}>
            Your identity has been verified. You have full access to all DealMatch features.
          </p>
          <button onClick={handleDone}
            className="w-full py-4 rounded-2xl font-bold text-white"
            style={{ backgroundColor:'#C96A3A' }}>
            Continue →
          </button>
        </div>
      </div>
    )
  }

  // Already submitted, pending review
  if (alreadySubmitted && step !== 3) {
    return (
      <div style={{ backgroundColor:'#FFFAF5', minHeight:'100vh', paddingTop:80 }}>
        <div className="max-w-sm mx-auto px-5 py-10 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor:'rgba(212,168,83,0.12)' }}>
            <Shield size={36} style={{ color:'#D4A853' }} />
          </div>
          <h1 className="font-display font-black text-2xl mb-2" style={{ color:'#1A1210' }}>Under Review</h1>
          <p className="text-sm mb-4" style={{ color:'#8A7E78' }}>
            Your identity documents were submitted and are being reviewed. This usually takes under 24 hours.
          </p>
          <div className="rounded-2xl p-4 mb-8 text-left"
            style={{ backgroundColor:'rgba(212,168,83,0.08)', border:'1px solid rgba(212,168,83,0.2)' }}>
            <p className="text-xs font-semibold" style={{ color:'#D4A853' }}>What you can do while waiting:</p>
            <ul className="text-xs mt-2 space-y-1" style={{ color:'#8A7E78' }}>
              <li>• Browse and swipe properties</li>
              <li>• Book hotels and short-lets</li>
              <li>• Message matched contacts</li>
            </ul>
          </div>
          <button onClick={handleDone}
            className="w-full py-4 rounded-2xl font-bold text-white"
            style={{ backgroundColor:'#1A1210' }}>
            Continue Browsing →
          </button>
        </div>
      </div>
    )
  }

  // ── Step 3: Done ─────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div style={{ backgroundColor:'#FFFAF5', minHeight:'100vh', paddingTop:80 }}>
        <div className="max-w-sm mx-auto px-5 py-10 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor:'rgba(122,158,126,0.12)' }}>
            <Check size={36} style={{ color:'#7A9E7E' }} />
          </div>
          <h1 className="font-display font-black text-2xl mb-2" style={{ color:'#1A1210' }}>Submitted!</h1>
          <p className="text-sm mb-4" style={{ color:'#8A7E78' }}>
            Your ID and selfie have been uploaded. Our team will verify you within 24 hours.
          </p>
          <p className="text-xs mb-8 p-3 rounded-xl" style={{ color:'#8A7E78', backgroundColor:'rgba(26,18,16,0.04)' }}>
            You'll be able to {roleLabel} as soon as your verification is approved.
          </p>
          <button onClick={handleDone}
            className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
            style={{ backgroundColor:'#C96A3A' }}>
            {role === 'landlord' || role === 'seller' ? 'List Your First Property →' : 'Start Browsing →'}
          </button>
        </div>
      </div>
    )
  }

  // ── Step 0: Intro ─────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div style={{ backgroundColor:'#FFFAF5', minHeight:'100vh', paddingTop:72 }}>
        <div className="max-w-sm mx-auto px-5 py-8">
          {/* Back button */}
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm mb-8"
            style={{ color:'rgba(26,18,16,0.4)' }}>
            <ArrowLeft size={14} /> Back
          </button>

          {/* Hero */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor:'rgba(201,106,58,0.1)' }}>
              <Shield size={36} style={{ color:'#C96A3A' }} />
            </div>
            <h1 className="font-display font-black text-3xl mb-2" style={{ color:'#1A1210' }}>Verify Your Identity</h1>
            <p className="text-sm" style={{ color:'#8A7E78' }}>
              Required to {roleLabel}. Takes about 2 minutes.
            </p>
          </div>

          {/* What you need */}
          <div className="space-y-3 mb-6">
            {[
              { icon:'🪪', title:'Government-issued ID', desc:'NIN slip, voter\'s card, passport, or driver\'s license' },
              { icon:'🤳', title:'A quick selfie', desc:'Your phone camera — no special equipment needed' },
              { icon:'⏱️', title:'24-hour review', desc:'Our team reviews submissions manually for your security' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3 p-4 rounded-2xl"
                style={{ backgroundColor:'rgba(26,18,16,0.03)', border:'1px solid #E8DDD2' }}>
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color:'#1A1210' }}>{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color:'#8A7E78' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2 p-3 rounded-xl mb-6"
            style={{ backgroundColor:'rgba(122,158,126,0.06)', border:'1px solid rgba(122,158,126,0.2)' }}>
            <Lock size={13} style={{ color:'#7A9E7E', flexShrink:0, marginTop:2 }} />
            <p className="text-xs" style={{ color:'#8A7E78' }}>
              Your ID is stored encrypted and never shared publicly. Only used to confirm you are a real person.
            </p>
          </div>

          {/* What requires verification */}
          <div className="p-4 rounded-2xl mb-6"
            style={{ backgroundColor:'rgba(201,106,58,0.05)', border:'1px solid rgba(201,106,58,0.15)' }}>
            <p className="text-xs font-bold mb-2" style={{ color:'#C96A3A' }}>
              <Lock size={11} className="inline mr-1" />Requires verification
            </p>
            <ul className="text-xs space-y-1" style={{ color:'#8A7E78' }}>
              <li>• Expressing interest in buying a property</li>
              <li>• Listing a property for sale or rent</li>
              <li>• Signing tenancy agreements</li>
              <li>• Making or receiving escrow payments</li>
            </ul>
            <p className="text-xs font-bold mt-3 mb-1" style={{ color:'#7A9E7E' }}>
              <Eye size={11} className="inline mr-1" />Free without verification
            </p>
            <ul className="text-xs space-y-1" style={{ color:'#8A7E78' }}>
              <li>• Browse and swipe all listings</li>
              <li>• Book hotels and short-lets</li>
              <li>• View professionals directory</li>
              <li>• Browse student hostels</li>
            </ul>
          </div>

          {/* CTA */}
          <button onClick={() => setStep(1)}
            className="w-full py-4 rounded-2xl font-bold text-white mb-3 flex items-center justify-center gap-2"
            style={{ backgroundColor:'#C96A3A', boxShadow:'0 4px 16px rgba(201,106,58,0.3)' }}>
            <Shield size={16} /> Verify Now — Free
          </button>

          {/* Skip button */}
          <button
            onClick={handleSkip}
            disabled={skipping}
            className="w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-70"
            style={{ color:'rgba(26,18,16,0.4)', border:'1px solid #E8DDD2', backgroundColor:'transparent' }}>
            <SkipForward size={14} />
            {skipping ? 'Skipping...' : 'Skip for now — browse freely'}
          </button>
          <p className="text-center text-xs mt-2" style={{ color:'rgba(26,18,16,0.3)' }}>
            You'll be reminded when you try to make a transaction
          </p>
        </div>
      </div>
    )
  }

  // ── Step 1: ID Upload ─────────────────────────────────────────────
  if (step === 1) {
    return (
      <div style={{ backgroundColor:'#FFFAF5', minHeight:'100vh', paddingTop:72 }}>
        <div className="max-w-sm mx-auto px-5 py-8">
          <button onClick={() => setStep(0)}
            className="flex items-center gap-2 text-sm mb-6" style={{ color:'rgba(26,18,16,0.4)' }}>
            <ArrowLeft size={14} /> Back
          </button>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {['ID Document','Selfie','Done'].map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: i < 1 ? '#C96A3A' : 'rgba(26,18,16,0.08)',
                      color: i < 1 ? 'white' : 'rgba(26,18,16,0.3)',
                    }}>
                    {i < 0 ? '✓' : i + 1}
                  </div>
                  <span className="text-xs font-semibold hidden sm:block"
                    style={{ color: i === 0 ? '#1A1210' : 'rgba(26,18,16,0.3)' }}>{label}</span>
                </div>
                {i < 2 && <div className="flex-1 h-px" style={{ backgroundColor:'#E8DDD2' }} />}
              </React.Fragment>
            ))}
          </div>

          <h2 className="font-display font-black text-2xl mb-1" style={{ color:'#1A1210' }}>Upload your ID</h2>
          <p className="text-sm mb-6" style={{ color:'#8A7E78' }}>Choose the type and upload a clear photo.</p>

          {/* ID type selection */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {ID_TYPES.map(t => (
              <button key={t.id} onClick={() => setIdType(t.id)}
                className="p-3 rounded-xl text-left transition-all"
                style={{
                  backgroundColor: idType === t.id ? 'rgba(201,106,58,0.08)' : '#F5EDE0',
                  border:`1.5px solid ${idType === t.id ? '#C96A3A' : 'transparent'}`,
                }}>
                <div className="text-lg mb-0.5">{t.emoji}</div>
                <div className="text-xs font-bold" style={{ color: idType === t.id ? '#C96A3A' : '#1A1210' }}>
                  {t.label}
                </div>
              </button>
            ))}
          </div>

          {/* Upload area */}
          <label className="block cursor-pointer mb-5">
            {idPreview ? (
              <div className="relative rounded-2xl overflow-hidden">
                <img src={idPreview} alt="ID" className="w-full h-48 object-cover" />
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ backgroundColor:'rgba(26,18,16,0.4)' }}>
                  <span className="text-white text-xs font-semibold">Click to replace</span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-2xl p-10 text-center"
                style={{ borderColor:'#E8DDD2', backgroundColor:'#F5EDE0' }}>
                <Upload size={28} style={{ color:'#C96A3A', margin:'0 auto 10px' }} />
                <p className="font-semibold text-sm" style={{ color:'#1A1210' }}>Upload ID Photo</p>
                <p className="text-xs mt-1" style={{ color:'#8A7E78' }}>JPG, PNG or WEBP — max 5MB</p>
              </div>
            )}
            <input ref={idFileRef} type="file" accept="image/*" className="hidden" onChange={handleIdUpload} />
          </label>

          <button
            onClick={() => {
              if (!idType) { toast.error('Select your ID type'); return }
              if (!idFile && !idPreview) { toast.error('Upload your ID photo'); return }
              setStep(2)
            }}
            className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
            style={{ backgroundColor:'#C96A3A' }}>
            Next: Take Selfie <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  // ── Step 2: Selfie ────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor:'#FFFAF5', minHeight:'100vh', paddingTop:72 }}>
      <div className="max-w-sm mx-auto px-5 py-8">
        <button onClick={() => { stopCamera(); setStep(1) }}
          className="flex items-center gap-2 text-sm mb-6" style={{ color:'rgba(26,18,16,0.4)' }}>
          <ArrowLeft size={14} /> Back
        </button>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {['ID Document','Selfie','Done'].map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: i <= 1 ? '#C96A3A' : 'rgba(26,18,16,0.08)',
                    color: i <= 1 ? 'white' : 'rgba(26,18,16,0.3)',
                  }}>
                  {i < 1 ? '✓' : i + 1}
                </div>
                <span className="text-xs font-semibold hidden sm:block"
                  style={{ color: i === 1 ? '#1A1210' : 'rgba(26,18,16,0.3)' }}>{label}</span>
              </div>
              {i < 2 && <div className="flex-1 h-px" style={{ backgroundColor:'#E8DDD2' }} />}
            </React.Fragment>
          ))}
        </div>

        <h2 className="font-display font-black text-2xl mb-1" style={{ color:'#1A1210' }}>Take a selfie</h2>
        <p className="text-sm mb-6" style={{ color:'#8A7E78' }}>
          Look straight at the camera. Good lighting helps.
        </p>

        {/* Camera / capture area */}
        <div className="mb-5">
          {faceCapture ? (
            <div className="relative rounded-2xl overflow-hidden">
              <img src={faceCapture} alt="Selfie" className="w-full rounded-2xl" />
              <button onClick={retakePhoto}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor:'rgba(26,18,16,0.6)' }}>
                <X size={14} color="white" />
              </button>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden"
              style={{ backgroundColor:'#1A1210', minHeight:240 }}>
              <video ref={videoRef} className="w-full rounded-2xl"
                style={{ display: streaming ? 'block' : 'none' }} playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              {!streaming && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                  <Camera size={40} style={{ color:'rgba(255,255,255,0.4)' }} />
                  <p className="text-xs text-center" style={{ color:'rgba(255,255,255,0.5)' }}>
                    Camera preview will appear here
                  </p>
                  {cameraErr && (
                    <div className="p-3 rounded-xl text-xs text-center"
                      style={{ backgroundColor:'rgba(201,106,58,0.3)', color:'#FFCBA4' }}>
                      {cameraErr}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        {!faceCapture ? (
          <div className="space-y-3">
            {!streaming ? (
              <button onClick={startCamera}
                className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                style={{ backgroundColor:'#1A1210' }}>
                <Camera size={16} /> Open Camera
              </button>
            ) : (
              <button onClick={capturePhoto}
                className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                style={{ backgroundColor:'#C96A3A' }}>
                📸 Take Photo
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
            style={{ backgroundColor:'#C96A3A' }}>
            {saving
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Shield size={16} /> Submit for Verification</>}
          </button>
        )}
      </div>
    </div>
  )
}
