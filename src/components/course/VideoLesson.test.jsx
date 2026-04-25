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
})
