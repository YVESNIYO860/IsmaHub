import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requirePermission } from './lib/auth'
import { ApiError, sendError } from './lib/errors'
import { requireText } from './lib/validation'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  try {
    if (req.method === 'GET') {
      const context = await requirePermission(req, 'inventory.read')
      const { data, error } = await context.supabase
        .from('physical_locations')
        .select('id,name,code,location_type,address,is_active')
        .eq('is_active', true)
        .order('name')
      if (error) throw new ApiError(500, 'Unable to load locations.')
      return res.status(200).json({ locations: data ?? [] })
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST')
      return res.status(405).json({ error: 'Method not allowed.' })
    }

    const context = await requirePermission(req, 'location.manage')
    const body = req.body as Record<string, unknown>
    const name = requireText(body?.name, 'Name')
    const code = requireText(body?.code, 'Location code', 30).toUpperCase()
    const locationType = body?.location_type
    if (locationType !== 'store' && locationType !== 'warehouse'
      && locationType !== 'supplier' && locationType !== 'customer'
      && locationType !== 'transit') {
      throw new ApiError(400, 'Invalid location type.')
    }
    const { data, error } = await context.supabase
      .from('physical_locations')
      .insert({
        name,
        code,
        location_type: locationType,
        address: typeof body?.address === 'string' ? body.address.trim() || null : null,
      })
      .select()
      .single()
    if (error) throw new ApiError(400, 'Unable to create location.')
    return res.status(201).json({ location: data })
  } catch (error) {
    return sendError(res, error)
  }
}
