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
    const invoiceNumber = requireText(body?.invoice_number, 'Invoice number', 100)
    const invoiceDate = requireText(body?.invoice_date, 'Invoice date', 10)
    const amount = parseMoney(body?.amount, 'Invoice amount')
    if (amount < 0) throw new ApiError(400, 'Invoice amount cannot be negative.')
    const idempotencyKey = requireText(body?.idempotency_key, 'Idempotency key', 200)

    const existing = await context.supabase
      .from('supplier_invoices')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()
    if (existing.error) throw new ApiError(400, 'Unable to validate supplier invoice.')
    if (existing.data) return res.status(200).json({ invoice_id: existing.data.id })

    const { data, error } = await context.supabase
      .from('supplier_invoices')
      .insert({
        supplier_id: supplierId,
        purchase_order_id: typeof body?.purchase_order_id === 'string' ? body.purchase_order_id : null,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: typeof body?.due_date === 'string' ? body.due_date : null,
        currency: 'RWF',
        amount,
        status: 'open',
        idempotency_key: idempotencyKey,
      })
      .select()
      .single()
    if (error) throw new ApiError(400, 'Unable to create supplier invoice.')
    return res.status(201).json({ invoice: data })
  } catch (error) {
    return sendError(res, error)
  }
}
