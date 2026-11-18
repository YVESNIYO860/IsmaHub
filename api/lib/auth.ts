import type { VercelRequest } from '@vercel/node'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { readSessionCookie } from './cookies'
import { ApiError } from './errors'
import { createUserClient } from './supabase'

export type AuthenticatedContext = {
  supabase: SupabaseClient
  user: User
}

export async function requireAuthenticatedUser(
  req: VercelRequest,
): Promise<AuthenticatedContext> {
  const session = readSessionCookie(req)
  if (!session) throw new ApiError(401, 'Authentication required.')

  const supabase = createUserClient(session.accessToken)
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new ApiError(401, 'Authentication required.')
  return { supabase, user: data.user }
}

export async function requirePermission(
  req: VercelRequest,
  permission: string,
): Promise<AuthenticatedContext> {
  const context = await requireAuthenticatedUser(req)
  const { data, error } = await context.supabase.rpc('has_permission', {
    permission_code: permission,
  })
  if (error) throw new ApiError(403, 'Permission check failed.')
  if (data !== true) throw new ApiError(403, 'You do not have permission for this operation.')
  return context
}

