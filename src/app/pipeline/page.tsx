import { BadgeCheck, CircleGauge, CircleX, Clock3, Filter, Landmark, Search, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { AppShell, PageHeading } from '../_components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { requireCompanyPermission } from '@/lib/workspace/server'
import { PipelineBoard, type PipelineOpportunity } from './pipeline-board'
import styles from './page.module.css'

type Row = Record<string, unknown>
type SearchParams = { q?: string | string[]; development?: string | string[]; partner?: string | string[]; stale?: string | string[] }
type RpcResult = { data: unknown; error: { message: string } | null }
type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<RpcResult> }

const number = new Intl.NumberFormat('pt-BR')
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const compactCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 })
const fullCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value }
function amount(value: unknown) { const result = Number(value ?? 0); return Number.isFinite(result) ? result : 0 }
function label(value: unknown, fallback = '') { return value === null || value === undefined ? fallback : String(value) }
function asRecord(value: unknown): Row { return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {} }
function asRows(value: unknown): Row[] { return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object' && !Array.isArray(item)) as Row[] : [] }
function bestValue(row: Row) { return amount(row.contract_value ?? row.proposal_value ?? row.estimated_value ?? row.table_value) }
function daysBetween(value: unknown) {
  if (!value) return 0
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return 0
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000))
}

