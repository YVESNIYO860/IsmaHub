export type StorefrontProduct = {
  id: string
  name: string
  slug: string
  sku: string
  short_description: string | null
  description: string | null
  sale_price: number | string
  compare_at_price: number | string | null
  currency: string
  product_categories: { id: string; name: string; slug: string } | null
  product_brands: { id: string; name: string; slug: string } | null
  product_specifications: Array<{ name: string; value: string; sort_order: number }>
  product_images: Array<{ image_url: string; alt_text: string | null; is_primary: boolean; sort_order: number }>
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  const payload = await response.json().catch(() => null) as T & { error?: string }
  if (!response.ok) throw new Error(payload?.error || 'The storefront request failed.')
  return payload
}

export const storefrontApi = {
  products: (search?: string) =>
    apiRequest<{ products: StorefrontProduct[] }>(
      `/api/storefront-products${search ? `?search=${encodeURIComponent(search)}` : ''}`,
    ),
  checkout: (body: {
    customer_name: string
    phone: string
    address: string
    idempotency_key: string
    items: Array<{ product_id: string; quantity: number }>
  }) =>
    apiRequest<{ order: { id: string; reference: string } }>('/api/storefront-checkout', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  track: (reference: string, phone: string) =>
    apiRequest<{ order: { reference: string; status: string; total_amount: number; created_at: string } }>(
      '/api/storefront-track',
      { method: 'POST', body: JSON.stringify({ reference, phone }) },
    ),
}
