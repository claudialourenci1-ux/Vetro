import { Activity, ArrowUpRight, CircleGauge, Filter, Network, Search, Sparkles, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { AppShell, PageHeading } from '../_components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { requireCompanyPermission } from '@/lib/workspace/server'
import styles from './partners.module.css'

type Row = Record<string, unknown>
type RpcResult = { data: unknown; error: { message: string } | null }
type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<RpcResult> }
type SearchParams = { q?: string | string[]; portfolio?: string | string[]; health?: string | string[]; result?: string | string[] }

type PartnerView = {
  id: string
  name: string
  status: string
  portfolioId: string
  portfolioName: string
  managerName: string
  declaredBrokers: number
  activitiesCount: number
  opportunitiesCount: number
  salesCount: number
  grossSalesValue: number
  legacyActivityScore: number | null
  latestV6Score: number | null
  lastMovementAt: string | null
  daysSinceMovement: number | null
  health: 'recent' | 'cooling' | 'dormant'
}

const integer = new Intl.NumberFormat('pt-BR')
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const compactCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 })
const fullCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const shortDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value }
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
function healthFor(days: number | null, inactivityDays: number): PartnerView['health'] {
  if (days !== null && days <= inactivityDays) return 'recent'
  if (days !== null && days <= 90) return 'cooling'
  return 'dormant'
}
function healthLabel(value: PartnerView['health']) {
  if (value === 'recent') return 'Tração recente'
  if (value === 'cooling') return 'Esfriando'
  return 'Dormante'
}
function dateLabel(value: string | null, days: number | null) {
  if (!value || days === null) return 'Sem movimento'
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Há 1 dia'
  if (days < 30) return `Há ${days} dias`
  return shortDate.format(new Date(value))
}

