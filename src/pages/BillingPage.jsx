import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { BILLING_ENDPOINTS } from '../config/apiEndpoints'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

const formatCurrency = (amount, currency = 'usd') => {
  if (amount === null || typeof amount === 'undefined') {
    return 'Contact'
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0
  })

  return formatter.format(amount)
}

const FALLBACK_PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for individuals exploring LitmusAI.',
    amount: 0,
    currency: 'usd',
    billing_interval: 'month',
    features: [
      'Access to assessments',
      'Foundational training modules',
      'Basic progress tracking'
    ],
    cta: 'You are on this plan',
    is_free: true,
    checkout_enabled: true,
    configured: true
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Unlock premium training, certifications, and analytics.',
    amount: 49,
    currency: 'usd',
    billing_interval: 'month',
    features: [
      'All Free features',
      'Premium training catalog',
      'Certification exam access',
      'Email support'
    ],
    cta: 'Upgrade to Premium',
    is_free: false,
    checkout_enabled: true,
    configured: true
  }
]

const isHtmlPayload = (payload) => {
  if (typeof payload === 'string') {
    const normalized = payload.trim().toLowerCase()
    return normalized.startsWith('<!doctype html') || normalized.startsWith('<html')
  }

  return false
}

const buildSyntheticHttpError = (response, message = 'Invalid API response') => {
  const error = new Error(message)
  error.response = response
  return error
}

const getBillingApiFallbackMessage = (err) => {
  if (!err?.response) {
    return 'Unable to reach billing API. Displaying standard plan information instead.'
  }

  const data = err.response.data
  if (isHtmlPayload(data)) {
    return 'Billing API returned HTML instead of JSON. Displaying standard plan information instead.'
  }

  if (typeof data === 'object' && data !== null) {
    return data.error || data.message || 'Unable to reach billing API. Displaying standard plan information instead.'
  }

  return 'Unable to reach billing API. Displaying standard plan information instead.'
}

const getBillingActionError = (err, fallbackMessage) => {
  if (!err?.response) {
    return `${fallbackMessage} Please check your connection and try again.`
  }

  const data = err.response.data
  if (isHtmlPayload(data)) {
    return `${fallbackMessage} Billing API routing appears misconfigured.`
  }

  if (typeof data === 'object' && data !== null) {
    const message = data.error || data.message || fallbackMessage
    const details = data.details || data.hint
    return details ? `${message} (${details})` : message
  }

  return fallbackMessage
}

