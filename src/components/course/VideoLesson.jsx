import React, { useState, useEffect } from 'react'
import { CheckCircle, PlayCircle, BookOpen, ExternalLink } from 'lucide-react'
import { normalizeInPlatformUrl, normalizeVideoSource } from '../../utils/videoUrls'

export { normalizeVideoSource }

const getVideoUrlFromContent = (content) =>
  content.video_url || content.embed_url || content.videoUrl || content.url || content.original_url || ''

const getResourceUrl = (value) => {
  return normalizeInPlatformUrl(value)
}

const getSafeHttpUrl = (value) => {
  if (typeof value !== 'string') {
    return ''
  }

  try {
    const parsed = new URL(value.trim())
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return ''
    }

    return parsed.toString()
  } catch {
    return ''
  }
}

const normalizeResources = (resources) => {
  if (!Array.isArray(resources)) {
    return []
  }

  return resources
    .map((resource, index) => {
      if (typeof resource === 'string') {
        const url = getResourceUrl(resource)
        return url ? { title: `Resource ${index + 1}`, url } : null
      }

      const url = getResourceUrl(resource?.url)
      if (!url) {
        return null
      }

      return {
        title: resource.title || resource.label || `Resource ${index + 1}`,
        url
      }
    })
    .filter(Boolean)
}

const VideoLesson = ({ lesson, onComplete }) => {
  const [timeSpent, setTimeSpent] = useState(0)
  const [isCompleted, setIsCompleted] = useState(lesson.progress?.status === 'completed')
  const content = lesson.content || {}
  const videoSource = normalizeVideoSource(getVideoUrlFromContent(content))
  const videoTitle = content.video_title || ''
  const creatorName = content.creator || ''
  const creatorUrl = getSafeHttpUrl(content.creator_url)
  const sourceUrl = getSafeHttpUrl(content.original_url) || videoSource?.originalUrl || ''
  const durationMinutes = Number(content.duration_minutes) > 0 ? Number(content.duration_minutes) : null
  const hasVideoMetadata = Boolean(videoTitle || creatorName || durationMinutes || sourceUrl || content.attribution)
  const keyPoints = Array.isArray(content.key_takeaways)
    ? content.key_takeaways
    : Array.isArray(content.key_points)
      ? content.key_points
      : []
  const resources = normalizeResources(content.resources || content.supplementary_reading)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1)
    }, 60000) // Increment every minute

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setIsCompleted(lesson.progress?.status === 'completed')
    setTimeSpent(0)
  }, [lesson.id, lesson.progress?.status])

  const handleComplete = () => {
    if (!isCompleted) {
      onComplete({ time_spent_minutes: timeSpent })
      setIsCompleted(true)
    }
  }

  return (
    <div className="space-y-6" data-testid={`video-lesson-${lesson.id}`}>
      {/* Lesson Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid={`video-lesson-title-${lesson.id}`}>
          {lesson.title}
        </h1>
        <p className="text-gray-600">{lesson.description}</p>
      </div>

      {/* Video Player */}
      {videoSource?.type === 'iframe' && (
        <div className="aspect-video overflow-hidden rounded-2xl bg-gray-900 shadow-sm">
          <iframe
            src={videoSource.src}
            title={lesson.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            data-testid={`video-lesson-iframe-${lesson.id}`}
          ></iframe>
        </div>
      )}

      {videoSource?.type === 'video' && (
        <div className="aspect-video overflow-hidden rounded-2xl bg-gray-900 shadow-sm">
          <video
            controls
            className="h-full w-full"
            src={videoSource.src}
            data-testid={`video-lesson-player-${lesson.id}`}
          >
            Your browser does not support embedded video.
          </video>
        </div>
      )}

      {(!videoSource || videoSource.type === 'link') && (
        <div
          className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-10 text-center text-white shadow-sm"
          data-testid={`video-lesson-fallback-${lesson.id}`}
        >
          <PlayCircle className="mx-auto mb-4 h-12 w-12 text-primary-300" />
          <h2 className="mb-2 text-xl font-semibold text-white">Video unavailable in this player</h2>
          <p className="mx-auto max-w-2xl text-sm text-slate-300">
            The lesson content is still available. Open the source video or continue with the takeaways below.
          </p>
          {videoSource?.src && (
            <a
              href={videoSource.src}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
              data-testid={`video-lesson-source-link-${lesson.id}`}
            >
              Open video
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      )}

      {hasVideoMetadata && (
        <div
          className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm"
          data-testid={`video-lesson-metadata-${lesson.id}`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              {videoTitle && (
                <p className="font-semibold text-gray-900">{videoTitle}</p>
              )}
              {(creatorName || durationMinutes) && (
                <p className="mt-1">
                  {creatorName && creatorUrl ? (
                    <a
                      href={creatorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary-600 hover:text-primary-700"
                    >
                      {creatorName}
                    </a>
                  ) : creatorName ? (
                    <span>{creatorName}</span>
                  ) : null}
                  {creatorName && durationMinutes ? <span> - </span> : null}
                  {durationMinutes ? <span>{durationMinutes} min</span> : null}
                </p>
              )}
            </div>
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-medium text-primary-600 hover:text-primary-700"
                data-testid={`video-lesson-original-link-${lesson.id}`}
              >
                Source video
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          {content.attribution && (
            <p className="mt-3 text-xs text-gray-500">{content.attribution}</p>
          )}
        </div>
      )}

      {/* Key Points */}
      {keyPoints.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-600" />
            Key Takeaways
          </h2>
          <ul className="space-y-2">
            {keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Transcript */}
      {(content.transcript || content.summary) && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {content.transcript ? 'Transcript' : 'Summary'}
          </h2>
          <p className="text-gray-700 whitespace-pre-line">{content.transcript || content.summary}</p>
        </div>
      )}

      {/* Additional Resources */}
      {resources.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Resources</h2>
          <div className="space-y-3">
            {resources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
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
          data-testid={`video-lesson-complete-button-${lesson.id}`}
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
