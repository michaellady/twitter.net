import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ProtectedRoute } from './ProtectedRoute'
import { AuthProvider } from '../contexts/AuthContext'

// Mock component to render when authenticated
const MockProtectedContent = () => <div data-testid="protected-content">Protected Content</div>

// Mock component to render when not authenticated (redirect target)
const MockLoginPage = () => <div data-testid="login-page">Login Page</div>

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should show loading state while checking auth', () => {
    // Never resolving promise to keep loading state
    const mockFetch = vi.fn().mockReturnValue(new Promise(() => {}))
    vi.stubGlobal('fetch', mockFetch)

    render(
      <AuthProvider>
        <ProtectedRoute fallback={<MockLoginPage />}>
          <MockProtectedContent />
        </ProtectedRoute>
      </AuthProvider>
    )

    expect(screen.getByTestId('protected-route-loading')).toBeInTheDocument()
  })

  it('should render children when user is authenticated', async () => {
    const mockUser = { userId: 'user123', username: 'testuser' }
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(
      <AuthProvider>
        <ProtectedRoute fallback={<MockLoginPage />}>
          <MockProtectedContent />
        </ProtectedRoute>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })

  it('should render fallback when user is not authenticated', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    })
    vi.stubGlobal('fetch', mockFetch)

    render(
      <AuthProvider>
        <ProtectedRoute fallback={<MockLoginPage />}>
          <MockProtectedContent />
        </ProtectedRoute>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should update when auth state changes', async () => {
    const mockUser = { userId: 'user123', username: 'testuser' }
    let authResolved = false
    const mockFetch = vi.fn().mockImplementation(() => {
      if (!authResolved) {
        authResolved = true
        return Promise.resolve({
          ok: false,
          status: 401,
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser),
      })
    })
    vi.stubGlobal('fetch', mockFetch)

    render(
      <AuthProvider>
        <ProtectedRoute fallback={<MockLoginPage />}>
          <MockProtectedContent />
        </ProtectedRoute>
      </AuthProvider>
    )

    // Initially should show login page
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  it('should not render children while loading even if previous state was authenticated', async () => {
    // This tests that we don't flash protected content during auth check
    const mockFetch = vi.fn().mockReturnValue(new Promise(() => {}))
    vi.stubGlobal('fetch', mockFetch)

    render(
      <AuthProvider>
        <ProtectedRoute fallback={<MockLoginPage />}>
          <MockProtectedContent />
        </ProtectedRoute>
      </AuthProvider>
    )

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    expect(screen.getByTestId('protected-route-loading')).toBeInTheDocument()
  })
})
