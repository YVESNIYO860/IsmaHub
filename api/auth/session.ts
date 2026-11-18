import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readSessionCookie, setSessionCookie, clearSessionCookie } from '../lib/cookies'
import { sendError } from '../lib/errors'
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
