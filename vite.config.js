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
          // Heavy PDF rendering libs — only loaded when MangaReader is visited
          'pdf-renderer': ['react-pdf', 'pdfjs-dist'],
          // Vendor: core React ecosystem (shared across all routes)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Other large optional deps
          'html2canvas': ['html2canvas'],
          'dompurify': ['dompurify'],
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
