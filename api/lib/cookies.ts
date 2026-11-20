import type { VercelRequest, VercelResponse } from '@vercel/node'

export type SessionCookie = {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

const STAFF_COOKIE_NAME = 'ismahub_session'
const CUSTOMER_COOKIE_NAME = 'ismahub_customer_session'

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

function setCookie(res: VercelResponse, name: string, session: SessionCookie): void {
  const maxAge = Math.max(0, session.expiresAt - Math.floor(Date.now() / 1000))
  res.setHeader('Set-Cookie', `${name}=${encode(session)}; ${cookieOptions(maxAge)}`)
}

function clearCookie(res: VercelResponse, name: string): void {
  res.setHeader('Set-Cookie', `${name}=; ${cookieOptions(0)}`)
}

function readCookie(req: VercelRequest, name: string): SessionCookie | null {
  const rawCookies = req.headers.cookie
  if (!rawCookies) return null
  const cookie = rawCookies.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))
  if (!cookie) return null
  const value = cookie.slice(name.length + 1)
  return decode(value)
}

export function setSessionCookie(res: VercelResponse, session: SessionCookie): void {
  setCookie(res, STAFF_COOKIE_NAME, session)
}

export function clearSessionCookie(res: VercelResponse): void {
  clearCookie(res, STAFF_COOKIE_NAME)
}

export function readSessionCookie(req: VercelRequest): SessionCookie | null {
  return readCookie(req, STAFF_COOKIE_NAME)
}

export function setCustomerSessionCookie(res: VercelResponse, session: SessionCookie): void {
  setCookie(res, CUSTOMER_COOKIE_NAME, session)
}

export function clearCustomerSessionCookie(res: VercelResponse): void {
  clearCookie(res, CUSTOMER_COOKIE_NAME)
}

export function readCustomerSessionCookie(req: VercelRequest): SessionCookie | null {
  return readCookie(req, CUSTOMER_COOKIE_NAME)
}

