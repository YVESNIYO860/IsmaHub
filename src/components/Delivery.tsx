const deliveries = [
  { id: 'DLV-21', customer: 'Jean Bosco', address: 'Kigoma, Huye', status: 'Assigned', fee: 'RWF 3,500' },
  { id: 'DLV-22', customer: 'Nadine Ishimwe', address: 'Musanze, Huye', status: 'On the way', fee: 'RWF 2,000' },
  { id: 'DLV-23', customer: 'Paul Mugenzi', address: 'Kibutare, Huye', status: 'Delivered', fee: 'RWF 5,000' },
]

const Delivery = () => {
  return (
    <div className="dashboard-stack">
      <div className="panel-card">
        <div className="panel-card__header">
          <div>
            <p className="panel-card__eyebrow">Delivery management</p>
            <h2 className="panel-card__title">Route and fulfillment tracking</h2>
          </div>
          <button className="button button--accent">Assign rider</button>
        </div>
      </div>

      <div className="delivery-grid">
        {deliveries.map((delivery) => (
          <div key={delivery.id} className="panel-card">
            <div className="delivery-card__header">
              <h3 className="delivery-card__id">{delivery.id}</h3>
              <span className={`status-pill ${delivery.status === 'Delivered' ? 'status-pill--success' : delivery.status === 'On the way' ? 'status-pill--info' : 'status-pill--warning'}`}>
                {delivery.status}
              </span>
            </div>
            <p className="delivery-card__label">Customer</p>
            <p className="delivery-card__value">{delivery.customer}</p>
            <p className="delivery-card__label">Address</p>
            <p className="delivery-card__value">{delivery.address}</p>
            <p className="delivery-card__label">Delivery fee</p>
            <p className="delivery-card__fee">{delivery.fee}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Delivery
