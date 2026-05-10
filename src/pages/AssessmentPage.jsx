import React, { useState, useEffect, useRef } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Brain,
  Check,
  CheckCircle,
  Gauge,
  ListChecks,
  Loader2,
  RadioTower,
  Sparkles,
  Timer,
  User
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { gsap, useGSAP } from '../utils/gsap'

const STORAGE_KEY = 'assessmentProgress_v2'
export const ASSESSMENT_VERSION = '2026-05-09-level-aware-v1'
export const PENDING_ASSESSMENT_SUBMISSION_KEY = 'assessmentPendingSubmission_v1'

const ASSESSMENT_LEVEL_OPTIONS = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'I am learning the basics and want plain-language questions.'
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'I use AI sometimes and want practical workplace scenarios.'
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'I already use AI often and want more strategic questions.'
  }
]

const ASSESSMENT_SIGNALS = [
  {
    title: 'AI thinking',
    description: 'Reason through AI decisions.',
    Icon: Brain
  },
  {
    title: 'Prompt clarity',
    description: 'Communicate with useful context.',
    Icon: RadioTower
  },
  {
    title: 'Workplace judgment',
    description: 'Spot risks before you act.',
    Icon: Gauge
  }
]

const ASSESSMENT_META = [
  { label: '15 questions', Icon: ListChecks },
  { label: '3-5 minutes', Icon: Timer },
  { label: 'Matched path', Icon: Sparkles }
]

const DOMAIN_ACCENTS = {
  'AI Fundamentals': {
    text: 'text-primary-600',
    border: 'border-primary-200',
    bg: 'bg-primary-50',
    dot: 'bg-primary-500'
  },
  'Practical Usage': {
    text: 'text-secondary-700',
    border: 'border-secondary-200',
    bg: 'bg-secondary-50',
    dot: 'bg-secondary-500'
  },
  'Ethics & Critical Thinking': {
    text: 'text-accent-orange',
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    dot: 'bg-accent-orange'
  },
  'AI Impact & Applications': {
    text: 'text-green-700',
    border: 'border-green-200',
    bg: 'bg-green-50',
    dot: 'bg-green-500'
  },
  'Strategic Understanding': {
    text: 'text-purple-700',
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    dot: 'bg-purple-500'
  },
  default: {
    text: 'text-gray-600',
    border: 'border-gray-200',
    bg: 'bg-gray-50',
    dot: 'bg-gray-500'
  }
}

const getDomainAccent = (domain) => DOMAIN_ACCENTS[domain] || DOMAIN_ACCENTS.default

const normalizeAssessmentLevel = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  return ASSESSMENT_LEVEL_OPTIONS.some(option => option.value === normalized) ? normalized : ''
}

const getAssessmentLevelLabel = (value) => {
  const normalized = normalizeAssessmentLevel(value)
  return ASSESSMENT_LEVEL_OPTIONS.find(option => option.value === normalized)?.label || ''
}

const clearStoredAssessmentProgress = () => {
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

const readPendingAssessmentSubmission = () => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const saved = localStorage.getItem(PENDING_ASSESSMENT_SUBMISSION_KEY)
    if (!saved) {
      return null
    }

    const parsed = JSON.parse(saved)
    if (
      parsed?.version !== ASSESSMENT_VERSION ||
      !parsed?.payload ||
      typeof parsed.payload.answers !== 'object' ||
      !Object.keys(parsed.payload.answers || {}).length
    ) {
      localStorage.removeItem(PENDING_ASSESSMENT_SUBMISSION_KEY)
      return null
    }

    return parsed
  } catch (err) {
    console.warn('Failed to restore pending assessment submission:', err)
    localStorage.removeItem(PENDING_ASSESSMENT_SUBMISSION_KEY)
    return null
  }
}

