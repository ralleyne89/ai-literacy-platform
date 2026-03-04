import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const AUTH0_CODE_VERIFIER_SESSION_KEY = 'ailiteracy_auth0_code_verifier'
const AUTH0_STATE_SESSION_KEY = 'ailiteracy_auth0_state'

const getStoredAuth0CallbackValue = (key) => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return ''
  }
  try {
    return window.sessionStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

const clearAuth0PkceCallbackData = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return
  }
  try {
    window.sessionStorage.removeItem(AUTH0_CODE_VERIFIER_SESSION_KEY)
    window.sessionStorage.removeItem(AUTH0_STATE_SESSION_KEY)
  } catch (error) {
    console.warn('Failed to clear Auth0 callback PKCE data:', error)
  }
}

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

const extractAuth0CallbackParams = (search = '', hash = '') => {
  const query = new URLSearchParams(search)
  const fragment = hash.startsWith('#') ? hash.substring(1) : hash
  const hashParams = new URLSearchParams(fragment)

  return {
    auth0AccessToken: hashParams.get('access_token') || hashParams.get('id_token') || '',
    auth0Code: query.get('code') || hashParams.get('code') || '',
    auth0State: query.get('state') || hashParams.get('state') || ''
  }
}

const AuthCallback = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { syncBackendAfterLogin, loading, isAuthenticated } = useAuth()
  const [statusMessage, setStatusMessage] = useState('Checking your account…')
  const [errorMessage, setErrorMessage] = useState('')

  const authErrorMessage = extractAuthErrorMessage(location.search, location.hash)
  const { auth0AccessToken, auth0Code, auth0State } = extractAuth0CallbackParams(
    location.search,
    location.hash
  )

  useEffect(() => {
    let isActive = true

    const finalize = async () => {
      if (loading) {
        return
      }

      if (authErrorMessage) {
        setErrorMessage(`OAuth callback error: ${authErrorMessage}`)
        setStatusMessage('Redirecting to sign in...')
        clearAuth0PkceCallbackData()
        navigate('/login', { replace: true })
        return
      }

      const auth0ExchangePayload = {
        auth0AccessToken,
        auth0Code
      }
      if (auth0Code) {
        const storedState = getStoredAuth0CallbackValue(AUTH0_STATE_SESSION_KEY)
        const storedCodeVerifier = getStoredAuth0CallbackValue(AUTH0_CODE_VERIFIER_SESSION_KEY)
        if (!storedState || !storedCodeVerifier || !auth0State || storedState !== auth0State) {
          setErrorMessage('OAuth callback state verification failed. Please sign in again.')
          setStatusMessage('Redirecting to sign in...')
          clearAuth0PkceCallbackData()
          navigate('/login', { replace: true })
          return
        }
        auth0ExchangePayload.auth0CodeVerifier = storedCodeVerifier
      }

      const authenticated = await syncBackendAfterLogin?.(auth0ExchangePayload)
      clearAuth0PkceCallbackData()

      if (!isActive) {
        return
      }

      if (authenticated || isAuthenticated) {
        navigate('/dashboard', { replace: true })
        return
      }

      navigate('/login', { replace: true })
    }

    finalize().catch((err) => {
      if (!isActive) {
        return
      }

      console.error('Auth callback failed:', err)
      setErrorMessage('Unable to finalize sign-in. Please try again from the login page.')
      setStatusMessage('Redirecting to sign in...')
      clearAuth0PkceCallbackData()
      navigate('/login', { replace: true })
    })

    return () => {
      isActive = false
    }
  }, [
    auth0AccessToken,
    auth0Code,
    auth0State,
    authErrorMessage,
    loading,
    navigate,
    syncBackendAfterLogin,
    isAuthenticated
  ])

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
