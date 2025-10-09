"use client"

import { type ElementType, type HTMLAttributes, useRef } from 'react'
import { motion, type Variants, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TimelineContentProps extends HTMLAttributes<HTMLDivElement> {
  as?: ElementType
  animationNum?: number
  customVariants?: Variants
  wrapperClassName?: string
}

const defaultVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: 'blur(10px)'
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      delay: i * 0.2,
      ease: [0.25, 0.4, 0.25, 1]
    }
  })
}

const TimelineContent = ({
  as: Component = 'div',
  animationNum = 0,
  customVariants,
  className,
  wrapperClassName,
  children,
  ...rest
}: TimelineContentProps) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' })
  const variants = customVariants ?? defaultVariants

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      custom={animationNum}
      variants={variants}
      className={cn(wrapperClassName)}
    >
      <Component className={className} {...rest}>
        {children}
      </Component>
    </motion.div>
  )
}

export { TimelineContent }
