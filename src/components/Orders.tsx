const orders = [
  { id: 'ORD-1042', customer: 'Aline Uwase', status: 'Paid', total: 'RWF 2,340,000', eta: 'Delivered' },
  { id: 'ORD-1043', customer: 'Eric Ndahiro', status: 'Pending', total: 'RWF 780,000', eta: 'Packing' },
  { id: 'ORD-1044', customer: 'Mina Kayitesi', status: 'In Transit', total: 'RWF 1,120,000', eta: 'On the way' },
]

const Orders = () => {
  return (
    <div className="dashboard-stack">
      <div className="panel-card">
        <div className="panel-card__header">
          <div>
            <p className="panel-card__eyebrow">Orders</p>
            <h2 className="panel-card__title">Customer order pipeline</h2>
          </div>
          <button className="button button--accent">Generate invoice</button>
        </div>
      </div>

      <div className="panel-card panel-card--table">
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
                <th>ETA</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer}</td>
                  <td>
                    <span className={`status-pill ${order.status === 'Paid' ? 'status-pill--success' : order.status === 'Pending' ? 'status-pill--warning' : 'status-pill--info'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.total}</td>
                  <td>{order.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Orders
