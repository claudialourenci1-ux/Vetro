import 'server-only'

import { redirect } from 'next/navigation'
import { requireAuthenticatedUser } from '@/lib/auth/server'
import type { Database } from '@/lib/supabase/database.types'

export type CompanyPermission = Database['public']['Enums']['company_permission']
export type CompanyRole = Database['public']['Enums']['app_role']

type CompanyRelation = {
  id: string
  name: string
  slug: string
}

export type CompanyWorkspace = {
  company: CompanyRelation
  membership: {
    company_id: string
    role: CompanyRole
  }
  permissions: CompanyPermission[]
}

function normalizeCompanyRelation(value: CompanyRelation | CompanyRelation[] | null): CompanyRelation | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

export async function requireCompanyWorkspace(): Promise<CompanyWorkspace> {
  const { supabase, user } = await requireAuthenticatedUser()
  const { data: membership, error } = await supabase
    .from('company_memberships')
    .select('company_id, role, companies(id, name, slug)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  const company = normalizeCompanyRelation(membership?.companies ?? null)
  if (error || !membership || !company) redirect('/access-restricted')

  const { data: permissionRows } = await supabase.rpc('get_my_company_permissions', {
    target_company_id: membership.company_id,
  })

  const permissions = (permissionRows ?? [])
    .filter((row) => row.allowed)
    .map((row) => row.permission)

  return {
    company,
    membership: {
      company_id: membership.company_id,
      role: membership.role,
    },
    permissions,
  }
}

export function hasCompanyPermission(
  workspace: CompanyWorkspace,
  permission: CompanyPermission,
) {
  return workspace.membership.role === 'admin' || workspace.permissions.includes(permission)
}

export async function requireCompanyPermission(permission: CompanyPermission) {
  const workspace = await requireCompanyWorkspace()
  if (!hasCompanyPermission(workspace, permission)) redirect('/access-restricted')
  return workspace
}
