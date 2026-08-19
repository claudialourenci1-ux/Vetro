import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeading } from '@/app/_components/app-shell'
import { PlatformShell } from '@/app/_components/platform-shell'

type UserRow = {
  user_id: string
  email: string | null
  full_name: string | null
  global_role: string | null
  company_id: string | null
  company_name: string | null
  company_role: string | null
  membership_active: boolean | null
  email_confirmed_at: string | null
  last_sign_in_at: string | null
  user_created_at: string | null
}

const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Nunca'
const roleLabel = (role?: string | null) => ({ super_admin: 'Super Admin', admin: 'Admin', manager: 'Gestor', collaborator: 'Colaborador' }[role ?? ''] ?? 'Sem função')

export default async function PlatformUsersPage() {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  const { data: profile } = userId ? await supabase.from('profiles').select('global_role').eq('id', userId).maybeSingle() : { data: null }
  if (profile?.global_role !== 'super_admin') redirect('/')

  const { data } = await supabase.rpc('get_platform_users_directory')
  const users = (data ?? []) as UserRow[]

  const admins = users.filter((user) => user.company_role === 'admin').length
  const managers = users.filter((user) => user.company_role === 'manager').length
  const collaborators = users.filter((user) => user.company_role === 'collaborator').length

  return <PlatformShell>
    <PageHeading eyebrow="Plataforma" title="Usuários" />

    <section className="metric-grid platform-metrics compact">
      <article className="metric-card"><div className="metric-label">Usuários cadastrados</div><div className="metric">{users.length}</div></article>
      <article className="metric-card"><div className="metric-label">Admins</div><div className="metric">{admins}</div></article>
      <article className="metric-card"><div className="metric-label">Gestores</div><div className="metric">{managers}</div></article>
      <article className="metric-card"><div className="metric-label">Colaboradores</div><div className="metric">{collaborators}</div></article>
    </section>

    <section className="platform-section-intro"><div><h2>Diretório de acessos</h2><p className="subtle">Quem entra na VETRO, em qual empresa e com qual nível de acesso.</p></div></section>

    <section className="platform-users-table">
      <div className="platform-user-head"><span>Usuário</span><span>Empresa</span><span>Função</span><span>Status</span><span>Último acesso</span></div>
      {users.map((user) => <article className="platform-user-row" key={`${user.user_id}-${user.company_id ?? 'global'}`}>
        <div><b>{user.full_name || user.email || 'Usuário'}</b><small>{user.email}</small></div>
        <div><b>{user.company_name || 'VETRO Platform'}</b><small>{user.global_role === 'super_admin' ? 'acesso global' : 'workspace'}</small></div>
        <div><span className="role-pill">{user.global_role === 'super_admin' ? 'Super Admin' : roleLabel(user.company_role)}</span></div>
        <div><span className={`status-pill ${user.membership_active === false ? 'inactive' : 'active'}`}>{user.email_confirmed_at ? (user.membership_active === false ? 'Suspenso' : 'Ativo') : 'Convite pendente'}</span></div>
        <div><b>{dateTime(user.last_sign_in_at)}</b><small>Criado em {dateTime(user.user_created_at)}</small></div>
      </article>)}
    </section>
  </PlatformShell>
}
