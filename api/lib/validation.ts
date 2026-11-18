import { ApiError } from './errors'

export type LoginInput = {
  email: string
  password: string
}

export function parseLoginInput(body: unknown): LoginInput {
  if (!body || typeof body !== 'object') throw new ApiError(400, 'Invalid request body.')
  const candidate = body as Record<string, unknown>
  if (typeof candidate.email !== 'string' || typeof candidate.password !== 'string') {
    throw new ApiError(400, 'Email and password are required.')
  }

  const email = candidate.email.trim().toLowerCase()
  const password = candidate.password
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, 'Enter a valid email address.')
  }
  if (password.length < 8 || password.length > 128) {
    throw new ApiError(400, 'Password must be between 8 and 128 characters.')
  }
  return { email, password }
}

export function requireText(value: unknown, field: string, maxLength = 200): string {
  if (typeof value !== 'string') throw new ApiError(400, `${field} is required.`)
  const text = value.trim()
  if (!text) throw new ApiError(400, `${field} is required.`)
  if (text.length > maxLength) throw new ApiError(400, `${field} is too long.`)
  return text
}

export function optionalText(value: unknown, field: string, maxLength = 200): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') throw new ApiError(400, `${field} must be text.`)
  const text = value.trim()
  if (text.length > maxLength) throw new ApiError(400, `${field} is too long.`)
  return text || null
}

export function parseMoney(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ApiError(400, `${field} must be a valid amount.`)
  }
  if (value < 0) throw new ApiError(400, `${field} cannot be negative.`)
  if (Math.abs(value * 100 - Math.round(value * 100)) > 0.00001) {
    throw new ApiError(400, `${field} cannot have more than two decimal places.`)
  }
  return Math.round(value * 100) / 100
}

export function parseOptionalMoney(value: unknown, field: string): number | null {
  if (value === undefined || value === null) return null
  return parseMoney(value, field)
}

export function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new ApiError(400, `${field} must be true or false.`)
  return value
}

export function requireInteger(value: unknown, field: string, allowZero = false): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new ApiError(400, `${field} must be a whole number.`)
  }
  if (!allowZero && value === 0) throw new ApiError(400, `${field} cannot be zero.`)
  if (value < 0) throw new ApiError(400, `${field} cannot be negative.`)
  return value
}

