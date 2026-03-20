import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const REQUIREMENTS = {
  sell:        { photo: true,  live: true,  label: 'list a property for sale' },
  buy:         { photo: true,  live: true,  label: 'express interest in buying' },
  list_rental: { photo: true,  live: false, label: 'list a rental property' },
  rent:        { photo: false, live: false, label: 'rent a property' },
  shortlet:    { photo: false, live: false, label: 'book a short-let' },
  hotel:       { photo: false, live: false, label: 'book a hotel' },
}

export function useVerificationGuard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  // Async check — fetches fresh from Supabase every time
  const checkAsync = async (action) => {
    const req = REQUIREMENTS[action]
    if (!req) return true
    if (!user) { navigate('/auth'); return false }

    // Always fetch fresh profile data
    const { data: freshProfile } = await supabase
      .from('profiles')
      .select('avatar_url, is_photo_verified, is_live_verified')
      .eq('id', user.id)
      .single()

    const hasPhoto = !!(freshProfile?.avatar_url)
    const hasLive  = !!(freshProfile?.is_live_verified)

    if (req.live && !hasLive) {
      if (!hasPhoto) {
        toast.error(
          '🔒 You need to upload a photo AND complete live face verification to ' + req.label + '. Go to your profile.',
          { duration: 5000 }
        )
      } else {
        toast.error(
          '🟢 You need to complete the Live face check to ' + req.label + '. Go to your profile.',
          { duration: 5000 }
        )
      }
      navigate('/profile')
      return false
    }

    if (req.photo && !hasPhoto) {
      toast.error(
        '📸 Upload a profile photo to ' + req.label + '. Go to your profile.',
        { duration: 5000 }
      )
      navigate('/profile')
      return false
    }

    return true
  }

  // Sync check using cached profile (for quick UI checks)
  const check = (action) => {
    const req = REQUIREMENTS[action]
    if (!req) return true
    if (!user) { navigate('/auth'); return false }

    const hasPhoto = !!(profile?.avatar_url)
    const hasLive  = !!(profile?.is_live_verified)

    if (req.live && !hasLive) {
      if (!hasPhoto) {
        toast.error(
          '🔒 Upload your photo + complete face verification to ' + req.label,
          { duration: 5000 }
        )
      } else {
        toast.error(
          '🟢 Complete the Live face check on your profile to ' + req.label,
          { duration: 5000 }
        )
      }
      navigate('/profile')
      return false
    }

    if (req.photo && !hasPhoto) {
      toast.error(
        '📸 Upload a profile photo to ' + req.label,
        { duration: 5000 }
      )
      navigate('/profile')
      return false
    }

    return true
  }

  return { check, checkAsync }
}
