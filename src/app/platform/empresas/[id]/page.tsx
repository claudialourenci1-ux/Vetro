import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeading } from '@/app/_components/app-shell'
import { PlatformShell } from '@/app/_components/platform-shell'
import { PlatformInviteUser } from '@/app/_components/platform-invite-user'

type CompanyRow = Record<string, unknown>
type MembershipRow = {
  user_id: string
  company_id: string
  role: string | null
  is_active: boolean | null
  updated_at: string | null
  profiles: { full_name?: string | null }[] | null
}

type UserRow = {
  user_id: string
  full_name: string | null
  company_role: string | null
  membership_active: boolean | null
  updated_at: string | null
}

const number = (value: unknown) => new Intl.NumberFormat('pt-BR').format(Number(value ?? 0))
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const roleLabel = (role?: string | null) => ({ admin: 'Admin', manager: 'Gestor', collaborator: 'Colaborador' }[role ?? ''] ?? 'Sem função')
const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'

export default async function PlatformCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  const { data: profile } = userId ? await supabase.from('profiles').select('global_role').eq('id', userId).maybeSingle() : { data: null }
  if (profile?.global_role !== 'super_admin') redirect('/')

  const [{ data: companyData }, { data: membershipsData }] = await Promise.all([
    supabase.from('platform_companies_overview').select('*').eq('id', id).maybeSingle(),
    supabase.from('company_memberships').select('user_id,company_id,role,is_active,updated_at,profiles(full_name)').eq('company_id', id).order('updated_at', { ascending: false }),
  ])
  if (!companyData) redirect('/platform/empresas')

  const company = companyData as CompanyRow
  const users: UserRow[] = ((membershipsData ?? []) as MembershipRow[]).map((membership) => ({
    user_id: membership.user_id,
    full_name: membership.profiles?.[0]?.full_name ?? null,
    company_role: membership.role,
    membership_active: membership.is_active,
    updated_at: membership.updated_at,
  }))
  const admins = users.filter((user) => user.company_role === 'admin')
  const managers = users.filter((user) => user.company_role === 'manager')
  const collaborators = users.filter((user) => user.company_role === 'collaborator')
  const companyName = String(company.name ?? 'Empresa')

  return <PlatformShell>
    <PageHeading eyebrow="Empresa" title={companyName}><PlatformInviteUser companyId={id} companyName={companyName} /></PageHeading>

    <section className="metric-grid platform-metrics compact">
      <article className="metric-card"><div className="metric-label">Usuários</div><div className="metric">{number(company.users_count)}</div></article>
      <article className="metric-card"><div className="metric-label">Empreendimentos</div><div className="metric">{number(company.developments_count)}</div></article>
      <article className="metric-card"><div className="metric-label">Parceiros</div><div className="metric">{number(company.partners_count)}</div></article>
      <article className="metric-card"><div className="metric-label">VGV acompanhado</div><div className="metric">{brl.format(Number(company.gross_sales_value ?? 0))}</div></article>
    </section>

    <section className="overview-grid platform-overview-grid">
      <article className="data-panel">
        <div className="panel-heading"><div><p className="eyebrow">Acessos</p><h2>Equipe autorizada</h2></div><span>{users.length} usuários</span></div>
        {users.length ? <div className="company-access-list">{users.map((user) => <div className="company-access-row" key={user.user_id}><div><b>{user.full_name || 'Usuário'}</b><span>ID {user.user_id.slice(0, 8)}</span></div><div><span className="role-pill">{roleLabel(user.company_role)}</span></div><div><b>{user.membership_active === false ? 'Suspenso' : 'Ativo'}</b><span>Atualizado: {dateTime(user.updated_at)}</span></div></div>)}</div> : <p className="panel-empty">Nenhum acesso foi vinculado a esta empresa ainda.</p>}
      </article>

      <article className="data-panel">
        <div className="panel-heading"><div><p className="eyebrow">Estrutura</p><h2>Hierarquia atual</h2></div><span>Controle</span></div>
        <div className="settings-list">
          <div><span>Admins</span><b>{admins.length}</b></div>
          <div><span>Gestores</span><b>{managers.length}</b></div>
          <div><span>Colaboradores</span><b>{collaborators.length}</b></div>
          <div><span>Status contratual</span><b>{String(company.contract_status ?? 'active')}</b></div>
          <div><span>Plano</span><b>{String(company.plan_name ?? 'Não definido')}</b></div>
        </div>
      </article>
    </section>
  </PlatformShell>
}
