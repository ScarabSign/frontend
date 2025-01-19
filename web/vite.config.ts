import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
    },
    host: '0.0.0.0',
    strictPort: true,
    port: 5173,
    hmr: {
      clientPort: process.env.VITE_HMR_PORT,
      host: '0.0.0.0'
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173
  }
})
