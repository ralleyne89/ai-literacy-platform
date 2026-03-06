import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { setStoredAuthReturnTo } from '../config/authRoutes'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const { register, isAuthenticated, loginWithProvider } = useAuth()
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    setLoading(true)
    setStoredAuthReturnTo('/dashboard')
    const result = await register({
      email: formData.email
    })

    if (result.success) {
      if (result.user) {
        navigate('/dashboard', { replace: true })
      }
      setLoading(false)
      return
    }

    setError(result.error)
    setLoading(false)
  }

  const handleProviderLogin = async (provider) => {
    setError('')
    setMessage('')
    setStoredAuthReturnTo('/dashboard')
    const result = await loginWithProvider(provider)
    if (!result.success && result.error) {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Create your account with Auth0
          </h2>
          <p className="mt-2 text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
              sign in with email and password
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-green-700">{message}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                autoComplete="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                placeholder="you@example.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                You&apos;ll create your password on the secure Auth0 signup page.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Redirecting...' : 'Continue to Create Account'}
            </button>
          </div>

          <p className="text-sm text-gray-600 text-center">
            Prefer a social provider? Continue with Google or Facebook.
          </p>

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
        </form>
      </div>
    </div>
  )
}

export default RegisterPage
