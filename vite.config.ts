import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_URL || 'http://localhost:5001'
  const usePlaywrightClerkStub =
    (env.PLAYWRIGHT_CLERK_STUB || process.env.PLAYWRIGHT_CLERK_STUB || '').trim() === '1'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        ...(usePlaywrightClerkStub
          ? {
              '@clerk/clerk-react': path.resolve(__dirname, 'src/test/clerkPlaywrightStub.jsx')
            }
          : {})
      }
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
      exclude: ['**/.worktrees/**', '**/e2e/**'],
      setupFiles: ['./src/test/setup.js']
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
