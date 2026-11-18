import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requirePermission } from './lib/auth'
import { ApiError, sendError } from './lib/errors'
import { requireText } from './lib/validation'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  try {
    const context = await requirePermission(req, 'product.manage')
    const body = req.body as Record<string, unknown>
    const productId = requireText(body?.product_id, 'Product', 36)
    const name = requireText(body?.name, 'Specification name', 120)
    const value = requireText(body?.value, 'Specification value', 500)
    const sortOrder = typeof body?.sort_order === 'number' ? body.sort_order : 0
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      throw new ApiError(400, 'Sort order must be a positive integer.')
    }

    const { data, error } = await context.supabase
      .from('product_specifications')
      .upsert({
        product_id: productId,
        name,
        value,
        sort_order: sortOrder,
      }, { onConflict: 'product_id,name' })
      .select()
      .single()
    if (error) throw new ApiError(400, 'Unable to save product specification.')
    return res.status(200).json({ specification: data })
  } catch (error) {
    return sendError(res, error)
  }
}

