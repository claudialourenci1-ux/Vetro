import 'server-only'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

export type CurrentProfile = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'full_name' | 'global_role' | 'created_at'
>

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { supabase, user: error ? null : user }
}

export async function getCurrentProfile(userId?: string): Promise<CurrentProfile | null> {
  const { supabase, user } = await getCurrentUser()
  const id = userId ?? user?.id
  if (!id) return null

  const { data } = await supabase.from('profiles').select('id, full_name, global_role, created_at').eq('id', id).maybeSingle()
  return data
}

export async function requireAuthenticatedUser() {
  const { supabase, user } = await getCurrentUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function requireSuperAdmin() {
  const { supabase, user } = await requireAuthenticatedUser()
  const { data: profile } = await supabase.from('profiles').select('id, full_name, global_role, created_at').eq('id', user.id).maybeSingle()
  if (!profile || profile.global_role !== 'super_admin') redirect('/access-restricted')
  return { supabase, user, profile }
}
