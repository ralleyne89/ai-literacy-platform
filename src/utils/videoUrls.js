export const EXTERNAL_TRAINING_TYPES = new Set(['external', 'partner', 'affiliate'])

const DIRECT_VIDEO_PATTERN = /\.(mp4|webm|ogg)(\?.*)?$/i
const YOUTUBE_HOST_PATTERN = /(^|\.)youtube\.com$|(^|\.)youtube-nocookie\.com$/
const VIMEO_HOST_PATTERN = /(^|\.)vimeo\.com$/

const getHttpUrl = (value) => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

const getYouTubeVideoId = (url) => {
  const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
  if (hostname === 'youtu.be') {
    return url.pathname.split('/').filter(Boolean)[0] || ''
  }

  if (!YOUTUBE_HOST_PATTERN.test(hostname)) {
    return ''
  }

  const pathParts = url.pathname.split('/').filter(Boolean)
  if (pathParts[0] === 'embed' || pathParts[0] === 'shorts' || pathParts[0] === 'live') {
    return pathParts[1] || ''
  }

  return url.searchParams.get('v') || ''
}

const getVimeoVideoId = (url) => {
  const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
  if (!VIMEO_HOST_PATTERN.test(hostname)) {
    return ''
  }

  const pathParts = url.pathname.split('/').filter(Boolean)
  if (hostname === 'player.vimeo.com' && pathParts[0] === 'video') {
    return pathParts[1] || ''
  }

  return pathParts.find((part) => /^\d+$/.test(part)) || ''
}

const getStartSeconds = (url) => {
  const start = url.searchParams.get('start') || url.searchParams.get('t')
  if (!start) {
    return ''
  }

  const match = String(start).match(/^(\d+)s?$/)
  return match ? match[1] : ''
}

export const normalizeVideoSource = (value) => {
  const url = getHttpUrl(value)
  if (!url) {
    return null
  }

  const youtubeId = getYouTubeVideoId(url)
  if (youtubeId) {
    const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${youtubeId}`)
    const startSeconds = getStartSeconds(url)
    if (startSeconds) {
      embedUrl.searchParams.set('start', startSeconds)
    }

    return {
      type: 'iframe',
      src: embedUrl.toString(),
      originalUrl: url.toString(),
    }
  }

  const vimeoId = getVimeoVideoId(url)
  if (vimeoId) {
    return {
      type: 'iframe',
      src: `https://player.vimeo.com/video/${vimeoId}`,
      originalUrl: url.toString(),
    }
  }

  if (DIRECT_VIDEO_PATTERN.test(url.pathname)) {
    return {
      type: 'video',
      src: url.toString(),
      originalUrl: url.toString(),
    }
  }

  return {
    type: 'link',
    src: url.toString(),
    originalUrl: url.toString(),
  }
}

export const normalizeVideoEmbedUrl = (value) => {
  const videoSource = normalizeVideoSource(value)
  if (!videoSource) {
    return ''
  }

  return videoSource.type === 'iframe' ? videoSource.src : videoSource.originalUrl
}

export const hasInternalLessons = (item) =>
  Boolean(item?.has_internal_lessons) &&
  !EXTERNAL_TRAINING_TYPES.has(String(item?.content_type || '').toLowerCase())

export const getTrainingStartPath = (item) => {
  if (typeof item?.start_path === 'string' && item.start_path.startsWith('/training/modules/')) {
    return item.start_path
  }

  if (typeof item?.route_path === 'string' && item.route_path.startsWith('/training/modules/')) {
    return item.route_path
  }

  if (typeof item?.routing?.primary_path === 'string' && item.routing.primary_path.startsWith('/training/modules/')) {
    return item.routing.primary_path
  }

  if (!item?.id) {
    return '/training'
  }

  const detailPath = `/training/modules/${item.id}`
  return hasInternalLessons(item) ? `${detailPath}/learn` : detailPath
}
