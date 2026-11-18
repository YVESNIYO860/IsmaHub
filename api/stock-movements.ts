import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requirePermission } from './lib/auth'
import { ApiError, sendError } from './lib/errors'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed.' })
  }
  try {
    const context = await requirePermission(req, 'inventory.read')
    const locationId = typeof req.query.location_id === 'string' ? req.query.location_id : undefined
    const productId = typeof req.query.product_id === 'string' ? req.query.product_id : undefined
    let query = context.supabase
      .from('stock_movements')
      .select('id,location_id,product_id,movement_type,quantity,reference_type,reference_id,reason,created_at')
    if (locationId) query = query.eq('location_id', locationId)
    if (productId) query = query.eq('product_id', productId)
    const { data, error } = await query.order('created_at', { ascending: false }).limit(500)
    if (error) throw new ApiError(500, 'Unable to load stock movements.')
    return res.status(200).json({ movements: data ?? [] })
  } catch (error) {
    return sendError(res, error)
  }
}
