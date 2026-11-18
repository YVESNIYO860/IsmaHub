import type { VercelRequest, VercelResponse } from '@vercel/node'

export type SessionCookie = {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

const COOKIE_NAME = 'ismahub_session'

function encode(value: SessionCookie): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
}

function decode(value: string): SessionCookie | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<SessionCookie>
    if (
      typeof parsed.accessToken !== 'string'
      || typeof parsed.refreshToken !== 'string'
      || typeof parsed.expiresAt !== 'number'
    ) return null
    return parsed as SessionCookie
  } catch {
    return null
  }
}

function cookieOptions(maxAge?: number): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  const age = typeof maxAge === 'number' ? `; Max-Age=${maxAge}` : ''
  return `Path=/; HttpOnly; SameSite=Lax${secure}${age}`
}

export function setSessionCookie(res: VercelResponse, session: SessionCookie): void {
  const maxAge = Math.max(0, session.expiresAt - Math.floor(Date.now() / 1000))
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encode(session)}; ${cookieOptions(maxAge)}`)
}

export function clearSessionCookie(res: VercelResponse): void {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; ${cookieOptions(0)}`)
}

export function readSessionCookie(req: VercelRequest): SessionCookie | null {
  const rawCookies = req.headers.cookie
  if (!rawCookies) return null
  const cookie = rawCookies.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE_NAME}=`))
  if (!cookie) return null
  const value = cookie.slice(COOKIE_NAME.length + 1)
  return decode(value)
}

