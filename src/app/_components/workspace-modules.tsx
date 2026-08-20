import {
  Activity,
  BadgeCheck,
  Building2,
  CircleGauge,
  Database,
  FileSpreadsheet,
  Flame,
  Goal,
  Landmark,
  Network,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

type DataRecord = Record<string, unknown>
type ModuleKey =
  | 'parceiros'
  | 'atividades'
  | 'pipeline'
  | 'empreendimentos'
  | 'intelligence'
  | 'equipe'
  | 'importar-dados'
  | 'admin'

type MetricCard = {
  label: string
  value: string
  hint?: string
  icon?: React.ReactNode
}

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})
const integer = new Intl.NumberFormat('pt-BR')
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const shortDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

function asRecord(value: unknown): DataRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as DataRecord
    : {}
}

function text(value: unknown, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function amount(value: unknown) {
  return Number(value ?? 0)
}

function count(value: unknown) {
  return integer.format(amount(value))
}

function money(value: unknown) {
  return brl.format(amount(value))
}

function date(value: unknown) {
  if (!value) return '—'
  return shortDate.format(new Date(String(value)))
}

function relationName(value: unknown, field = 'name') {
  const relation = Array.isArray(value) ? value[0] : value
  return text(asRecord(relation)[field])
}

function valueFrom(row: DataRecord, keys: string[]) {
  return keys.map((key) => row[key]).find((value) => value !== null && value !== undefined)
}

function MetricGrid({ cards }: { cards: MetricCard[] }) {
  return (
    <section className="workspace-summary-grid">
      {cards.map((card) => (
        <article className="workspace-metric-card" key={card.label}>
          <div className="workspace-metric-head">
            <span>{card.label}</span>
            {card.icon}
          </div>
          <strong>{card.value}</strong>
          {card.hint ? <small>{card.hint}</small> : null}
        </article>
      ))}
    </section>
  )
}

function ModuleLead({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <section className="workspace-module-lead">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children ? <div className="workspace-lead-aside">{children}</div> : null}
    </section>
  )
}

function Farol({ value }: { value: unknown }) {
  const label = text(value, 'Sem farol')
  const tone = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return <span className={`workspace-pill farol-${tone.replace(/\s+/g, '-')}`}>{label}</span>
}

function StagePill({ value, tone }: { value: unknown; tone?: unknown }) {
  const label = text(value)
  return <span className={`workspace-pill stage-${text(tone, 'open').toLowerCase()}`}>{label}</span>
}

function ErrorPanel({ message }: { message: string }) {
  return <section className="workspace-error"><strong>Não foi possível carregar este módulo.</strong><span>{message}</span></section>
}

function JsonValue({ value }: { value: unknown }) {
  return <code className="workspace-code">{text(value)}</code>
}

