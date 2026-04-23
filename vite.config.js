import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // ── Core React (shared by all routes) ──
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // ── PDF Reader (only /doujin/:slug) ──
          'vendor-pdf': ['react-pdf', 'pdfjs-dist'],

          // ── Charts (only /bdlag/reports) ──
          'vendor-charts': ['recharts'],

          // ── PDF Generation (only /bdlag admin) ──
          'vendor-jspdf': ['jspdf', 'jspdf-autotable'],

          // ── Supabase (only /bdlag admin) ──
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
  preview: {
    allowedHosts: [
      'batodeluna-lu.art',
      'doujin.batodeluna-lu.art',
      'bdlag.batodeluna-lu.art',
      'www.batodeluna-lu.art',
    ],
    port: 4000,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
    allowedHosts: [
      'batodeluna-lu.art',
      'doujin.batodeluna-lu.art',
      'bdlag.batodeluna-lu.art',
      'www.batodeluna-lu.art',
    ],
  },
})
