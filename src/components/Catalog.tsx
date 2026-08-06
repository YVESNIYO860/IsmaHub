const inventory = [
  {
    name: 'Dell Latitude 7440',
    category: 'Laptops',
    price: 'RWF 1,450,000',
    stock: '23 in stock',
    status: 'Available',
  },
  {
    name: 'HP ProDesk 600 G6',
    category: 'Desktop Computers',
    price: 'RWF 980,000',
    stock: '8 in stock',
    status: 'Low stock',
  },
  {
    name: 'Samsung Galaxy S24',
    category: 'Smartphones',
    price: 'RWF 1,180,000',
    stock: '15 in stock',
    status: 'Available',
  },
  {
    name: 'TP-Link Omada Switch',
    category: 'Networking Equipment',
    price: 'RWF 320,000',
    stock: '0 in stock',
    status: 'Out of stock',
  },
]

const Catalog = () => {
  return (
    <div className="dashboard-stack">
      <div className="panel-card">
        <div className="panel-card__header">
          <div>
            <p className="panel-card__eyebrow">Catalog</p>
            <h2 className="panel-card__title">Product management overview</h2>
          </div>
          <div className="action-row">
            <button className="button button--secondary">Filter</button>
            <button className="button button--accent">Add product</button>
          </div>
        </div>
      </div>

      <div className="catalog-grid">
        {inventory.map((item) => (
          <div key={item.name} className="panel-card">
            <div className="catalog-card__header">
              <div>
                <p className="catalog-card__category">{item.category}</p>
                <h3 className="catalog-card__name">{item.name}</h3>
              </div>
              <span className={`status-pill ${item.status === 'Out of stock' ? 'status-pill--danger' : item.status === 'Low stock' ? 'status-pill--warning' : 'status-pill--success'}`}>
                {item.status}
              </span>
            </div>
            <div className="catalog-card__footer">
              <div>
                <p className="catalog-card__label">Price</p>
                <p className="catalog-card__value">{item.price}</p>
              </div>
              <div className="catalog-card__stock">
                <p className="catalog-card__label">Stock</p>
                <p className="catalog-card__value">{item.stock}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Catalog
