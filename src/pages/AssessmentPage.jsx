import React, { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Brain, ArrowRight, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

const STORAGE_KEY = 'assessmentProgress_v2'
const ASSESSMENT_VERSION = '2024-05-15'

const AssessmentPage = () => {
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [showIntroModal, setShowIntroModal] = useState(true)
  const [resumeDetected, setResumeDetected] = useState(false)

  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const clearProgress = () => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('assessmentProgress')
    } catch (err) {
      console.warn('Unable to clear assessment progress from storage:', err)
    }
  }

  const persistProgress = ({
    questions: persistedQuestions = questions,
    answers: persistedAnswers = answers,
    currentIndex = currentQuestion
  }) => {
    const payload = {
      questions: persistedQuestions,
      answers: persistedAnswers,
      currentQuestion: currentIndex,
      version: ASSESSMENT_VERSION
    }

    if (typeof window === 'undefined') {
      return
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch (err) {
      console.warn('Unable to persist assessment progress:', err)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) {
        return
      }
      const parsed = JSON.parse(saved)
      const isValidVersion = parsed?.version === ASSESSMENT_VERSION
      const hasQuestions = Array.isArray(parsed?.questions) && parsed.questions.length === 15

      if (isValidVersion && hasQuestions) {
        setQuestions(parsed.questions)
        setAnswers(parsed.answers || {})
        setCurrentQuestion(parsed.currentQuestion || 0)
        setHasStarted(true)
        setShowIntroModal(false)
        setResumeDetected(true)
      } else {
        clearProgress()
      }
    } catch (err) {
      console.warn('Failed to restore assessment progress:', err)
      clearProgress()
    }
  }, [])

  const startAssessment = async () => {
    clearProgress()
    setLoading(true)
    setResults(null)
    setAnswers({})
    setCurrentQuestion(0)
    try {
      const response = await axios.get('/api/assessment/questions')
      const loadedQuestions = Array.isArray(response.data.questions) ? response.data.questions.slice(0, 15) : []
      if (loadedQuestions.length !== 15) {
        console.warn('Expected 15 assessment questions, received', loadedQuestions.length)
        alert('We’re updating the assessment. Please refresh in a moment to access the full 15-question experience.')
        return
      }
      setQuestions(loadedQuestions)
      setHasStarted(true)
      setShowIntroModal(false)
      setResumeDetected(false)

      persistProgress({
        questions: loadedQuestions,
        answers: {},
        currentIndex: 0
      })
    } catch (error) {
      console.error('Failed to fetch questions:', error)
      alert('Failed to load assessment questions. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleNotNow = () => {
    setShowIntroModal(false)
    navigate('/')
  }



  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => {
      const updated = {
        ...prev,
        [questionId]: answer
      }
      persistProgress({ answers: updated })
      return updated
    })
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => {
        const nextIndex = prev + 1
        persistProgress({ currentIndex: nextIndex })
        return nextIndex
      })
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const optionMap = questions.reduce((acc, question) => {
        acc[question.id] = {
          A: question.option_a,
          B: question.option_b,
          C: question.option_c,
          D: question.option_d
        }
        return acc
      }, {})

      const response = await axios.post('/api/assessment/submit', {
        answers,
        option_map: optionMap
      })
      setResults(response.data)
      clearProgress()
    } catch (error) {
      console.error('Failed to submit assessment:', error)
      alert('Failed to submit assessment. Please try again.')
    }
    setIsSubmitting(false)
  }



  const getProgressPercentage = () => {
    if (!questions.length) {
      return 0
    }
    return ((currentQuestion + 1) / questions.length) * 100
  }

  const progressValue = getProgressPercentage()
  const progressDisplay = Math.round(progressValue)

  const getDomainColor = (domain) => {
    const colors = {
      'AI Fundamentals': 'text-primary-600',
      'Practical Usage': 'text-secondary-600',
      'Ethics & Critical Thinking': 'text-accent-orange',
      'AI Impact & Applications': 'text-green-600',
      'Strategic Understanding': 'text-purple-600'
    }
    return colors[domain] || 'text-gray-600'
  }

  if (loading && hasStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 mb-2">Loading assessment...</p>
          <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
            <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (results) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Complete!</h1>
              <p className="text-gray-600">Here are your AI literacy results</p>
              {results.saved && (
                <p className="mt-2 text-sm text-primary-600 font-medium">
                  Results saved to your dashboard. Review them anytime.
                </p>
              )}
            </div>

            {/* Overall Score */}
            <div className="bg-gradient-primary text-white rounded-lg p-6 mb-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Overall Score</h2>
              <div className="text-4xl font-bold mb-2">{results.percentage}%</div>
              <p className="opacity-90">{results.total_score} out of {results.max_score} questions correct</p>
              {results.score_band && (
                <p className="mt-2 text-sm uppercase tracking-wide text-white/80">
                  LitmusAI Level: {results.score_band}
                </p>
              )}
            </div>

            {/* Domain Breakdown */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {Object.entries(results.domain_scores).map(([domain, scores]) => {
                const domainPercentage = scores.total ? Math.round((scores.score / scores.total) * 100) : 0
                const widthValue = scores.total ? (scores.score / scores.total) * 100 : 0
                return (
                <div key={domain} className="card">
                  <h3 className={`font-semibold mb-2 ${getDomainColor(domain)}`}>
                    {domain}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{scores.score} / {scores.total}</span>
                    <span className="font-semibold">
                      {domainPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${widthValue}%` }}
                    ></div>
                  </div>
                </div>
                )
              })}
            </div>

            {/* Recommendations */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Personalized Recommendations</h3>
              <div className="space-y-4">
                {results.recommendations.map((rec, index) => (
                  <div key={index} className="border-l-4 border-primary-600 bg-primary-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-gray-900 mb-1">{rec.title}</h4>
                    <p className="text-gray-700 mb-2">{rec.description}</p>
                    <p className="text-sm text-primary-600 font-medium">{rec.action}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Ready to Improve Your AI Skills?</h3>

              {!isAuthenticated && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-800 font-medium">Save Your Results</span>
                  </div>
                  <p className="text-blue-700 text-sm mb-3">
                    Create an account to save your assessment results and track your progress through training modules.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Link to="/register" className="btn-primary text-sm">
                      Create Account
                    </Link>
                    <Link to="/login" className="btn-outline text-sm">
                      Sign In
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/training" className="btn-primary">
                  Start Training Modules
                </Link>
                {isAuthenticated && (
                  <Link to="/dashboard" className="btn-outline">
                    View Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (hasStarted && !loading && !questions.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Assessment Unavailable</h2>
          <p className="text-gray-600">
            We could not load any assessment questions right now. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  const question = hasStarted ? questions[currentQuestion] : null

  if (!hasStarted && !results) {
    return (
      <div className="relative min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center px-4">
          <Brain className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">LitmusAI Assessment</h1>
          <p className="text-gray-600">
            When you’re ready, start the assessment to discover your AI proficiency across critical dimensions.
            {resumeDetected && ' We saved your progress from a previous session—pick up where you left off.'}
          </p>
        </div>

        {showIntroModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/60 px-4">
            <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Before You Begin</h2>
                  <p className="text-sm text-gray-600">Understand what this assessment measures.</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                This 15-question assessment evaluates your current AI proficiency across three key dimensions:
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Thinking &amp; Cognitive Aptitude</h3>
                  <p className="text-sm text-gray-600">Your ability to think logically and approach systems in a way that will help you be successful with AI.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Knowledge &amp; Understanding</h3>
                  <p className="text-sm text-gray-600">Your grasp of key AI concepts, terminology, capabilities, and limitations.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Prompt Engineering &amp; Communication</h3>
                  <p className="text-sm text-gray-600">Your ability to effectively communicate with AI systems through prompts.</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                The test takes approximately 3-5 minutes to complete. Your results will provide a personalized AI proficiency score and tailored recommendations.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={handleNotNow}
                  className="btn-outline"
                >
                  Not now
                </button>
                <button
                  type="button"
                  onClick={startAssessment}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Start the test
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">


        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">LitmusAI Assessment</h1>
          <p className="text-gray-600">Discover your AI readiness across all domains</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-600 sm:text-right">
              {progressDisplay}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressValue}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="mb-6">
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${getDomainColor(question.domain)} bg-gray-100`}>
              {question.domain} Domain
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {question.question_text}
            </h2>
          </div>

          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map(option => (
              <label 
                key={option}
                className={`block p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  answers[question.id] === option 
                    ? 'border-primary-600 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={() => handleAnswerSelect(question.id, option)}
                  className="sr-only"
                />
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    answers[question.id] === option 
                      ? 'border-primary-600 bg-primary-600' 
                      : 'border-gray-300'
                  }`}>
                    {answers[question.id] === option && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">{option}.</span>
                    <span className="ml-2 text-gray-700">{question[`option_${option.toLowerCase()}`]}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-end items-center">
          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={!answers[question.id] || isSubmitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!answers[question.id]}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AssessmentPage
