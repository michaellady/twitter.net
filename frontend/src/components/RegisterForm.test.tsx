import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RegisterForm } from './RegisterForm'

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should render username, email, and password inputs', () => {
    render(<RegisterForm onSuccess={() => {}} />)

    expect(screen.getByTestId('register-username-input')).toBeInTheDocument()
    expect(screen.getByTestId('register-email-input')).toBeInTheDocument()
    expect(screen.getByTestId('register-password-input')).toBeInTheDocument()
  })

  it('should render submit button', () => {
    render(<RegisterForm onSuccess={() => {}} />)

    expect(screen.getByTestId('register-submit-button')).toBeInTheDocument()
    expect(screen.getByTestId('register-submit-button')).toHaveTextContent('Sign Up')
  })

  it('should call onSuccess after successful registration', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ userId: 'user123', username: 'newuser' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<RegisterForm onSuccess={onSuccess} />)

    await user.type(screen.getByTestId('register-username-input'), 'newuser')
    await user.type(screen.getByTestId('register-email-input'), 'new@example.com')
    await user.type(screen.getByTestId('register-password-input'), 'password123')
    await user.click(screen.getByTestId('register-submit-button'))

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/register'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
        }),
      })
    )
    expect(onSuccess).toHaveBeenCalled()
  })

  it('should display error message on failed registration', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: 'Username already taken' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<RegisterForm onSuccess={() => {}} />)

    await user.type(screen.getByTestId('register-username-input'), 'existinguser')
    await user.type(screen.getByTestId('register-email-input'), 'test@example.com')
    await user.type(screen.getByTestId('register-password-input'), 'password123')
    await user.click(screen.getByTestId('register-submit-button'))

    expect(await screen.findByTestId('register-error')).toHaveTextContent('Username already taken')
  })

  it('should validate password minimum length', async () => {
    const user = userEvent.setup()

    render(<RegisterForm onSuccess={() => {}} />)

    await user.type(screen.getByTestId('register-username-input'), 'newuser')
    await user.type(screen.getByTestId('register-email-input'), 'new@example.com')
    await user.type(screen.getByTestId('register-password-input'), 'short')
    await user.click(screen.getByTestId('register-submit-button'))

    expect(await screen.findByTestId('register-error')).toHaveTextContent('Password must be at least 8 characters')
  })

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup()
    let resolveRegister: (value: unknown) => void
    const registerPromise = new Promise((resolve) => {
      resolveRegister = resolve
    })
    const mockFetch = vi.fn().mockReturnValue(registerPromise)
    vi.stubGlobal('fetch', mockFetch)

    render(<RegisterForm onSuccess={() => {}} />)

    await user.type(screen.getByTestId('register-username-input'), 'newuser')
    await user.type(screen.getByTestId('register-email-input'), 'new@example.com')
    await user.type(screen.getByTestId('register-password-input'), 'password123')
    await user.click(screen.getByTestId('register-submit-button'))

    expect(screen.getByTestId('register-submit-button')).toBeDisabled()

    resolveRegister!({ ok: true, json: () => Promise.resolve({}) })
  })
})
