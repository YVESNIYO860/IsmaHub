import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCustomerSessionCookie } from '../lib/cookies'
import { ApiError, sendError } from '../lib/errors'
import { isLoginRateLimited } from '../lib/rate-limit'
import { createPrivilegedClient, createUserClient } from '../lib/supabase'
import { optionalText, parseLoginInput, requireText } from '../lib/validation'

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
    if (isLoginRateLimited(ip)) throw new ApiError(429, 'Too many attempts. Try again later.')

    if (!req.body || typeof req.body !== 'object') throw new ApiError(400, 'Invalid request body.')
    const body = req.body as Record<string, unknown>
    const { email, password } = parseLoginInput(body)
    const fullName = requireText(body.full_name, 'Name', 120)
    if (fullName.length < 2) throw new ApiError(400, 'Name must be at least 2 characters.')
    const phone = optionalText(body.phone, 'Phone', 40)

    const privileged = createPrivilegedClient()
    if (!privileged) throw new ApiError(503, 'Customer account registration is not configured.')
    const schemaCheck = await privileged.from('customers').select('auth_user_id').limit(0)
    if (schemaCheck.error) throw new ApiError(503, 'Customer account registration is not ready.')

    const supabase = createUserClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          account_type: 'customer',
          full_name: fullName,
          phone,
        },
      },
    })
    if (error || !data.user) {
      throw new ApiError(400, 'Unable to create the account. Check your details and try again.')
    }

    const { data: customer, error: customerError } = await privileged
      .from('customers')
      .select('auth_user_id')
      .eq('auth_user_id', data.user.id)
      .maybeSingle()
    if (customerError || !customer) {
      throw new ApiError(503, 'Customer account setup is not ready. Please try again later.')
    }

    if (!data.session) {
      return res.status(201).json({ authenticated: false, confirmation_required: true })
    }

    setCustomerSessionCookie(res, {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
    })
    return res.status(201).json({
      authenticated: true,
      user: { id: data.user.id, email: data.user.email, full_name: fullName },
    })
  } catch (error) {
    return sendError(res, error)
  }
}
