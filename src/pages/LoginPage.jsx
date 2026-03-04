import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Brain, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const RETRYABLE_AUTH_ERROR_CODE = 'retryable_network_error'

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState('')
  const [resetNotice, setResetNotice] = useState('')
  const [showResetForm, setShowResetForm] = useState(false)
  const [lastAction, setLastAction] = useState(null)
  const [retrying, setRetrying] = useState(false)

  const { login, isAuthenticated, loginWithProvider, requestPasswordReset } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'
  const authMode = (import.meta.env.VITE_AUTH_MODE || '').toLowerCase().trim()
  const isAuth0Mode = authMode === 'auth0'

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setErrorCode('')
    setResetNotice('')
    setLastAction({ type: 'login' })
    setLoading(true)

    const result = await login(formData.email, formData.password)

    if (result.success) {
      if (!isAuth0Mode) {
        navigate(from, { replace: true })
      }
      setLoading(false)
      return
    } else {
      setError(result.error)
      setErrorCode(result.code || '')
    }

    setLoading(false)
  }

  const handleProviderLogin = async (provider) => {
    setError('')
    setErrorCode('')
    setResetNotice('')
    setLastAction({ type: 'provider', provider })
    const result = await loginWithProvider(provider)
    if (!result.success && result.error) {
      setError(result.error)
      setErrorCode(result.code || '')
    }
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    setError('')
    setErrorCode('')
    setResetNotice('')
    setLastAction({ type: 'reset' })

    const result = await requestPasswordReset(formData.email)
    if (result.success) {
      setResetNotice('Password reset email sent. Check your inbox for next steps.')
      setShowResetForm(false)
    } else {
      setError(result.error || 'Unable to send reset email.')
      setErrorCode(result.code || '')
    }
  }

  const handleRetry = async () => {
    if (!lastAction) {
      return
    }

    setRetrying(true)
    setError('')
    setErrorCode('')
    setResetNotice('')

    try {
      if (lastAction.type === 'login') {
        const result = await login(formData.email, formData.password)
        if (result.success) {
          if (!isAuth0Mode) {
            navigate(from, { replace: true })
          }
          setLoading(false)
          return
        } else {
          setError(result.error)
          setErrorCode(result.code || '')
        }
        return
      }

      if (lastAction.type === 'provider' && lastAction.provider) {
        const result = await loginWithProvider(lastAction.provider)
        if (!result.success) {
          setError(result.error || 'Unable to start social sign-in right now.')
          setErrorCode(result.code || '')
        }
        return
      }

      if (lastAction.type === 'reset') {
        const result = await requestPasswordReset(formData.email)
        if (result.success) {
          setResetNotice('Password reset email sent. Check your inbox for next steps.')
          setShowResetForm(false)
        } else {
          setError(result.error || 'Unable to send reset email.')
          setErrorCode(result.code || '')
        }
      }
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-gray-600">
            Or{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-500 font-medium">
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-red-700">{error}</span>
                {errorCode === RETRYABLE_AUTH_ERROR_CODE && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleRetry}
                      disabled={retrying}
                      className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      {retrying ? 'Retrying...' : 'Retry'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {resetNotice && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-green-700">{resetNotice}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                autoComplete="email"
                type="email"
                required={!isAuth0Mode}
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                autoComplete={isAuth0Mode ? 'off' : 'current-password'}
                required={!isAuth0Mode}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <button
                type="button"
                onClick={() => setShowResetForm(prev => !prev)}
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Forgot your password?
              </button>
            </div>
          </div>

          {showResetForm && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-700 mb-3">Send a password reset link to your email address.</p>
              <button
                type="button"
                onClick={handlePasswordReset}
                className="w-full rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-black transition-colors"
              >
                Send Reset Link
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleProviderLogin('google')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => handleProviderLogin('facebook')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Continue with Facebook
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-500 font-medium">
                Sign up for free
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
