import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import CourseViewerPage from './CourseViewerPage'

const mockAuthState = vi.hoisted(() => ({
  user: {
    id: 'user-123',
  },
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

const renderCourseViewer = () => render(
  <MemoryRouter initialEntries={['/training/modules/module-elements-of-ai/learn']}>
    <Routes>
      <Route path="/training/modules/:moduleId/learn" element={<CourseViewerPage />} />
    </Routes>
  </MemoryRouter>
)

describe('CourseViewerPage', () => {
  beforeEach(() => {
    mockAuthState.user = { id: 'user-123' }
    mockAxios.get.mockReset()
    mockAxios.post.mockReset()
  })

  it('shows a partner-site handoff instead of an empty lesson viewer for external modules', async () => {
    mockAxios.get.mockResolvedValue({
      data: {
        module: {
          id: 'module-elements-of-ai',
          title: 'Elements of AI',
          external_url: 'https://www.elementsofai.com/',
          routing: {
            is_external: true,
            route_type: 'external_detail',
          },
        },
        lessons: [],
        module_progress: {
          progress_percentage: 0,
        },
      },
    })

    renderCourseViewer()

    expect(await screen.findByTestId('course-viewer-empty-module')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'This course lives on the partner site' })).toBeInTheDocument()
    expect(screen.getByTestId('course-viewer-empty-external-link'))
      .toHaveAttribute('href', 'https://www.elementsofai.com/')
    expect(screen.getByTestId('course-viewer-empty-detail-link'))
      .toHaveAttribute('href', '/training/modules/module-elements-of-ai')
  })
})
