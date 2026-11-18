import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requirePermission } from './lib/auth'
import { ApiError, sendError } from './lib/errors'
import { optionalText, requireText } from './lib/validation'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }
  try {
    const context = await requirePermission(req, 'purchase.receive')
    const body = req.body as Record<string, unknown>
    const purchaseOrderId = requireText(body?.purchase_order_id, 'Purchase order', 36)
    const locationId = requireText(body?.location_id, 'Location', 36)
    const idempotencyKey = requireText(body?.idempotency_key, 'Idempotency key', 200)
    if (!Array.isArray(body?.items) || body.items.length === 0) {
      throw new ApiError(400, 'At least one delivery item is required.')
    }
    const items = body.items.map((item: unknown) => {
      if (!item || typeof item !== 'object') throw new ApiError(400, 'Invalid delivery item.')
      const candidate = item as Record<string, unknown>
      const purchaseOrderItemId = requireText(candidate.purchase_order_item_id, 'Purchase order item', 36)
      if (typeof candidate.quantity !== 'number' || !Number.isInteger(candidate.quantity) || candidate.quantity <= 0) {
        throw new ApiError(400, 'Delivery quantities must be positive whole numbers.')
      }
      return { purchase_order_item_id: purchaseOrderItemId, quantity: candidate.quantity }
    })
    const { data, error } = await context.supabase.rpc('receive_supplier_delivery', {
      p_purchase_order_id: purchaseOrderId,
      p_location_id: locationId,
      p_items: items,
      p_reference: optionalText(body?.reference, 'Delivery reference', 100),
      p_notes: optionalText(body?.notes, 'Notes', 1000),
      p_idempotency_key: idempotencyKey,
    })
    if (error) throw new ApiError(400, error.message.includes('exceeds') ? 'Delivery quantity exceeds ordered quantity.' : 'Unable to receive supplier delivery.')
    return res.status(201).json({ delivery_id: data })
  } catch (error) {
    return sendError(res, error)
  }
}
