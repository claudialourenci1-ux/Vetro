import Link from 'next/link'
import { requireSuperAdmin } from '@/lib/auth/server'
import { PageHeading } from '@/app/_components/app-shell'
import { PlatformShell } from '@/app/_components/platform-shell'
import { PlatformCompanyManager } from '@/app/_components/platform-company-manager'

type CompanyRow = {
  id: string
  name: string | null
  legal_name?: string | null
  document?: string | null
  contract_status?: string | null
  plan_name?: string | null
  users_count?: number | null
  admins_count?: number | null
  managers_count?: number | null
  collaborators_count?: number | null
  developments_count?: number | null
  partners_count?: number | null
  opportunities_count?: number | null
  gross_sales_value?: number | null
  last_activity_at?: string | null
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Sem atividade'

export default async function PlatformCompaniesPage() {
  const { supabase } = await requireSuperAdmin()

  const { data } = await supabase.from('platform_companies_overview').select('*').order('created_at', { ascending: false })
  const companies = (data ?? []) as CompanyRow[]

  return <PlatformShell>
    <PageHeading eyebrow="Plataforma" title="Empresas"><PlatformCompanyManager /></PageHeading>

    <section className="platform-section-intro">
      <div><h2>Clientes VETRO</h2><p className="subtle">Ative incorporadoras, acompanhe estrutura, usuários e o pulso comercial de cada operação.</p></div>
      <div className="platform-count-badge">{companies.length} {companies.length === 1 ? 'empresa' : 'empresas'}</div>
    </section>

    {companies.length ? <section className="platform-company-table">
      <div className="platform-table-head"><span>Empresa</span><span>Acessos</span><span>Operação</span><span>VGV</span><span>Última atividade</span></div>
      {companies.map((company) => <article className="platform-table-row" key={company.id}>
        <div className="platform-company-identity"><span className={`company-status-dot ${company.contract_status === 'active' ? 'active' : ''}`} /><div><Link className="company-link" href={`/platform/empresas/${company.id}`}><b>{company.name ?? 'Empresa'}</b></Link><small>{company.plan_name || company.contract_status || 'Sem plano definido'}</small></div></div>
        <div><b>{company.users_count ?? 0}</b><small>{company.admins_count ?? 0} admin · {company.managers_count ?? 0} gestores · {company.collaborators_count ?? 0} colab.</small></div>
        <div><b>{company.developments_count ?? 0} empreend.</b><small>{company.partners_count ?? 0} parceiros · {company.opportunities_count ?? 0} oportunidades</small></div>
        <div><b>{brl.format(Number(company.gross_sales_value ?? 0))}</b><small>acompanhado</small></div>
        <div><b>{dateTime(company.last_activity_at)}</b><small><Link className="company-link" href={`/platform/empresas/${company.id}`}>Gerenciar acessos →</Link></small></div>
      </article>)}
    </section> : <section className="platform-empty-large"><p className="eyebrow">Primeiro cliente</p><h2>Comece ativando uma incorporadora.</h2><p>O workspace, pipeline padrão e V6 serão preparados automaticamente. Em seguida, o primeiro Admin recebe o convite.</p><PlatformCompanyManager /></section>}
  </PlatformShell>
}
