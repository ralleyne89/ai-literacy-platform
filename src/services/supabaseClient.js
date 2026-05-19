import { createClient } from '@supabase/supabase-js'

export const SUPABASE_STUB_STATE_KEY = '__playwright_supabase_stub__'

const isBrowser = typeof window !== 'undefined'
const usePlaywrightStub = import.meta.env.VITE_SUPABASE_AUTH_STUB === '1'
const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseKey = String(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    ''
).trim()
const reviewEmail = String(import.meta.env.VITE_DEMO_REVIEW_EMAIL || '').trim().toLowerCase()
const reviewFirstName = String(import.meta.env.VITE_DEMO_REVIEW_FIRST_NAME || '').trim()
const reviewLastName = String(import.meta.env.VITE_DEMO_REVIEW_LAST_NAME || '').trim()

const DEFAULT_STUB_SESSION = {
  access_token: 'demo',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'playwright-refresh-token',
  user: {
    id: 'user_playwright',
    email: 'playwright@example.com',
    user_metadata: {
      first_name: 'Demo',
      last_name: 'User',
      name: 'Demo User',
    },
    app_metadata: {
      provider: 'google',
    },
  },
}

const base64UrlEncode = (value) => {
  if (!isBrowser) {
    return ''
  }

  return window.btoa(unescape(encodeURIComponent(value)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

const getStubUserMetadata = (email = '') => {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const isReviewUser = reviewEmail && normalizedEmail === reviewEmail

  return {
    first_name: isReviewUser && reviewFirstName ? reviewFirstName : DEFAULT_STUB_SESSION.user.user_metadata.first_name,
    last_name: isReviewUser && reviewLastName ? reviewLastName : DEFAULT_STUB_SESSION.user.user_metadata.last_name,
    name: isReviewUser && (reviewFirstName || reviewLastName)
      ? `${reviewFirstName || 'Review'} ${reviewLastName || 'User'}`.trim()
      : DEFAULT_STUB_SESSION.user.user_metadata.name,
  }
}

const buildDemoAccessToken = (email, provider) => {
  const payload = {
    sub: 'demo-review',
    email,
    provider,
    user_metadata: getStubUserMetadata(email),
  }
  const encoded = base64UrlEncode(JSON.stringify(payload))
  return encoded ? `demo.${encoded}` : 'demo'
}

const buildStubSession = (email = DEFAULT_STUB_SESSION.user.email, provider = 'email') => ({
  ...DEFAULT_STUB_SESSION,
  access_token: buildDemoAccessToken(email, provider),
  user: {
    ...DEFAULT_STUB_SESSION.user,
    email,
    user_metadata: getStubUserMetadata(email),
    app_metadata: {
      provider,
    },
  },
})

const listeners = new Set()

const makeAuthError = (message) => ({ message, name: 'AuthApiError' })

const readStubState = () => {
  if (!isBrowser) {
    return { session: null, lastRedirectRequest: null }
  }

  try {
    const raw = window.sessionStorage.getItem(SUPABASE_STUB_STATE_KEY)
    return raw ? JSON.parse(raw) : { session: null, lastRedirectRequest: null }
  } catch {
    return { session: null, lastRedirectRequest: null }
  }
}

const writeStubState = (nextState) => {
  if (!isBrowser) {
    return
  }

  const state = {
    session: null,
    lastRedirectRequest: null,
    ...nextState,
  }
  window.sessionStorage.setItem(SUPABASE_STUB_STATE_KEY, JSON.stringify(state))
}

const notifyStubListeners = (event, session) => {
  listeners.forEach((listener) => listener(event, session))
}

const resolvePath = (value) => {
  if (!isBrowser || !value) {
    return '/auth/callback'
  }

  try {
    return new URL(value, window.location.origin).pathname
  } catch {
    return '/auth/callback'
  }
}

const createStubClient = () => ({
  auth: {
    getSession: async () => ({
      data: { session: readStubState().session },
      error: null,
    }),
    onAuthStateChange: (callback) => {
      listeners.add(callback)
      setTimeout(() => {
        callback('INITIAL_SESSION', readStubState().session)
      }, 0)

      return {
        data: {
          subscription: {
            unsubscribe: () => listeners.delete(callback),
          },
        },
      }
    },
    signInWithOAuth: async ({ provider, options } = {}) => {
      const redirectTo = options?.redirectTo || '/auth/callback'
      const redirectPath = resolvePath(redirectTo)
      writeStubState({
        session: null,
        lastRedirectRequest: {
          type: 'oauth',
          provider: provider || 'google',
          redirectPath,
        },
      })

      if (isBrowser) {
        window.location.assign(`${redirectPath}?code=playwright-supabase-code`)
      }

      return {
        data: { provider: provider || 'google', url: redirectTo },
        error: null,
      }
    },
    signInWithPassword: async ({ email, password } = {}) => {
      if (!email || !password) {
        return {
          data: { session: null },
          error: makeAuthError('Email and password are required.'),
        }
      }

      const state = readStubState()
      const session = buildStubSession(email, 'email')
      writeStubState({
        ...state,
        session,
      })
      notifyStubListeners('SIGNED_IN', session)

      return {
        data: { session, user: session.user },
        error: null,
      }
    },
    signUp: async ({ email, password } = {}) => {
      if (!email || !password) {
        return {
          data: { session: null, user: null },
          error: makeAuthError('Email and password are required.'),
        }
      }

      const state = readStubState()
      const session = buildStubSession(email, 'email')
      writeStubState({
        ...state,
        session,
      })
      notifyStubListeners('SIGNED_IN', session)

      return {
        data: { session, user: session.user },
        error: null,
      }
    },
    exchangeCodeForSession: async (code) => {
      if (!code) {
        return {
          data: { session: null },
          error: makeAuthError('Missing Supabase auth code.'),
        }
      }

      const state = readStubState()
      const session = reviewEmail
        ? buildStubSession(reviewEmail, 'google')
        : {
            ...DEFAULT_STUB_SESSION,
            access_token: 'demo',
          }
      writeStubState({
        ...state,
        session,
      })
      notifyStubListeners('SIGNED_IN', session)

      return {
        data: { session },
        error: null,
      }
    },
    signOut: async () => {
      const state = readStubState()
      writeStubState({
        ...state,
        session: null,
      })
      notifyStubListeners('SIGNED_OUT', null)
      return { error: null }
    },
  },
})

const unavailableClient = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    }),
    signInWithOAuth: async () => ({
      data: null,
      error: makeAuthError('Supabase is not configured.'),
    }),
    signInWithPassword: async () => ({
      data: null,
      error: makeAuthError('Supabase is not configured.'),
    }),
    signUp: async () => ({
      data: null,
      error: makeAuthError('Supabase is not configured.'),
    }),
    exchangeCodeForSession: async () => ({
      data: { session: null },
      error: makeAuthError('Supabase is not configured.'),
    }),
    signOut: async () => ({ error: null }),
  },
}

export const isSupabaseConfigured = () => usePlaywrightStub || Boolean(supabaseUrl && supabaseKey)

export const getSupabaseConfigError = () => {
  if (isSupabaseConfigured()) {
    return ''
  }

  const missing = []
  if (!supabaseUrl) {
    missing.push('VITE_SUPABASE_URL')
  }
  if (!supabaseKey) {
    missing.push('VITE_SUPABASE_PUBLISHABLE_KEY')
  }

  return `Supabase is not configured. Set ${missing.join(' and ')}.`
}

export const supabase = usePlaywrightStub
  ? createStubClient()
  : isSupabaseConfigured()
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: false,
          flowType: 'pkce',
          persistSession: true,
        },
      })
    : unavailableClient
