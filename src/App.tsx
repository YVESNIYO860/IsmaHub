import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Headphones,
  Heart,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  UserRound,
} from 'lucide-react'
import './App.css'
import logo from './assets/logo(1).png'

const navItems = [
  { href: '#home', label: 'Home' },
  { href: '#shop', label: 'Shop' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
]

const brands = ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Samsung', 'Canon', 'Epson']

const features = [
  { title: 'Fast Delivery', text: 'Same-day dispatch and doorstep delivery options across Rwanda.', icon: Truck },
  { title: 'Genuine Products', text: 'Every device is sourced from trusted suppliers and backed by warranty.', icon: ShieldCheck },
  { title: 'Secure Payments', text: 'Flexible, protected checkout with support for mobile and card payments.', icon: CreditCard },
  { title: 'Customer Support', text: 'Talk to our tech specialists for product guidance and setup help.', icon: Headphones },
]

const reviews = [
  {
    name: 'Aline M.',
    role: 'Operations Lead',
    text: 'The ordering experience felt effortless and the delivery timeline was impressive.',
    rating: 5,
  },
  {
    name: 'Eric N.',
    role: 'Creative Director',
    text: 'The product quality and quick support made this our preferred tech vendor.',
    rating: 5,
  },
]

const products = [
  {
    id: 1,
    name: 'MacBook Air M3',
    brand: 'Apple',
    category: 'Laptops',
    price: 1299000,
    originalPrice: 1499000,
    discount: 13,
    stock: 'In Stock',
    stockTone: 'in-stock',
    rating: 5,
    reviewCount: 124,
    isNew: true,
    isFlash: true,
    image:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
    ],
    specs: {
      processor: 'Apple M3',
      memory: '16GB',
      storage: '512GB SSD',
      warranty: '1 year',
    },
  },
  {
    id: 2,
    name: 'Dell UltraSharp Monitor',
    brand: 'Dell',
    category: 'Displays',
    price: 549000,
    originalPrice: 649000,
    discount: 15,
    stock: 'Low Stock',
    stockTone: 'low-stock',
    rating: 4,
    reviewCount: 82,
    isNew: false,
    isFlash: false,
    image:
      'https://images.unsplash.com/photo-1527443156517-0b9d5f4f0c4d?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1527443156517-0b9d5f4f0c4d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1527443156517-0b9d5f4f0c4d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1527443156517-0b9d5f4f0c4d?auto=format&fit=crop&w=900&q=80',
    ],
    specs: {
      processor: '4K IPS',
      memory: '8GB',
      storage: 'N/A',
      warranty: '2 years',
    },
  },
  {
    id: 3,
    name: 'Sony WH-1000XM5 Headset',
    brand: 'Sony',
    category: 'Audio',
    price: 399000,
    originalPrice: 479000,
    discount: 17,
    stock: 'In Stock',
    stockTone: 'in-stock',
    rating: 5,
    reviewCount: 57,
    isNew: true,
    isFlash: false,
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    ],
    specs: {
      processor: 'Noise Canceling',
      memory: '30hr battery',
      storage: 'USB-C',
      warranty: '1 year',
    },
  },
  {
    id: 4,
    name: 'Ergonomic Wireless Keyboard',
    brand: 'Logitech',
    category: 'Accessories',
    price: 89000,
    originalPrice: 119000,
    discount: 25,
    stock: 'Out of Stock',
    stockTone: 'out-stock',
    rating: 4,
    reviewCount: 31,
    isNew: false,
    isFlash: true,
    image:
      'https://images.unsplash.com/photo-1541140532154-b024d705b90a?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1541140532154-b024d705b90a?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1541140532154-b024d705b90a?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1541140532154-b024d705b90a?auto=format&fit=crop&w=900&q=80',
    ],
    specs: {
      processor: 'Bluetooth',
      memory: '2x AAA',
      storage: 'Compact',
      warranty: '2 years',
    },
  },
]

