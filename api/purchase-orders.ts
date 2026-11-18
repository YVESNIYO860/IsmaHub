import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requirePermission } from './lib/auth'
import { ApiError, sendError } from './lib/errors'
import { parseMoney, requireText } from './lib/validation'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  try {
    if (req.method === 'GET') {
      const context = await requirePermission(req, 'purchase.read')
      const { data, error } = await context.supabase
        .from('purchase_orders')
        .select('*,purchase_order_items(*)')
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) throw new ApiError(500, 'Unable to load purchase orders.')
      return res.status(200).json({ purchase_orders: data ?? [] })
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST')
      return res.status(405).json({ error: 'Method not allowed.' })
    }
    const context = await requirePermission(req, 'purchase.manage')
    const body = req.body as Record<string, unknown>
    const supplierId = requireText(body?.supplier_id, 'Supplier', 36)
    const locationId = requireText(body?.location_id, 'Location', 36)
    const idempotencyKey = requireText(body?.idempotency_key, 'Idempotency key', 200)
    if (!Array.isArray(body?.items) || body.items.length === 0) {
      throw new ApiError(400, 'At least one purchase order item is required.')
    }

    let subtotal = 0
    const items = body.items.map((item: unknown) => {
      if (!item || typeof item !== 'object') throw new ApiError(400, 'Invalid purchase order item.')
      const candidate = item as Record<string, unknown>
      const productId = requireText(candidate.product_id, 'Product', 36)
      if (typeof candidate.quantity !== 'number' || !Number.isInteger(candidate.quantity) || candidate.quantity <= 0) {
        throw new ApiError(400, 'Quantity must be a positive whole number.')
      }
      const unitCost = parseMoney(candidate.unit_cost, 'Unit cost')
      const lineTotal = parseMoney(candidate.quantity * unitCost, 'Line total')
      subtotal = parseMoney(subtotal + lineTotal, 'Subtotal')
      return {
        product_id: productId,
        supplier_code: typeof candidate.supplier_code === 'string' ? candidate.supplier_code.trim() || null : null,
        quantity_ordered: candidate.quantity,
        quantity_received: 0,
        unit_cost: unitCost,
        line_total: lineTotal,
      }
    })
    const taxAmount = typeof body?.tax_amount === 'number'
      ? parseMoney(body.tax_amount, 'Tax amount')
      : 0
    const totalAmount = parseMoney(subtotal + taxAmount, 'Total amount')

    const referenceNumber = await context.supabase
      .from('purchase_orders')
      .select('reference')
      .order('created_at', { ascending: false })
      .limit(1)
    let sequence = 1
    if (!referenceNumber.error && referenceNumber.data?.[0]?.reference) {
      const current = Number(referenceNumber.data[0].reference.replace('PUR-', ''))
      if (Number.isFinite(current)) sequence = current + 1
    }
    const reference = `PUR-${String(sequence).padStart(6, '0')}`

    const existing = await context.supabase
      .from('purchase_orders')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()
    if (existing.error) throw new ApiError(400, 'Unable to validate purchase order.')
    if (existing.data) return res.status(200).json({ purchase_order_id: existing.data.id })

    const po = await context.supabase
      .from('purchase_orders')
      .insert({
        reference,
        supplier_id: supplierId,
        location_id: locationId,
        status: 'draft',
        currency: 'RWF',
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        notes: typeof body?.notes === 'string' ? body.notes.trim() || null : null,
        idempotency_key: idempotencyKey,
        created_by: context.user.id,
      })
      .select()
      .single()
    if (po.error || !po.data) throw new ApiError(400, 'Unable to create purchase order.')

    const itemRows = items.map((item) => ({ ...item, purchase_order_id: po.data.id }))
    const poItems = await context.supabase.from('purchase_order_items').insert(itemRows)
    if (poItems.error) throw new ApiError(400, 'Unable to create purchase order items.')
    return res.status(201).json({ purchase_order: po.data })
  } catch (error) {
    return sendError(res, error)
  }
}
