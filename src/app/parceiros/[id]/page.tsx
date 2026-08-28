import { Activity, ArrowLeft, ArrowUpRight, BadgeCheck, BriefcaseBusiness, CircleGauge, Clock3, Network, Sparkles, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell, PageHeading } from '../../_components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { requireCompanyPermission } from '@/lib/workspace/server'
import styles from '../partners.module.css'

type Row = Record<string, unknown>
type RpcResult = { data: unknown; error: { message: string } | null }
type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<RpcResult> }

const integer = new Intl.NumberFormat('pt-BR')
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const compactCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 })
const fullCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const shortDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

function amount(value: unknown) { const parsed = Number(value ?? 0); return Number.isFinite(parsed) ? parsed : 0 }
function text(value: unknown, fallback = '') { return value === null || value === undefined ? fallback : String(value) }
function asRecord(value: unknown): Row { return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {} }
function asRows(value: unknown): Row[] { return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object' && !Array.isArray(item)) as Row[] : [] }
function daysSince(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() < 2000) return null
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000))
}
function healthFor(days: number | null, inactivityDays: number) {
  if (days !== null && days <= inactivityDays) return 'recent' as const
  if (days !== null && days <= 90) return 'cooling' as const
  return 'dormant' as const
}
function movementLabel(value: unknown, days: number | null) {
  if (!value || days === null) return 'Sem movimento'
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Há 1 dia'
  if (days < 30) return `Há ${days} dias`
  return shortDate.format(new Date(String(value)))
}
function activityLabel(value: unknown) {
  const labels: Record<string,string> = { client_service: 'Atendimento', partner_visit: 'Visita à imobiliária', training: 'Treinamento', proposal: 'Proposta', duty: 'Plantão' }
  return labels[text(value)] ?? text(value, 'Atividade')
}
function stageClass(value: unknown) {
  const type = text(value)
  if (type === 'won') return styles.stageWon
  if (type === 'lost') return styles.stageLost
  return styles.stageOpen
}

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const workspace = await requireCompanyPermission('partners_view')
  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) notFound()

  const supabase = await createClient()
  const rpc = supabase as unknown as RpcClient
  const [detailResult, settingsResult] = await Promise.all([
    rpc.rpc('get_partner_360', { target_company_id: workspace.company.id, target_partner_id: id }),
    supabase.from('company_settings').select('signal_thresholds').eq('company_id', workspace.company.id).maybeSingle(),
  ])
  if (detailResult.error?.message.includes('partner_missing')) notFound()
  const error = detailResult.error ?? settingsResult.error
  if (error) return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}><section className="workspace-error"><strong>Não foi possível carregar o parceiro.</strong><span>{error.message}</span></section></AppShell>

  const payload = asRecord(detailResult.data)
  const partner = asRecord(payload.partner)
  if (!partner.id) notFound()
  const brokers = asRows(payload.brokers)
  const activities = asRows(payload.activities)
  const opportunities = asRows(payload.opportunities)
  const sales = asRows(payload.sales)
  const snapshots = asRows(payload.snapshots)
  const v6History = asRows(payload.v6_history)
  const settings = asRecord(settingsResult.data)
  const thresholds = asRecord(settings.signal_thresholds)
  const inactivityDays = Math.max(1, amount(thresholds.partner_inactivity_days) || 14)
  const movement = partner.last_movement_at && new Date(String(partner.last_movement_at)).getUTCFullYear() >= 2000 ? String(partner.last_movement_at) : null
  const movementDays = daysSince(movement)
  const health = healthFor(movementDays, inactivityDays)
  const canPipeline = workspace.membership.role === 'admin' || workspace.membership.role === 'manager' || workspace.permissions.includes('pipeline_view')
  const canStrategic = workspace.membership.role === 'admin' || workspace.membership.role === 'manager' || workspace.permissions.includes('overview_view') || workspace.permissions.includes('intelligence_view')
  const canV6 = workspace.membership.role === 'admin' || workspace.membership.role === 'manager' || workspace.permissions.includes('intelligence_view')
  const opportunityCount = amount(partner.opportunities_count)
  const wonCount = amount(partner.won_opportunities_count)
  const salesCount = amount(partner.sales_count)
  const conversion = opportunityCount > 0 ? wonCount / opportunityCount * 100 : 0
  const legacyScore = partner.legacy_activity_score === null || partner.legacy_activity_score === undefined ? null : amount(partner.legacy_activity_score)
  const latestV6 = partner.latest_v6_score === null || partner.latest_v6_score === undefined ? null : amount(partner.latest_v6_score)
  const latestSnapshot = snapshots[0]
  const latestV6Row = v6History[0]

  let attentionTitle = health === 'recent' ? 'Relacionamento em tração' : health === 'cooling' ? 'Relacionamento perdendo ritmo' : 'Parceiro sem movimentação recente'
  let attentionCopy = health === 'recent'
    ? `Há movimento registrado dentro da janela operacional de ${inactivityDays} dias.`
    : health === 'cooling'
      ? `O último movimento ocorreu há ${movementDays ?? 'mais de 14'} dias. Vale revisar a próxima ação da carteira.`
      : 'Não há movimentação comercial recente suficiente para manter este parceiro no radar ativo.'

  if (canStrategic && salesCount > 0 && health !== 'recent') {
    attentionTitle = 'Produtor histórico esfriando'
    attentionCopy = `Este parceiro já produziu ${integer.format(salesCount)} venda${salesCount === 1 ? '' : 's'}, mas está fora da janela de tração recente. A reativação merece prioridade proporcional ao histórico.`
  } else if (canStrategic && opportunityCount > 0 && salesCount === 0) {
    attentionTitle = 'Há oportunidade, mas ainda não há conversão em venda'
    attentionCopy = `${integer.format(opportunityCount)} oportunidade${opportunityCount === 1 ? '' : 's'} registrada${opportunityCount === 1 ? '' : 's'} e nenhuma venda vinculada ao parceiro até agora.`
  }

  const relationshipMetrics = [
    ['Atendimentos', partner.partner_service_count],
    ['Treinamentos', partner.training_count],
    ['Plantões', partner.duty_participation_count],
    ['Visitas', partner.client_visit_count],
    ['Propostas', partner.proposal_count],
    ['Vendas no snapshot', partner.snapshot_sale_count],
  ]

  return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}>
    <PageHeading eyebrow="Parceiro 360" title={text(partner.name, 'Parceiro')} context={`${text(partner.portfolio_name, 'Sem carteira')} · ${text(partner.manager_name, 'sem responsável')}`}>
      <div className={styles.detailActions}><Link className={styles.backLink} href="/parceiros"><ArrowLeft size={14}/>Rede</Link>{canPipeline ? <Link className={styles.pipelineLink} href={`/pipeline?partner=${id}`}>Abrir no Pipeline <ArrowUpRight size={14}/></Link> : null}</div>
    </PageHeading>

    <section className={styles.identityStrip}>
      <div><span>IDENTIDADE COMERCIAL</span><b>{text(partner.name)}</b><span>{text(partner.document, 'Documento não informado')}</span></div>
      <div className={styles.identityMeta}><span>{text(partner.status, 'active')}</span><span>{text(partner.portfolio_name, 'Sem carteira')}</span><span>{integer.format(amount(partner.declared_broker_count))} corretores declarados</span></div>
    </section>

    <section className={`${styles.attentionBanner} ${styles[health]}`}><i/><div><b>{attentionTitle}</b><span>{attentionCopy}</span></div>{canPipeline && opportunityCount > 0 ? <Link href={`/pipeline?partner=${id}`}>Ver oportunidades</Link> : null}</section>

    <section className={styles.detailMetrics}>
      <article><span>Atividades</span><strong>{integer.format(amount(partner.activities_count))}</strong><small>ações registradas</small></article>
      {canPipeline ? <article><span>Oportunidades</span><strong>{integer.format(opportunityCount)}</strong><small>{decimal.format(conversion)}% de conversão em ganho</small></article> : <article><span>Corretores</span><strong>{integer.format(brokers.length)}</strong><small>vínculos ativos</small></article>}
      {canStrategic ? <article><span>Vendas</span><strong>{integer.format(salesCount)}</strong><small>resultado histórico vinculado</small></article> : <article><span>Propostas</span><strong>{integer.format(amount(partner.proposal_count))}</strong><small>snapshot de relacionamento</small></article>}
      {canStrategic ? <article><span>VGV</span><strong title={fullCurrency.format(amount(partner.gross_sales_value))}>{compactCurrency.format(amount(partner.gross_sales_value))}</strong><small>valor bruto vendido</small></article> : <article><span>Índice de atividade</span><strong>{legacyScore === null ? '—' : decimal.format(legacyScore)}</strong><small>método operacional legado</small></article>}
      <article><span>Último movimento</span><strong>{movementDays === null ? '—' : `${movementDays}d`}</strong><small>{movementLabel(movement, movementDays)}</small></article>
      {canV6 ? <article><span>V6</span><strong>{latestV6 === null ? '—' : decimal.format(latestV6)}</strong><small>{latestV6 === null ? 'em calibração' : `período até ${text(partner.latest_v6_period_end)}`}</small></article> : <article><span>Carteira</span><strong>{text(partner.portfolio_name, '—')}</strong><small>{text(partner.manager_name, 'sem responsável')}</small></article>}
    </section>

    <section className={styles.detailGrid}>
      <article className={styles.panel}>
        <header><div><span>RELACIONAMENTO</span><h2>Índice de Atividade Comercial</h2></div><small>não é V6</small></header>
        <div className={styles.relationshipLead}><div className={styles.relationshipScore}>{legacyScore === null ? '—' : decimal.format(legacyScore)}</div><div><b>Leitura operacional preservada</b><span>Resume a atividade de relacionamento capturada no último snapshot disponível. O V6 é uma camada proprietária separada.</span></div></div>
        <div className={styles.scoreGrid}>{relationshipMetrics.map(([metric, value]) => <div key={String(metric)}><span>{metric}</span><b>{integer.format(amount(value))}</b></div>)}</div>
      </article>

      <article className={styles.panel}>
        <header><div><span>CORRETORES</span><h2>Rede vinculada ao parceiro</h2></div><small>{integer.format(brokers.length)} vínculos</small></header>
        {brokers.length ? <div className={styles.brokerList}>{brokers.map((broker) => <div key={text(broker.id)}><div><b>{text(broker.full_name, 'Corretor')}</b><span>{text(broker.creci, 'CRECI não informado')}</span></div><div><span>{broker.is_primary ? 'Principal' : text(broker.status, 'ativo')}</span></div><div><span>{text(broker.phone, text(broker.email, 'Sem contato'))}</span></div></div>)}</div> : <p className={styles.empty}>Nenhum corretor individual está vinculado a este parceiro.</p>}
      </article>
    </section>

    <section className={styles.detailGrid}>
      <article className={styles.panel}>
        <header><div><span>ATIVIDADE RECENTE</span><h2>Linha do tempo de relacionamento</h2></div><small>últimas {Math.min(activities.length,50)}</small></header>
        {activities.length ? <div className={styles.timeline}>{activities.map((activity) => <article key={text(activity.id)}><time>{activity.happened_at ? shortDate.format(new Date(String(activity.happened_at))) : '—'}</time><div><b>{activityLabel(activity.activity_type)}{activity.development_name ? ` · ${text(activity.development_name)}` : ''}</b><span>{text(activity.broker_name, text(activity.portfolio_name, 'Operação comercial'))}</span>{activity.visit_summary ? <small>{text(activity.visit_summary)}</small> : activity.client_name ? <small>Cliente: {text(activity.client_name)}</small> : null}</div></article>)}</div> : <p className={styles.empty}>Nenhuma atividade individual disponível para este parceiro.</p>}
      </article>

      <article className={styles.panel}>
        <header><div><span>PIPELINE</span><h2>Oportunidades vinculadas</h2></div>{canPipeline ? <Link className={styles.openLink} href={`/pipeline?partner=${id}`} aria-label="Abrir pipeline do parceiro"><ArrowUpRight size={14}/></Link> : <small>{integer.format(opportunities.length)}</small>}</header>
        {opportunities.length ? <div className={styles.opportunityList}>{opportunities.slice(0,12).map((opportunity) => <article key={text(opportunity.id)}><div><span className={`${styles.stageBadge} ${stageClass(opportunity.stage_type)}`}>{text(opportunity.stage_name, 'Etapa')}</span><b>{text(opportunity.unit_code, 'Sem unidade')} · {text(opportunity.development_name, 'Sem empreendimento')}</b><small>{text(opportunity.contact_name, opportunity.lost_reason ? `Perda: ${text(opportunity.lost_reason)}` : 'Cliente não informado')}</small></div><strong title={fullCurrency.format(amount(opportunity.value))}>{compactCurrency.format(amount(opportunity.value))}</strong></article>)}</div> : <p className={styles.empty}>Nenhuma oportunidade disponível para este parceiro.</p>}
      </article>
    </section>

    {(canStrategic || canV6) ? <section className={styles.detailGrid}>
      {canStrategic ? <article className={styles.panel}>
        <header><div><span>RESULTADO</span><h2>Vendas do parceiro</h2></div><small>{integer.format(sales.length)} registros</small></header>
        {sales.length ? <div className={styles.salesList}>{sales.slice(0,12).map((sale) => <article key={text(sale.id)}><div><b>{text(sale.development_name, 'Empreendimento não informado')}</b><span>{sale.sold_at ? shortDate.format(new Date(String(sale.sold_at))) : 'Sem data'}{sale.broker_name ? ` · ${text(sale.broker_name)}` : ''}</span></div><strong title={fullCurrency.format(amount(sale.gross_value))}>{compactCurrency.format(amount(sale.gross_value))}</strong></article>)}</div> : <p className={styles.empty}>Ainda não há venda vinculada a este parceiro.</p>}
      </article> : null}

      {canV6 ? <article className={styles.panel}>
        <header><div><span>VETRO SCORE</span><h2>Leitura V6</h2></div><small>{v6History.length ? 'histórico disponível' : 'calibração'}</small></header>
        {latestV6Row ? <><div className={styles.v6Score}><strong>{decimal.format(amount(latestV6Row.overall_score))}</strong><div><b>Score geral do último período</b><span>{text(latestV6Row.period_start)} → {text(latestV6Row.period_end)}</span></div></div><div className={styles.scoreGrid}>{[['V1',latestV6Row.v1_score],['V2',latestV6Row.v2_score],['V3',latestV6Row.v3_score],['V4',latestV6Row.v4_score],['V5',latestV6Row.v5_score],['V6',latestV6Row.v6_score]].map(([key,value]) => <div key={String(key)}><span>{key}</span><b>{value === null || value === undefined ? '—' : decimal.format(amount(value))}</b></div>)}</div></> : <div className={styles.v6Empty}><Sparkles size={18}/><div><b>V6 ainda não publicado para este parceiro</b><span>A estrutura está pronta, mas nenhuma nota artificial é criada enquanto a calibração metodológica não estiver concluída.</span></div></div>}
      </article> : null}
    </section> : null}
  </AppShell>
}
