import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requirePermission } from './lib/auth'
import { ApiError, sendError } from './lib/errors'
import { createSlug } from './lib/slug'
import { createUserClient } from './lib/supabase'
import { optionalText, requireText } from './lib/validation'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  try {
    if (req.method === 'GET') {
      const supabase = createUserClient()
      const { data, error } = await supabase
        .from('product_brands')
        .select('id,name,slug,logo_url,is_active')
        .eq('is_active', true)
        .order('name')
      if (error) throw new ApiError(500, 'Unable to load brands.')
      return res.status(200).json({ brands: data ?? [] })
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST')
      return res.status(405).json({ error: 'Method not allowed.' })
    }

    const context = await requirePermission(req, 'brand.manage')
    const body = req.body as Record<string, unknown>
    const name = requireText(body?.name, 'Name')
    const logoUrl = optionalText(body?.logo_url, 'Logo URL', 2048)

    const { data, error } = await context.supabase
      .from('product_brands')
      .insert({ name, slug: createSlug(name), logo_url: logoUrl })
      .select()
      .single()
    if (error) throw new ApiError(400, 'Unable to create brand.')
    return res.status(201).json({ brand: data })
  } catch (error) {
    return sendError(res, error)
  }
}

