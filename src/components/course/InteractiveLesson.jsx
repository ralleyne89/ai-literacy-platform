import React, { useState } from 'react'
import { CheckCircle, Lightbulb, Code } from 'lucide-react'

const InteractiveLesson = ({ lesson, onComplete }) => {
  const content = lesson.content || {}
  const exercises = content.exercises || []
  
  const [completedExercises, setCompletedExercises] = useState(new Set())
  const [showHints, setShowHints] = useState({})
  const [showSolutions, setShowSolutions] = useState({})
  const [isCompleted, setIsCompleted] = useState(lesson.progress.status === 'completed')

  const toggleHints = (exerciseId) => {
    setShowHints({
      ...showHints,
      [exerciseId]: !showHints[exerciseId]
    })
  }

  const toggleSolution = (exerciseId) => {
    setShowSolutions({
      ...showSolutions,
      [exerciseId]: !showSolutions[exerciseId]
    })
  }

  const markExerciseComplete = (exerciseId) => {
    const newCompleted = new Set(completedExercises)
    newCompleted.add(exerciseId)
    setCompletedExercises(newCompleted)
  }

  const handleComplete = () => {
    if (!isCompleted && completedExercises.size >= 2) {
      onComplete({ time_spent_minutes: 20 })
      setIsCompleted(true)
    }
  }

  const allExercisesCompleted = completedExercises.size >= exercises.length

  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
        <p className="text-gray-600 mb-4">{lesson.description}</p>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Complete at least 2 exercises to finish this lesson</span>
        </div>
      </div>

      {/* Progress */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-900">Your Progress</span>
          <span className="text-sm text-gray-600">
            {completedExercises.size} / {exercises.length} exercises completed
          </span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedExercises.size / exercises.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-6">
        {exercises.map((exercise, index) => {
          const isCompleted = completedExercises.has(exercise.id)

          return (
            <div key={exercise.id} className="card">
              {/* Exercise Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    {isCompleted && <CheckCircle className="w-6 h-6 text-green-600" />}
                    Exercise {index + 1}: {exercise.title}
                  </h2>
                  <p className="text-gray-600">{exercise.description}</p>
                </div>
              </div>

              {/* Task/Prompt */}
              {exercise.prompt && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="font-medium text-gray-900 mb-2">Current Prompt:</p>
                  <p className="text-gray-700 italic">"{exercise.prompt}"</p>
                </div>
              )}

              {exercise.task && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="font-medium text-gray-900 mb-2">Task:</p>
                  <p className="text-gray-700">{exercise.task}</p>
                </div>
              )}

              {/* User Input Area */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Solution:
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows="6"
                  placeholder="Type your improved prompt or solution here..."
                ></textarea>
              </div>

              {/* Hints */}
              {exercise.hints && exercise.hints.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => toggleHints(exercise.id)}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-2"
                  >
                    <Lightbulb className="w-5 h-5" />
                    <span>{showHints[exercise.id] ? 'Hide' : 'Show'} Hints</span>
                  </button>
                  {showHints[exercise.id] && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <ul className="space-y-2">
                        {exercise.hints.map((hint, hintIndex) => (
                          <li key={hintIndex} className="flex items-start gap-2">
                            <span className="text-yellow-600 font-bold">💡</span>
                            <span className="text-gray-700">{hint}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Sample Solution */}
              {exercise.sample_solution && (
                <div className="mb-4">
                  <button
                    onClick={() => toggleSolution(exercise.id)}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-2"
                  >
                    <Code className="w-5 h-5" />
                    <span>{showSolutions[exercise.id] ? 'Hide' : 'Show'} Sample Solution</span>
                  </button>
                  {showSolutions[exercise.id] && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">Sample Solution:</p>
                      <p className="text-gray-700 whitespace-pre-line">{exercise.sample_solution}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Complete Exercise Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => markExerciseComplete(exercise.id)}
                  disabled={isCompleted}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
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
        })}
      </div>

      {/* Completion Criteria */}
      {content.completion_criteria && (
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-gray-700">
            <strong>To complete this lesson:</strong> {content.completion_criteria}
          </p>
        </div>
      )}

      {/* Complete Lesson Button */}
      <div className="flex justify-center pt-6">
        <button
          onClick={handleComplete}
          disabled={isCompleted || completedExercises.size < 2}
          className={`px-8 py-3 rounded-lg font-medium transition-colors duration-200 ${
            isCompleted
              ? 'bg-green-600 text-white cursor-default'
              : completedExercises.size >= 2
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isCompleted ? (
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Lesson Completed
            </span>
          ) : (
            `Complete Lesson (${completedExercises.size}/2 exercises done)`
          )}
        </button>
      </div>
    </div>
  )
}

export default InteractiveLesson

