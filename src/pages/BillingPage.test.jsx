import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import BillingPage, { FALLBACK_PLANS } from './BillingPage'

const mockAuthState = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null,
}))

const mockAxios = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    get: mockAxios.get,
    post: mockAxios.post,
  },
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}))

const RegisterProbe = () => {
  const location = useLocation()
  return (
    <pre data-testid="register-state">
      {JSON.stringify(location.state)}
    </pre>
  )
}

const renderBillingPage = (initialEntries = ['/billing']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/register" element={<RegisterProbe />} />
        <Route path="/assessment" element={<div>Assessment route</div>} />
      </Routes>
    </MemoryRouter>
  )

describe('BillingPage public pricing', () => {
  beforeEach(() => {
    mockAuthState.isAuthenticated = false
    mockAuthState.user = null
    mockAxios.get.mockReset()
    mockAxios.post.mockReset()
    mockAxios.get.mockRejectedValue(new Error('billing API offline'))
  })

  it('renders fallback pricing immediately for signed-out visitors without the old sign-in warning', async () => {
    renderBillingPage()

    expect(screen.getByRole('heading', { name: /Pick the plan that matches your AI rollout/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Free' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Premium' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Enterprise' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start Premium/i })).toBeEnabled()
    expect(screen.queryByText(/Sign in before upgrading/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Unable to reach billing API/i)).not.toBeInTheDocument()

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledTimes(1)
    })
  })

  it('routes signed-out paid plan clicks through account creation with a billing return target', async () => {
    renderBillingPage()

    fireEvent.click(screen.getByRole('button', { name: /Start Premium/i }))

    expect(await screen.findByTestId('register-state')).toHaveTextContent(
      JSON.stringify({
        from: {
          pathname: '/billing',
          search: '?plan=premium',
        },
      })
    )
    expect(mockAxios.post).not.toHaveBeenCalled()
  })

  it('keeps the full local plan catalog when the billing API only returns partial config', async () => {
    mockAxios.get.mockResolvedValueOnce({
      data: {
        mock_mode: false,
        plans: [
          {
            id: 'premium',
            amount: 39,
            currency: 'usd',
            billing_interval: 'month',
            features: ['Remote premium feature'],
            checkout_enabled: true,
          },
        ],
      },
    })

    renderBillingPage()

    expect(await screen.findByText('$39')).toBeInTheDocument()
    expect(screen.getByText('Remote premium feature')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Free' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Enterprise' })).toBeInTheDocument()
  })

  it('does not expose backend setup details from remote billing status messages', async () => {
    mockAxios.get.mockResolvedValueOnce({
      data: {
        mock_mode: false,
        plans: [
          {
            id: 'premium',
            status_message: 'Stripe secret key is missing. Set STRIPE_SECRET_KEY to enable checkout.',
            checkout_enabled: false,
          },
        ],
      },
    })

    renderBillingPage()

    expect(await screen.findByRole('link', { name: /Contact sales/i })).toBeInTheDocument()
    expect(screen.queryByText(/STRIPE_SECRET_KEY/i)).not.toBeInTheDocument()
  })

  it('exports a fallback catalog with all public plan tiers', () => {
    expect(FALLBACK_PLANS.map(plan => plan.id)).toEqual(['free', 'premium', 'enterprise'])
  })
})
