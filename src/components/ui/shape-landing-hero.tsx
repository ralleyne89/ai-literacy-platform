import { motion, useMotionValue, useReducedMotion, useTransform, animate } from 'framer-motion'
import { Circle } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

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
    <section className="relative overflow-hidden bg-gradient-brand-radial text-white">
      <motion.div
        className="pointer-events-none absolute inset-0 blur-3xl"
        style={{ opacity: isMounted ? glowOpacity : 0 }}
      >
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-secondary-400/25" />
      </motion.div>

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
