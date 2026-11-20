import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, Moon, Sun, UserRound } from 'lucide-react'
import logo from '../assets/logo(1).png'
import './CustomerAccount.css'

type CustomerUser = {
  id: string
  email?: string | null
  full_name?: string | null
}

type ApiFailure = {
  error?: string
}

type AccountMode = 'login' | 'signup'
type AccountTheme = 'light' | 'dark'

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  const payload = await response.json().catch(() => ({})) as T & ApiFailure
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status}).`)
  return payload
}

function getSavedTheme(): AccountTheme {
  const savedTheme = window.localStorage.getItem('ismahub-customer-theme')
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function CustomerAccount() {
  const [theme, setTheme] = useState<AccountTheme>(getSavedTheme)
  const [mode, setMode] = useState<AccountMode>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [user, setUser] = useState<CustomerUser | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    window.localStorage.setItem('ismahub-customer-theme', theme)
  }, [theme])

  useEffect(() => {
    let active = true
    requestJson<{ authenticated: boolean; user?: CustomerUser }>('/api/customer-auth/session')
      .then((result) => {
        if (active && result.authenticated && result.user) setUser(result.user)
      })
      .catch((sessionError: unknown) => {
        if (active && sessionError instanceof Error && sessionError.message !== 'Authentication required.') {
          setError(sessionError.message)
        }
      })
      .finally(() => {
        if (active) setIsCheckingSession(false)
      })
    return () => {
      active = false
    }
  }, [])

  const changeMode = (nextMode: AccountMode) => {
    setMode(nextMode)
    setError('')
    setNotice('')
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setNotice('')
    try {
      if (mode === 'signup') {
        const result = await requestJson<{ authenticated: boolean; confirmation_required?: boolean; user?: CustomerUser }>(
          '/api/customer-auth/signup',
          {
            method: 'POST',
            body: JSON.stringify({ full_name: fullName, email, password }),
          },
        )
        if (result.authenticated && result.user) {
          setUser(result.user)
          setPassword('')
        } else if (result.confirmation_required) {
          setNotice('If your account can be created, a confirmation link will be sent to your email. Confirm it before signing in.')
          setPassword('')
        }
      } else {
        const result = await requestJson<{ user: CustomerUser }>('/api/customer-auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        setUser(result.user)
        setPassword('')
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to continue.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const logout = async () => {
    setError('')
    try {
      await requestJson('/api/customer-auth/logout', { method: 'POST' })
      setUser(null)
      setMode('login')
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'Unable to sign out.')
    }
  }

  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  const ThemeIcon = theme === 'dark' ? Sun : Moon

  if (isCheckingSession) {
    return (
      <main className={`customer-account customer-theme-${theme}`} aria-live="polite">
        <p className="customer-account-loading">Loading your account…</p>
      </main>
    )
  }

  return (
    <main className={`customer-account customer-theme-${theme}`}>
      <header className="customer-account-header">
        <a className="customer-account-back" href="/">
          <ArrowLeft size={17} aria-hidden="true" />
          <span>Back to store</span>
        </a>
        <button
          type="button"
          className="customer-theme-toggle"
          onClick={() => setTheme(nextTheme)}
          aria-label={`Switch to ${nextTheme} mode`}
          title={`Switch to ${nextTheme} mode`}
        >
          <ThemeIcon size={17} aria-hidden="true" />
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </header>

      <section className="customer-account-card" aria-labelledby="customer-account-title">
        <a className="customer-account-brand" href="/" aria-label="IsmaHub storefront">
          <img src={logo} alt="" className="customer-account-brand-logo" />
          <span className="customer-account-brand-name">ISMAHUB</span>
        </a>

        {user ? (
          <div className="customer-signed-in">
            <p className="customer-account-eyebrow">CUSTOMER ACCOUNT</p>
            <h1 id="customer-account-title">You’re signed in</h1>
            <p className="customer-account-copy">Your customer account is ready.</p>
            <div className="customer-account-identity">
              <strong>{user.full_name || user.email || 'Customer'}</strong>
              {user.email && <span>{user.email}</span>}
            </div>
            {error && <p className="customer-account-error" role="alert">{error}</p>}
            <a className="customer-account-primary" href="/">Continue shopping</a>
            <button type="button" className="customer-account-signout" onClick={() => void logout()}>
              Sign out
            </button>
          </div>
        ) : (
          <>
            <div className="customer-account-heading">
              <p className="customer-account-eyebrow">CUSTOMER ACCOUNT</p>
              <h1 id="customer-account-title">{mode === 'login' ? 'Sign in' : 'Create your account'}</h1>
              <p className="customer-account-copy">
                {mode === 'login' ? 'Sign in with your email and password.' : 'Enter your details to get started.'}
              </p>
            </div>

            <div className="customer-account-tabs" role="group" aria-label="Account options">
              <button
                type="button"
                aria-pressed={mode === 'login'}
                className={mode === 'login' ? 'is-active' : ''}
                onClick={() => changeMode('login')}
              >
                Sign in
              </button>
              <button
                type="button"
                aria-pressed={mode === 'signup'}
                className={mode === 'signup' ? 'is-active' : ''}
                onClick={() => changeMode('signup')}
              >
                Create account
              </button>
            </div>

            <form className="customer-account-form" onSubmit={(event) => void submit(event)}>
              {mode === 'signup' && (
                <label className="customer-account-field">
                  <span>Full name</span>
                  <div className="customer-account-input">
                    <UserRound size={17} aria-hidden="true" />
                    <input
                      type="text"
                      autoComplete="name"
                      required
                      maxLength={120}
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                </label>
              )}
              <label className="customer-account-field">
                <span>Email address</span>
                <div className="customer-account-input">
                  <Mail size={17} aria-hidden="true" />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </label>
              <label className="customer-account-field">
                <span>Password</span>
                <div className="customer-account-input">
                  <LockKeyhole size={17} aria-hidden="true" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    minLength={8}
                    maxLength={128}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    className="customer-password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              {error && <p className="customer-account-error" role="alert">{error}</p>}
              {notice && <p className="customer-account-notice" role="status">{notice}</p>}
              <button type="submit" className="customer-account-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>
          </>
        )}

        <footer className="customer-account-footer">
          <span>Staff member?</span>
          <a href="/admin">Staff sign in</a>
        </footer>
      </section>
    </main>
  )
}
