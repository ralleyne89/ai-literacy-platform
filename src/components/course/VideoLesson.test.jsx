import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import VideoLesson, { normalizeVideoSource } from './VideoLesson'

const baseLesson = {
  id: 'lesson-1',
  title: 'Video lesson',
  description: 'A lesson with video content.',
  progress: {
    status: 'not_started',
  },
}

describe('normalizeVideoSource', () => {
  it('normalizes common hosted video URLs', () => {
    expect(normalizeVideoSource('https://www.youtube.com/watch?v=abc123&t=45s')).toEqual({
      type: 'iframe',
      src: 'https://www.youtube-nocookie.com/embed/abc123?start=45',
      originalUrl: 'https://www.youtube.com/watch?v=abc123&t=45s',
    })

    expect(normalizeVideoSource('https://youtu.be/xyz789')).toEqual({
      type: 'iframe',
      src: 'https://www.youtube-nocookie.com/embed/xyz789',
      originalUrl: 'https://youtu.be/xyz789',
    })

    expect(normalizeVideoSource('https://vimeo.com/123456')).toEqual({
      type: 'iframe',
      src: 'https://player.vimeo.com/video/123456',
      originalUrl: 'https://vimeo.com/123456',
    })
  })

  it('classifies direct files, unsupported links, and unsafe values', () => {
    expect(normalizeVideoSource('https://cdn.example.com/lesson.mp4')).toEqual({
      type: 'video',
      src: 'https://cdn.example.com/lesson.mp4',
      originalUrl: 'https://cdn.example.com/lesson.mp4',
    })

    expect(normalizeVideoSource('https://example.com/watch/lesson')).toEqual({
      type: 'link',
      src: 'https://example.com/watch/lesson',
      originalUrl: 'https://example.com/watch/lesson',
    })

    expect(normalizeVideoSource('javascript:alert(1)')).toBeNull()
  })
})

describe('VideoLesson', () => {
  it('renders a fallback link for safe non-embeddable video URLs', () => {
    render(
      <VideoLesson
        lesson={{
          ...baseLesson,
          content: {
            video_url: 'https://example.com/watch/lesson',
            key_takeaways: ['Use AI outputs critically.'],
          },
        }}
        onComplete={vi.fn()}
      />
    )

    expect(screen.getByTestId('video-lesson-fallback-lesson-1')).toBeInTheDocument()
    expect(screen.getByTestId('video-lesson-source-link-lesson-1'))
      .toHaveAttribute('href', 'https://example.com/watch/lesson')
    expect(screen.getByText('Use AI outputs critically.')).toBeInTheDocument()
  })

  it('renders only in-platform additional resources', () => {
    render(
      <VideoLesson
        lesson={{
          ...baseLesson,
          content: {
            video_url: 'https://cdn.example.com/lesson.mp4',
            resources: [
              { title: 'Internal worksheet', url: '/training/modules/module-ai-sales' },
              { title: 'External worksheet', url: 'https://example.com/worksheet' },
            ],
          },
        }}
        onComplete={vi.fn()}
      />
    )

    expect(screen.getByText('Internal worksheet').closest('a'))
      .toHaveAttribute('href', '/training/modules/module-ai-sales')
    expect(screen.queryByText('External worksheet')).not.toBeInTheDocument()
  })

  it('renders curated video metadata and source attribution', () => {
    render(
      <VideoLesson
        lesson={{
          ...baseLesson,
          content: {
            video_url: 'https://www.youtube-nocookie.com/embed/T9aRN5JkmL8',
            video_title: 'AI prompt engineering: A deep dive',
            creator: 'Anthropic',
            creator_url: 'https://www.youtube.com/@anthropic-ai',
            duration_minutes: 12,
            original_url: 'https://www.youtube.com/watch?v=T9aRN5JkmL8',
            attribution: 'Video by Anthropic. Embedded from YouTube for educational use.',
          },
        }}
        onComplete={vi.fn()}
      />
    )

    expect(screen.getByTestId('video-lesson-metadata-lesson-1')).toBeInTheDocument()
    expect(screen.getByText('AI prompt engineering: A deep dive')).toBeInTheDocument()
    expect(screen.getByText('Anthropic')).toHaveAttribute('href', 'https://www.youtube.com/@anthropic-ai')
    expect(screen.getByText('12 min')).toBeInTheDocument()
    expect(screen.getByTestId('video-lesson-original-link-lesson-1'))
      .toHaveAttribute('href', 'https://www.youtube.com/watch?v=T9aRN5JkmL8')
    expect(screen.getByText('Video by Anthropic. Embedded from YouTube for educational use.')).toBeInTheDocument()
  })
})
