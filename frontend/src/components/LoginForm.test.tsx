import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LoginForm } from './LoginForm'

describe('LoginForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should render email and password inputs', () => {
    render(<LoginForm onSuccess={() => {}} />)

    expect(screen.getByTestId('login-email-input')).toBeInTheDocument()
    expect(screen.getByTestId('login-password-input')).toBeInTheDocument()
  })

  it('should render submit button', () => {
    render(<LoginForm onSuccess={() => {}} />)

    expect(screen.getByTestId('login-submit-button')).toBeInTheDocument()
    expect(screen.getByTestId('login-submit-button')).toHaveTextContent('Log In')
  })

  it('should call onSuccess after successful login', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ userId: 'user123', username: 'testuser' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<LoginForm onSuccess={onSuccess} />)

    await user.type(screen.getByTestId('login-email-input'), 'test@example.com')
    await user.type(screen.getByTestId('login-password-input'), 'password123')
    await user.click(screen.getByTestId('login-submit-button'))

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      })
    )
    expect(onSuccess).toHaveBeenCalled()
  })

  it('should display error message on failed login', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Invalid credentials' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<LoginForm onSuccess={() => {}} />)

    await user.type(screen.getByTestId('login-email-input'), 'test@example.com')
    await user.type(screen.getByTestId('login-password-input'), 'wrongpassword')
    await user.click(screen.getByTestId('login-submit-button'))

    expect(await screen.findByTestId('login-error')).toHaveTextContent('Invalid credentials')
  })

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup()
    let resolveLogin: (value: unknown) => void
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve
    })
    const mockFetch = vi.fn().mockReturnValue(loginPromise)
    vi.stubGlobal('fetch', mockFetch)

    render(<LoginForm onSuccess={() => {}} />)

    await user.type(screen.getByTestId('login-email-input'), 'test@example.com')
    await user.type(screen.getByTestId('login-password-input'), 'password123')
    await user.click(screen.getByTestId('login-submit-button'))

    expect(screen.getByTestId('login-submit-button')).toBeDisabled()

    resolveLogin!({ ok: true, json: () => Promise.resolve({}) })
  })
})