export default async function PipelinePage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const workspace = await requireCompanyPermission('pipeline_view')
  const supabase = await createClient()
  const rpc = supabase as unknown as RpcClient
  const requested = await searchParams ?? {}
  const query = (first(requested.q) ?? '').trim().toLocaleLowerCase('pt-BR')
  const developmentFilter = first(requested.development) ?? ''
  const partnerFilter = first(requested.partner) ?? ''
  const staleOnly = first(requested.stale) === '1'

  const { data, error } = await rpc.rpc('get_pipeline_command_center', { target_company_id: workspace.company.id })
  if (error) return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}><section className="workspace-error"><strong>Não foi possível carregar o Pipeline.</strong><span>{error.message}</span></section></AppShell>

  const payload = asRecord(data)
  const stages = asRows(payload.stages)
  const opportunities = asRows(payload.opportunities)
  const partners = asRows(payload.partners)
  const developments = asRows(payload.developments)
  const staleDays = Math.max(1, amount(payload.stale_days) || 7)

  const mapped = opportunities.map((row) => ({
    id: label(row.id),
    stageId: row.stage_id ? label(row.stage_id) : null,
    stageKey: label(row.stage),
    stageType: label(row.stage_type, 'open'),
    unitCode: label(row.unit_code),
    contactName: label(row.contact_name),
    partnerId: label(row.partner_id),
    partnerName: label(row.partner_name),
    developmentId: label(row.development_id),
    developmentName: label(row.development_name),
    portfolioName: label(row.portfolio_name),
    managerName: label(row.manager_name),
    brokerName: label(row.broker_name),
    ownerName: label(row.owner_name),
    value: bestValue(row),
    tableValue: amount(row.table_value),
    proposalValue: amount(row.proposal_value),
    daysInStage: daysBetween(row.stage_entered_at),
    sourceDate: row.source_date ? label(row.source_date) : null,
    farol: label(row.farol),
    motivation: label(row.motivation ?? row.lost_reason),
    closedAt: row.closed_at ? label(row.closed_at) : null,
    lostReason: label(row.lost_reason),
  }))

  const filtered = mapped.filter((row) => {
    if (developmentFilter && row.developmentId !== developmentFilter) return false
    if (partnerFilter && row.partnerId !== partnerFilter) return false
    if (staleOnly && !(row.stageType === 'open' && row.daysInStage >= staleDays)) return false
    if (!query) return true
    const haystack = [row.unitCode,row.contactName,row.partnerName,row.developmentName,row.portfolioName,row.managerName,row.brokerName,row.ownerName].join(' ').toLocaleLowerCase('pt-BR')
    return haystack.includes(query)
  })

  const open = filtered.filter((row) => row.stageType === 'open')
  const won = filtered.filter((row) => row.stageType === 'won')
  const lost = filtered.filter((row) => row.stageType === 'lost')
  const openValue = open.reduce((total, row) => total + row.value, 0)
  const stale = open.filter((row) => row.daysInStage >= staleDays)
  const staleValue = stale.reduce((total, row) => total + row.value, 0)
  const avgAge = open.length ? open.reduce((total, row) => total + row.daysInStage, 0) / open.length : 0
  const closeRate = won.length + lost.length ? (won.length / (won.length + lost.length)) * 100 : 0

  const openStages = stages.filter((row) => label(row.stage_type) === 'open').map((row) => ({ id: label(row.id), key: label(row.key), name: label(row.name), position: amount(row.position), stageType: label(row.stage_type) }))
  const boardRows: PipelineOpportunity[] = open.map((row) => ({
    id: row.id,
    stageId: row.stageId,
    stageKey: row.stageKey,
    unitCode: row.unitCode,
    contactName: row.contactName,
    partnerName: row.partnerName,
    developmentName: row.developmentName,
    portfolioName: row.portfolioName,
    managerName: row.managerName,
    brokerName: row.brokerName,
    ownerName: row.ownerName,
    value: row.value,
    tableValue: row.tableValue,
    proposalValue: row.proposalValue,
    daysInStage: row.daysInStage,
    sourceDate: row.sourceDate,
    farol: row.farol,
    motivation: row.motivation,
  }))

  const stageStats = openStages.map((stage) => {
    const rows = open.filter((row) => row.stageId === stage.id)
    return { ...stage, count: rows.length, value: rows.reduce((total, row) => total + row.value, 0), avgAge: rows.length ? rows.reduce((total, row) => total + row.daysInStage, 0) / rows.length : 0 }
  })
  const maxStageValue = Math.max(...stageStats.map((row) => row.value), 1)

  const agingRanges = [
    { label: '0-2 dias', test: (days: number) => days <= 2 },
    { label: '3-5 dias', test: (days: number) => days >= 3 && days <= 5 },
    { label: '6-10 dias', test: (days: number) => days >= 6 && days <= 10 },
    { label: '11-20 dias', test: (days: number) => days >= 11 && days <= 20 },
    { label: '+20 dias', test: (days: number) => days > 20 },
  ].map((bucket) => {
    const rows = open.filter((row) => bucket.test(row.daysInStage))
    return { label: bucket.label, count: rows.length, value: rows.reduce((total, row) => total + row.value, 0) }
  })
  const maxAgingCount = Math.max(...agingRanges.map((row) => row.count), 1)

  const canManage = workspace.membership.role === 'admin' || workspace.membership.role === 'manager' || workspace.permissions.includes('opportunities_manage')
  const filtersActive = Boolean(query || developmentFilter || partnerFilter || staleOnly)
  const closedRows = [...won, ...lost].sort((a,b) => new Date(b.closedAt ?? 0).getTime() - new Date(a.closedAt ?? 0).getTime()).slice(0, 12)

  return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}>
    <PageHeading eyebrow="Pipeline" title="Comando comercial" context={`Estado atual da operação · aging crítico a partir de ${staleDays} dias`} />

    <section className={styles.metrics}>
      <article><span>Em aberto</span><strong>{number.format(open.length)}</strong><small>{compactCurrency.format(openValue)} em valor potencial</small><CircleGauge size={17}/></article>
      <article className={stale.length ? styles.attentionMetric : ''}><span>Paradas</span><strong>{number.format(stale.length)}</strong><small>{compactCurrency.format(staleValue)} há {staleDays}+ dias</small><TriangleAlert size={17}/></article>
      <article><span>Aging médio</span><strong>{decimal.format(avgAge)}d</strong><small>tempo médio na etapa atual</small><Clock3 size={17}/></article>
      <article><span>Vendas</span><strong>{number.format(won.length)}</strong><small>{decimal.format(closeRate)}% dos encerramentos</small><BadgeCheck size={17}/></article>
      <article><span>Perdidas</span><strong>{number.format(lost.length)}</strong><small>motivo obrigatório no fechamento</small><CircleX size={17}/></article>
      <article><span>Pipeline filtrado</span><strong>{number.format(filtered.length)}</strong><small>{filtersActive ? 'recorte ativo' : 'base completa'}</small><Landmark size={17}/></article>
    </section>

    <form className={styles.filters} method="get">
      <label className={styles.search}><Search size={14}/><input defaultValue={first(requested.q) ?? ''} name="q" placeholder="Buscar unidade, parceiro, cliente, corretor..." /></label>
      <label><span>Empreendimento</span><select defaultValue={developmentFilter} name="development"><option value="">Todos</option>{developments.map((row) => <option key={label(row.id)} value={label(row.id)}>{label(row.name)}</option>)}</select></label>
      <label><span>Parceiro</span><select defaultValue={partnerFilter} name="partner"><option value="">Todos</option>{partners.map((row) => <option key={label(row.id)} value={label(row.id)}>{label(row.name)}</option>)}</select></label>
      <label className={styles.checkbox}><input defaultChecked={staleOnly} name="stale" type="checkbox" value="1"/><span>Somente paradas</span></label>
      <button type="submit"><Filter size={14}/>Aplicar</button>
      {filtersActive ? <Link href="/pipeline">Limpar</Link> : null}
    </form>

    <section className={styles.analysisGrid}>
      <article className={styles.panel}>
        <header><div><span>FUNIL ATUAL</span><h2>Valor e volume por etapa</h2></div><small>pipeline aberto</small></header>
        <div className={styles.stageFlow}>{stageStats.map((stage) => <div className={styles.flowRow} key={stage.id}><div><b>{stage.name}</b><span>{stage.count} oportunidade{stage.count === 1 ? '' : 's'} · aging {decimal.format(stage.avgAge)}d</span></div><div className={styles.flowVisual}><i style={{ width: `${Math.max(stage.value / maxStageValue * 100, stage.count ? 4 : 0)}%` }}/></div><strong title={fullCurrency.format(stage.value)}>{compactCurrency.format(stage.value)}</strong></div>)}</div>
      </article>
      <article className={styles.panel}>
        <header><div><span>AGING</span><h2>Onde o pipeline está envelhecendo</h2></div><small>{number.format(open.length)} abertas</small></header>
        <div className={styles.agingChart}>{agingRanges.map((bucket) => <div key={bucket.label}><span>{bucket.label}</span><div><i style={{ width: `${bucket.count / maxAgingCount * 100}%` }}/></div><b>{bucket.count}</b><small>{compactCurrency.format(bucket.value)}</small></div>)}</div>
      </article>
    </section>

    <section className={styles.boardPanel}>
      <header className={styles.sectionHeader}><div><span>GESTÃO DIÁRIA</span><h2>Quadro de oportunidades</h2><p>{canManage ? 'Arraste entre etapas abertas ou use o seletor de cada oportunidade.' : 'Sua permissão permite leitura do pipeline, sem alteração de etapa.'}</p></div><div className={styles.legend}><span><i/>normal</span><span><i className={styles.legendWarning}/>aging alto</span></div></header>
      <PipelineBoard stages={openStages} opportunities={boardRows} canManage={canManage} staleDays={staleDays} />
    </section>

    <section className={styles.panel}>
      <header><div><span>ENCERRAMENTOS</span><h2>Últimos resultados no recorte</h2></div><small>{won.length} vendas · {lost.length} perdidas</small></header>
      {closedRows.length ? <div className={styles.closedList}>{closedRows.map((row) => <article key={row.id}><div><span className={row.stageType === 'won' ? styles.wonBadge : styles.lostBadge}>{row.stageType === 'won' ? 'Venda' : 'Perdida'}</span><b>{row.unitCode || 'Sem unidade'} · {row.developmentName || 'Sem empreendimento'}</b><small>{row.partnerName || 'Sem parceiro'}</small></div><div><strong title={fullCurrency.format(row.value)}>{compactCurrency.format(row.value)}</strong><span>{row.closedAt ? dateTime.format(new Date(row.closedAt)) : 'sem data'}</span>{row.stageType === 'lost' && row.lostReason ? <small>{row.lostReason}</small> : null}</div></article>)}</div> : <p className={styles.empty}>Nenhum encerramento encontrado neste recorte.</p>}
    </section>
  </AppShell>
}
