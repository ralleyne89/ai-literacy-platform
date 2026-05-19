"use client"

import { TimelineContent } from '@/components/ui/timeline-animation'

type FeedbackCard = {
  quote: string
  source: string
  scope: string
  metric: string
  label: string
  accent: string
  secondary: string
  variant: 'bars' | 'path' | 'nodes' | 'rings' | 'stack' | 'pulse'
  featured?: boolean
}

const feedbackCards: FeedbackCard[] = [
  {
    quote: 'The assessment gave our team a shared language for AI readiness. Within two weeks, managers knew exactly which skills to build next.',
    source: 'Learning and development leader',
    scope: 'Mid-market operations team',
    metric: '2 wk',
    label: 'readiness baseline',
    accent: '#5B5CFF',
    secondary: '#11BCEB',
    variant: 'bars',
    featured: true
  },
  {
    quote: 'The training clicked because it was tied to real workflows. People left with prompts, review habits, and automation ideas they could use the same day.',
    source: 'Revenue enablement lead',
    scope: 'Customer-facing team',
    metric: '38%',
    label: 'faster draft cycles',
    accent: '#0EA5E9',
    secondary: '#34D399',
    variant: 'path'
  },
  {
    quote: 'LitmusAI helped us move from curiosity to measurable adoption. The recommendations made next steps clear without overwhelming the team.',
    source: 'Transformation program owner',
    scope: 'Cross-functional pilot',
    metric: '4.7',
    label: 'learner confidence',
    accent: '#2563EB',
    secondary: '#A78BFA',
    variant: 'nodes'
  },
  {
    quote: 'The certification path is practical. It gave us a lightweight way to validate capability without turning AI training into a long academic program.',
    source: 'People operations director',
    scope: 'Policy and hiring teams',
    metric: '91%',
    label: 'completion intent',
    accent: '#7C3AED',
    secondary: '#F472B6',
    variant: 'rings'
  },
  {
    quote: 'The dashboard finally made progress visible. We could see assessment history, suggested modules, and training momentum in one place.',
    source: 'AI program coordinator',
    scope: 'Internal enablement cohort',
    metric: '1 view',
    label: 'team progress',
    accent: '#0891B2',
    secondary: '#6366F1',
    variant: 'stack'
  },
  {
    quote: 'The biggest shift was confidence. Teams stopped asking whether they should use AI and started asking how to use it responsibly.',
    source: 'Operations excellence manager',
    scope: 'Process improvement group',
    metric: '+52',
    label: 'readiness lift',
    accent: '#16A34A',
    secondary: '#22D3EE',
    variant: 'pulse',
    featured: true
  }
]

