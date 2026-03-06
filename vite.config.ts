import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_URL || 'http://localhost:5001'
  const usePlaywrightAuth0Stub =
    (env.PLAYWRIGHT_AUTH0_STUB || process.env.PLAYWRIGHT_AUTH0_STUB || '').trim() === '1'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        ...(usePlaywrightAuth0Stub
          ? {
              '@auth0/auth0-react': path.resolve(__dirname, 'src/test/auth0PlaywrightStub.jsx')
            }
          : {})
      }
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js']
    },
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
