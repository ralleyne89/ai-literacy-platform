import React, { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Brain,
  Building2,
  CheckCircle,
  Clock,
  GraduationCap,
  HelpCircle,
  Layers3,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { HeroGeometric } from '@/components/ui/shape-landing-hero'
import ClientFeedback from '@/components/ui/testimonial'
import BrandMark from '@/components/BrandMark'
import { gsap, useGSAP } from '@/utils/gsap'

const reveal = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: 'easeOut' },
  },
}

const AnimatedSection = ({ children, className = '', delay = 0, ...props }) => {
  const reduceMotion = useReducedMotion()

  return (
    <motion.section
      className={className}
      initial={reduceMotion ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.62, ease: 'easeOut', delay: reduceMotion ? 0 : delay },
        },
      }}
      {...props}
    >
      {children}
    </motion.section>
  )
}

const MetricPill = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-brand-sm">
    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
      <Icon className="h-4 w-4" />
    </div>
    <div className="text-2xl font-bold text-slate-950">{value}</div>
    <div className="mt-1 text-sm text-slate-500">{label}</div>
  </div>
)

const completeJourneyFeatures = [
  {
    icon: Target,
    title: 'Assess AI readiness',
    description: 'Benchmark core concepts, responsible use, prompting, and practical workplace judgment.',
    color: 'text-primary-600',
    glow: 'from-primary-500/16',
  },
  {
    icon: GraduationCap,
    title: 'Build with guided practice',
    description: 'Role-specific modules turn AI concepts into real workflows, prompts, and review habits.',
    color: 'text-secondary-600',
    glow: 'from-secondary-500/16',
  },
  {
    icon: Award,
    title: 'Certify proficiency',
    description: 'Validate practical skill with credentials designed to signal workplace-ready AI literacy.',
    color: 'text-accent-orange',
    glow: 'from-accent-orange/16',
  },
]

