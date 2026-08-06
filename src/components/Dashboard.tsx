type StatCardProps = {
  label: string
  value: string
  trend: string
  accent: string
}

const StatCard = ({ label, value, trend, accent }: StatCardProps) => (
  <div className="stat-card">
    <div className="stat-card__header">
      <p className="stat-card__label">{label}</p>
      <span className={`status-pill ${accent}`}>
        {trend}
      </span>
    </div>
    <p className="stat-card__value">{value}</p>
  </div>
)

const Dashboard = () => {
  return (
    <div className="dashboard-stack">
      <div className="hero-card">
        <div className="hero-card__content">
          <div>
            <p className="hero-card__eyebrow">ISMAHUB LTD</p>
            <h1 className="hero-card__title">Technology store operations at a glance</h1>
            <p className="hero-card__text">
              Monitor sales, inventory, orders, and deliveries from one secure control center designed for a premium retail workflow.
            </p>
          </div>
          <div className="hero-card__panel">
            <p className="hero-card__panel-label">Today</p>
            <p className="hero-card__panel-value">24 orders • 8 deliveries</p>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Revenue" value="RWF 9.4M" trend="+12%" accent="status-pill--success" />
        <StatCard label="Orders Today" value="24" trend="+8%" accent="status-pill--info" />
        <StatCard label="Delivered" value="18" trend="+6%" accent="status-pill--violet" />
        <StatCard label="Low Stock" value="7 items" trend="Urgent" accent="status-pill--warning" />
      </div>

      <div className="content-grid">
        <div className="panel-card">
          <div className="panel-card__header">
            <div>
              <p className="panel-card__eyebrow">Sales trend</p>
              <h2 className="panel-card__title">Revenue growth</h2>
            </div>
            <button className="button button--accent">View report</button>
          </div>
          <div className="bar-chart">
            {[72, 88, 96, 108, 120, 135].map((height) => (
              <div key={height} className="bar-chart__item">
                <div className="bar-chart__bar" style={{ height: `${height}px` }} />
                <span className="bar-chart__label">W{height % 10}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-card">
          <p className="panel-card__eyebrow">Pending actions</p>
          <ul className="action-list">
            {[
              { title: 'Stock replenishment', detail: '7 products need restock' },
              { title: 'Delivery dispatch', detail: '3 orders ready for pickup' },
              { title: 'Review moderation', detail: '4 customer reviews pending' },
            ].map((item) => (
              <li key={item.title} className="action-list__item">
                <p className="action-list__title">{item.title}</p>
                <p className="action-list__detail">{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
