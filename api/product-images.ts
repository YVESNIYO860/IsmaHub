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
    const context = await requirePermission(req, 'product_image.manage')
    const body = req.body as Record<string, unknown>
    const productId = requireText(body?.product_id, 'Product', 36)
    const imageUrl = requireText(body?.image_url, 'Image URL', 2048)

    let parsedUrl: URL
    try {
      parsedUrl = new URL(imageUrl)
    } catch {
      throw new ApiError(400, 'Image URL must be a valid URL.')
    }
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      throw new ApiError(400, 'Image URL must use HTTP or HTTPS.')
    }

    const sortOrder = typeof body?.sort_order === 'number' ? body.sort_order : 0
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      throw new ApiError(400, 'Sort order must be a positive integer.')
    }
    const isPrimary = body?.is_primary === true

    if (isPrimary) {
      const { error: clearError } = await context.supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId)
      if (clearError) throw new ApiError(400, 'Unable to update primary image.')
    }

    const { data, error } = await context.supabase
      .from('product_images')
      .insert({
        product_id: productId,
        image_url: parsedUrl.toString(),
        alt_text: optionalText(body?.alt_text, 'Alt text', 300),
        sort_order: sortOrder,
        is_primary: isPrimary,
      })
      .select()
      .single()
    if (error) throw new ApiError(400, 'Unable to add product image.')
    return res.status(201).json({ image: data })
  } catch (error) {
    return sendError(res, error)
  }
}
