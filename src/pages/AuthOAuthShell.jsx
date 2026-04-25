import React from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Brain,
  CheckCircle2,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

const journeyItems = [
  {
    label: 'Assess',
    description: 'Keep readiness results tied to your profile.',
  },
  {
    label: 'Activate',
    description: 'Resume role-based training without friction.',
  },
  {
    label: 'Certify',
    description: 'Carry credentials forward as you progress.',
  },
]

const trustItems = [
  {
    icon: ShieldCheck,
    label: 'Hosted Google OAuth',
  },
  {
    icon: GraduationCap,
    label: 'Learning progress preserved',
  },
  {
    icon: CheckCircle2,
    label: 'Dashboard return handled',
  },
]

const GoogleMark = () => (
  <span
    aria-hidden="true"
    className="grid h-7 w-7 place-items-center rounded-full bg-white text-sm font-bold text-blue-600 shadow-sm"
  >
    G
  </span>
)

const AuthOAuthShell = ({
  mode,
  eyebrow,
  title,
  description,
  actionLabel,
  loadingLabel,
  alternatePrompt,
  alternateLabel,
  alternateTo,
  alternateState,
  returnCopy,
  error,
  loading,
  onSubmit,
}) => {
  const formLabel = mode === 'register' ? 'Create account with Google' : 'Sign in with Google'

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden bg-white">
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-primary-50 via-white to-secondary-50" />
      <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-7xl flex-col px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-12 lg:px-8 lg:py-12">
        <section className="order-2 mt-10 lg:order-1 lg:mt-0">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-primary shadow-sm ring-1 ring-white/70">
              <Brain className="h-5 w-5 text-white" />
            </span>
            <span>
              <span className="block font-heading text-xl font-semibold tracking-tight text-slate-950">LitmusAI</span>
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Assess · Activate · Certify
              </span>
            </span>
          </Link>

          <div className="mt-10 flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary-600" />
            Google OAuth access
          </div>

          <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Secure access for measurable AI mastery.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            One Google sign-in connects assessment results, training progress, and credentials so every learner can pick up exactly where they left off.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {journeyItems.map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm">
                <div className="text-sm font-semibold text-slate-950">{item.label}</div>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {trustItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <item.icon className="h-4 w-4 text-emerald-600" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <main className="order-1 lg:order-2">
          <div className="mx-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-white">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                {eyebrow}
              </span>
            </div>

            <div className="mt-7">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            </div>

            <form className="mt-7 space-y-5" onSubmit={onSubmit} aria-label={formLabel}>
              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="group inline-flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-slate-950/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span
                    aria-hidden="true"
                    className="h-5 w-5 rounded-full border-2 border-white/35 border-t-white motion-safe:animate-spin"
                  />
                ) : (
                  <GoogleMark />
                )}
                <span>{loading ? loadingLabel : actionLabel}</span>
                {!loading && <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />}
              </button>
            </form>

            <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-slate-600">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
              <span>{returnCopy}</span>
            </p>

            <div className="mt-7 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
              {alternatePrompt}{' '}
              <Link
                to={alternateTo}
                state={alternateState}
                className="font-semibold text-primary-700 transition-colors hover:text-primary-600"
              >
                {alternateLabel}
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AuthOAuthShell
