const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0'])

const trimTrailingSlashes = (value) => (value || '').replace(/\/+$/, '')

const parseUrl = (value) => {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

const isLocalUrl = (value) => {
  const parsed = parseUrl(value)
  if (!parsed) {
    return false
  }
  return LOCAL_HOSTNAMES.has(parsed.hostname.toLowerCase())
}

const getLocalFallback = (origin) => origin.replace(/:\d+$/, ':5001')

export const resolveApiBaseUrl = () => {
  const configuredBaseUrl = trimTrailingSlashes(import.meta.env.VITE_API_URL)

  if (configuredBaseUrl) {
    const parsedConfigured = parseUrl(configuredBaseUrl)

    if (parsedConfigured) {
      const isLocalWindow = typeof window !== 'undefined' && LOCAL_HOSTNAMES.has(window.location.hostname)
      const configuredIsLocal = LOCAL_HOSTNAMES.has(parsedConfigured.hostname.toLowerCase())

      if (!isLocalWindow && configuredIsLocal) {
        console.error('Ignoring localhost VITE_API_URL in non-local runtime.')
      } else {
        return configuredBaseUrl
      }
    } else {
      console.error('VITE_API_URL is not a valid absolute URL. Falling back to runtime defaults.')
    }
  }

  if (typeof window !== 'undefined') {
    const origin = window.location.origin
    const isLocalOrigin = LOCAL_HOSTNAMES.has(window.location.hostname)
    return isLocalOrigin ? getLocalFallback(origin) : origin
  }

  return configuredBaseUrl
}

export const isConfiguredApiLocalhost = () => {
  const configuredBaseUrl = trimTrailingSlashes(import.meta.env.VITE_API_URL)
  return Boolean(configuredBaseUrl) && isLocalUrl(configuredBaseUrl)
}