const recentViews = [
  { name: 'Canon PIXMA Printer', price: 'RWF 219,000', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80' },
  { name: 'HP EliteBook', price: 'RWF 999,000', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80' },
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(value)

function App() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedBrand, setSelectedBrand] = useState('All')
  const [priceLimit, setPriceLimit] = useState(1500000)
  const [availability, setAvailability] = useState('All')
  const [rating, setRating] = useState(0)
  const [sortBy, setSortBy] = useState('featured')
  const [selectedProduct, setSelectedProduct] = useState(products[0])
  const [heroIndex, setHeroIndex] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [cartItems, setCartItems] = useState<number[]>([])
  const [favorites, setFavorites] = useState<number[]>([])

  const heroProducts = products.slice(0, 3)
  const activeHeroProduct = heroProducts[heroIndex]

  const moveHero = (direction: 'prev' | 'next') => {
    setHeroIndex((currentIndex) => {
      const nextIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1
      return (nextIndex + heroProducts.length) % heroProducts.length
    })
  }

  const selectHeroProduct = (product: typeof products[number], index: number) => {
    setSelectedProduct(product)
    setHeroIndex(index)
  }

  const addToCart = (productId: number) => {
    setCartItems((items) => [...items, productId])
  }

  const toggleFavorite = (productId: number) => {
    setFavorites((items) =>
      items.includes(productId) ? items.filter((id) => id !== productId) : [...items, productId],
    )
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('All')
    setSelectedBrand('All')
    setPriceLimit(1500000)
    setAvailability('All')
    setRating(0)
    setSortBy('featured')
  }

  const [activePanel, setActivePanel] = useState<'none' | 'cart' | 'favorites'>('none')
  const [pageView, setPageView] = useState<'home' | 'cart' | 'favorites' | 'product'>('home')

  const viewCartPage = () => {
    setActivePanel('none')
    setPageView('cart')
  }

  const viewFavoritesPage = () => {
    setActivePanel('none')
    setPageView('favorites')
  }

  const viewProductPage = (product: typeof products[number]) => {
    setSelectedProduct(product)
    setPageView('product')
  }

  const cartProducts = useMemo(() => {
    const items: Array<{ product: typeof products[number]; quantity: number }> = []
    cartItems.forEach((productId) => {
      const product = products.find((item) => item.id === productId)
      if (!product) return
      const existing = items.find((entry) => entry.product.id === product.id)
      if (existing) existing.quantity += 1
      else items.push({ product, quantity: 1 })
    })
    return items
  }, [cartItems])

  const favoriteProducts = useMemo(
    () => products.filter((product) => favorites.includes(product.id)),
    [favorites],
  )

  const cartTotal = cartProducts.reduce((sum, entry) => sum + entry.product.price * entry.quantity, 0)

  const removeFromCart = (productId: number) => {
    setCartItems((items) => items.filter((id) => id !== productId))
  }

  const removeFromFavorites = (productId: number) => {
    setFavorites((items) => items.filter((id) => id !== productId))
  }

  const isFavorite = (productId: number) => favorites.includes(productId)

  const cartCount = cartItems.length
  const favoriteCount = favorites.length

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          }
        })
      },
      { threshold: 0.14 },
    )

    document.querySelectorAll('.reveal-on-scroll').forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [])

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()

    const result = products.filter((product) => {
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.brand.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term)
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
      const matchesBrand = selectedBrand === 'All' || product.brand === selectedBrand
      const matchesPrice = product.price <= priceLimit
      const matchesAvailability = availability === 'All' || product.stock === availability
      const matchesRating = rating === 0 || product.rating >= rating

      return matchesSearch && matchesCategory && matchesBrand && matchesPrice && matchesAvailability && matchesRating
    })

    return result.sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price
      if (sortBy === 'popularity') return b.reviewCount - a.reviewCount
      if (sortBy === 'newest') return Number(b.isNew) - Number(a.isNew)
      return b.rating - a.rating
    })
  }, [availability, priceLimit, rating, search, selectedBrand, selectedCategory, sortBy])

  return (
    <div className="app-shell">
      <div className="announcement-bar">
        <div className="container announcement-content">
          <span>🚚 Free delivery offers on selected orders</span>
          <span>📞 +250 788 201 604</span>
          <span>✉ ismahub99@gmail.com</span>
        </div>
      </div>

      <header className="site-header" id="home">
        <div className="container header-inner">
          <a className="brand-box" href="#home">
            <img src={logo} alt="ISMAHUB logo" className="brand-logo" />
            <div>
              <p className="brand-kicker">ISMAHUB</p>
              <h1 className="brand-title">Your Hub For Quality Goods</h1>
            </div>
          </a>

          <nav className="main-nav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="nav-link">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="header-actions">
            <button className="icon-button" aria-label="Search">
              <Search size={18} />
            </button>
            <button className="icon-button" aria-label="Favorites" onClick={() => setActivePanel(activePanel === 'favorites' ? 'none' : 'favorites')}>
              <Heart size={18} />
              {favoriteCount > 0 && <span className="icon-badge">{favoriteCount}</span>}
            </button>
            <button className="icon-button" aria-label="Cart" onClick={() => setActivePanel(activePanel === 'cart' ? 'none' : 'cart')}>
              <ShoppingCart size={18} />
              {cartCount > 0 && <span className="icon-badge">{cartCount}</span>}
            </button>
            <button className="login-button">
              <UserRound size={18} />
              Login / Register
            </button>
            <button className="menu-button" aria-label="Menu" onClick={() => setIsMenuOpen((open) => !open)}>
              <Menu size={18} />
            </button>
          </div>
          {isMenuOpen && (
            <div className="mobile-nav-overlay" role="dialog" aria-modal="true">
              <div className="mobile-nav-panel">
                <button className="mobile-nav-close" onClick={() => setIsMenuOpen(false)} aria-label="Close menu">
                  ✕
                </button>
                <nav className="mobile-nav-links" aria-label="Mobile navigation">
                  {navItems.map((item) => (
                    <a key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)}>
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          )}
        </div>
      </header>

      {activePanel !== 'none' && (
        <div className="panel-overlay" role="dialog" aria-modal="true" onClick={() => setActivePanel('none')}>
          <div className="panel-card" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">{activePanel === 'cart' ? 'Shopping cart' : 'Favorites'}</p>
                <h2>{activePanel === 'cart' ? `Cart (${cartCount})` : `Favorites (${favoriteCount})`}</h2>
              </div>
              <button className="panel-close" onClick={() => setActivePanel('none')} aria-label="Close panel">
                ✕
              </button>
            </div>

            <div className="panel-content">
              {activePanel === 'cart' ? (
                cartProducts.length > 0 ? (
                  <>
                    {cartProducts.map(({ product, quantity }) => (
                      <div className="panel-item" key={product.id}>
                        <img src={product.image} alt={product.name} />
                        <div className="panel-item-info">
                          <strong>{product.name}</strong>
                          <span>{product.brand}</span>
                          <span>{quantity} × {formatCurrency(product.price)}</span>
                        </div>
                        <button className="button button-secondary small" onClick={() => removeFromCart(product.id)}>
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="panel-footer">
                      <p className="panel-total">Total: {formatCurrency(cartTotal)}</p>
                      <button className="button button-primary" onClick={viewCartPage}>Checkout</button>
                    </div>
                  </>
                ) : (
                  <p className="panel-empty">Your cart is empty. Add a product from the shop to see it here.</p>
                )
              ) : favoriteProducts.length > 0 ? (
                <>
                  {favoriteProducts.map((product) => (
                    <div className="panel-item" key={product.id}>
                      <img src={product.image} alt={product.name} />
                      <div className="panel-item-info">
                        <strong>{product.name}</strong>
                        <span>{product.brand}</span>
                        <span>{formatCurrency(product.price)}</span>
                      </div>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <button className="button button-primary small" onClick={() => viewProductPage(product)}>
                          View product
                        </button>
                        <button className="button button-secondary small" onClick={() => removeFromFavorites(product.id)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="panel-footer">
                    <button className="button button-primary" onClick={viewFavoritesPage}>
                      View favorites
                    </button>
                  </div>
                </>
              ) : (
                <p className="panel-empty">No favorites yet. Tap the heart icon on a product to save it here.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="page-shell">
        {pageView !== 'home' && (
          <div className="page-action-bar">
            <button className="button button-secondary small" onClick={() => setPageView('home')}>
              Back to shop
            </button>
          </div>
        )}

        {pageView === 'home' && (
          <>
            <section className="hero-section reveal-on-scroll">
              <div className="hero-copy hero-copy-minimal">
            <p className="eyebrow">Curated tech essentials</p>
            <div className="hero-carousel">
              <button className="carousel-nav prev" onClick={() => moveHero('prev')} aria-label="Previous product">
                <ChevronLeft size={20} />
              </button>
              <div className="carousel-track">
                {heroProducts.map((product, index) => (
                  <button
                    type="button"
                    key={product.id}
                    className={`carousel-card ${index === heroIndex ? 'active' : ''}`}
                    onClick={() => selectHeroProduct(product, index)}
                  >
                    <div className="carousel-card-image" style={{ backgroundImage: `url(${product.image})` }} />
                    <div className="carousel-card-info">
                      <strong>{product.name}</strong>
                      <span>{formatCurrency(product.price)}</span>
                    </div>
                  </button>
                ))}
              </div>
              <button className="carousel-nav next" onClick={() => moveHero('next')} aria-label="Next product">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="hero-actions">
              <a href="#shop" className="button button-primary">
                Explore collection <ArrowRight size={18} />
              </a>
            </div>
          </div>

          <div className="hero-panel hero-poster-panel">
            <div className="hero-panel-image" style={{ backgroundImage: `url(${activeHeroProduct.image})` }} />
            <div className="hero-panel-content">
              <p className="eyebrow">Selected product</p>
              <h3>{activeHeroProduct.name}</h3>
              <p>{formatCurrency(activeHeroProduct.price)}</p>
            </div>
          </div>
        </section>

        <section className="section-block reveal-on-scroll" id="shop">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Featured products</p>
              <h3>Discover best sellers and standout picks</h3>
            </div>
          </div>

          <div className="shop-layout">
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image-wrap">
                    <img src={product.image} alt={product.name} />
                    {product.discount > 0 ? <span className="discount-badge">-{product.discount}%</span> : null}
                    {product.isNew ? <span className="new-badge">New</span> : null}
                    <div className="product-overlay">
                      <button className="icon-button ghost" aria-label="Favorite" onClick={() => toggleFavorite(product.id)}>
                        <Heart size={16} fill={isFavorite(product.id) ? '#dc2626' : 'none'} color={isFavorite(product.id) ? '#dc2626' : undefined} />
                      </button>
                      <button className="icon-button ghost" aria-label="Quick view" onClick={() => setSelectedProduct(product)}>
                        <Search size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <p className="product-brand">{product.brand}</p>
                    <h4>{product.name}</h4>
                    <div className="rating-row">
                      <div className="stars">
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star key={`${product.id}-${index}`} size={15} className={index < Math.round(product.rating) ? 'star-filled' : ''} />
                        ))}
                      </div>
                      <span>{product.reviewCount} reviews</span>
                    </div>
                    <div className="price-row">
                      <div>
                        <p className="price">{formatCurrency(product.price)}</p>
                        <p className="original-price">{formatCurrency(product.originalPrice)}</p>
                      </div>
                      <span className={`stock-badge ${product.stockTone}`}>{product.stock}</span>
                    </div>
                    <div className="card-actions">
                      <button className="button button-primary small" onClick={() => addToCart(product.id)}>
                        Add to cart
                      </button>
                      <button className="button button-secondary small" onClick={() => viewProductPage(product)}>
                        Quick view
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="filters-card">
              <div className="filter-group">
                <label htmlFor="search">Search</label>
                <div className="filter-input">
                  <Search size={16} />
                  <input id="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" />
                </div>
              </div>
              <div className="filter-group">
                <label htmlFor="category">Category</label>
                <select id="category" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                  <option value="All">All</option>
                  {Array.from(new Set(products.map((product) => product.category))).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="brand">Brand</label>
                <select id="brand" value={selectedBrand} onChange={(event) => setSelectedBrand(event.target.value)}>
                  <option value="All">All</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="price">Price up to {formatCurrency(priceLimit)}</label>
                <input id="price" type="range" min="50000" max="1500000" step="50000" value={priceLimit} onChange={(event) => setPriceLimit(Number(event.target.value))} />
              </div>
              <div className="filter-group">
                <label htmlFor="availability">Availability</label>
                <select id="availability" value={availability} onChange={(event) => setAvailability(event.target.value)}>
                  <option value="All">All</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="rating">Minimum rating</label>
                <select id="rating" value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                  <option value={0}>Any</option>
                  <option value={4}>4 stars +</option>
                  <option value={5}>5 stars</option>
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="sort">Sort by</label>
                <select id="sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price">Price</option>
                  <option value="popularity">Popularity</option>
                </select>
              </div>
              <div className="filter-group filter-actions">
                <button type="button" className="button button-secondary small" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            </aside>
          </div>
        </section>
          </>
        )}

        {pageView === 'cart' && (
          <section className="section-block reveal-on-scroll">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Your cart</p>
                <h3>Review items before checkout</h3>
              </div>
            </div>
            <div className="panel-content">
              {cartProducts.length > 0 ? (
                <>
                  {cartProducts.map(({ product, quantity }) => (
                    <div className="panel-item" key={product.id}>
                      <img src={product.image} alt={product.name} />
                      <div className="panel-item-info">
                        <strong>{product.name}</strong>
                        <span>{product.brand}</span>
                        <span>{quantity} × {formatCurrency(product.price)}</span>
                      </div>
                      <button className="button button-secondary small" onClick={() => removeFromCart(product.id)}>
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="panel-footer">
                    <p className="panel-total">Total: {formatCurrency(cartTotal)}</p>
                    <button className="button button-primary">Continue to checkout</button>
                  </div>
                </>
              ) : (
                <p className="panel-empty">Your cart is empty. Add a product from the shop to see it here.</p>
              )}
            </div>
          </section>
        )}

        {pageView === 'favorites' && (
          <section className="section-block reveal-on-scroll">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Favorites</p>
                <h3>Your saved products</h3>
              </div>
            </div>
            <div className="panel-content">
              {favoriteProducts.length > 0 ? (
                favoriteProducts.map((product) => (
                  <div className="panel-item" key={product.id}>
                    <img src={product.image} alt={product.name} />
                    <div className="panel-item-info">
                      <strong>{product.name}</strong>
                      <span>{product.brand}</span>
                      <span>{product.stock}</span>
                    </div>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <button className="button button-primary small" onClick={() => viewProductPage(product)}>
                        View product
                      </button>
                      <button className="button button-secondary small" onClick={() => removeFromFavorites(product.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="panel-empty">No favorites yet. Tap the heart icon on a product to save it here.</p>
              )}
            </div>
          </section>
        )}

        {pageView === 'home' && (
          <>
            <section className="section-block reveal-on-scroll">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">New arrivals</p>
                  <h3>Fresh releases and latest arrivals</h3>
                </div>
              </div>
              <div className="product-grid compact-grid">
                {products.filter((product) => product.isNew).map((product) => (
                  <article className="product-card" key={`${product.id}-arrival`}>
                    <div className="product-image-wrap">
                      <img src={product.image} alt={product.name} />
                    </div>
                    <div className="card-body">
                      <p className="product-brand">{product.brand}</p>
                      <h4>{product.name}</h4>
                      <p className="price">{formatCurrency(product.price)}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="section-block reveal-on-scroll">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Flash deals</p>
                  <h3>Limited-time offers you do not want to miss</h3>
                </div>
              </div>
              <div className="deal-banner">
                <div>
                  <p className="eyebrow">Today only</p>
                  <h3>Save up to 25% on premium accessories and displays.</h3>
                </div>
                <div className="deal-timer">
                  <Clock3 size={18} />
                  <span>Ends in 04:32:11</span>
                </div>
              </div>
            </section>

            <section className="section-block reveal-on-scroll">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Top brands</p>
                  <h3>Trusted names with exceptional quality</h3>
                </div>
              </div>
              <div className="brand-grid">
                {brands.map((brand) => (
                  <div className="brand-card" key={brand}>
                    <p>{brand}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="section-block reveal-on-scroll">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Why choose us</p>
                  <h3>Simple support and dependable quality</h3>
                </div>
              </div>
              <div className="feature-grid">
                {features.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <article className="feature-card" key={feature.title}>
                      <div className="feature-icon">
                        <Icon size={20} />
                      </div>
                      <h4>{feature.title}</h4>
                      <p>{feature.text}</p>
                    </article>
                  )
                })}
              </div>
            </section>

            <section className="section-block reveal-on-scroll">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Customer reviews</p>
                  <h3>What our shoppers are saying</h3>
                </div>
              </div>
              <div className="review-grid">
                {reviews.map((review) => (
                  <article className="review-card" key={review.name}>
                    <div className="review-stars">
                      {Array.from({ length: review.rating }, (_, index) => (
                        <Star key={`${review.name}-${index}`} size={16} className="star-filled" />
                      ))}
                    </div>
                    <p>“{review.text}”</p>
                    <div className="review-meta">
                      <strong>{review.name}</strong>
                      <span>{review.role}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="newsletter-section reveal-on-scroll">
              <div>
                <p className="eyebrow">Newsletter</p>
                <h3>Get update alerts on new releases and exclusive offers.</h3>
              </div>
              <div className="newsletter-form">
                <input type="email" placeholder="Enter your email" />
                <button className="button button-primary">Subscribe</button>
              </div>
            </section>
          </>
        )}

        {pageView === 'product' && (
          <section className="detail-section reveal-on-scroll">
            <div className="detail-gallery">
              <img src={selectedProduct.gallery[0]} alt={selectedProduct.name} className="detail-main-image" />
              <div className="detail-thumbs">
                {selectedProduct.gallery.map((image, index) => (
                  <img key={`${selectedProduct.id}-${index}`} src={image} alt={`${selectedProduct.name} view ${index + 1}`} />
                ))}
              </div>
            </div>

            <div className="detail-content" id="about">
              <p className="eyebrow">Product details</p>
              <h3>{selectedProduct.name}</h3>
              <p>
                A refined device designed for daily productivity, smooth multitasking, and premium portability with dependable support.
              </p>
              <div className="detail-meta">
                <span className="meta-pill">{selectedProduct.brand}</span>
                <span className="meta-pill">{selectedProduct.category}</span>
                <span className="meta-pill">{selectedProduct.stock}</span>
              </div>
              <div className="detail-pricing">
                <div>
                  <p className="price">{formatCurrency(selectedProduct.price)}</p>
                  <p className="original-price">{formatCurrency(selectedProduct.originalPrice)}</p>
                </div>
                <div className="detail-actions">
                  <button className="button button-primary">Add to cart</button>
                  <button className="button button-secondary">Buy now</button>
                </div>
              </div>
              <table className="spec-table">
                <tbody>
                  <tr>
                    <th>Processor</th>
                    <td>{selectedProduct.specs.processor}</td>
                  </tr>
                  <tr>
                    <th>Memory</th>
                    <td>{selectedProduct.specs.memory}</td>
                  </tr>
                  <tr>
                    <th>Storage</th>
                    <td>{selectedProduct.specs.storage}</td>
                  </tr>
                  <tr>
                    <th>Warranty</th>
                    <td>{selectedProduct.specs.warranty}</td>
                  </tr>
                </tbody>
              </table>
              <div className="delivery-card">
                <div className="delivery-icon">
                  <Package size={18} />
                </div>
                <div>
                  <h4>Estimated delivery</h4>
                  <p>Delivery window: 2-4 business days. Express delivery is available for select areas.</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer" id="contact">
        <div className="container footer-grid">
          <div>
            <div className="footer-logo">
              <img src={logo} alt="ISMAHUB logo" />
              <div>
                <p className="footer-title">ISMAHUB</p>
                <p>Quality tech, fast delivery</p>
              </div>
            </div>
            <p>Premium tech for homes, startups, and growing businesses.</p>
            <p>📍 Huye, Rwanda</p>
            <p>📞 +250 788 201 604</p>
            <p>✉ ismahub99@gmail.com</p>
          </div>
          <div>
            <p className="footer-title">Quick links</p>
            <a href="#home">Home</a>
            <a href="#shop">Shop</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </div>
          <div>
            <p className="footer-title">Top categories</p>
            <span>Laptops</span>
            <span>Displays</span>
            <span>Audio</span>
            <span>Accessories</span>
          </div>
          <div>
            <p className="footer-title">Recently viewed</p>
            {recentViews.map((item) => (
              <div className="recent-item" key={item.name}>
                <img src={item.image} alt={item.name} />
                <div>
                  <p>{item.name}</p>
                  <span>{item.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="container footer-bottom">
          <p>© 2026 ISMAHUB. All rights reserved.</p>
          <div className="footer-legal">
            <p>Built for modern shopping, fast delivery, and reliable support.</p>
            <a href="#contact">Terms & Conditions</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
