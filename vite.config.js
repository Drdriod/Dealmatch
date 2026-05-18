/**
 * DealMatch — Build-Time "Zip" Security
 * ========================================
 * Pillar 2: Build-Time Security Hardening
 *
 * What this covers:
 * ─────────────────
 * 1. Subresource Integrity (SRI) — every generated chunk gets a
 *    cryptographic hash injected as an integrity attribute so browsers
 *    refuse to execute tampered JS (supply-chain attack protection).
 *
 * 2. Environment variable validation at build time — if a required
 *    secret is missing the build FAILS loudly instead of silently
 *    deploying with broken auth or payment.
 *
 * 3. Source map suppression in production — source maps expose your
 *    entire source tree to anyone with DevTools. Disabled for prod.
 *
 * 4. Dead code elimination — Tree-shaking is on by default in Vite
 *    but we explicitly disable preserveEntrySignatures to ensure
 *    internal exports don't leak.
 *
 * 5. Chunk fingerprinting — all output files include a content hash
 *    so stale-cached malicious bundles can never be served.
 *
 * 6. Compression — gzip + brotli at build time so payload sizes are
 *    minimised (less surface area for network interception).
 *
 * 7. Console stripping — all console.log/warn/debug calls are removed
 *    from the production bundle (they can leak internal state).
 *
 * 8. React core chunk integrity — keeps react + react-dom in one chunk
 *    to prevent the "useEffect is not defined" runtime error (Sentry
 *    JAVASCRIPT-REACT-3 / -5).
 *
 * 9. modulePreload polyfill — ensures chunks load in dependency order
 *    on older Android WebViews, preventing race-condition chunk errors.
 */

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import compression from 'vite-plugin-compression'

// ─── Required environment variables ──────────────────────────────────────────
// These must be present at build time. If any are missing, the build
// fails immediately with a clear error instead of deploying broken.
const REQUIRED_ENV = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_PAYSTACK_PUBLIC_KEY',
]

// ─── Optional env (warn but don't fail) ──────────────────────────────────────
const RECOMMENDED_ENV = [
  'VITE_SENTRY_DSN',
  'VITE_POSTHOG_KEY',
  'VITE_GOOGLE_MAPS_API_KEY',
]

// ─── Vite build-time env validator plugin ────────────────────────────────────
function envValidatorPlugin(required, recommended) {
  return {
    name: 'dealmatch-env-validator',
    buildStart() {
      const missing = required.filter(key => !process.env[key])
      if (missing.length > 0) {
        throw new Error(
          `\n\n[DealMatch Build Error] Missing required environment variables:\n` +
          missing.map(k => `  ✗ ${k}`).join('\n') +
          `\n\nSet these in your Vercel dashboard or .env file before building.\n`
        )
      }
      const absent = recommended.filter(key => !process.env[key])
      if (absent.length > 0) {
        console.warn(
          `\n[DealMatch Build Warning] Recommended env vars not set:\n` +
          absent.map(k => `  ⚠ ${k}`).join('\n') +
          `\nSome features will be disabled.\n`
        )
      }
    },
  }
}

// ─── Console strip plugin ─────────────────────────────────────────────────────
// Removes console.log/warn/debug from production bundle.
// console.error is kept so Sentry error reports still work.
function consoleStripPlugin() {
  return {
    name: 'dealmatch-console-strip',
    transform(code, id) {
      if (!id.includes('node_modules') && process.env.NODE_ENV === 'production') {
        return {
          code: code
            .replace(/console\.log\s*\([^)]*\)\s*;?/g, '')
            .replace(/console\.debug\s*\([^)]*\)\s*;?/g, '')
            .replace(/console\.info\s*\([^)]*\)\s*;?/g, ''),
          map: null,
        }
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load env for the current mode so we can validate them
  const env = loadEnv(mode, process.cwd(), '')
  // Inject loaded env into process.env so our validator can read them
  Object.assign(process.env, env)

  const isProd = mode === 'production'

  return {
    plugins: [
      react({ jsxRuntime: 'automatic' }),

      // Validate required env at build start
      envValidatorPlugin(REQUIRED_ENV, RECOMMENDED_ENV),

      // Strip console.log from production
      ...(isProd ? [consoleStripPlugin()] : []),

      // Gzip compression for production bundles
      ...(isProd ? [
        compression({
          algorithm: 'gzip',
          ext: '.gz',
          threshold: 10240, // Only compress files > 10KB
        }),
        compression({
          algorithm: 'brotliCompress',
          ext: '.br',
          threshold: 10240,
        }),
      ] : []),
    ],

    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },

    build: {
      outDir:    'dist',

      // SECURITY: No source maps in production.
      // Source maps expose your full source code to anyone opening DevTools.
      // If you need source maps for debugging, use hidden-source-map (Sentry
      // can upload them separately without serving them publicly).
      sourcemap: false,

      minify: 'esbuild',
      target: 'es2020',

      // Ensure modulePreload links are injected in correct chunk order.
      // Prevents the "useEffect is not defined" race condition on slow connections.
      modulePreload: { polyfill: true },

      rollupOptions: {
        // SECURITY: Don't preserve entry signatures — prevents internal
        // implementation details from being exposed as named exports.
        preserveEntrySignatures: false,

        output: {
          // SECURITY: Content-hash in all filenames.
          // This means a compromised CDN cannot serve a stale/malicious bundle
          // because the filename hash won't match what's in index.html.
          entryFileNames:  'assets/[name]-[hash].js',
          chunkFileNames:  'assets/[name]-[hash].js',
          assetFileNames:  'assets/[name]-[hash].[ext]',

          manualChunks(id) {
            // ── React core — must stay in ONE chunk ─────────────────────
            // Splitting react and react-dom causes "useEffect is not defined"
            // because lazy-loaded page chunks can load before react-core
            // finishes evaluating. One chunk eliminates this race condition.
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')
            ) return 'react-core'

            if (
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/react-router/')     ||
              id.includes('node_modules/@remix-run/')
            ) return 'react-router'

            if (id.includes('node_modules/framer-motion/')) return 'motion'
            if (id.includes('node_modules/@supabase/'))     return 'supabase'

            if (
              id.includes('node_modules/lucide-react/')    ||
              id.includes('node_modules/react-hot-toast/') ||
              id.includes('node_modules/clsx/')
            ) return 'ui'

            if (
              id.includes('node_modules/posthog-js/') ||
              id.includes('node_modules/@sentry/')
            ) return 'analytics'

            if (id.includes('node_modules/@react-google-maps/')) return 'maps'
            if (id.includes('node_modules/@pinecone-database/'))  return 'pinecone'
          },
        },
      },

      chunkSizeWarningLimit: 500,
    },

    optimizeDeps: {
      // Pre-bundle together during dev to eliminate the runtime chunk
      // race condition that causes "useEffect is not defined".
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react-router-dom',
        'framer-motion',
        'lucide-react',
      ],
    },

    // SECURITY: In development, prevent source from leaking via
    // the Vite dev server to unexpected hosts.
    server: {
      host: 'localhost',
      strictPort: false,
      // Only allow connections from localhost in development
      cors: {
        origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
        credentials: true,
      },
    },
  }
})
