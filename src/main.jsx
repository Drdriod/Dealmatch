import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import posthog from 'posthog-js'
import App from './App'
import './index.css'

// ─── Sentry — error tracking ───────────────────────────────
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new Sentry.BrowserTracing({ tracePropagationTargets: ['dealmatch-yvdm.vercel.app'] }),
      new Sentry.Replay({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate:          import.meta.env.PROD ? 0.1  : 1.0,
    replaysSessionSampleRate:  import.meta.env.PROD ? 0.05 : 0,
    replaysOnErrorSampleRate:  1.0,
    enabled: true,
    beforeSend(event) {
      // Strip PII from error reports
      if (event.user) delete event.user.ip_address
      return event
    },
  })
}

// ─── PostHog — product analytics ──────────────────────────
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host:         import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    loaded: ph => { if (import.meta.env.DEV) ph.opt_out_capturing() },
  })
}

// ─── Register Service Worker ───────────────────────────────
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={
      <div style={{ padding:40, textAlign:'center', fontFamily:'sans-serif' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>😕</div>
        <h2 style={{ marginBottom:8 }}>Something went wrong</h2>
        <p style={{ color:'#666', marginBottom:24 }}>DealMatch hit an error. We've been notified.</p>
        <button onClick={() => window.location.href='/'} style={{ padding:'12px 28px', backgroundColor:'#C96A3A', color:'white', border:'none', borderRadius:100, cursor:'pointer', fontWeight:600 }}>
          Go Home
        </button>
      </div>
    }>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
)
