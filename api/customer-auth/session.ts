import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  clearCustomerSessionCookie,
  readCustomerSessionCookie,
  setCustomerSessionCookie,
} from '../lib/cookies'
import { ApiError, sendError } from '../lib/errors'
import { createUserClient } from '../lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  try {
    const session = readCustomerSessionCookie(req)
    if (!session) return res.status(401).json({ error: 'Authentication required.' })

    const supabase = createUserClient(session.accessToken)
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) {
      clearCustomerSessionCookie(res)
      return res.status(401).json({ error: 'Authentication required.' })
    }

    let accessToken = session.accessToken
    if (session.expiresAt - 300 <= Math.floor(Date.now() / 1000)) {
      const refreshed = await supabase.auth.refreshSession({ refresh_token: session.refreshToken })
      if (!refreshed.data.session) {
        clearCustomerSessionCookie(res)
        return res.status(401).json({ error: 'Authentication required.' })
      }
      accessToken = refreshed.data.session.access_token
      setCustomerSessionCookie(res, {
        accessToken,
        refreshToken: refreshed.data.session.refresh_token,
        expiresAt: refreshed.data.session.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
      })
    }

    const customerClient = createUserClient(accessToken)
    const { data: customer, error: customerError } = await customerClient
      .from('customers')
      .select('id,full_name,email')
      .eq('auth_user_id', data.user.id)
      .maybeSingle()
    if (customerError) throw new ApiError(500, 'Unable to load the customer account.')
    if (!customer) {
      clearCustomerSessionCookie(res)
      return res.status(401).json({ error: 'Authentication required.' })
    }

    return res.status(200).json({
      authenticated: true,
      user: { id: data.user.id, email: customer.email, full_name: customer.full_name },
    })
  } catch (error) {
    return sendError(res, error)
  }
}
