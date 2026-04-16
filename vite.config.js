import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        // ✅ PERFORMANCE: split big deps into separate cached chunks
        manualChunks: {
          'react-vendor':  ['react', 'react-dom', 'react-router-dom'],
          'motion':        ['framer-motion'],
          'supabase':      ['@supabase/supabase-js'],
          'ui':            ['lucide-react', 'react-hot-toast', 'clsx'],
          'analytics':     ['posthog-js', '@sentry/react'],
          'maps':          ['@react-google-maps/api'],
        },
      },
    },
    // ✅ PERFORMANCE: warn if any chunk exceeds 500KB
    chunkSizeWarningLimit: 500,
  },
  // ✅ PERFORMANCE: pre-bundle deps to prevent cold-start waterfalls
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'lucide-react'],
  },
})
