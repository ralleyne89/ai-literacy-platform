import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { AlertCircle, ChevronLeft, ChevronRight, CheckCircle, Circle, Clock, BookOpen, Award, ExternalLink } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { DEMO_FALLBACK_MODULE_IDS, getDemoModuleAndLessons } from '../data/demoFallback'
import VideoLesson from '../components/course/VideoLesson'
import TextLesson from '../components/course/TextLesson'
import QuizLesson from '../components/course/QuizLesson'
import InteractiveLesson from '../components/course/InteractiveLesson'

const COURSE_LOAD_TIMEOUT_MS = 20000

const getLessonContentType = (lesson) => {
  const contentType = typeof lesson?.content_type === 'string' ? lesson.content_type.toLowerCase() : ''
  if (contentType === 'reading' || contentType === 'article') {
    return 'text'
  }
  if (contentType === 'video_lesson') {
    return 'video'
  }
  return contentType
}

const EXTERNAL_CONTENT_TYPES = new Set(['external', 'partner', 'affiliate'])

const getModuleContentType = (module) =>
  String(module?.content_type || module?.metadata?.format || '').trim().toLowerCase()

const getModuleExternalUrl = (module) =>
  module?.metadata?.external_url || module?.external_url || module?.content_url || ''

const isExternalModule = (module) =>
  EXTERNAL_CONTENT_TYPES.has(getModuleContentType(module)) ||
  module?.routing?.is_external === true ||
  module?.routing?.route_type === 'external_detail'

