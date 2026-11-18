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
  LayoutGrid,
  Laptop,
  List,
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
import { storefrontApi, type StorefrontProduct } from './services/storefrontApi'
import ManagementLayout from './components/ManagementLayout'

const features = [
  { title: 'Fast Delivery', text: 'Same-day dispatch and doorstep delivery options across Rwanda.', icon: Truck },
  { title: 'Genuine Products', text: 'Every device is sourced from trusted suppliers and backed by warranty.', icon: ShieldCheck },
  { title: 'Secure Payments', text: 'Flexible, protected checkout with support for mobile and card payments.', icon: CreditCard },
  { title: 'Customer Support', text: 'Talk to our tech specialists for product guidance and setup help.', icon: Headphones },
]

const reviews = [
  {
    name: 'Niyonkuru Yves.',
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

const fallbackProducts = [
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

const productCategories = Array.from(new Set(fallbackProducts.map((product) => product.category)))
const demoCategories = ['Networking Gear', 'Storage', 'Printers', 'Power Backup']
const categories = Array.from(new Set([...productCategories, ...demoCategories]))
const productBrands = Array.from(new Set(fallbackProducts.map((product) => product.brand)))

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(value)

const numericIdFromUuid = (uuid: string) => {
  let hash = 0
  for (let index = 0; index < uuid.length; index += 1) {
    hash = ((hash << 5) - hash + uuid.charCodeAt(index)) | 0
  }
  return Math.abs(hash) + 1000
}

const mapStorefrontProduct = (product: StorefrontProduct) => {
  const images = [...product.product_images]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((image) => image.image_url)
  const primaryImage = images[0] || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80'
  const specs = Object.fromEntries(
    product.product_specifications
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((specification) => [specification.name.toLowerCase(), specification.value]),
  ) as { processor?: string; memory?: string; storage?: string; warranty?: string }
  const price = Number(product.sale_price)
  const originalPrice = product.compare_at_price === null ? price : Number(product.compare_at_price)
  return {
    id: numericIdFromUuid(product.id),
    apiId: product.id,
    name: product.name,
    brand: product.product_brands?.name || 'ISMAHUB',
    category: product.product_categories?.name || 'Other',
    price,
    originalPrice,
    discount: originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0,
    stock: 'Availability on request',
    stockTone: 'availability-unknown',
    rating: 0,
    reviewCount: 0,
    isNew: true,
    isFlash: false,
    image: primaryImage,
    gallery: images.length ? images : [primaryImage],
    specs: {
      processor: specs.processor || 'Not specified',
      memory: specs.memory || 'Not specified',
      storage: specs.storage || 'Not specified',
      warranty: specs.warranty || 'Not specified',
    },
  }
}

function ProductCard({
  product,
  isFavorite,
  onToggleFavorite,
}: {
  product: (typeof fallbackProducts[number]) & { apiId?: string }
  isFavorite: boolean
  onToggleFavorite: (productId: number) => void
}) {
  const isOutOfStock = product.stockTone === 'out-stock'
  const stockLabel = isOutOfStock ? 'Out of stock' : product.stock
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
        {product.discount > 0 && <span className="product-discount-badge">{product.discount}% off</span>}
        <button
          type="button"
          className={`product-favorite-button ${isFavorite ? 'is-favorite' : ''}`}
          aria-label={isFavorite ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(product.id)}
        >
          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </div>
      <div className="card-body">
        <p className="product-card-brand">{product.brand}</p>
        <p className={`product-stock-status ${product.stockTone}`}>
          <span className="product-stock-dot" aria-hidden="true" />
          {stockLabel}
        </p>
        <h4 className="product-card-name">
          <a className="product-title-link" href={`#product/${product.id}`}>{product.name}</a>
        </h4>
        {product.reviewCount > 0 && (
          <p className="product-card-rating" aria-label={`${product.rating} out of 5 stars, ${product.reviewCount} reviews`}>
            <Star size={15} fill="currentColor" aria-hidden="true" />
            <span>{product.rating.toFixed(1)}</span>
            <span className="product-card-review-count">({product.reviewCount} reviews)</span>
          </p>
        )}
        <p className="product-key-specs">
          {[product.specs.processor, product.specs.memory, product.specs.storage].filter(Boolean).join(' / ')}
        </p>
        <div className="product-card-divider" />
        <div className="product-card-bottom">
          <div className="product-card-prices">
            <p className="product-card-price">
              {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(product.price)} RWF
            </p>
            {product.discount > 0 && (
              <p className="product-card-price-meta">
                <del>{new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(product.originalPrice)} RWF</del>
                <span>-{product.discount}%</span>
              </p>
            )}
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
  const [products, setProducts] = useState(fallbackProducts)
  type HealthStatus = {
    status: 'ok' | 'configuration_missing' | 'supabase_unreachable'
    timestamp: string
    configuration: {
      supabase_url: boolean
      supabase_publishable_key: boolean
      supabase_secret_key: boolean
    }
    supabase: { reachable: boolean }
  }
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [healthLoading, setHealthLoading] = useState(false)
  const [healthError, setHealthError] = useState('')
  const [catalogCategories, setCatalogCategories] = useState(categories)
  const [catalogBrands, setCatalogBrands] = useState(productBrands)
  const [storefrontStatus, setStorefrontStatus] = useState<'loading' | 'live' | 'fallback'>('loading')
  const [checkoutName, setCheckoutName] = useState('')
  const [checkoutPhone, setCheckoutPhone] = useState('')
  const [checkoutAddress, setCheckoutAddress] = useState('')
  const [checkoutMessage, setCheckoutMessage] = useState('')
  const [trackingReference, setTrackingReference] = useState('')
  const [trackingPhone, setTrackingPhone] = useState('')
  const [trackingResult, setTrackingResult] = useState<string>('')
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
  const [productView, setProductView] = useState<'grid' | 'list'>('grid')
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(4)
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
    let active = true
    storefrontApi.products()
      .then(({ products: liveProducts }) => {
        if (!active) return
        if (liveProducts.length === 0) return
        const mapped = liveProducts.map(mapStorefrontProduct)
        setProducts(mapped)
        setSelectedProduct(mapped[0])
        setCatalogCategories(Array.from(new Set([
          ...mapped.map((product) => product.category),
          ...demoCategories,
        ])))
        setCatalogBrands(Array.from(new Set(mapped.map((product) => product.brand))))
        setStorefrontStatus('live')
      })
      .catch(() => {
        if (active) setStorefrontStatus('fallback')
      })
    return () => {
      active = false
    }
  }, [])

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
  }, [products])

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

  const [activePanel, setActivePanel] = useState<'none' | 'cart' | 'favorites' | 'health'>('none')
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
  }, [products])

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
  }, [cartItems, products])

  const favoriteProducts = useMemo(
    () => products.filter((product) => favorites.includes(product.id)),
    [favorites, products],
  )

  const cartTotal = cartProducts.reduce((sum, entry) => sum + entry.product.price * entry.quantity, 0)

  const removeFromCart = (productId: number) => {
    setCartItems((items) => items.filter((id) => id !== productId))
  }

  const removeFromFavorites = (productId: number) => {
    setFavorites((items) => items.filter((id) => id !== productId))
  }

  const testSupabaseConnection = async () => {
    setHealthLoading(true)
    setHealthError('')
    try {
      const response = await fetch('/api/health', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })
      const contentType = response.headers.get('content-type') || ''
      const payload = contentType.includes('application/json')
        ? await response.json().catch(() => null) as HealthStatus | null
        : null
      if (!payload) {
        if (response.status === 404) {
          throw new Error('The API route was not found. Start the Vercel API server with npm run dev:api.')
        }
        throw new Error('The health endpoint did not return JSON. Run npm run dev:api on port 3000 and open the Vite site.')
      }
      setHealthStatus(payload)
    } catch (error) {
      setHealthStatus(null)
      setHealthError(error instanceof Error ? error.message : 'Unable to reach the backend.')
    } finally {
      setHealthLoading(false)
    }
  }

  const submitCheckout = async () => {
    if (storefrontStatus !== 'live') {
      setCheckoutMessage('Checkout is available after the live product catalog loads.')
      return
    }
    if (!checkoutName.trim() || !checkoutPhone.trim()) {
      setCheckoutMessage('Enter your name and phone number.')
      return
    }
    const items = cartProducts.flatMap(({ product, quantity }) => {
      if (!('apiId' in product) || typeof product.apiId !== 'string') return []
      return [{ product_id: product.apiId, quantity }]
    })
    if (items.length === 0) {
      setCheckoutMessage('Your cart could not be validated against the live catalog.')
      return
    }
    try {
      setCheckoutMessage('Submitting checkout...')
      const result = await storefrontApi.checkout({
        customer_name: checkoutName,
        phone: checkoutPhone,
        address: checkoutAddress,
        idempotency_key: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `checkout-${Date.now()}`,
        items,
      })
      setCheckoutMessage(`Order created: ${result.order.reference}`)
      setCartItems([])
    } catch (error) {
      setCheckoutMessage(error instanceof Error ? error.message : 'Unable to submit checkout.')
    }
  }

  const submitTracking = async () => {
    if (!trackingReference.trim() || !trackingPhone.trim()) {
      setTrackingResult('Enter both the order reference and phone number.')
      return
    }
    try {
      const result = await storefrontApi.track(trackingReference, trackingPhone)
      setTrackingResult(`${result.order.reference}: ${result.order.status}`)
    } catch (error) {
      setTrackingResult(error instanceof Error ? error.message : 'Unable to track order.')
    }
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
  }, [availability, priceLimit, rating, search, selectedBrand, selectedCategory, sortBy, products])

  if (window.location.pathname.startsWith('/admin')) {
    return <ManagementLayout />
  }

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
            <a className="staff-portal-link" href="/admin">Staff portal</a>
            <button
              className="login-button"
              type="button"
              onClick={() => {
                setActivePanel('health')
                void testSupabaseConnection()
              }}
            >
              Test connection
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
              {catalogCategories.map((category) => {
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
                {catalogBrands.map((brand) => (
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
                <p className="eyebrow">
                  {activePanel === 'cart' ? 'Shopping cart' : activePanel === 'favorites' ? 'Favorites' : 'System status'}
                </p>
                <h2>
                  {activePanel === 'cart'
                    ? `Cart (${cartCount})`
                    : activePanel === 'favorites'
                      ? `Favorites (${favoriteCount})`
                      : 'Supabase connection'}
                </h2>
              </div>
              <button className="panel-close" onClick={() => setActivePanel('none')} aria-label="Close panel">
                ✕
              </button>
            </div>

            <div className="panel-content">
              {activePanel === 'health' ? (
                <div style={{ display: 'grid', gap: '12px', minWidth: 'min(420px, 80vw)' }}>
                  {healthLoading && <p className="panel-empty">Testing server and Supabase connection...</p>}
                  {healthError && <p className="panel-empty">{healthError}</p>}
                  {healthStatus && (
                    <>
                      <p className="panel-total">
                        Status: {healthStatus.status === 'ok' ? 'Connected' : healthStatus.status === 'configuration_missing' ? 'Configuration missing' : 'Supabase unreachable'}
                      </p>
                      <p>Backend API: Reachable</p>
                      <p>Supabase URL configured: {healthStatus.configuration.supabase_url ? 'Yes' : 'No'}</p>
                      <p>Publishable key configured: {healthStatus.configuration.supabase_publishable_key ? 'Yes' : 'No'}</p>
                      <p>Supabase REST reachable: {healthStatus.supabase.reachable ? 'Yes' : 'No'}</p>
                      <p>Secret key configured: {healthStatus.configuration.supabase_secret_key ? 'Yes' : 'No'}</p>
                      <p>Checked: {new Date(healthStatus.timestamp).toLocaleString()}</p>
                    </>
                  )}
                  <button className="button button-primary" onClick={testSupabaseConnection} disabled={healthLoading}>
                    Test again
                  </button>
                </div>
              ) : activePanel === 'cart' ? (
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
              <div className="product-list-toolbar">
                <p className="product-result-count" aria-live="polite">
                  Showing <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'product' : 'products'}
                </p>
                <div className="product-view-controls">
                  <div className="product-view-toggle" role="group" aria-label="Product display">
                    <button
                      type="button"
                      className="product-view-button"
                      aria-label="Grid view"
                      aria-pressed={productView === 'grid'}
                      onClick={() => setProductView('grid')}
                    >
                      <LayoutGrid size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="product-view-button"
                      aria-label="List view"
                      aria-pressed={productView === 'list'}
                      onClick={() => setProductView('list')}
                    >
                      <List size={18} aria-hidden="true" />
                    </button>
                  </div>
                  {productView === 'grid' && (
                    <label className="product-columns-control">
                      <span>Columns</span>
                      <select
                        aria-label="Products per row"
                        value={gridColumns}
                        onChange={(event) => {
                          const columns = Number(event.target.value)
                          if (columns === 2 || columns === 3 || columns === 4) setGridColumns(columns)
                        }}
                      >
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                      </select>
                    </label>
                  )}
                </div>
              </div>
              {filteredProducts.length > 0 ? (
                <div
                  className={`product-grid catalog-product-grid ${productView === 'list' ? 'list-view' : ''}`}
                  data-columns={gridColumns}
                >
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isFavorite={favorites.includes(product.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              ) : (
                <p className="catalog-empty-state">No products match these filters. Try changing your search or clearing the filters.</p>
              )}
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
                    <div style={{ display: 'grid', gap: '8px', width: 'min(420px, 100%)' }}>
                      <input
                        type="text"
                        placeholder="Full name"
                        value={checkoutName}
                        onChange={(event) => setCheckoutName(event.target.value)}
                      />
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={checkoutPhone}
                        onChange={(event) => setCheckoutPhone(event.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Delivery address"
                        value={checkoutAddress}
                        onChange={(event) => setCheckoutAddress(event.target.value)}
                      />
                      <button className="button button-primary" onClick={submitCheckout}>
                        Continue to checkout
                      </button>
                      {checkoutMessage && <p className="panel-empty">{checkoutMessage}</p>}
                    </div>
                  </div>
                </>
              ) : (
                <p className="panel-empty">Your cart is empty. Add a product from the shop to see it here.</p>
              )}
            </div>
            <div style={{ marginTop: '24px', display: 'grid', gap: '8px', maxWidth: '420px' }}>
              <p className="eyebrow">Track an order</p>
              <input
                type="text"
                placeholder="Order reference (ORD-000001)"
                value={trackingReference}
                onChange={(event) => setTrackingReference(event.target.value)}
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={trackingPhone}
                onChange={(event) => setTrackingPhone(event.target.value)}
              />
              <button className="button button-secondary" onClick={submitTracking}>Track order</button>
              {trackingResult && <p className="panel-empty">{trackingResult}</p>}
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
                  <ProductCard
                    key={`${product.id}-arrival`}
                    product={product}
                    isFavorite={favorites.includes(product.id)}
                    onToggleFavorite={toggleFavorite}
                  />
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
                {catalogBrands.map((brand) => (
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
