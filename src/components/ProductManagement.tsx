import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Archive, CirclePlus, Package, Pencil, RefreshCw, Search, X } from 'lucide-react'

type Product = {
  id: string
  name: string
  sku: string
  supplier_code: string | null
  short_description: string | null
  cost_price: number | string | null
  sale_price: number | string
  compare_at_price: number | string | null
  status: 'active' | 'draft' | 'archived'
  is_featured: boolean
  category_id: string
  brand_id: string | null
}

type Category = { id: string; name: string }
type Brand = { id: string; name: string }
type ProductForm = {
  name: string
  category_id: string
  brand_id: string
  sku: string
  supplier_code: string
  short_description: string
  cost_price: string
  sale_price: string
  compare_at_price: string
  status: Product['status']
  is_featured: boolean
}

type ApiFailure = { error?: string }

const emptyForm: ProductForm = {
  name: '',
  category_id: '',
  brand_id: '',
  sku: '',
  supplier_code: '',
  short_description: '',
  cost_price: '',
  sale_price: '',
  compare_at_price: '',
  status: 'active',
  is_featured: false,
}

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

function formatPrice(value: number | string) {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function formFromProduct(product: Product): ProductForm {
  return {
    ...emptyForm,
    name: product.name,
    category_id: product.category_id,
    brand_id: product.brand_id || '',
    sku: product.sku,
    supplier_code: product.supplier_code || '',
    short_description: product.short_description || '',
    cost_price: product.cost_price === null ? '' : String(product.cost_price),
    sale_price: String(product.sale_price),
    compare_at_price: product.compare_at_price === null ? '' : String(product.compare_at_price),
    status: product.status,
    is_featured: product.is_featured,
  }
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [canManage, setCanManage] = useState(false)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)

  const fetchCatalog = useCallback(() => Promise.all([
    requestJson<{ products: Product[]; can_manage: boolean }>('/api/products?manage=true'),
    requestJson<{ categories: Category[] }>('/api/categories'),
    requestJson<{ brands: Brand[] }>('/api/brands'),
  ]), [])

  const applyCatalog = ([productResult, categoryResult, brandResult]: Awaited<ReturnType<typeof fetchCatalog>>) => {
    setProducts(productResult.products)
    setCanManage(productResult.can_manage)
    setCategories(categoryResult.categories)
    setBrands(brandResult.brands)
  }

  const refreshProducts = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      applyCatalog(await fetchCatalog())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load products.')
    } finally {
      setIsLoading(false)
    }
  }, [fetchCatalog])

  useEffect(() => {
    let active = true
    fetchCatalog()
      .then((catalog) => {
        if (active) applyCatalog(catalog)
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load products.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [fetchCatalog])

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return products
    return products.filter((product) =>
      product.name.toLowerCase().includes(term) || product.sku.toLowerCase().includes(term),
    )
  }, [products, search])

  const startCreate = () => {
    setEditingProduct(null)
    setIsCreating(true)
    setForm({ ...emptyForm, category_id: categories[0]?.id || '' })
    setError('')
  }

  const startEdit = (product: Product) => {
    setIsCreating(false)
    setEditingProduct(product)
    setForm(formFromProduct(product))
    setError('')
  }

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      const path = editingProduct ? `/api/products/${encodeURIComponent(editingProduct.id)}` : '/api/products'
      await requestJson(path, {
        method: editingProduct ? 'PATCH' : 'POST',
        body: JSON.stringify({
          ...form,
          brand_id: form.brand_id || null,
          supplier_code: form.supplier_code || null,
          short_description: form.short_description || null,
          cost_price: form.cost_price || null,
          compare_at_price: form.compare_at_price || null,
        }),
      })
      setEditingProduct(null)
      setIsCreating(false)
      await refreshProducts()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save product.')
    } finally {
      setIsSaving(false)
    }
  }

  const archiveProduct = async (product: Product) => {
    if (!window.confirm(`Archive "${product.name}"? It will no longer appear in the storefront.`)) return
    setError('')
    try {
      await requestJson(`/api/products/${encodeURIComponent(product.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'archived' }),
      })
      await refreshProducts()
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Unable to archive product.')
    }
  }

  return (
    <section className="staff-product-management" aria-label="Product management">
      <div className="staff-product-toolbar">
        <label className="staff-product-search">
          <Search size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or SKU" aria-label="Search products by name or SKU" />
        </label>
        <div className="staff-product-actions">
          <button type="button" className="staff-secondary-button" onClick={() => void refreshProducts()} disabled={isLoading}>
            <RefreshCw size={15} /> Refresh
          </button>
          {canManage && (
            <button type="button" className="staff-primary-button staff-product-add" onClick={startCreate}>
              <CirclePlus size={16} /> Add product
            </button>
          )}
        </div>
      </div>

      {error && <div className="staff-error-banner" role="alert">{error}</div>}

      {(editingProduct || isCreating) && (
        <ProductFormPanel
          form={form}
          categories={categories}
          brands={brands}
          isSaving={isSaving}
          onChange={setForm}
          onSubmit={saveProduct}
          onCancel={() => { setEditingProduct(null); setIsCreating(false) }}
          isEditing={Boolean(editingProduct)}
        />
      )}

      {!editingProduct && !isCreating && (
        <div className="staff-product-table-wrap">
          {isLoading ? (
            <div className="staff-product-empty"><span className="staff-product-icon"><Package size={20} /></span><strong>Loading products…</strong></div>
          ) : visibleProducts.length === 0 ? (
            <div className="staff-product-empty">
              <span className="staff-product-icon"><Package size={20} /></span>
              <strong>{products.length ? 'No matching products' : 'No products found'}</strong>
              <p>{products.length ? 'Try another name or SKU.' : 'Products will appear here when they are available in your connected catalog.'}</p>
            </div>
          ) : (
            <table className="staff-product-table">
              <thead><tr><th>Product</th><th>SKU</th><th>Price</th><th>Status</th>{canManage && <th><span className="staff-sr-only">Actions</span></th>}</tr></thead>
              <tbody>
                {visibleProducts.map((product) => (
                  <tr key={product.id}>
                    <td><strong>{product.name}</strong><small>{product.short_description || '—'}</small></td>
                    <td><span className="staff-product-sku">{product.sku}</span></td>
                    <td>{formatPrice(product.sale_price)}</td>
                    <td><span className={`staff-product-status is-${product.status}`}>{product.status}</span></td>
                    {canManage && (
                      <td className="staff-product-row-actions">
                        <button type="button" className="staff-icon-button" aria-label={`Edit ${product.name}`} onClick={() => startEdit(product)}><Pencil size={16} /></button>
                        {product.status !== 'archived' && <button type="button" className="staff-icon-button is-danger" aria-label={`Archive ${product.name}`} onClick={() => void archiveProduct(product)}><Archive size={16} /></button>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {!canManage && !isLoading && !error && <p className="staff-product-readonly">You have read-only product access.</p>}

    </section>
  )
}

function ProductFormPanel({
  form,
  categories,
  brands,
  isSaving,
  onChange,
  onSubmit,
  onCancel,
  isEditing = false,
}: {
  form: ProductForm
  categories: Category[]
  brands: Brand[]
  isSaving: boolean
  onChange: (form: ProductForm) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  isEditing?: boolean
}) {
  const update = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => onChange({ ...form, [key]: value })

  return (
    <form className="staff-product-form staff-panel" onSubmit={onSubmit}>
      <div className="staff-product-form-heading">
        <div><p className="staff-eyebrow">PRODUCT DETAILS</p><h2>{isEditing ? 'Edit product' : 'Add product'}</h2></div>
        <button type="button" className="staff-icon-button" aria-label="Close product form" onClick={onCancel}><X size={18} /></button>
      </div>
      {categories.length === 0 && <div className="staff-error-banner" role="alert">Add an active category before creating a product.</div>}
      <div className="staff-product-form-grid">
        <label>Product name<input required maxLength={200} value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
        <label>Category<select required value={form.category_id} onChange={(event) => update('category_id', event.target.value)}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label>Brand<select value={form.brand_id} onChange={(event) => update('brand_id', event.target.value)}><option value="">No brand</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
        <label>SKU<input maxLength={80} value={form.sku} onChange={(event) => update('sku', event.target.value)} placeholder="Leave blank to generate" /></label>
        <label>Supplier code<input maxLength={80} value={form.supplier_code} onChange={(event) => update('supplier_code', event.target.value)} /></label>
        <label>Sale price (RWF)<input required type="number" min="0.01" step="1" value={form.sale_price} onChange={(event) => update('sale_price', event.target.value)} /></label>
        <label>Cost price (RWF)<input type="number" min="0" step="1" value={form.cost_price} onChange={(event) => update('cost_price', event.target.value)} /></label>
        <label>Compare-at price (RWF)<input type="number" min="0" step="1" value={form.compare_at_price} onChange={(event) => update('compare_at_price', event.target.value)} /></label>
        <label>Status<select value={form.status} onChange={(event) => update('status', event.target.value as Product['status'])}><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label>
        <label className="staff-product-description">Short description<textarea rows={3} maxLength={500} value={form.short_description} onChange={(event) => update('short_description', event.target.value)} /></label>
        <label className="staff-product-featured"><input type="checkbox" checked={form.is_featured} onChange={(event) => update('is_featured', event.target.checked)} /> Feature this product in the storefront</label>
      </div>
      <div className="staff-product-form-actions">
        <button type="button" className="staff-secondary-button" onClick={onCancel}>Cancel</button>
        <button type="submit" className="staff-primary-button" disabled={isSaving || categories.length === 0}>{isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Create product'}</button>
      </div>
    </form>
  )
}
