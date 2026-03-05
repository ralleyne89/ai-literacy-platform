import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AUTH_CALLBACK_PATH } from '@/config/apiEndpoints'

const AUTH0_CODE_VERIFIER_SESSION_KEY = 'ailiteracy_auth0_code_verifier'
const AUTH0_STATE_SESSION_KEY = 'ailiteracy_auth0_state'

const getStoredAuth0CallbackValue = (key) => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return ''
  }
  try {
    return window.sessionStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

const clearAuth0PkceCallbackData = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return
  }
  try {
    window.sessionStorage.removeItem(AUTH0_CODE_VERIFIER_SESSION_KEY)
    window.sessionStorage.removeItem(AUTH0_STATE_SESSION_KEY)
  } catch (error) {
    console.warn('Failed to clear Auth0 callback PKCE data:', error)
  }
}

const extractAuthErrorMessage = (search = '', hash = '') => {
  const query = new URLSearchParams(search)
  const fragment = hash.startsWith('#') ? hash.substring(1) : hash
  const hashParams = new URLSearchParams(fragment)

  const error = query.get('error') || hashParams.get('error')
  if (!error) {
    return null
  }

  const errorDescription = query.get('error_description') || hashParams.get('error_description')
  return errorDescription ? `${error}: ${errorDescription}` : error
}

const extractAuth0CallbackParams = (search = '', hash = '') => {
  const query = new URLSearchParams(search)
  const fragment = hash.startsWith('#') ? hash.substring(1) : hash
  const hashParams = new URLSearchParams(fragment)

  return {
    auth0AccessToken: hashParams.get('access_token') || hashParams.get('id_token') || '',
    auth0Code: query.get('code') || hashParams.get('code') || '',
    auth0State: query.get('state') || hashParams.get('state') || ''
  }
}

const buildCallbackFailureState = (result, fallback = '') => {
  if (!result) {
    return {
      code: 'auth_callback_failed',
      error: fallback || 'Unable to complete sign-in.',
      details: ''
    }
  }

  if (typeof result === 'object') {
    return {
      code: result.code || 'auth_callback_failed',
      error: result.error || result.message || fallback || 'Unable to complete sign-in.',
      details: result.details || ''
    }
  }

  return {
    code: 'auth_callback_failed',
    error: String(result) || fallback || 'Unable to complete sign-in.',
    details: ''
  }
}

const isAuthResultSuccessful = (value) => value === true || (value && value.success === true)

