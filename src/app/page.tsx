import Link from 'next/link'
import { getCurrentProfile, getCurrentUser } from '@/lib/auth/server'
import { getCompanyWorkspace } from '@/lib/workspace/server'
import { AppShell, PageHeading } from './_components/app-shell'
import { CommercialCockpit } from './_components/commercial-cockpit'
import { LandingPage } from './_components/landing-page'
import { PlatformShell } from './_components/platform-shell'
import { OnboardingCard } from './_components/onboarding-card'

type DataRecord = Record<string, unknown>
type SearchParams = { from?: string | string[]; to?: string | string[]; development?: string | string[] }
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const number = (value: unknown) => new Intl.NumberFormat('pt-BR').format(Number(value ?? 0))
const value = (row: DataRecord | null, keys: string[]) => keys.map((key) => row?.[key]).find((item) => item !== undefined && item !== null)
const dateTime = (value: unknown) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(String(value))) : 'Sem atividade'
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value
const validDate = (value: string | undefined) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))
const validUuid = (value: string | undefined) => Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
const iso = (date: Date) => date.toISOString().slice(0, 10)

export default async function HomePage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const { supabase, user } = await getCurrentUser()
  if (!user) return <LandingPage />

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

    return <PlatformShell>
      <PageHeading eyebrow="VETRO Platform" title="Control Center"><Link className="primary action-link" href="/platform/empresas">+ Nova empresa</Link></PageHeading>
      <section className="platform-hero"><div><p className="eyebrow">Pulso da VETRO</p><h2>Acompanhe o coração da plataforma.</h2><p className="subtle">Empresas, usuários, operação comercial, atividade e sinais de atenção em um único lugar.</p></div><div className="platform-pulse-status"><span className="workspace-dot" /><b>Plataforma operacional</b></div></section>
      <section className="metric-grid platform-metrics">{platformCards.map(([label, cardValue]) => <article className="metric-card" key={String(label)}><div className="metric-label">{label}</div><div className="metric">{cardValue}</div></article>)}</section>
      <section className="overview-grid platform-overview-grid">
        <article className="data-panel"><div className="panel-heading"><div><p className="eyebrow">Empresas</p><h2>Operações na plataforma</h2></div><Link href="/platform/empresas">Ver todas</Link></div>{companies.length ? <div className="company-list">{companies.map((company) => <div className="company-row" key={String(company.id)}><div><b>{String(company.name ?? 'Empresa')}</b><span>{String(company.contract_status ?? 'active')} · {number(company.users_count)} usuários · {number(company.developments_count)} empreendimentos</span></div><div className="company-row-right"><b>{brl.format(Number(company.gross_sales_value ?? 0))}</b><span>{dateTime(company.last_activity_at)}</span></div></div>)}</div> : <div className="platform-empty"><p>Nenhuma incorporadora foi ativada ainda.</p><Link className="primary action-link" href="/platform/empresas">Cadastrar primeira empresa</Link></div>}</article>
        <article className="data-panel"><div className="panel-heading"><div><p className="eyebrow">Atividade</p><h2>Últimos movimentos</h2></div><Link href="/platform/atividade">Abrir histórico</Link></div>{activity.length ? <div className="activity-list">{activity.map((event) => <div className="activity-row" key={String(event.id)}><span className="activity-dot" /><div><b>{String(event.company_name ?? 'VETRO')}</b><span>{String(event.event_type ?? 'atividade')}</span></div><time>{dateTime(event.created_at)}</time></div>)}</div> : <p className="panel-empty">As ações importantes da plataforma aparecerão aqui conforme a operação começar.</p>}</article>
      </section>
      <section className="platform-health-strip"><div><span>Admins</span><b>{number(value(metrics, ['admins']))}</b></div><div><span>Gestores</span><b>{number(value(metrics, ['managers']))}</b></div><div><span>Colaboradores</span><b>{number(value(metrics, ['collaborators']))}</b></div><div><span>Oportunidades</span><b>{number(value(metrics, ['opportunities']))}</b></div><div><span>Vendas</span><b>{number(value(metrics, ['sales']))}</b></div><div className={Number(value(metrics, ['import_errors_last_24h']) ?? 0) > 0 ? 'needs-attention' : ''}><span>Erros de importação 24h</span><b>{number(value(metrics, ['import_errors_last_24h']))}</b></div></section>
    </PlatformShell>
  }

  const workspace = await getCompanyWorkspace()
  if (!workspace) return <AppShell><OnboardingCard /></AppShell>

  const requested = await searchParams ?? {}
  const today = new Date()
  const todayIso = iso(today)
  const defaultFromDate = new Date(today)
  defaultFromDate.setUTCDate(defaultFromDate.getUTCDate() - 29)
  const requestedFrom = first(requested.from)
  const requestedTo = first(requested.to)
  const requestedDevelopment = first(requested.development)
  const dateFrom = validDate(requestedFrom) ? requestedFrom! : iso(defaultFromDate)
  const dateTo = validDate(requestedTo) ? requestedTo! : todayIso
  const safeFrom = dateFrom <= dateTo ? dateFrom : dateTo
  const safeTo = dateFrom <= dateTo ? dateTo : dateFrom
  const developmentId = validUuid(requestedDevelopment) ? requestedDevelopment : undefined
  const asOfDate = safeTo < todayIso ? safeTo : todayIso

  type CockpitRpcClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> }
  const cockpitClient = supabase as unknown as CockpitRpcClient
  const cockpitArgs: Record<string, unknown> = { target_company_id: workspace.company.id, date_from: safeFrom, date_to: safeTo }
  const goalArgs: Record<string, unknown> = { target_company_id: workspace.company.id, as_of_date: asOfDate }
  if (developmentId) { cockpitArgs.target_development_id = developmentId; goalArgs.target_development_id = developmentId }

  const [cockpitResult, goalResult, developmentsResult] = await Promise.all([
    cockpitClient.rpc('get_commercial_cockpit', cockpitArgs),
    cockpitClient.rpc('get_vgv_goal_progress', goalArgs),
    supabase.from('developments').select('id,name').eq('company_id', workspace.company.id).eq('status', 'active').order('name'),
  ])

  let cockpitData = cockpitResult.data
  if (cockpitData && typeof cockpitData === 'object' && !Array.isArray(cockpitData) && goalResult.data && typeof goalResult.data === 'object' && !Array.isArray(goalResult.data)) {
    const source = cockpitData as DataRecord
    const progress = goalResult.data as DataRecord
    const sourceForecast = source.forecast && typeof source.forecast === 'object' && !Array.isArray(source.forecast) ? source.forecast as DataRecord : {}
    cockpitData = progress.active === true
      ? {
          ...source,
          goal: {
            target: progress.target,
            realized: progress.realized,
            attainment_pct: progress.attainment_pct,
            gap: progress.gap,
            remaining_daily_pace: progress.remaining_daily_pace,
            period_start: progress.period_start,
            period_end: progress.period_end,
            remaining_days: progress.remaining_days,
          },
          forecast: {
            ...sourceForecast,
            run_rate_forecast: progress.run_rate_forecast,
            target: progress.target,
            confidence: progress.confidence,
            goal_period_start: progress.period_start,
            goal_period_end: progress.period_end,
          },
        }
      : { ...source, goal: {}, forecast: { ...sourceForecast, target: null } }
  }

  return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}>
    {cockpitResult.error
      ? <section className="workspace-error"><strong>Não foi possível carregar o cockpit comercial.</strong><span>{cockpitResult.error.message}</span></section>
      : <CommercialCockpit companyId={workspace.company.id} companyName={workspace.company.name} dateFrom={safeFrom} dateTo={safeTo} developments={(developmentsResult.data ?? []) as Array<{ id: string; name: string }>} raw={cockpitData} selectedDevelopmentId={developmentId} />}
  </AppShell>
}
