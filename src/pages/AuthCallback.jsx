import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const AuthCallback = () => {
  const navigate = useNavigate()
  const { syncBackendAfterLogin, loading } = useAuth()

  useEffect(() => {
    const finalize = async () => {
      await syncBackendAfterLogin?.()
      navigate('/dashboard', { replace: true })
    }
    finalize()
  }, [navigate, syncBackendAfterLogin])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 px-6 py-8 text-center">
        <p className="text-gray-700 font-medium">{loading ? 'Checking your account…' : 'Finishing sign-in…'}</p>
      </div>
    </div>
  )
}

export default AuthCallback
