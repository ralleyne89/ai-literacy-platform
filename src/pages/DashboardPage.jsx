import React, { useEffect, useMemo, useState } from 'react'
import { BarChart3, Clock, Award, BookOpen, Target, Lock, AlertCircle, PlayCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

const getStringValue = (value, fallback = '') => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || fallback
  }

  return fallback
}

const parseNumericValue = (value, fallback = null) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

const normalizeDifficultyLevel = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const level = value.trim().toLowerCase()
    if (level === 'beginner') {
      return 1
    }
    if (level === 'intermediate') {
      return 2
    }
    if (level === 'advanced' || level === 'expert') {
      return 3
    }
    return value.trim()
  }

  return 'N/A'
}

const normalizeRecommendationForDashboard = (recommendation, index, fallbackPrefix = 'recommendation') => {
  if (typeof recommendation === 'string') {
    return {
      id: `${fallbackPrefix}-${index}`,
      title: recommendation,
      description: getStringValue(
        recommendation,
        'Recommended next step based on your assessment.'
      ),
      reason: '',
      difficulty_level: 'N/A',
      estimated_duration_minutes: null,
      content_type: 'module',
      is_premium: false,
      priority: 'low'
    }
  }

  if (!recommendation || typeof recommendation !== 'object') {
    return null
  }

  const title = getStringValue(
    recommendation.title,
    getStringValue(recommendation.name, `Recommendation ${index + 1}`)
  )
  const description = getStringValue(
    recommendation.description,
    getStringValue(
      recommendation.summary,
      getStringValue(recommendation.action, 'Recommended next step based on your assessment.')
    )
  )
  const duration = parseNumericValue(
    recommendation.estimated_duration_minutes,
    parseNumericValue(
      recommendation.estimated_duration,
      parseNumericValue(
        recommendation.duration_minutes,
        parseNumericValue(recommendation.duration, null)
      )
    )
  )

  return {
    id: getStringValue(
      recommendation.id,
      getStringValue(
        recommendation.module_id,
        getStringValue(recommendation.moduleId, `${fallbackPrefix}-${index}`)
      )
    ),
    title,
    description,
    reason: getStringValue(recommendation.reason, recommendation.action),
    difficulty_level: normalizeDifficultyLevel(recommendation.difficulty_level),
    estimated_duration_minutes: duration,
    content_type: getStringValue(recommendation.content_type, 'module'),
    is_premium:
      recommendation.is_premium === true ||
      getStringValue(recommendation.is_premium) === 'true',
    priority: getStringValue(recommendation.priority, 'low')
  }
}

const normalizeRecommendations = (recommendations, sourceTag = 'recommendation') => {
  if (!Array.isArray(recommendations)) {
    return []
  }

  return recommendations
    .map((recommendation, index) => normalizeRecommendationForDashboard(recommendation, index, sourceTag))
    .filter(Boolean)
}

const normalizeAssessmentRecord = (record) => {
  if (!record || typeof record !== 'object') {
    return null
  }

  const totalScore = parseNumericValue(record.total_score, parseNumericValue(record.score, 0))
  const maxScore = parseNumericValue(record.max_score, parseNumericValue(record.total_questions, 0))
  const computedPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
  const percentage = parseNumericValue(record.percentage, computedPercentage)

  return {
    ...record,
    percentage: parseNumericValue(percentage, 0),
    domain_scores: safeParseJSON(record.domain_scores, {}),
    recommendations: Array.isArray(record.recommendations) ? record.recommendations : [],
    time_taken_minutes: parseNumericValue(record.time_taken_minutes, parseNumericValue(record.time_taken, 0)),
    total_score: parseNumericValue(totalScore, 0),
    max_score: parseNumericValue(maxScore, 0),
    completed_at: getStringValue(
      record.completed_at,
      getStringValue(
        record.completedAt,
        getStringValue(record.created_at, null)
      )
    )
  }
}

const safeParseJSON = (value, fallback = {}) => {
  if (value === null || typeof value === 'undefined') {
    return fallback
  }

  if (typeof value === 'object') {
    return value
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return typeof parsed === 'object' && parsed !== null ? parsed : fallback
    } catch {
      return fallback
    }
  }

  return fallback
}