const ProductPreview = () => {
  const previewRef = useRef(null)

  useGSAP(
    () => {
      const root = previewRef.current
      const card = root?.querySelector('[data-product-preview-card]')

      if (!root || !card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return undefined
      }

      gsap.set(card, {
        transformPerspective: 900,
        transformOrigin: 'center',
        willChange: 'transform',
      })

      const rotateXTo = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' })
      const rotateYTo = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' })
      const yTo = gsap.quickTo(card, 'y', { duration: 0.45, ease: 'power3.out' })

      const handlePointerMove = (event) => {
        const rect = card.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width - 0.5
        const y = (event.clientY - rect.top) / rect.height - 0.5

        rotateXTo(y * -6)
        rotateYTo(x * 7)
        yTo(-4)
      }

      const resetCard = () => {
        rotateXTo(0)
        rotateYTo(0)
        yTo(0)
      }

      root.addEventListener('pointermove', handlePointerMove)
      root.addEventListener('pointerleave', resetCard)

      return () => {
        root.removeEventListener('pointermove', handlePointerMove)
        root.removeEventListener('pointerleave', resetCard)
        gsap.set(card, { clearProps: 'transform,willChange' })
      }
    },
    { scope: previewRef }
  )

  return (
    <div ref={previewRef} className="glass-panel relative mx-auto max-w-xl overflow-hidden p-4 text-white [perspective:900px] lg:mx-0">
      <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-white/5 to-secondary-500/10" />
      <div data-product-preview-card className="relative rounded-[1.5rem] border border-white/10 bg-brand-navy/72 p-5 shadow-brand-lg">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">AI readiness dashboard</div>
            <div className="text-xs text-white/50">Personal plan after assessment</div>
          </div>
          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
            Live path
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Readiness score</div>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-6xl font-bold tracking-tight text-white">74</span>
              <span className="pb-2 text-sm font-semibold text-emerald-200">+18 pts</span>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-primary"
                initial={{ width: '0%' }}
                whileInView={{ width: '74%' }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Recommended module', value: 'Prompt Engineering Mastery', icon: BookOpen },
              { label: 'Next skill gap', value: 'Evaluate AI output quality', icon: Target },
              { label: 'Credential track', value: 'Workplace AI Proficiency', icon: Award },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-secondary-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-xs text-white/45">{item.label}</div>
                    <div className="text-sm font-semibold text-white">{item.value}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const LiteracyPlanSection = () => {
  const reduceMotion = useReducedMotion()
  const planItems = [
    {
      icon: Brain,
      title: 'Skill profile',
      copy: 'See where you are confident, where you are guessing, and which AI concepts matter most for your role.',
      meta: '15 questions',
    },
    {
      icon: Layers3,
      title: 'Learning path',
      copy: 'Get a prioritized training plan that turns assessment gaps into practical workplace exercises.',
      meta: 'Role-aware',
    },
    {
      icon: BadgeCheck,
      title: 'Proof of progress',
      copy: 'Move from practice into certification so your AI literacy becomes visible and credible.',
      meta: 'Credential-ready',
    },
  ]

  return (
    <AnimatedSection id="ai-readiness" className="bg-white py-20">
      <div className="section-shell">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="eyebrow">
              <Sparkles className="h-3.5 w-3.5" />
              AI literacy plan
            </div>
            <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
              Your AI literacy plan, mapped in minutes
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              LitmusAI turns a quick benchmark into a guided route: what to learn, what to practice, and how to prove it with certification.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <MetricPill icon={Clock} label="Assessment time" value="3-5m" />
              <MetricPill icon={TrendingUp} label="Skill lift tracked" value="+52" />
              <MetricPill icon={ShieldCheck} label="Proof path" value="Cert" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-7 top-8 hidden h-[calc(100%-4rem)] w-px bg-slate-200 md:block" />
            <motion.div
              className="absolute left-7 top-8 hidden w-px origin-top bg-gradient-to-b from-primary-500 to-secondary-500 md:block"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: reduceMotion ? 0 : 1.2, ease: 'easeOut' }}
              style={{ height: 'calc(100% - 4rem)' }}
            />
            <div className="space-y-4">
              {planItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.article
                    key={item.title}
                    variants={reveal}
                    initial={reduceMotion ? false : 'hidden'}
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative rounded-brand border border-slate-200 bg-gradient-soft-panel p-5 shadow-brand-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-brand-md md:pl-20"
                  >
                    <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white text-primary-600 shadow-brand-sm md:absolute md:left-1 md:top-6">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-950">{item.title}</h3>
                        <p className="mt-2 text-slate-600">{item.copy}</p>
                      </div>
                      <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary-700 shadow-brand-sm">
                        {item.meta}
                      </span>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  )
}

const JourneySection = () => {
  const reduceMotion = useReducedMotion()
  const journeyRef = useRef(null)
  const steps = [
    {
      icon: Target,
      title: 'Benchmark your skills',
      copy: 'Start with a fast, practical assessment across AI concepts, responsible use, prompting, and workplace application.',
      action: 'Start free assessment',
      href: '/assessment',
    },
    {
      icon: PlayCircle,
      title: 'Practice workplace workflows',
      copy: 'Build prompts, review habits, and AI-assisted workflows that connect directly to Sales, HR, Marketing, Operations, and leadership work.',
      action: 'Explore live courses',
      href: '/training',
    },
    {
      icon: Award,
      title: 'Earn proof of proficiency',
      copy: 'Validate real-world AI literacy with certification designed to signal capability, not just course completion.',
      action: 'View certification',
      href: '/certification',
    },
  ]

  useGSAP(
    () => {
      const root = journeyRef.current
      const line = root?.querySelector('[data-journey-line]')

      if (!root || !line) return undefined

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(line, { scaleX: 1 })
        return undefined
      }

      gsap.set(line, { scaleX: 0, transformOrigin: 'left center' })

      const progressTween = gsap.to(line, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top 68%',
          end: 'bottom 55%',
          scrub: true,
        },
      })

      return () => {
        progressTween.scrollTrigger?.kill()
        progressTween.kill()
      }
    },
    { scope: journeyRef }
  )

  return (
    <AnimatedSection className="relative overflow-hidden bg-brand-navy py-24 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(107,78,255,0.22),transparent_32%),radial-gradient(circle_at_80%_25%,rgba(0,210,255,0.16),transparent_30%)]" />
      <div ref={journeyRef} className="section-shell relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
            <Zap className="h-3.5 w-3.5 text-secondary-300" />
            How it works
          </div>
          <h2 className="mt-5 text-4xl font-bold tracking-tight text-white md:text-5xl">
            From unsure to AI-literate with a path you can follow
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/65">
            Assessment, training, and certification work together as one guided system instead of disconnected content.
          </p>
        </div>

        <div className="relative mt-14 grid gap-5 lg:grid-cols-3">
          <div
            data-journey-line
            className="absolute left-[16%] right-[16%] top-12 hidden h-px origin-left bg-gradient-to-r from-primary-400 via-secondary-400 to-emerald-300 lg:block"
          />
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.article
                key={step.title}
                initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.55, delay: reduceMotion ? 0 : index * 0.12 }}
                className="relative overflow-hidden rounded-brand-lg border border-white/10 bg-white/[0.06] p-6 shadow-brand-lg backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:bg-white/[0.08]"
              >
                <div className="relative z-10">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-primary-600 shadow-brand-sm">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-bold text-white/35">0{index + 1}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                  <p className="mt-4 min-h-[6rem] text-base leading-7 text-white/68">{step.copy}</p>
                  <Link to={step.href} className="mt-6 inline-flex items-center gap-2 font-semibold text-secondary-200 hover:text-white">
                    {step.action}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </AnimatedSection>
  )
}

