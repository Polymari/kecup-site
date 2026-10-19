import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (
            id.includes('node_modules/three') ||
            id.includes('node_modules/@react-three') ||
            id.includes('node_modules/three-stdlib')
          ) {
            return 'three'
          }
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'charts'
          }
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/scheduler') ||
            id.includes('node_modules/react-router')
          ) {
            return 'react'
          }
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
})
