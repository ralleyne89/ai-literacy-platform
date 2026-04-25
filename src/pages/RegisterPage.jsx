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

const RegisterPage = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = getReturnPath(location.state?.from)

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [from, isAuthenticated, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    setStoredAuthReturnTo(from)

    const result = await register()
    if (!result.success) {
      setError(result.error || 'Unable to start sign-up.')
      setLoading(false)
    }
  }

  return (
    <AuthOAuthShell
      mode="register"
      eyebrow="Create account"
      title="Create your LitmusAI account"
      description="Create a LitmusAI account with Google OAuth so assessments, training, and certifications stay connected from day one."
      actionLabel="Continue with Google"
      loadingLabel="Opening Google..."
      alternatePrompt="Already have an account?"
      alternateLabel="Sign in"
      alternateTo="/login"
      alternateState={{ from }}
      returnCopy={
        from === '/dashboard'
          ? 'Google will bring you into your dashboard after sign-up.'
          : 'Google will bring you back to your requested page after sign-up.'
      }
      error={error}
      loading={loading}
      onSubmit={handleSubmit}
    />
  )
}

export default RegisterPage
