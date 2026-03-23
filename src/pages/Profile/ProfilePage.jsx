import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, CheckCircle, X, ArrowRight, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import LiveVerification from '@/components/ui/LiveVerification'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import clsx from 'clsx'

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

// ─── Photo Upload ──────────────────────────────────────────
function PhotoUpload({ currentUrl, onUpload }) {
  const [dragging, setDragging]   = useState(false)
  const [preview, setPreview]     = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (currentUrl) setPreview(currentUrl)
  }, [currentUrl])

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
        className={clsx('relative border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden', dragging ? 'scale-[1.02]' : '')}
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

// ─── Main ProfilePage ──────────────────────────────────────
export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving]           = useState(false)
  const [showLiveness, setShowLiveness] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone:     profile?.phone     || '',
    bio:       profile?.bio       || '',
    state:     profile?.state     || '',
    city:      profile?.city      || '',
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
      .update({ avatar_url: publicUrl, is_photo_verified: true, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) { toast.error('Could not save photo'); return }

    await refreshProfile()
    toast.success('Photo uploaded! ✅ Now complete the live face check.')
    setTimeout(() => setShowLiveness(true), 1500)
  }

  const handleLivenessSuccess = async () => {
    setShowLiveness(false)
    const { error } = await supabase
      .from('profiles')
      .update({ is_live_verified: true, live_verified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
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

        {/* Verification status */}
        <div className="rounded-2xl p-5 mb-6 border"
          style={{
            backgroundColor: verificationLevel === 'live' ? 'rgba(122,158,126,0.08)' : verificationLevel === 'photo' ? 'rgba(201,106,58,0.06)' : '#FFFFFF',
            borderColor: verificationLevel === 'live' ? 'rgba(122,158,126,0.3)' : verificationLevel === 'photo' ? 'rgba(201,106,58,0.2)' : '#E8DDD2',
          }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold" style={{color:'#1A1210'}}>Verification Status</p>
            <VerificationBadge level={verificationLevel} />
          </div>
          <div className="space-y-3">
            {/* Level 1 */}
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{backgroundColor: profile?.avatar_url ? '#C96A3A' : 'rgba(26,18,16,0.08)'}}>
                {profile?.avatar_url
                  ? <CheckCircle size={14} color="white" />
                  : <span className="text-xs" style={{color:'#8A7E78'}}>1</span>}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{color:'#1A1210'}}>Photo Verified</p>
                <p className="text-xs" style={{color:'#8A7E78'}}>Upload a clear face photo</p>
              </div>
              {profile?.avatar_url && <span className="text-xs font-bold" style={{color:'#C96A3A'}}>✅ Done</span>}
            </div>
            {/* Level 2 */}
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{backgroundColor: profile?.is_live_verified ? '#7A9E7E' : 'rgba(26,18,16,0.08)'}}>
                {profile?.is_live_verified
                  ? <CheckCircle size={14} color="white" />
                  : <span className="text-xs" style={{color:'#8A7E78'}}>2</span>}
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
          <h2 className="font-display font-black text-lg mb-1" style={{color:'#1A1210'}}>Profile Photo</h2>
          <p className="text-xs mb-5" style={{color:'#8A7E78'}}>
            Use a clear, well-lit photo of your face. No hats, sunglasses, or filters.
          </p>
          <PhotoUpload currentUrl={profile?.avatar_url} onUpload={handlePhotoUpload} />
        </div>

        {/* Personal details */}
        <div className="rounded-2xl p-6 border mb-6"
          style={{backgroundColor:'#FFFFFF', borderColor:'#E8DDD2'}}>
          <h2 className="font-display font-black text-lg mb-5" style={{color:'#1A1210'}}>Personal Details</h2>
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

      <AnimatePresence>
        {showLiveness && (
          <LiveVerification
            onSuccess={handleLivenessSuccess}
            onClose={() => setShowLiveness(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
