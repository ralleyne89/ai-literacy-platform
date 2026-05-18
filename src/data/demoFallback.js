/**
 * Demo fallback data when backend is unreachable and VITE_AUTH_MODE=demo.
 * Used so training modules and video content still render for stakeholder demos.
 */

import curatedVideoCatalog from '../../docs/course-content/curated-video-catalog.json'

const getCuratedVideo = (moduleId) => curatedVideoCatalog.videos[moduleId] || {}

const getCuratedVideoUrl = (moduleId) => getCuratedVideo(moduleId).video_url || ''

const withCuratedMetadata = (moduleId, metadata = {}) => ({
  ...metadata,
  ...getCuratedVideo(moduleId),
})

export const DEMO_FALLBACK_MODULE_IDS = ['module-ai-fundamentals', 'module-prompt-basics', 'module-ethics-overview']

export const DEMO_FALLBACK_MODULES_LIST = [
  {
    id: 'module-ai-fundamentals',
    title: 'AI Fundamentals',
    description: 'Core concepts: what AI is, how it learns, and how to use it responsibly in your role.',
    role_specific: 'General',
    difficulty_level: 1,
    estimated_duration_minutes: 30,
    content_type: 'video',
    is_premium: false,
    learning_objectives: ['Understand key AI terms', 'Identify safe use cases', 'Apply basic prompt tips'],
    metadata: withCuratedMetadata('module-ai-fundamentals', { access_tier: 'free', format: 'video' })
  },
  {
    id: 'module-prompt-basics',
    title: 'Prompt Engineering Basics',
    description: 'Write clear prompts to get better results from AI tools. Practical examples for everyday tasks.',
    role_specific: 'General',
    difficulty_level: 2,
    estimated_duration_minutes: 45,
    content_type: 'video',
    is_premium: false,
    learning_objectives: ['Structure effective prompts', 'Iterate on outputs', 'Avoid common pitfalls'],
    metadata: withCuratedMetadata('module-prompt-basics', { access_tier: 'free', format: 'video' })
  },
  {
    id: 'module-ethics-overview',
    title: 'Ethics & Critical Thinking',
    description: 'Use AI fairly and critically: bias, transparency, and when to trust (or verify) AI outputs.',
    role_specific: 'General',
    difficulty_level: 2,
    estimated_duration_minutes: 40,
    content_type: 'video',
    is_premium: false,
    learning_objectives: ['Recognize algorithmic bias', 'Apply human-in-the-loop checks', 'Explain AI decisions'],
    metadata: withCuratedMetadata('module-ethics-overview', { access_tier: 'free', format: 'video' })
  }
]

/** Full module detail for TrainingModulePage (includes content_url for video embed). */
export const DEMO_FALLBACK_MODULE_DETAILS = {
  'module-ai-fundamentals': {
    id: 'module-ai-fundamentals',
    title: 'AI Fundamentals',
    description: 'Core concepts: what AI is, how it learns, and how to use it responsibly in your role.',
    role_specific: 'General',
    difficulty_level: 1,
    estimated_duration_minutes: 30,
    content_type: 'video',
    content_url: getCuratedVideoUrl('module-ai-fundamentals'),
    learning_objectives: ['Understand key AI terms', 'Identify safe use cases', 'Apply basic prompt tips'],
    content_sections: [],
    prerequisites: [],
    resources: [],
    metadata: withCuratedMetadata('module-ai-fundamentals', { access_tier: 'free', format: 'video' })
  },
  'module-prompt-basics': {
    id: 'module-prompt-basics',
    title: 'Prompt Engineering Basics',
    description: 'Write clear prompts to get better results from AI tools. Practical examples for everyday tasks.',
    role_specific: 'General',
    difficulty_level: 2,
    estimated_duration_minutes: 45,
    content_type: 'video',
    content_url: getCuratedVideoUrl('module-prompt-basics'),
    learning_objectives: ['Structure effective prompts', 'Iterate on outputs', 'Avoid common pitfalls'],
    content_sections: [],
    prerequisites: [],
    resources: [],
    metadata: withCuratedMetadata('module-prompt-basics', { access_tier: 'free', format: 'video' })
  },
  'module-ethics-overview': {
    id: 'module-ethics-overview',
    title: 'Ethics & Critical Thinking',
    description: 'Use AI fairly and critically: bias, transparency, and when to trust (or verify) AI outputs.',
    role_specific: 'General',
    difficulty_level: 2,
    estimated_duration_minutes: 40,
    content_type: 'video',
    content_url: getCuratedVideoUrl('module-ethics-overview'),
    learning_objectives: ['Recognize algorithmic bias', 'Apply human-in-the-loop checks', 'Explain AI decisions'],
    content_sections: [],
    prerequisites: [],
    resources: [],
    metadata: withCuratedMetadata('module-ethics-overview', { access_tier: 'free', format: 'video' })
  }
}

const DEMO_LESSON_ID = 'demo-lesson-video'

/** One video lesson per demo module for CourseViewerPage. */
export function getDemoModuleAndLessons(moduleId) {
  const moduleDetail = DEMO_FALLBACK_MODULE_DETAILS[moduleId]
  if (!moduleDetail) return null
  const lessons = [
    {
      id: DEMO_LESSON_ID,
      title: `${moduleDetail.title} – Video`,
      description: moduleDetail.description,
      order_index: 0,
      content_type: 'video',
      estimated_duration_minutes: moduleDetail.estimated_duration_minutes,
      is_required: true,
      status: 'not_started',
      time_spent_minutes: 0,
      quiz_score: null,
      completed_at: null
    }
  ]
  const module = {
    id: moduleDetail.id,
    title: moduleDetail.title,
    description: moduleDetail.description,
    total_lessons: 1
  }
  const moduleProgress = {
    module_id: moduleId,
    status: 'not_started',
    progress_percentage: 0,
    completed_lessons: 0,
    total_lessons: 1,
    time_spent_minutes: 0,
    current_lesson_id: DEMO_LESSON_ID,
    resume_lesson_id: DEMO_LESSON_ID,
    started_at: null,
    last_accessed: null,
    completed_at: null
  }
  const currentLessonFull = {
    id: DEMO_LESSON_ID,
    module_id: moduleId,
    title: lessons[0].title,
    description: lessons[0].description,
    order_index: 0,
    content_type: 'video',
    content: getCuratedVideo(moduleId),
    estimated_duration_minutes: lessons[0].estimated_duration_minutes,
    is_required: true,
    progress: { status: 'not_started', time_spent_minutes: 0, quiz_score: null, quiz_attempts: 0, started_at: null, completed_at: null }
  }
  return { module, lessons, moduleProgress, currentLessonFull }
}
