import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Settings, LogOut, Edit3, Save } from 'lucide-react'
import { upsertProfile, signOut } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

const ROLE_LABEL = {
  buyer:    'Property Buyer',
  seller:   'Seller / Developer',
  surveyor: 'Land Surveyor',
  inspector:'Property Inspector',
  lender:   'Mortgage Lender',
  admin:    'Admin',
}

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone:     profile?.phone     || '',
    location:  profile?.location  || '',
    bio:       profile?.bio       || '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    const { error } = await upsertProfile({
      id: user.id,
      ...form,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) { toast.error('Could not save changes'); return }
    await refreshProfile()
    toast.success('Profile updated!')
    setEditing(false)
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-cream pt-20 pb-10">
      <div className="max-w-lg mx-auto px-4">
        <h1 className="font-display text-3xl font-black mb-8">My Profile</h1>

        {/* Avatar card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-terracotta/10 flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              : '🧑🏾'
            }
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-black text-deep truncate">
              {profile?.full_name || 'Your Name'}
            </h2>
            <p className="text-sm text-deep/50 truncate">{user?.email}</p>
            <span className="inline-block mt-2 bg-terracotta/8 text-terracotta text-xs font-bold px-3 py-1 rounded-full">
              {ROLE_LABEL[profile?.role] || 'Member'}
            </span>
          </div>
          <button onClick={() => setEditing(!editing)}
            className="w-9 h-9 rounded-full bg-deep/5 flex items-center justify-center text-deep/40 hover:text-terracotta transition-colors flex-shrink-0">
            <Edit3 size={15} />
          </button>
        </div>

        {/* Edit form */}
        {editing && (
          <div className="bg-white rounded-3xl p-6 shadow-sm mb-6 space-y-4 animate-fade-up">
            <h3 className="font-semibold text-deep">Edit Details</h3>
            {[
              { k:'full_name', label:'Full Name',  type:'text', placeholder:'Your full name' },
              { k:'phone',     label:'Phone',       type:'tel',  placeholder:'+234 800 000 0000' },
              { k:'location',  label:'Location',    type:'text', placeholder:'e.g. Uyo, Akwa Ibom' },
            ].map(({ k, label, type, placeholder }) => (
              <div key={k}>
                <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">{label}</label>
                <input className="input" type={type} placeholder={placeholder}
                  value={form[k]} onChange={set(k)} />
              </div>
            ))}
            <div>
              <label className="text-xs font-bold text-deep/50 uppercase tracking-wider mb-2 block">Bio</label>
              <textarea className="input resize-none" rows={3}
                placeholder="Tell us about yourself..."
                value={form.bio} onChange={set('bio')} />
            </div>
            <button onClick={handleSave} disabled={saving}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm">
              <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Buyer preferences summary */}
        {profile?.buyer_preferences && (
          <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-deep">Match Preferences</h3>
              <button onClick={() => navigate('/onboarding')}
                className="text-xs text-terracotta font-semibold hover:underline">
                Update
              </button>
            </div>
            <div className="space-y-2 text-sm text-deep/60">
              {profile.buyer_preferences.property_goal && (
                <p>🎯 Goal: <span className="text-deep font-medium capitalize">
                  {profile.buyer_preferences.property_goal.replace(/_/g, ' ')}
                </span></p>
              )}
              {profile.buyer_preferences.budget_max > 0 && (
                <p>💰 Budget: <span className="text-deep font-medium">
                  up to ₦{(profile.buyer_preferences.budget_max / 1_000_000).toFixed(0)}M
                </span></p>
              )}
              {profile.buyer_preferences.preferred_states?.length > 0 && (
                <p>📍 States: <span className="text-deep font-medium">
                  {profile.buyer_preferences.preferred_states.join(', ')}
                </span></p>
              )}
            </div>
          </div>
        )}

        {/* Settings links */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden mb-6">
          {[
            { icon: <Settings size={16} />, label: 'Account Settings',    action: () => {} },
            { icon: <User size={16} />,     label: 'Update Preferences',   action: () => navigate('/onboarding') },
          ].map(({ icon, label, action }) => (
            <button key={label} onClick={action}
              className="w-full flex items-center gap-4 px-6 py-4 border-b border-deep/5 last:border-0 hover:bg-cream transition-colors text-left">
              <span className="text-deep/40">{icon}</span>
              <span className="text-sm font-medium text-deep">{label}</span>
              <span className="ml-auto text-deep/20 text-lg">›</span>
            </button>
          ))}
        </div>

        <button onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-terracotta/20 text-terracotta font-semibold text-sm hover:bg-terracotta/5 transition-colors">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  )
}