const CompleteJourneySection = () => {
  const sectionRef = useRef(null)

  useGSAP(
    () => {
      const root = sectionRef.current
      const path = root?.querySelector('[data-complete-journey-path]')
      const orb = root?.querySelector('[data-complete-journey-orb]')
      const cards = gsap.utils.toArray('[data-complete-journey-card]', root)
      const glows = gsap.utils.toArray('[data-complete-journey-glow]', root)
      const shells = gsap.utils.toArray('[data-complete-journey-shell]', root)

      if (!root || !path || !orb || cards.length === 0) return undefined

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const compactLayout = window.matchMedia('(max-width: 767px)').matches

      if (reduceMotion || compactLayout) {
        gsap.set(path, { strokeDashoffset: 0 })
        gsap.set(orb, { autoAlpha: 0 })
        gsap.set(cards, { autoAlpha: 1, y: 0, scale: 1 })
        gsap.set(glows, { autoAlpha: 0.36 })
        return undefined
      }

      const pathLength = path.getTotalLength()
      gsap.set(path, { strokeDasharray: pathLength, strokeDashoffset: pathLength })
      gsap.set(orb, { autoAlpha: 1, xPercent: -50, yPercent: -50, transformOrigin: '50% 50%' })
      gsap.set(cards, { autoAlpha: 0.78, y: 24, scale: 0.985, transformOrigin: 'center top' })
      gsap.set(glows, { autoAlpha: 0 })

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top 72%',
          end: 'bottom 46%',
          scrub: true,
        },
      })

      timeline
        .to(path, { strokeDashoffset: 0, duration: 1, ease: 'none' }, 0)
        .to(
          orb,
          {
            duration: 1,
            ease: 'none',
            motionPath: {
              path,
              align: path,
              alignOrigin: [0.5, 0.5],
            },
          },
          0
        )

      cards.forEach((card, index) => {
        const activateAt = 0.08 + index * 0.31
        timeline
          .to(card, { autoAlpha: 1, y: 0, scale: 1, duration: 0.18, ease: 'power2.out' }, activateAt)
          .to(glows[index], { autoAlpha: 0.8, duration: 0.16, ease: 'power2.out' }, activateAt + 0.03)
      })

      const liftShell = (event) => {
        const shell = event.currentTarget.querySelector('[data-complete-journey-shell]')
        if (!shell) return
        gsap.to(shell, {
          y: -8,
          scale: 1.012,
          duration: 0.26,
          ease: 'power3.out',
          overwrite: 'auto',
        })
      }

      const resetShell = (event) => {
        const shell = event.currentTarget.querySelector('[data-complete-journey-shell]')
        if (!shell) return
        gsap.to(shell, {
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: 'power3.out',
          overwrite: 'auto',
        })
      }

      cards.forEach((card) => {
        card.addEventListener('pointerenter', liftShell)
        card.addEventListener('pointerleave', resetShell)
        card.addEventListener('focus', liftShell)
        card.addEventListener('blur', resetShell)
      })

      return () => {
        cards.forEach((card) => {
          card.removeEventListener('pointerenter', liftShell)
          card.removeEventListener('pointerleave', resetShell)
          card.removeEventListener('focus', liftShell)
          card.removeEventListener('blur', resetShell)
        })
        timeline.scrollTrigger?.kill()
        timeline.kill()
        gsap.set(shells, { clearProps: 'transform' })
      }
    },
    { scope: sectionRef }
  )

  return (
    <AnimatedSection className="relative overflow-hidden bg-white py-20" delay={0.05}>
      <div ref={sectionRef} className="section-shell relative">
        <div className="absolute left-1/2 top-10 h-64 w-[52rem] max-w-[88vw] -translate-x-1/2 rounded-full bg-gradient-to-r from-primary-100/70 via-secondary-100/60 to-emerald-100/60 blur-3xl" />

        <div className="relative mx-auto mb-14 max-w-3xl text-center">
          <div className="eyebrow">
            <BarChart3 className="h-3.5 w-3.5" />
            Complete system
          </div>
          <h2 className="mt-5 text-4xl font-bold text-slate-950 md:text-5xl">
            The complete LitmusAI journey
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            A connected path from curiosity to confidence, with measurable growth at every step.
          </p>
        </div>

        <div className="relative">
          <div className="relative mx-auto mb-7 hidden h-28 max-w-5xl md:block" aria-hidden="true">
            <div className="absolute inset-x-10 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 960 112"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="complete-journey-signal" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#6B4EFF" />
                  <stop offset="52%" stopColor="#00D2FF" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
                <filter id="complete-journey-glow" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="7" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d="M112 58 C 238 18, 350 18, 480 58 S 716 98, 848 58"
                fill="none"
                stroke="rgba(15,23,42,0.1)"
                strokeDasharray="10 14"
                strokeLinecap="round"
                strokeWidth="3"
              />
              <path
                data-complete-journey-path
                d="M112 58 C 238 18, 350 18, 480 58 S 716 98, 848 58"
                fill="none"
                stroke="url(#complete-journey-signal)"
                strokeLinecap="round"
                strokeWidth="4"
              />
              <g data-complete-journey-orb filter="url(#complete-journey-glow)">
                <rect x="100" y="46" width="24" height="24" rx="7" fill="#08111F" />
                <rect x="105" y="51" width="14" height="14" rx="4" fill="#8EEBFF" />
              </g>
            </svg>
            {['Assess', 'Practice', 'Certify'].map((label, index) => (
              <div
                key={label}
                className={`absolute top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border bg-white text-xs font-bold shadow-brand-sm ${
                  index === 0
                    ? 'left-[11.6%] border-primary-200 text-primary-600'
                    : index === 1
                      ? 'left-1/2 border-secondary-200 text-secondary-600'
                      : 'left-[88.4%] border-orange-200 text-accent-orange'
                }`}
              >
                0{index + 1}
              </div>
            ))}
          </div>

          <div className="relative z-10 grid gap-6 md:grid-cols-3">
            {completeJourneyFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <article
                  key={feature.title}
                  data-complete-journey-card
                  tabIndex={0}
                  className="group relative rounded-brand-lg outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-4"
                >
                  <div
                    data-complete-journey-shell
                    className="relative h-full overflow-hidden rounded-brand-lg border border-slate-200/80 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition-colors duration-200 group-hover:border-primary-200"
                  >
                    <div data-complete-journey-glow className={`absolute inset-x-4 top-0 h-24 rounded-full bg-gradient-to-b ${feature.glow} to-transparent blur-2xl`} />
                    <div className="absolute inset-0 rounded-brand-lg ring-1 ring-inset ring-white/70" />
                    <div className="relative z-10">
                      <div className="mb-8 flex items-start justify-between gap-4">
                        <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-slate-50 to-white shadow-brand-sm ring-1 ring-slate-200/70 ${feature.color}`}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-400">
                          0{index + 1}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-950">{feature.title}</h3>
                      <p className="mt-3 leading-7 text-slate-600">{feature.description}</p>
                      <div className="mt-6 flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-primary-500' : index === 1 ? 'bg-secondary-500' : 'bg-accent-orange'}`} />
                        <span className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </AnimatedSection>
  )
}

