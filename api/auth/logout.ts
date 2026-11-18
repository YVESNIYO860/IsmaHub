import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clearSessionCookie, readSessionCookie } from '../lib/cookies'
import { createUserClient } from '../lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  try {
    const session = readSessionCookie(req)
    if (session) {
      const supabase = createUserClient(session.accessToken)
      await supabase.auth.signOut()
    }
  } catch {
    // Logout remains successful even if the remote session is already invalid.
  }

  clearSessionCookie(res)
  return res.status(200).json({ success: true })
}

