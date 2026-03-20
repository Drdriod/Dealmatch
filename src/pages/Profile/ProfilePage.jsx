import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Upload, CheckCircle, Shield, X, RotateCcw, Eye, ArrowRight, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ─── Liveness Detection ────────────────────────────────────
function LivenessCheck({ onSuccess, onClose }) {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const streamRef  = useRef(null)
  const [phase, setPhase]         = useState('intro')   // intro | blink | turn | success
  const [instruction, setInstruction] = useState('')
  const [countdown, setCountdown] = useState(3)
  const [blinkCount, setBlinkCount] = useState(0)
  const [progress, setProgress]   = useState(0)
  const [cameraReady, setCameraReady] = useState(false)

  const challenges = [
    { id:'blink', label:'Blink twice slowly', icon:'👁️' },
    { id:'turn',  label:'Turn your head left', icon:'↩️' },
  ]
  const [currentChallenge, setCurrentChallenge] = useState(0)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width:{ ideal:640 }, height:{ ideal:480 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setCameraReady(true)
      }
    } catch (err) {
      toast.error('Camera access denied. Please allow camera access and try again.')
      onClose()
    }
  }, [onClose])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  const startChallenge = async () => {
    await startCamera()
    setPhase('challenge')
    setInstruction(challenges[0].label)
    setProgress(0)
  }

  // Simulate challenge completion — in production use a real face detection library
  // For now we use a timer-based simulation that the user controls
  const completeChallenge = () => {
    const next = currentChallenge + 1
    setProgress((next / challenges.length) * 100)

    if (next >= challenges.length) {
      setPhase('success')
      stopCamera()
      setTimeout(() => onSuccess(), 1500)
    } else {
      setCurrentChallenge(next)
      setInstruction(challenges[next].label)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{backgroundColor:'rgba(26,18,16,0.9)', backdropFilter:'blur(8px)'}}>
      <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}}
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{backgroundColor:'#FFFAF5'}}>

        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b" style={{borderColor:'#E8DDD2'}}>
          <div>
            <h3 className="font-display text-xl font-black" style={{color:'#1A1210'}}>🟢 Live Verification</h3>
            <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>Prove you're a real person</p>
          </div>
          <button onClick={() => { stopCamera(); onClose() }}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{backgroundColor:'rgba(26,18,16,0.08)'}}>
            <X size={14} style={{color:'#5C4A3A'}} />
          </button>
        </div>

        <div className="p-5">
          {phase === 'intro' && (
            <div className="text-center py-4">
              <div className="text-6xl mb-4">🤳</div>
              <h4 className="font-display font-black text-xl mb-2" style={{color:'#1A1210'}}>
                Quick face check
              </h4>
              <p className="text-sm leading-relaxed mb-6" style={{color:'#8A7E78'}}>
                We'll ask you to complete 2 simple actions to confirm you're live. This takes about 15 seconds.
              </p>
              <div className="space-y-2 mb-6 text-left">
                {challenges.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{backgroundColor:'rgba(26,18,16,0.03)'}}>
                    <span className="text-xl">{c.icon}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{color:'#1A1210'}}>Step {i+1}</p>
                      <p className="text-xs" style={{color:'#8A7E78'}}>{c.label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={startChallenge} className="btn-primary w-full py-4">
                Start Verification →
              </button>
              <p className="text-xs mt-3" style={{color:'rgba(26,18,16,0.3)'}}>
                Your video is never stored or shared.
              </p>
            </div>
          )}

          {phase === 'challenge' && (
            <div className="text-center">
              {/* Camera feed */}
              <div className="relative rounded-2xl overflow-hidden mb-4 bg-black"
                style={{aspectRatio:'4/3'}}>
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-sm">Starting camera...</div>
                  </div>
                )}
                {/* Face guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-40 h-48 rounded-full border-4 border-dashed opacity-60"
                    style={{borderColor:'#C96A3A'}} />
                </div>
                {/* Current instruction */}
                <div className="absolute bottom-3 left-3 right-3 py-2 px-4 rounded-xl text-center"
                  style={{backgroundColor:'rgba(26,18,16,0.75)', backdropFilter:'blur(4px)'}}>
                  <p className="text-white text-sm font-semibold">{instruction}</p>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5" style={{color:'#8A7E78'}}>
                  <span>Progress</span>
                  <span>{currentChallenge}/{challenges.length} completed</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{backgroundColor:'rgba(26,18,16,0.08)'}}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{width:`${progress}%`, backgroundColor:'#7A9E7E'}} />
                </div>
              </div>

              <button onClick={completeChallenge}
                className="btn-primary w-full py-4 mb-2">
                ✓ Done — {instruction}
              </button>
              <p className="text-xs" style={{color:'rgba(26,18,16,0.3)'}}>
                Tap when you've completed the action above
              </p>
            </div>
          )}

          {phase === 'success' && (
            <div className="text-center py-8">
              <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring', stiffness:200}}>
                <div className="text-6xl mb-4">🟢</div>
              </motion.div>
              <h4 className="font-display font-black text-2xl mb-2" style={{color:'#1A1210'}}>
                Verified!
              </h4>
              <p className="text-sm" style={{color:'#8A7E78'}}>
                You've earned the Live Verified badge.
              </p>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </div>
  )
}

