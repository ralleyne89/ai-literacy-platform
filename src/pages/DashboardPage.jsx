import React, { useState, useEffect } from 'react'
import { BarChart3, Clock, Award, TrendingUp, User, BookOpen, Target, Calendar, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import supabase from '../services/supabaseClient'

const DashboardPage = () => {
  const { user } = useAuth()
  const [assessmentHistory, setAssessmentHistory] = useState([])
  const [trainingProgress, setTrainingProgress] = useState([])
  const [courseRecommendations, setCourseRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log('[Dashboard] Starting data fetch')
      console.log('[Dashboard] User:', user)
      console.log('[Dashboard] User ID:', user?.id)
      console.log('[Dashboard] Supabase client:', supabase ? 'initialized' : 'NOT initialized')

      if (!user?.id) {
        console.warn('[Dashboard] No user ID, skipping data fetch')
        setLoading(false)
        return
      }

      if (!supabase) {
        console.error('[Dashboard] Supabase client not initialized!')
        console.error('[Dashboard] Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables')
        setLoading(false)
        return
      }

      try {
        console.log('[Dashboard] Fetching assessment history for user:', user.id)

        // Fetch assessment history directly from Supabase
        const { data: assessments, error: assessmentError } = await supabase
          .from('assessment_results')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        console.log('[Dashboard] Assessment query result:', { assessments, assessmentError })

        if (assessmentError) {
          console.error('[Dashboard] Failed to fetch assessments:', assessmentError)
          console.error('[Dashboard] Error details:', JSON.stringify(assessmentError, null, 2))
        } else {
          console.log('[Dashboard] Assessments fetched:', assessments?.length || 0, 'records')
          setAssessmentHistory(assessments || [])
        }

        console.log('[Dashboard] Fetching training progress for user:', user.id)

        // Fetch training progress directly from Supabase
        const { data: progress, error: progressError } = await supabase
          .from('user_progress')
          .select(`
            *,
            training_module:training_modules(id, title, description, difficulty_level)
          `)
          .eq('user_id', user.id)

        console.log('[Dashboard] Training progress query result:', { progress, progressError })

        if (progressError) {
          console.error('[Dashboard] Failed to fetch training progress:', progressError)
          console.error('[Dashboard] Error details:', JSON.stringify(progressError, null, 2))
        } else {
          console.log('[Dashboard] Training progress fetched:', progress?.length || 0, 'records')
          setTrainingProgress(progress || [])
        }

        // Generate recommendations from latest assessment
        if (assessments && assessments.length > 0) {
          console.log('[Dashboard] Generating recommendations from latest assessment')
          const latest = assessments[0]
          const recommendations = generateRecommendations(latest)
          console.log('[Dashboard] Recommendations generated:', recommendations.length)
          setCourseRecommendations(recommendations)
        } else {
          console.log('[Dashboard] No assessments found, skipping recommendations')
        }
      } catch (error) {
        console.error('[Dashboard] Failed to fetch dashboard data:', error)
        console.error('[Dashboard] Error stack:', error.stack)
      } finally {
        console.log('[Dashboard] Data fetch complete')
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.id])

  const generateRecommendations = (assessment) => {
    if (!assessment || !assessment.domain_scores) {
      return []
    }

    const recommendations = []
    const domainScores = typeof assessment.domain_scores === 'string'
      ? JSON.parse(assessment.domain_scores)
      : assessment.domain_scores

    // Find domains with scores below 70%
    Object.entries(domainScores).forEach(([domain, data]) => {
      if (data && data.score < 70) {
        recommendations.push({
          domain,
          score: data.score,
          priority: data.score < 50 ? 'high' : 'medium'
        })
      }
    })

    return recommendations.sort((a, b) => a.score - b.score).slice(0, 3)
  }

  const latestAssessment = assessmentHistory[0]

  // Parse domain_scores if it's a string
  const parsedDomainScores = latestAssessment?.domain_scores
    ? (typeof latestAssessment.domain_scores === 'string'
        ? JSON.parse(latestAssessment.domain_scores)
        : latestAssessment.domain_scores)
    : {}

  const domainBreakdown = Object.entries(parsedDomainScores)
    .filter(([, data]) => data && typeof data.score !== 'undefined')

  const completedModules = trainingProgress.filter(p => p.status === 'completed').length
  const totalLearningTime = trainingProgress.reduce((total, p) => total + (p.time_spent_minutes || 0), 0)

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
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-gray-600">
            Track your AI literacy progress and continue your learning journey.
          </p>
        </div>

        {/* Stats Grid */}
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
          {/* Recent Assessment */}
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

                {recommendations.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Recommended next steps</h3>
                    <div className="space-y-3">
                      {recommendations.slice(0, 3).map((rec, index) => (
                        <div key={index} className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3">
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

                <div className="text-xs text-gray-500">
                  Completed {new Date(latestAssessment.completed_at).toLocaleDateString()}
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

          {/* Training Progress */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Training Progress</h2>
              <Link to="/training" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Browse Modules
              </Link>
            </div>

            {trainingProgress.length > 0 ? (
              <div className="space-y-4">
                {trainingProgress.slice(0, 3).map((progress, index) => (
                  <div key={index} className="border-l-4 border-primary-600 pl-4">
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

        {/* Course Recommendations */}
        {courseRecommendations.length > 0 && (
          <div className="mt-8 card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recommended for You</h2>
              <Link to="/training" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All Courses
              </Link>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Based on your assessment results, these courses will help strengthen your skills
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courseRecommendations.slice(0, 6).map((course) => (
                <div key={course.id} className="border border-gray-200 rounded-lg p-5 hover:border-primary-300 hover:shadow-md transition-all duration-200">
                  {/* Priority Badge */}
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

                  {/* Course Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>

                  {/* Reason */}
                  <p className="text-sm text-primary-600 mb-3 font-medium">{course.reason}</p>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{course.estimated_duration_minutes} min</span>
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

                  {/* Action Button */}
                  <Link
                    to={`/training/modules/${course.id}/learn`}
                    className="block w-full text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 text-sm font-medium"
                  >
                    Start Learning
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
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
