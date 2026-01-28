import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext'

// Test component that exposes auth context
function TestComponent({ onAuth }: { onAuth?: (auth: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth()
  onAuth?.(auth)
  return (
    <div>
      <span data-testid="loading">{auth.isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="authenticated">{auth.isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="user">{auth.user?.username || 'none'}</span>
      <button onClick={() => auth.login('testuser', 'password')}>Login</button>
      <button onClick={() => auth.logout()}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  const mockFetch = vi.fn()
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = mockFetch
    localStorage.clear()
    mockFetch.mockReset()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('starts with loading state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Should start as loading
    expect(screen.getByTestId('loading').textContent).toBe('loading')

    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('ready')
    })
  })

  it('checks auth state on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ userId: '1', username: 'testuser', displayName: 'Test', createdAt: '2024-01-01' }),
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('yes')
      expect(screen.getByTestId('user').textContent).toBe('testuser')
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/me'),
      expect.objectContaining({ credentials: 'include' })
    )
  })

  it('handles login successfully', async () => {
    const user = userEvent.setup()

    // Initial auth check fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('ready')
    })

    // Setup login response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ userId: '1', username: 'testuser', displayName: 'Test', createdAt: '2024-01-01' }),
    })

    await user.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('yes')
      expect(screen.getByTestId('user').textContent).toBe('testuser')
    })

    // Check localStorage was updated
    expect(localStorage.getItem('twitter_net_auth')).not.toBeNull()
  })

  it('handles logout', async () => {
    const user = userEvent.setup()

    // Initial auth check succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ userId: '1', username: 'testuser', displayName: 'Test', createdAt: '2024-01-01' }),
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('yes')
    })

    // Setup logout response
    mockFetch.mockResolvedValueOnce({
      ok: true,
    })

    await user.click(screen.getByText('Logout'))

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('no')
      expect(screen.getByTestId('user').textContent).toBe('none')
    })

    // Check localStorage was cleared
    expect(localStorage.getItem('twitter_net_auth')).toBeNull()
  })

  it('persists auth state in localStorage', async () => {
    // Pre-populate localStorage
    localStorage.setItem('twitter_net_auth', JSON.stringify({
      userId: '1',
      username: 'cacheduser',
      displayName: 'Cached',
      createdAt: '2024-01-01'
    }))

    // Server confirms the session is still valid
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ userId: '1', username: 'cacheduser', displayName: 'Cached', createdAt: '2024-01-01' }),
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Should immediately show cached user while verifying
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('cacheduser')
    })
  })

  it('throws error when useAuth is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })
})