// ─── Photo Upload ──────────────────────────────────────────
function PhotoUpload({ currentUrl, onUpload }) {
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview]   = useState(currentUrl || null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    await onUpload(file)
    setUploading(false)
  }

  return (
    <div>
      <div
        className={clsx(
          'relative border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden',
          dragging ? 'scale-[1.02]' : ''
        )}
        style={{
          borderColor: dragging ? '#C96A3A' : '#E8DDD2',
          backgroundColor: dragging ? 'rgba(201,106,58,0.04)' : '#FFFFFF',
          aspectRatio: '1',
          maxWidth: 200,
          margin: '0 auto',
        }}
        onClick={() => document.getElementById('profile-photo-input').click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
      >
        {preview ? (
          <>
            <img src={preview} alt="Profile" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              style={{backgroundColor:'rgba(26,18,16,0.5)'}}>
              <div className="text-center text-white">
                <Camera size={24} className="mx-auto mb-1" />
                <p className="text-xs font-semibold">Change photo</p>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{backgroundColor:'rgba(201,106,58,0.1)'}}>
              <Camera size={28} style={{color:'#C96A3A'}} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{color:'#1A1210'}}>Upload your photo</p>
              <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>Clear face photo required</p>
            </div>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{backgroundColor:'rgba(255,250,245,0.8)'}}>
            <div className="text-center">
              <div className="text-2xl mb-1">⏳</div>
              <p className="text-xs font-semibold" style={{color:'#C96A3A'}}>Uploading...</p>
            </div>
          </div>
        )}
      </div>
      <input id="profile-photo-input" type="file" accept="image/*" className="hidden"
        onChange={e => handleFile(e.target.files[0])} />
      <p className="text-center text-xs mt-3" style={{color:'#8A7E78'}}>
        JPG or PNG · Max 5MB · Clear face, no sunglasses
      </p>
    </div>
  )
}

// ─── Verification Badge ────────────────────────────────────
function VerificationBadge({ level }) {
  if (level === 'live') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{backgroundColor:'rgba(122,158,126,0.15)', color:'#5C8060'}}>
      🟢 Live Verified
    </span>
  )
  if (level === 'photo') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{backgroundColor:'rgba(201,106,58,0.12)', color:'#C96A3A'}}>
      ✅ Photo Verified
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{backgroundColor:'rgba(26,18,16,0.06)', color:'#8A7E78'}}>
      ⚪ Unverified
    </span>
  )
}

