import React, { useState, useEffect } from 'react'
import { Clock, CheckCircle, AlertCircle, Brain, ArrowRight, ArrowLeft, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

const AssessmentPage = () => {
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeStarted, setTimeStarted] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const response = await axios.get('/api/assessment/questions')
      setQuestions(response.data.questions)
      setTimeStarted(new Date())
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch questions:', error)
      setLoading(false)
    }
  }

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const timeElapsed = Math.round((new Date() - timeStarted) / 60000) // minutes
      const response = await axios.post('/api/assessment/submit', {
        answers,
        time_taken_minutes: timeElapsed
      })
      setResults(response.data)
    } catch (error) {
      console.error('Failed to submit assessment:', error)
      alert('Failed to submit assessment. Please try again.')
    }
    setIsSubmitting(false)
  }

  const getProgressPercentage = () => {
    return ((currentQuestion + 1) / questions.length) * 100
  }

  const getDomainColor = (domain) => {
    const colors = {
      'Functional': 'text-primary-600',
      'Ethical': 'text-secondary-600',
      'Rhetorical': 'text-accent-orange',
      'Pedagogical': 'text-green-600'
    }
    return colors[domain] || 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading assessment...</p>
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
            </div>

            {/* Overall Score */}
            <div className="bg-gradient-primary text-white rounded-lg p-6 mb-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Overall Score</h2>
              <div className="text-4xl font-bold mb-2">{results.percentage}%</div>
              <p className="opacity-90">{results.total_score} out of {results.max_score} questions correct</p>
            </div>

            {/* Domain Breakdown */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {Object.entries(results.domain_scores).map(([domain, scores]) => (
                <div key={domain} className="card">
                  <h3 className={`font-semibold mb-2 capitalize ${getDomainColor(domain)}`}>
                    {domain} AI Literacy
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{scores.score} / {scores.total}</span>
                    <span className="font-semibold">
                      {Math.round((scores.score / scores.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${(scores.score / scores.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
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

  const question = questions[currentQuestion]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Literacy Assessment</h1>
          <p className="text-gray-600">Discover your AI readiness across all domains</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(getProgressPercentage())}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
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
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              currentQuestion === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:text-primary-600'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Previous</span>
          </button>

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
