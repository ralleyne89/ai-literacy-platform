import React, { useState } from 'react'
import { CheckCircle, XCircle, Award, RotateCcw } from 'lucide-react'

const QuizLesson = ({ lesson, onComplete }) => {
  const content = lesson.content || {}
  const questions = content.questions || []
  const passingScore = content.passing_score || 70

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [isCompleted, setIsCompleted] = useState(lesson.progress.status === 'completed')

  const currentQuestion = questions[currentQuestionIndex]

  const handleAnswerSelect = (questionId, answerIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: answerIndex
    })
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = () => {
    // Calculate score
    let correct = 0
    questions.forEach(question => {
      if (selectedAnswers[question.id] === question.correct_answer) {
        correct++
      }
    })
    
    const percentage = Math.round((correct / questions.length) * 100)
    setScore(percentage)
    setShowResults(true)

    // If passed, mark as complete
    if (percentage >= passingScore) {
      onComplete({ quiz_score: percentage })
      setIsCompleted(true)
    }
  }

  const handleRetry = () => {
    setSelectedAnswers({})
    setCurrentQuestionIndex(0)
    setShowResults(false)
    setScore(0)
  }

  const allQuestionsAnswered = questions.every(q => selectedAnswers[q.id] !== undefined)

  if (showResults) {
    const passed = score >= passingScore
    const correctCount = questions.filter(q => selectedAnswers[q.id] === q.correct_answer).length

    return (
      <div className="space-y-6">
        {/* Results Header */}
        <div className={`card text-center ${passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="mb-4">
            {passed ? (
              <Award className="w-16 h-16 text-green-600 mx-auto" />
            ) : (
              <XCircle className="w-16 h-16 text-red-600 mx-auto" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {passed ? 'Congratulations!' : 'Keep Trying!'}
          </h2>
          <p className="text-xl text-gray-700 mb-4">
            You scored {score}% ({correctCount}/{questions.length} correct)
          </p>
          <p className="text-gray-600">
            {passed 
              ? `You passed! (Passing score: ${passingScore}%)`
              : `You need ${passingScore}% to pass. Review the material and try again.`
            }
          </p>
        </div>

        {/* Question Review */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Review Your Answers</h3>
          {questions.map((question, index) => {
            const userAnswer = selectedAnswers[question.id]
            const isCorrect = userAnswer === question.correct_answer

            return (
              <div key={question.id} className="card">
                <div className="flex items-start gap-3 mb-3">
                  {isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">
                      {index + 1}. {question.question}
                    </p>
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => {
                        const isUserAnswer = userAnswer === optIndex
                        const isCorrectAnswer = question.correct_answer === optIndex

                        return (
                          <div
                            key={optIndex}
                            className={`p-3 rounded-lg ${
                              isCorrectAnswer
                                ? 'bg-green-100 border-2 border-green-600'
                                : isUserAnswer
                                ? 'bg-red-100 border-2 border-red-600'
                                : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isCorrectAnswer && <CheckCircle className="w-4 h-4 text-green-600" />}
                              {isUserAnswer && !isCorrectAnswer && <XCircle className="w-4 h-4 text-red-600" />}
                              <span className={isCorrectAnswer || isUserAnswer ? 'font-medium' : ''}>
                                {option}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {question.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Explanation:</strong> {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {!passed && (
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
        <p className="text-gray-600 mb-4">{lesson.description}</p>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>•</span>
          <span>Passing Score: {passingScore}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      {/* Question */}
      {currentQuestion && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {currentQuestion.question}
          </h2>
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedAnswers[currentQuestion.id] === index
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedAnswers[currentQuestion.id] === index
                      ? 'border-primary-600 bg-primary-600'
                      : 'border-gray-300'
                  }`}>
                    {selectedAnswers[currentQuestion.id] === index && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="text-gray-900">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <div className="flex gap-2">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                selectedAnswers[questions[index].id] !== undefined
                  ? 'bg-primary-600'
                  : 'bg-gray-300'
              }`}
            ></div>
          ))}
        </div>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={!allQuestionsAnswered}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}

export default QuizLesson

