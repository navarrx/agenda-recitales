import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: true, // needed for railway
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  preview: {
    port: parseInt(process.env.PORT || '3000'),
    host: true,
    allowedHosts: [
      'healthcheck.railway.app',
      'localhost',
      '127.0.0.1',
      // 'agenda-recitales-production.up.railway.app',
      '*.up.railway.app'
    ]
  }
}) 