import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  // Auto-detects environment:
  // GitHub Actions sets GITHUB_ACTIONS=true automatically
  // Vercel does not — so base defaults to '/'
  base: process.env.GITHUB_ACTIONS ? '/Dealmatch/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'motion':       ['framer-motion'],
          'maps':         ['@react-google-maps/api'],
          'supabase':     ['@supabase/supabase-js'],
        },
      },
    },
  },
  server: {
    port: 3000,
  },
})
