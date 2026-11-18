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
    const context = await requirePermission(req, 'warranty.manage')
    const body = req.body as Record<string, unknown>
    const warrantyId = requireText(body?.warranty_id, 'Warranty', 36)
    const supplierId = requireText(body?.supplier_id, 'Supplier', 36)
    const description = requireText(body?.description, 'Description', 5000)
    const idempotencyKey = requireText(body?.idempotency_key, 'Idempotency key', 200)

    const existing = await context.supabase
      .from('supplier_warranty_claims')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()
    if (existing.error) throw new ApiError(400, 'Unable to validate warranty claim.')
    if (existing.data) return res.status(200).json({ claim_id: existing.data.id })

    const sequence = await context.supabase
      .from('supplier_warranty_claims')
      .select('claim_reference')
      .order('created_at', { ascending: false })
      .limit(1)
    let next = 1
    if (!sequence.error && sequence.data?.[0]?.claim_reference) {
      const current = Number(sequence.data[0].claim_reference.replace('WAR-', ''))
      if (Number.isFinite(current)) next = current + 1
    }

    const { data, error } = await context.supabase
      .from('supplier_warranty_claims')
      .insert({
        warranty_id: warrantyId,
        supplier_id: supplierId,
        damaged_stock_id: typeof body?.damaged_stock_id === 'string' ? body.damaged_stock_id : null,
        claim_reference: `WAR-${String(next).padStart(6, '0')}`,
        status: 'submitted',
        description,
        idempotency_key: idempotencyKey,
        created_by: context.user.id,
      })
      .select()
      .single()
    if (error) throw new ApiError(400, 'Unable to create supplier warranty claim.')
    return res.status(201).json({ claim: data })
  } catch (error) {
    return sendError(res, error)
  }
}
