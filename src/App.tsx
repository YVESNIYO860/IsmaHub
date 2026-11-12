import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import {
  ArrowRight,
  BatteryCharging,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Headphones,
  HardDrive,
  Heart,
  Keyboard,
  Laptop,
  Monitor,
  Moon,
  Package,
  Printer,
  Router,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  ShoppingCart,
  Star,
  Truck,
  UserRound,
  Sun,
  X,
} from 'lucide-react'
import './App.css'
import logo from './assets/logo(1).png'

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

const productCategories = Array.from(new Set(products.map((product) => product.category)))
const demoCategories = ['Networking Gear', 'Storage', 'Printers', 'Power Backup']
const categories = Array.from(new Set([...productCategories, ...demoCategories]))
const productBrands = Array.from(new Set(products.map((product) => product.brand)))

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(value)

function ProductCard({ product }: { product: typeof products[number] }) {
  const isOutOfStock = product.stockTone === 'out-stock'
  const stockLabel = isOutOfStock
    ? 'Out of stock'
    : product.stockTone === 'low-stock'
      ? 'Only 1 left'
      : 'In stock'
  const message = isOutOfStock
    ? `When will ${product.name} be back in stock?`
    : product.name
  const whatsappUrl = `https://wa.me/250788201604?text=${encodeURIComponent(message)}`

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <a className="product-image-link" href={`#product/${product.id}`} aria-label={`View ${product.name}`}>
          {product.image ? (
            <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
          ) : (
            <span className="product-image-placeholder" role="img" aria-label={product.name} />
          )}
        </a>
        <span className="product-category-label">{product.category}</span>
      </div>
      <div className="card-body">
        <p className={`product-stock-status ${product.stockTone}`}>
          <span className="product-stock-dot" aria-hidden="true" />
          {stockLabel}
        </p>
        <h4 className="product-card-name">
          <a className="product-title-link" href={`#product/${product.id}`}>{product.name}</a>
        </h4>
        <p className="product-key-specs">
          {[product.specs.processor, product.specs.memory, product.specs.storage].filter(Boolean).join(' / ')}
        </p>
        <div className="product-card-divider" />
        <div className="product-card-bottom">
          <div className="product-card-prices">
            <p className="product-card-price">
              {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(product.price)} RWF
            </p>
            <p className="product-card-price-meta">
              <del>{new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(product.originalPrice)} RWF</del>
              <span>-{product.discount}%</span>
            </p>
            <p className="product-card-warranty">{product.specs.warranty}</p>
          </div>
          <a
            className={`product-card-order ${isOutOfStock ? 'is-out-of-stock' : ''}`}
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {isOutOfStock ? 'Ask for restock date' : 'Order on WhatsApp'}
          </a>
        </div>
      </div>
    </article>
  )
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = window.localStorage.getItem('ismahub-theme')
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedBrand, setSelectedBrand] = useState('All')
  const [priceLimit, setPriceLimit] = useState(1500000)
  const [availability, setAvailability] = useState('All')
  const [rating, setRating] = useState(0)
  const [sortBy, setSortBy] = useState('featured')
  const [selectedProduct, setSelectedProduct] = useState(products[0])
  const [heroIndex, setHeroIndex] = useState(0)
  const [isHeaderCompact, setIsHeaderCompact] = useState(false)
  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const filtersToggleRef = useRef<HTMLButtonElement>(null)
  const filtersCloseRef = useRef<HTMLButtonElement>(null)
  const [cartItems, setCartItems] = useState<number[]>([])
  const [favorites, setFavorites] = useState<number[]>([])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('ismahub-theme', theme)
  }, [theme])

  useEffect(() => {
    if (window.location.pathname === '/' && window.location.hash === '#home') {
      window.history.replaceState(null, '', '/home')
    }
  }, [])

  useEffect(() => {
    const updateHeaderSize = () => setIsHeaderCompact(window.scrollY > 24)

    updateHeaderSize()
    window.addEventListener('scroll', updateHeaderSize, { passive: true })
    return () => window.removeEventListener('scroll', updateHeaderSize)
  }, [])

  useEffect(() => {
    if (!isFiltersOpen) return

    const previousOverflow = document.body.style.overflow
    const filtersToggle = filtersToggleRef.current
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFiltersOpen(false)
    }

    filtersCloseRef.current?.focus()
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
      filtersToggle?.focus()
    }
  }, [isFiltersOpen])

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

  useEffect(() => {
    const syncProductRoute = () => {
      const match = window.location.hash.match(/^#product\/(\d+)$/)
      const product = match ? products.find((item) => item.id === Number(match[1])) : undefined

      if (product) {
        setSelectedProduct(product)
        setPageView('product')
      } else {
        setPageView((currentView) => currentView === 'product' ? 'home' : currentView)
      }
    }

    syncProductRoute()
    window.addEventListener('hashchange', syncProductRoute)
    return () => window.removeEventListener('hashchange', syncProductRoute)
  }, [])

  const viewCartPage = () => {
    setActivePanel('none')
    setPageView('cart')
  }

  const viewFavoritesPage = () => {
    setActivePanel('none')
    setPageView('favorites')
  }

  const navigateHome = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    if (window.location.pathname !== '/home' || window.location.hash) {
      window.history.pushState(null, '', '/home')
    }
    setPageView('home')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const viewProductPage = (product: typeof products[number]) => {
    setSelectedProduct(product)
    setPageView('product')
    if (window.location.hash !== `#product/${product.id}`) {
      window.location.hash = `product/${product.id}`
    }
  }

  const returnToShop = () => {
    setPageView('home')
    if (window.location.hash.startsWith('#product/')) {
      window.location.hash = 'shop'
    }
  }

  const selectCategory = (category: string) => {
    setSelectedCategory(category)
    setPageView('home')
    window.location.hash = 'shop'
  }

  const selectBrand = (brand: string) => {
    setSelectedBrand(brand)
    setSelectedCategory('All')
    setPageView('home')
    setIsBrandMenuOpen(false)
    window.location.hash = 'shop'
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

  const groupedProducts = categories
    .map((category) => ({
      category,
      products: filteredProducts.filter((product) => product.category === category),
    }))
    .filter((group) => group.products.length > 0)

  return (
    <div className="app-shell" data-theme={theme}>
      <div className="announcement-bar">
        <div className="container announcement-content">
          <span>🚚 Free delivery offers on selected orders</span>
          <span>📞 +250 788 201 604</span>
          <span>✉ ismahub99@gmail.com</span>
        </div>
      </div>

      <header className={`site-header ${isHeaderCompact ? 'is-compact' : ''}`} id="home">
        <div className="container header-inner">
          <div className="header-top-row">
            <a className="brand-box" href="/home" onClick={navigateHome}>
              <img src={logo} alt="ISMAHUB logo" className="brand-logo" />
              <div>
                <p className="brand-kicker">ISMAHUB</p>
                <h1 className="brand-title">Your Hub For Quality Goods</h1>
              </div>
            </a>

            <div className="header-actions">
            <button
              className="icon-button theme-toggle"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              aria-pressed={theme === 'dark'}
              onClick={() => setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
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
            </div>
          </div>

          <form
            className="header-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              window.location.hash = 'shop'
            }}
          >
            <Search size={20} aria-hidden="true" />
            <input
              id="header-search"
              type="search"
              aria-label="Search products"
              placeholder="Search products"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="submit" aria-label="Search products">
              <Search size={18} aria-hidden="true" />
            </button>
          </form>

          <nav className="main-nav" aria-label="Primary navigation">
            <div className="category-nav-list" role="group" aria-label="Categories">
              {categories.map((category) => {
              const CategoryIcon = category === 'Laptops'
                ? Laptop
                : category === 'Displays'
                  ? Monitor
                  : category === 'Audio'
                    ? Headphones
                    : category === 'Accessories'
                      ? Keyboard
                      : category === 'Networking Gear'
                        ? Router
                        : category === 'Storage'
                          ? HardDrive
                          : category === 'Printers'
                            ? Printer
                            : category === 'Power Backup'
                              ? BatteryCharging
                              : Package

              return (
                <button
                  key={category}
                  type="button"
                  className={`category-nav-link ${selectedCategory === category ? 'active' : ''}`}
                  aria-current={selectedCategory === category ? 'true' : undefined}
                  onClick={() => selectCategory(category)}
                >
                  <CategoryIcon size={20} aria-hidden="true" />
                  <span>{category}</span>
                </button>
              )
              })}
            </div>
            <div
              className="brand-nav-group"
              data-open={isBrandMenuOpen}
              onPointerEnter={() => setIsBrandMenuOpen(true)}
              onPointerLeave={() => setIsBrandMenuOpen(false)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setIsBrandMenuOpen(false)
                  event.currentTarget.querySelector('button')?.blur()
                }
              }}
            >
              <button
                type="button"
                className={`category-nav-link brand-nav-trigger ${selectedBrand !== 'All' ? 'active' : ''}`}
                aria-haspopup="menu"
                aria-expanded={isBrandMenuOpen}
                aria-controls="header-brand-menu"
                onClick={() => setIsBrandMenuOpen(true)}
              >
                <span>Brands</span>
                <ChevronDown size={16} aria-hidden="true" />
              </button>
              <span className="brand-nav-label">Brands</span>
              <div className="brand-menu-list" id="header-brand-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className={selectedBrand === 'All' ? 'selected' : ''}
                  onClick={() => selectBrand('All')}
                >
                  All brands
                </button>
                {productBrands.map((brand) => (
                  <button
                    type="button"
                    role="menuitem"
                    key={brand}
                    className={selectedBrand === brand ? 'selected' : ''}
                    onClick={() => selectBrand(brand)}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          </nav>
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
                        <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
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
                      <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
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
            <button className="button button-secondary small" onClick={returnToShop}>
              Back to shop
            </button>
          </div>
        )}

        {pageView === 'home' && (
          <>
            <section className="hero-section reveal-on-scroll">
              <div className="hero-copy hero-copy-minimal">
                <p className="eyebrow">Curated tech essentials</p>
                <h2 className="hero-slogan">Your hub of quality goods.</h2>
                <div className="hero-actions">
                  <a href="#shop" className="button button-primary">
                    Explore collection <ArrowRight size={18} />
                  </a>
                </div>
              </div>

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
                      <img className="carousel-card-image" src={product.image} alt={product.name} loading="lazy" decoding="async" />
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

              <div className="hero-panel hero-poster-panel">
                <img className="hero-panel-image" src={activeHeroProduct.image} alt={activeHeroProduct.name} decoding="async" />
                <div className="hero-panel-content">
                  <p className="eyebrow">Selected product</p>
                  <h3>{activeHeroProduct.name}</h3>
                  <p>{formatCurrency(activeHeroProduct.price)}</p>
                </div>
              </div>
          </section>

        <section className={`section-block reveal-on-scroll ${isFiltersOpen ? 'filters-open' : ''}`} id="shop">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Featured products</p>
              <h3>Discover best sellers and standout picks</h3>
            </div>
            <button
              type="button"
              className="filters-toggle"
              ref={filtersToggleRef}
              aria-expanded={isFiltersOpen}
              aria-controls="product-filters"
              onClick={() => setIsFiltersOpen(true)}
            >
              <SlidersHorizontal size={17} aria-hidden="true" />
              Filters
            </button>
          </div>

          <div className="shop-layout">
            <div className="catalog-groups">
              {groupedProducts.map(({ category, products: categoryProducts }) => (
                <section className="catalog-category" key={category} aria-labelledby={`category-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                  <h4 className="catalog-category-title" id={`category-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{category}</h4>
                  <div className="product-grid">
                    {categoryProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div
              className={`filters-overlay ${isFiltersOpen ? 'is-open' : ''}`}
              role={isFiltersOpen ? 'dialog' : undefined}
              aria-modal={isFiltersOpen || undefined}
              aria-labelledby={isFiltersOpen ? 'filters-title' : undefined}
              onClick={(event) => {
                if (event.target === event.currentTarget) setIsFiltersOpen(false)
              }}
            >
              <div className="filters-dialog">
                <div className="filters-dialog-header">
                  <h4 id="filters-title">Filters</h4>
                  <button
                    type="button"
                    className="filters-close"
                    ref={filtersCloseRef}
                    aria-label="Close filters"
                    onClick={() => setIsFiltersOpen(false)}
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>
                <aside className="filters-card" id="product-filters">
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
                  {categories.map((category) => (
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
                  {productBrands.map((brand) => (
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
                <button type="button" className="button button-primary small filters-apply" onClick={() => setIsFiltersOpen(false)}>
                  Apply filters
                </button>
              </div>
                </aside>
              </div>
            </div>
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
                      <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
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
                    <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
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
                  <ProductCard key={`${product.id}-arrival`} product={product} />
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
              <img src={selectedProduct.gallery[0]} alt={selectedProduct.name} className="detail-main-image" loading="lazy" decoding="async" />
              <div className="detail-thumbs">
                {selectedProduct.gallery.map((image, index) => (
                  <img key={`${selectedProduct.id}-${index}`} src={image} alt={`${selectedProduct.name} view ${index + 1}`} loading="lazy" decoding="async" />
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
                  <button className="button button-primary" onClick={() => addToCart(selectedProduct.id)}>Add to cart</button>
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
            <a href="/home" onClick={navigateHome}>Home</a>
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
                <img src={item.image} alt={item.name} loading="lazy" decoding="async" />
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