const BillingPage = () => {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkoutPlan, setCheckoutPlan] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [subscription, setSubscription] = useState(null)
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [mockMode, setMockMode] = useState(false)
  const [usingFallbackPlans, setUsingFallbackPlans] = useState(false)
  const [retryingPlans, setRetryingPlans] = useState(false)
  const [finalizingCheckout, setFinalizingCheckout] = useState(false)

  const queryMessages = useMemo(() => ({
    success: 'Subscription activated successfully. Welcome aboard.',
    canceled: 'Checkout canceled. You have not been charged.'
  }), [])

  const fetchPlans = useCallback(async ({ showSpinner = true } = {}) => {
    if (showSpinner) {
      setLoading(true)
    }

    try {
      const response = await axios.get(BILLING_ENDPOINTS.config)
      const payload = response?.data

      if (isHtmlPayload(payload) || !payload || typeof payload !== 'object') {
        throw buildSyntheticHttpError(response, 'Invalid billing payload')
      }

      const remotePlans = Array.isArray(payload.plans) && payload.plans.length > 0 ? payload.plans : null
      const filteredPlans = (remotePlans || FALLBACK_PLANS).filter(plan => plan.configured !== false)

      setPlans(filteredPlans)
      setMockMode(Boolean(payload.mock_mode))
      setUsingFallbackPlans(false)
    } catch (err) {
      setPlans(FALLBACK_PLANS)
      setMockMode(false)
      setUsingFallbackPlans(true)
      setNotice(getBillingApiFallbackMessage(err))
    } finally {
      if (showSpinner) {
        setLoading(false)
      }
    }
  }, [])

  const fetchSubscription = useCallback(async () => {
    if (!isAuthenticated) {
      setSubscription(null)
      return
    }

    try {
      const response = await axios.get(BILLING_ENDPOINTS.subscription)
      const payload = response?.data

      if (isHtmlPayload(payload) || !payload || typeof payload !== 'object') {
        throw buildSyntheticHttpError(response, 'Invalid billing subscription payload')
      }

      setSubscription(payload)
    } catch (err) {
      if (err?.response?.status !== 401) {
        setError(getBillingActionError(err, 'Unable to load your current subscription status.'))
      }
    }
  }, [isAuthenticated])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const success = params.get('success')
    const canceled = params.get('canceled')
    const sessionId = params.get('session_id')

    if (canceled) {
      setError(queryMessages.canceled)
      return
    }

    if (!success) {
      return
    }

    if (!sessionId || !isAuthenticated) {
      setNotice(queryMessages.success)
      return
    }

    let cancelled = false

    const finalizeCheckout = async () => {
      setFinalizingCheckout(true)
      setError('')

      try {
        const response = await axios.post(BILLING_ENDPOINTS.checkoutComplete, {
          session_id: sessionId
        })
        const payload = response?.data

        if (isHtmlPayload(payload) || !payload || typeof payload !== 'object') {
          throw buildSyntheticHttpError(response, 'Invalid checkout completion payload')
        }

        if (!cancelled) {
          setNotice(queryMessages.success)
          await fetchSubscription()
          if (typeof window !== 'undefined') {
            const currentUrl = new URL(window.location.href)
            currentUrl.searchParams.delete('session_id')
            window.history.replaceState({}, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(getBillingActionError(err, 'We could not finalize your subscription after checkout.'))
        }
      } finally {
        if (!cancelled) {
          setFinalizingCheckout(false)
        }
      }
    }

    finalizeCheckout()

    return () => {
      cancelled = true
    }
  }, [fetchSubscription, isAuthenticated, location.search, queryMessages])

  useEffect(() => {
    fetchPlans({ showSpinner: true })
  }, [fetchPlans])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const handleRetryPlans = async () => {
    setRetryingPlans(true)
    setNotice('')
    await fetchPlans({ showSpinner: false })
    setRetryingPlans(false)
  }

  const handleCheckout = async (planId) => {
    if (!isAuthenticated) {
      setError('Sign in before starting checkout so we can use your verified account identity.')
      return
    }

    setCheckoutPlan(planId)
    setError('')

    try {
      const response = await axios.post(BILLING_ENDPOINTS.checkoutSession, { plan: planId })
      const payload = response?.data

      if (isHtmlPayload(payload) || !payload || typeof payload !== 'object' || !payload.url) {
        throw buildSyntheticHttpError(response, 'Missing checkout URL from server')
      }

      window.location.href = payload.url
    } catch (err) {
      setError(getBillingActionError(err, 'We could not start the checkout session.'))
      setCheckoutPlan('')
    }
  }

  const handleManageSubscription = async () => {
    setLoadingPortal(true)
    setError('')

    try {
      const response = await axios.post(BILLING_ENDPOINTS.customerPortal, {})
      const payload = response?.data

      if (isHtmlPayload(payload) || !payload || typeof payload !== 'object' || !payload.url) {
        throw buildSyntheticHttpError(response, 'Missing portal URL from server')
      }

      window.location.href = payload.url
    } catch (err) {
      setError(getBillingActionError(err, 'Unable to open customer portal.'))
    } finally {
      setLoadingPortal(false)
    }
  }

  const renderPlanButton = (plan) => {
    if (plan.is_free) {
      return (
        <button
          type="button"
          className="mt-8 w-full rounded-lg px-4 py-3 text-sm font-semibold bg-gray-200 text-gray-500 cursor-default"
          disabled
        >
          {plan.cta}
        </button>
      )
    }

    const disabled = !plan.checkout_enabled || checkoutPlan === plan.id || !isAuthenticated
    const label = plan.checkout_enabled
      ? (
        isAuthenticated
          ? (mockMode && !plan.is_free ? `Simulate ${plan.name}` : plan.cta)
          : 'Sign in to upgrade'
      )
      : 'Contact sales'
    const redirectingLabel = mockMode ? 'Opening sandbox...' : 'Redirecting...'

    return (
      <button
        type="button"
        onClick={() => handleCheckout(plan.id)}
        className={`mt-8 w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors duration-200 ${
          disabled
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        }`}
        disabled={disabled}
      >
        {checkoutPlan === plan.id ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {redirectingLabel}
          </span>
        ) : (
          label
        )}
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose the plan that fits your team</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Access assessments for free, or upgrade instantly to unlock the full LitmusAI experience.
            Plans are billed monthly and you can cancel anytime.
          </p>
        </div>

        {subscription?.has_subscription && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Active Subscription: {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                  </p>
                  <p className="text-xs text-blue-700">
                    Status: {subscription.status} • ${subscription.amount}/{subscription.interval}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleManageSubscription}
                disabled={loadingPortal}
                className="px-4 py-2 text-sm font-semibold text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {loadingPortal ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  'Manage Subscription'
                )}
              </button>
            </div>
          </div>
        )}

        {finalizingCheckout && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Finalizing your subscription and syncing it to your account...</span>
          </div>
        )}

        {notice && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4" />
            <span className="flex-1">{notice}</span>
            {usingFallbackPlans && (
              <button
                type="button"
                onClick={handleRetryPlans}
                disabled={retryingPlans}
                className="rounded-md border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
              >
                {retryingPlans ? 'Retrying...' : 'Retry API'}
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {isAuthenticated ? (
          <div className="mb-8 max-w-3xl mx-auto rounded-lg border border-gray-200 bg-white p-4">
            <label htmlFor="checkout-email" className="block text-sm font-medium text-gray-700 mb-2">
              Verified billing email
            </label>
            <input
              id="checkout-email"
              type="email"
              autoComplete="email"
              value={user?.email || ''}
              readOnly
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-700"
            />
            <p className="mt-2 text-xs text-gray-500">
              Checkout receipts and subscription notices use the verified email on your signed-in account.
            </p>
          </div>
        ) : (
          <div className="mb-8 max-w-3xl mx-auto rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">Sign in before upgrading.</p>
            <p className="mt-1">
              Paid checkout is tied to your verified account identity so the backend can securely sync your subscription.
            </p>
            <div className="mt-3 flex gap-3">
              <Link to="/login" className="rounded-md bg-primary-600 px-3 py-2 text-white font-semibold hover:bg-primary-700">
                Sign in
              </Link>
              <Link to="/register" className="rounded-md border border-amber-300 bg-white px-3 py-2 font-semibold text-amber-900 hover:bg-amber-100">
                Create account
              </Link>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {[0, 1].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mb-6"></div>
                <div className="space-y-3">
                  {[0, 1, 2, 3].map((j) => (
                    <div key={j} className="h-3 bg-gray-200 rounded"></div>
                  ))}
                </div>
                <div className="mt-8 h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.id} className="card flex flex-col">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">{plan.name}</h2>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                  <div className="mt-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatCurrency(plan.amount, plan.currency)}
                    </span>
                    {!plan.is_free && plan.amount !== null && (
                      <span className="text-gray-500"> / {plan.billing_interval || 'month'}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="inline-flex h-2 w-2 rounded-full bg-primary-500"></span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.status_message && (
                  <div className="mt-6 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
                    {plan.status_message}
                  </div>
                )}

                {renderPlanButton(plan)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BillingPage