const savePendingAssessmentSubmission = ({ payload, results }) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(
      PENDING_ASSESSMENT_SUBMISSION_KEY,
      JSON.stringify({
        version: ASSESSMENT_VERSION,
        savedAt: new Date().toISOString(),
        payload,
        results
      })
    )
  } catch (err) {
    console.warn('Unable to persist pending assessment submission:', err)
  }
}

const clearPendingAssessmentSubmission = () => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(PENDING_ASSESSMENT_SUBMISSION_KEY)
  } catch (err) {
    console.warn('Unable to clear pending assessment submission:', err)
  }
}

const buildAssessmentSubmissionPayload = (
  questions,
  answers,
  selectedQuestionIds,
  { assessmentLevel, questionSetToken } = {}
) => {
  const optionMap = questions.reduce((acc, question) => {
    acc[question.id] = {
      A: question.option_a,
      B: question.option_b,
      C: question.option_c,
      D: question.option_d
    }
    return acc
  }, {})

  const payload = {
    answers,
    option_map: optionMap,
    selected_question_ids: selectedQuestionIds
  }

  if (assessmentLevel) {
    payload.assessment_level = assessmentLevel
  }

  if (questionSetToken) {
    payload.question_set_token = questionSetToken
  }

  if (selectedQuestionIds.length) {
    payload.selected_ids = selectedQuestionIds
  }

  return payload
}