const AuthCallback = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { syncBackendAfterLogin, loading, isAuthenticated } = useAuth()
  const [statusMessage, setStatusMessage] = useState('Checking your account…')
  const [errorMessage, setErrorMessage] = useState('')

  const authErrorMessage = extractAuthErrorMessage(location.search, location.hash)
  const { auth0AccessToken, auth0Code, auth0State } = extractAuth0CallbackParams(
    location.search,
    location.hash
  )
  const hasAuth0ExchangeParams = Boolean(auth0Code || auth0AccessToken)

  useEffect(() => {
    let isActive = true
    let redirectTimeoutId

    const finalize = async () => {
      if (loading) {
        return
      }

      console.info('[AuthCallback] received callback URL', {
        callbackUrl: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        hasCode: Boolean(auth0Code),
        hasAccessToken: Boolean(auth0AccessToken),
        hasState: Boolean(auth0State),
        storedStatePresent: Boolean(getStoredAuth0CallbackValue(AUTH0_STATE_SESSION_KEY)),
        storedVerifierPresent: Boolean(getStoredAuth0CallbackValue(AUTH0_CODE_VERIFIER_SESSION_KEY))
      })

      if (authErrorMessage) {
        console.error('Auth0 callback returned an OAuth error.', {
          error: authErrorMessage,
          callback_search: location.search
        })
        setErrorMessage(`OAuth callback error: ${authErrorMessage}`)
        setStatusMessage('Redirecting to sign in...')
        clearAuth0PkceCallbackData()
        redirectTimeoutId = setTimeout(() => {
          if (!isActive) {
            return
          }
          navigate('/login', {
            replace: true,
            state: {
              from: { pathname: '/dashboard' },
              authError: buildCallbackFailureState({
                code: 'auth0_callback_error',
                error: authErrorMessage
              })
            }
          })
        }, 1200)
        return
      }

      if (!hasAuth0ExchangeParams) {
        console.error('Auth0 callback missing code or token.')
        setErrorMessage('Auth0 callback did not include a code or token.')
        setStatusMessage('Redirecting to sign in...')
        redirectTimeoutId = setTimeout(() => {
          if (!isActive) {
            return
          }
          navigate('/login', {
            replace: true,
            state: {
              from: { pathname: '/dashboard' },
              authError: buildCallbackFailureState(null, 'Auth0 callback did not include a code or token.')
            }
          })
        }, 1400)
        clearAuth0PkceCallbackData()
        return
      }

      const auth0ExchangePayload = {
        auth0AccessToken,
        auth0Code,
        auth0RedirectUri: `${window.location.origin}${AUTH_CALLBACK_PATH}`
      }
      if (auth0Code) {
        const storedState = getStoredAuth0CallbackValue(AUTH0_STATE_SESSION_KEY)
        const storedCodeVerifier = getStoredAuth0CallbackValue(AUTH0_CODE_VERIFIER_SESSION_KEY)
        if (!storedState || !storedCodeVerifier || !auth0State || storedState !== auth0State) {
          console.error('Auth0 callback state verification failed.', {
            expected_state_present: Boolean(storedState),
            received_state_present: Boolean(auth0State),
            code_verifier_present: Boolean(storedCodeVerifier)
          })
          setErrorMessage('OAuth callback state verification failed. Please sign in again.')
          setStatusMessage('Redirecting to sign in...')
          clearAuth0PkceCallbackData()
          redirectTimeoutId = setTimeout(() => {
            if (!isActive) {
              return
            }
            navigate('/login', {
              replace: true,
              state: {
                from: { pathname: '/dashboard' },
                authError: buildCallbackFailureState({
                  code: 'auth0_state_mismatch',
                  error: 'OAuth callback state verification failed.'
                })
              }
            })
          }, 1400)
          return
        }
        auth0ExchangePayload.auth0CodeVerifier = storedCodeVerifier
      }

      const syncResult = await syncBackendAfterLogin?.(auth0ExchangePayload)
      clearAuth0PkceCallbackData()

      if (!isActive) {
        return
      }

      if (isAuthResultSuccessful(syncResult) || isAuthenticated) {
        console.info('Auth0 callback sync succeeded.', {
          hasUser: Boolean(syncResult?.user),
          userId: syncResult?.user?.id
        })
        navigate('/dashboard', { replace: true })
        return
      }

      const failure = buildCallbackFailureState(syncResult, 'Unable to complete backend sign-in.')
      setErrorMessage(`Sign-in could not be completed: ${failure.error}`)
      setStatusMessage('Redirecting to sign in...')
      redirectTimeoutId = setTimeout(() => {
        if (!isActive) {
          return
        }
        navigate('/login', {
          replace: true,
          state: {
            from: { pathname: '/dashboard' },
            authError: failure
          }
        })
      }, 1500)
    }

    finalize().catch((err) => {
      if (!isActive) {
        return
      }

      console.error('Auth callback failed:', err)
      setErrorMessage('Unable to finalize sign-in. Please try again from the login page.')
      setStatusMessage('Redirecting to sign in...')
      clearAuth0PkceCallbackData()
      const failure = buildCallbackFailureState(err, 'Unable to finalize sign-in. Please try again from the login page.')
      redirectTimeoutId = setTimeout(() => {
        if (!isActive) {
          return
        }
        navigate('/login', {
          replace: true,
          state: {
            from: { pathname: '/dashboard' },
            authError: failure
          }
        })
      }, 1500)
    })

    return () => {
      isActive = false
      if (redirectTimeoutId) {
        clearTimeout(redirectTimeoutId)
      }
    }
  }, [
    auth0AccessToken,
    auth0Code,
    auth0State,
    hasAuth0ExchangeParams,
    authErrorMessage,
    loading,
    navigate,
    syncBackendAfterLogin,
    location,
    isAuthenticated
  ])

  useEffect(() => {
    setStatusMessage(loading ? 'Checking your account…' : 'Finishing sign-in…')
  }, [loading])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 px-6 py-8 text-center">
        <p className="text-gray-700 font-medium">{errorMessage || statusMessage}</p>
      </div>
    </div>
  )
}

export default AuthCallback
