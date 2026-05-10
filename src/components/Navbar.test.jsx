import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Navbar, { isNavPathActive } from './Navbar'

const mockAuthState = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null,
  logout: vi.fn(),
}))

const gsapMocks = vi.hoisted(() => {
  const createTimeline = () => {
    const timeline = {
      set: vi.fn(() => timeline),
      to: vi.fn(() => timeline),
      fromTo: vi.fn(() => timeline),
      kill: vi.fn(),
    }

    return timeline
  }

  return {
    from: vi.fn(),
    set: vi.fn(),
    timeline: vi.fn(createTimeline),
    to: vi.fn(),
  }
})

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}))

vi.mock('../utils/gsap', async () => {
  const ReactModule = await vi.importActual('react')

  return {
    gsap: {
      ...gsapMocks,
      utils: {
        toArray: (selector, scope) => Array.from((scope || document).querySelectorAll(selector)),
      },
    },
    useGSAP: (callback, config = {}) => ReactModule.useEffect(() => callback(), config.dependencies || []),
  }
})

const renderNavbar = (initialPath = '/') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Navbar />
    </MemoryRouter>
  )

describe('Navbar active navigation state', () => {
  beforeEach(() => {
    mockAuthState.isAuthenticated = false
    mockAuthState.user = null
    mockAuthState.logout.mockReset()
    gsapMocks.to.mockReset()
    gsapMocks.from.mockReset()
    gsapMocks.set.mockReset()
    gsapMocks.timeline.mockClear()

    window.matchMedia = vi.fn().mockImplementation((query) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    }))
  })

  it('matches exact and nested routes without bleeding into similar slugs', () => {
    expect(isNavPathActive('/training', '/training')).toBe(true)
    expect(isNavPathActive('/training/modules/module-elements-of-ai/learn', '/training')).toBe(true)
    expect(isNavPathActive('/training/', '/training')).toBe(true)
    expect(isNavPathActive('/training-tools', '/training')).toBe(false)
    expect(isNavPathActive('/dashboard', '/training')).toBe(false)
  })

  it('marks the current product tab active on nested routes', () => {
    const { container } = renderNavbar('/training/modules/module-elements-of-ai/learn')

    expect(screen.getAllByRole('link', { name: /Training/i })).toHaveLength(1)

    const activeTrainingLinks = Array.from(
      container.querySelectorAll('a[aria-current="page"][data-active="true"]')
    ).filter((link) => link.textContent.includes('Training'))

    expect(activeTrainingLinks).toHaveLength(2)
    activeTrainingLinks.forEach((link) => {
      expect(link).toHaveAttribute('aria-current', 'page')
      expect(link).toHaveAttribute('data-active', 'true')
    })
  })

  it('does not leave the desktop pill on Assessment when no product tab matches', () => {
    const { container } = renderNavbar('/dashboard')

    expect(container.querySelector('[data-desktop-nav-link][aria-current="page"]')).not.toBeInTheDocument()
    expect(gsapMocks.to).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        autoAlpha: 0,
      })
    )
  })
})