async function PartnersModule({ companyId }: { companyId: string }) {
  const supabase = await createClient()
  const [performanceResult, assignmentsResult, portfoliosResult, snapshotsResult] = await Promise.all([
    supabase
      .from('partner_performance')
      .select('*')
      .eq('company_id', companyId)
      .order('gross_sales_value', { ascending: false })
      .limit(300),
    supabase
      .from('portfolio_partner_assignments')
      .select('partner_id, portfolio_id')
      .eq('company_id', companyId)
      .eq('is_current', true),
    supabase.from('portfolios').select('id, name, manager_name').eq('company_id', companyId),
    supabase
      .from('partner_relationship_snapshots')
      .select('*')
      .eq('company_id', companyId)
      .order('snapshot_date', { ascending: false })
      .limit(500),
  ])

  const error = performanceResult.error ?? assignmentsResult.error ?? portfoliosResult.error ?? snapshotsResult.error
  if (error) return <ErrorPanel message={error.message} />

  const performance = (performanceResult.data ?? []) as DataRecord[]
  const assignments = (assignmentsResult.data ?? []) as DataRecord[]
  const portfolios = (portfoliosResult.data ?? []) as DataRecord[]
  const snapshots = (snapshotsResult.data ?? []) as DataRecord[]

  const portfolioById = new Map(portfolios.map((row) => [String(row.id), row]))
  const portfolioByPartner = new Map(
    assignments.map((row) => [String(row.partner_id), portfolioById.get(String(row.portfolio_id))]),
  )
  const latestSnapshot = new Map<string, DataRecord>()
  for (const snapshot of snapshots) {
    const partnerId = String(snapshot.partner_id)
    if (!latestSnapshot.has(partnerId)) latestSnapshot.set(partnerId, snapshot)
  }

  const declaredBrokers = Array.from(latestSnapshot.values()).reduce(
    (total, row) => total + amount(row.declared_brokers),
    0,
  )
  const partnersWithPipeline = performance.filter((row) => amount(row.opportunities_count) > 0).length
  const partnersWithSales = performance.filter((row) => amount(row.sales_count) > 0).length
  const activeIndex = Array.from(latestSnapshot.values()).filter((row) => amount(row.legacy_activity_score) > 0).length

  return (
    <>
      <ModuleLead
        eyebrow="Carteira comercial"
        title="Toda a rede de parceiros, sem planilha paralela."
        description="A base OAD reúne imobiliárias, carteira responsável, corretores declarados, atividade, pipeline, vendas e o índice operacional legado. O VETRO Score continua separado e em calibração."
      >
        <span className="workspace-status-dot" />
        <b>Base piloto consolidada</b>
      </ModuleLead>

      <MetricGrid cards={[
        { label: 'Parceiros', value: count(performance.length), hint: 'base completa do piloto', icon: <UsersRound size={17} /> },
        { label: 'Corretores declarados', value: count(declaredBrokers), hint: 'informação da operação', icon: <BadgeCheck size={17} /> },
        { label: 'Com pipeline', value: count(partnersWithPipeline), hint: 'ao menos uma oportunidade', icon: <Network size={17} /> },
        { label: 'Com vendas', value: count(partnersWithSales), hint: 'resultado registrado', icon: <Landmark size={17} /> },
        { label: 'Índice ativo', value: count(activeIndex), hint: 'não é o V6', icon: <CircleGauge size={17} /> },
      ]} />

      <section className="workspace-panel">
        <div className="workspace-panel-heading">
          <div><p className="eyebrow">Parceiros</p><h3>Mapa comercial consolidado</h3></div>
          <span>{count(performance.length)} registros</span>
        </div>
        <div className="workspace-table-wrap">
          <table className="workspace-table partners-table">
            <thead><tr><th>Parceiro</th><th>Carteira</th><th>Corretores</th><th>Atividade</th><th>Oportunidades</th><th>Vendas</th><th>VGV</th><th>V6</th></tr></thead>
            <tbody>
              {performance.map((partner) => {
                const partnerId = String(partner.partner_id ?? '')
                const portfolio = portfolioByPartner.get(partnerId)
                const snapshot = latestSnapshot.get(partnerId)
                return (
                  <tr key={partnerId || text(partner.partner_name)}>
                    <td><b>{text(partner.partner_name, 'Parceiro')}</b><small>{text(partner.status, 'active')}</small></td>
                    <td><b>{text(portfolio?.name, 'Sem carteira')}</b><small>{text(portfolio?.manager_name)}</small></td>
                    <td>{count(snapshot?.declared_brokers ?? partner.brokers_count)}</td>
                    <td><b>{decimal.format(amount(snapshot?.legacy_activity_score))}</b><small>Índice comercial</small></td>
                    <td>{count(partner.opportunities_count)}</td>
                    <td>{count(partner.sales_count)}</td>
                    <td><b>{money(partner.gross_sales_value)}</b><small>{date(partner.last_activity_at)}</small></td>
                    <td>{partner.latest_v6_score === null || partner.latest_v6_score === undefined ? <span className="workspace-pill calibration">Calibração</span> : <b>{decimal.format(amount(partner.latest_v6_score))}</b>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

async function ActivitiesModule({ companyId }: { companyId: string }) {
  const supabase = await createClient()
  const [activitiesResult, partnersResult, brokersResult, developmentsResult, portfoliosResult, linksResult] = await Promise.all([
    supabase
      .from('activities')
      .select('id, activity_type, partner_id, broker_id, development_id, secondary_development_id, portfolio_id, client_name, visit_summary, farol, happened_at, quantity, metadata')
      .eq('company_id', companyId)
      .order('happened_at', { ascending: false })
      .limit(150),
    supabase.from('partners').select('id, name').eq('company_id', companyId),
    supabase.from('brokers').select('id, full_name').eq('company_id', companyId),
    supabase.from('developments').select('id, name').eq('company_id', companyId),
    supabase.from('portfolios').select('id, name, manager_name').eq('company_id', companyId),
    supabase.from('activity_brokers').select('activity_id, broker_id, is_primary').eq('company_id', companyId),
  ])

  const error = activitiesResult.error ?? partnersResult.error ?? brokersResult.error ?? developmentsResult.error ?? portfoliosResult.error ?? linksResult.error
  if (error) return <ErrorPanel message={error.message} />

  const activities = (activitiesResult.data ?? []) as DataRecord[]
  const partners = new Map(((partnersResult.data ?? []) as DataRecord[]).map((row) => [String(row.id), text(row.name)]))
  const brokers = new Map(((brokersResult.data ?? []) as DataRecord[]).map((row) => [String(row.id), text(row.full_name)]))
  const developments = new Map(((developmentsResult.data ?? []) as DataRecord[]).map((row) => [String(row.id), text(row.name)]))
  const portfolios = new Map(((portfoliosResult.data ?? []) as DataRecord[]).map((row) => [String(row.id), row]))
  const brokerLinks = new Map<string, string[]>()
  for (const link of (linksResult.data ?? []) as DataRecord[]) {
    const activityId = String(link.activity_id)
    const name = brokers.get(String(link.broker_id))
    if (!name) continue
    brokerLinks.set(activityId, [...(brokerLinks.get(activityId) ?? []), name])
  }

  const labels: Record<string, string> = {
    client_service: 'Atendimento ao cliente',
    partner_visit: 'Visita à imobiliária',
    training: 'Treinamento',
    proposal: 'Proposta',
  }
  const quantityByType = new Map<string, number>()
  for (const activity of activities) {
    const key = text(activity.activity_type, 'other')
    quantityByType.set(key, (quantityByType.get(key) ?? 0) + amount(activity.quantity || 1))
  }
  const withFarol = activities.filter((row) => row.farol).length
  const withSummary = activities.filter((row) => row.visit_summary).length

  return (
    <>
      <ModuleLead
        eyebrow="Rotina comercial"
        title="A operação vira memória institucional."
        description="Cada visita, treinamento, atendimento e proposta alimenta simultaneamente parceiro, carteira, corretor, empreendimento, pipeline e inteligência. Um registro, várias leituras."
      >
        <Activity size={18} />
        <b>100 ações reais OAD</b>
      </ModuleLead>

      <MetricGrid cards={[
        { label: 'Ações registradas', value: count(activities.length), hint: 'linhas operacionais', icon: <Activity size={17} /> },
        { label: 'Atendimentos', value: count(quantityByType.get('client_service')), hint: 'quantidade registrada', icon: <UsersRound size={17} /> },
        { label: 'Visitas', value: count(quantityByType.get('partner_visit')), hint: 'visitas à rede', icon: <Building2 size={17} /> },
        { label: 'Treinamentos', value: count(quantityByType.get('training')), hint: 'ativação comercial', icon: <BadgeCheck size={17} /> },
        { label: 'Com farol', value: count(withFarol), hint: `${count(withSummary)} com resumo`, icon: <Flame size={17} /> },
      ]} />

      <section className="workspace-panel">
        <div className="workspace-panel-heading">
          <div><p className="eyebrow">Linha do tempo</p><h3>Atividades do piloto</h3></div>
          <span>Junho a agosto de 2026</span>
        </div>
        <div className="workspace-table-wrap">
          <table className="workspace-table activities-table">
            <thead><tr><th>Data</th><th>Atividade</th><th>Parceiro e carteira</th><th>Corretor</th><th>Empreendimento</th><th>Cliente / contexto</th><th>Farol</th></tr></thead>
            <tbody>
              {activities.map((activity) => {
                const metadata = asRecord(activity.metadata)
                const portfolio = portfolios.get(String(activity.portfolio_id))
                const linkedBrokers = brokerLinks.get(String(activity.id))
                const brokerName = linkedBrokers?.length
                  ? linkedBrokers.join(', ')
                  : brokers.get(String(activity.broker_id)) ?? text(metadata.raw_broker)
                const developmentNames = [
                  developments.get(String(activity.development_id)),
                  developments.get(String(activity.secondary_development_id)),
                ].filter(Boolean)
                return (
                  <tr key={String(activity.id)}>
                    <td><b>{date(activity.happened_at)}</b><small>{count(activity.quantity)} registro(s)</small></td>
                    <td><span className="workspace-pill neutral">{labels[text(activity.activity_type)] ?? text(activity.activity_type)}</span></td>
                    <td><b>{partners.get(String(activity.partner_id)) ?? text(metadata.raw_partner)}</b><small>{text(portfolio?.name)} · {text(portfolio?.manager_name)}</small></td>
                    <td>{brokerName}</td>
                    <td>{developmentNames.length ? developmentNames.join(' + ') : text(metadata.raw_development)}</td>
                    <td><b>{text(activity.client_name)}</b><small className="workspace-summary-copy">{text(activity.visit_summary, 'Sem observação')}</small></td>
                    <td><Farol value={activity.farol} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

async function PipelineModule({ companyId }: { companyId: string }) {
  const supabase = await createClient()
  const [opportunitiesResult, stagesResult, partnersResult, developmentsResult, portfoliosResult, salesResult] = await Promise.all([
    supabase
      .from('opportunities')
      .select('*')
      .eq('company_id', companyId)
      .order('source_date', { ascending: false, nullsFirst: false })
      .limit(150),
    supabase.from('pipeline_stages').select('*').eq('company_id', companyId).order('position'),
    supabase.from('partners').select('id, name').eq('company_id', companyId),
    supabase.from('developments').select('id, name').eq('company_id', companyId),
    supabase.from('portfolios').select('id, name, manager_name').eq('company_id', companyId),
    supabase.from('sales').select('id, opportunity_id, gross_value, sold_at').eq('company_id', companyId),
  ])

  const error = opportunitiesResult.error ?? stagesResult.error ?? partnersResult.error ?? developmentsResult.error ?? portfoliosResult.error ?? salesResult.error
  if (error) return <ErrorPanel message={error.message} />

  const opportunities = (opportunitiesResult.data ?? []) as DataRecord[]
  const stages = new Map(((stagesResult.data ?? []) as DataRecord[]).map((row) => [String(row.id), row]))
  const partners = new Map(((partnersResult.data ?? []) as DataRecord[]).map((row) => [String(row.id), text(row.name)]))
  const developments = new Map(((developmentsResult.data ?? []) as DataRecord[]).map((row) => [String(row.id), text(row.name)]))
  const portfolios = new Map(((portfoliosResult.data ?? []) as DataRecord[]).map((row) => [String(row.id), row]))
  const sales = (salesResult.data ?? []) as DataRecord[]
  const saleByOpportunity = new Map(sales.map((row) => [String(row.opportunity_id), row]))

  const won = opportunities.filter((row) => text(stages.get(String(row.stage_id))?.stage_type, row.stage as string) === 'won').length
  const lost = opportunities.filter((row) => text(stages.get(String(row.stage_id))?.stage_type, row.stage as string) === 'lost').length
  const open = Math.max(opportunities.length - won - lost, 0)
  const totalVgv = sales.reduce((total, row) => total + amount(row.gross_value), 0)

  return (
    <>
      <ModuleLead
        eyebrow="Pipeline comercial"
        title="Do primeiro sinal ao contrato assinado."
        description="A VETRO preserva data, unidade, empreendimento, tipo de negócio, parceiro, carteira, tabela, proposta, contrato, motivação, etapa e farol. Tipo e etapa agora são conceitos separados."
      >
        <Network size={18} />
        <b>{count(opportunities.length)} negócios reais</b>
      </ModuleLead>

      <MetricGrid cards={[
        { label: 'Oportunidades', value: count(opportunities.length), hint: 'pipeline consolidado', icon: <Network size={17} /> },
        { label: 'Em aberto', value: count(open), hint: 'em acompanhamento', icon: <CircleGauge size={17} /> },
        { label: 'Vendas', value: count(won), hint: `${count(lost)} perdidas`, icon: <BadgeCheck size={17} /> },
        { label: 'VGV realizado', value: money(totalVgv), hint: '23 vendas registradas', icon: <Landmark size={17} /> },
      ]} />

      <section className="workspace-panel">
        <div className="workspace-panel-heading">
          <div><p className="eyebrow">Negócios</p><h3>Pipeline OAD 2026</h3></div>
          <span>dados estruturados</span>
        </div>
        <div className="workspace-table-wrap">
          <table className="workspace-table pipeline-table">
            <thead><tr><th>Data / unidade</th><th>Etapa</th><th>Tipo</th><th>Empreendimento</th><th>Parceiro / carteira</th><th>Cliente</th><th>Valores</th><th>Farol</th></tr></thead>
            <tbody>
              {opportunities.map((opportunity) => {
                const stage = stages.get(String(opportunity.stage_id))
                const portfolio = portfolios.get(String(opportunity.portfolio_id))
                const sale = saleByOpportunity.get(String(opportunity.id))
                return (
                  <tr key={String(opportunity.id)}>
                    <td><b>{date(opportunity.source_date ?? opportunity.created_at)}</b><small>Unidade {text(opportunity.unit_code)}</small></td>
                    <td><StagePill value={stage?.name ?? opportunity.stage} tone={stage?.stage_type} /></td>
                    <td>{text(opportunity.deal_type, 'Venda')}</td>
                    <td><b>{developments.get(String(opportunity.development_id)) ?? '—'}</b></td>
                    <td><b>{partners.get(String(opportunity.partner_id)) ?? '—'}</b><small>{text(portfolio?.name)} · {text(portfolio?.manager_name)}</small></td>
                    <td><b>{text(opportunity.contact_name)}</b><small>{text(opportunity.motivation ?? opportunity.lost_reason, 'Sem motivação registrada')}</small></td>
                    <td><b>{money(opportunity.contract_value ?? sale?.gross_value ?? opportunity.estimated_value)}</b><small>Tabela {money(opportunity.table_value)} · proposta {money(opportunity.proposal_value)}</small></td>
                    <td><Farol value={opportunity.farol} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

async function DevelopmentsModule({ companyId }: { companyId: string }) {
  const supabase = await createClient()
  const [developmentsResult, activitiesResult, opportunitiesResult, salesResult] = await Promise.all([
    supabase.from('developments').select('*').eq('company_id', companyId).order('name'),
    supabase.from('activities').select('development_id, secondary_development_id, quantity').eq('company_id', companyId),
    supabase.from('opportunities').select('id, development_id, stage_id').eq('company_id', companyId),
    supabase.from('sales').select('development_id, gross_value').eq('company_id', companyId),
  ])

  const error = developmentsResult.error ?? activitiesResult.error ?? opportunitiesResult.error ?? salesResult.error
  if (error) return <ErrorPanel message={error.message} />

  const developments = (developmentsResult.data ?? []) as DataRecord[]
  const activities = (activitiesResult.data ?? []) as DataRecord[]
  const opportunities = (opportunitiesResult.data ?? []) as DataRecord[]
  const sales = (salesResult.data ?? []) as DataRecord[]
  const metrics = new Map<string, { activities: number; opportunities: number; sales: number; vgv: number }>()
  const ensure = (id: string) => {
    const current = metrics.get(id) ?? { activities: 0, opportunities: 0, sales: 0, vgv: 0 }
    metrics.set(id, current)
    return current
  }

  for (const row of activities) {
    if (row.development_id) ensure(String(row.development_id)).activities += amount(row.quantity || 1)
    if (row.secondary_development_id) ensure(String(row.secondary_development_id)).activities += amount(row.quantity || 1)
  }
  for (const row of opportunities) if (row.development_id) ensure(String(row.development_id)).opportunities += 1
  for (const row of sales) if (row.development_id) {
    const current = ensure(String(row.development_id))
    current.sales += 1
    current.vgv += amount(row.gross_value)
  }

  const ordered = [...developments].sort((a, b) => {
    const aMetric = metrics.get(String(a.id))
    const bMetric = metrics.get(String(b.id))
    return (bMetric?.vgv ?? 0) - (aMetric?.vgv ?? 0) || (bMetric?.activities ?? 0) - (aMetric?.activities ?? 0)
  })
  const activeProducts = ordered.filter((row) => (metrics.get(String(row.id))?.activities ?? 0) > 0 || (metrics.get(String(row.id))?.opportunities ?? 0) > 0).length
  const totalVgv = sales.reduce((total, row) => total + amount(row.gross_value), 0)

  return (
    <>
      <ModuleLead
        eyebrow="Portfólio de produtos"
        title="Empreendimento deixa de ser lista auxiliar."
        description="Cada produto passa a reunir atividade da rede, oportunidades, vendas e VGV. O cadastro mestre alimenta filtros, pipeline, metas e inteligência sem abas escondidas."
      >
        <Building2 size={18} />
        <b>{count(developments.length)} empreendimentos</b>
      </ModuleLead>

      <MetricGrid cards={[
        { label: 'Cadastrados', value: count(developments.length), hint: 'cadastro mestre', icon: <Building2 size={17} /> },
        { label: 'Com tração', value: count(activeProducts), hint: 'atividade ou pipeline', icon: <Sparkles size={17} /> },
        { label: 'Oportunidades', value: count(opportunities.length), hint: 'distribuídas por produto', icon: <Network size={17} /> },
        { label: 'VGV realizado', value: money(totalVgv), hint: 'vendas vinculadas', icon: <Landmark size={17} /> },
      ]} />

      <section className="workspace-panel">
        <div className="workspace-panel-heading"><div><p className="eyebrow">Empreendimentos</p><h3>Tração comercial por produto</h3></div><span>ordem por VGV</span></div>
        <div className="workspace-table-wrap">
          <table className="workspace-table developments-table">
            <thead><tr><th>Empreendimento</th><th>Status</th><th>Atividades</th><th>Oportunidades</th><th>Vendas</th><th>VGV</th></tr></thead>
            <tbody>
              {ordered.map((development) => {
                const row = metrics.get(String(development.id)) ?? { activities: 0, opportunities: 0, sales: 0, vgv: 0 }
                return <tr key={String(development.id)}><td><b>{text(development.name)}</b><small>{text(development.code, 'sem código')}</small></td><td><span className="workspace-pill neutral">{text(development.status)}</span></td><td>{count(row.activities)}</td><td>{count(row.opportunities)}</td><td>{count(row.sales)}</td><td><b>{money(row.vgv)}</b></td></tr>
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

async function IntelligenceModule({ companyId }: { companyId: string }) {
  const supabase = await createClient()
  const [snapshotsResult, partnersResult, portfoliosResult, scoresResult] = await Promise.all([
    supabase
      .from('partner_relationship_snapshots')
      .select('*')
      .eq('company_id', companyId)
      .order('snapshot_date', { ascending: false })
      .limit(500),
    supabase.from('partners').select('id, name').eq('company_id', companyId),
    supabase.from('portfolios').select('id, name, manager_name').eq('company_id', companyId),
    supabase.from('v6_scores').select('*').eq('company_id', companyId).order('period_end', { ascending: false }).limit(500),
  ])

  const error = snapshotsResult.error ?? partnersResult.error ?? portfoliosResult.error ?? scoresResult.error
  if (error) return <ErrorPanel message={error.message} />

  const snapshots = (snapshotsResult.data ?? []) as DataRecord[]
  const partners = new Map(((partnersResult.data ?? []) as DataRecord[]).map((row) => [String(row.id), text(row.name)]))
  const portfolios = new Map(((portfoliosResult.data ?? []) as DataRecord[]).map((row) => [String(row.id), row]))
  const scores = (scoresResult.data ?? []) as DataRecord[]
  const latestSnapshots = new Map<string, DataRecord>()
  for (const row of snapshots) {
    const key = String(row.partner_id)
    if (!latestSnapshots.has(key)) latestSnapshots.set(key, row)
  }
  const latestScores = new Map<string, DataRecord>()
  for (const row of scores) {
    const key = String(row.partner_id)
    if (!latestScores.has(key)) latestScores.set(key, row)
  }
  const rows = Array.from(latestSnapshots.values()).sort((a, b) => amount(b.legacy_activity_score) - amount(a.legacy_activity_score))
  const withActivity = rows.filter((row) => amount(row.legacy_activity_score) > 0)
  const highest = withActivity[0]
  const declaredBrokers = rows.reduce((total, row) => total + amount(row.declared_brokers), 0)

  return (
    <>
      <ModuleLead
        eyebrow="VETRO Intelligence"
        title="Duas leituras, sem misturar os conceitos."
        description="O Índice de Atividade Comercial preserva o método OAD que já funciona. O VETRO Score V6 permanece proprietário, multidimensional e só será publicado depois da calibração."
      >
        <Sparkles size={18} />
        <b>V6 em calibração</b>
      </ModuleLead>

      <section className="workspace-intelligence-banner">
        <div className="workspace-v6-mark">V6</div>
        <div><p className="eyebrow">Método proprietário</p><h3>Nenhuma nota artificial foi criada.</h3><p>O piloto já possui toda a matéria-prima operacional. A próxima etapa é calibrar V1 a V6, pesos, faixas e sinais antes de publicar o primeiro VETRO Score.</p></div>
        <span className="workspace-pill calibration">Calibração</span>
      </section>

      <MetricGrid cards={[
        { label: 'Parceiros medidos', value: count(rows.length), hint: 'snapshot operacional', icon: <UsersRound size={17} /> },
        { label: 'Índice acima de zero', value: count(withActivity.length), hint: 'atividade no mapa legado', icon: <CircleGauge size={17} /> },
        { label: 'Maior índice', value: decimal.format(amount(highest?.legacy_activity_score)), hint: highest ? partners.get(String(highest.partner_id)) : 'sem atividade', icon: <Flame size={17} /> },
        { label: 'Corretores declarados', value: count(declaredBrokers), hint: 'base de relacionamento', icon: <BadgeCheck size={17} /> },
        { label: 'V6 publicados', value: count(scores.length), hint: 'propositalmente zero', icon: <Sparkles size={17} /> },
      ]} />

      <section className="workspace-panel">
        <div className="workspace-panel-heading"><div><p className="eyebrow">Índice de Atividade Comercial</p><h3>Método legado preservado</h3></div><span>não é V6</span></div>
        <div className="workspace-table-wrap">
          <table className="workspace-table intelligence-table">
            <thead><tr><th>Parceiro</th><th>Carteira</th><th>Índice</th><th>Atend.</th><th>Trein.</th><th>Plantões</th><th>Visitas</th><th>Propostas</th><th>Vendas</th><th>V6</th></tr></thead>
            <tbody>
              {rows.map((row) => {
                const portfolio = portfolios.get(String(row.portfolio_id))
                const v6 = latestScores.get(String(row.partner_id))
                return <tr key={String(row.id)}><td><b>{partners.get(String(row.partner_id)) ?? 'Parceiro'}</b><small>{count(row.declared_brokers)} corretores</small></td><td><b>{text(portfolio?.name)}</b><small>{text(portfolio?.manager_name)}</small></td><td><b>{decimal.format(amount(row.legacy_activity_score))}</b></td><td>{count(row.partner_service_count)}</td><td>{count(row.training_count)}</td><td>{decimal.format(amount(row.duty_participation_count))}</td><td>{count(row.client_visit_count)}</td><td>{count(row.proposal_count)}</td><td>{count(row.sale_count)}</td><td>{v6 ? <b>{decimal.format(amount(v6.overall_score))}</b> : <span className="workspace-pill calibration">Calibração</span>}</td></tr>
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

async function TeamModule({ companyId }: { companyId: string }) {
  const supabase = await createClient()
  const [portfoliosResult, assignmentsResult, activitiesResult, opportunitiesResult, stagesResult, goalsResult] = await Promise.all([
    supabase.from('portfolios').select('*').eq('company_id', companyId).order('name'),
    supabase.from('portfolio_partner_assignments').select('portfolio_id, partner_id').eq('company_id', companyId).eq('is_current', true),
    supabase.from('activities').select('portfolio_id, quantity, activity_type').eq('company_id', companyId),
    supabase.from('opportunities').select('portfolio_id, stage_id, contract_value, proposal_value, estimated_value').eq('company_id', companyId),
    supabase.from('pipeline_stages').select('id, stage_type').eq('company_id', companyId),
    supabase.from('commercial_goals').select('*').eq('company_id', companyId).order('period_start'),
  ])

  const error = portfoliosResult.error ?? assignmentsResult.error ?? activitiesResult.error ?? opportunitiesResult.error ?? stagesResult.error ?? goalsResult.error
  if (error) return <ErrorPanel message={error.message} />

  const portfolios = (portfoliosResult.data ?? []) as DataRecord[]
  const assignments = (assignmentsResult.data ?? []) as DataRecord[]
  const activities = (activitiesResult.data ?? []) as DataRecord[]
  const opportunities = (opportunitiesResult.data ?? []) as DataRecord[]
  const stages = new Map(((stagesResult.data ?? []) as DataRecord[]).map((row) => [String(row.id), text(row.stage_type)]))
  const goals = (goalsResult.data ?? []) as DataRecord[]
  const portfolioStats = new Map<string, { partners: number; activities: number; opportunities: number; won: number; value: number }>()
  const ensure = (id: string) => {
    const current = portfolioStats.get(id) ?? { partners: 0, activities: 0, opportunities: 0, won: 0, value: 0 }
    portfolioStats.set(id, current)
    return current
  }
  for (const row of assignments) ensure(String(row.portfolio_id)).partners += 1
  for (const row of activities) if (row.portfolio_id) ensure(String(row.portfolio_id)).activities += amount(row.quantity || 1)
  for (const row of opportunities) if (row.portfolio_id) {
    const current = ensure(String(row.portfolio_id))
    current.opportunities += 1
    current.value += amount(row.contract_value ?? row.proposal_value ?? row.estimated_value)
    if (stages.get(String(row.stage_id)) === 'won') current.won += 1
  }

  const goalGroups = new Map<string, { name: string; months: number; total: number }>()
  for (const goal of goals) {
    const key = text(goal.indicator_key)
    const current = goalGroups.get(key) ?? { name: text(goal.indicator_name), months: 0, total: 0 }
    current.months += 1
    current.total += amount(goal.target_value)
    goalGroups.set(key, current)
  }

  return (
    <>
      <ModuleLead
        eyebrow="Equipe e carteiras"
        title="Gestão 1 e Gestão 2 viraram estrutura configurável."
        description="A VETRO chama o conceito de carteira comercial. No piloto OAD, Ariane e Gabrielle continuam responsáveis pelas suas operações, mas qualquer futuro cliente poderá criar outras carteiras sem alterar código."
      >
        <UsersRound size={18} />
        <b>{count(portfolios.length)} carteiras</b>
      </ModuleLead>

      <MetricGrid cards={[
        { label: 'Carteiras', value: count(portfolios.length), hint: 'estrutura configurável', icon: <UsersRound size={17} /> },
        { label: 'Parceiros distribuídos', value: count(assignments.length), hint: 'uma carteira atual por parceiro', icon: <Network size={17} /> },
        { label: 'Ações da equipe', value: count(activities.reduce((total, row) => total + amount(row.quantity || 1), 0)), hint: 'quantidade operacional', icon: <Activity size={17} /> },
        { label: 'Metas cadastradas', value: count(goals.length), hint: '7 indicadores × 12 meses', icon: <Goal size={17} /> },
      ]} />

      <section className="workspace-card-grid">
        {portfolios.map((portfolio) => {
          const stats = portfolioStats.get(String(portfolio.id)) ?? { partners: 0, activities: 0, opportunities: 0, won: 0, value: 0 }
          return (
            <article className="workspace-portfolio-card" key={String(portfolio.id)}>
              <div className="workspace-card-title"><div><p className="eyebrow">Carteira comercial</p><h3>{text(portfolio.name)}</h3></div><span className="workspace-pill neutral">ativa</span></div>
              <div className="workspace-manager"><span>Responsável</span><b>{text(portfolio.manager_name)}</b></div>
              <div className="workspace-mini-grid"><div><span>Parceiros</span><b>{count(stats.partners)}</b></div><div><span>Atividades</span><b>{count(stats.activities)}</b></div><div><span>Pipeline</span><b>{count(stats.opportunities)}</b></div><div><span>Vendas</span><b>{count(stats.won)}</b></div></div>
              <div className="workspace-card-footer"><span>Valor acompanhado</span><b>{money(stats.value)}</b></div>
            </article>
          )
        })}
      </section>

      <section className="workspace-panel">
        <div className="workspace-panel-heading"><div><p className="eyebrow">Metas 2026</p><h3>Estrutura mensal pronta</h3></div><span>aguardando definição</span></div>
        <div className="workspace-goal-list">
          {Array.from(goalGroups.entries()).map(([key, goal]) => (
            <div className="workspace-goal-row" key={key}><div><b>{goal.name}</b><span>{count(goal.months)} meses cadastrados</span></div><div><strong>{goal.total > 0 ? count(goal.total) : 'Não definida'}</strong><span className={`workspace-pill ${goal.total > 0 ? 'active' : 'calibration'}`}>{goal.total > 0 ? 'Meta ativa' : 'Rascunho'}</span></div></div>
          ))}
        </div>
      </section>
    </>
  )
}

async function ImportsModule({ companyId }: { companyId: string }) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('imports')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) return <ErrorPanel message={error.message} />
  const imports = (data ?? []) as DataRecord[]
  const rows = imports.reduce((total, row) => total + amount(row.processed_rows), 0)
  const errors = imports.reduce((total, row) => total + amount(row.error_rows), 0)

  return (
    <>
      <ModuleLead
        eyebrow="Governança de dados"
        title="Excel vira porta de entrada, não destino final."
        description="Cada arquivo mantém hash, origem, totais, reconciliação, avisos e módulos materializados. A VETRO sabe o que foi importado, o que foi evitado como duplicidade e o que precisa de revisão."
      >
        <FileSpreadsheet size={18} />
        <b>{count(imports.length)} fontes processadas</b>
      </ModuleLead>

      <MetricGrid cards={[
        { label: 'Arquivos', value: count(imports.length), hint: 'histórico preservado', icon: <FileSpreadsheet size={17} /> },
        { label: 'Linhas processadas', value: count(rows), hint: 'carga piloto', icon: <Database size={17} /> },
        { label: 'Erros', value: count(errors), hint: errors ? 'requer atenção' : 'processamento íntegro', icon: <BadgeCheck size={17} /> },
      ]} />

      <section className="workspace-card-grid imports-grid">
        {imports.map((item) => {
          const metadata = asRecord(item.metadata)
          const reconciliation = asRecord(metadata.reconciliation_result)
          const warnings = Array.isArray(metadata.source_warnings) ? metadata.source_warnings : []
          return (
            <article className="workspace-import-card" key={String(item.id)}>
              <div className="workspace-card-title"><div><p className="eyebrow">{text(item.source, 'Importação')}</p><h3>{text(item.file_name)}</h3></div><span className="workspace-pill active">{text(item.status)}</span></div>
              <div className="workspace-mini-grid"><div><span>Total</span><b>{count(item.total_rows)}</b></div><div><span>Processadas</span><b>{count(item.processed_rows)}</b></div><div><span>Erros</span><b>{count(item.error_rows)}</b></div><div><span>Data</span><b>{date(item.created_at)}</b></div></div>
              {Object.keys(reconciliation).length ? <div className="workspace-import-note"><b>Reconciliação</b><span>{count(reconciliation.rows_reviewed)} linhas revisadas · {count(reconciliation.duplicate_records_avoided)} duplicidades evitadas</span></div> : null}
              {warnings.length ? <div className="workspace-import-note warning"><b>Aviso de origem</b><span>{count(warnings.length)} inconsistência da planilha foi preservada e corrigida sem afetar o V6.</span></div> : null}
              <div className="workspace-source-hash"><span>SHA-256</span><JsonValue value={metadata.source_hash} /></div>
            </article>
          )
        })}
      </section>
    </>
  )
}

async function AdminModule({ companyId }: { companyId: string }) {
  const supabase = await createClient()
  const [settingsResult, stagesResult, dimensionsResult, portfoliosResult] = await Promise.all([
    supabase.from('company_settings').select('*').eq('company_id', companyId).maybeSingle(),
    supabase.from('pipeline_stages').select('*').eq('company_id', companyId).order('position'),
    supabase.from('v6_dimension_configs').select('*').eq('company_id', companyId).order('dimension_key'),
    supabase.from('portfolios').select('*').eq('company_id', companyId).order('name'),
  ])

  const error = settingsResult.error ?? stagesResult.error ?? dimensionsResult.error ?? portfoliosResult.error
  if (error) return <ErrorPanel message={error.message} />

  const settingsRow = asRecord(settingsResult.data)
  const settings = asRecord(settingsRow.settings)
  const pilot = asRecord(settings.pilot)
  const operatingModel = asRecord(settings.operating_model)
  const v6 = asRecord(operatingModel.v6)
  const stages = (stagesResult.data ?? []) as DataRecord[]
  const dimensions = (dimensionsResult.data ?? []) as DataRecord[]
  const portfolios = (portfoliosResult.data ?? []) as DataRecord[]

  return (
    <>
      <ModuleLead
        eyebrow="Administração"
        title="O piloto OAD agora tem um contrato operacional claro."
        description="Esta área expõe somente configurações reais: identidade do piloto, baseline, modelo operacional, carteiras, etapas e parâmetros do V6. Nenhum dado fictício foi criado."
      >
        <span className="workspace-status-dot" />
        <b>Piloto ativo</b>
      </ModuleLead>

      <MetricGrid cards={[
        { label: 'Piloto', value: text(pilot.client, 'Grupo OAD'), hint: `baseline ${text(pilot.baseline_date)}`, icon: <BadgeCheck size={17} /> },
        { label: 'Modelo', value: text(pilot.operating_model_version, '1.0'), hint: 'operação comercial', icon: <Database size={17} /> },
        { label: 'Carteiras', value: count(portfolios.length), hint: 'configuráveis', icon: <UsersRound size={17} /> },
        { label: 'Etapas', value: count(stages.length), hint: 'pipeline ativo', icon: <Network size={17} /> },
        { label: 'V6', value: text(v6.status, 'calibration'), hint: 'método proprietário', icon: <Sparkles size={17} /> },
      ]} />

      <section className="workspace-admin-grid">
        <article className="workspace-panel">
          <div className="workspace-panel-heading"><div><p className="eyebrow">Pipeline</p><h3>Etapas configuradas</h3></div><span>{count(stages.length)}</span></div>
          <div className="workspace-stage-list">{stages.map((stage) => <div key={String(stage.id)}><span>{count(stage.position)}</span><b>{text(stage.name)}</b><small>{text(stage.stage_type)}</small></div>)}</div>
        </article>
        <article className="workspace-panel">
          <div className="workspace-panel-heading"><div><p className="eyebrow">VETRO Score</p><h3>Dimensões e pesos</h3></div><span>{count(dimensions.length)}</span></div>
          {dimensions.length ? <div className="workspace-stage-list">{dimensions.map((dimension) => <div key={String(dimension.id)}><span>{text(dimension.dimension_key)}</span><b>{text(dimension.name)}</b><small>Peso {decimal.format(amount(dimension.weight))}</small></div>)}</div> : <div className="workspace-empty-inline"><Sparkles size={19} /><div><b>Calibração em andamento</b><span>As dimensões serão publicadas somente depois da validação metodológica.</span></div></div>}
        </article>
      </section>
    </>
  )
}

export async function WorkspaceModuleContent({ module, companyId }: { module: ModuleKey; companyId: string }) {
  switch (module) {
    case 'parceiros': return <PartnersModule companyId={companyId} />
    case 'atividades': return <ActivitiesModule companyId={companyId} />
    case 'pipeline': return <PipelineModule companyId={companyId} />
    case 'empreendimentos': return <DevelopmentsModule companyId={companyId} />
    case 'intelligence': return <IntelligenceModule companyId={companyId} />
    case 'equipe': return <TeamModule companyId={companyId} />
    case 'importar-dados': return <ImportsModule companyId={companyId} />
    case 'admin': return <AdminModule companyId={companyId} />
  }
}
