import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'
import { resolveApiBaseUrl } from './config/apiBaseUrl'

const apiBaseURL = resolveApiBaseUrl()
if (apiBaseURL) {
  axios.defaults.baseURL = apiBaseURL
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
