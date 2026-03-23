import React, { useCallback, useMemo, useSyncExternalStore } from 'react'

export const CLERK_STUB_STATE_KEY = '__playwright_clerk_stub__'
const DEFAULT_TOKEN = 'demo'
const DEFAULT_USER = {
  id: 'user_playwright',
  firstName: 'Playwright',
  lastName: 'User',
  fullName: 'Playwright User',
  primaryEmailAddress: {
    emailAddress: 'playwright@example.com',
  },
}

const listeners = new Set()
let cachedSerializedState = ''
let cachedSnapshot = null

const getDefaultState = () => ({
  isSignedIn: false,
  token: '',
  user: null,
  lastRedirectRequest: null,
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
    const serializedState = window.sessionStorage.getItem(CLERK_STUB_STATE_KEY) || ''
    if (serializedState === cachedSerializedState) {
      return cachedSnapshot
    }

    cachedSerializedState = serializedState
    cachedSnapshot = serializedState
      ? {
          ...getDefaultState(),
          ...JSON.parse(serializedState),
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
    ...nextState,
  }
  const serializedState = JSON.stringify(normalizedState)
  cachedSerializedState = serializedState
  cachedSnapshot = normalizedState
  window.sessionStorage.setItem(CLERK_STUB_STATE_KEY, serializedState)
  notifyListeners()
}

const clearState = () => {
  if (typeof window === 'undefined') {
    return
  }

  cachedSerializedState = ''
  cachedSnapshot = getDefaultState()
  window.sessionStorage.removeItem(CLERK_STUB_STATE_KEY)
  notifyListeners()
}

const subscribe = (listener) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const resolveRedirectPath = (value) => {
  if (!value) {
    return '/dashboard'
  }

  if (typeof window === 'undefined') {
    return value
  }

  try {
    return new URL(value, window.location.origin).pathname
  } catch {
    return '/dashboard'
  }
}

const resolveUser = (requestType, options = {}) => {
  const configuredUser = options.user || {}
  const email =
    configuredUser.primaryEmailAddress?.emailAddress ||
    configuredUser.emailAddress ||
    DEFAULT_USER.primaryEmailAddress.emailAddress

  return {
    ...DEFAULT_USER,
    ...configuredUser,
    firstName: configuredUser.firstName || (requestType === 'sign-up' ? 'New' : DEFAULT_USER.firstName),
    lastName: configuredUser.lastName || DEFAULT_USER.lastName,
    fullName: configuredUser.fullName || `${configuredUser.firstName || (requestType === 'sign-up' ? 'New' : DEFAULT_USER.firstName)} ${configuredUser.lastName || DEFAULT_USER.lastName}`,
    primaryEmailAddress: {
      emailAddress: email,
    },
  }
}

const performRedirect = (requestType, options = {}) => {
  const redirectPath = resolveRedirectPath(
    options.forceRedirectUrl ||
      options.fallbackRedirectUrl ||
      options.signInForceRedirectUrl ||
      options.signInFallbackRedirectUrl ||
      options.signUpForceRedirectUrl ||
      options.signUpFallbackRedirectUrl
  )

  writeState({
    isSignedIn: true,
    token: DEFAULT_TOKEN,
    user: resolveUser(requestType, options),
    lastRedirectRequest: {
      type: requestType,
      redirectPath,
    },
  })

  if (typeof window !== 'undefined') {
    window.location.assign(redirectPath)
  }
}

export const ClerkProvider = ({ children }) => <>{children}</>

export const useAuth = () => {
  const state = useSyncExternalStore(subscribe, readState, getDefaultState)
  const isSignedIn = Boolean(state.isSignedIn)
  const token = state.token || DEFAULT_TOKEN
  const getToken = useCallback(async () => (isSignedIn ? token : null), [isSignedIn, token])

  return useMemo(() => ({
    isLoaded: true,
    isSignedIn,
    getToken,
  }), [getToken, isSignedIn])
}

export const useClerk = () => {
  const redirectToSignIn = useCallback(async (options = {}) => {
    performRedirect('sign-in', options)
  }, [])

  const redirectToSignUp = useCallback(async (options = {}) => {
    performRedirect('sign-up', options)
  }, [])

  const signOut = useCallback(async ({ redirectUrl } = {}) => {
    clearState()

    if (typeof window !== 'undefined') {
      window.location.assign(redirectUrl || window.location.origin)
    }
  }, [])

  return {
    redirectToSignIn,
    redirectToSignUp,
    signOut,
  }
}
