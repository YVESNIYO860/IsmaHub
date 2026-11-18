import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requirePermission } from '../lib/auth'
import { ApiError, sendError } from '../lib/errors'
import { createSlug } from '../lib/slug'
import { createUserClient } from '../lib/supabase'
import {
  optionalText,
  parseOptionalMoney,
  parseMoney,
  requireText,
} from '../lib/validation'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const id = typeof req.query.id === 'string' ? req.query.id : ''
  if (!id) return res.status(400).json({ error: 'Product ID is required.' })

  try {
    if (req.method === 'GET') {
      const supabase = createUserClient()
      const { data, error } = await supabase
        .from('products')
        .select('*,product_categories(id,name,slug),product_brands(id,name,slug),product_specifications(name,value,sort_order),product_images(image_url,alt_text,sort_order,is_primary)')
        .eq('id', id)
        .eq('status', 'active')
        .single()
      if (error || !data) throw new ApiError(404, 'Product not found.')
      return res.status(200).json({ product: data })
    }

    if (req.method !== 'PATCH' && req.method !== 'DELETE') {
      res.setHeader('Allow', 'GET, PATCH, DELETE')
      return res.status(405).json({ error: 'Method not allowed.' })
    }

    const context = await requirePermission(req, 'product.manage')

    if (req.method === 'DELETE') {
      const { error } = await context.supabase
        .from('products')
        .update({ status: 'archived' })
        .eq('id', id)
      if (error) throw new ApiError(400, 'Unable to archive product.')
      return res.status(200).json({ success: true })
    }

    const body = req.body as Record<string, unknown>
    const updates: Record<string, unknown> = {}
    if ('name' in body) {
      const name = requireText(body.name, 'Name')
      updates.name = name
      updates.slug = createSlug(name)
    }
    if ('category_id' in body) updates.category_id = requireText(body.category_id, 'Category')
    if ('brand_id' in body) updates.brand_id = optionalText(body.brand_id, 'Brand', 36)
    if ('sku' in body) updates.sku = requireText(body.sku, 'SKU', 80).toUpperCase()
    if ('supplier_code' in body) updates.supplier_code = optionalText(body.supplier_code, 'Supplier code', 80)
    if ('short_description' in body) updates.short_description = optionalText(body.short_description, 'Short description', 500)
    if ('description' in body) updates.description = optionalText(body.description, 'Description', 10000)
    if ('cost_price' in body) updates.cost_price = parseOptionalMoney(body.cost_price, 'Cost price')
    if ('sale_price' in body) updates.sale_price = parseMoney(body.sale_price, 'Sale price')
    if ('compare_at_price' in body) updates.compare_at_price = parseOptionalMoney(body.compare_at_price, 'Compare-at price')
    if ('is_featured' in body) updates.is_featured = body.is_featured === true
    if ('status' in body) {
      if (body.status !== 'draft' && body.status !== 'active' && body.status !== 'archived') {
        throw new ApiError(400, 'Status must be draft, active, or archived.')
      }
      updates.status = body.status
    }

    if (Object.keys(updates).length === 0) throw new ApiError(400, 'No supported fields were provided.')
    const { data, error } = await context.supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new ApiError(400, 'Unable to update product.')
    return res.status(200).json({ product: data })
  } catch (error) {
    return sendError(res, error)
  }
}
