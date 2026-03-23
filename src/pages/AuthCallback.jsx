import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { clearStoredAuthReturnTo, getStoredAuthReturnTo } from '../config/authRoutes'
import { useAuth } from '../contexts/AuthContext'


const AuthCallback = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, loading } = useAuth()
  const returnTo = location.state?.returnTo || getStoredAuthReturnTo() || '/dashboard'

  useEffect(() => {
    if (loading) {
      return
    }

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
          code: 'legacy_auth_callback',
          error: 'The legacy callback route is no longer used. Please sign in again.',
        },
      },
    })
  }, [isAuthenticated, loading, navigate, returnTo])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 px-6 py-8 text-center">
        <p className="text-gray-700 font-medium">Redirecting you back to sign in…</p>
      </div>
    </div>
  )
}

export default AuthCallback
