import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
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
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Tailored enablement for teams and departments.',
    amount: 99,
    currency: 'usd',
    billing_interval: 'month',
    features: [
      'Custom learning paths',
      'Dedicated customer success',
      'SSO & advanced reporting',
      'Licensing & partnerships'
    ],
    cta: 'Upgrade to Enterprise',
    is_free: false,
    checkout_enabled: true,
    configured: true
  }
]

const BillingPage = () => {
  const { user } = useAuth()
  const location = useLocation()

  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkoutPlan, setCheckoutPlan] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [subscription, setSubscription] = useState(null)
  const [loadingPortal, setLoadingPortal] = useState(false)

  const queryMessages = useMemo(() => ({
    success: 'Subscription activated successfully. Welcome aboard! 🎉',
    canceled: 'Checkout canceled. You have not been charged.'
  }), [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('success')) {
      setNotice(queryMessages.success)
    } else if (params.get('canceled')) {
      setError(queryMessages.canceled)
    }
  }, [location.search, queryMessages])

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await axios.get('/api/billing/config')
        const remotePlans = Array.isArray(data?.plans) && data.plans.length > 0 ? data.plans : null
        setPlans(remotePlans || FALLBACK_PLANS)
        if (!remotePlans) {
          setNotice('Using standard plan information. Connect the backend billing service to enable live checkout.')
        }
      } catch (err) {
        console.error('Failed to load billing config:', err)
        setPlans(FALLBACK_PLANS)
        setNotice('Unable to reach billing API. Displaying standard plan information instead.')
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])

  // Fetch subscription status from localStorage (set by webhook or after checkout)
  useEffect(() => {
    const storedSubscription = localStorage.getItem('subscription_data')
    if (storedSubscription) {
      try {
        setSubscription(JSON.parse(storedSubscription))
      } catch (e) {
        console.error('Failed to parse subscription data:', e)
      }
    }
  }, [])

  const handleCheckout = async (planId) => {
    let emailToUse = (user?.email || manualEmail || '').trim()
    if (!emailToUse) {
      const entered = window.prompt('Enter the email address for this subscription:', '')
      if (!entered || !entered.trim()) {
        setError('Email is required to start checkout.')
        return
      }
      emailToUse = entered.trim()
      setManualEmail(emailToUse)
    }

    setCheckoutPlan(planId)
    setError('')

    console.log('[Checkout] Starting checkout for plan:', planId, 'email:', emailToUse)
    console.log('[Checkout] Axios baseURL:', axios.defaults.baseURL)
    console.log('[Checkout] Current origin:', window.location.origin)

    try {
      const requestUrl = '/api/billing/checkout-session'
      const requestData = { plan: planId, email: emailToUse }

      console.log('[Checkout] Making POST request to:', requestUrl)
      console.log('[Checkout] Request data:', requestData)

      const response = await axios.post(requestUrl, requestData)

      console.log('[Checkout] Response status:', response.status)
      console.log('[Checkout] Response data:', response.data)

      const { data } = response

      if (data?.url) {
        console.log('[Checkout] Redirecting to:', data.url)
        window.location.href = data.url
      } else {
        console.error('[Checkout] No URL in response:', data)
        throw new Error('Missing checkout URL from server')
      }
    } catch (err) {
      console.error('[Checkout] Error caught:', err)
      console.error('[Checkout] Error type:', err.constructor.name)
      console.error('[Checkout] Error message:', err.message)
      console.error('[Checkout] Error response:', err?.response)
      console.error('[Checkout] Error response data:', err?.response?.data)
      console.error('[Checkout] Error response status:', err?.response?.status)

      const responseData = err?.response?.data
      const message = responseData?.error || 'We could not start the checkout session.'
      const details = responseData?.details || responseData?.hint

      const fullError = details ? `${message} (${details})` : message
      console.error('[Checkout] Setting error message:', fullError)

      setError(fullError)
      setCheckoutPlan('')
    }
  }

  const handleManageSubscription = async () => {
    if (!subscription?.customer_id) {
      setError('No active subscription found')
      return
    }

    setLoadingPortal(true)
    setError('')
    try {
      const { data } = await axios.post('/api/billing/customer-portal', {
        customer_id: subscription.customer_id
      })
      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error('Missing portal URL from server')
      }
    } catch (err) {
      console.error('Portal failed:', err)
      const responseData = err?.response?.data
      const message = responseData?.error || 'Unable to open customer portal.'
      const details = responseData?.details
      setError(details ? `${message} (${details})` : message)
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

    const disabled = !plan.checkout_enabled || checkoutPlan === plan.id
    const label = plan.checkout_enabled ? plan.cta : 'Contact sales'

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
            Redirecting…
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

        {subscription && subscription.has_subscription && (
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

        {notice && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {notice}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-8 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
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
          <div className="grid gap-8 md:grid-cols-3">
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
