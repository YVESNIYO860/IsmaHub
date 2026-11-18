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
    const context = await requirePermission(req, 'return.manage')
    const body = req.body as Record<string, unknown>
    const locationId = requireText(body?.location_id, 'Location', 36)
    const reason = requireText(body?.reason, 'Reason', 1000)
    const key = requireText(body?.idempotency_key, 'Idempotency key', 200)
    if (!Array.isArray(body?.items) || body.items.length === 0) {
      throw new ApiError(400, 'At least one return item is required.')
    }
    const existing = await context.supabase
      .from('returns')
      .select('id')
      .eq('idempotency_key', key)
      .maybeSingle()
    if (existing.error) throw new ApiError(400, 'Unable to validate return.')
    if (existing.data) return res.status(200).json({ return_id: existing.data.id })

    const seq = await context.supabase
      .from('returns')
      .select('reference')
      .order('created_at', { ascending: false })
      .limit(1)
    let next = 1
    if (!seq.error && seq.data?.[0]?.reference) {
      const current = Number(seq.data[0].reference.replace('RET-', ''))
      if (Number.isFinite(current)) next = current + 1
    }

    const inserted = await context.supabase
      .from('returns')
      .insert({
        reference: `RET-${String(next).padStart(6, '0')}`,
        customer_order_id: typeof body?.customer_order_id === 'string' ? body.customer_order_id : null,
        pos_sale_id: typeof body?.pos_sale_id === 'string' ? body.pos_sale_id : null,
        location_id: locationId,
        status: 'requested',
        reason,
        idempotency_key: key,
        created_by: context.user.id,
      })
      .select()
      .single()
    if (inserted.error || !inserted.data) throw new ApiError(400, 'Unable to create return.')

    const items = body.items.map((item: unknown) => {
      if (!item || typeof item !== 'object') throw new ApiError(400, 'Invalid return item.')
      const candidate = item as Record<string, unknown>
      if (typeof candidate.quantity !== 'number' || !Number.isInteger(candidate.quantity) || candidate.quantity <= 0) {
        throw new ApiError(400, 'Return quantities must be positive whole numbers.')
      }
      return {
        return_id: inserted.data.id,
        product_id: requireText(candidate.product_id, 'Product', 36),
        quantity: candidate.quantity,
      }
    })
    const result = await context.supabase.from('return_items').insert(items)
    if (result.error) throw new ApiError(400, 'Unable to create return items.')
    return res.status(201).json({ return: inserted.data })
  } catch (error) {
    return sendError(res, error)
  }
}
