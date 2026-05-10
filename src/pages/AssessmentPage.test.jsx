import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AssessmentPage, {
  ASSESSMENT_VERSION,
  PENDING_ASSESSMENT_SUBMISSION_KEY
} from './AssessmentPage'

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

const pendingPayload = {
  answers: {
    q1: 'A',
  },
  option_map: {
    q1: {
      A: 'Correct answer',
      B: 'Wrong answer',
      C: 'Wrong answer',
      D: 'Wrong answer',
    },
  },
  selected_question_ids: ['q1'],
  selected_ids: ['q1'],
  assessment_level: 'beginner',
}

const pendingResults = {
  total_score: 1,
  max_score: 1,
  percentage: 100,
  domain_scores: {
    'AI Fundamentals': {
      score: 1,
      total: 1,
    },
  },
  recommendations: [],
  saved: false,
}

const createDeferred = () => {
  let resolve
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

describe('AssessmentPage pending submission', () => {
  beforeEach(() => {
    mockAuthState.isAuthenticated = true
    mockAxios.get.mockReset()
    mockAxios.post.mockReset()
    window.localStorage.clear()
  })

  it('replays a guest assessment submission after sign-in and clears pending storage', async () => {
    window.localStorage.setItem(
      PENDING_ASSESSMENT_SUBMISSION_KEY,
      JSON.stringify({
        version: ASSESSMENT_VERSION,
        payload: pendingPayload,
        results: pendingResults,
      })
    )

    mockAxios.post.mockResolvedValue({
      data: {
        ...pendingResults,
        saved: true,
      },
    })

    render(
      <MemoryRouter>
        <AssessmentPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith('/api/assessment/submit', pendingPayload)
    })

    expect(await screen.findByTestId('assessment-results-saved')).toBeInTheDocument()
    expect(window.localStorage.getItem(PENDING_ASSESSMENT_SUBMISSION_KEY)).toBeNull()
  })

  it('requires a self-rated level before loading a tuned question set', async () => {
    const questions = Array.from({ length: 15 }, (_, index) => ({
      id: `q${index + 1}`,
      domain: 'AI Fundamentals',
      question_text: `Question ${index + 1}`,
      option_a: 'Option A',
      option_b: 'Option B',
      option_c: 'Option C',
      option_d: 'Option D',
    }))

    const questionsRequest = createDeferred()
    mockAxios.get.mockReturnValueOnce(questionsRequest.promise)

    render(
      <MemoryRouter>
        <AssessmentPage />
      </MemoryRouter>
    )

    const startButton = screen.getByTestId('assessment-start-button')
    expect(startButton).toBeDisabled()

    fireEvent.click(screen.getByTestId('assessment-level-advanced'))
    expect(startButton).not.toBeDisabled()

    fireEvent.click(startButton)

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/assessment/questions', {
        params: {
          level: 'advanced',
        },
      })
    })

    expect(await screen.findByTestId('assessment-question-generation-loading')).toBeInTheDocument()
    expect(screen.getByText('Creating your question set')).toBeInTheDocument()
    expect(screen.getByText('Matching questions to your selected level...')).toBeInTheDocument()
    expect(screen.getByTestId('assessment-start-button')).toBeDisabled()
    expect(screen.getByTestId('assessment-start-button')).toHaveTextContent('Creating questions...')
    expect(screen.getByTestId('assessment-level-advanced')).toBeDisabled()

    await act(async () => {
      questionsRequest.resolve({
        data: {
          questions,
          selected_question_ids: questions.map(question => question.id),
          assessment_level: 'advanced',
          generation_source: 'openrouter',
          question_set_token: 'signed-token',
        },
      })
      await questionsRequest.promise
    })

    expect(await screen.findByTestId('assessment-generation-source')).toHaveTextContent('Generated question set')
    expect(screen.getByText('Advanced question set across all AI readiness domains')).toBeInTheDocument()
  })
})