const AssessmentPage = () => {
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [showIntroModal, setShowIntroModal] = useState(true)
  const [resumeDetected, setResumeDetected] = useState(false)
  const [error, setError] = useState('')
  const [assessmentLevel, setAssessmentLevel] = useState('')
  const [questionSetToken, setQuestionSetToken] = useState('')
  const [generationSource, setGenerationSource] = useState('')

  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const introPanelRef = useRef(null)
  const questionShellRef = useRef(null)

  const persistProgress = ({
	    questions: persistedQuestions = questions,
	    answers: persistedAnswers = answers,
	    selectedQuestionIds: persistedSelectedQuestionIds = selectedQuestionIds,
	    currentIndex = currentQuestion,
	    assessmentLevel: persistedAssessmentLevel = assessmentLevel,
	    questionSetToken: persistedQuestionSetToken = questionSetToken,
	    generationSource: persistedGenerationSource = generationSource
	  }) => {
	    const payload = {
	      questions: persistedQuestions,
	      answers: persistedAnswers,
	      selectedQuestionIds: persistedSelectedQuestionIds,
	      currentQuestion: currentIndex,
	      assessmentLevel: persistedAssessmentLevel,
	      questionSetToken: persistedQuestionSetToken,
	      generationSource: persistedGenerationSource,
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
	      const restoredLevel = normalizeAssessmentLevel(parsed?.assessmentLevel || parsed?.assessment_level)
	      const persistedSelectedIds = Array.isArray(parsed?.selectedQuestionIds)
        ? parsed.selectedQuestionIds
        : Array.isArray(parsed?.selected_question_ids)
          ? parsed.selected_question_ids
          : Array.isArray(parsed?.selected_ids)
            ? parsed.selected_ids
            : Array.isArray(parsed?.questionIds)
              ? parsed.questionIds
              : []

	      if (isValidVersion && hasQuestions && restoredLevel) {
	        setQuestions(parsed.questions)
	        setAnswers(parsed.answers || {})
	        setSelectedQuestionIds(persistedSelectedIds.length ? persistedSelectedIds : parsed.questions.map((question) => question.id))
	        setCurrentQuestion(parsed.currentQuestion || 0)
	        setAssessmentLevel(restoredLevel)
	        setQuestionSetToken(parsed.questionSetToken || parsed.question_set_token || '')
	        setGenerationSource(parsed.generationSource || parsed.generation_source || '')
	        setHasStarted(true)
	        setShowIntroModal(false)
	        setResumeDetected(true)
      } else {
        clearStoredAssessmentProgress()
      }
    } catch (err) {
      console.warn('Failed to restore assessment progress:', err)
      clearStoredAssessmentProgress()
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined
    }

    const pendingSubmission = readPendingAssessmentSubmission()
    if (!pendingSubmission) {
      return undefined
    }

    let isCancelled = false

    if (pendingSubmission.results) {
      setResults({
        ...pendingSubmission.results,
        saved: Boolean(pendingSubmission.results.saved)
      })
      setHasStarted(false)
      setShowIntroModal(false)
    }

    const savePendingSubmission = async () => {
      setIsSubmitting(true)
      setError('')

      try {
        const response = await axios.post('/api/assessment/submit', pendingSubmission.payload)
        if (isCancelled) {
          return
        }

        setResults(response.data)
        clearPendingAssessmentSubmission()
        clearStoredAssessmentProgress()
      } catch {
        if (!isCancelled) {
          setError('You are signed in, but we could not save your previous assessment automatically. Please try submitting again.')
        }
      } finally {
        if (!isCancelled) {
          setIsSubmitting(false)
        }
      }
    }

    savePendingSubmission()

    return () => {
      isCancelled = true
    }
  }, [isAuthenticated])

  const question = hasStarted ? questions[currentQuestion] : null

  useGSAP(
    () => {
      const root = introPanelRef.current
      if (!root || !showIntroModal || hasStarted || results) {
        return undefined
      }

      const reduceMotion = typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (reduceMotion) {
        gsap.set('[data-intro-panel], [data-intro-item]', { clearProps: 'all', autoAlpha: 1, y: 0, scale: 1 })
        return undefined
      }

      const timeline = gsap.timeline()
      timeline
        .fromTo('[data-intro-panel]', { autoAlpha: 0, y: 18, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.34, ease: 'power2.out' })
        .fromTo('[data-intro-item]', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.26, ease: 'power2.out', stagger: 0.035 }, 0.08)

      return () => timeline.kill()
    },
    { scope: introPanelRef, dependencies: [showIntroModal, hasStarted, Boolean(results)], revertOnUpdate: true }
  )

  useGSAP(
    () => {
      const root = questionShellRef.current
      if (!root || !hasStarted || !question) {
        return undefined
      }

      const reduceMotion = typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (reduceMotion) {
        gsap.set('[data-question-panel], [data-answer-option]', { clearProps: 'all', autoAlpha: 1, y: 0 })
        return undefined
      }

      const timeline = gsap.timeline()
      timeline
        .fromTo('[data-question-panel]', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' })
        .fromTo('[data-answer-option]', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.24, ease: 'power2.out', stagger: 0.03 }, 0.08)

      return () => timeline.kill()
    },
    { scope: questionShellRef, dependencies: [currentQuestion, hasStarted], revertOnUpdate: true }
  )

	  const startAssessment = async () => {
	    const requestedLevel = normalizeAssessmentLevel(assessmentLevel)
	    if (!requestedLevel) {
	      setError('Choose the AI level that feels closest before you start.')
	      return
	    }

	    clearStoredAssessmentProgress()
	    clearPendingAssessmentSubmission()
	    setLoading(true)
	    setError('')
	    setResults(null)
	    setAnswers({})
	    setSelectedQuestionIds([])
	    setQuestionSetToken('')
	    setGenerationSource('')
	    setCurrentQuestion(0)
	    try {
	      const response = await axios.get('/api/assessment/questions', {
	        params: {
	          level: requestedLevel
	        }
	      })
	      const loadedQuestions = Array.isArray(response.data.questions) ? response.data.questions.slice(0, 15) : []
	      const responseLevel = normalizeAssessmentLevel(response.data?.assessment_level) || requestedLevel
	      const responseQuestionSetToken = response.data?.question_set_token || ''
	      const responseGenerationSource = response.data?.generation_source || 'curated_fallback'
	      const payloadSelectedQuestionIds = Array.isArray(response.data?.selectedQuestionIds)
        ? response.data.selectedQuestionIds
        : Array.isArray(response.data?.selected_question_ids)
          ? response.data.selected_question_ids
          : Array.isArray(response.data?.selected_ids)
            ? response.data.selected_ids
            : []
      const normalizedSelectedQuestionIds = payloadSelectedQuestionIds.length === loadedQuestions.length
        ? payloadSelectedQuestionIds
        : loadedQuestions.map((question) => question.id)
      if (loadedQuestions.length !== 15) {
        setError('We are updating the assessment. Please refresh in a moment to access the full 15-question experience.')
        setHasStarted(false)
        setShowIntroModal(true)
        return
      }
	      setQuestions(loadedQuestions)
	      setSelectedQuestionIds(normalizedSelectedQuestionIds)
	      setAssessmentLevel(responseLevel)
	      setQuestionSetToken(responseQuestionSetToken)
	      setGenerationSource(responseGenerationSource)
	      setHasStarted(true)
      setShowIntroModal(false)
      setResumeDetected(false)

      persistProgress({
	        questions: loadedQuestions,
	        selectedQuestionIds: normalizedSelectedQuestionIds,
	        answers: {},
	        currentIndex: 0,
	        assessmentLevel: responseLevel,
	        questionSetToken: responseQuestionSetToken,
	        generationSource: responseGenerationSource
	      })
    } catch (error) {
      setError('Failed to load assessment questions. Please try again later.')
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
    setError('')
    try {
	      const payload = buildAssessmentSubmissionPayload(questions, answers, selectedQuestionIds, {
	        assessmentLevel,
	        questionSetToken
	      })
      const response = await axios.post('/api/assessment/submit', payload)
      setResults(response.data)
      if (response.data?.saved) {
        clearPendingAssessmentSubmission()
      } else {
        savePendingAssessmentSubmission({ payload, results: response.data })
      }
      clearStoredAssessmentProgress()
    } catch (error) {
      setError('Failed to submit assessment. Please try again.')
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
  const assessmentLevelLabel = getAssessmentLevelLabel(assessmentLevel)
  const domainAccent = question ? getDomainAccent(question.domain) : DOMAIN_ACCENTS.default
  const selectedAnswer = question ? answers[question.id] : ''
  const isLastQuestion = question ? currentQuestion === questions.length - 1 : false
  const isGeneratingQuestions = loading && !hasStarted && !results

  const getDomainColor = (domain) => {
    return getDomainAccent(domain).text
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
              <h1
                className="text-3xl font-bold text-gray-900 mb-2"
                data-testid="assessment-results-title"
              >
                Assessment Complete!
              </h1>
              <p className="text-gray-600" data-testid="assessment-results-subtitle">
                Here are your AI literacy results
              </p>
              {results.saved && (
                <p
                  className="mt-2 text-sm text-primary-600 font-medium"
                  data-testid="assessment-results-saved"
                >
                  Results saved to your dashboard. Review them anytime.
                </p>
              )}
              {isAuthenticated && !results.saved && isSubmitting && (
                <p className="mt-2 text-sm font-medium text-primary-600" data-testid="assessment-results-saving">
                  Saving your results to your account...
                </p>
              )}
              {isAuthenticated && !results.saved && error && (
                <p className="mt-2 text-sm font-medium text-red-600" data-testid="assessment-results-save-error">
                  {error}
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
	              {(results.assessment_level || assessmentLevel) && (
	                <p className="mt-2 text-sm text-white/80">
	                  Questions tuned for: {getAssessmentLevelLabel(results.assessment_level || assessmentLevel)}
	                </p>
	              )}
	            </div>

            {/* Domain Breakdown */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {Object.entries(results.domain_scores || {}).map(([domain, scores]) => {
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
              <div className="space-y-4" data-testid="assessment-recommendations-list">
                {(Array.isArray(results.recommendations) ? results.recommendations : []).map((rec, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-primary-600 bg-primary-50 p-4 rounded-r-lg"
                    data-testid={`assessment-recommendation-${index}`}
                  >
                    <h4 className="font-semibold text-gray-900 mb-1">{rec.title}</h4>
                    <p className="text-gray-700 mb-2">{rec.description}</p>
                    <p
                      className="text-sm text-primary-600 font-medium"
                      data-testid={`assessment-recommendation-${index}-action`}
                    >
                      {rec.action}
                    </p>
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
                    <Link
                      to="/register"
                      state={{ from: { pathname: '/assessment' } }}
                      className="btn-primary text-sm"
                      data-testid="assessment-results-create-account-link"
                    >
                      Create Account
                    </Link>
                    <Link
                      to="/login"
                      state={{ from: { pathname: '/assessment' } }}
                      className="btn-outline text-sm"
                      data-testid="assessment-results-signin-link"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/training"
                  className="btn-primary"
                  data-testid="assessment-results-start-training-link"
                >
                  Start Training Modules
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/dashboard"
                    className="btn-outline"
                    data-testid="assessment-results-dashboard-link"
                  >
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

  if (!hasStarted && !results) {
    return (
      <div className="assessment-cockpit-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:py-10">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white bg-white/[0.85] text-primary-600 shadow-brand-sm">
            <Brain className="h-7 w-7" />
          </div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">AI readiness check</p>
          <h1 className="text-3xl font-bold text-gray-950 sm:text-4xl">LitmusAI Assessment</h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-600">
            Pick a starting level, then answer 15 practical questions to see where your AI skills are steady and where training should begin.
            {resumeDetected && ' We saved your progress from a previous session. You can pick up where you left off.'}
          </p>
          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
        </div>

	        {showIntroModal && (
	          <div ref={introPanelRef} className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-brand-ink/70 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-6 sm:py-6">
	            <div data-intro-panel className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-4xl flex-col overflow-y-auto rounded-[1.75rem] border border-white/70 bg-white shadow-brand-lg lg:max-h-[760px]">
                <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
                  <section className="assessment-panel-grid border-b border-slate-200 bg-slate-950 p-5 text-white sm:p-6 lg:border-b-0 lg:border-r">
                    <div data-intro-item className="mb-5 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-brand-sm">
                        <Brain className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-cyan-200">Calibration console</p>
                        <h2 className="text-2xl font-bold text-white">Before you begin</h2>
                      </div>
                    </div>

                    <p data-intro-item className="max-w-md text-sm leading-6 text-slate-200">
                      This assessment checks how you reason with AI, communicate with tools, and make practical workplace calls.
                    </p>

                    <div className="mt-5 grid gap-2">
                      {ASSESSMENT_SIGNALS.map(({ title, description, Icon }) => (
                        <div key={title} data-intro-item className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-200">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-white">{title}</h3>
                              <p className="text-xs leading-5 text-slate-300">{description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div data-intro-item className="mt-5 grid grid-cols-3 gap-2">
                      {ASSESSMENT_META.map(({ label, Icon }) => (
                        <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.08] px-3 py-2 text-center">
                          <Icon className="mx-auto mb-1 h-4 w-4 text-cyan-200" />
                          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-slate-200">{label}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="p-5 pb-0 sm:p-6 sm:pb-0">
                    <div data-intro-item className="mb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-700">Choose your starting level</p>
                      <h3 className="mt-2 text-2xl font-bold text-gray-950">Pick the version that feels closest.</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        You can be honest here. The goal is a useful course path, not a perfect score.
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                      {ASSESSMENT_LEVEL_OPTIONS.map((option, index) => {
                        const isSelected = assessmentLevel === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setAssessmentLevel(option.value)
                              setError('')
                            }}
                            disabled={loading}
                            aria-pressed={isSelected}
                            className={`group rounded-2xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:p-4 ${
                              isSelected
                                ? 'assessment-option-selected border-primary-500 bg-primary-50 shadow-brand-sm'
                                : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50'
                            }`}
                            data-intro-item
                            data-testid={`assessment-level-${option.value}`}
                          >
                            <span className="flex items-start justify-between gap-3">
                              <span>
                                <span className="mb-1 block text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400">Level {index + 1}</span>
                                <span className="block font-semibold text-gray-950">{option.label}</span>
                              </span>
                              <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
                                isSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-300 text-transparent group-hover:border-primary-300'
                              }`}>
                                <Check className="h-3.5 w-3.5" />
                              </span>
                            </span>
                            <span className="mt-2 block text-sm leading-5 text-slate-600">{option.description}</span>
                          </button>
                        )
                      })}
                    </div>

                    {isGeneratingQuestions && (
                      <div
                        className="mt-4 rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-secondary-50 p-4 text-left shadow-brand-sm"
                        role="status"
                        aria-live="polite"
                        aria-busy="true"
                        data-testid="assessment-question-generation-loading"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-brand-sm">
                            <Loader2 className="h-5 w-5 motion-safe:animate-spin" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-950">Creating your question set</p>
                            <p className="mt-1 text-sm leading-5 text-slate-600">Matching questions to your selected level...</p>
                            <div className="mt-3 space-y-2" aria-hidden="true">
                              <div className="h-2 overflow-hidden rounded-full bg-white">
                                <div className="h-full w-2/3 rounded-full bg-gradient-primary motion-safe:animate-pulse" />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="h-2 rounded-full bg-white/80 motion-safe:animate-pulse" />
                                <div className="h-2 rounded-full bg-white/70 motion-safe:animate-pulse" />
                                <div className="h-2 rounded-full bg-white/60 motion-safe:animate-pulse" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                      </div>
                    )}

                    <div className="sticky bottom-0 -mx-5 mt-5 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:-mx-6 sm:px-6">
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                        <p className="text-xs leading-5 text-slate-500">
                          The assessment takes about 3-5 minutes and saves your course recommendations when you sign in.
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end sm:gap-3">
                          <button
                            type="button"
                            onClick={handleNotNow}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50"
                            data-testid="assessment-modal-not-now"
                          >
                            Not now
                          </button>
                          <button
                            type="button"
                            onClick={startAssessment}
                            className="inline-flex min-h-10 min-w-[9.5rem] items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-brand-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-brand-md disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={loading || !assessmentLevel}
                            data-testid="assessment-start-button"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
                                <span>Creating questions...</span>
                              </>
                            ) : (
                              'Start the test'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={questionShellRef} className="assessment-cockpit-bg min-h-screen px-4 py-4 sm:px-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl">
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary-700 sm:mb-2 sm:text-xs">Calibration console</p>
            <h1 className="text-2xl font-bold text-gray-950 sm:text-4xl">LitmusAI Assessment</h1>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-600 sm:mt-2 sm:text-base sm:leading-6">
              {assessmentLevelLabel
                ? `${assessmentLevelLabel} question set across all AI readiness domains`
                : 'Discover your AI readiness across all domains'}
            </p>
          </div>
          {generationSource && (
            <p className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 shadow-brand-sm" data-testid="assessment-generation-source">
              {generationSource === 'openrouter' ? 'Generated question set' : 'Curated question set'}
            </p>
          )}
        </div>

        <div className="grid gap-3 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-[1.25rem] border border-white bg-white/90 p-3 shadow-brand-sm backdrop-blur lg:sticky lg:top-28 lg:rounded-[1.5rem] lg:p-5">
            <div className="mb-3 flex items-center justify-between gap-3 lg:mb-4">
              <span className="text-sm font-semibold text-slate-600" data-testid="assessment-progress-label">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600" data-testid="assessment-progress-percent">
                {progressDisplay}% Complete
              </span>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 lg:mb-5">
              <div
                className="h-full rounded-full bg-gradient-primary transition-all duration-300 ease-out"
                data-progress-sweep
                style={{ width: `${progressValue}%` }}
              ></div>
            </div>

            <div className={`mt-4 hidden rounded-2xl border ${domainAccent.border} ${domainAccent.bg} p-3 lg:block`}>
              <div className="mb-2 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${domainAccent.dot}`}></span>
                <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${domainAccent.text}`}>
                  Current domain
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-950">{question.domain}</p>
            </div>

            <div className="mt-4 hidden grid-cols-3 gap-2 lg:grid lg:grid-cols-1">
              {ASSESSMENT_META.map(({ label, Icon }) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                  <div className="flex items-center justify-center gap-2 lg:justify-start">
                    <Icon className="h-4 w-4 text-primary-600" />
                    <span className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <section data-question-panel className="rounded-[1.25rem] border border-white bg-white p-3 shadow-brand-md sm:rounded-[1.5rem] sm:p-5 lg:p-7" data-testid="assessment-question-card">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between lg:mb-5">
              <div className={`inline-flex w-fit items-center gap-2 rounded-full border ${domainAccent.border} ${domainAccent.bg} px-3 py-1.5 text-sm font-semibold ${domainAccent.text}`}>
                <span className={`h-2 w-2 rounded-full ${domainAccent.dot}`}></span>
                {question.domain} Domain
              </div>
              <p className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 sm:block">
                Step {currentQuestion + 1} / {questions.length}
              </p>
            </div>

            <h2 className="max-w-3xl text-base font-semibold leading-snug text-gray-950 sm:text-2xl" data-testid={`assessment-question-${question.id}-text`}>
              {question.question_text}
            </h2>

            <div className="mt-4 grid gap-2.5 sm:mt-5 sm:gap-3">
              {['A', 'B', 'C', 'D'].map(option => {
                const isSelected = selectedAnswer === option
                return (
                  <label
                    key={option}
                    className={`assessment-answer-card group flex cursor-pointer gap-2 rounded-2xl border p-2.5 text-left transition-all duration-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 sm:gap-3 sm:p-4 ${
                      isSelected
                        ? 'assessment-option-selected border-primary-500 bg-primary-50 shadow-brand-sm'
                        : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50'
                    }`}
                    data-answer-option
                    data-testid={`assessment-question-${question.id}-option-${option}`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={isSelected}
                      onChange={() => handleAnswerSelect(question.id, option)}
                      className="sr-only"
                      data-testid={`assessment-question-${question.id}-input-${option}`}
                    />
                    <span className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-200 sm:h-8 sm:w-8 sm:text-sm ${
                      isSelected
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-slate-300 bg-white text-slate-600 group-hover:border-primary-300'
                    }`}>
                      {isSelected ? <Check className="h-4 w-4" /> : option}
                    </span>
                    <span className="min-w-0 flex-1 pt-0.5 text-[0.82rem] leading-5 text-slate-700 sm:pt-1 sm:text-base sm:leading-6">
                      <span className="sr-only">Option {option}: </span>
                      {question[`option_${option.toLowerCase()}`]}
                    </span>
                  </label>
                )
              })}
            </div>

            <div className="sticky bottom-3 z-20 -mx-1 mt-5 rounded-[1.5rem] border border-slate-200 bg-white/95 p-2 shadow-brand-md backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
              <div className="flex items-center justify-between gap-3">
                <p className="hidden text-sm text-slate-500 sm:block">
                  {selectedAnswer ? 'Answer selected. You can keep moving.' : 'Choose one answer to continue.'}
                </p>
                {isLastQuestion ? (
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedAnswer || isSubmitting}
                    className="btn-primary ml-auto w-full justify-center px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    data-testid={`assessment-question-${question.id}-submit`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={!selectedAnswer}
                    className="btn-primary ml-auto flex w-full items-center justify-center gap-2 px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    data-testid={`assessment-question-${question.id}-next`}
                  >
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default AssessmentPage
