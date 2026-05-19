import { describe, expect, it } from 'vitest'
import {
  getTrainingStartPath,
  isExternalTrainingItem,
  isInPlatformTrainingRecommendation,
  normalizeInPlatformUrl,
  normalizeVideoEmbedUrl,
  normalizeVideoSource,
} from './videoUrls'

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

  it('keeps same-origin resource links and rejects external handoffs', () => {
    expect(normalizeInPlatformUrl('/training/modules/module-ai-sales'))
      .toBe('/training/modules/module-ai-sales')
    expect(normalizeInPlatformUrl('https://example.com/template'))
      .toBe('')
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

  it('flags external partner recommendations and keeps same-origin playable recommendations', () => {
    expect(isExternalTrainingItem({
      id: 'module-google-ai-essentials',
      content_type: 'external',
      routing: { route_type: 'external_detail', is_external: true },
    })).toBe(true)

    expect(isInPlatformTrainingRecommendation({
      id: 'module-ai-sales',
      content_type: 'video',
      routing: { primary_path: '/training/modules/module-ai-sales' },
    })).toBe(true)

    expect(isInPlatformTrainingRecommendation({
      id: 'module-ibm-skillsbuild',
      content_type: 'external',
      routing: {
        primary_path: '/training/modules/module-ibm-skillsbuild',
        route_type: 'external_detail',
        is_external: true,
      },
    })).toBe(false)
  })
})
