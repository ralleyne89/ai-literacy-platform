import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { setStoredAuthReturnTo } from '../config/authRoutes'
import AuthOAuthShell from './AuthOAuthShell'


const getReturnPath = (fromState, fallback = '/dashboard') => {
  if (typeof fromState === 'string') {
    return fromState.startsWith('/') && !fromState.startsWith('//') ? fromState : fallback
  }

  const pathname = fromState?.pathname
  if (typeof pathname !== 'string' || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return fallback
  }

  const search = typeof fromState.search === 'string' ? fromState.search : ''
  const hash = typeof fromState.hash === 'string' ? fromState.hash : ''

  return `${pathname}${search}${hash}`
}

const LoginPage = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const callbackError = location.state?.authError
  const fromState = location.state?.from
  const from = getReturnPath(fromState)

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [from, isAuthenticated, navigate])

  useEffect(() => {
    if (callbackError?.error) {
      setError(callbackError.error)
    }
  }, [callbackError])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    setStoredAuthReturnTo(from)

    const result = await login()
    if (!result.success) {
      setError(result.error || 'Unable to start sign-in.')
      setLoading(false)
    }
  }

  return (
    <AuthOAuthShell
      mode="login"
      eyebrow="Sign in"
      title="Sign in to LitmusAI"
      description="Use your Google account to continue into LitmusAI and keep your learning progress connected across every step."
      actionLabel="Continue with Google"
      loadingLabel="Opening Google..."
      alternatePrompt="New here?"
      alternateLabel="Create an account"
      alternateTo="/register"
      alternateState={{ from }}
      returnCopy={
        from === '/dashboard'
          ? 'Google will bring you back to your dashboard after sign-in.'
          : 'Google will bring you back to your requested page after sign-in.'
      }
      error={error}
      loading={loading}
      onSubmit={handleSubmit}
    />
  )
}

export default LoginPage