const DashboardPage = () => {
  const { user } = useAuth()
  const [assessmentHistory, setAssessmentHistory] = useState([])
  const [trainingProgress, setTrainingProgress] = useState([])
  const [courseRecommendations, setCourseRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchDashboardData = async () => {
      if (!user?.id) {
        if (isMounted) {
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        setError('')

        const [historyResult, progressResult, recommendationsResult] = await Promise.allSettled([
          axios.get('/api/assessment/history'),
          axios.get('/api/training/progress'),
          axios.get('/api/assessment/recommendations')
        ])

        if (!isMounted) {
          return
        }

        const history = Array.isArray(historyResult.value?.data?.history)
          ? historyResult.value.data.history.map(normalizeAssessmentRecord).filter(Boolean)
          : []
        const latestHistoryAssessment = history[0]
        const progress = Array.isArray(progressResult.value?.data?.progress)
          ? progressResult.value.data.progress.map((record) => ({
              ...record,
              progress_percentage: parseNumericValue(record?.progress_percentage, 0),
              time_spent_minutes: parseNumericValue(record?.time_spent_minutes, 0)
            }))
          : []
        const recommendations = recommendationsResult.status === 'fulfilled'
          ? normalizeRecommendations(recommendationsResult.value?.data?.recommendations, 'course-api')
          : []
        const assessmentHistoryRecommendations = latestHistoryAssessment
          ? normalizeRecommendations(latestHistoryAssessment.recommendations, 'assessment-history')
          : []

        if (historyResult.status === 'fulfilled') {
          setAssessmentHistory(history)
        } else {
          setAssessmentHistory([])
        }

        if (progressResult.status === 'fulfilled') {
          setTrainingProgress(progress)
        } else {
          setTrainingProgress([])
        }

        if (recommendations.length > 0) {
          setCourseRecommendations(recommendations)
        } else if (assessmentHistoryRecommendations.length > 0) {
          setCourseRecommendations(assessmentHistoryRecommendations)
        } else {
          setCourseRecommendations([])
        }

        const allFailed = [historyResult, progressResult, recommendationsResult].every(r => r.status === 'rejected')
        if (allFailed) {
          setError('Unable to load dashboard data right now. Please refresh and try again.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDashboardData()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  const latestAssessment = assessmentHistory[0]
  const parsedDomainScores = safeParseJSON(latestAssessment?.domain_scores, {})
  const domainBreakdown = Object.entries(parsedDomainScores)
    .filter(([, data]) => data && typeof data.score !== 'undefined')

  const completedModules = trainingProgress.filter(p => p.status === 'completed').length
  const totalLearningTime = trainingProgress.reduce((total, p) => total + (p.time_spent_minutes || 0), 0)

  const assessmentRecommendations = useMemo(() => {
    return latestAssessment ? normalizeRecommendations(latestAssessment.recommendations, 'assessment-recommendation') : []
  }, [latestAssessment])

  const resumeModule = useMemo(() => {
    const inProgress = trainingProgress
      .filter(item => item.status === 'in_progress')
      .sort((a, b) => {
        const aDate = a.last_accessed ? new Date(a.last_accessed).getTime() : 0
        const bDate = b.last_accessed ? new Date(b.last_accessed).getTime() : 0
        return bDate - aDate
      })

    return inProgress[0] || null
  }, [trainingProgress])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.first_name || 'Learner'}!
          </h1>
          <p className="text-gray-600">
            Track your AI literacy progress and continue your learning journey.
          </p>
        </div>

        {error && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {resumeModule && (
          <div className="mb-8 rounded-xl border border-primary-200 bg-primary-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary-700">Resume learning</p>
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <BarChart3 className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {latestAssessment ? `${latestAssessment.percentage}%` : 'N/A'}
            </div>
            <div className="text-gray-600">Latest Assessment</div>
          </div>
          <div className="card text-center">
            <BookOpen className="w-8 h-8 text-secondary-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{completedModules}</div>
            <div className="text-gray-600">Modules Completed</div>
          </div>
          <div className="card text-center">
            <Award className="w-8 h-8 text-accent-orange mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-gray-600">Certifications</div>
          </div>
          <div className="card text-center">
            <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(totalLearningTime / 60)}h
            </div>
            <div className="text-gray-600">Learning Time</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Assessment</h2>
              <Link to="/assessment" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Take New Assessment
              </Link>
            </div>

            {latestAssessment ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600">Overall Score</span>
                  <span className="text-2xl font-bold text-primary-600">{latestAssessment.percentage}%</span>
                </div>

                {latestAssessment.score_band && (
                  <div className="mb-4 rounded-lg bg-primary-50 border border-primary-100 px-4 py-3">
                    <span className="text-sm font-semibold text-primary-700">LitmusAI Level:</span>
                    <span className="ml-2 text-sm text-primary-700 uppercase tracking-wide">{latestAssessment.score_band}</span>
                  </div>
                )}

                {domainBreakdown.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {domainBreakdown.map(([domain, info]) => {
                      const percent = info.total ? Math.round((info.score / info.total) * 100) : 0
                      const width = info.total ? (info.score / info.total) * 100 : 0
                      return (
                        <div key={domain}>
                          <div className="flex items-center justify-between text-sm text-gray-700">
                            <span>{domain}</span>
                            <span className="font-semibold">{info.score}/{info.total} ({percent}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${width}%` }}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {assessmentRecommendations.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Recommended next steps</h3>
                    <div className="space-y-3">
                      {assessmentRecommendations.slice(0, 3).map((rec, index) => (
                        <div key={`${rec.title}-${index}`} className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3">
                          <div className="text-sm font-semibold text-primary-700">{rec.title}</div>
                          {rec.description && (
                            <p className="text-sm text-primary-700/80 mt-1">{rec.description}</p>
                          )}
                          {rec.action && (
                            <p className="text-xs text-primary-600 font-medium mt-2">{rec.action}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-4">
                  Completed {latestAssessment.completed_at ? new Date(latestAssessment.completed_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No assessments completed yet</p>
                <Link to="/assessment" className="btn-primary">
                  Take Your First Assessment
                </Link>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Training Progress</h2>
              <Link to="/training" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Browse Modules
              </Link>
            </div>

            {trainingProgress.length > 0 ? (
              <div className="space-y-4">
                {trainingProgress.slice(0, 3).map((progress) => (
                  <div key={progress.module_id} className="border-l-4 border-primary-600 pl-4">
                    <h3 className="font-medium text-gray-900">{progress.module_title}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-600 capitalize">{progress.status}</span>
                      <span className="text-sm font-medium">{progress.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${progress.progress_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No training modules started yet</p>
                <Link to="/training" className="btn-primary">
                  Start Learning
                </Link>
              </div>
            )}
          </div>
        </div>

        {courseRecommendations.length > 0 && (
          <div className="mt-8 card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recommended for You</h2>
              <Link to="/training" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All Courses
              </Link>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Based on your assessment results, these courses will help strengthen your skills.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courseRecommendations.slice(0, 6).map((course) => (
                <div key={course.id} className="border border-gray-200 rounded-lg p-5 hover:border-primary-300 hover:shadow-md transition-all duration-200">
                  {course.priority === 'high' && (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 mb-3">
                      High Priority
                    </div>
                  )}
                  {course.priority === 'medium' && (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 mb-3">
                      Recommended
                    </div>
                  )}

                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                  {course.reason && (
                    <p className="text-sm text-primary-600 mb-3 font-medium">{course.reason}</p>
                  )}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {course.estimated_duration_minutes != null
                          ? `${course.estimated_duration_minutes} min`
                          : 'Duration not set'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      <span>Level {course.difficulty_level}</span>
                    </div>
                    {course.is_premium && (
                      <div className="flex items-center gap-1 text-accent-orange">
                        <Lock className="w-3 h-3" />
                        <span>Premium</span>
                      </div>
                    )}
                  </div>

                  <Link
                    to={course.id ? `/training/modules/${course.id}/learn` : '/training'}
                    className="block w-full text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 text-sm font-medium"
                  >
                    {course.id ? 'Start Learning' : 'Browse Courses'}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/assessment" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200">
              <Target className="w-8 h-8 text-primary-600" />
              <div>
                <h3 className="font-medium text-gray-900">Take Assessment</h3>
                <p className="text-sm text-gray-600">Evaluate your AI literacy</p>
              </div>
            </Link>

            <Link to="/training" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-secondary-300 hover:bg-secondary-50 transition-colors duration-200">
              <BookOpen className="w-8 h-8 text-secondary-600" />
              <div>
                <h3 className="font-medium text-gray-900">Browse Training</h3>
                <p className="text-sm text-gray-600">Explore learning modules</p>
              </div>
            </Link>

            <Link to="/certification" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors duration-200">
              <Award className="w-8 h-8 text-accent-orange" />
              <div>
                <h3 className="font-medium text-gray-900">Get Certified</h3>
                <p className="text-sm text-gray-600">Earn credentials</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
