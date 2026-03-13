import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock the API client so no real HTTP calls are made
vi.mock('../api/client', () => ({
  fetchAPI: vi.fn(),
  safeJson: vi.fn(),
  setAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
  isAuthenticated: vi.fn(() => false),
}))

// Mock the auth API module which calls fetchAPI internally
vi.mock('../api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
  forgotPassword: vi.fn(),
}))

// Mock useNavigate so we don't need a full router context
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Provide a minimal AuthProvider context around Login
vi.mock('../hooks/useAuth.jsx', () => ({
  useAuth: vi.fn(() => ({
    login: vi.fn(),
    register: vi.fn(),
    user: null,
    loading: false,
    isAuthenticated: false,
    logout: vi.fn(),
  })),
  AuthProvider: ({ children }) => children,
}))

import { useAuth } from '../hooks/useAuth.jsx'

// ── Helper ────────────────────────────────────────────────────────────────────

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockReset()
  })

  it('renders email input, password input, and submit button', () => {
    renderLogin()

    // The login form shows email and password fields in login mode by default
    const emailInput = screen.getByPlaceholderText('you@example.com')
    const passwordInput = screen.getByPlaceholderText('Your password')
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    expect(emailInput).toBeInTheDocument()
    expect(passwordInput).toBeInTheDocument()
    expect(submitButton).toBeInTheDocument()

    expect(emailInput).toHaveAttribute('type', 'email')
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('calls login with correct email and password on valid submission', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ user: { email: 'test@example.com' } })
    useAuth.mockReturnValue({
      login: mockLogin,
      register: vi.fn(),
      user: null,
      loading: false,
      isAuthenticated: false,
      logout: vi.fn(),
    })

    renderLogin()

    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Your password'), 'mypassword123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'mypassword123')
    })

    // On success, should navigate to root
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('shows an error message when login fails with 401', async () => {
    const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid email or password'))
    useAuth.mockReturnValue({
      login: mockLogin,
      register: vi.fn(),
      user: null,
      loading: false,
      isAuthenticated: false,
      logout: vi.fn(),
    })

    renderLogin()

    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('you@example.com'), 'bad@example.com')
    await user.type(screen.getByPlaceholderText('Your password'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    // The error div should appear with the error message
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })

    // Should NOT navigate away
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
