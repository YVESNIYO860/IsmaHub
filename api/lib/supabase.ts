import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type ServerSupabaseConfig = {
  url: string
  publishableKey: string
  secretKey?: string
}

export function getServerSupabaseConfig(): ServerSupabaseConfig {
  const url = process.env.SUPABASE_URL
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!url || !publishableKey) {
    throw new Error('Missing required server Supabase configuration.')
  }

  return {
    url,
    publishableKey,
    secretKey: secretKey || undefined,
  }
}

export function createUserClient(accessToken?: string): SupabaseClient {
  const { url, publishableKey } = getServerSupabaseConfig()
  return createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  })
}

export function createPrivilegedClient(): SupabaseClient | null {
  const { url, secretKey } = getServerSupabaseConfig()
  if (!secretKey) return null
  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

