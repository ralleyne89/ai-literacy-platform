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

const internalModule = {
  id: 'module-ai-sales',
  title: 'AI Fundamentals for Sales Teams',
  description: 'A practical in-platform video module.',
  content_type: 'video',
  content_url: 'https://www.youtube-nocookie.com/embed/R8CepUwdZis',
  role_specific: 'Sales',
  estimated_duration_minutes: 45,
  learning_objectives: ['Use AI in sales workflows'],
  prerequisites: [],
  resources: [
    { label: 'Internal worksheet', url: '/training/modules/module-ai-sales/learn' },
    { label: 'External worksheet', url: 'https://example.com/sales-template' },
  ],
  metadata: {
    access_tier: 'free',
    provider: 'LitmusAI',
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

  it('hides off-platform resource links for in-platform video modules', async () => {
    mockAxios.get.mockResolvedValue({
      data: {
        module: internalModule,
      },
    })

    renderModulePage()

    expect(await screen.findByRole('heading', { name: 'AI Fundamentals for Sales Teams' })).toBeInTheDocument()
    expect(screen.getByText('Internal worksheet').closest('a'))
      .toHaveAttribute('href', '/training/modules/module-ai-sales/learn')
    expect(screen.queryByText('External worksheet')).not.toBeInTheDocument()
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
