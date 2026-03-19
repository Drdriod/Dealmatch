import { motion, AnimatePresence } from 'framer-motion'
import { Heart, X } from 'lucide-react'
import { useState, useEffect } from 'react'

export function MatchToast({ property, onClose, onViewMatch }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: 80, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 80, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] w-full max-w-sm px-4"
    >
      <div className="bg-deep rounded-3xl p-4 shadow-[0_24px_64px_rgba(0,0,0,0.4)] flex items-center gap-4 border border-white/8">
        {/* Animated hearts */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-terracotta/20 flex items-center justify-center text-2xl">
            {property?.property_type === 'land' ? '🌿' : '🏡'}
          </div>
          <motion.div
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-terracotta flex items-center justify-center"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: 3, duration: 0.4 }}
          >
            <Heart size={12} fill="white" className="text-white" />
          </motion.div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-terracotta uppercase tracking-wider mb-0.5">It's a Match! ❤️</p>
          <p className="text-white text-sm font-semibold truncate">{property?.title || 'Property'}</p>
          <p className="text-white/40 text-xs">{property?.city}, {property?.state}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button onClick={onViewMatch}
            className="bg-terracotta text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-terracotta-600 transition-colors whitespace-nowrap">
            View Match
          </button>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors self-center">
            <X size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
