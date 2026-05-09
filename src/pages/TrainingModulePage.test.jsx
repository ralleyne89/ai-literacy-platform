import React from 'react'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import TrainingModulePage from './TrainingModulePage'

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

const renderModulePage = () => render(
  <MemoryRouter initialEntries={['/training/modules/module-elements-of-ai']}>
    <Routes>
      <Route path="/training/modules/:moduleId" element={<TrainingModulePage />} />
    </Routes>
  </MemoryRouter>
)

const externalModule = {
  id: 'module-elements-of-ai',
  title: 'Elements of AI',
  description: 'A globally recognized introduction to artificial intelligence.',
  content_type: 'external',
  content_url: 'https://www.elementsofai.com/',
  role_specific: 'General',
  estimated_duration_minutes: 420,
  learning_objectives: ['Explain foundational AI concepts'],
  prerequisites: [],
  resources: [],
  metadata: {
    access_tier: 'free',
    external_url: 'https://www.elementsofai.com/',
    provider: 'University of Helsinki & MinnaLearn',
  },
}

describe('TrainingModulePage', () => {
  beforeEach(() => {
    mockAuthState.isAuthenticated = true
    mockAuthState.user = { id: 'user-123' }
    mockAxios.get.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders an external module detail page after loading', async () => {
    mockAxios.get.mockResolvedValue({
      data: {
        module: externalModule,
      },
    })

    renderModulePage()

    expect(await screen.findByRole('heading', { name: 'Elements of AI' })).toBeInTheDocument()
    expect(screen.queryByTestId('training-module-loading')).not.toBeInTheDocument()
    expect(screen.getByTestId('training-module-external-cta-link'))
      .toHaveAttribute('href', 'https://www.elementsofai.com/')
  })

  it('stops showing the spinner when the module request hangs', async () => {
    vi.useFakeTimers()
    mockAxios.get.mockImplementation((_url, config = {}) => new Promise((_resolve, reject) => {
      config.signal?.addEventListener('abort', () => {
        reject(new Error('Request aborted'))
      })
    }))

    renderModulePage()

    expect(screen.getByTestId('training-module-loading')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(20000)
      await Promise.resolve()
    })

    expect(screen.getByTestId('training-module-error')).toBeInTheDocument()
    expect(screen.getByText('This module is taking longer than expected to load. Go back to the Training Hub and try again.')).toBeInTheDocument()
  })
})