const Footer = () => {
  const year = new Date().getFullYear()
  const footerGroups = [
    {
      title: 'Platform',
      links: [
        { label: 'Assessment', to: '/assessment' },
        { label: 'Training', to: '/training' },
        { label: 'Certification', to: '/certification' },
        { label: 'Dashboard', to: '/dashboard' },
      ],
    },
    {
      title: 'Teams',
      links: [
        { label: 'Pricing', to: '/billing' },
      ],
    },
    {
      title: 'Learn',
      links: [
        { label: 'FAQ', href: '#faq' },
        { label: 'Featured course', href: '#featured-course' },
        { label: 'AI readiness', href: '#ai-readiness' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms', to: '/terms' },
        { label: 'Privacy', to: '/privacy' },
      ],
    },
  ]

  return (
    <footer className="bg-brand-ink text-white">
      <div className="section-shell py-16">
        <div className="rounded-brand-lg border border-white/10 bg-white/[0.04] p-6 shadow-brand-lg md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-secondary-200">
                <Sparkles className="h-3.5 w-3.5" />
                Start here
              </div>
              <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-white md:text-4xl">
                Find your AI literacy baseline and turn it into practical skill.
              </h2>
            </div>
            <Link to="/assessment" className="btn-primary inline-flex w-fit items-center gap-2">
              Start free assessment
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-2">
              <BrandMark decorative className="grid h-12 w-12 place-items-center" imgClassName="h-12 w-12 object-contain" />
              <span className="font-heading text-xl font-bold text-white">LitmusAI</span>
            </Link>
            <p className="mt-5 max-w-sm leading-7 text-white/60">
              AI literacy training, assessment, and certification for people and teams who need practical capability they can use at work.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/45">{group.title}</h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.to ? (
                        <Link to={link.to} className="text-sm font-medium text-white/70 transition-colors hover:text-white">
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} className="text-sm font-medium text-white/70 transition-colors hover:text-white">
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} LitmusAI. All rights reserved.</p>
          <p>Assess. Practice. Certify. Apply.</p>
        </div>
      </div>
    </footer>
  )
}

