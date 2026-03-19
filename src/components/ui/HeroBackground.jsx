import { useEffect, useRef } from 'react'

// Draws an animated canvas of people-nodes connected to property-nodes
// via living, breathing lines — like a heartbeat connecting two worlds.
export default function HeroBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // ── Node types ──────────────────────────────────────
    const PEOPLE_EMOJI  = ['👤','👩🏾','👨🏿','👩🏽','🧔🏽','👩🏻']
    const PROP_EMOJI    = ['🏡','🌿','🏢','🏠','🏘️','🏬']

    const W = () => canvas.width
    const H = () => canvas.height

    // Create nodes — people on left, properties on right
    const makeNodes = () => {
      const nodes = []
      const count = Math.min(6, Math.floor(W() / 130))

      for (let i = 0; i < count; i++) {
        // Person node — left cluster
        nodes.push({
          type:  'person',
          emoji: PEOPLE_EMOJI[i % PEOPLE_EMOJI.length],
          x: W() * 0.12 + (Math.random() - 0.5) * W() * 0.12,
          y: H() * (0.2 + (i / count) * 0.65),
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r:  18 + Math.random() * 8,
          pulse: Math.random() * Math.PI * 2,
          paired: i, // paired with property i
        })
        // Property node — right cluster
        nodes.push({
          type:  'property',
          emoji: PROP_EMOJI[i % PROP_EMOJI.length],
          x: W() * 0.88 + (Math.random() - 0.5) * W() * 0.12,
          y: H() * (0.2 + (i / count) * 0.65),
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r:  18 + Math.random() * 8,
          pulse: Math.random() * Math.PI * 2,
          paired: i,
        })
      }
      return nodes
    }

    let nodes = makeNodes()
    let t = 0

    // ── Heart pulse along the chain ─────────────────────
    const drawChain = (x1, y1, x2, y2, progress, alpha) => {
      const mx = (x1 + x2) / 2
      const my = (y1 + y2) / 2 - 40 // slight arc upward

      // Main connection line — gradient from person to property
      const grad = ctx.createLinearGradient(x1, y1, x2, y2)
      grad.addColorStop(0,   `rgba(201,106,58,${alpha * 0.5})`)
      grad.addColorStop(0.5, `rgba(212,168,83,${alpha * 0.8})`)
      grad.addColorStop(1,   `rgba(122,158,126,${alpha * 0.5})`)

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.quadraticCurveTo(mx, my, x2, y2)
      ctx.strokeStyle = grad
      ctx.lineWidth   = 1.5
      ctx.setLineDash([4, 6])
      ctx.lineDashOffset = -t * 0.8
      ctx.stroke()
      ctx.setLineDash([])

      // Travelling pulse dot
      const bt = progress
      const px = (1-bt)*(1-bt)*x1 + 2*(1-bt)*bt*mx + bt*bt*x2
      const py = (1-bt)*(1-bt)*y1 + 2*(1-bt)*bt*my + bt*bt*y2

      const glow = ctx.createRadialGradient(px, py, 0, px, py, 8)
      glow.addColorStop(0,   `rgba(212,168,83,${alpha * 0.9})`)
      glow.addColorStop(0.5, `rgba(201,106,58,${alpha * 0.4})`)
      glow.addColorStop(1,   'rgba(201,106,58,0)')
      ctx.beginPath()
      ctx.arc(px, py, 8, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.fill()

      // Heart at midpoint, pulsing
      const heartScale = 0.8 + Math.sin(t * 0.04 + progress * Math.PI) * 0.2
      const hx = mx
      const hy = my
      ctx.save()
      ctx.translate(hx, hy)
      ctx.scale(heartScale, heartScale)
      ctx.font = '14px serif'
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.globalAlpha  = alpha * 0.7
      ctx.fillText('❤️', 0, 0)
      ctx.restore()
    }

    const drawNode = (node) => {
      node.pulse += 0.025
      const scale = 1 + Math.sin(node.pulse) * 0.08

      // Glow ring
      const color = node.type === 'person'
        ? `rgba(201,106,58,`
        : `rgba(122,158,126,`
      const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 2.5)
      glow.addColorStop(0,   color + '0.15)')
      glow.addColorStop(0.5, color + '0.06)')
      glow.addColorStop(1,   color + '0)')
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.r * 2.5, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.fill()

      // Circle background
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.r * scale, 0, Math.PI * 2)
      ctx.fillStyle = node.type === 'person'
        ? 'rgba(201,106,58,0.12)'
        : 'rgba(122,158,126,0.12)'
      ctx.fill()
      ctx.strokeStyle = node.type === 'person'
        ? 'rgba(201,106,58,0.3)'
        : 'rgba(122,158,126,0.3)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Emoji
      ctx.font = `${node.r * scale}px serif`
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.globalAlpha  = 0.85
      ctx.fillText(node.emoji, node.x, node.y)
      ctx.globalAlpha  = 1
    }

    const animate = () => {
      t++
      ctx.clearRect(0, 0, W(), H())

      // Separate people and property nodes
      const people     = nodes.filter(n => n.type === 'person')
      const properties = nodes.filter(n => n.type === 'property')

      // Draw connections first (behind nodes)
      people.forEach((person, i) => {
        const prop = properties[i % properties.length]
        if (!prop) return
        const progress = ((t * 0.008) + i * 0.3) % 1
        drawChain(person.x, person.y, prop.x, prop.y, progress, 0.7)
      })

      // Draw nodes on top
      nodes.forEach(node => {
        // Gentle float
        node.x += node.vx
        node.y += node.vy

        // Soft boundary bounce
        const marginX = W() * (node.type === 'person' ? 0.22 : 0.78)
        const spread  = W() * 0.1
        if (node.type === 'person') {
          if (node.x < spread)        { node.x = spread;        node.vx *= -1 }
          if (node.x > marginX)       { node.x = marginX;       node.vx *= -1 }
        } else {
          if (node.x < marginX)       { node.x = marginX;       node.vx *= -1 }
          if (node.x > W() - spread)  { node.x = W() - spread;  node.vx *= -1 }
        }
        if (node.y < H() * 0.1)      { node.y = H() * 0.1;     node.vy *= -1 }
        if (node.y > H() * 0.9)      { node.y = H() * 0.9;     node.vy *= -1 }

        drawNode(node)
      })

      animId = requestAnimationFrame(animate)
    }

    animate()

    // Recreate nodes on resize
    const handleResize = () => { nodes = makeNodes() }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  )
}
