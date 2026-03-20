import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      // Exchange the code for a session
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        navigate('/auth')
        return
      }

      const user = session.user

      // Check if profile exists and onboarding is completed
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, role, full_name')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // Brand new user — create basic profile then send to onboarding
        await supabase.from('profiles').upsert({
          id:        user.id,
          email:     user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          avatar_url:user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          onboarding_completed: false,
          updated_at: new Date().toISOString(),
        })
        navigate('/onboarding')
        return
      }

      if (!profile.onboarding_completed) {
        // Has profile but hasn't finished onboarding
        navigate('/onboarding')
        return
      }

      // Fully set up — go to browse
      navigate('/browse')
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:'#FFFAF5'}}>
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <div className="text-5xl animate-bounce">🏡</div>
        <p className="font-display text-xl font-black" style={{color:'#1A1210'}}>
          Setting up your account...
        </p>
        <p className="text-sm" style={{color:'#8A7E78'}}>
          Just a moment while we get everything ready for you.
        </p>
        <div className="flex gap-1.5 mt-2">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-pulse"
              style={{backgroundColor:'#C96A3A', animationDelay:`${i*0.15}s`}} />
          ))}
        </div>
      </div>
    </div>
  )
}
