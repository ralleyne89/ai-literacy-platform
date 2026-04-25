import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Award,
  BookOpen,
  Brain,
  Building2,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Sparkles,
  Target,
  User,
  X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const MotionLink = motion.create(Link)

const itemVariants = {
  initial: { rotateX: 0, opacity: 1, y: 0 },
  hover: { rotateX: -90, opacity: 0, y: -6 },
}

const backVariants = {
  initial: { rotateX: 90, opacity: 0, y: 6 },
  hover: { rotateX: 0, opacity: 1, y: 0 },
}

const glowVariants = {
  initial: { opacity: 0, scale: 0.82 },
  hover: {
    opacity: 1,
    scale: 1.9,
    transition: {
      opacity: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: 'spring', stiffness: 300, damping: 25 },
    },
  },
}

const sharedTransition = {
  type: 'spring',
  stiffness: 110,
  damping: 20,
  duration: 0.5,
}

const productNavigation = [
  {
    name: 'Assessment',
    href: '/assessment',
    icon: Target,
    gradient: 'radial-gradient(circle, rgba(107,78,255,0.24) 0%, rgba(90,60,230,0.10) 54%, rgba(74,46,204,0) 100%)',
    iconColor: 'group-hover:text-primary-500 group-focus-visible:text-primary-500',
    activeIconColor: 'text-primary-600',
  },
  {
    name: 'Training',
    href: '/training',
    icon: BookOpen,
    gradient: 'radial-gradient(circle, rgba(0,210,255,0.24) 0%, rgba(0,180,230,0.10) 54%, rgba(0,150,204,0) 100%)',
    iconColor: 'group-hover:text-secondary-500 group-focus-visible:text-secondary-500',
    activeIconColor: 'text-secondary-600',
  },
  {
    name: 'Certification',
    href: '/certification',
    icon: Award,
    gradient: 'radial-gradient(circle, rgba(16,185,129,0.22) 0%, rgba(5,150,105,0.09) 54%, rgba(4,120,87,0) 100%)',
    iconColor: 'group-hover:text-emerald-500 group-focus-visible:text-emerald-500',
    activeIconColor: 'text-emerald-600',
  },
  {
    name: 'Enterprise',
    href: '/enterprise',
    icon: Building2,
    gradient: 'radial-gradient(circle, rgba(249,115,22,0.22) 0%, rgba(234,88,12,0.09) 54%, rgba(194,65,12,0) 100%)',
    iconColor: 'group-hover:text-orange-500 group-focus-visible:text-orange-500',
    activeIconColor: 'text-orange-600',
  },
  {
    name: 'Pricing',
    href: '/billing',
    icon: CreditCard,
    gradient: 'radial-gradient(circle, rgba(20,184,166,0.22) 0%, rgba(13,148,136,0.09) 54%, rgba(15,118,110,0) 100%)',
    iconColor: 'group-hover:text-teal-500 group-focus-visible:text-teal-500',
    activeIconColor: 'text-teal-600',
  },
]

const HoverGradientNavLink = ({ item, isActive, isHomePage, onClick }) => {
  const Icon = item.icon
  const baseTone = isHomePage
    ? 'text-white/72 hover:text-white focus-visible:text-white'
    : 'text-slate-600 hover:text-slate-950 focus-visible:text-slate-950'
  const activeTone = isHomePage
    ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/25'
    : 'bg-white/75 text-slate-950 shadow-sm ring-1 ring-white/90'

  return (
    <MotionLink
      to={item.href}
      aria-label={item.name}
      className={`group relative inline-flex h-12 min-w-[8.15rem] items-center justify-center overflow-visible rounded-full px-3 text-[13px] font-semibold tracking-tight outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/80 ${
        isActive ? activeTone : baseTone
      }`}
      initial="initial"
      whileHover="hover"
      whileFocus="hover"
      onClick={onClick}
      style={{ perspective: '680px' }}
    >
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 z-0 rounded-full pointer-events-none"
        variants={glowVariants}
        style={{ background: item.gradient }}
      />
      <motion.span
        aria-hidden="true"
        className="relative z-10 flex items-center justify-center gap-2"
        variants={itemVariants}
        transition={sharedTransition}
        style={{
          transformStyle: 'preserve-3d',
          transformOrigin: 'center bottom',
        }}
      >
        <Icon
          className={`h-4 w-4 transition-colors duration-300 ${
            isActive ? item.activeIconColor : item.iconColor
          }`}
        />
        <span>{item.name}</span>
      </motion.span>
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-full"
        variants={backVariants}
        transition={sharedTransition}
        style={{
          transformStyle: 'preserve-3d',
          transformOrigin: 'center top',
        }}
      >
        <Icon
          className={`h-4 w-4 transition-colors duration-300 ${
            isActive ? item.activeIconColor : item.iconColor
          }`}
        />
        <span>{item.name}</span>
      </motion.span>
    </MotionLink>
  )
}

const MobileNavLink = ({ item, isActive, onClick }) => {
  const Icon = item.icon

  return (
    <Link
      to={item.href}
      className={`group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-base font-semibold transition-all duration-200 ${
        isActive
          ? 'bg-white/80 text-slate-950 shadow-sm ring-1 ring-white/90'
          : 'text-slate-700 hover:bg-white/60 hover:text-slate-950'
      }`}
      onClick={onClick}
    >
      <span
        className="grid h-9 w-9 place-items-center rounded-2xl bg-white/55 shadow-sm ring-1 ring-white/80 transition-transform duration-200 group-hover:-translate-y-0.5"
        style={{ backgroundImage: item.gradient }}
      >
        <Icon className={`h-4 w-4 ${isActive ? item.activeIconColor : 'text-slate-600'}`} />
      </span>
      {item.name}
    </Link>
  )
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  const isActive = (path) => (
    location.pathname === path ||
    (path !== '/' && location.pathname.startsWith(`${path}/`))
  )

  const closeMenus = () => {
    setIsOpen(false)
    setUserMenuOpen(false)
  }

  const handleLogout = async () => {
    closeMenus()
    const result = await logout()
    if (!result?.redirected) {
      navigate('/')
    }
  }

  const displayName = user?.first_name || user?.email?.split('@')[0] || 'User'
  const avatarInitials = displayName.slice(0, 1).toUpperCase()
  const isHomePage = location.pathname === '/'
  const desktopButtonTone = isHomePage
    ? 'text-white/80 hover:bg-white/20 hover:text-white'
    : 'text-slate-700 hover:bg-white/80 hover:text-slate-950'

  return (
    <nav
      className={`${isHomePage ? 'absolute inset-x-0' : 'sticky'} pointer-events-none top-0 z-50 px-3 py-3 sm:px-6`}
    >
      <div className="pointer-events-auto mx-auto max-w-[1200px]">
        <div className="relative flex h-16 items-center justify-between gap-3 overflow-visible xl:grid xl:grid-cols-[auto_1fr_auto]">
          <div className="flex items-center">
            <Link
              to="/"
              className={`group relative inline-flex h-14 items-center gap-2.5 rounded-[1.35rem] border border-white/50 px-3 shadow-[0_18px_50px_rgba(15,23,42,0.12)] ring-1 ring-slate-950/[0.03] backdrop-blur-2xl transition-all duration-200 ${
                isHomePage ? 'bg-white/10 hover:bg-white/20' : 'bg-white/60 hover:bg-white/75'
              }`}
              onClick={closeMenus}
            >
              <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-2xl bg-gradient-primary shadow-sm ring-1 ring-white/70">
                <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <span className="relative flex items-center justify-center">
                  <Brain className="h-4 w-4 text-white" />
                </span>
              </span>
              <span className="leading-none">
                <span className={`block font-heading text-[1.06rem] tracking-tight ${isHomePage ? 'text-white' : 'text-slate-900'}`}>LitmusAI</span>
                <span className={`hidden pt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] lg:block ${isHomePage ? 'text-white/60' : 'text-slate-500'}`}>
                  Assessment · Training · Certification
                </span>
              </span>
            </Link>
          </div>

          <div className="relative hidden justify-center xl:flex">
            <motion.ul
              className="inline-flex items-center gap-1 rounded-full border border-white/50 bg-white/25 p-1 shadow-[0_18px_50px_rgba(15,23,42,0.10)] shadow-white/20 ring-1 ring-slate-950/[0.03] backdrop-blur-2xl"
              initial="initial"
            >
              {productNavigation.map((item) => (
                <li key={item.name} className="relative">
                  <HoverGradientNavLink
                    item={item}
                    isActive={isActive(item.href)}
                    isHomePage={isHomePage}
                    onClick={closeMenus}
                  />
                </li>
              ))}
            </motion.ul>
          </div>

          <div className="relative hidden items-center justify-end space-x-2 xl:flex">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`group inline-flex h-12 items-center gap-2 rounded-full border border-white/60 bg-white/25 px-2.5 py-1.5 text-sm font-semibold shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-950/[0.03] backdrop-blur-2xl transition-all duration-200 ${desktopButtonTone}`}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-white">
                    {avatarInitials}
                  </span>
                  <span>{displayName}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      userMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-3xl border border-white/75 bg-white/90 p-1.5 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 backdrop-blur-2xl">
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-white hover:text-slate-950"
                      onClick={closeMenus}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-white hover:text-slate-950"
                      onClick={closeMenus}
                    >
                      <User className="h-4 w-4" />
                      Profile Settings
                    </Link>
                    <Link
                      to="/billing"
                      className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-white hover:text-slate-950"
                      onClick={closeMenus}
                    >
                      <CreditCard className="h-4 w-4" />
                      Billing
                    </Link>
                    <div className="my-1 h-px bg-slate-200/80" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
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
                  className={`inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/25 px-4 py-2 text-sm font-semibold shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-950/[0.03] backdrop-blur-2xl transition-all duration-200 ${desktopButtonTone}`}
                  onClick={closeMenus}
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
                <Link
                  to="/assessment"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 transition-all duration-200 hover:brightness-105 hover:shadow-primary-500/30"
                  onClick={closeMenus}
                >
                  <Sparkles className="h-4 w-4" />
                  Start free assessment
                </Link>
              </>
            )}
          </div>

          <div className="relative flex items-center xl:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 shadow-sm transition-all duration-200 ${
                isHomePage ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white/60 text-slate-700 hover:bg-white/90 hover:text-slate-950'
              }`}
              aria-expanded={isOpen}
              aria-controls="mobile-nav-panel"
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="pointer-events-auto xl:hidden" id="mobile-nav-panel">
          <div className="mx-auto mt-2 max-w-[1200px] rounded-[1.75rem] border border-white/70 bg-white/80 p-3 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-950/[0.03] backdrop-blur-2xl">
            <div className="space-y-1">
              {productNavigation.map((item) => (
                <MobileNavLink
                  key={item.name}
                  item={item}
                  isActive={isActive(item.href)}
                  onClick={closeMenus}
                />
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-white/70 pt-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-base font-semibold text-slate-700 hover:bg-white/60"
                    onClick={closeMenus}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-base font-semibold text-slate-700 hover:bg-white/60"
                    onClick={closeMenus}
                  >
                    <User className="h-4 w-4" />
                    Profile Settings
                  </Link>
                  <Link
                    to="/billing"
                    className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-base font-semibold text-slate-700 hover:bg-white/60"
                    onClick={closeMenus}
                  >
                    <CreditCard className="h-4 w-4" />
                    Billing
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-base font-semibold text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-base font-semibold text-slate-700 hover:bg-white/60"
                    onClick={closeMenus}
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Link>
                  <Link
                    to="/assessment"
                    className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-primary-500/20"
                    onClick={closeMenus}
                  >
                    <Sparkles className="h-4 w-4" />
                    Start free assessment
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
