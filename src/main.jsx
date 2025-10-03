import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'

const apiBaseURL = import.meta.env.VITE_API_URL
if (apiBaseURL) {
  axios.defaults.baseURL = apiBaseURL
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
