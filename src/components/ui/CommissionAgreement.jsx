import { useState } from 'react'
import clsx from 'clsx'

// Commission rates by category
const COMMISSION = {
  sale:     { rate: 1.5,  label: '1.5% of final sale price',     example: 'e.g. ₦38M sale = ₦570,000' },
  rental:   { rate: 3,    label: '3% of first year total rent',   example: 'e.g. ₦200k/month = ₦72,000' },
  shortlet: { rate: 8,    label: '8% per confirmed booking',      example: 'e.g. ₦25,000/night = ₦2,000' },
  hotel:    { rate: 8,    label: '8% per confirmed booking',      example: 'e.g. ₦35,000/night = ₦2,800' },
}

export default function CommissionAgreement({ category = 'sale', agreed, onChange }) {
  const c = COMMISSION[category] || COMMISSION.sale
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-2xl border-2 p-4 transition-all"
      style={{
        borderColor: agreed ? '#C96A3A' : '#E8DDD2',
        backgroundColor: agreed ? 'rgba(201,106,58,0.04)' : '#FFFFFF',
      }}>

      {/* Main checkbox row */}
      <label className="flex items-start gap-3 cursor-pointer">
        <div className="mt-0.5 flex-shrink-0">
          <div
            className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
            style={{
              borderColor: agreed ? '#C96A3A' : '#E8DDD2',
              backgroundColor: agreed ? '#C96A3A' : '#FFFFFF',
            }}
            onClick={() => onChange(!agreed)}
          >
            {agreed && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{color:'#1A1210'}}>
            I agree to DealMatch's success commission
          </p>
          <p className="text-xs mt-0.5" style={{color:'#8A7E78'}}>
            <strong style={{color:'#C96A3A'}}>{c.label}</strong> : {c.example}
          </p>
        </div>
      </label>

      {/* Expand for full terms */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mt-3 text-xs font-semibold flex items-center gap-1 transition-colors"
        style={{color:'#C96A3A'}}>
        {expanded ? '▲ Hide' : '▼ Read'} full terms
      </button>

      {expanded && (
        <div className="mt-3 p-3 rounded-xl text-xs leading-relaxed space-y-2"
          style={{backgroundColor:'rgba(26,18,16,0.03)', color:'#8A7E78'}}>
          <p><strong style={{color:'#1A1210'}}>How it works:</strong></p>
          <p>• Listing on DealMatch is <strong>completely free</strong>.</p>
          <p>• A success commission of <strong style={{color:'#C96A3A'}}>{c.rate}%</strong> is charged only when your property is successfully sold, rented, or booked through DealMatch.</p>
          <p>• Commission is paid via Paystack before the final handover or key exchange.</p>
          <p>• If no deal is closed through DealMatch, you pay nothing.</p>
          <p>• By checking this box you confirm you understand and agree to these terms.</p>
          <p style={{color:'rgba(26,18,16,0.4)'}}>
            Questions? WhatsApp us at +234 705 739 2060
          </p>
        </div>
      )}
    </div>
  )
}
