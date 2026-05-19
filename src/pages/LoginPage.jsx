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
  const [oauthLoading, setOauthLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  })
  const { login, loginWithPassword, isAuthenticated } = useAuth()
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

  const handleCredentialChange = (event) => {
    const { name, value } = event.target
    setCredentials((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleOAuthSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setOauthLoading(true)
    setStoredAuthReturnTo(from)

    const result = await login()
    if (!result.success) {
      setError(result.error || 'Unable to start sign-in.')
      setOauthLoading(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setPasswordLoading(true)
    setStoredAuthReturnTo(from)

    const result = await loginWithPassword(credentials)
    if (result.success) {
      navigate(from, { replace: true })
      return
    }

    setError(result.error || 'Unable to sign in with email and password.')
    setPasswordLoading(false)
  }

  return (
    <AuthOAuthShell
      mode="login"
      eyebrow="Sign in"
      title="Sign in to LitmusAI"
      description="Use Google or your email and password to keep your learning progress connected across every step."
      passwordActionLabel="Sign in with email"
      passwordLoadingLabel="Signing in..."
      oauthActionLabel="Continue with Google"
      oauthLoadingLabel="Opening Google..."
      alternatePrompt="New here?"
      alternateLabel="Create an account"
      alternateTo="/register"
      alternateState={{ from }}
      returnCopy={
        from === '/dashboard'
          ? 'We will bring you back to your dashboard after sign-in.'
          : 'We will bring you back to your requested page after sign-in.'
      }
      successMessage={successMessage}
      error={error}
      oauthLoading={oauthLoading}
      passwordLoading={passwordLoading}
      credentials={credentials}
      onCredentialChange={handleCredentialChange}
      onOAuthSubmit={handleOAuthSubmit}
      onPasswordSubmit={handlePasswordSubmit}
    />
  )
}

export default LoginPage
