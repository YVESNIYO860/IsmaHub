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
    if (typeof body?.quantity !== 'number' || !Number.isInteger(body.quantity) || body.quantity <= 0) {
      throw new ApiError(400, 'Quantity must be a positive whole number.')
    }
    if (typeof body?.supplier_warranty_eligible !== 'boolean') {
      throw new ApiError(400, 'Supplier warranty eligibility must be true or false.')
    }
    const { data, error } = await context.supabase.rpc('record_damaged_stock', {
      p_location_id: locationId,
      p_product_id: productId,
      p_quantity: body.quantity,
      p_reason: reason,
      p_supplier_warranty_eligible: body.supplier_warranty_eligible,
      p_idempotency_key: idempotencyKey,
    })
    if (error) {
      const message = error.message.includes('insufficient')
        ? 'Insufficient available stock.'
        : 'Unable to record damaged stock.'
      throw new ApiError(400, message)
    }
    return res.status(201).json({ damaged_stock_id: data })
  } catch (error) {
    return sendError(res, error)
  }
}
