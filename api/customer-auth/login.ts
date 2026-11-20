import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCustomerSessionCookie } from '../lib/cookies'
import { ApiError, sendError } from '../lib/errors'
import { isLoginRateLimited } from '../lib/rate-limit'
import { createUserClient } from '../lib/supabase'
import { parseLoginInput } from '../lib/validation'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  try {
    const ip = Array.isArray(req.headers['x-forwarded-for'])
      ? req.headers['x-forwarded-for'][0]
      : req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.socket?.remoteAddress
      || 'unknown'
    if (isLoginRateLimited(ip)) throw new ApiError(429, 'Too many login attempts. Try again later.')

    const input = parseLoginInput(req.body)
    const supabase = createUserClient()
    const { data, error } = await supabase.auth.signInWithPassword(input)
    if (error || !data.session) throw new ApiError(401, 'Invalid email or password.')

    const customerClient = createUserClient(data.session.access_token)
    const { data: customer, error: customerError } = await customerClient
      .from('customers')
      .select('id,full_name,email')
      .eq('auth_user_id', data.user.id)
      .maybeSingle()
    if (customerError) throw new ApiError(500, 'Unable to load the customer account.')
    if (!customer) {
      await supabase.auth.signOut()
      throw new ApiError(403, 'This is not a customer account. Use staff access instead.')
    }

    setCustomerSessionCookie(res, {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
    })
    return res.status(200).json({
      user: { id: data.user.id, email: customer.email, full_name: customer.full_name },
    })
  } catch (error) {
    return sendError(res, error)
  }
}
