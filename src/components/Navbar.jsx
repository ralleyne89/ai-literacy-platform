import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Brain, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  const navigation = [
    { name: 'Assessment', href: '/assessment' },
    { name: 'Training', href: '/training' },
    { name: 'Certification', href: '/certification' },
    { name: 'Enterprise', href: '/enterprise' },
    { name: 'Pricing', href: '/billing' }
  ]

  const isActive = (path) => location.pathname === path

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
    `group relative inline-flex items-center px-3 py-1.5 text-[13px] font-medium tracking-tight transition-colors duration-200 ${
      isActive(path) ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
    }`

  const mobileNavLinkClass = (path) =>
    `block rounded-xl px-3 py-2.5 text-base font-semibold transition-all duration-200 ${
      isActive(path)
        ? 'bg-primary-50 text-primary-700'
        : 'text-slate-700 hover:bg-slate-900/5 hover:text-slate-900'
    }`

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/88 backdrop-blur-xl supports-[backdrop-filter]:bg-white/82">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-5">
          <div className="flex items-center">
            <Link to="/" className="group inline-flex items-center gap-2.5">
              <span className="relative grid h-8 w-8 place-items-center rounded-xl bg-gradient-primary shadow-sm ring-1 ring-white/60">
                <span className="relative flex items-center justify-center">
                  <Brain className="h-4 w-4 text-white" />
                </span>
              </span>
              <span className="leading-none">
                <span className="block font-heading text-[1.06rem] tracking-tight text-slate-900">LitmusAI</span>
                <span className="hidden lg:block pt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Assessment · Training · Certification
                </span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={navLinkClass(item.href)}
                onClick={closeMenus}
              >
                {item.name}
                <span
                  className={`pointer-events-none absolute left-3 right-3 -bottom-2 h-px bg-slate-900 transition-transform duration-200 ${
                    isActive(item.href) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="group inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:text-slate-900"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-white">
                    {avatarInitials}
                  </span>
                  <span>{displayName}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      userMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-white/70 bg-white/95 p-1 shadow-xl ring-1 ring-slate-900/5 backdrop-blur">
                    <Link
                      to="/dashboard"
                      className="block rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      onClick={closeMenus}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className="block rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      onClick={closeMenus}
                    >
                      Profile Settings
                    </Link>
                    <Link
                      to="/billing"
                      className="block rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      onClick={closeMenus}
                    >
                      Billing
                    </Link>
                    <div className="my-1 h-px bg-slate-200/80" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:text-slate-900"
                >
                  Sign In
                </Link>
                <Link
                  to="/assessment"
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:brightness-105 hover:shadow-md"
                >
                  Start free assessment
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-700 transition-all duration-200 hover:border-primary-300 hover:text-slate-900"
              aria-expanded={isOpen}
              aria-controls="mobile-nav-panel"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden" id="mobile-nav-panel">
          <div className="mx-3 mt-2 rounded-3xl border border-white/70 bg-white/95 p-4 shadow-xl shadow-slate-900/5 backdrop-blur">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={mobileNavLinkClass(item.href)}
                onClick={closeMenus}
              >
                {item.name}
              </Link>
            ))}
            <div className="mt-3 space-y-1 border-t border-slate-200 pt-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block rounded-xl px-3 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-100"
                    onClick={closeMenus}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="block rounded-xl px-3 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-100"
                    onClick={closeMenus}
                  >
                    Profile Settings
                  </Link>
                  <Link
                    to="/billing"
                    className="block rounded-xl px-3 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-100"
                    onClick={closeMenus}
                  >
                    Billing
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center rounded-xl px-3 py-2.5 text-left text-base font-semibold text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block rounded-xl px-3 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-100"
                    onClick={closeMenus}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/assessment"
                    className="mt-2 block rounded-xl btn-primary text-center text-sm"
                    onClick={closeMenus}
                  >
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
