import { motion, useMotionValue, useReducedMotion, useTransform, animate } from 'framer-motion'
import { Circle } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { gsap, useGSAP } from '@/utils/gsap'

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = 'from-white/[0.08]',
}: {
  className?: string
  delay?: number
  width?: number
  height?: number
  rotate?: number
  gradient?: string
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: -120, rotate: rotate - 15 }}
      animate={reduceMotion ? { opacity: 1, rotate } : { opacity: 1, y: 0, rotate }}
      transition={{
        duration: 2.2,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.1 },
      }}
      className={cn('absolute', className)}
    >
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, 14, 0] }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
        style={{ width, height }}
        className="relative"
      >
        <div
          className={cn(
            'absolute inset-0 rounded-full',
            'bg-gradient-to-r to-transparent',
            gradient,
            'border-2 border-white/[0.15] backdrop-blur-[2px]',
            'shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]',
            'after:absolute after:inset-0 after:rounded-full',
            'after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]'
          )}
        />
      </motion.div>
    </motion.div>
  )
}

function HeroGeometric({
  badge = 'Free AI Readiness Benchmark',
  title1 = 'Build AI literacy',
  title2 = 'you can prove at work',
  subtitle = 'Take a quick assessment, get a personalized learning path, and build practical AI skills through guided training and certification.',
  primaryAction,
  secondaryAction,
  preview,
}: {
  badge?: string
  title1?: ReactNode
  title2?: ReactNode
  subtitle?: ReactNode
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  preview?: ReactNode
}) {
  const [isMounted, setIsMounted] = useState(false)
  const heroRef = useRef<HTMLElement | null>(null)
  const reduceMotion = useReducedMotion()
  const ambient = useMotionValue(0)
  const glowOpacity = useTransform(ambient, [0, 1], [0.08, 0.28])

  useEffect(() => {
    setIsMounted(true)
    if (reduceMotion) {
      ambient.set(0.55)
      return undefined
    }

    const controls = animate(ambient, 1, {
      duration: 10,
      repeat: Number.POSITIVE_INFINITY,
      repeatType: 'reverse',
      ease: 'easeInOut',
    })

    return () => controls.stop()
  }, [ambient, reduceMotion])

  useGSAP(
    () => {
      const root = heroRef.current
      if (!root) return undefined

      const reduceGsapMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const field = root.querySelector('[data-hero-field]')
      const parallaxLayer = root.querySelector('[data-hero-parallax]')
      const grid = root.querySelector('[data-hero-grid]')
      const scan = root.querySelector('[data-hero-scan]')
      const signalPath = root.querySelector('[data-hero-signal-path]')
      const nodes = gsap.utils.toArray('[data-hero-node]', root)

      if (!field || !parallaxLayer || !grid || !scan || !signalPath || nodes.length === 0) {
        return undefined
      }

      if (reduceGsapMotion) {
        gsap.set(field, { yPercent: 0 })
        gsap.set(parallaxLayer, { x: 0, y: 0 })
        gsap.set(grid, { autoAlpha: 0.2 })
        gsap.set(scan, { autoAlpha: 0.28, xPercent: 0 })
        gsap.set(signalPath, { autoAlpha: 0.38, strokeDashoffset: 0 })
        gsap.set(nodes, { autoAlpha: 0.62, scale: 1 })
        return undefined
      }

      gsap.set(signalPath, { strokeDasharray: '18 24', strokeDashoffset: 0 })
      gsap.set(nodes, { transformOrigin: 'center center' })

      const ambientTweens = [
        gsap.to(grid, {
          x: 34,
          y: -28,
          duration: 24,
          ease: 'none',
          repeat: -1,
          yoyo: true,
        }),
        gsap.to(scan, {
          xPercent: 120,
          autoAlpha: 0.42,
          duration: 7,
          ease: 'power1.inOut',
          repeat: -1,
          yoyo: true,
        }),
        gsap.to(signalPath, {
          strokeDashoffset: -260,
          duration: 9,
          ease: 'none',
          repeat: -1,
        }),
        gsap.to(nodes, {
          autoAlpha: 0.95,
          scale: 1.35,
          duration: 2,
          ease: 'sine.inOut',
          stagger: { each: 0.45, repeat: -1, yoyo: true },
        }),
        gsap.to(field, {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        }),
      ]

      const xTo = gsap.quickTo(parallaxLayer, 'x', { duration: 0.7, ease: 'power3.out' })
      const yTo = gsap.quickTo(parallaxLayer, 'y', { duration: 0.7, ease: 'power3.out' })

      const handlePointerMove = (event: PointerEvent) => {
        const bounds = root.getBoundingClientRect()
        const x = (event.clientX - bounds.left) / bounds.width - 0.5
        const y = (event.clientY - bounds.top) / bounds.height - 0.5
        xTo(x * 18)
        yTo(y * 14)
      }

      const handlePointerLeave = () => {
        xTo(0)
        yTo(0)
      }

      root.addEventListener('pointermove', handlePointerMove)
      root.addEventListener('pointerleave', handlePointerLeave)

      return () => {
        root.removeEventListener('pointermove', handlePointerMove)
        root.removeEventListener('pointerleave', handlePointerLeave)
        ambientTweens.forEach((tween) => tween.kill())
        gsap.set(parallaxLayer, { clearProps: 'transform' })
      }
    },
    { scope: heroRef }
  )

  const fadeUpMotion = {
    hidden: { opacity: 0, y: 28 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.75,
        delay: reduceMotion ? 0 : 0.18 + i * 0.12,
        ease: 'easeOut' as const,
      },
    }),
  }

  return (
    <section ref={heroRef} className="relative overflow-hidden bg-gradient-brand-radial text-white">
      <motion.div
        className="pointer-events-none absolute inset-0 blur-3xl"
        style={{ opacity: isMounted ? glowOpacity : 0 }}
      >
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-secondary-400/25" />
      </motion.div>

      <div
        data-hero-field
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-90"
        aria-hidden="true"
      >
        <div data-hero-parallax className="absolute inset-[-10%]">
          <div
            data-hero-grid
            className="absolute inset-0 bg-[linear-gradient(rgba(143,167,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(143,167,255,0.14)_1px,transparent_1px)] bg-[size:78px_78px] opacity-[0.18] [mask-image:radial-gradient(circle_at_34%_38%,black,transparent_68%)]"
          />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 760" preserveAspectRatio="none">
            <defs>
              <radialGradient id="hero-node-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#9EFFF7" stopOpacity="0.88" />
                <stop offset="42%" stopColor="#4A8CFF" stopOpacity="0.34" />
                <stop offset="100%" stopColor="#4A8CFF" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="hero-signal-stroke" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0" />
                <stop offset="42%" stopColor="#8EEBFF" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#B7FFE9" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="hero-scan-fill" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#8EEBFF" stopOpacity="0" />
                <stop offset="50%" stopColor="#8EEBFF" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              data-hero-signal-path
              d="M-80 470 C 190 360, 350 570, 575 370 S 960 180, 1130 315 S 1300 565, 1510 450"
              fill="none"
              stroke="url(#hero-signal-stroke)"
              strokeLinecap="round"
              strokeWidth="2.5"
              opacity="0.56"
            />
            <path
              data-hero-scan
              d="M160 120 L740 265 L660 620 L70 470 Z"
              fill="url(#hero-scan-fill)"
              opacity="0.22"
            />
            <g>
              <circle data-hero-node cx="220" cy="228" r="6" fill="#9EFFF7" opacity="0.52" />
              <circle cx="220" cy="228" r="34" fill="url(#hero-node-glow)" opacity="0.36" />
              <circle data-hero-node cx="730" cy="324" r="5" fill="#AFA4FF" opacity="0.44" />
              <circle cx="730" cy="324" r="30" fill="url(#hero-node-glow)" opacity="0.22" />
              <circle data-hero-node cx="1115" cy="250" r="7" fill="#8EEBFF" opacity="0.5" />
              <circle cx="1115" cy="250" r="42" fill="url(#hero-node-glow)" opacity="0.28" />
              <circle data-hero-node cx="1010" cy="560" r="4.5" fill="#B7FFE9" opacity="0.48" />
              <circle cx="1010" cy="560" r="28" fill="url(#hero-node-glow)" opacity="0.24" />
            </g>
          </svg>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.2}
          width={620}
          height={130}
          rotate={12}
          gradient="from-primary-500/[0.18]"
          className="left-[-18%] top-[18%] md:left-[-6%] md:top-[20%]"
        />
        <ElegantShape
          delay={0.35}
          width={470}
          height={112}
          rotate={-15}
          gradient="from-secondary-500/[0.16]"
          className="right-[-18%] top-[68%] md:right-[-3%] md:top-[66%]"
        />
        <ElegantShape
          delay={0.5}
          width={220}
          height={58}
          rotate={20}
          gradient="from-accent-orange/[0.16]"
          className="right-[8%] top-[9%] md:right-[18%]"
        />
      </div>

      <div className="section-shell relative z-10 grid gap-10 py-16 sm:py-20 lg:min-h-[calc(100vh-112px)] lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-14">
        <div className="max-w-3xl">
          <motion.div
            custom={0}
            variants={fadeUpMotion}
            initial="hidden"
            animate="visible"
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm font-semibold text-white/75 shadow-brand-sm backdrop-blur"
          >
            <Circle className="h-2 w-2 fill-secondary-400 text-secondary-400" />
            <span>{badge}</span>
          </motion.div>

          <motion.div custom={1} variants={fadeUpMotion} initial="hidden" animate="visible">
            <h1 className="max-w-4xl text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl">
              <span className="bg-gradient-to-b from-white to-white/82 bg-clip-text text-transparent">{title1}</span>
              <br />
              <span className="bg-gradient-to-r from-primary-200 via-white to-secondary-200 bg-clip-text text-transparent">
                {title2}
              </span>
            </h1>
          </motion.div>

          <motion.div custom={2} variants={fadeUpMotion} initial="hidden" animate="visible">
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68 sm:text-xl">
              {subtitle}
            </p>
          </motion.div>

          {(primaryAction || secondaryAction) && (
            <motion.div
              custom={3}
              variants={fadeUpMotion}
              initial="hidden"
              animate="visible"
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              {primaryAction}
              {secondaryAction}
            </motion.div>
          )}
        </div>

        {preview && (
          <motion.div
            custom={4}
            variants={fadeUpMotion}
            initial="hidden"
            animate="visible"
            className="lg:justify-self-end"
          >
            {preview}
          </motion.div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-navy via-transparent to-brand-navy/70" />
    </section>
  )
}

export { HeroGeometric }
