import { describe, expect, it } from 'vitest'
import { getTrainingStartPath, normalizeVideoEmbedUrl, normalizeVideoSource } from './videoUrls'

describe('video and training route helpers', () => {
  it('normalizes common YouTube URL shapes to privacy-enhanced embeds', () => {
    expect(normalizeVideoEmbedUrl('https://www.youtube.com/watch?v=abc123&feature=share'))
      .toBe('https://www.youtube-nocookie.com/embed/abc123')
    expect(normalizeVideoEmbedUrl('https://youtu.be/xyz789'))
      .toBe('https://www.youtube-nocookie.com/embed/xyz789')
    expect(normalizeVideoEmbedUrl('https://www.youtube.com/embed/video-id'))
      .toBe('https://www.youtube-nocookie.com/embed/video-id')
  })

  it('classifies direct videos without forcing iframe embeds', () => {
    expect(normalizeVideoSource('https://cdn.example.com/training.mp4')).toEqual({
      type: 'video',
      src: 'https://cdn.example.com/training.mp4',
      originalUrl: 'https://cdn.example.com/training.mp4',
    })
    expect(normalizeVideoEmbedUrl('https://cdn.example.com/training.mp4'))
      .toBe('https://cdn.example.com/training.mp4')
  })

  it('routes lesson-backed modules directly to learn and external modules to detail', () => {
    expect(getTrainingStartPath({
      id: 'module-internal',
      content_type: 'video',
      has_internal_lessons: true,
    })).toBe('/training/modules/module-internal/learn')

    expect(getTrainingStartPath({
      id: 'module-external',
      content_type: 'external',
      has_internal_lessons: true,
    })).toBe('/training/modules/module-external')
  })
})
