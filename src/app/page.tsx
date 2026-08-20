import Link from 'next/link'
import { getCurrentProfile, requireAuthenticatedUser } from '@/lib/auth/server'
import { getCompanyWorkspace } from '@/lib/workspace/server'
import { AppShell, PageHeading } from './_components/app-shell'
import { PlatformShell } from './_components/platform-shell'
import { OnboardingCard } from './_components/onboarding-card'

type DataRecord = Record<string, unknown>
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const number = (value: unknown) => new Intl.NumberFormat('pt-BR').format(Number(value ?? 0))
const value = (row: DataRecord | null, keys: string[]) => keys.map((key) => row?.[key]).find((item) => item !== undefined && item !== null)
const dateTime = (value: unknown) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(String(value))) : 'Sem atividade'

export default async function HomePage() {
  const { supabase, user } = await requireAuthenticatedUser()
  const profile = await getCurrentProfile(user.id)

  if (profile?.global_role === 'super_admin') {
    const [metricsResult, companiesResult, activityResult] = await Promise.all([
      supabase.rpc('get_platform_overview_metrics'),
      supabase.from('platform_companies_overview').select('*').order('last_activity_at', { ascending: false, nullsFirst: false }).limit(8),
      supabase.rpc('get_platform_recent_activity', { limit_rows: 10 }),
    ])

    const metrics = metricsResult.data as DataRecord | null
    const companies = (companiesResult.data ?? []) as DataRecord[]
    const activity = (activityResult.data ?? []) as DataRecord[]
    const platformCards = [
      ['Empresas ativas', number(value(metrics, ['companies_active']))],
      ['Usuários ativos', number(value(metrics, ['users_active']))],
      ['Gestores', number(value(metrics, ['managers']))],
      ['Empreendimentos', number(value(metrics, ['developments']))],
      ['Parceiros', number(value(metrics, ['partners']))],
      ['VGV acompanhado', brl.format(Number(value(metrics, ['gross_sales_value']) ?? 0))],
    ]

    return (
      <PlatformShell>
        <PageHeading eyebrow="VETRO Platform" title="Control Center">
          <Link className="primary action-link" href="/platform/empresas">+ Nova empresa</Link>
        </PageHeading>
        <section className="platform-hero">
          <div><p className="eyebrow">Pulso da VETRO</p><h2>Acompanhe o coração da plataforma.</h2><p className="subtle">Empresas, usuários, operação comercial, atividade e sinais de atenção em um único lugar.</p></div>
          <div className="platform-pulse-status"><span className="workspace-dot" /><b>Plataforma operacional</b></div>
        </section>
        <section className="metric-grid platform-metrics">{platformCards.map(([label, cardValue]) => <article className="metric-card" key={String(label)}><div className="metric-label">{label}</div><div className="metric">{cardValue}</div></article>)}</section>
        <section className="overview-grid platform-overview-grid">
          <article className="data-panel">
            <div className="panel-heading"><div><p className="eyebrow">Empresas</p><h2>Operações na plataforma</h2></div><Link href="/platform/empresas">Ver todas</Link></div>
            {companies.length ? <div className="company-list">{companies.map((company) => <div className="company-row" key={String(company.id)}><div><b>{String(company.name ?? 'Empresa')}</b><span>{String(company.contract_status ?? 'active')} · {number(company.users_count)} usuários · {number(company.developments_count)} empreendimentos</span></div><div className="company-row-right"><b>{brl.format(Number(company.gross_sales_value ?? 0))}</b><span>{dateTime(company.last_activity_at)}</span></div></div>)}</div> : <div className="platform-empty"><p>Nenhuma incorporadora foi ativada ainda.</p><Link className="primary action-link" href="/platform/empresas">Cadastrar primeira empresa</Link></div>}
          </article>
          <article className="data-panel">
            <div className="panel-heading"><div><p className="eyebrow">Atividade</p><h2>Últimos movimentos</h2></div><Link href="/platform/atividade">Abrir histórico</Link></div>
            {activity.length ? <div className="activity-list">{activity.map((event) => <div className="activity-row" key={String(event.id)}><span className="activity-dot" /><div><b>{String(event.company_name ?? 'VETRO')}</b><span>{String(event.event_type ?? 'atividade')}</span></div><time>{dateTime(event.created_at)}</time></div>)}</div> : <p className="panel-empty">As ações importantes da plataforma aparecerão aqui conforme a operação começar.</p>}
          </article>
        </section>
        <section className="platform-health-strip">
          <div><span>Admins</span><b>{number(value(metrics, ['admins']))}</b></div><div><span>Gestores</span><b>{number(value(metrics, ['managers']))}</b></div><div><span>Colaboradores</span><b>{number(value(metrics, ['collaborators']))}</b></div><div><span>Oportunidades</span><b>{number(value(metrics, ['opportunities']))}</b></div><div><span>Vendas</span><b>{number(value(metrics, ['sales']))}</b></div><div className={Number(value(metrics, ['import_errors_last_24h']) ?? 0) > 0 ? 'needs-attention' : ''}><span>Erros de importação 24h</span><b>{number(value(metrics, ['import_errors_last_24h']))}</b></div>
        </section>
      </PlatformShell>
    )
  }

  const workspace = await getCompanyWorkspace()
  const companyId = workspace?.company.id

  const [metricsResult, rankingResult, pipelineResult] = companyId ? await Promise.all([
    supabase.rpc('get_overview_metrics', { target_company_id: companyId }),
    supabase.from('partner_performance').select('*').eq('company_id', companyId).order('gross_sales_value', { ascending: false }).limit(5),
    supabase.from('pipeline_overview').select('*').eq('company_id', companyId),
  ]) : [{ data: null }, { data: [] }, { data: [] }]

  const metrics = metricsResult.data as DataRecord | null
  const ranking = (rankingResult.data ?? []) as DataRecord[]
  const pipeline = (pipelineResult.data ?? []) as DataRecord[]
  const cards = [
    ['Parceiros ativos', number(value(metrics, ['partners', 'active_partners']))],
    ['Corretores ativos', number(value(metrics, ['active_brokers', 'brokers']))],
    ['Oportunidades', number(value(metrics, ['opportunities', 'total_opportunities']))],
    ['Vendas', number(value(metrics, ['sales', 'total_sales']))],
    ['VGV', brl.format(Number(value(metrics, ['gross_sales_value', 'vgv', 'sales_value']) ?? 0))],
    ['Conversão', `${Number(value(metrics, ['conversion_rate', 'conversion']) ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`],
  ]

  return (
    <AppShell companyName={workspace?.company.name} role={workspace?.membership.role} permissions={workspace?.permissions}>
      <PageHeading eyebrow="Overview" title={workspace?.company.name ?? 'Sua operação comercial'} />
      {!workspace ? <OnboardingCard /> : <>
        <section className="metric-grid">{cards.map(([label, cardValue]) => <article className="metric-card" key={String(label)}><div className="metric-label">{label}</div><div className="metric">{cardValue}</div></article>)}</section>
        <section className="overview-grid">
          <article className="data-panel"><div className="panel-heading"><div><p className="eyebrow">Parceiros</p><h2>Ranking de performance</h2></div><span>Top 5</span></div>{ranking.length ? <ol className="ranking-list">{ranking.map((partner, index) => <li key={String(value(partner, ['partner_id', 'id', 'partner_name']))}><b>{String(value(partner, ['partner_name', 'name']) ?? 'Parceiro')}</b><span>#{index + 1} · {brl.format(Number(value(partner, ['gross_sales_value', 'sales_value', 'vgv']) ?? 0))}</span></li>)}</ol> : <p className="panel-empty">Ainda não há performance de parceiros para este período.</p>}</article>
          <article className="data-panel"><div className="panel-heading"><div><p className="eyebrow">Pipeline</p><h2>Visão por etapa</h2></div><span>{pipeline.length} etapas</span></div>{pipeline.length ? <div className="pipeline-list">{pipeline.map((stage) => <div className="pipeline-row" key={String(value(stage, ['stage_id', 'id', 'stage_name']))}><span>{String(value(stage, ['stage_name', 'name']) ?? 'Etapa')}</span><b>{number(value(stage, ['opportunities', 'opportunity_count', 'count']))}</b></div>)}</div> : <p className="panel-empty">O pipeline aparecerá aqui quando as oportunidades entrarem na operação.</p>}</article>
        </section>
      </>}
    </AppShell>
  )
}
