import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Boxes,
  Briefcase,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  LayoutDashboard,
  LogOut,
  LockKeyhole,
  Mail,
  Menu,
  Moon,
  Package,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Tags,
  Truck,
  UserRound,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import logo from '../assets/logo(1).png'
import ProductManagement from './ProductManagement'
import './ManagementLayout.css'

type DashboardData = {
  pending_orders: number
  pending_quotations: number
  active_products: number
  open_purchase_orders: number
  low_stock_products: number
  damaged_units: number
  today_pos_sales: number
}

type ApiFailure = {
  error?: string
}

type StaffTheme = 'light' | 'dark'

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.read' },
  { label: 'Products', icon: Package, permission: 'product.read' },
  { label: 'Categories', icon: Tags, permission: 'category.manage' },
  { label: 'Brands', icon: Briefcase, permission: 'brand.manage' },
  { label: 'Inventory', icon: Boxes, permission: 'inventory.read' },
  { label: 'Stock transfers', icon: ArrowLeftRight, permission: 'inventory.transfer' },
  { label: 'Damaged stock', icon: ShieldCheck, permission: 'inventory.adjust' },
  { label: 'Orders', icon: ClipboardList, permission: 'order.read' },
  { label: 'POS', icon: CreditCard, permission: 'pos.manage' },
  { label: 'Quotations', icon: FileText, permission: 'quotation.manage' },
  { label: 'Customers', icon: Users, permission: 'customer.manage' },
  { label: 'Suppliers', icon: Truck, permission: 'purchase.read' },
  { label: 'Purchase orders', icon: ClipboardList, permission: 'purchase.read' },
  { label: 'Deliveries', icon: Truck, permission: 'purchase.receive' },
  { label: 'Supplier payments', icon: Wallet, permission: 'purchase.pay' },
  { label: 'Returns', icon: RotateCcw, permission: 'return.manage' },
  { label: 'Expenses', icon: Wallet, permission: 'expense.manage' },
  { label: 'Financial reports', icon: BarChart3, permission: 'profit.read' },
  { label: 'Staff management', icon: Users, permission: 'staff.read' },
  { label: 'Settings', icon: Settings, permission: 'finance.manage' },
]

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function ManagementLayout() {
  const [theme, setTheme] = useState<StaffTheme>(() => {
    const savedTheme = window.localStorage.getItem('ismahub-staff-theme')
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [activePage, setActivePage] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [navigationSearch, setNavigationSearch] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [pageError, setPageError] = useState('')
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    window.localStorage.setItem('ismahub-staff-theme', theme)
  }, [theme])

  const filteredNavigation = useMemo(() => {
    const term = navigationSearch.trim().toLowerCase()
    return navigation.filter((item) => item.label.toLowerCase().includes(term))
  }, [navigationSearch])

  const loadDashboard = async () => {
    setPageError('')
    try {
      const result = await requestJson<{ dashboard: DashboardData }>('/api/admin/dashboard')
      setDashboard(result.dashboard)
    } catch (error) {
      setDashboard(null)
      setPageError(error instanceof Error ? error.message : 'Unable to load dashboard data.')
    }
  }

  useEffect(() => {
    let active = true
    requestJson<{ authenticated: boolean; user?: { email?: string } }>('/api/auth/session')
      .then((result) => {
        if (!active) return
        setIsAuthenticated(result.authenticated)
        setUserEmail(result.user?.email || '')
        if (result.authenticated) void loadDashboard()
      })
      .catch(() => {
        if (active) setIsAuthenticated(false)
      })
      .finally(() => {
        if (active) setIsCheckingSession(false)
      })
    return () => {
      active = false
    }
  }, [])

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setLoginError('')
    try {
      const result = await requestJson<{ user: { email?: string } }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setIsAuthenticated(true)
      setUserEmail(result.user.email || email)
      setPassword('')
      await loadDashboard()
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const logout = async () => {
    try {
      await requestJson('/api/auth/logout', { method: 'POST' })
    } finally {
      setIsAuthenticated(false)
      setUserEmail('')
      setDashboard(null)
    }
  }

  const selectPage = (label: string) => {
    setActivePage(label)
    setSidebarOpen(false)
    setPageError('')
    if (label === 'Dashboard' && isAuthenticated) void loadDashboard()
  }

  if (isCheckingSession) {
    return (
      <main className="staff-loading" aria-live="polite">
        <span className="staff-loading-mark"><LayoutDashboard size={22} /></span>
        <p>Loading secure staff workspace…</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className={`staff-login-page staff-theme-${theme}`}>
        <header className="staff-login-topbar">
          <a className="staff-login-back" href="/">
            <span className="staff-login-back-icon">←</span> Storefront
          </a>
          <ThemeToggle theme={theme} onToggle={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')} />
        </header>
        <div className="staff-login-shell">
          <section className="staff-login-card" aria-labelledby="staff-login-title">
            <div className="staff-login-brand">
              <img src={logo} alt="" className="staff-login-logo" />
              <span><strong>ISMAHUB</strong><small>STAFF PORTAL</small></span>
            </div>
            <div className="staff-login-card-heading">
              <p className="staff-eyebrow">STAFF ACCESS</p>
              <h1 id="staff-login-title">Staff sign in</h1>
              <p className="staff-login-copy">Use your staff account to continue.</p>
            </div>
            <form onSubmit={submitLogin} className="staff-login-form">
              <div className="staff-login-field">
                <label htmlFor="staff-email">Email address</label>
                <div className="staff-login-input-wrap">
                  <Mail size={17} aria-hidden="true" />
                  <input id="staff-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@ismahub.com" />
                </div>
              </div>
              <div className="staff-login-field">
                <label htmlFor="staff-password">Password</label>
                <div className="staff-login-input-wrap">
                  <LockKeyhole size={17} aria-hidden="true" />
                  <input id="staff-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
                  <button type="button" className="staff-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              {loginError && <p className="staff-error" role="alert">{loginError}</p>}
              <button type="submit" className="staff-primary-button staff-login-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign in to workspace'}
              </button>
            </form>
            <p className="staff-login-footnote">
              Customer account? <a href="/account">Sign in or create an account</a>
            </p>
            <p className="staff-login-account-note">Staff accounts are created by an authorized administrator.</p>
          </section>
        </div>
      </main>
    )
  }

  const activeNavigation = navigation.find((item) => item.label === activePage) || navigation[0]
  const ActiveIcon = activeNavigation.icon

  return (
    <div className={`staff-app staff-theme-${theme} ${sidebarCollapsed ? 'staff-sidebar-collapsed' : ''}`}>
      {sidebarOpen && <button className="staff-mobile-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`staff-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="staff-brand">
          <a href="/admin" className="staff-brand-mark" aria-label="IsmaHub dashboard"><LayoutDashboard size={22} /></a>
          <span className="staff-brand-copy"><strong>ISMAHUB</strong><small>RETAIL OPERATIONS</small></span>
          <button type="button" className="staff-sidebar-close" aria-label="Close navigation" onClick={(event) => { event.preventDefault(); setSidebarOpen(false) }}>
            <X size={18} />
          </button>
        </div>
        <a className="staff-store-link" href="/">
          <span className="staff-store-dot" />
          <span>Best Retailer <small>Huye, Rwanda</small></span>
          <ChevronDown size={15} />
        </a>
        <label className="staff-nav-search">
          <Search size={16} />
          <input value={navigationSearch} onChange={(event) => setNavigationSearch(event.target.value)} placeholder="Find a section" aria-label="Find a dashboard section" />
          <kbd>⌘ K</kbd>
        </label>
        <nav className="staff-navigation" aria-label="Management sections">
          <p className="staff-nav-heading">WORKSPACE</p>
          {filteredNavigation.map((item) => {
            const Icon = item.icon
            return (
              <button
                type="button"
                key={item.label}
                title={sidebarCollapsed ? item.label : undefined}
                className={`staff-nav-item ${activePage === item.label ? 'is-active' : ''}`}
                onClick={() => selectPage(item.label)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.label === 'Orders' && dashboard?.pending_orders ? <small>{dashboard.pending_orders}</small> : null}
              </button>
            )
          })}
        </nav>
        <div className="staff-sidebar-bottom">
          <div className="staff-profile">
            <span className="staff-avatar"><UserRound size={17} /></span>
            <span className="staff-profile-copy"><strong>{userEmail || 'Staff member'}</strong><small>Authenticated staff</small></span>
            <button type="button" title="Sign out" aria-label="Sign out" onClick={() => void logout()}><LogOut size={17} /></button>
          </div>
        </div>
      </aside>

      <div className="staff-main">
        <header className="staff-topbar">
          <div className="staff-topbar-leading">
            <button type="button" className="staff-mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <button type="button" className="staff-collapse-button" aria-label="Collapse sidebar" onClick={() => setSidebarCollapsed((value) => !value)}><Menu size={19} /></button>
            <div className="staff-breadcrumb"><span>Workspace</span><b>/</b><strong>{activePage}</strong></div>
          </div>
          <div className="staff-topbar-actions">
            <a className="staff-view-store" href="/">View storefront</a>
            <ThemeToggle theme={theme} onToggle={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')} />
            <button type="button" className="staff-notification-button" aria-label="Notifications are not configured"><Bell size={18} /><i /></button>
            <span className="staff-topbar-avatar"><UserRound size={17} /></span>
          </div>
        </header>

        <main className="staff-content">
          <div className="staff-page-heading">
            <div>
              <p className="staff-eyebrow">Best Retailer · Huye</p>
              <h1>{activePage}</h1>
              <p>
                {activePage === 'Dashboard'
                  ? 'A current view of store activity from your connected backend.'
                  : activePage === 'Products'
                    ? 'Manage your catalog, pricing, and product availability.'
                    : `Manage ${activePage.toLowerCase()} in your retail workspace.`}
              </p>
            </div>
            {activePage === 'Dashboard' && (
              <button type="button" className="staff-secondary-button" onClick={() => void loadDashboard()}>
                Refresh overview
              </button>
            )}
          </div>

          {activePage === 'Dashboard' ? (
            <>
              {pageError && <div className="staff-error-banner" role="alert">{pageError}. Confirm migrations and dashboard permissions are configured.</div>}
              <section className="staff-metrics-grid" aria-label="Store overview">
                <MetricCard label="POS sales today" value={dashboard ? formatCurrency(Number(dashboard.today_pos_sales)) : '—'} icon={CreditCard} detail="RWF · today" />
                <MetricCard label="Pending orders" value={dashboard ? String(dashboard.pending_orders) : '—'} icon={ClipboardList} detail="Awaiting processing" />
                <MetricCard label="Active products" value={dashboard ? String(dashboard.active_products) : '—'} icon={Package} detail="Published in catalog" />
                <MetricCard label="Low-stock products" value={dashboard ? String(dashboard.low_stock_products) : '—'} icon={Boxes} detail="At or below 5 available" />
              </section>
              <section className="staff-dashboard-grid">
                <article className="staff-panel staff-sales-panel">
                  <div className="staff-panel-heading">
                    <div><p className="staff-eyebrow">PERFORMANCE</p><h2>Sales overview</h2></div>
                    <span className="staff-panel-period">Today</span>
                  </div>
                  {dashboard ? (
                    <div className="staff-sales-summary">
                      <strong>{formatCurrency(Number(dashboard.today_pos_sales))}</strong>
                      <span>POS sales recorded today</span>
                      <div className="staff-chart-placeholder">
                        Historical sales chart is not connected yet.
                      </div>
                    </div>
                  ) : <EmptyState title="Sales data unavailable" detail="Sign in with dashboard access and ensure the administration migration is applied." />}
                </article>
                <article className="staff-panel">
                  <div className="staff-panel-heading">
                    <div><p className="staff-eyebrow">ATTENTION</p><h2>Store alerts</h2></div>
                    <span className="staff-alert-indicator">{dashboard ? dashboard.low_stock_products + dashboard.open_purchase_orders + dashboard.damaged_units : '—'}</span>
                  </div>
                  {dashboard ? (
                    <div className="staff-alert-list">
                      <AlertRow title="Low stock" detail={`${dashboard.low_stock_products} products need a stock check`} />
                      <AlertRow title="Purchase orders" detail={`${dashboard.open_purchase_orders} orders remain open`} />
                      <AlertRow title="Damaged units" detail={`${dashboard.damaged_units} units recorded as damaged`} />
                    </div>
                  ) : <EmptyState title="Alerts unavailable" detail="Dashboard data will appear when the API is accessible." />}
                </article>
              </section>
              <section className="staff-dashboard-grid staff-dashboard-grid-bottom">
                <article className="staff-panel">
                  <div className="staff-panel-heading">
                    <div><p className="staff-eyebrow">WORK QUEUE</p><h2>Needs attention</h2></div>
                  </div>
                  {dashboard ? (
                    <div className="staff-work-queue">
                      <WorkItem label="Customer orders" value={dashboard.pending_orders} />
                      <WorkItem label="Quotations awaiting response" value={dashboard.pending_quotations} />
                      <WorkItem label="Open purchase orders" value={dashboard.open_purchase_orders} />
                    </div>
                  ) : <EmptyState title="No dashboard data" detail="The dashboard endpoint did not return operational data." />}
                </article>
                <article className="staff-panel staff-activity-panel">
                  <div className="staff-panel-heading">
                    <div><p className="staff-eyebrow">RECENT ACTIVITY</p><h2>Transaction activity</h2></div>
                  </div>
                  <EmptyState title="Activity feed not connected" detail="Recent transaction history is not available from the current API yet." />
                </article>
              </section>
            </>
          ) : activePage === 'Products' ? (
            <ProductManagement />
          ) : (
            <section className="staff-panel staff-coming-soon">
              <span className="staff-coming-icon"><ActiveIcon size={22} /></span>
              <p className="staff-eyebrow">SECTION NOT CONNECTED</p>
              <h2>{activePage} interface</h2>
              <p>This section has no connected management API or screen yet. No changes will be saved here.</p>
              <button type="button" className="staff-secondary-button" onClick={() => selectPage('Dashboard')}>Return to dashboard</button>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

function ThemeToggle({ theme, onToggle }: { theme: StaffTheme; onToggle: () => void }) {
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  const Icon = theme === 'dark' ? Sun : Moon
  return (
    <button
      type="button"
      className="staff-theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <Icon size={16} aria-hidden="true" />
      <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}

function MetricCard({ label, value, icon: Icon, detail }: { label: string; value: string; icon: typeof Package; detail: string }) {
  return (
    <article className="staff-metric-card">
      <div className="staff-metric-top"><span>{label}</span><i><Icon size={18} /></i></div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="staff-empty-state"><span><FileText size={18} /></span><strong>{title}</strong><p>{detail}</p></div>
}

function AlertRow({ title, detail }: { title: string; detail: string }) {
  return <div className="staff-alert-row"><span className="staff-alert-icon"><Boxes size={16} /></span><span><strong>{title}</strong><small>{detail}</small></span></div>
}

function WorkItem({ label, value }: { label: string; value: number }) {
  return <div className="staff-work-item"><span>{label}</span><strong>{value}</strong></div>
}
