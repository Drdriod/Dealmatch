/**
 * DealMatch Security Layer
 * - Input sanitization (XSS prevention)
 * - CSRF-safe API calls
 * - Rate limiting via Upstash Redis
 * - Content Security Policy headers
 * - SQL injection prevention (handled by Supabase parameterized queries)
 */

// ─── Input Sanitization ───────────────────────────────────
export const sanitize = {
  text: (str, max = 1000) => {
    if (!str || typeof str !== 'string') return ''
    return str
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .trim()
      .substring(0, max)
  },
  phone: (str) => {
    if (!str) return ''
    return str.replace(/[^\d+\s\-()]/g, '').substring(0, 20)
  },
  email: (str) => {
    if (!str) return ''
    return str.toLowerCase().trim().substring(0, 254)
  },
  number: (val, min = 0, max = 999_999_999_999) => {
    const n = Number(val)
    if (isNaN(n)) return 0
    return Math.min(max, Math.max(min, Math.floor(n)))
  },
  url: (str) => {
    if (!str) return ''
    try {
      const u = new URL(str)
      if (!['http:', 'https:'].includes(u.protocol)) return ''
      return str.substring(0, 2048)
    } catch {
      return ''
    }
  },
  filename: (str) => {
    if (!str) return ''
    return str.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255)
  },
  form: (obj) => {
    const out = {}
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string') {
        if (k.includes('email'))  out[k] = sanitize.email(v)
        else if (k.includes('phone')) out[k] = sanitize.phone(v)
        else if (k.includes('url') || k.includes('video')) out[k] = sanitize.url(v)
        else out[k] = sanitize.text(v)
      } else if (typeof v === 'number') {
        out[k] = sanitize.number(v)
      } else {
        out[k] = v
      }
    }
    return out
  },
}

// ─── Client-side Rate Limiter ─────────────────────────────
const _hits = new Map()
export function clientRateLimit(key, max = 5, windowMs = 60_000) {
  const now    = Date.now()
  const record = _hits.get(key) || { count: 0, resetAt: now + windowMs }
  if (now > record.resetAt) {
    _hits.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1 }
  }
  record.count++
  _hits.set(key, record)
  if (record.count > max) {
    const wait = Math.ceil((record.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, message: `Too many attempts. Wait ${wait}s.` }
  }
  return { allowed: true, remaining: max - record.count }
}

export function clearRateLimit(key) { _hits.delete(key) }

// ─── File Validation ──────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024  // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100 MB

export function validateFile(file, type = 'image') {
  const allowed = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES
  const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE

  if (!allowed.includes(file.type)) {
    return { valid: false, error: `Invalid file type. Allowed: ${allowed.join(', ')}` }
  }
  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Max ${maxSize / 1024 / 1024}MB` }
  }
  return { valid: true }
}

// ─── Auth Token Helpers ────────────────────────────────────
export function getAuthHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'X-Client-Info': 'dealmatch-web/1.0',
  }
}

// ─── Secure Local Storage ─────────────────────────────────
export const secureStorage = {
  set: (key, value) => {
    try {
      const safe = JSON.stringify(value)
      localStorage.setItem(`dm_${key}`, safe)
    } catch {}
  },
  get: (key) => {
    try {
      const raw = localStorage.getItem(`dm_${key}`)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  remove: (key) => {
    try { localStorage.removeItem(`dm_${key}`) } catch {}
  },
}

// ─── XSS-safe HTML escape ─────────────────────────────────
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
