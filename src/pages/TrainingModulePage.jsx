import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Play, Clock, CheckCircle, AlertCircle, BookOpen, Activity, ExternalLink, Loader2 } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

const TrainingModulePage = () => {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [module, setModule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [progressUpdating, setProgressUpdating] = useState(false)
  const [progress, setProgress] = useState(null)

  useEffect(() => {
    const loadModule = async () => {
      try {
        setLoading(true)
        setError('')

        const moduleRequest = axios.get(`/api/training/modules/${moduleId}`)
        let progressRequest = null
        if (isAuthenticated) {
          progressRequest = axios.get('/api/training/progress')
        }

        const [moduleResponse, progressResponse] = await Promise.all([
          moduleRequest,
          progressRequest?.catch(() => null)
        ])

        setModule(moduleResponse.data.module)

        if (progressResponse?.data?.progress) {
          const record = progressResponse.data.progress.find(item => item.module_id === moduleId)
          if (record) {
            setProgress(record)
          }
        }
      } catch (err) {
        console.error('Failed to load module', err)
        setError('Unable to load this module right now. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadModule()
  }, [moduleId, isAuthenticated])

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/training/modules/${moduleId}` } })
      return
    }

    try {
      setEnrolling(true)
      const response = await axios.post(`/api/training/enroll/${moduleId}`)
      setProgress(prev => ({
        ...(prev || {}),
        status: response.data.status,
        progress_percentage: prev?.progress_percentage || 0
      }))
    } catch (err) {
      console.error('Failed to enroll', err)
      setError('We could not enroll you in this module. Please try again.')
    } finally {
      setEnrolling(false)
    }
  }

  const handleMarkComplete = async () => {
    try {
      setProgressUpdating(true)
      const response = await axios.put(`/api/training/progress/${moduleId}`, {
        progress_percentage: 100,
        status: 'completed'
      })
      setProgress(prev => ({
        ...(prev || {}),
        status: response.data.status,
        progress_percentage: response.data.progress_percentage,
        completed_at: response.data.completed_at
      }))
    } catch (err) {
      console.error('Failed to update progress', err)
      setError('We could not update your progress. Please try again.')
    } finally {
      setProgressUpdating(false)
    }
  }

  const isCompleted = progress?.status === 'completed'

  const metadata = module?.metadata || {}

  const watchUrl = useMemo(() => {
    if (!module?.content_url) return null
    if (module.content_type && ['external', 'partner', 'affiliate'].includes(module.content_type)) {
      return null
    }
    if (module.content_url.includes('youtube.com') && !module.content_url.includes('/embed/')) {
      const videoId = module.content_url.split('v=')[1]?.split('&')[0]
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`
      }
    }
    return module.content_url
  }, [module?.content_type, module?.content_url])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading module...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/training')}
            className="btn-primary"
          >
            Back to Training Hub
          </button>
        </div>
      </div>
    )
  }

  if (!module) {
    return null
  }

  const { learning_objectives = [], content_sections = [], prerequisites = [], resources = [] } = module
  const externalUrl = metadata.external_url || module.content_url
  const accessTier = metadata.access_tier?.replace(/\b\w/g, l => l.toUpperCase())

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/training" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            ← Back to Training Hub
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {watchUrl ? (
            <div className="relative w-full overflow-hidden" style={{ paddingTop: '56.25%' }}>
              <iframe
                src={watchUrl}
                title={module.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          ) : (
            <div className="bg-gray-900 py-16 text-center text-white">
              <div className="space-y-4">
                <Play className="h-10 w-10 mx-auto text-primary-400" />
                <h3 className="text-xl font-semibold">Explore this course on {metadata.provider || 'our partner platform'}</h3>
                <p className="max-w-2xl mx-auto text-white/70">
                  This experience is delivered externally. Follow the link below to access the full curriculum and track completion through the partner platform.
                </p>
                {externalUrl && (
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 font-semibold text-gray-900 shadow-lg hover:bg-white/90"
                  >
                    {metadata.cta_text || 'Open course'}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-secondary-700">
                    {module.role_specific}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                    <Clock className="h-3.5 w-3.5" />
                    {module.estimated_duration_minutes} minutes
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{module.title}</h1>
                <p className="text-gray-600 max-w-2xl">{module.description}</p>
              </div>
              <div className="flex flex-col items-stretch gap-3 min-w-[200px]">
                {isAuthenticated && !['external', 'partner', 'affiliate'].includes(module.content_type) ? (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="btn-primary disabled:opacity-60"
                  >
                    {progress ? 'Resume Module' : enrolling ? 'Enrolling...' : 'Enroll & Start'}
                  </button>
                ) : !isAuthenticated && !['external', 'partner', 'affiliate'].includes(module.content_type) ? (
                  <button
                    onClick={() => navigate('/login', { state: { from: `/training/modules/${moduleId}` } })}
                    className="btn-primary"
                  >
                    Sign in to Track Progress
                  </button>
                ) : null}
                {['external', 'partner', 'affiliate'].includes(module.content_type) && externalUrl && (
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center justify-center gap-2"
                  >
                    {metadata.cta_text || 'Visit course site'}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                {isAuthenticated && !['external', 'partner', 'affiliate'].includes(module.content_type) && (
                  <button
                    onClick={handleMarkComplete}
                    disabled={progressUpdating || isCompleted}
                    className="btn-outline disabled:opacity-60"
                  >
                    {isCompleted ? 'Module Completed' : progressUpdating ? 'Saving...' : 'Mark as Complete'}
                  </button>
                )}
              </div>
            </div>

            {isAuthenticated && progress && !['external', 'partner', 'affiliate'].includes(module.content_type) && (
              <div className="mb-8 rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-800">
                {isCompleted ? (
                  <span>
                    <CheckCircle className="inline h-4 w-4 mr-2" />
                    Completed on {progress.completed_at ? new Date(progress.completed_at).toLocaleDateString() : '—'}
                  </span>
                ) : (
                  <span>
                    <Activity className="inline h-4 w-4 mr-2" />
                    Currently {progress.progress_percentage || 0}% complete
                  </span>
                )}
              </div>
            )}

            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Learning Objectives</h2>
                <ul className="space-y-2 text-sm text-gray-600">
                  {learning_objectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Prerequisites</h2>
                {prerequisites.length > 0 ? (
                  <ul className="space-y-2 text-sm text-gray-600">
                    {prerequisites.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <BookOpen className="h-4 w-4 text-primary-500 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">No prerequisites required.</p>
                )}
              </div>
            </div>

            {content_sections.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">What you'll cover</h2>
                <div className="space-y-4">
                  {content_sections.map((section, index) => (
                    <div key={index} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{section.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{section.summary}</p>
                        </div>
                        {section.duration_minutes && (
                          <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
                            {section.duration_minutes} min
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resources.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Resources</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {resources.map((resource, index) => (
                    <a
                      key={index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-primary-600 hover:border-primary-200 hover:bg-primary-50"
                    >
                      <span>{resource.label}</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 flex flex-col gap-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Provider:</span>
                <span>{metadata.provider || 'AI Literacy Platform'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Access tier:</span>
                <span className="capitalize">{accessTier || (module.is_premium ? 'Professional' : 'Free')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Format:</span>
                <span className="capitalize">{metadata.format || module.content_type}</span>
              </div>
            </div>

            {metadata.attribution && (
              <p className="mt-4 text-xs text-gray-400">
                {metadata.attribution}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrainingModulePage
