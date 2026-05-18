import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import TrainingPage from './TrainingPage'

const mockAuthState = vi.hoisted(() => ({
  isAuthenticated: true,
  user: {
    id: 'user-123',
  },
}))

const mockAxios = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    get: mockAxios.get,
  },
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}))

const recommendations = [
  {
    id: 'module-internal',
    title: 'Internal lesson module',
    description: 'A lesson-backed module.',
    content_type: 'video',
    difficulty_level: 1,
    estimated_duration_minutes: 20,
    has_internal_lessons: true,
    reason: 'Strengthen fundamentals.',
    priority: 'high',
  },
  {
    id: 'module-external',
    title: 'External partner course',
    description: 'An external course.',
    content_type: 'external',
    difficulty_level: 2,
    estimated_duration_minutes: 45,
    has_internal_lessons: true,
    reason: 'Useful extension.',
    priority: 'medium',
  },
  {
    id: 'module-overview',
    title: 'Overview-only module',
    description: 'A module without internal lessons.',
    content_type: 'video',
    difficulty_level: 1,
    estimated_duration_minutes: 15,
    has_internal_lessons: false,
    reason: 'Start here.',
    priority: 'low',
  },
]

describe('TrainingPage recommendations', () => {
  beforeEach(() => {
    mockAuthState.isAuthenticated = true
    mockAuthState.user = { id: 'user-123' }
    mockAxios.get.mockReset()
    mockAxios.get.mockImplementation((url) => {
      if (url === '/api/training/modules') {
        return Promise.resolve({
          data: {
            modules: [],
          },
        })
      }

      if (url === '/api/assessment/recommendations') {
        return Promise.resolve({
          data: {
            recommendations,
          },
        })
      }

      return Promise.reject(new Error(`Unexpected request: ${url}`))
    })
  })

  it('shows only in-platform recommendation links based on internal lesson availability', async () => {
    render(
      <MemoryRouter>
        <TrainingPage />
      </MemoryRouter>
    )

    expect(await screen.findByTestId('training-recommendation-module-internal-link'))
      .toHaveAttribute('href', '/training/modules/module-internal/learn')
    expect(screen.queryByTestId('training-recommendation-module-external-link')).not.toBeInTheDocument()
    expect(screen.getByTestId('training-recommendation-module-overview-link'))
      .toHaveAttribute('href', '/training/modules/module-overview')
  })
})
