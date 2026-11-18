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
    const context = await requirePermission(req, 'warranty.manage')
    const body = req.body as Record<string, unknown>
    const supplierId = requireText(body?.supplier_id, 'Supplier', 36)
    const name = requireText(body?.name, 'Warranty name', 200)
    if (typeof body?.warranty_months !== 'number'
      || !Number.isInteger(body.warranty_months)
      || body.warranty_months < 0) {
      throw new ApiError(400, 'Warranty months must be a positive whole number or zero.')
    }
    const { data, error } = await context.supabase
      .from('supplier_warranties')
      .insert({
        supplier_id: supplierId,
        product_id: typeof body?.product_id === 'string' ? body.product_id : null,
        name,
        warranty_months: body.warranty_months,
        terms: optionalText(body?.terms, 'Terms', 5000),
      })
      .select()
      .single()
    if (error) throw new ApiError(400, 'Unable to create supplier warranty.')
    return res.status(201).json({ warranty: data })
  } catch (error) {
    return sendError(res, error)
  }
}
