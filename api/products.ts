import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requirePermission } from './lib/auth'
import { ApiError, sendError } from './lib/errors'
import { createSlug } from './lib/slug'
import { createUserClient } from './lib/supabase'
import {
  optionalText,
  parseOptionalMoney,
  parseMoney,
  requireText,
} from './lib/validation'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  try {
    if (req.method === 'GET') {
      const managementView = req.query.manage === 'true'
      const context = managementView ? await requirePermission(req, 'product.read') : null
      const supabase = context?.supabase ?? createUserClient()
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
      const category = typeof req.query.category === 'string' ? req.query.category : undefined
      const brand = typeof req.query.brand === 'string' ? req.query.brand : undefined
      let query = supabase
        .from('products')
        .select('id,name,slug,sku,supplier_code,short_description,cost_price,sale_price,compare_at_price,currency,status,is_featured,category_id,brand_id,product_images(image_url,alt_text,is_primary,sort_order)')

      if (!managementView) query = query.eq('status', 'active')

      if (search) query = query.ilike('name', `%${search}%`)
      if (category) query = query.eq('category_id', category)
      if (brand) query = query.eq('brand_id', brand)

      const { data, error } = await query.order('is_featured', { ascending: false }).order('name')
      if (error) throw new ApiError(500, 'Unable to load products.')
      if (!context) return res.status(200).json({ products: data ?? [] })

      const { data: canManage, error: permissionError } = await context.supabase.rpc('has_permission', {
        permission_code: 'product.manage',
      })
      if (permissionError) throw new ApiError(403, 'Permission check failed.')
      return res.status(200).json({ products: data ?? [], can_manage: canManage === true })
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST')
      return res.status(405).json({ error: 'Method not allowed.' })
    }

    const context = await requirePermission(req, 'product.manage')
    const body = req.body as Record<string, unknown>
    const name = requireText(body?.name, 'Name')
    const categoryId = requireText(body?.category_id, 'Category')
    let sku: string
    if (body?.sku === undefined || body?.sku === null || body?.sku === '') {
      const generated = await context.supabase.rpc('generate_product_sku')
      if (generated.error || typeof generated.data !== 'string') {
        throw new ApiError(500, 'Unable to generate a product SKU.')
      }
      sku = generated.data
    } else {
      sku = requireText(body.sku, 'SKU', 80).toUpperCase()
    }
    const status = body?.status === 'draft' || body?.status === 'archived'
      ? body.status
      : 'active'
    const brandId = optionalText(body?.brand_id, 'Brand', 36)

    const { data, error } = await context.supabase
      .from('products')
      .insert({
        name,
        slug: createSlug(name),
        category_id: categoryId,
        brand_id: brandId,
        sku,
        supplier_code: optionalText(body?.supplier_code, 'Supplier code', 80),
        short_description: optionalText(body?.short_description, 'Short description', 500),
        description: optionalText(body?.description, 'Description', 10000),
        cost_price: parseOptionalMoney(body?.cost_price, 'Cost price'),
        sale_price: parseMoney(body?.sale_price, 'Sale price'),
        compare_at_price: parseOptionalMoney(body?.compare_at_price, 'Compare-at price'),
        currency: 'RWF',
        status,
        is_featured: body?.is_featured === true,
      })
      .select()
      .single()
    if (error) throw new ApiError(400, 'Unable to create product.')
    return res.status(201).json({ product: data })
  } catch (error) {
    return sendError(res, error)
  }
}
