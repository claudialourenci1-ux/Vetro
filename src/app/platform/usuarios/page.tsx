import { requireSuperAdmin } from '@/lib/auth/server'
import { PageHeading } from '@/app/_components/app-shell'
import { PlatformShell } from '@/app/_components/platform-shell'

type ProfileRow = { id: string; full_name: string | null; global_role: string | null; created_at: string | null }
type MembershipRow = { user_id: string; company_id: string; role: string | null; is_active: boolean | null; updated_at: string | null; companies: { name?: string | null } | null }
type UserRow = {
  user_id: string
  full_name: string | null
  global_role: string | null
  company_id: string | null
  company_name: string | null
  company_role: string | null
  membership_active: boolean | null
  user_created_at: string | null
  membership_updated_at: string | null
}

const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
const roleLabel = (role?: string | null) => ({ super_admin: 'Super Admin', admin: 'Admin', manager: 'Gestor', collaborator: 'Colaborador' }[role ?? ''] ?? 'Sem função')

export default async function PlatformUsersPage() {
  const { supabase } = await requireSuperAdmin()

  const [{ data: profilesData }, { data: membershipsData }] = await Promise.all([
    supabase.from('profiles').select('id,full_name,global_role,created_at').order('created_at', { ascending: false }),
    supabase.from('company_memberships').select('user_id,company_id,role,is_active,updated_at,companies(name)').order('updated_at', { ascending: false }),
  ])

  const profiles = (profilesData ?? []) as ProfileRow[]
  const memberships = (membershipsData ?? []) as MembershipRow[]
  const membershipsByUser = new Map<string, MembershipRow[]>()
  memberships.forEach((membership) => membershipsByUser.set(membership.user_id, [...(membershipsByUser.get(membership.user_id) ?? []), membership]))

  const users: UserRow[] = profiles.flatMap<UserRow>((userProfile): UserRow[] => {
    const userMemberships = membershipsByUser.get(userProfile.id) ?? []
    if (!userMemberships.length) {
      return [{ user_id: userProfile.id, full_name: userProfile.full_name, global_role: userProfile.global_role, company_id: null, company_name: null, company_role: null, membership_active: null, user_created_at: userProfile.created_at, membership_updated_at: null }]
    }
    return userMemberships.map<UserRow>((membership) => ({
      user_id: userProfile.id,
      full_name: userProfile.full_name,
      global_role: userProfile.global_role,
      company_id: membership.company_id,
      company_name: membership.companies?.name ?? null,
      company_role: membership.role,
      membership_active: membership.is_active,
      user_created_at: userProfile.created_at,
      membership_updated_at: membership.updated_at,
    }))
  })

  const admins = users.filter((user) => user.company_role === 'admin').length
  const managers = users.filter((user) => user.company_role === 'manager').length
  const collaborators = users.filter((user) => user.company_role === 'collaborator').length

  return <PlatformShell>
    <PageHeading eyebrow="Plataforma" title="Usuários" />

    <section className="metric-grid platform-metrics compact">
      <article className="metric-card"><div className="metric-label">Perfis cadastrados</div><div className="metric">{profiles.length}</div></article>
      <article className="metric-card"><div className="metric-label">Admins</div><div className="metric">{admins}</div></article>
      <article className="metric-card"><div className="metric-label">Gestores</div><div className="metric">{managers}</div></article>
      <article className="metric-card"><div className="metric-label">Colaboradores</div><div className="metric">{collaborators}</div></article>
    </section>

    <section className="platform-section-intro"><div><h2>Diretório de acessos</h2><p className="subtle">Quem está vinculado à VETRO, em qual empresa e com qual nível de acesso.</p></div></section>

    <section className="platform-users-table">
      <div className="platform-user-head"><span>Usuário</span><span>Empresa</span><span>Função</span><span>Status</span><span>Atualização</span></div>
      {users.map((user) => <article className="platform-user-row" key={`${user.user_id}-${user.company_id ?? 'global'}`}>
        <div><b>{user.full_name || (user.global_role === 'super_admin' ? 'Super Admin VETRO' : 'Usuário')}</b><small>ID {user.user_id.slice(0, 8)}</small></div>
        <div><b>{user.company_name || 'VETRO Platform'}</b><small>{user.global_role === 'super_admin' ? 'acesso global' : 'workspace'}</small></div>
        <div><span className="role-pill">{user.global_role === 'super_admin' ? 'Super Admin' : roleLabel(user.company_role)}</span></div>
        <div><span className={`status-pill ${user.membership_active === false ? 'inactive' : 'active'}`}>{user.membership_active === false ? 'Suspenso' : 'Ativo'}</span></div>
        <div><b>{dateTime(user.membership_updated_at || user.user_created_at)}</b><small>Criado em {dateTime(user.user_created_at)}</small></div>
      </article>)}
    </section>
  </PlatformShell>
}
