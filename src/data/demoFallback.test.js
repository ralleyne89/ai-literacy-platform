import { describe, expect, it } from 'vitest'
import {
  DEMO_FALLBACK_MODULE_DETAILS,
  DEMO_FALLBACK_MODULE_IDS,
  getDemoModuleAndLessons,
} from './demoFallback'

const PLACEHOLDER_VIDEO_MARKERS = [
  'media.w3.org',
  'interactive-examples.mdn.mozilla.net',
  'flower.mp4',
  'bunny',
  'sintel',
  'movie_300',
]

const expectNoPlaceholderVideo = (value) => {
  expect(typeof value).toBe('string')
  for (const marker of PLACEHOLDER_VIDEO_MARKERS) {
    expect(value).not.toContain(marker)
  }
}

describe('demo fallback videos', () => {
  it('uses curated videos with attribution for every demo module', () => {
    for (const moduleId of DEMO_FALLBACK_MODULE_IDS) {
      const moduleDetail = DEMO_FALLBACK_MODULE_DETAILS[moduleId]
      const fallback = getDemoModuleAndLessons(moduleId)

      expectNoPlaceholderVideo(moduleDetail.content_url)
      expect(fallback.currentLessonFull.content.video_url).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\//)
      expect(fallback.currentLessonFull.content.video_title).toBeTruthy()
      expect(fallback.currentLessonFull.content.creator).toBeTruthy()
      expect(fallback.currentLessonFull.content.original_url).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/)
      expect(fallback.currentLessonFull.content.attribution).toBeTruthy()
      expectNoPlaceholderVideo(fallback.currentLessonFull.content.video_url)
    }
  })
})
