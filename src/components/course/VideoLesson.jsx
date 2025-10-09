import React, { useState, useEffect } from 'react'
import { CheckCircle, PlayCircle, BookOpen, ExternalLink } from 'lucide-react'

const VideoLesson = ({ lesson, onComplete }) => {
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

      {/* Video Player */}
      {content.video_url && (
        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
          <iframe
            src={content.video_url}
            title={lesson.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      )}

      {/* Key Points */}
      {content.key_points && content.key_points.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-600" />
            Key Takeaways
          </h2>
          <ul className="space-y-2">
            {content.key_points.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Transcript */}
      {content.transcript && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Transcript</h2>
          <p className="text-gray-700 whitespace-pre-line">{content.transcript}</p>
        </div>
      )}

      {/* Additional Resources */}
      {content.resources && content.resources.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Resources</h2>
          <div className="space-y-3">
            {content.resources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{resource.title}</span>
              </a>
            ))}
          </div>
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

export default VideoLesson

