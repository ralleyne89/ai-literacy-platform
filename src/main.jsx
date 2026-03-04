import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'
import { isConfiguredApiLocalhost, resolveApiBaseUrl } from './config/apiBaseUrl'

const apiBaseURL = resolveApiBaseUrl()
if (apiBaseURL) {
  axios.defaults.baseURL = apiBaseURL
}

if (typeof window !== 'undefined') {
  const localHostnames = new Set(['localhost', '127.0.0.1', '0.0.0.0'])
  const isLocalWindow = localHostnames.has(window.location.hostname)
  const configuredApiBaseUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')

  if (!isLocalWindow) {
    if (!configuredApiBaseUrl) {
      console.error(
        'VITE_API_URL is not configured. Backend auth endpoints (/api/auth/login, /api/auth/profile) may be routed to this frontend host and return the SPA HTML page.'
      )
    } else if (isConfiguredApiLocalhost() && apiBaseURL === window.location.origin) {
      console.error(
        'VITE_API_URL is configured with localhost in non-local runtime. Update VITE_API_URL to your public backend host so /api/auth/login and /api/auth/profile reach the backend.'
      )
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
