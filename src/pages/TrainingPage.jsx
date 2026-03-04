import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, Clock, Users, CheckCircle, Lock, AlertCircle, Activity, ExternalLink, Building2, TrendingUp, PlayCircle } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

const TrainingPage = () => {
  const [modules, setModules] = useState([])
  const [selectedRole, setSelectedRole] = useState('All')
  const [loading, setLoading] = useState(true)
  const [progressMap, setProgressMap] = useState({})
  const [error, setError] = useState('')
  const [resumeModule, setResumeModule] = useState(null)

  const { isAuthenticated } = useAuth()

  const roles = ['All', 'Sales', 'HR', 'Marketing', 'Operations', 'General']
  const selectedRoleQuery = useMemo(() => {
    if (!selectedRole || selectedRole === 'All') {
      return {}
    }
    return { role: selectedRole }
  }, [selectedRole])

  useEffect(() => {
    const fetchModules = async () => {
      setLoading(true)
      setError('')

      try {
        const modulesResponse = await axios.get('/api/training/modules', {
          params: selectedRoleQuery
        })
        const modulesData = Array.isArray(modulesResponse?.data?.modules) ? modulesResponse.data.modules : []
        setModules(modulesData)

        if (isAuthenticated) {
          const progressResponse = await axios.get('/api/training/progress')
          const progressData = Array.isArray(progressResponse?.data?.progress) ? progressResponse.data.progress : []

          const nextProgressMap = {}
          progressData.forEach(record => {
            nextProgressMap[record.module_id] = record
          })
          setProgressMap(nextProgressMap)

          const nextResumeModule = progressData
            .filter(item => item.status === 'in_progress')
            .sort((a, b) => {
              const aDate = a.last_accessed ? new Date(a.last_accessed).getTime() : 0
              const bDate = b.last_accessed ? new Date(b.last_accessed).getTime() : 0
              return bDate - aDate
            })[0] || null

          setResumeModule(nextResumeModule)
        } else {
          setProgressMap({})
          setResumeModule(null)
        }
      } catch {
        setError('Failed to load training modules. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchModules()
  }, [selectedRoleQuery, isAuthenticated])

  const normaliseDifficultyLevel = (level) => {
    if (typeof level === 'number') {
      return level
    }
    if (typeof level === 'string') {
      const parsed = Number(level)
      if (!Number.isNaN(parsed)) {
        return parsed
      }
      const lookup = {
        beginner: 1,
        intermediate: 2,
        advanced: 3,
        expert: 4,
        master: 5
      }
      return lookup[level.toLowerCase()] || level
    }
    return level
  }

  const getDifficultyColor = (level) => {
    const normalised = normaliseDifficultyLevel(level)
    const colors = {
      1: 'text-green-600 bg-green-100',
      2: 'text-yellow-600 bg-yellow-100',
      3: 'text-orange-600 bg-orange-100',
      4: 'text-red-600 bg-red-100',
      5: 'text-purple-600 bg-purple-100'
    }
    return colors[normalised] || 'text-gray-600 bg-gray-100'
  }

  const getProgressBadge = (module) => {
    const contentType = typeof module.content_type === 'string' ? module.content_type.toLowerCase() : ''
    if (['external', 'partner', 'affiliate'].includes(contentType)) {
      return null
    }

    const progress = progressMap[module.id]
    if (!progress) {
      return null
    }

    if (progress.status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          <CheckCircle className="h-3.5 w-3.5" />
          Completed
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
        <Activity className="h-3.5 w-3.5" />
        {progress.progress_percentage || 0}% complete
      </span>
    )
  }

  const getDifficultyText = (level) => {
    const normalised = normaliseDifficultyLevel(level)
    const texts = {
      1: 'Beginner',
      2: 'Intermediate',
      3: 'Advanced',
      4: 'Expert',
      5: 'Master'
    }
    if (typeof normalised === 'string') {
      return normalised.charAt(0).toUpperCase() + normalised.slice(1)
    }
    return texts[normalised] || 'Unknown'
  }

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Play className="w-5 h-5" />
      case 'interactive':
        return <Users className="w-5 h-5" />
      case 'exercise':
        return <CheckCircle className="w-5 h-5" />
      case 'external':
        return <ExternalLink className="w-5 h-5" />
      case 'partner':
        return <Building2 className="w-5 h-5" />
      case 'affiliate':
        return <TrendingUp className="w-5 h-5" />
      default:
        return <Play className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto mb-8"></div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3 mb-4"></div>
                <div className="h-8 bg-gray-300 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Training Hub</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hands-on training modules designed for your role. Build practical AI skills
            through interactive exercises and real-world applications.
          </p>
        </div>

        {resumeModule && (
          <div className="mb-8 rounded-xl border border-primary-200 bg-primary-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary-700">Resume where you left off</p>
              <p className="text-sm text-primary-700/80">
                Continue <span className="font-semibold">{resumeModule.module_title}</span> ({resumeModule.progress_percentage || 0}% complete)
              </p>
            </div>
            <Link to={`/training/modules/${resumeModule.module_id}/learn`} className="btn-primary text-sm text-center">
              <span className="inline-flex items-center gap-2">
                <PlayCircle className="h-4 w-4" />
                Resume Module
              </span>
            </Link>
          </div>
        )}

        {error && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {roles.map(role => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedRole === role
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map(module => {
            const metadata = module.metadata || {}
            const accessLabel = metadata.access_tier ? metadata.access_tier.replace(/\b\w/g, l => l.toUpperCase()) : module.is_premium ? 'Professional' : 'Free'
            const estimatedDuration = module.estimated_duration_minutes ?? 0
            const difficultyLevel = module.difficulty_level
            const rawContentType = module.content_type || metadata.format || 'video'
            const contentType = typeof rawContentType === 'string' ? rawContentType.toLowerCase() : 'video'
            const isPremium = Boolean(module.is_premium || (metadata.access_tier && metadata.access_tier !== 'free'))

            return (
              <div key={module.id} className="card hover:shadow-lg transition-shadow duration-200 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="text-primary-600">
                      {getContentTypeIcon(contentType)}
                    </div>
                    <span className="text-sm text-gray-600 capitalize">{contentType}</span>
                  </div>
                  {isPremium && !['external', 'partner', 'affiliate'].includes(contentType) && (
                    <div className="flex items-center space-x-1 text-yellow-600">
                      <Lock className="w-4 h-4" />
                      <span className="text-xs font-medium">Premium</span>
                    </div>
                  )}
                </div>

                {getProgressBadge(module) && (
                  <div className="mb-3">
                    {getProgressBadge(module)}
                  </div>
                )}

                <h3 className="text-xl font-semibold text-gray-900 mb-2">{module.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{module.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{estimatedDuration} min</span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficultyLevel)}`}>
                      {getDifficultyText(difficultyLevel)}
                    </div>
                  </div>
                </div>

                {module.role_specific && (
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-100 text-secondary-700 text-sm font-medium rounded-full">
                      {module.role_specific}
                    </span>
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                      {accessLabel}
                    </span>
                    {metadata.provider && (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                        {metadata.provider}
                      </span>
                    )}
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">You'll Learn:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {(Array.isArray(module.learning_objectives) ? module.learning_objectives : []).slice(0, 3).map((objective, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to={`/training/modules/${module.id}`}
                  className={`mt-auto w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold transition-all duration-200 ${
                    isPremium
                      ? 'bg-gradient-secondary text-white hover:shadow-lg transform hover:-translate-y-0.5'
                      : 'btn-primary'
                  }`}
                >
                  {['external', 'partner', 'affiliate'].includes(contentType)
                    ? metadata.cta_text || 'View details'
                    : progressMap[module.id]?.status === 'completed'
                      ? 'Review Module'
                      : progressMap[module.id]
                        ? 'Continue Learning'
                        : 'Start Module'}
                </Link>
              </div>
            )
          })}
        </div>

        {modules.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No modules found</h3>
            <p className="text-gray-600">Try selecting a different role or check back later for new content.</p>
          </div>
        )}

        <div className="mt-16 bg-gradient-primary text-white rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Accelerate Your Learning?</h2>
          <p className="text-lg opacity-90 mb-6">
            Upgrade to Professional for access to all premium modules, live sessions, and certification tracks.
          </p>
          <Link
            to="/billing"
            className="inline-flex items-center justify-center rounded-lg bg-white text-primary-600 font-semibold py-3 px-8 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    </div>
  )
}

export default TrainingPage
