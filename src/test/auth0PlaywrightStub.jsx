import React, { useCallback, useEffect, useSyncExternalStore } from 'react'

const AUTH0_STUB_STATE_KEY = '__playwright_auth0_stub__'
const DEFAULT_ACCESS_TOKEN = 'playwright-auth0-access-token'
const DEFAULT_CALLBACK_PATH = '/auth/callback'
const DEFAULT_USER = {
  sub: 'auth0|playwright-user',
  email: 'playwright@example.com',
  name: 'Playwright User'
}

const listeners = new Set()
let cachedSerializedState = ''
let cachedSnapshot = null

const getDefaultState = () => ({
  pendingRedirect: false,
  isAuthenticated: false,
  callbackHandled: false,
  accessToken: '',
  user: null,
  error: null,
  lastRedirectRequest: null
})

const notifyListeners = () => {
  listeners.forEach((listener) => listener())
}

const readState = () => {
  if (!cachedSnapshot) {
    cachedSnapshot = getDefaultState()
  }

  if (typeof window === 'undefined') {
    return cachedSnapshot
  }

  try {
    const serializedState = window.sessionStorage.getItem(AUTH0_STUB_STATE_KEY) || ''
    if (serializedState === cachedSerializedState) {
      return cachedSnapshot
    }

    cachedSerializedState = serializedState
    cachedSnapshot = serializedState
      ? {
          ...getDefaultState(),
          ...JSON.parse(serializedState)
        }
      : getDefaultState()
    return cachedSnapshot
  } catch {
    cachedSerializedState = ''
    cachedSnapshot = getDefaultState()
    return cachedSnapshot
  }
}

const writeState = (nextState) => {
  if (typeof window === 'undefined') {
    return
  }

  const normalizedState = {
    ...getDefaultState(),
    ...nextState
  }
  const serializedState = JSON.stringify(normalizedState)
  cachedSerializedState = serializedState
  cachedSnapshot = normalizedState
  window.sessionStorage.setItem(AUTH0_STUB_STATE_KEY, serializedState)
  notifyListeners()
}

const clearState = () => {
  if (typeof window === 'undefined') {
    return
  }

  cachedSerializedState = ''
  cachedSnapshot = getDefaultState()
  window.sessionStorage.removeItem(AUTH0_STUB_STATE_KEY)
  notifyListeners()
}

const subscribe = (listener) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const resolveRedirectUri = (redirectUri = '') => {
  if (typeof window === 'undefined') {
    return redirectUri || DEFAULT_CALLBACK_PATH
  }

  return redirectUri || `${window.location.origin}${DEFAULT_CALLBACK_PATH}`
}

const resolveCallbackPath = (redirectUri = '') => {
  try {
    return new URL(resolveRedirectUri(redirectUri), window.location.origin).pathname
  } catch {
    return DEFAULT_CALLBACK_PATH
  }
}

const buildUser = (state) => {
  const email = state.lastRedirectRequest?.authorizationParams?.login_hint || DEFAULT_USER.email
  return {
    ...DEFAULT_USER,
    ...state.user,
    email
  }
}

export const Auth0Provider = ({ children, authorizationParams, onRedirectCallback }) => {
  const callbackPath = resolveCallbackPath(authorizationParams?.redirect_uri)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const state = readState()
    const isCallbackPath = window.location.pathname === callbackPath
    if (!isCallbackPath || !state.pendingRedirect || state.callbackHandled) {
      return
    }

    writeState({
      ...state,
      pendingRedirect: false,
      isAuthenticated: true,
      callbackHandled: true,
      accessToken: state.accessToken || DEFAULT_ACCESS_TOKEN,
      user: buildUser(state),
      error: null
    })

    onRedirectCallback?.(state.lastRedirectRequest?.appState || undefined)
  }, [callbackPath, onRedirectCallback])

  return <>{children}</>
}

export const useAuth0 = () => {
  const state = useSyncExternalStore(subscribe, readState, getDefaultState)
  const hasSession = Boolean(state.isAuthenticated || state.pendingRedirect)
  const user = hasSession ? buildUser(state) : null

  const loginWithRedirect = useCallback(async (options = {}) => {
    if (typeof window === 'undefined') {
      return
    }

    const redirectUri = resolveRedirectUri(options.authorizationParams?.redirect_uri)
    writeState({
      ...readState(),
      pendingRedirect: true,
      isAuthenticated: false,
      callbackHandled: false,
      accessToken: DEFAULT_ACCESS_TOKEN,
      user: {
        ...DEFAULT_USER,
        email: options.authorizationParams?.login_hint || DEFAULT_USER.email
      },
      error: null,
      lastRedirectRequest: {
        appState: options.appState || null,
        authorizationParams: {
          login_hint: options.authorizationParams?.login_hint || '',
          screen_hint: options.authorizationParams?.screen_hint || '',
          connection: options.authorizationParams?.connection || '',
          redirect_uri: redirectUri
        }
      }
    })

    window.location.assign(redirectUri)
  }, [])

  const logout = useCallback(async ({ logoutParams } = {}) => {
    clearState()

    if (typeof window !== 'undefined') {
      window.location.assign(logoutParams?.returnTo || window.location.origin)
    }
  }, [])

  const getAccessTokenSilently = useCallback(async () => {
    const currentState = readState()
    if (!currentState.pendingRedirect && !currentState.isAuthenticated) {
      throw new Error('No Auth0 session available in the Playwright stub.')
    }

    return currentState.accessToken || DEFAULT_ACCESS_TOKEN
  }, [])

  return {
    error: state.error,
    getAccessTokenSilently,
    isAuthenticated: hasSession,
    isLoading: false,
    loginWithRedirect,
    logout,
    user
  }
}
