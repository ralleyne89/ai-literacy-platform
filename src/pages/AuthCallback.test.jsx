import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthCallback from './AuthCallback'


const mockNavigate = vi.fn()
const mockLocation = {
  state: undefined,
}
const mockAuthState = {
  loading: false,
  isAuthenticated: false,
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')

  return {
    ...actual,
    useLocation: () => mockLocation,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}))

describe('AuthCallback', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockLocation.state = undefined
    mockAuthState.loading = false
    mockAuthState.isAuthenticated = false
    window.sessionStorage.clear()
  })

  it('restores the stored return path when the user is already authenticated', async () => {
    window.sessionStorage.setItem('ailiteracy_auth_return_to', '/dashboard')
    mockAuthState.isAuthenticated = true

    render(<AuthCallback />)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
  })

  it('redirects back to login when the legacy callback route is hit without an authenticated session', async () => {
    mockLocation.state = { returnTo: '/training' }

    render(<AuthCallback />)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        replace: true,
        state: {
          from: { pathname: '/training' },
          authError: {
            code: 'legacy_auth_callback',
            error: 'The legacy callback route is no longer used. Please sign in again.',
          },
        },
      })
    })
  })
})
