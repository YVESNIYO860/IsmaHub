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
        .from('product_categories')
        .select('id,parent_id,name,slug,is_active,sort_order')
        .eq('is_active', true)
        .order('sort_order')
        .order('name')
      if (error) throw new ApiError(500, 'Unable to load categories.')
      return res.status(200).json({ categories: data ?? [] })
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST')
      return res.status(405).json({ error: 'Method not allowed.' })
    }

    const context = await requirePermission(req, 'category.manage')
    const body = req.body as Record<string, unknown>
    const name = requireText(body?.name, 'Name')
    const parentId = optionalText(body?.parent_id, 'Parent category', 36)
    const sortOrder = typeof body?.sort_order === 'number' ? body.sort_order : 0
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      throw new ApiError(400, 'Sort order must be a positive integer.')
    }

    const { data, error } = await context.supabase
      .from('product_categories')
      .insert({
        name,
        slug: createSlug(name),
        parent_id: parentId,
        sort_order: sortOrder,
      })
      .select()
      .single()
    if (error) throw new ApiError(400, 'Unable to create category.')
    return res.status(201).json({ category: data })
  } catch (error) {
    return sendError(res, error)
  }
}