const HomePage = () => {
  return (
    <div className="min-h-screen bg-brand-mist">
      <HeroGeometric
        badge="Free AI Readiness Benchmark"
        title1="Build AI literacy"
        title2="you can prove at work"
        subtitle="Take a quick assessment, get a personalized learning path, and build practical AI skills through guided training and certification."
        primaryAction={(
          <Link to="/assessment" className="btn-primary inline-flex items-center justify-center gap-2">
            Start free assessment
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        secondaryAction={(
          <Link to="/training" className="btn-ghost inline-flex items-center justify-center gap-2">
            Explore training
            <BookOpen className="h-4 w-4" />
          </Link>
        )}
        preview={<ProductPreview />}
      />

      <LiteracyPlanSection />
      <JourneySection />
      <CompleteJourneySection />

      <AnimatedSection className="bg-brand-mist py-20" delay={0.1}>
        <div className="section-shell">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div>
              <div className="eyebrow">
                <Building2 className="h-3.5 w-3.5" />
                Teams and organizations
              </div>
              <h2 className="mt-5 text-4xl font-bold text-slate-950 md:text-5xl">Every company should be AI ready</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                LitmusAI helps teams benchmark readiness, activate role-specific skills, and prove progress with trusted credentials.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  'Role-specific learning paths for Sales, HR, Marketing, Operations, and leadership.',
                  'Hands-on courses where teams build real prompts, processes, and AI-assisted workflows.',
                  'Practical certification that validates responsible, workplace-ready AI usage.',
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-brand-sm">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    <p className="text-slate-700">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/assessment" className="btn-primary text-center">Start free AI assessment</Link>
                <Link to="/billing" className="btn-outline text-center">Explore team options</Link>
              </div>
            </div>

            <div className="soft-panel overflow-hidden p-5">
              <div className="rounded-2xl bg-brand-navy p-5 text-white">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Team readiness map</div>
                    <div className="text-xs text-white/50">Sample cohort overview</div>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-secondary-200">Updated today</span>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Prompt quality', value: '82%', color: 'bg-secondary-400' },
                    { label: 'Responsible use', value: '76%', color: 'bg-emerald-400' },
                    { label: 'Workflow application', value: '64%', color: 'bg-primary-400' },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-white/70">{row.label}</span>
                        <span className="font-semibold">{row.value}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className={`h-full rounded-full ${row.color}`} style={{ width: row.value }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <MetricPill icon={TrendingUp} label="Productivity lift" value="45%" />
                <MetricPill icon={ShieldCheck} label="Completion intent" value="91%" />
                <MetricPill icon={Brain} label="Confidence gain" value="+52" />
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="bg-brand-navy py-20 text-white" delay={0.1}>
        <div className="section-shell">
          <div className="mb-10 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-300" />
              What sets us apart
            </div>
            <h2 className="mt-5 text-4xl font-bold text-white md:text-5xl">Built for practical AI adoption</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/65">
              The platform is designed around measurable behavior change, not passive content consumption.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              { t: 'Embedded AI leadership with real execution, not just advice', s: 'Strategic AI enablement at a fraction of a full-time CAIO.' },
              { t: 'Tailored by department for real-world workflows', s: 'Custom pathways for the exact work your teams do every day.' },
              { t: 'Live, hands-on training where teams build real tools', s: 'Learners leave with reusable prompts, habits, and automations.' },
              { t: 'Fast implementation for visible momentum', s: 'Most teams can establish a baseline and start improving within weeks.' },
              { t: 'Practical certification tied to business use', s: 'Credentials validate applied skill, not memorized theory.' },
              { t: 'Focused exclusively on AI enablement', s: 'Assessment, training, and certification are designed as one system.' },
            ].map((item) => (
              <div key={item.t} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                  <CheckCircle className="h-4 w-4" />
                </span>
                <div>
                  <div className="font-semibold text-white">{item.t}</div>
                  <div className="mt-1 text-sm leading-6 text-white/58">{item.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="featured-course" className="bg-white py-20">
        <div className="section-shell">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 className="text-4xl font-bold text-slate-950 md:text-5xl">Certification that measures what matters</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Exams reflect real-world AI proficiency across thinking, knowledge, communication, and responsible use.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: Sparkles, title: 'AI Thinking & Cognitive Aptitude', copy: 'Reasoning, decomposition, pattern recognition, and using AI as a thinking partner.' },
                  { icon: BookOpen, title: 'AI Knowledge & Understanding', copy: 'Core concepts, capabilities, limitations, safety, and responsible use.' },
                  { icon: Target, title: 'Prompt Engineering & Communication', copy: 'Outcome-driven prompting, iteration, evaluation, and clear AI collaboration.' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-brand-sm">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-950">{item.title}</div>
                        <div className="mt-1 text-sm leading-6 text-slate-600">{item.copy}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="soft-panel p-6">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary-700">
                Featured live course
              </div>
              <h3 className="text-3xl font-bold text-slate-950">How to Build a Business in a Weekend with AI</h3>
              <p className="mt-4 leading-7 text-slate-600">
                An intensive, instructor-led workshop where learners rapidly plan, prototype, and launch a business using AI tools.
              </p>
              <ul className="mt-6 space-y-3 text-slate-700">
                {['Hands-on guided sessions', 'Reusable practical frameworks', 'Certificate of completion'].map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/training" className="btn-outline mt-7 inline-flex items-center gap-2">
                Explore course
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="faq" className="bg-brand-mist py-20" delay={0.1}>
        <div className="section-shell max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-slate-950 md:text-5xl">Frequently asked questions</h2>
            <p className="mt-4 text-lg text-slate-600">Quick answers about assessments, courses, and certifications.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {[
              ['What is the AI Mastery Predictor Test?', 'A free 15-question assessment that evaluates AI fundamentals, practical usage, responsible thinking, AI impact, and strategic understanding.'],
              ['Do I need technical experience?', 'No. LitmusAI is designed for professionals across industries and roles. No coding background is required.'],
              ['What does certification cover?', 'A standardized exam validating real-world AI application skills with a verified digital certificate.'],
              ['Are there team options?', 'Yes. Teams can use org-wide assessments, analytics, custom programs, and bulk certification management.'],
            ].map(([question, answer]) => (
              <div key={question} className="card">
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-1 h-5 w-5 text-primary-600" />
                  <div>
                    <h3 className="font-bold text-slate-950">{question}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <section className="bg-white">
        <ClientFeedback />
      </section>

      <Footer />
    </div>
  )
}

export default HomePage
