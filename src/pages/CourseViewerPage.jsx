import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CheckCircle, Circle, Clock, BookOpen, Award } from 'lucide-react'
import axios from 'axios'
import VideoLesson from '../components/course/VideoLesson'
import TextLesson from '../components/course/TextLesson'
import QuizLesson from '../components/course/QuizLesson'
import InteractiveLesson from '../components/course/InteractiveLesson'

const CourseViewerPage = () => {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const [module, setModule] = useState(null)
  const [lessons, setLessons] = useState([])
  const [currentLesson, setCurrentLesson] = useState(null)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    fetchModuleLessons()
  }, [moduleId])

  const fetchModuleLessons = async () => {
    try {
      const response = await axios.get(`/api/course/modules/${moduleId}/lessons`)
      setModule(response.data.module)
      setLessons(response.data.lessons)
      
      // Find first incomplete lesson or first lesson
      const firstIncomplete = response.data.lessons.findIndex(l => l.status !== 'completed')
      const startIndex = firstIncomplete >= 0 ? firstIncomplete : 0
      
      if (response.data.lessons.length > 0) {
        loadLesson(response.data.lessons[startIndex].id, startIndex)
      }
    } catch (error) {
      console.error('Failed to fetch lessons:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLesson = async (lessonId, index) => {
    try {
      const response = await axios.get(`/api/course/lessons/${lessonId}`)
      setCurrentLesson(response.data)
      setCurrentLessonIndex(index)
    } catch (error) {
      console.error('Failed to load lesson:', error)
    }
  }

  const handleLessonComplete = async (lessonId, data = {}) => {
    try {
      await axios.post(`/api/course/lessons/${lessonId}/complete`, data)
      
      // Refresh lessons to update progress
      await fetchModuleLessons()
      
      // Move to next lesson if available
      if (currentLessonIndex < lessons.length - 1) {
        const nextLesson = lessons[currentLessonIndex + 1]
        loadLesson(nextLesson.id, currentLessonIndex + 1)
      }
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
  const progressPercentage = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Lesson List */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden`}>
        <div className="p-6">
          {/* Course Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/training')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
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
                      {lesson.content_type === 'quiz' && (
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
            >
              <BookOpen className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={goToPreviousLesson}
                disabled={currentLessonIndex === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={goToNextLesson}
                disabled={currentLessonIndex === lessons.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="flex-1 overflow-y-auto">
          {currentLesson && (
            <div className="max-w-4xl mx-auto p-8">
              {currentLesson.content_type === 'video' && (
                <VideoLesson
                  lesson={currentLesson}
                  onComplete={(data) => handleLessonComplete(currentLesson.id, data)}
                />
              )}
              {currentLesson.content_type === 'text' && (
                <TextLesson
                  lesson={currentLesson}
                  onComplete={(data) => handleLessonComplete(currentLesson.id, data)}
                />
              )}
              {currentLesson.content_type === 'quiz' && (
                <QuizLesson
                  lesson={currentLesson}
                  onComplete={(data) => handleLessonComplete(currentLesson.id, data)}
                />
              )}
              {currentLesson.content_type === 'interactive' && (
                <InteractiveLesson
                  lesson={currentLesson}
                  onComplete={(data) => handleLessonComplete(currentLesson.id, data)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseViewerPage

