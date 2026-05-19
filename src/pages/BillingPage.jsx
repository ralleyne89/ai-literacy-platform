import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { BILLING_ENDPOINTS } from '../config/apiEndpoints'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'

const PLAN_ORDER = ['free', 'premium', 'enterprise']

const formatCurrency = (amount, currency = 'usd') => {
  if (amount === null || typeof amount === 'undefined') {
    return 'Custom'
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  })

  return formatter.format(amount)
}

export const FALLBACK_PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: 'Map your AI readiness and get a clear starting point.',
    amount: 0,
    currency: 'usd',
    billing_interval: 'month',
    features: [
      'AI readiness assessment',
      'Starter training modules',
      'Basic progress tracking',
    ],
    cta: 'Start free assessment',
    is_free: true,
    checkout_enabled: true,
    configured: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For professionals who want guided training and certification.',
    amount: 49,
    currency: 'usd',
    billing_interval: 'month',
    features: [
      'Full training catalog',
      'Certification exam access',
      'Role-based recommendations',
      'Email support',
    ],
    cta: 'Start Premium',
    is_free: false,
    checkout_enabled: true,
    configured: true,
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For teams rolling out AI standards across a department.',
    amount: 99,
    currency: 'usd',
    billing_interval: 'month',
    features: [
      'Team learning paths',
      'Advanced reporting',
      'Dedicated customer success',
      'SSO and licensing support',
    ],
    cta: 'Start Enterprise',
    is_free: false,
    checkout_enabled: true,
    configured: true,
  },
]

const PLAN_DESIGN = {
  free: {
    badge: 'Explore',
    bestFor: 'Solo learners',
    proof: 'Assess first, then train from the right level.',
    accentClass: 'border-slate-200 bg-white',
    icon: Sparkles,
  },
  premium: {
    badge: 'Recommended',
    bestFor: 'Career growth',
    proof: 'Training, practice, and certification in one path.',
    accentClass: 'border-emerald-300 bg-white shadow-[0_30px_90px_rgba(16,185,129,0.18)] ring-1 ring-emerald-200/70',
    icon: BadgeCheck,
  },
  enterprise: {
    badge: 'Teams',
    bestFor: 'Departments',
    proof: 'A cleaner rollout path for managers and team leads.',
    accentClass: 'border-slate-900 bg-slate-950 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]',
    icon: Users,
  },
}

const COMPARISON_ROWS = [
  {
    label: 'Assessment',
    free: 'Readiness score',
    premium: 'Score plus recommendations',
    enterprise: 'Team readiness view',
  },
  {
    label: 'Training',
    free: 'Starter modules',
    premium: 'Full catalog',
    enterprise: 'Custom paths',
  },
  {
    label: 'Certification',
    free: 'Readiness preview',
    premium: 'Exam access',
    enterprise: 'Team certification support',
  },
  {
    label: 'Support',
    free: 'Self-guided',
    premium: 'Email support',
    enterprise: 'Dedicated success',
  },
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

const mergePlansWithFallback = (remotePlans = []) => {
  const remoteById = new Map(
    remotePlans
      .filter(plan => plan?.id)
      .map(plan => [plan.id, plan])
  )

  const mergedPlans = PLAN_ORDER.map((planId) => {
    const fallback = FALLBACK_PLANS.find(plan => plan.id === planId)
    const remote = remoteById.get(planId)
    if (!fallback && !remote) {
      return null
    }

    return {
      ...fallback,
      ...remote,
      features: Array.isArray(remote?.features) && remote.features.length > 0
        ? remote.features
        : fallback?.features || [],
      cta: fallback?.cta || remote?.cta || 'Select plan',
      recommended: fallback?.recommended || remote?.recommended || false,
    }
  }).filter(Boolean)

  remotePlans.forEach((plan) => {
    if (plan?.id && !PLAN_ORDER.includes(plan.id)) {
      mergedPlans.push(plan)
    }
  })

  return mergedPlans
}

const getPlanPriceLabel = (plan) => {
  if (plan.id === 'enterprise' && plan.amount !== null && typeof plan.amount !== 'undefined') {
    return `From ${formatCurrency(plan.amount, plan.currency)}`
  }

  return formatCurrency(plan.amount, plan.currency)
}

const getPlanIntervalLabel = (plan) => {
  if (plan.is_free || plan.amount === null || typeof plan.amount === 'undefined') {
    return ''
  }

  return `/ ${plan.billing_interval || 'month'}`
}

const buildBillingReturnState = (planId) => ({
  pathname: '/billing',
  search: planId ? `?plan=${encodeURIComponent(planId)}` : '',
})

const BillingPage = () => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [plans, setPlans] = useState(FALLBACK_PLANS)
  const [checkoutPlan, setCheckoutPlan] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [subscription, setSubscription] = useState(null)
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [mockMode, setMockMode] = useState(false)
  const [retryingPlans, setRetryingPlans] = useState(false)
  const [finalizingCheckout, setFinalizingCheckout] = useState(false)

  const selectedPlanId = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('plan') || ''
  }, [location.search])

  const queryMessages = useMemo(() => ({
    success: 'Your subscription is active.',
    canceled: 'Checkout was canceled. You have not been charged.',
  }), [])

  const fetchPlans = useCallback(async () => {
    try {
      const response = await axios.get(BILLING_ENDPOINTS.config)
      const payload = response?.data

      if (isHtmlPayload(payload) || !payload || typeof payload !== 'object') {
        throw buildSyntheticHttpError(response, 'Invalid billing payload')
      }

      const remotePlans = Array.isArray(payload.plans) ? payload.plans : []
      setPlans(mergePlansWithFallback(remotePlans))
      setMockMode(Boolean(payload.mock_mode))
    } catch {
      setPlans(FALLBACK_PLANS)
      setMockMode(false)
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
          session_id: sessionId,
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
    fetchPlans()
  }, [fetchPlans])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const handleRetryPlans = async () => {
    setRetryingPlans(true)
    setError('')
    await fetchPlans()
    setRetryingPlans(false)
  }

  const redirectToAuth = (planId) => {
    navigate('/register', {
      state: {
        from: buildBillingReturnState(planId),
      },
    })
  }

  const handleCheckout = async (planId) => {
    if (!isAuthenticated) {
      setError('')
      redirectToAuth(planId)
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
      setError(getBillingActionError(err, 'We could not start checkout.'))
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
        <Link
          to="/assessment"
          className="mt-7 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          {plan.cta || 'Start free assessment'}
        </Link>
      )
    }

    if (!plan.checkout_enabled) {
      return (
        <Link
          to="/enterprise"
          className={`mt-7 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            plan.id === 'enterprise'
              ? 'bg-white text-slate-950 hover:bg-slate-100 focus-visible:ring-white'
              : 'bg-slate-950 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:ring-slate-950'
          }`}
        >
          <span className="flex items-center gap-2">
            Contact sales
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      )
    }

    const redirectingLabel = mockMode ? 'Opening sandbox...' : 'Redirecting...'
    const disabled = checkoutPlan === plan.id
    const buttonLabel = mockMode ? `Simulate ${plan.name}` : plan.cta || `Start ${plan.name}`

    return (
      <button
        type="button"
        onClick={() => handleCheckout(plan.id)}
        className={`mt-7 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          plan.id === 'enterprise'
            ? 'bg-white text-slate-950 hover:bg-slate-100 focus-visible:ring-white'
            : 'bg-slate-950 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:ring-slate-950'
        } ${disabled ? 'cursor-not-allowed opacity-60 hover:translate-y-0' : ''}`}
        disabled={disabled}
      >
        {checkoutPlan === plan.id ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {redirectingLabel}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            {buttonLabel}
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </button>
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8fb] text-slate-950">
      <section className="relative border-b border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f7fafc_100%)] px-4 py-14 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.14),transparent_32%),radial-gradient(circle_at_76%_18%,rgba(249,115,22,0.12),transparent_28%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Pricing
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Pick the plan that matches your AI rollout.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Start with the free assessment, then upgrade when you need the training catalog,
              certification access, or a team rollout plan.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold text-slate-700">
              {['Prices are visible before sign-in', 'Monthly plans', 'Cancel anytime'].map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-[0_26px_80px_rgba(15,23,42,0.10)] backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              What changes when you upgrade
            </p>
            <div className="mt-5 grid gap-3">
              {[
                ['Train', 'Move from a score to a guided learning path.'],
                ['Practice', 'Use lessons and scenarios tied to your role.'],
                ['Certify', 'Prove readiness when your skills are ready.'],
              ].map(([label, copy]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-950">{label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {(subscription?.has_subscription || finalizingCheckout || notice || error) && (
            <div className="mb-8 grid gap-3">
              {subscription?.has_subscription && (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                      <div>
                        <p className="text-sm font-semibold">
                          Active subscription: {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                        </p>
                        <p className="mt-1 text-xs text-emerald-800">
                          Status: {subscription.status} | {formatCurrency(subscription.amount)}/{subscription.interval}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleManageSubscription}
                      disabled={loadingPortal}
                      className="inline-flex min-h-[42px] items-center justify-center rounded-2xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 disabled:opacity-60"
                    >
                      {loadingPortal ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        'Manage subscription'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {finalizingCheckout && (
                <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
                  <span className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Finalizing your subscription.
                  </span>
                </div>
              )}

              {notice && (
                <div className="rounded-3xl border border-emerald-200 bg-white px-5 py-4 text-sm text-emerald-800 shadow-sm">
                  <span className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4" />
                    {notice}
                  </span>
                </div>
              )}

              {error && (
                <div className="flex flex-col gap-3 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex items-center gap-3">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </span>
                  <button
                    type="button"
                    onClick={handleRetryPlans}
                    disabled={retryingPlans}
                    className="w-fit rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-800 transition hover:bg-rose-100 disabled:opacity-60"
                  >
                    {retryingPlans ? 'Checking...' : 'Check plans'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => {
              const design = PLAN_DESIGN[plan.id] || PLAN_DESIGN.free
              const PlanIcon = design.icon
              const isEnterprise = plan.id === 'enterprise'
              const isSelected = selectedPlanId === plan.id

              return (
                <article
                  key={plan.id}
                  className={`relative flex min-h-[560px] flex-col rounded-[2rem] border p-6 transition duration-200 hover:-translate-y-1 ${design.accentClass} ${
                    isSelected ? 'outline outline-2 outline-offset-4 outline-emerald-400' : ''
                  }`}
                >
                  {plan.recommended && (
                    <div className="absolute right-5 top-5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white">
                      Recommended
                    </div>
                  )}

                  <div className={`grid h-12 w-12 place-items-center rounded-2xl ${isEnterprise ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-950'}`}>
                    <PlanIcon className="h-5 w-5" />
                  </div>
                  <div className="mt-6">
                    <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${isEnterprise ? 'text-slate-300' : 'text-slate-500'}`}>
                      {design.badge}
                    </p>
                    <h2 className={`mt-3 text-2xl font-black ${isEnterprise ? 'text-white' : 'text-slate-950'}`}>
                      {plan.name}
                    </h2>
                    <p className={`mt-3 min-h-[56px] text-sm leading-6 ${isEnterprise ? 'text-slate-300' : 'text-slate-600'}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="mt-7">
                    <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                      <span className={`text-4xl font-black tracking-tight ${isEnterprise ? 'text-white' : 'text-slate-950'}`}>
                        {getPlanPriceLabel(plan)}
                      </span>
                      {getPlanIntervalLabel(plan) && (
                        <span className={`pb-1 text-sm font-medium ${isEnterprise ? 'text-slate-300' : 'text-slate-500'}`}>
                          {getPlanIntervalLabel(plan)}
                        </span>
                      )}
                    </div>
                    <p className={`mt-3 rounded-2xl px-4 py-3 text-sm ${isEnterprise ? 'bg-white/10 text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
                      <span className="font-semibold">Best for:</span> {design.bestFor}
                    </p>
                  </div>

                  <ul className="mt-7 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className={`flex items-start gap-3 text-sm leading-6 ${isEnterprise ? 'text-slate-200' : 'text-slate-700'}`}>
                        <CheckCircle2 className={`mt-0.5 h-4 w-4 flex-none ${isEnterprise ? 'text-emerald-300' : 'text-emerald-600'}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <p className={`mt-7 min-h-[48px] text-sm leading-6 ${isEnterprise ? 'text-slate-300' : 'text-slate-500'}`}>
                    {design.proof}
                  </p>

                  {renderPlanButton(plan)}
                </article>
              )
            })}
          </div>

          <div className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_26px_80px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Quick comparison</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">See what each plan changes.</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-600">
                Free is enough to understand your gaps. Premium is the cleanest path to learning and certification.
                Enterprise adds team structure.
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              {COMPARISON_ROWS.map((row) => (
                <div key={row.label} className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[0.85fr_1fr_1fr_1fr] md:items-center">
                  <p className="text-sm font-bold text-slate-950">{row.label}</p>
                  <p className="text-sm text-slate-600">{row.free}</p>
                  <p className="text-sm font-semibold text-slate-800">{row.premium}</p>
                  <p className="text-sm text-slate-600">{row.enterprise}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 rounded-[2rem] border border-slate-200 bg-[#111827] p-5 text-white md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-300">Still deciding?</p>
              <p className="mt-2 text-lg font-bold">Take the free assessment first, then come back with a clearer answer.</p>
            </div>
            <Link
              to="/assessment"
              className="inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Start assessment
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default BillingPage
