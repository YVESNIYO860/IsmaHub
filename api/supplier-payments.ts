import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requirePermission } from './lib/auth'
import { ApiError, sendError } from './lib/errors'
import { parseMoney, requireText } from './lib/validation'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }
  try {
    const context = await requirePermission(req, 'purchase.pay')
    const body = req.body as Record<string, unknown>
    const supplierId = requireText(body?.supplier_id, 'Supplier', 36)
    const invoiceId = typeof body?.invoice_id === 'string' ? body.invoice_id : null
    const amount = parseMoney(body?.amount, 'Payment amount')
    if (amount <= 0) throw new ApiError(400, 'Payment amount must be positive.')
    const paymentMethod = requireText(body?.payment_method, 'Payment method', 50)
    const idempotencyKey = requireText(body?.idempotency_key, 'Idempotency key', 200)
    const { data, error } = await context.supabase.rpc('record_supplier_payment', {
      p_supplier_id: supplierId,
      p_invoice_id: invoiceId,
      p_amount: amount,
      p_payment_method: paymentMethod,
      p_reference: typeof body?.reference === 'string' ? body.reference.trim() || null : null,
      p_idempotency_key: idempotencyKey,
    })
    if (error) throw new ApiError(400, 'Unable to record supplier payment.')
    return res.status(201).json({ payment_id: data })
  } catch (error) {
    return sendError(res, error)
  }
}
