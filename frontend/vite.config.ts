import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.nextTick': '(fn, ...args) => setTimeout(() => fn(...args), 0)',
  },
  optimizeDeps: {
    include: ['buffer'],
  },
})
