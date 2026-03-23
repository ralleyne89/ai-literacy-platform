import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Brain } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { setStoredAuthReturnTo } from '../config/authRoutes'


const RegisterPage = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    setStoredAuthReturnTo('/dashboard')

    const result = await register()
    if (!result.success) {
      setError(result.error || 'Unable to start sign-up.')
      setLoading(false)
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
            Create your account
          </h2>
          <p className="mt-2 text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
              sign in
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

          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <p className="text-sm text-gray-600">
              Sign-up is handled by Clerk. Continue to the secure hosted registration page to create your account and come back ready to learn.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Redirecting...' : 'Continue to Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterPage
