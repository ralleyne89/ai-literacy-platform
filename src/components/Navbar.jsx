import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Award,
  BookOpen,
  Brain,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogIn,
  LogOut,
  Sparkles,
  Target,
  User,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { gsap, useGSAP } from '../utils/gsap'

const productNavigation = [
  { name: 'Assessment', href: '/assessment', icon: Target },
  { name: 'Training', href: '/training', icon: BookOpen },
  { name: 'Certification', href: '/certification', icon: Award },
  { name: 'Pricing', href: '/billing', icon: CreditCard },
]

const normalizeNavPath = (path) => {
  if (typeof path !== 'string' || path.length === 0) return '/'
  const normalizedPath = path.split(/[?#]/, 1)[0] || '/'
  return normalizedPath.length > 1 ? normalizedPath.replace(/\/+$/, '') : normalizedPath
}

export const isNavPathActive = (currentPathname, targetPath) => {
  const currentPath = normalizeNavPath(currentPathname)
  const normalizedTarget = normalizeNavPath(targetPath)

  return (
    currentPath === normalizedTarget ||
    (normalizedTarget !== '/' && currentPath.startsWith(`${normalizedTarget}/`))
  )
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navRef = useRef(null)
  const desktopNavRef = useRef(null)
  const desktopIndicatorRef = useRef(null)
  const mobileIslandRef = useRef(null)
  const mobilePanelRef = useRef(null)
  const mobileBackdropRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const desktopLinks = gsap.utils.toArray('[data-desktop-nav-link]', navRef.current)
      const desktopNav = desktopNavRef.current
      const indicator = desktopIndicatorRef.current

      const hideIndicator = (immediate = false) => {
        if (!indicator) return

        gsap.to(indicator, {
          autoAlpha: 0,
          duration: immediate || reduceMotion ? 0 : 0.18,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      }

      const positionIndicator = (target, immediate = false) => {
        if (!desktopNav || !indicator || !target) {
          hideIndicator(immediate)
          return
        }

        const navRect = desktopNav.getBoundingClientRect()
        const targetRect = target.getBoundingClientRect()

        gsap.to(indicator, {
          autoAlpha: 1,
          x: targetRect.left - navRect.left,
          width: targetRect.width,
          duration: immediate || reduceMotion ? 0 : 0.38,
          ease: 'power3.out',
          overwrite: 'auto',
        })
      }

      const activeLink = desktopLinks.find((link) => link.dataset.active === 'true') || null
      positionIndicator(activeLink, true)

      const liftLink = (event) => {
        if (reduceMotion) return
        positionIndicator(event.currentTarget)
        gsap.to(event.currentTarget, {
          y: -2,
          scale: 1.02,
          duration: 0.22,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      }

      const resetLink = (event) => {
        if (!reduceMotion) {
          gsap.to(event.currentTarget, {
            y: 0,
            scale: 1,
            duration: 0.28,
            ease: 'power2.out',
            overwrite: 'auto',
          })
        }

        positionIndicator(activeLink)
      }

      const resetIndicator = () => positionIndicator(activeLink)

      desktopLinks.forEach((link) => {
        link.addEventListener('pointerenter', liftLink)
        link.addEventListener('pointerleave', resetLink)
        link.addEventListener('focus', liftLink)
        link.addEventListener('blur', resetLink)
      })
      desktopNav?.addEventListener('pointerleave', resetIndicator)
      window.addEventListener('resize', resetIndicator)

      if (!reduceMotion) {
        gsap.from('[data-brand-mark]', {
          scale: 0.92,
          rotate: -6,
          duration: 0.72,
          ease: 'back.out(1.7)',
        })
      }

      return () => {
        desktopLinks.forEach((link) => {
          link.removeEventListener('pointerenter', liftLink)
          link.removeEventListener('pointerleave', resetLink)
          link.removeEventListener('focus', liftLink)
          link.removeEventListener('blur', resetLink)
        })
        desktopNav?.removeEventListener('pointerleave', resetIndicator)
        window.removeEventListener('resize', resetIndicator)
      }
    },
    { scope: navRef, dependencies: [location.pathname], revertOnUpdate: true }
  )

  useGSAP(
    () => {
      const nav = navRef.current
      const island = mobileIslandRef.current
      const panel = mobilePanelRef.current
      const backdrop = mobileBackdropRef.current

      if (!nav || !island || !panel || !backdrop) return undefined

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const label = nav.querySelector('[data-mobile-island-label]')
      const topLine = nav.querySelector('[data-menu-line="top"]')
      const middleLine = nav.querySelector('[data-menu-line="middle"]')
      const bottomLine = nav.querySelector('[data-menu-line="bottom"]')
      const menuItems = gsap.utils.toArray('[data-mobile-menu-item]', panel)
      const openWidth = 'min(92vw, 25rem)'

      if (reduceMotion) {
        gsap.set(island, { width: isOpen ? openWidth : '2.75rem' })
        gsap.set(label, { autoAlpha: isOpen ? 1 : 0, x: isOpen ? 0 : 6 })
        gsap.set(panel, {
          autoAlpha: isOpen ? 1 : 0,
          y: 0,
          scale: 1,
          pointerEvents: isOpen ? 'auto' : 'none',
        })
        gsap.set(backdrop, {
          autoAlpha: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        })
        gsap.set(menuItems, { autoAlpha: isOpen ? 1 : 0, y: 0 })
        gsap.set(topLine, { attr: isOpen ? { x1: 5, y1: 5, x2: 19, y2: 19 } : { x1: 6, y1: 8, x2: 18, y2: 8 } })
        gsap.set(middleLine, { autoAlpha: isOpen ? 0 : 1 })
        gsap.set(bottomLine, { attr: isOpen ? { x1: 19, y1: 5, x2: 5, y2: 19 } : { x1: 6, y1: 16, x2: 18, y2: 16 } })
        return undefined
      }

      const timeline = gsap.timeline({ defaults: { overwrite: 'auto' } })

      if (isOpen) {
        timeline
          .set([backdrop, panel], { pointerEvents: 'auto' })
          .to(backdrop, { autoAlpha: 1, duration: 0.22, ease: 'power2.out' }, 0)
          .to(island, { width: openWidth, duration: 0.62, ease: 'back.out(1.6)' }, 0)
          .to(label, { autoAlpha: 1, x: 0, duration: 0.28, ease: 'power2.out' }, 0.1)
          .to(topLine, { attr: { x1: 5, y1: 5, x2: 19, y2: 19 }, duration: 0.28, ease: 'power3.inOut' }, 0)
          .to(middleLine, { autoAlpha: 0, duration: 0.16, ease: 'power2.in' }, 0)
          .to(bottomLine, { attr: { x1: 19, y1: 5, x2: 5, y2: 19 }, duration: 0.28, ease: 'power3.inOut' }, 0)
          .to(panel, { autoAlpha: 1, y: 0, scale: 1, duration: 0.38, ease: 'power3.out' }, 0.16)
          .fromTo(
            menuItems,
            { autoAlpha: 0, y: -8 },
            { autoAlpha: 1, y: 0, duration: 0.32, ease: 'power2.out', stagger: 0.045 },
            0.23
          )
      } else {
        timeline
          .to(menuItems, { autoAlpha: 0, y: -6, duration: 0.16, ease: 'power2.in', stagger: { each: 0.02, from: 'end' } }, 0)
          .to(panel, { autoAlpha: 0, y: -8, scale: 0.98, duration: 0.22, ease: 'power2.out' }, 0)
          .to(backdrop, { autoAlpha: 0, duration: 0.18, ease: 'power2.out' }, 0)
          .to(label, { autoAlpha: 0, x: 6, duration: 0.18, ease: 'power2.in' }, 0)
          .to(island, { width: '2.75rem', duration: 0.32, ease: 'power2.out' }, 0)
          .to(topLine, { attr: { x1: 6, y1: 8, x2: 18, y2: 8 }, duration: 0.24, ease: 'power3.inOut' }, 0)
          .to(middleLine, { autoAlpha: 1, duration: 0.2, ease: 'power2.out' }, 0.05)
          .to(bottomLine, { attr: { x1: 6, y1: 16, x2: 18, y2: 16 }, duration: 0.24, ease: 'power3.inOut' }, 0)
          .set([backdrop, panel], { pointerEvents: 'none' })
      }

      return () => timeline.kill()
    },
    { scope: navRef, dependencies: [isOpen] }
  )

  const isActive = (path) => isNavPathActive(location.pathname, path)

  const closeMenus = useCallback(() => {
    setIsOpen(false)
    setUserMenuOpen(false)
  }, [])

  useEffect(() => {
    closeMenus()
  }, [closeMenus, location.pathname])

  useEffect(() => {
    if (!isOpen && !userMenuOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMenus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeMenus, isOpen, userMenuOpen])

  const handleLogout = async () => {
    closeMenus()
    const result = await logout()
    if (!result?.redirected) {
      navigate('/')
    }
  }

  const displayName = user?.first_name || user?.email?.split('@')[0] || 'User'
  const avatarInitials = displayName.slice(0, 1).toUpperCase()

  const navLinkClass = (path) =>
    `relative z-10 inline-flex items-center gap-2 overflow-hidden rounded-full px-3.5 py-2 text-sm font-semibold transition-colors duration-200 ${
      isActive(path)
        ? 'text-primary-700'
        : 'text-slate-600 hover:text-slate-950'
    }`

  return (
    <nav ref={navRef} className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur-xl">
      <button
        ref={mobileBackdropRef}
        type="button"
        className="pointer-events-none fixed inset-0 z-40 bg-brand-ink/25 opacity-0 backdrop-blur-[2px] lg:hidden"
        aria-hidden="true"
        tabIndex={-1}
        onClick={closeMenus}
      />
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="group inline-flex items-center gap-3 rounded-2xl px-1 py-1 transition-colors duration-200"
            onClick={closeMenus}
          >
            <span data-brand-mark className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-gradient-primary shadow-brand-sm ring-1 ring-white/80">
              <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <Brain className="relative h-5 w-5 text-white" />
            </span>
            <span className="leading-none">
              <span className="block font-heading text-lg font-bold tracking-tight text-slate-950">LitmusAI</span>
              <span className="hidden pt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:block">
                AI literacy platform
              </span>
            </span>
          </Link>

          <div
            ref={desktopNavRef}
            className="relative hidden items-center gap-1 overflow-hidden rounded-full border border-slate-200/80 bg-white/75 p-1 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:flex"
          >
            <span
              ref={desktopIndicatorRef}
              data-desktop-nav-indicator
              className="pointer-events-none absolute bottom-1 left-0 top-1 rounded-full bg-gradient-to-r from-primary-50 via-white to-secondary-50 opacity-0 shadow-[inset_0_0_0_1px_rgba(107,78,255,0.12),0_8px_24px_rgba(107,78,255,0.12)]"
              aria-hidden="true"
            />
            {productNavigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={navLinkClass(item.href)}
                  data-desktop-nav-link
                  data-active={isActive(item.href) ? 'true' : 'false'}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  onClick={closeMenus}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          <div className="hidden items-center justify-end gap-2 lg:flex">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 shadow-brand-sm transition-colors duration-200 hover:border-slate-300 hover:text-slate-950"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-white">
                    {avatarInitials}
                  </span>
                  <span>{displayName}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-brand-lg">
                    <Link to="/dashboard" className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950" onClick={closeMenus}>
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link to="/profile" className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950" onClick={closeMenus}>
                      <User className="h-4 w-4" />
                      Profile Settings
                    </Link>
                    <Link to="/billing" className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950" onClick={closeMenus}>
                      <CreditCard className="h-4 w-4" />
                      Billing
                    </Link>
                    <div className="my-1 h-px bg-slate-200" />
                    <button onClick={handleLogout} className="flex w-full items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-950"
                  onClick={closeMenus}
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
                <Link to="/assessment" className="btn-primary inline-flex items-center gap-2 py-2.5 text-sm" onClick={closeMenus}>
                  <Sparkles className="h-4 w-4" />
                  Start free assessment
                </Link>
              </>
            )}
          </div>

          <div className="relative h-11 w-11 lg:hidden">
            <button
              ref={mobileIslandRef}
              type="button"
              onClick={() => setIsOpen((current) => !current)}
              className="absolute right-0 top-0 z-[60] block h-11 w-11 overflow-hidden rounded-full border border-slate-200/80 bg-white/90 text-slate-700 shadow-brand-md outline-none backdrop-blur-xl transition-colors duration-200 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              aria-expanded={isOpen}
              aria-haspopup="dialog"
              aria-controls="mobile-nav-panel"
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              <span
                data-mobile-island-label
                className="pointer-events-none absolute left-2 right-12 top-1/2 flex min-w-0 -translate-y-1/2 items-center gap-2 text-sm font-semibold text-slate-700 opacity-0"
                aria-hidden="true"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-primary text-white">
                  <Brain className="h-3.5 w-3.5" />
                </span>
                <span className="truncate">LitmusAI menu</span>
              </span>
              <span className="absolute right-0 top-0 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-700">
                <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
                  <line data-menu-line="top" x1="6" y1="8" x2="18" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line data-menu-line="middle" x1="6" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line data-menu-line="bottom" x1="6" y1="16" x2="18" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </button>
          </div>
        </div>

        <div
          id="mobile-nav-panel"
          ref={mobilePanelRef}
          role="dialog"
          aria-label="Navigation menu"
          aria-hidden={!isOpen}
          className="pointer-events-none absolute right-4 top-[4.75rem] z-50 w-[min(92vw,25rem)] origin-top-right rounded-3xl border border-slate-200/85 bg-white/95 p-3 opacity-0 shadow-brand-lg backdrop-blur-xl lg:hidden"
        >
          <div className="space-y-1">
            {productNavigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-base font-semibold transition-colors duration-200 ${
                    isActive(item.href) ? 'bg-primary-50 text-primary-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  data-mobile-menu-item
                  data-active={isActive(item.href) ? 'true' : 'false'}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  tabIndex={isOpen ? undefined : -1}
                  onClick={closeMenus}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          <div className="mt-3 space-y-1 border-t border-slate-200 pt-3">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50" data-mobile-menu-item tabIndex={isOpen ? undefined : -1} onClick={closeMenus}>
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link to="/profile" className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50" data-mobile-menu-item tabIndex={isOpen ? undefined : -1} onClick={closeMenus}>
                  <User className="h-4 w-4" />
                  Profile Settings
                </Link>
                <Link to="/billing" className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50" data-mobile-menu-item tabIndex={isOpen ? undefined : -1} onClick={closeMenus}>
                  <CreditCard className="h-4 w-4" />
                  Billing
                </Link>
                <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-base font-semibold text-red-600 hover:bg-red-50" data-mobile-menu-item tabIndex={isOpen ? undefined : -1}>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50" data-mobile-menu-item tabIndex={isOpen ? undefined : -1} onClick={closeMenus}>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
                <Link to="/assessment" className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 py-3 text-center text-sm font-semibold text-white shadow-brand-sm" data-mobile-menu-item tabIndex={isOpen ? undefined : -1} onClick={closeMenus}>
                  <Sparkles className="h-4 w-4" />
                  Start free assessment
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