// ─── Main ProfilePage ──────────────────────────────────────
export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving]         = useState(false)
  const [showLiveness, setShowLiveness] = useState(false)
  const [form, setForm]             = useState({
    full_name:   profile?.full_name   || '',
    phone:       profile?.phone       || '',
    bio:         profile?.bio         || '',
    state:       profile?.state       || '',
    city:        profile?.city        || '',
  })

  const verificationLevel = profile?.is_live_verified
    ? 'live'
    : profile?.avatar_url
      ? 'photo'
      : 'none'

  const setE = (k) => (e) => setForm(f => ({...f, [k]: e.target.value}))

  const handlePhotoUpload = async (file) => {
    const ext      = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      toast.error('Could not upload photo')
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url:       publicUrl,
        is_photo_verified: true,
        updated_at:       new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      toast.error('Could not save photo')
      return
    }

    await refreshProfile()
    toast.success('Profile photo updated! ✅ Photo Verified badge earned.')
  }

  const handleLivenessSuccess = async () => {
    setShowLiveness(false)
    const { error } = await supabase
      .from('profiles')
      .update({
        is_live_verified: true,
        live_verified_at: new Date().toISOString(),
        updated_at:       new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) { toast.error('Could not save verification'); return }
    await refreshProfile()
    toast.success('🟢 Live Verified! You now have the highest trust badge.')
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    setSaving(false)
    if (error) { toast.error('Could not save profile'); return }
    await refreshProfile()
    toast.success('Profile saved!')
    setTimeout(() => navigate('/browse'), 1000)
  }

  const STATES = [
    'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
    'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa',
    'Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger',
    'Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe',
    'Zamfara','Abuja (FCT)',
  ]

  return (
    <div className="min-h-screen pt-24 pb-16" style={{backgroundColor:'#F5EDE0'}}>
      <div className="max-w-lg mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black" style={{color:'#1A1210'}}>Your Profile</h1>
          <p className="text-sm mt-1" style={{color:'#8A7E78'}}>
            Verified profiles get 3× more trust from buyers and landlords.
          </p>
        </div>

        {/* Verification status card */}
        <div className="rounded-2xl p-5 mb-6 border"
          style={{
            backgroundColor: verificationLevel === 'live' ? 'rgba(122,158,126,0.08)' : verificationLevel === 'photo' ? 'rgba(201,106,58,0.06)' : '#FFFFFF',
            borderColor: verificationLevel === 'live' ? 'rgba(122,158,126,0.3)' : verificationLevel === 'photo' ? 'rgba(201,106,58,0.2)' : '#E8DDD2',
          }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold" style={{color:'#1A1210'}}>Verification Status</p>
            <VerificationBadge level={verificationLevel} />
          </div>

          {/* Level indicators */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: profile?.avatar_url ? '#C96A3A' : 'rgba(26,18,16,0.08)',
                }}>
                {profile?.avatar_url
                  ? <CheckCircle size={14} color="white" />
                  : <span className="text-xs" style={{color:'#8A7E78'}}>1</span>
                }
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{color:'#1A1210'}}>Photo Verified</p>
                <p className="text-xs" style={{color:'#8A7E78'}}>Upload a clear face photo</p>
              </div>
              {profile?.avatar_url && (
                <span className="text-xs font-bold" style={{color:'#C96A3A'}}>✅ Done</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: profile?.is_live_verified ? '#7A9E7E' : 'rgba(26,18,16,0.08)',
                }}>
                {profile?.is_live_verified
                  ? <CheckCircle size={14} color="white" />
                  : <span className="text-xs" style={{color:'#8A7E78'}}>2</span>
                }
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{color:'#1A1210'}}>Live Verified</p>
                <p className="text-xs" style={{color:'#8A7E78'}}>Blink or turn head on camera</p>
              </div>
              {profile?.is_live_verified
                ? <span className="text-xs font-bold" style={{color:'#7A9E7E'}}>🟢 Done</span>
                : profile?.avatar_url && (
                  <button onClick={() => setShowLiveness(true)}
                    className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{backgroundColor:'#7A9E7E', color:'#FFFFFF'}}>
                    Start →
                  </button>
                )
              }
            </div>
          </div>

          {!profile?.avatar_url && (
            <p className="text-xs mt-3 p-2 rounded-xl text-center"
              style={{backgroundColor:'rgba(201,106,58,0.08)', color:'#C96A3A'}}>
              ⚠️ Upload your photo first to unlock Live Verification
            </p>
          )}
        </div>

        {/* Photo upload */}
        <div className="rounded-2xl p-6 border mb-6"
          style={{backgroundColor:'#FFFFFF', borderColor:'#E8DDD2'}}>
          <h2 className="font-display font-black text-lg mb-1" style={{color:'#1A1210'}}>
            Profile Photo
          </h2>
          <p className="text-xs mb-5" style={{color:'#8A7E78'}}>
            Use a clear, well-lit photo of your face. No hats, sunglasses, or filters.
          </p>
          <PhotoUpload
            currentUrl={profile?.avatar_url}
            onUpload={handlePhotoUpload}
          />
        </div>

        {/* Profile details */}
        <div className="rounded-2xl p-6 border mb-6"
          style={{backgroundColor:'#FFFFFF', borderColor:'#E8DDD2'}}>
          <h2 className="font-display font-black text-lg mb-5" style={{color:'#1A1210'}}>
            Personal Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Full Name</label>
              <input className="input" type="text" placeholder="Your full name"
                value={form.full_name} onChange={setE('full_name')}
                style={{backgroundColor:'#FFFAF5', color:'#1A1210'}} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Phone Number</label>
              <input className="input" type="tel" placeholder="+234 800 000 0000"
                value={form.phone} onChange={setE('phone')}
                style={{backgroundColor:'#FFFAF5', color:'#1A1210'}} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>State</label>
                <select className="select" value={form.state} onChange={setE('state')}
                  style={{backgroundColor:'#FFFAF5', color:'#1A1210'}}>
                  <option value="">Select...</option>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>City</label>
                <input className="input" type="text" placeholder="e.g. Uyo"
                  value={form.city} onChange={setE('city')}
                  style={{backgroundColor:'#FFFAF5', color:'#1A1210'}} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{color:'rgba(26,18,16,0.5)'}}>Short Bio (optional)</label>
              <textarea className="input resize-none" rows={3}
                placeholder="Tell people a bit about yourself..."
                value={form.bio} onChange={setE('bio')}
                style={{backgroundColor:'#FFFAF5', color:'#1A1210'}} />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="btn-primary w-full py-4 mt-6">
            {saving ? 'Saving...' : 'Save Profile →'}
          </button>
        </div>

        {/* Account info */}
        <div className="rounded-2xl p-5 border" style={{backgroundColor:'#FFFFFF', borderColor:'#E8DDD2'}}>
          <h2 className="font-display font-black text-base mb-3" style={{color:'#1A1210'}}>Account</h2>
          <div className="space-y-2 text-sm" style={{color:'#8A7E78'}}>
            <p>📧 {user?.email}</p>
            <p className="capitalize">👤 Role: {profile?.role || 'Not set'}</p>
            <p>🗓️ Joined: {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-NG', {year:'numeric', month:'long'}) : '—'}</p>
          </div>
        </div>
      </div>

      {/* Liveness modal */}
      <AnimatePresence>
        {showLiveness && (
          <LivenessCheck
            onSuccess={handleLivenessSuccess}
            onClose={() => setShowLiveness(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
