import { BadgeCheck, CircleGauge, CircleX, Clock3, Filter, Landmark, Search, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { AppShell, PageHeading } from '../_components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { requireCompanyPermission } from '@/lib/workspace/server'
import { PipelineBoard, type PipelineOpportunity } from './pipeline-board'
import styles from './page.module.css'

type Row = Record<string, unknown>
type SearchParams = { q?: string | string[]; development?: string | string[]; partner?: string | string[]; stale?: string | string[] }

const number = new Intl.NumberFormat('pt-BR')
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const compactCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 })
const fullCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value }
function amount(value: unknown) { const result = Number(value ?? 0); return Number.isFinite(result) ? result : 0 }
function label(value: unknown, fallback = '') { return value === null || value === undefined ? fallback : String(value) }
function relationValue(row: Row | undefined, key: string) { return row ? label(row[key]) : '' }
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
  const requested = await searchParams ?? {}
  const query = (first(requested.q) ?? '').trim().toLocaleLowerCase('pt-BR')
  const developmentFilter = first(requested.development) ?? ''
  const partnerFilter = first(requested.partner) ?? ''
  const staleOnly = first(requested.stale) === '1'

  const [stagesResult, opportunitiesResult, partnersResult, developmentsResult, portfoliosResult, brokersResult, profilesResult, historyResult, settingsResult] = await Promise.all([
    supabase.from('pipeline_stages').select('id,key,name,position,stage_type,is_active').eq('company_id', workspace.company.id).eq('is_active', true).order('position'),
    supabase.from('opportunities').select('id,stage_id,stage,partner_id,development_id,portfolio_id,broker_id,assigned_to,contact_name,unit_code,farol,contract_value,proposal_value,estimated_value,table_value,source_date,created_at,updated_at,closed_at,lost_reason,motivation').eq('company_id', workspace.company.id).order('updated_at', { ascending: false }),
    supabase.from('partners').select('id,name').eq('company_id', workspace.company.id).order('name'),
    supabase.from('developments').select('id,name,status').eq('company_id', workspace.company.id).order('name'),
    supabase.from('portfolios').select('id,name,manager_name').eq('company_id', workspace.company.id).order('name'),
    supabase.from('brokers').select('id,full_name').eq('company_id', workspace.company.id),
    supabase.from('profiles').select('id,full_name'),
    supabase.from('opportunity_stage_history').select('opportunity_id,entered_at').eq('company_id', workspace.company.id).is('exited_at', null),
    supabase.from('company_settings').select('signal_thresholds').eq('company_id', workspace.company.id).maybeSingle(),
  ])

  const error = stagesResult.error ?? opportunitiesResult.error ?? partnersResult.error ?? developmentsResult.error ?? portfoliosResult.error ?? brokersResult.error ?? profilesResult.error ?? historyResult.error ?? settingsResult.error
  if (error) return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}><section className="workspace-error"><strong>Não foi possível carregar o Pipeline.</strong><span>{error.message}</span></section></AppShell>

  const stages = (stagesResult.data ?? []) as Row[]
  const opportunities = (opportunitiesResult.data ?? []) as Row[]
  const partners = (partnersResult.data ?? []) as Row[]
  const developments = (developmentsResult.data ?? []) as Row[]
  const portfolios = (portfoliosResult.data ?? []) as Row[]
  const brokers = (brokersResult.data ?? []) as Row[]
  const profiles = (profilesResult.data ?? []) as Row[]
  const history = (historyResult.data ?? []) as Row[]
  const settings = settingsResult.data && typeof settingsResult.data === 'object' ? settingsResult.data as Row : {}
  const thresholds = settings.signal_thresholds && typeof settings.signal_thresholds === 'object' && !Array.isArray(settings.signal_thresholds) ? settings.signal_thresholds as Row : {}
  const staleDays = Math.max(1, amount(thresholds.stale_opportunity_days) || 7)

  const stageById = new Map(stages.map((row) => [label(row.id), row]))
  const partnerById = new Map(partners.map((row) => [label(row.id), label(row.name)]))
  const developmentById = new Map(developments.map((row) => [label(row.id), label(row.name)]))
  const portfolioById = new Map(portfolios.map((row) => [label(row.id), row]))
  const brokerById = new Map(brokers.map((row) => [label(row.id), label(row.full_name)]))
  const profileById = new Map(profiles.map((row) => [label(row.id), label(row.full_name)]))
  const enteredAtByOpportunity = new Map(history.map((row) => [label(row.opportunity_id), row.entered_at]))

  const mapped = opportunities.map((row) => {
    const portfolio = portfolioById.get(label(row.portfolio_id))
    const enteredAt = enteredAtByOpportunity.get(label(row.id)) ?? row.updated_at ?? row.created_at
    const stage = stageById.get(label(row.stage_id))
    return {
      id: label(row.id),
      stageId: row.stage_id ? label(row.stage_id) : null,
      stageKey: label(stage?.key ?? row.stage),
      stageType: label(stage?.stage_type, 'open'),
      unitCode: label(row.unit_code),
      contactName: label(row.contact_name),
      partnerId: label(row.partner_id),
      partnerName: partnerById.get(label(row.partner_id)) ?? '',
      developmentId: label(row.development_id),
      developmentName: developmentById.get(label(row.development_id)) ?? '',
      portfolioName: relationValue(portfolio, 'name'),
      managerName: relationValue(portfolio, 'manager_name'),
      brokerName: brokerById.get(label(row.broker_id)) ?? '',
      ownerName: profileById.get(label(row.assigned_to)) ?? '',
      value: bestValue(row),
      tableValue: amount(row.table_value),
      proposalValue: amount(row.proposal_value),
      daysInStage: daysBetween(enteredAt),
      sourceDate: row.source_date ? label(row.source_date) : null,
      farol: label(row.farol),
      motivation: label(row.motivation ?? row.lost_reason),
      closedAt: row.closed_at ? label(row.closed_at) : null,
      lostReason: label(row.lost_reason),
    }
  })

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
  const boardRows: PipelineOpportunity[] = open.map(({ stageType: _stageType, partnerId: _partnerId, developmentId: _developmentId, closedAt: _closedAt, lostReason: _lostReason, ...row }) => row)

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
