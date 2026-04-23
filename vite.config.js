import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
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