const CourseViewerPage = () => {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [module, setModule] = useState(null)
  const [moduleProgress, setModuleProgress] = useState(null)
  const [lessons, setLessons] = useState([])
  const [currentLesson, setCurrentLesson] = useState(null)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    fetchModuleLessons()
  }, [moduleId])

  const fetchModuleLessons = async () => {
    try {
      setError('')
      const response = await axios.get(`/api/course/modules/${moduleId}/lessons`, {
        timeout: COURSE_LOAD_TIMEOUT_MS,
      })
      setModule(response.data.module)
      setModuleProgress(response.data.module_progress || null)
      const nextLessons = Array.isArray(response.data.lessons) ? response.data.lessons : []
      setLessons(nextLessons)

      const resumeLessonId = response.data.module_progress?.resume_lesson_id
      const resumeLessonIndex = resumeLessonId
        ? nextLessons.findIndex((lesson) => lesson.id === resumeLessonId)
        : -1
      const firstIncomplete = nextLessons.findIndex(l => l.status !== 'completed')
      const startIndex = resumeLessonIndex >= 0
        ? resumeLessonIndex
        : firstIncomplete >= 0
          ? firstIncomplete
          : 0

      if (nextLessons.length > 0) {
        loadLesson(nextLessons[startIndex].id, startIndex)
      }
    } catch (error) {
      let usedFallback = false
      if (user?.id === 'demo-user' && DEMO_FALLBACK_MODULE_IDS.includes(moduleId)) {
        const fallback = getDemoModuleAndLessons(moduleId)
        if (fallback) {
          setModule(fallback.module)
          setModuleProgress(fallback.moduleProgress)
          setLessons(fallback.lessons)
          setCurrentLesson(fallback.currentLessonFull)
          setCurrentLessonIndex(0)
          usedFallback = true
        }
      }
      if (!usedFallback) {
        setError('We could not load this module. Return to the Training Hub and try again.')
      }
      console.error('Failed to fetch lessons:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLesson = async (lessonId, index) => {
    try {
      const response = await axios.get(`/api/course/lessons/${lessonId}`, {
        timeout: COURSE_LOAD_TIMEOUT_MS,
      })
      setCurrentLesson(response.data)
      setCurrentLessonIndex(index)
    } catch (error) {
      console.error('Failed to load lesson:', error)
    }
  }

  const handleLessonComplete = async (lessonId, data = {}) => {
    try {
      await axios.post(`/api/course/lessons/${lessonId}/complete`, data)
      await fetchModuleLessons()
    } catch (error) {
      console.error('Failed to complete lesson:', error)
    }
  }

  const goToNextLesson = () => {
    if (currentLessonIndex < lessons.length - 1) {
      const nextLesson = lessons[currentLessonIndex + 1]
      loadLesson(nextLesson.id, currentLessonIndex + 1)
    }
  }

  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      const prevLesson = lessons[currentLessonIndex - 1]
      loadLesson(prevLesson.id, currentLessonIndex - 1)
    }
  }

  const completedLessons = lessons.filter(l => l.status === 'completed').length
  const progressPercentage = moduleProgress?.progress_percentage ??
    (lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0)

  const renderLessonContent = () => {
    if (!currentLesson) {
      return (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">No lesson selected</h2>
          <p className="mt-1 text-sm text-gray-600">Choose a lesson from the sidebar to begin.</p>
        </div>
      )
    }

    const contentType = getLessonContentType(currentLesson)

    if (contentType === 'video') {
      return (
        <VideoLesson
          lesson={currentLesson}
          onComplete={(data) => handleLessonComplete(currentLesson.id, data)}
        />
      )
    }

    if (contentType === 'text') {
      return (
        <TextLesson
          lesson={currentLesson}
          onComplete={(data) => handleLessonComplete(currentLesson.id, data)}
        />
      )
    }

    if (contentType === 'quiz') {
      return (
        <QuizLesson
          lesson={currentLesson}
          onComplete={(data) => handleLessonComplete(currentLesson.id, data)}
        />
      )
    }

    if (contentType === 'interactive') {
      return (
        <InteractiveLesson
          lesson={currentLesson}
          onComplete={(data) => handleLessonComplete(currentLesson.id, data)}
        />
      )
    }

    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h2 className="font-semibold">Unsupported lesson type</h2>
        <p className="mt-1 text-sm">
          This lesson type is not available in the course viewer yet.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        data-testid="course-viewer-loading"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    )
  }

  if (error && !module) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center px-4"
        data-testid="course-viewer-error"
      >
        <div className="max-w-md text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Course unavailable</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/training')}
            className="btn-primary"
            data-testid="course-viewer-error-back-button"
          >
            Back to Training Hub
          </button>
        </div>
      </div>
    )
  }

  if (module && lessons.length === 0) {
    const externalUrl = getModuleExternalUrl(module)
    const externalModule = isExternalModule(module)

    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12"
        data-testid="course-viewer-empty-module"
      >
        <div className="max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <BookOpen className="mx-auto mb-4 h-10 w-10 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            {externalModule ? 'This course lives on the partner site' : 'No in-app lessons yet'}
          </h1>
          <p className="mt-3 text-gray-600">
            {externalModule
              ? `${module.title} does not have in-app lessons here. Open the course site or return to the module overview.`
              : `${module.title} does not have lesson content ready in the viewer yet. Return to the module overview for the available materials.`}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {externalModule && externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center justify-center gap-2"
                data-testid="course-viewer-empty-external-link"
              >
                Open course site
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <Link
              to={`/training/modules/${moduleId}`}
              className="btn-outline inline-flex items-center justify-center"
              data-testid="course-viewer-empty-detail-link"
            >
              View module details
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" data-testid="course-viewer-page">
      {/* Sidebar - Lesson List */}
      <div
        className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden`}
        data-testid="course-viewer-sidebar"
      >
        <div className="p-6">
          {/* Course Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/training')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
              data-testid="course-viewer-back-button"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Courses
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{module?.title}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <BookOpen className="w-4 h-4" />
              <span>{lessons.length} lessons</span>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Lesson List */}
          <div className="space-y-2">
            {lessons.map((lesson, index) => (
              <button
                key={lesson.id}
                onClick={() => loadLesson(lesson.id, index)}
                className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                  currentLessonIndex === index
                    ? 'bg-primary-50 border-2 border-primary-600'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
                data-testid={`course-viewer-lesson-${lesson.id}-button`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {lesson.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {index + 1}. {lesson.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{lesson.estimated_duration_minutes} min</span>
                      {getLessonContentType(lesson) === 'quiz' && (
                        <>
                          <span>•</span>
                          <Award className="w-3 h-3" />
                          <span>Quiz</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:text-gray-900"
              data-testid="course-viewer-sidebar-toggle"
            >
              <BookOpen className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={goToPreviousLesson}
                disabled={currentLessonIndex === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="course-viewer-previous-lesson"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={goToNextLesson}
                disabled={currentLessonIndex === lessons.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="course-viewer-next-lesson"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8" data-testid={currentLesson ? `course-viewer-lesson-content-${currentLesson.id}` : 'course-viewer-empty-lesson'}>
            {renderLessonContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseViewerPage
