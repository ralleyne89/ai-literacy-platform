import React, { useState } from 'react'
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

const productNavigation = [
  { name: 'Assessment', href: '/assessment', icon: Target },
  { name: 'Training', href: '/training', icon: BookOpen },
  { name: 'Certification', href: '/certification', icon: Award },
  { name: 'Enterprise', href: '/enterprise', icon: Building2 },
  { name: 'Pricing', href: '/billing', icon: CreditCard },
]

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

  const navLinkClass = (path) =>
    `inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-200 ${
      isActive(path)
        ? 'bg-primary-50 text-primary-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
    }`

  return (
    <nav className="relative z-50 border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="group inline-flex items-center gap-3 rounded-2xl px-1 py-1 transition-colors duration-200"
            onClick={closeMenus}
          >
            <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-gradient-primary shadow-brand-sm ring-1 ring-white/80">
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

          <div className="hidden items-center gap-1 lg:flex">
            {productNavigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={navLinkClass(item.href)}
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

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-brand-sm transition-colors duration-200 hover:text-slate-950 lg:hidden"
            aria-expanded={isOpen}
            aria-controls="mobile-nav-panel"
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isOpen && (
          <div id="mobile-nav-panel" className="mt-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-brand-lg lg:hidden">
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
                  <Link to="/dashboard" className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50" onClick={closeMenus}>
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link to="/profile" className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50" onClick={closeMenus}>
                    <User className="h-4 w-4" />
                    Profile Settings
                  </Link>
                  <Link to="/billing" className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50" onClick={closeMenus}>
                    <CreditCard className="h-4 w-4" />
                    Billing
                  </Link>
                  <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-base font-semibold text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50" onClick={closeMenus}>
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Link>
                  <Link to="/assessment" className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 py-3 text-center text-sm font-semibold text-white shadow-brand-sm" onClick={closeMenus}>
                    <Sparkles className="h-4 w-4" />
                    Start free assessment
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
