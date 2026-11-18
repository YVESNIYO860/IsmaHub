import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requirePermission } from './lib/auth'
import { ApiError, sendError } from './lib/errors'
import { optionalText, requireText } from './lib/validation'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  try {
    if (req.method === 'GET') {
      const context = await requirePermission(req, 'purchase.read')
      const { data, error } = await context.supabase
        .from('suppliers')
        .select('id,name,code,contact_name,email,phone,address,tax_number,is_active')
        .eq('is_active', true)
        .order('name')
      if (error) throw new ApiError(500, 'Unable to load suppliers.')
      return res.status(200).json({ suppliers: data ?? [] })
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST')
      return res.status(405).json({ error: 'Method not allowed.' })
    }
    const context = await requirePermission(req, 'supplier.manage')
    const body = req.body as Record<string, unknown>
    const { data, error } = await context.supabase
      .from('suppliers')
      .insert({
        name: requireText(body?.name, 'Name'),
        code: requireText(body?.code, 'Supplier code', 30).toUpperCase(),
        contact_name: optionalText(body?.contact_name, 'Contact name'),
        email: optionalText(body?.email, 'Email', 254),
        phone: optionalText(body?.phone, 'Phone', 30),
        address: optionalText(body?.address, 'Address', 500),
        tax_number: optionalText(body?.tax_number, 'Tax number', 100),
      })
      .select()
      .single()
    if (error) throw new ApiError(400, 'Unable to create supplier.')
    return res.status(201).json({ supplier: data })
  } catch (error) {
    return sendError(res, error)
  }
}
