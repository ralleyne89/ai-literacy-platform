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
  const [oauthLoading, setOauthLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  })
  const { register, registerWithPassword, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = getReturnPath(location.state?.from)

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [from, isAuthenticated, navigate])

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

    const result = await register()
    if (!result.success) {
      setError(result.error || 'Unable to start sign-up.')
      setOauthLoading(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setPasswordLoading(true)
    setStoredAuthReturnTo(from)

    const result = await registerWithPassword(credentials)
    if (result.success && result.pendingConfirmation) {
      setSuccessMessage(`Check ${result.email || credentials.email} to confirm your account, then come back to sign in.`)
      setPasswordLoading(false)
      return
    }

    if (result.success) {
      navigate(from, { replace: true })
      return
    }

    setError(result.error || 'Unable to create an account with email and password.')
    setPasswordLoading(false)
  }

  return (
    <AuthOAuthShell
      mode="register"
      eyebrow="Create account"
      title="Create your LitmusAI account"
      description="Sign up with Google or email and password so assessments, training, and certifications stay connected from day one."
      passwordActionLabel="Create account with email"
      passwordLoadingLabel="Creating account..."
      oauthActionLabel="Continue with Google"
      oauthLoadingLabel="Opening Google..."
      alternatePrompt="Already have an account?"
      alternateLabel="Sign in"
      alternateTo="/login"
      alternateState={{ from }}
      returnCopy={
        from === '/dashboard'
          ? 'We will bring you into your dashboard after sign-up.'
          : 'We will bring you back to your requested page after sign-up.'
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

export default RegisterPage
