import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Smartphone } from 'lucide-react'

export default function InstallPrompt() {
  const [prompt, setPrompt]     = useState(null)
  const [show, setShow]         = useState(false)
  const [installed, setInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    // Check if user dismissed before
    if (localStorage.getItem('dm-install-dismissed')) return

    // Listen for install prompt
    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      // Show after 30 seconds on site
      setTimeout(() => setShow(true), 30000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
      setShow(false)
    }
    setPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    localStorage.setItem('dm-install-dismissed', '1')
  }

  if (installed || !show || dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{opacity:0, y:80}}
        animate={{opacity:1, y:0}}
        exit={{opacity:0, y:80}}
        transition={{type:'spring', stiffness:300, damping:30}}
        className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto"
      >
        <div className="rounded-2xl p-4 flex items-center gap-4 shadow-2xl border"
          style={{backgroundColor:'#1A1210', borderColor:'rgba(255,255,255,0.1)'}}>

          {/* Icon */}
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{backgroundColor:'#C96A3A'}}>
            <span className="text-2xl">🏡</span>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-white">Install DealMatch</p>
            <p className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.5)'}}>
              Add to home screen for the full app experience
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleInstall}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={{backgroundColor:'#C96A3A', color:'#FFFFFF'}}>
              Install
            </button>
            <button onClick={handleDismiss}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{backgroundColor:'rgba(255,255,255,0.1)'}}>
              <X size={12} color="white" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
