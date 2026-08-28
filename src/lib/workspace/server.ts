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

type WorkspaceContextRow = {
  company_id: string
  company_name: string
  company_slug: string
  membership_role: CompanyRole
  membership_active: boolean
}

type WorkspaceRpcClient = {
  rpc: (
    fn: 'get_my_workspace_context',
  ) => Promise<{ data: WorkspaceContextRow[] | null; error: { message: string } | null }>
}

export type CompanyWorkspace = {
  company: CompanyRelation
  membership: {
    company_id: string
    role: CompanyRole
  }
  permissions: CompanyPermission[]
}

export async function getCompanyWorkspace(): Promise<CompanyWorkspace | null> {
  const { supabase } = await requireAuthenticatedUser()

  const { data: contextRows, error } = await (supabase as unknown as WorkspaceRpcClient).rpc(
    'get_my_workspace_context',
  )
  const context = contextRows?.[0]

  if (error || !context || !context.membership_active) return null

  const { data: permissionRows } = await supabase.rpc('get_my_company_permissions', {
    target_company_id: context.company_id,
  })

  const permissions = (permissionRows ?? [])
    .filter((row) => row.allowed)
    .map((row) => row.permission)

  return {
    company: {
      id: context.company_id,
      name: context.company_name,
      slug: context.company_slug,
    },
    membership: {
      company_id: context.company_id,
      role: context.membership_role,
    },
    permissions,
  }
}

export async function requireCompanyWorkspace(): Promise<CompanyWorkspace> {
  const workspace = await getCompanyWorkspace()
  if (!workspace) redirect('/access-restricted')
  return workspace
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
