import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readSessionCookie, setSessionCookie, clearSessionCookie } from '../lib/cookies'
import { ApiError, sendError } from '../lib/errors'
import { createUserClient } from '../lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  try {
    const session = readSessionCookie(req)
    if (!session) return res.status(401).json({ error: 'Authentication required.' })

    const supabase = createUserClient(session.accessToken)
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) {
      clearSessionCookie(res)
      return res.status(401).json({ error: 'Authentication required.' })
    }

    const { data: staffProfile, error: profileError } = await supabase
      .from('staff_profiles')
      .select('id,is_active')
      .eq('id', data.user.id)
      .maybeSingle()
    if (profileError) throw new ApiError(503, 'Unable to verify staff access.')
    if (!staffProfile || !staffProfile.is_active) {
      clearSessionCookie(res)
      return res.status(401).json({ error: 'Authentication required.' })
    }

    if (session.expiresAt - 300 <= Math.floor(Date.now() / 1000)) {
      const refreshed = await supabase.auth.refreshSession({
        refresh_token: session.refreshToken,
      })
      if (refreshed.data.session) {
        setSessionCookie(res, {
          accessToken: refreshed.data.session.access_token,
          refreshToken: refreshed.data.session.refresh_token,
          expiresAt: refreshed.data.session.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
        })
      }
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })
  } catch (error) {
    return sendError(res, error)
  }
}
