import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'
import { API_BASE_URL, isConfiguredApiLocalhost } from './config/apiEndpoints'

console.info('[boot] Configured API base:', API_BASE_URL || '(unset)')
console.info('[boot] Configured auth mode:', import.meta.env.VITE_AUTH_MODE || '(unset)')

if (API_BASE_URL) {
  axios.defaults.baseURL = API_BASE_URL
}

if (typeof window !== 'undefined') {
  const localHostnames = new Set(['localhost', '127.0.0.1', '0.0.0.0'])
  const isLocalWindow = localHostnames.has(window.location.hostname)

  if (!isLocalWindow) {
    if (!API_BASE_URL) {
      console.error(
        'VITE_API_URL is not configured. Backend auth endpoints (/api/auth/login, /api/auth/profile) may be routed to this frontend host and return the SPA HTML page.'
      )
    } else if (isConfiguredApiLocalhost()) {
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
