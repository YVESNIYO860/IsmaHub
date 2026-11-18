import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json')

  const url = process.env.SUPABASE_URL?.trim()
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
  const secretKeyConfigured = Boolean(process.env.SUPABASE_SECRET_KEY?.trim())
  const configured = Boolean(url && publishableKey)

  let supabaseReachable = false
  if (configured) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const response = await fetch(`${url}/auth/v1/settings`, {
        headers: {
          apikey: publishableKey as string,
          Authorization: `Bearer ${publishableKey}`,
        },
        signal: controller.signal,
      })
      clearTimeout(timeout)
      supabaseReachable = response.ok
    } catch {
      supabaseReachable = false
    }
  }

  const status = !configured ? 'configuration_missing' : supabaseReachable ? 'ok' : 'supabase_unreachable'
  res.status(status === 'ok' ? 200 : 503).json({
    status,
    service: 'ismahub-api',
    timestamp: new Date().toISOString(),
    configuration: {
      supabase_url: Boolean(url),
      supabase_publishable_key: Boolean(publishableKey),
      supabase_secret_key: secretKeyConfigured,
    },
    supabase: {
      reachable: supabaseReachable,
    },
  })
}

