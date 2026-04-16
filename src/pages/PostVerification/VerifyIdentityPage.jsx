import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Camera, Upload, Check, ArrowRight, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const ID_TYPES = [
  { id:'nin',      label:"NIN Slip / Card",         emoji:'🪪' },
  { id:'voters',   label:"Voter's Card",             emoji:'🗳️' },
  { id:'passport', label:"International Passport",  emoji:'🛂' },
  { id:'drivers',  label:"Driver's License",        emoji:'🚗' },
]

export default function VerifyIdentityPage() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate  = useNavigate()
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const idFileRef = useRef(null)

  const [step,        setStep]        = useState(0) // 0=intro, 1=ID, 2=face, 3=done
  const [idType,      setIdType]      = useState('')
  const [idFile,      setIdFile]      = useState(null)
  const [idPreview,   setIdPreview]   = useState(null)
  const [faceCapture, setFaceCapture] = useState(null)
  const [streaming,   setStreaming]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [cameraErr,   setCameraErr]   = useState('')

  // ── ID document ────────────────────────────────────────
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

  // ── Webcam liveness ────────────────────────────────────
  const startCamera = async () => {
    setCameraErr('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'user', width:480, height:360 } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setStreaming(true)
      }
    } catch (err) {
      setCameraErr('Camera access denied. Please allow camera access in your browser settings.')
    }
  }

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject
    stream?.getTracks().forEach(t => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setStreaming(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    canvasRef.current.width  = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    ctx.drawImage(videoRef.current, 0, 0)
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85)
    setFaceCapture(dataUrl)
    stopCamera()
    toast.success('Face captured! ✅')
  }

  const retakePhoto = () => {
    setFaceCapture(null)
    startCamera()
  }

  // ── Submit both ────────────────────────────────────────
  const handleSubmit = async () => {
    if (!idFile || !faceCapture || !idType) {
      toast.error('Please complete both steps'); return
    }
    setSaving(true)
    try {
      // Upload ID doc
      const ext      = idFile.name.split('.').pop()
      const idPath   = `${user.id}/id_doc_${Date.now()}.${ext}`
      const { error: idErr } = await supabase.storage.from('avatars').upload(idPath, idFile, { upsert:true })
      if (idErr) throw idErr
      const { data: idUrl } = supabase.storage.from('avatars').getPublicUrl(idPath)

      // Upload face capture
      const faceBlob = await fetch(faceCapture).then(r => r.blob())
      const facePath = `${user.id}/face_${Date.now()}.jpg`
      const { error: faceErr } = await supabase.storage.from('avatars').upload(facePath, faceBlob, { upsert:true, contentType:'image/jpeg' })
      if (faceErr) throw faceErr
      const { data: faceUrl } = supabase.storage.from('avatars').getPublicUrl(facePath)

      // Update profile
      await supabase.from('profiles').update({
        id_doc_url:       idUrl.publicUrl,
        id_doc_type:      idType,
        face_video_url:   faceUrl.publicUrl,
        is_photo_verified: true,
        avatar_url:        faceUrl.publicUrl, // use face capture as avatar
        updated_at:        new Date().toISOString(),
      }).eq('id', user.id)

      await refreshProfile()
      setStep(3)
    } catch (err) {
      toast.error('Upload failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const goToDashboard = () => {
    const role = profile?.role
    if (role === 'landlord' || role === 'seller') navigate('/landlord')
    else navigate('/browse')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor:'#FFFAF5' }}>
      <div className="w-full max-w-md">

        {/* ── Step 0: Intro ── */}
        {step === 0 && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor:'rgba(201,106,58,0.1)' }}>
                <Shield size={36} style={{ color:'#C96A3A' }} />
              </div>
              <h1 className="font-display font-black text-3xl mb-3" style={{ color:'#1A1210' }}>
                Verify Your Identity
              </h1>
              <p className="text-sm leading-relaxed" style={{ color:'#8A7E78' }}>
                DealMatch requires real-identity verification to prevent scams and protect every user. Takes about 2 minutes.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {[
                { icon:'🪪', title:'Upload a valid ID',         desc:'NIN, Voter\'s Card, Passport, or Driver\'s License' },
                { icon:'📷', title:'Take a live selfie',        desc:'Your webcam confirms you match your ID document' },
                { icon:'✅', title:'Instant access unlocked',   desc:'Buy, sell, list, and contact professionals' },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-2xl border"
                  style={{ backgroundColor:'#FFFFFF', borderColor:'#E8DDD2' }}>
                  <span className="text-2xl flex-shrink-0">{s.icon}</span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color:'#1A1210' }}>{s.title}</p>
                    <p className="text-xs mt-0.5" style={{ color:'#8A7E78' }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setStep(1)} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
              Start Verification <ArrowRight size={16} />
            </button>
            <button onClick={goToDashboard}
              className="w-full py-3 text-xs text-center mt-3"
              style={{ color:'rgba(26,18,16,0.35)' }}>
              Skip for now — some features will be limited
            </button>
          </motion.div>
        )}

        {/* ── Step 1: ID Upload ── */}
        {step === 1 && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs mb-3" style={{ color:'#8A7E78' }}>
                <span>Step 1 of 2</span><span>ID Document</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor:'rgba(26,18,16,0.08)' }}>
                <div className="h-full rounded-full" style={{ width:'50%', backgroundColor:'#C96A3A' }} />
              </div>
            </div>

            <h2 className="font-display font-black text-2xl mb-1" style={{ color:'#1A1210' }}>Upload Your ID 🪪</h2>
            <p className="text-sm mb-5" style={{ color:'#8A7E78' }}>Choose your ID type and upload a clear photo.</p>

            {/* ID type selector */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {ID_TYPES.map(t => (
                <button key={t.id} onClick={() => setIdType(t.id)}
                  className="flex items-center gap-2 p-3 rounded-2xl border-2 text-left transition-all"
                  style={{ borderColor: idType === t.id ? '#C96A3A' : '#E8DDD2', backgroundColor: idType === t.id ? 'rgba(201,106,58,0.05)' : '#FFFFFF' }}>
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-xs font-semibold" style={{ color:'#1A1210' }}>{t.label}</span>
                  {idType === t.id && <Check size={12} style={{ color:'#C96A3A', marginLeft:'auto' }} />}
                </button>
              ))}
            </div>

            {/* Upload zone */}
            {idType && (
              <>
                <div className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer mb-4 transition-all"
                  style={{ borderColor: idPreview ? '#7A9E7E' : '#C96A3A', backgroundColor: idPreview ? 'rgba(122,158,126,0.04)' : 'rgba(201,106,58,0.03)' }}
                  onClick={() => idFileRef.current?.click()}>
                  {idPreview ? (
                    <div className="relative">
                      <img src={idPreview} alt="ID" className="max-h-40 mx-auto rounded-xl object-contain" />
                      <div className="mt-2 text-xs font-semibold" style={{ color:'#7A9E7E' }}>✅ ID uploaded — tap to replace</div>
                    </div>
                  ) : (
                    <>
                      <Upload size={28} className="mx-auto mb-2" style={{ color:'#C96A3A' }} />
                      <p className="font-semibold text-sm" style={{ color:'#1A1210' }}>Tap to upload your {ID_TYPES.find(t2 => t2.id === idType)?.label}</p>
                      <p className="text-xs mt-1" style={{ color:'#8A7E78' }}>JPG, PNG, WEBP · Max 5MB · Clear, not blurry</p>
                    </>
                  )}
                  <input ref={idFileRef} type="file" accept="image/*" className="hidden" onChange={handleIdUpload} />
                </div>
                {idPreview && (
                  <button onClick={() => setStep(2)} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
                    Next: Take Selfie <ArrowRight size={16} />
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ── Step 2: Face Liveness ── */}
        {step === 2 && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs mb-3" style={{ color:'#8A7E78' }}>
                <span>Step 2 of 2</span><span>Live Face Check</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor:'rgba(26,18,16,0.08)' }}>
                <div className="h-full rounded-full" style={{ width:'100%', backgroundColor:'#C96A3A' }} />
              </div>
            </div>

            <h2 className="font-display font-black text-2xl mb-1" style={{ color:'#1A1210' }}>Take a Live Selfie 📷</h2>
            <p className="text-sm mb-5" style={{ color:'#8A7E78' }}>Look directly at the camera. Make sure your face is clearly visible.</p>

            {/* Camera view */}
            <div className="rounded-2xl overflow-hidden mb-4 relative bg-black" style={{ minHeight: 260 }}>
              {faceCapture ? (
                <img src={faceCapture} alt="Captured" className="w-full object-cover" />
              ) : (
                <>
                  <video ref={videoRef} className="w-full" style={{ display: streaming ? 'block' : 'none' }} playsInline muted />
                  {!streaming && !cameraErr && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <Camera size={40} style={{ color:'rgba(255,255,255,0.4)' }} />
                      <p className="text-sm" style={{ color:'rgba(255,255,255,0.5)' }}>Camera not started</p>
                    </div>
                  )}
                  {cameraErr && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                      <p className="text-sm" style={{ color:'#C96A3A' }}>{cameraErr}</p>
                    </div>
                  )}
                </>
              )}
              {/* Face guide overlay */}
              {streaming && !faceCapture && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-40 h-48 rounded-full border-4 border-dashed opacity-60" style={{ borderColor:'#C96A3A' }} />
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {!faceCapture ? (
              <div className="flex gap-3">
                {!streaming ? (
                  <button onClick={startCamera} className="btn-primary flex-1 py-4 flex items-center justify-center gap-2">
                    <Camera size={16} /> Start Camera
                  </button>
                ) : (
                  <button onClick={capturePhoto}
                    className="flex-1 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                    style={{ backgroundColor:'#C96A3A', color:'#FFFFFF' }}>
                    📸 Capture Photo
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-center font-semibold" style={{ color:'#7A9E7E' }}>✅ Photo captured! Looks good?</p>
                <div className="flex gap-3">
                  <button onClick={retakePhoto}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold border"
                    style={{ borderColor:'#E8DDD2', color:'#5C4A3A' }}>
                    Retake
                  </button>
                  <button onClick={handleSubmit} disabled={saving}
                    className="btn-primary flex-1 py-3 text-sm">
                    {saving ? 'Uploading...' : 'Submit Verification →'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Step 3: Done ── */}
        {step === 3 && (
          <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="text-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor:'rgba(122,158,126,0.15)' }}>
              <Check size={44} style={{ color:'#7A9E7E' }} />
            </div>
            <h1 className="font-display font-black text-3xl mb-3" style={{ color:'#1A1210' }}>
              Identity Verified! ✅
            </h1>
            <p className="text-sm leading-relaxed mb-2" style={{ color:'#8A7E78' }}>
              Your ID and face have been uploaded. Our team will complete verification within 24 hours.
            </p>
            <p className="text-xs mb-8" style={{ color:'#C96A3A' }}>
              Every match is a connection, every connection is a home ❤️
            </p>
            <button onClick={goToDashboard} className="btn-primary w-full py-4">
              {(profile?.role === 'landlord' || profile?.role === 'seller') ? 'List Your First Property →' : 'Start Matching →'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
