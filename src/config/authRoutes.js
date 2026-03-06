import { AUTH_CALLBACK_PATH } from './apiEndpoints'

export { AUTH_CALLBACK_PATH }

export const AUTH0_CALLBACK_PATH = AUTH_CALLBACK_PATH
export const AUTH_RETURN_TO_SESSION_KEY = 'ailiteracy_auth_return_to'

export const getStoredAuthReturnTo = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return ''
  }

  try {
    return String(window.sessionStorage.getItem(AUTH_RETURN_TO_SESSION_KEY) || '').trim()
  } catch {
    return ''
  }
}

export const setStoredAuthReturnTo = (value) => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return false
  }

  const normalized = String(value || '').trim()
  if (!normalized.startsWith('/')) {
    return false
  }

  try {
    window.sessionStorage.setItem(AUTH_RETURN_TO_SESSION_KEY, normalized)
    return true
  } catch {
    return false
  }
}

export const clearStoredAuthReturnTo = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return false
  }

  try {
    window.sessionStorage.removeItem(AUTH_RETURN_TO_SESSION_KEY)
    return true
  } catch {
    return false
  }
}
