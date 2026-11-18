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
    const context = await requirePermission(req, 'inventory.adjust')
    const body = req.body as Record<string, unknown>
    const locationId = requireText(body?.location_id, 'Location', 36)
    const productId = requireText(body?.product_id, 'Product', 36)
    const reason = requireText(body?.reason, 'Reason', 500)
    const idempotencyKey = requireText(body?.idempotency_key, 'Idempotency key', 200)
    if (typeof body?.quantity_delta !== 'number' || !Number.isInteger(body.quantity_delta) || body.quantity_delta === 0) {
      throw new ApiError(400, 'Quantity delta must be a non-zero whole number.')
    }
    const { data, error } = await context.supabase.rpc('adjust_stock', {
      p_location_id: locationId,
      p_product_id: productId,
      p_quantity_delta: body.quantity_delta,
      p_reason: reason,
      p_idempotency_key: idempotencyKey,
    })
    if (error) {
      const message = error.message.includes('insufficient')
        ? 'Insufficient available stock.'
        : 'Unable to adjust stock.'
      throw new ApiError(400, message)
    }
    return res.status(200).json({ movement_id: data })
  } catch (error) {
    return sendError(res, error)
  }
}
