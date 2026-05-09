import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import CertificationPage from './CertificationPage'

const mockAuthState = vi.hoisted(() => ({
  isAuthenticated: true,
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

const renderCertificationPage = () => render(
  <MemoryRouter>
    <CertificationPage />
  </MemoryRouter>
)

describe('CertificationPage', () => {
  beforeEach(() => {
    mockAuthState.isAuthenticated = true
    mockAxios.get.mockReset()
    mockAxios.post.mockReset()
  })

  it('renders available certification cards from the catalog', async () => {
    mockAxios.get.mockImplementation((url) => {
      if (url === '/api/certification/available') {
        return Promise.resolve({
          data: {
            certifications: [
              {
                id: 'ai-fundamentals',
                title: 'AI Fundamentals Certificate',
                description: 'Entry-level AI literacy credential.',
                requirements: ['Complete AI readiness assessment'],
                estimated_time: '1 week',
                skills_validated: ['Basic AI concepts'],
                is_premium: false,
                eligible: false,
                missing_requirements: ['Complete Introduction to AI Fundamentals.'],
              },
            ],
          },
        })
      }

      if (url === '/api/certification/earned') {
        return Promise.resolve({
          data: {
            certifications: [],
          },
        })
      }

      return Promise.reject(new Error(`Unexpected request: ${url}`))
    })

    renderCertificationPage()

    expect(await screen.findByTestId('certification-available-grid')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'AI Fundamentals Certificate' })).toBeInTheDocument()
    expect(screen.queryByTestId('certification-empty-catalog')).not.toBeInTheDocument()
  })

  it('shows a clear empty state when the certification catalog is not seeded', async () => {
    mockAxios.get.mockImplementation((url) => {
      if (url === '/api/certification/available') {
        return Promise.resolve({
          data: {
            certifications: [],
            message: 'No certification catalog configured. Run `flask seed-certifications` to load defaults.',
          },
        })
      }

      if (url === '/api/certification/earned') {
        return Promise.resolve({
          data: {
            certifications: [],
          },
        })
      }

      return Promise.reject(new Error(`Unexpected request: ${url}`))
    })

    renderCertificationPage()

    expect(await screen.findByTestId('certification-empty-catalog')).toBeInTheDocument()
    expect(screen.getByText('No certifications available yet')).toBeInTheDocument()
    expect(screen.getByText('No certification catalog configured. Run `flask seed-certifications` to load defaults.')).toBeInTheDocument()
  })
})
