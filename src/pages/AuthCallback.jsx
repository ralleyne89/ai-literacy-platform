import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const extractAuthErrorMessage = (search = '', hash = '') => {
  const query = new URLSearchParams(search)
  const fragment = hash.startsWith('#') ? hash.substring(1) : hash
  const hashParams = new URLSearchParams(fragment)

  const error = query.get('error') || hashParams.get('error')
  if (!error) {
    return null
  }

  const errorDescription = query.get('error_description') || hashParams.get('error_description')
  return errorDescription ? `${error}: ${errorDescription}` : error
}

const AuthCallback = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { syncBackendAfterLogin, loading } = useAuth()
  const [statusMessage, setStatusMessage] = useState('Checking your account…')
  const [errorMessage, setErrorMessage] = useState('')

  const authErrorMessage = extractAuthErrorMessage(location.search, location.hash)

  useEffect(() => {
    let isActive = true

    const finalize = async () => {
      if (authErrorMessage) {
        setErrorMessage(`OAuth callback error: ${authErrorMessage}`)
        setStatusMessage('Redirecting to sign in...')
        navigate('/login', { replace: true })
        return
      }

      await syncBackendAfterLogin?.()

      if (!isActive) {
        return
      }

      navigate('/dashboard', { replace: true })
    }

    finalize().catch((err) => {
      if (!isActive) {
        return
      }

      console.error('Auth callback failed:', err)
      setErrorMessage('Unable to finalize sign-in. Please try again from the login page.')
      setStatusMessage('Redirecting to sign in...')
      navigate('/login', { replace: true })
    })

    return () => {
      isActive = false
    }
  }, [authErrorMessage, navigate, syncBackendAfterLogin])

  useEffect(() => {
    setStatusMessage(loading ? 'Checking your account…' : 'Finishing sign-in…')
  }, [loading])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 px-6 py-8 text-center">
        <p className="text-gray-700 font-medium">{errorMessage || statusMessage}</p>
      </div>
    </div>
  )
}

export default AuthCallback
