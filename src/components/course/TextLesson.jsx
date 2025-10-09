import React, { useState, useEffect } from 'react'
import { CheckCircle, BookOpen } from 'lucide-react'

const TextLesson = ({ lesson, onComplete }) => {
  const [timeSpent, setTimeSpent] = useState(0)
  const [isCompleted, setIsCompleted] = useState(lesson.progress.status === 'completed')
  const content = lesson.content || {}

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1)
    }, 60000) // Increment every minute

    return () => clearInterval(timer)
  }, [])

  const handleComplete = () => {
    if (!isCompleted) {
      onComplete({ time_spent_minutes: timeSpent })
      setIsCompleted(true)
    }
  }

  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
        <p className="text-gray-600">{lesson.description}</p>
      </div>

      {/* Content Sections */}
      {content.sections && content.sections.length > 0 && (
        <div className="space-y-6">
          {content.sections.map((section, index) => (
            <div key={index} className="card">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {section.heading}
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {section.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Examples */}
      {content.examples && content.examples.length > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Examples
          </h2>
          <div className="space-y-4">
            {content.examples.map((example, index) => (
              <div key={index} className="bg-white p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <div className="text-sm font-medium text-red-600 mb-1">❌ Bad Example</div>
                    <div className="text-sm text-gray-700 italic">{example.bad}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-green-600 mb-1">✅ Good Example</div>
                    <div className="text-sm text-gray-700 italic">{example.good}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  <strong>Why:</strong> {example.why}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Preview */}
      {content.quiz_preview && (
        <div className="card bg-yellow-50 border-yellow-200">
          <p className="text-gray-700 flex items-center gap-2">
            <span className="text-2xl">📝</span>
            <span>{content.quiz_preview}</span>
          </p>
        </div>
      )}

      {/* Complete Button */}
      <div className="flex justify-center pt-6">
        <button
          onClick={handleComplete}
          disabled={isCompleted}
          className={`px-8 py-3 rounded-lg font-medium transition-colors duration-200 ${
            isCompleted
              ? 'bg-green-600 text-white cursor-default'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isCompleted ? (
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Completed
            </span>
          ) : (
            'Mark as Complete'
          )}
        </button>
      </div>
    </div>
  )
}

export default TextLesson