function GeneratedSignalImage({ card }: { card: FeedbackCard }) {
  const isDark = card.featured

  return (
    <div
      className={`relative h-28 overflow-hidden rounded-lg border ${
        isDark ? 'border-white/15 bg-white/10' : 'border-slate-200 bg-white/80'
      }`}
      aria-hidden="true"
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 240 112" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`${card.variant}-glow`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={card.accent} stopOpacity="0.95" />
            <stop offset="100%" stopColor={card.secondary} stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id={`${card.variant}-wash`} cx="70%" cy="12%" r="72%">
            <stop offset="0%" stopColor={card.secondary} stopOpacity={isDark ? '0.34' : '0.24'} />
            <stop offset="100%" stopColor={card.accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="240" height="112" fill={`url(#${card.variant}-wash)`} />
        <path
          d="M0 82 C42 60 61 96 101 70 C145 42 176 58 240 26"
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.10)'}
          strokeWidth="18"
          strokeLinecap="round"
        />

        {card.variant === 'bars' && (
          <>
            {[44, 66, 38, 78, 56].map((height, index) => (
              <rect
                key={height}
                x={28 + index * 28}
                y={92 - height}
                width="14"
                height={height}
                rx="7"
                fill={`url(#${card.variant}-glow)`}
                opacity={0.45 + index * 0.1}
              />
            ))}
          </>
        )}

        {card.variant === 'path' && (
          <>
            <path
              d="M25 78 C54 48 72 68 95 42 C120 14 148 42 172 28 C195 14 211 22 224 10"
              fill="none"
              stroke={`url(#${card.variant}-glow)`}
              strokeWidth="7"
              strokeLinecap="round"
            />
            {[25, 95, 172, 224].map((x, index) => (
              <circle key={x} cx={x} cy={[78, 42, 28, 10][index]} r="6" fill="white" opacity="0.92" />
            ))}
          </>
        )}

        {card.variant === 'nodes' && (
          <>
            {[42, 92, 146, 198].map((x, index) => (
              <circle
                key={x}
                cx={x}
                cy={[36, 76, 32, 68][index]}
                r={index === 2 ? 18 : 14}
                fill={`url(#${card.variant}-glow)`}
                opacity={index === 2 ? '0.95' : '0.62'}
              />
            ))}
            <path d="M42 36 L92 76 L146 32 L198 68" stroke="white" strokeOpacity="0.45" strokeWidth="3" fill="none" />
          </>
        )}

        {card.variant === 'rings' && (
          <>
            {[24, 40, 56].map((radius, index) => (
              <circle
                key={radius}
                cx="142"
                cy="56"
                r={radius}
                fill="none"
                stroke={`url(#${card.variant}-glow)`}
                strokeWidth="8"
                opacity={0.78 - index * 0.18}
              />
            ))}
            <circle cx="142" cy="56" r="12" fill="white" />
          </>
        )}

        {card.variant === 'stack' && (
          <>
            {[0, 1, 2].map((index) => (
              <rect
                key={index}
                x={42 + index * 18}
                y={26 + index * 14}
                width="116"
                height="36"
                rx="12"
                fill={`url(#${card.variant}-glow)`}
                opacity={0.9 - index * 0.18}
              />
            ))}
          </>
        )}

        {card.variant === 'pulse' && (
          <>
            <path
              d="M20 62 H55 L70 38 L92 88 L118 20 L138 62 H220"
              fill="none"
              stroke={`url(#${card.variant}-glow)`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="118" cy="20" r="7" fill="white" />
          </>
        )}
      </svg>

      <div className="absolute bottom-3 left-3">
        <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>{card.metric}</div>
        <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
          {card.label}
        </div>
      </div>
    </div>
  )
}

function ClientFeedback() {
  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        delay: i * 0.12,
        duration: 0.5
      }
    }),
    hidden: {
      filter: 'blur(10px)',
      y: 18,
      opacity: 0
    }
  }

  return (
    <main className="w-full bg-white">
      <section className="relative mx-auto max-w-7xl px-4 py-16 text-slate-950 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-3xl space-y-3 text-center">
          <TimelineContent
            as="h1"
            className="text-3xl font-bold tracking-tight text-slate-950 xl:text-4xl"
            animationNum={0}
            customVariants={revealVariants}
          >
            Proof from real AI enablement work
          </TimelineContent>
          <TimelineContent
            as="p"
            className="mx-auto text-base text-slate-600"
            animationNum={1}
            customVariants={revealVariants}
          >
            Anonymous feedback from teams using LitmusAI to benchmark readiness, build practical skills, and certify progress.
          </TimelineContent>
        </article>

        <div className="grid gap-4 pt-10 md:grid-cols-2 lg:grid-cols-3">
          {feedbackCards.map((card, index) => (
            <TimelineContent
              key={card.source}
              animationNum={index + 2}
              customVariants={revealVariants}
              className={`flex min-h-[310px] flex-col justify-between rounded-lg border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${
                card.featured
                  ? 'border-slate-800 bg-slate-950 text-white shadow-slate-950/10'
                  : 'border-slate-200 bg-white text-slate-950'
              }`}
            >
              <article className="flex h-full flex-col justify-between gap-5">
                <GeneratedSignalImage card={card} />
                <p className={`text-base leading-relaxed ${card.featured ? 'text-white/90' : 'text-slate-700'}`}>
                  "{card.quote}"
                </p>
                <div>
                  <h2 className={`text-sm font-semibold ${card.featured ? 'text-white' : 'text-slate-950'}`}>
                    {card.source}
                  </h2>
                  <p className={`text-sm ${card.featured ? 'text-white/60' : 'text-slate-500'}`}>{card.scope}</p>
                </div>
              </article>
            </TimelineContent>
          ))}
        </div>
      </section>
    </main>
  )
}

export default ClientFeedback
