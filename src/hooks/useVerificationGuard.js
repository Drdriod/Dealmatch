import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
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
  const { profile } = useAuth()
  const navigate    = useNavigate()

  const check = (action) => {
    const req = REQUIREMENTS[action]
    if (!req) return true

    const hasPhoto = !!profile?.avatar_url
    const hasLive  = !!profile?.is_live_verified

    if (req.live && !hasLive) {
      if (!hasPhoto) {
        toast.error(`Upload your photo + complete face verification to ${req.label}.`, { duration: 4000, icon: '🔒' })
      } else {
        toast.error(`Complete the Live face check on your profile to ${req.label}.`, { duration: 4000, icon: '🟢' })
      }
      navigate('/profile')
      return false
    }

    if (req.photo && !hasPhoto) {
      toast.error(`Upload a profile photo to ${req.label}.`, { duration: 4000, icon: '📸' })
      navigate('/profile')
      return false
    }

    return true
  }

  return { check }
}
