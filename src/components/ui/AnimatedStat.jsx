import { useInView } from 'react-intersection-observer'
import CountUp from 'react-countup'

export default function AnimatedStat({ value, suffix = '', prefix = '', label, color = 'text-blush' }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 })

  // Parse numeric value from string like "12,400" or "2.3"
  const numericValue = parseFloat(value.toString().replace(/[^0-9.]/g, '')) || 0
  const isDecimal = value.toString().includes('.')

  return (
    <div ref={ref} className="text-center">
      <p className={`font-display text-4xl font-black ${color}`}>
        {prefix}
        {inView ? (
          <CountUp
            start={0}
            end={numericValue}
            duration={2.5}
            separator=","
            decimals={isDecimal ? 1 : 0}
            easingFn={(t, b, c, d) => {
              // Ease out expo
              if (t === d) return b + c
              return c * (-Math.pow(2, -10 * t / d) + 1) + b
            }}
          />
        ) : '0'}
        {suffix}
      </p>
      <p className="text-white/30 text-xs mt-1">{label}</p>
    </div>
  )
}
