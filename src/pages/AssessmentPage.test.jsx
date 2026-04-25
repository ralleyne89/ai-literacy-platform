import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import AssessmentPage, { PENDING_ASSESSMENT_SUBMISSION_KEY } from './AssessmentPage'

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
        version: '2026-03-03-randomized-v1',
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
})
