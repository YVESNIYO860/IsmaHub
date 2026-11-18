const attempts = new Map<string, { count: number; resetAt: number }>()

export function isLoginRateLimited(ip: string): boolean {
  const now = Date.now()
  const existing = attempts.get(ip)
  if (!existing || existing.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return false
  }
  existing.count += 1
  return existing.count > 10
}

