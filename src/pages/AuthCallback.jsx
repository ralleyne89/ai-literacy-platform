import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { clearStoredAuthReturnTo, getStoredAuthReturnTo } from '../config/authRoutes'
import { useAuth } from '../contexts/AuthContext'

const readAuthError = (location) => {
  const params = new URLSearchParams(location.search || '')
  const hashParams = new URLSearchParams(String(location.hash || '').replace(/^#/, ''))
  return (
    params.get('error_description') ||
    params.get('error') ||
    hashParams.get('error_description') ||
    hashParams.get('error') ||
    ''
  )
}

const readAuthCode = (location) => {
  const params = new URLSearchParams(location.search || '')
  return params.get('code') || ''
}

const AuthCallback = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { exchangeOAuthCodeForSession, isAuthenticated, loading } = useAuth()
  const [message, setMessage] = useState('Finishing secure sign-in...')
  const hasHandledCallback = useRef(false)
  const returnTo = location.state?.returnTo || getStoredAuthReturnTo() || '/dashboard'

  useEffect(() => {
    if (hasHandledCallback.current) {
      return
    }

    const authError = readAuthError(location)
    if (authError) {
      hasHandledCallback.current = true
      clearStoredAuthReturnTo()
      navigate('/login', {
        replace: true,
        state: {
          from: { pathname: returnTo },
          authError: {
            code: 'supabase_oauth_error',
            error: authError,
          },
        },
      })
      return
    }

    const authCode = readAuthCode(location)
    if (authCode) {
      hasHandledCallback.current = true
      setMessage('Confirming your Supabase session...')

      exchangeOAuthCodeForSession(authCode).then((result) => {
        clearStoredAuthReturnTo()

        if (result.success) {
          navigate(returnTo, { replace: true })
          return
        }

        navigate('/login', {
          replace: true,
          state: {
            from: { pathname: returnTo },
            authError: {
              code: result.code || 'supabase_callback_failed',
              error: result.error || 'Unable to complete sign-in. Please try again.',
            },
          },
        })
      })
      return
    }

    if (loading) {
      return
    }

    hasHandledCallback.current = true
    clearStoredAuthReturnTo()

    if (isAuthenticated) {
      navigate(returnTo, { replace: true })
      return
    }

    navigate('/login', {
      replace: true,
      state: {
        from: { pathname: returnTo },
        authError: {
          code: 'missing_supabase_callback',
          error: 'No Supabase sign-in session was found. Please sign in again.',
        },
      },
    })
  }, [exchangeOAuthCodeForSession, isAuthenticated, loading, location, navigate, returnTo])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="rounded-lg bg-white shadow-sm border border-slate-200 px-6 py-8 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600" />
        <p className="text-slate-700 font-medium">{message}</p>
      </div>
    </div>
  )
}

export default AuthCallback
