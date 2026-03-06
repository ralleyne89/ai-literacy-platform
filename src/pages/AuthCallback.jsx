import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { clearStoredAuthReturnTo, getStoredAuthReturnTo } from '../config/authRoutes'
import { useAuth } from '../contexts/AuthContext'

const buildCallbackFailureState = (result, fallback = '') => {
  if (!result) {
    return {
      code: 'auth_callback_failed',
      error: fallback || 'Unable to complete sign-in.',
      details: ''
    }
  }

  if (typeof result === 'object') {
    return {
      code: result.code || 'auth_callback_failed',
      error: result.error || result.message || fallback || 'Unable to complete sign-in.',
      details: result.details || ''
    }
  }

  return {
    code: 'auth_callback_failed',
    error: String(result) || fallback || 'Unable to complete sign-in.',
    details: ''
  }
}

const isAuthResultSuccessful = (value) => value === true || (value && value.success === true)

const AuthCallback = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { syncBackendAfterLogin, loading, isAuthenticated } = useAuth()
  const [statusMessage, setStatusMessage] = useState('Checking your account…')
  const [errorMessage, setErrorMessage] = useState('')
  const returnTo = location.state?.returnTo || getStoredAuthReturnTo() || '/dashboard'

  useEffect(() => {
    let isActive = true
    let redirectTimeoutId

    const finalize = async () => {
      if (loading) {
        return
      }

      if (isAuthenticated) {
        clearStoredAuthReturnTo()
        navigate(returnTo, { replace: true })
        return
      }

      const syncResult = await syncBackendAfterLogin?.()

      if (!isActive) {
        return
      }

      if (isAuthResultSuccessful(syncResult)) {
        clearStoredAuthReturnTo()
        navigate(returnTo, { replace: true })
        return
      }

      const failure = buildCallbackFailureState(syncResult, 'Unable to complete sign-in.')
      setErrorMessage(`Sign-in could not be completed: ${failure.error}`)
      setStatusMessage('Redirecting to sign in...')
      clearStoredAuthReturnTo()
      redirectTimeoutId = setTimeout(() => {
        if (!isActive) {
          return
        }
        navigate('/login', {
          replace: true,
          state: {
            from: { pathname: returnTo },
            authError: failure
          }
        })
      }, 1500)
    }

    finalize().catch((err) => {
      if (!isActive) {
        return
      }

      console.error('Auth callback failed:', err)
      setErrorMessage('Unable to finalize sign-in. Please try again from the login page.')
      setStatusMessage('Redirecting to sign in...')
      clearStoredAuthReturnTo()
      const failure = buildCallbackFailureState(
        err,
        'Unable to finalize sign-in. Please try again from the login page.'
      )
      redirectTimeoutId = setTimeout(() => {
        if (!isActive) {
          return
        }
        navigate('/login', {
          replace: true,
          state: {
            from: { pathname: returnTo },
            authError: failure
          }
        })
      }, 1500)
    })

    return () => {
      isActive = false
      if (redirectTimeoutId) {
        clearTimeout(redirectTimeoutId)
      }
    }
  }, [
    returnTo,
    isAuthenticated,
    loading,
    navigate,
    syncBackendAfterLogin
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