export default async function PartnersPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const workspace = await requireCompanyPermission('partners_view')
  const supabase = await createClient()
  const rpc = supabase as unknown as RpcClient
  const requested = await searchParams ?? {}
  const query = (first(requested.q) ?? '').trim().toLocaleLowerCase('pt-BR')
  const portfolioFilter = first(requested.portfolio) ?? ''
  const healthFilter = first(requested.health) ?? ''
  const resultFilter = first(requested.result) ?? ''

  const [centerResult, settingsResult] = await Promise.all([
    rpc.rpc('get_partners_command_center', { target_company_id: workspace.company.id }),
    supabase.from('company_settings').select('signal_thresholds').eq('company_id', workspace.company.id).maybeSingle(),
  ])

  const error = centerResult.error ?? settingsResult.error
  if (error) return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}><section className="workspace-error"><strong>Não foi possível carregar Parceiros.</strong><span>{error.message}</span></section></AppShell>

  const payload = asRecord(centerResult.data)
  const rawPartners = asRows(payload.partners)
  const portfolios = asRows(payload.portfolios)
  const settings = asRecord(settingsResult.data)
  const thresholds = asRecord(settings.signal_thresholds)
  const inactivityDays = Math.max(1, amount(thresholds.partner_inactivity_days) || 14)
  const canStrategic = workspace.membership.role === 'admin' || workspace.membership.role === 'manager' || workspace.permissions.includes('overview_view') || workspace.permissions.includes('intelligence_view')
  const canV6 = workspace.membership.role === 'admin' || workspace.membership.role === 'manager' || workspace.permissions.includes('intelligence_view')

  const partners: PartnerView[] = rawPartners.map((row) => {
    const movement = row.last_movement_at && new Date(String(row.last_movement_at)).getUTCFullYear() >= 2000 ? String(row.last_movement_at) : null
    const days = daysSince(movement)
    return {
      id: text(row.id),
      name: text(row.name, 'Parceiro'),
      status: text(row.status, 'active'),
      portfolioId: text(row.portfolio_id),
      portfolioName: text(row.portfolio_name, 'Sem carteira'),
      managerName: text(row.manager_name),
      declaredBrokers: amount(row.declared_broker_count),
      activitiesCount: amount(row.activities_count),
      opportunitiesCount: amount(row.opportunities_count),
      salesCount: amount(row.sales_count),
      grossSalesValue: amount(row.gross_sales_value),
      legacyActivityScore: row.legacy_activity_score === null || row.legacy_activity_score === undefined ? null : amount(row.legacy_activity_score),
      latestV6Score: row.latest_v6_score === null || row.latest_v6_score === undefined ? null : amount(row.latest_v6_score),
      lastMovementAt: movement,
      daysSinceMovement: days,
      health: healthFor(days, inactivityDays),
    }
  })

  const filtered = partners.filter((partner) => {
    if (portfolioFilter && partner.portfolioId !== portfolioFilter) return false
    if (healthFilter && partner.health !== healthFilter) return false
    if (resultFilter === 'producer' && partner.salesCount <= 0) return false
    if (resultFilter === 'opportunity_no_sale' && !(partner.opportunitiesCount > 0 && partner.salesCount === 0)) return false
    if (!query) return true
    return [partner.name, partner.portfolioName, partner.managerName].join(' ').toLocaleLowerCase('pt-BR').includes(query)
  })

  const recent = partners.filter((row) => row.health === 'recent').length
  const cooling = partners.filter((row) => row.health === 'cooling').length
  const dormant = partners.filter((row) => row.health === 'dormant').length
  const producers = partners.filter((row) => row.salesCount > 0).length
  const opportunityNoSale = partners.filter((row) => row.opportunitiesCount > 0 && row.salesCount === 0).length
  const declaredBrokers = partners.reduce((total, row) => total + row.declaredBrokers, 0)
  const totalVgv = partners.reduce((total, row) => total + row.grossSalesValue, 0)
  const healthRows = [
    { key: 'recent', label: 'Tração recente', count: recent },
    { key: 'cooling', label: 'Esfriando', count: cooling },
    { key: 'dormant', label: 'Dormante', count: dormant },
  ]
  const maxHealth = Math.max(...healthRows.map((row) => row.count), 1)
  const portfolioRows = portfolios.map((portfolio) => ({ id: text(portfolio.id), name: text(portfolio.name), manager: text(portfolio.manager_name), count: amount(portfolio.partners_count) })).sort((a,b) => b.count - a.count)
  const maxPortfolio = Math.max(...portfolioRows.map((row) => row.count), 1)
  const filtersActive = Boolean(query || portfolioFilter || healthFilter || resultFilter)

  return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}>
    <PageHeading eyebrow="Parceiros" title="Radar da rede comercial" context={`Saúde da carteira · tração recente = movimento nos últimos ${inactivityDays} dias`} />

    <section className={styles.metrics}>
      <article><span>Base comercial</span><strong>{integer.format(partners.length)}</strong><small>{integer.format(partners.filter((row) => row.status === 'active').length)} ativos no cadastro</small><UsersRound size={17}/></article>
      <article className={styles.positiveMetric}><span>Tração recente</span><strong>{integer.format(recent)}</strong><small>movimento em até {inactivityDays} dias</small><Activity size={17}/></article>
      <article className={cooling ? styles.warningMetric : ''}><span>Esfriando</span><strong>{integer.format(cooling)}</strong><small>sem movimento entre {inactivityDays + 1} e 90 dias</small><CircleGauge size={17}/></article>
      <article><span>Dormantes</span><strong>{integer.format(dormant)}</strong><small>sem movimento há mais de 90 dias</small><Network size={17}/></article>
      {canStrategic ? <article><span>Produtores</span><strong>{integer.format(producers)}</strong><small>{compactCurrency.format(totalVgv)} de VGV histórico</small><Sparkles size={17}/></article> : <article><span>Corretores declarados</span><strong>{integer.format(declaredBrokers)}</strong><small>base informada pela operação</small><UsersRound size={17}/></article>}
      {canStrategic ? <article><span>Oportunidade sem venda</span><strong>{integer.format(opportunityNoSale)}</strong><small>parceiros com pipeline e zero venda</small><ArrowUpRight size={17}/></article> : <article><span>Com atividade</span><strong>{integer.format(partners.filter((row) => row.activitiesCount > 0).length)}</strong><small>ao menos uma ação registrada</small><Activity size={17}/></article>}
    </section>

    <form className={styles.filters} method="get">
      <label className={styles.search}><Search size={14}/><input defaultValue={first(requested.q) ?? ''} name="q" placeholder="Buscar parceiro, carteira ou responsável..." /></label>
      <label><span>Carteira</span><select defaultValue={portfolioFilter} name="portfolio"><option value="">Todas</option>{portfolioRows.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
      <label><span>Saúde</span><select defaultValue={healthFilter} name="health"><option value="">Todas</option><option value="recent">Tração recente</option><option value="cooling">Esfriando</option><option value="dormant">Dormante</option></select></label>
      {canStrategic ? <label><span>Resultado</span><select defaultValue={resultFilter} name="result"><option value="">Todos</option><option value="producer">Já vendeu</option><option value="opportunity_no_sale">Oportunidade sem venda</option></select></label> : null}
      <button type="submit"><Filter size={14}/>Aplicar</button>
      {filtersActive ? <Link href="/parceiros">Limpar</Link> : null}
    </form>

    <section className={styles.analysisGrid}>
      <article className={styles.panel}>
        <header><div><span>SAÚDE DA REDE</span><h2>Distribuição por temperatura comercial</h2></div><small>{integer.format(partners.length)} parceiros</small></header>
        <div className={styles.barList}>{healthRows.map((row) => <div key={row.key}><div><b>{row.label}</b><span>{integer.format(row.count)}</span></div><div className={styles.barTrack}><i className={styles[row.key]} style={{ width: `${row.count / maxHealth * 100}%` }}/></div><small>{partners.length ? decimal.format(row.count / partners.length * 100) : '0'}% da base</small></div>)}</div>
      </article>
      <article className={styles.panel}>
        <header><div><span>CARTEIRAS</span><h2>Distribuição da rede por gestão</h2></div><small>{portfolioRows.length} carteiras</small></header>
        <div className={styles.portfolioList}>{portfolioRows.length ? portfolioRows.map((row) => <div key={row.id}><div><b>{row.name}</b><span>{row.manager || 'Sem responsável'}</span></div><div className={styles.portfolioBar}><i style={{ width: `${row.count / maxPortfolio * 100}%` }}/></div><strong>{integer.format(row.count)}</strong></div>) : <p className={styles.empty}>Nenhuma carteira configurada.</p>}</div>
      </article>
    </section>

    <section className={styles.panel}>
      <header><div><span>MAPA COMERCIAL</span><h2>Parceiros e sinais de tração</h2></div><small>{integer.format(filtered.length)} no recorte</small></header>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Parceiro</th><th>Carteira</th><th>Saúde</th><th>Corretores</th><th>Atividade</th><th>Oportunidades</th>{canStrategic ? <><th>Vendas</th><th>VGV</th></> : null}<th>Último movimento</th>{canV6 ? <th>V6</th> : null}<th /></tr></thead>
          <tbody>{filtered.map((partner) => <tr key={partner.id}>
            <td><Link href={`/parceiros/${partner.id}`}><b>{partner.name}</b><small>{partner.status === 'active' ? 'Ativo no cadastro' : partner.status}</small></Link></td>
            <td><b>{partner.portfolioName}</b><small>{partner.managerName || 'Sem responsável'}</small></td>
            <td><span className={`${styles.healthBadge} ${styles[partner.health]}`}>{healthLabel(partner.health)}</span>{partner.salesCount > 0 && partner.health !== 'recent' && canStrategic ? <small>produtor histórico</small> : null}</td>
            <td>{integer.format(partner.declaredBrokers)}</td>
            <td>{partner.legacyActivityScore === null ? <span className={styles.muted}>—</span> : <b>{decimal.format(partner.legacyActivityScore)}</b>}</td>
            <td>{integer.format(partner.opportunitiesCount)}</td>
            {canStrategic ? <><td>{integer.format(partner.salesCount)}</td><td><b title={fullCurrency.format(partner.grossSalesValue)}>{compactCurrency.format(partner.grossSalesValue)}</b></td></> : null}
            <td><b>{dateLabel(partner.lastMovementAt, partner.daysSinceMovement)}</b><small>{partner.lastMovementAt ? shortDate.format(new Date(partner.lastMovementAt)) : 'nenhum registro'}</small></td>
            {canV6 ? <td>{partner.latestV6Score === null ? <span className={styles.calibration}>Calibração</span> : <b>{decimal.format(partner.latestV6Score)}</b>}</td> : null}
            <td><Link className={styles.openLink} href={`/parceiros/${partner.id}`} aria-label={`Abrir visão 360 de ${partner.name}`}><ArrowUpRight size={14}/></Link></td>
          </tr>)}</tbody>
        </table>
      </div>
      {!filtered.length ? <p className={styles.empty}>Nenhum parceiro corresponde aos filtros atuais.</p> : null}
    </section>
  </AppShell>
}
