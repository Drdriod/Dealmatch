import { useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Download, Share2 } from 'lucide-react'

export default function BookingReceipt({ booking, onClose }) {
  const receiptRef = useRef(null)

  const refNo  = `DM-${Date.now().toString(36).toUpperCase()}`
  const today  = new Date().toLocaleDateString('en-NG', { year:'numeric', month:'long', day:'numeric' })
  const time   = new Date().toLocaleTimeString('en-NG', { hour:'2-digit', minute:'2-digit' })

  const nights = booking.checkin && booking.checkout
    ? Math.max(1, Math.ceil((new Date(booking.checkout) - new Date(booking.checkin)) / (1000*60*60*24)))
    : 1

  const total = (booking.price_per_night || booking.price || 0) * nights * (booking.rooms || 1)

  const handleDownload = () => {
    const text = `
DEALMATCH BOOKING RECEIPT
═════════════════════════════

Reference: ${refNo}
Date: ${today} at ${time}
Processed by: DealMatch Property Platform
Contact: +234 705 739 2060

─────────────────────────────
PROPERTY DETAILS
─────────────────────────────
Name:     ${booking.name || booking.hotel_name}
Location: ${booking.city}, ${booking.state}
Type:     ${booking.type || booking.category}

─────────────────────────────
BOOKING DETAILS
─────────────────────────────
Guest:      ${booking.guest_name}
Phone:      ${booking.guest_phone}
Check-in:   ${booking.checkin}
Check-out:  ${booking.checkout}
Nights:     ${nights}
Rooms:      ${booking.rooms || 1}
Guests:     ${booking.guests || 1}

─────────────────────────────
PAYMENT SUMMARY
─────────────────────────────
Rate:   ₦${(booking.price_per_night || booking.price || 0).toLocaleString()} per night
Total:  ₦${total.toLocaleString()}
Status: CONFIRMED BY DEALMATCH

─────────────────────────────
INSTRUCTIONS
─────────────────────────────
Present this receipt at check-in.
This document confirms your booking 
was processed and verified by DealMatch.

For support: WhatsApp +234 705 739 2060
Website: dealmatch-yvdm.vercel.app

© ${new Date().getFullYear()} DealMatch. All rights reserved.
    `.trim()

    const blob = new Blob([text], { type:'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `DealMatch-Receipt-${refNo}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    const text = `🏨 DealMatch Booking Receipt\n\nRef: ${refNo}\n${booking.name || booking.hotel_name}\n${booking.city}, ${booking.state}\n\nCheck-in: ${booking.checkin}\nCheck-out: ${booking.checkout}\nGuest: ${booking.guest_name}\n\nTotal: ₦${total.toLocaleString()}\n\nPresent this to hotel staff at check-in.\nFor support: wa.me/2347057392060`
    if (navigator.share) {
      await navigator.share({ title:'DealMatch Booking Receipt', text })
    } else {
      await navigator.clipboard.writeText(text)
      alert('Receipt copied to clipboard!')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{backgroundColor:'rgba(26,18,16,0.85)', backdropFilter:'blur(8px)'}}>
      <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}}
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{backgroundColor:'#FFFAF5', maxHeight:'90vh', overflowY:'auto'}}>

        {/* Receipt */}
        <div ref={receiptRef} className="p-6">

          {/* Header */}
          <div className="text-center mb-6 pb-5 border-b border-dashed" style={{borderColor:'#E8DDD2'}}>
            <div className="text-3xl mb-2">🏡</div>
            <h2 className="font-display font-black text-xl" style={{color:'#C96A3A'}}>DealMatch</h2>
            <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>Official Booking Receipt</p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{backgroundColor:'rgba(122,158,126,0.12)'}}>
              <div className="w-2 h-2 rounded-full" style={{backgroundColor:'#7A9E7E'}} />
              <span className="text-xs font-bold" style={{color:'#5C8060'}}>CONFIRMED</span>
            </div>
          </div>

          {/* Ref + Date */}
          <div className="flex justify-between text-xs mb-5" style={{color:'#8A7E78'}}>
            <div>
              <p className="font-bold uppercase tracking-wider" style={{color:'rgba(26,18,16,0.4)'}}>Reference</p>
              <p className="font-bold text-sm mt-0.5" style={{color:'#C96A3A'}}>{refNo}</p>
            </div>
            <div className="text-right">
              <p className="font-bold uppercase tracking-wider" style={{color:'rgba(26,18,16,0.4)'}}>Date</p>
              <p className="font-semibold mt-0.5" style={{color:'#1A1210'}}>{today}</p>
            </div>
          </div>

          {/* Property */}
          <div className="rounded-2xl p-4 mb-4" style={{backgroundColor:'rgba(26,18,16,0.03)', border:'1px solid #E8DDD2'}}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'rgba(26,18,16,0.4)'}}>Property</p>
            <p className="font-display font-black text-base" style={{color:'#1A1210'}}>
              {booking.name || booking.hotel_name}
            </p>
            <p className="text-xs mt-1" style={{color:'#8A7E78'}}>📍 {booking.city}, {booking.state}</p>
          </div>

          {/* Guest details */}
          <div className="rounded-2xl p-4 mb-4" style={{backgroundColor:'rgba(26,18,16,0.03)', border:'1px solid #E8DDD2'}}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'rgba(26,18,16,0.4)'}}>Guest</p>
            <p className="font-semibold text-sm" style={{color:'#1A1210'}}>{booking.guest_name}</p>
            <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>{booking.guest_phone}</p>
          </div>

          {/* Stay details */}
          <div className="rounded-2xl p-4 mb-4" style={{backgroundColor:'rgba(26,18,16,0.03)', border:'1px solid #E8DDD2'}}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'rgba(26,18,16,0.4)'}}>Stay Details</p>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div>
                <p className="text-xs" style={{color:'#8A7E78'}}>Check-in</p>
                <p className="font-semibold" style={{color:'#1A1210'}}>{booking.checkin}</p>
              </div>
              <div>
                <p className="text-xs" style={{color:'#8A7E78'}}>Check-out</p>
                <p className="font-semibold" style={{color:'#1A1210'}}>{booking.checkout}</p>
              </div>
              <div>
                <p className="text-xs" style={{color:'#8A7E78'}}>Nights</p>
                <p className="font-semibold" style={{color:'#1A1210'}}>{nights}</p>
              </div>
              <div>
                <p className="text-xs" style={{color:'#8A7E78'}}>Rooms</p>
                <p className="font-semibold" style={{color:'#1A1210'}}>{booking.rooms || 1}</p>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="rounded-2xl p-4 mb-5 text-center"
            style={{backgroundColor:'rgba(201,106,58,0.06)', border:'1px solid rgba(201,106,58,0.2)'}}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{color:'#8A7E78'}}>Total Amount</p>
            <p className="font-display font-black text-3xl" style={{color:'#C96A3A'}}>
              ₦{total.toLocaleString()}
            </p>
            <p className="text-xs mt-1" style={{color:'#8A7E78'}}>
              ₦{(booking.price_per_night || booking.price || 0).toLocaleString()} × {nights} night{nights>1?'s':''} × {booking.rooms || 1} room{(booking.rooms||1)>1?'s':''}
            </p>
          </div>

          {/* Instructions */}
          <div className="rounded-2xl p-4 mb-5"
            style={{backgroundColor:'rgba(122,158,126,0.08)', border:'1px solid rgba(122,158,126,0.2)'}}>
            <p className="text-xs font-bold mb-2" style={{color:'#5C8060'}}>📋 Check-in Instructions</p>
            <p className="text-xs leading-relaxed" style={{color:'#5C8060'}}>
              Present this receipt to hotel/property staff at check-in. This confirms your booking was processed and verified by DealMatch.
            </p>
          </div>

          {/* Footer */}
          <div className="text-center border-t border-dashed pt-4" style={{borderColor:'#E8DDD2'}}>
            <p className="text-xs" style={{color:'#8A7E78'}}>Processed by DealMatch</p>
            <p className="text-xs mt-0.5" style={{color:'#C96A3A'}}>+234 705 739 2060</p>
            <p className="text-xs mt-0.5" style={{color:'rgba(26,18,16,0.3)'}}>dealmatch-yvdm.vercel.app</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-5 pt-0 grid grid-cols-2 gap-3">
          <button onClick={handleDownload}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border-2"
            style={{borderColor:'#E8DDD2', color:'#5C4A3A', backgroundColor:'#FFFFFF'}}>
            <Download size={15} /> Download
          </button>
          <button onClick={handleShare}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
            style={{backgroundColor:'#C96A3A', color:'#FFFFFF'}}>
            <Share2 size={15} /> Share
          </button>
        </div>

        <div className="px-5 pb-5">
          <button onClick={onClose} className="w-full py-3 rounded-2xl text-sm font-semibold"
            style={{backgroundColor:'rgba(26,18,16,0.06)', color:'#8A7E78'}}>
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}
