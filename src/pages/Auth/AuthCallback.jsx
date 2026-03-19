import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/browse')
      else navigate('/auth')
    })
  }, [navigate])

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="text-4xl animate-float">🏡</div>
        <p className="text-deep/40 text-sm">Completing sign in...</p>
      </div>
    </div>
  )
}
