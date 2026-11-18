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
    const context = await requirePermission(req, 'inventory.transfer')
    const body = req.body as Record<string, unknown>
    const fromLocationId = requireText(body?.from_location_id, 'Source location', 36)
    const toLocationId = requireText(body?.to_location_id, 'Destination location', 36)
    const idempotencyKey = requireText(body?.idempotency_key, 'Idempotency key', 200)
    if (!Array.isArray(body?.items) || body.items.length === 0) {
      throw new ApiError(400, 'At least one transfer item is required.')
    }
    const items = body.items.map((item: unknown) => {
      if (!item || typeof item !== 'object') throw new ApiError(400, 'Invalid transfer item.')
      const candidate = item as Record<string, unknown>
      const productId = requireText(candidate.product_id, 'Product', 36)
      if (typeof candidate.quantity !== 'number' || !Number.isInteger(candidate.quantity) || candidate.quantity <= 0) {
        throw new ApiError(400, 'Transfer quantities must be positive whole numbers.')
      }
      return { product_id: productId, quantity: candidate.quantity }
    })
    const { data, error } = await context.supabase.rpc('complete_stock_transfer', {
      p_from_location_id: fromLocationId,
      p_to_location_id: toLocationId,
      p_items: items,
      p_notes: optionalText(body?.notes, 'Notes', 1000),
      p_idempotency_key: idempotencyKey,
    })
    if (error) {
      const message = error.message.includes('insufficient')
        ? 'Insufficient available stock.'
        : 'Unable to complete stock transfer.'
      throw new ApiError(400, message)
    }
    return res.status(201).json({ transfer_id: data })
  } catch (error) {
    return sendError(res, error)
  }
}
