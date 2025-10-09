import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'

const apiBaseURL = import.meta.env.VITE_API_URL

if (apiBaseURL) {
  axios.defaults.baseURL = apiBaseURL
} else if (typeof window !== 'undefined') {
  const origin = window.location.origin
  // In production (Netlify), use Netlify Functions
  // In development, use local backend
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    const fallback = origin.replace(/:\d+$/, ':5001')
    axios.defaults.baseURL = fallback
  } else {
    // Use Netlify Functions (same origin)
    axios.defaults.baseURL = origin
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
