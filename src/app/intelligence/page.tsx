import { Activity, ArrowUpRight, BrainCircuit, CircleGauge, DatabaseZap, FlaskConical, Network, Radar, RefreshCw, ShieldCheck, Sparkles, Target } from 'lucide-react'
import Link from 'next/link'
import { AppShell, PageHeading } from '../_components/app-shell'
import { refreshSignalsAction } from '../acoes/actions'
import { createClient } from '@/lib/supabase/server'
import { requireCompanyPermission } from '@/lib/workspace/server'
import styles from './page.module.css'

type Row = Record<string, unknown>
type RpcResult = { data: unknown; error: { message: string } | null }
type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<RpcResult> }

const integer = new Intl.NumberFormat('pt-BR')
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const compactCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 })
const fullCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const shortDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function amount(value: unknown) { const parsed = Number(value ?? 0); return Number.isFinite(parsed) ? parsed : 0 }
function text(value: unknown, fallback = '') { return value === null || value === undefined ? fallback : String(value) }
function asRecord(value: unknown): Row { return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {} }
function asRows(value: unknown): Row[] { return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object' && !Array.isArray(item)) as Row[] : [] }
function iso(date: Date) { return date.toISOString().slice(0, 10) }
function daysSince(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() < 2000) return null
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000))
}
function movementLabel(value: unknown) {
  const days = daysSince(value)
  if (days === null) return 'Sem movimento'
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Há 1 dia'
  if (days < 30) return `Há ${days} dias`
  return shortDate.format(new Date(String(value)))
}
function severityLabel(value: unknown) {
  const severity = text(value)
  if (severity === 'critical') return 'Crítico'
  if (severity === 'warning') return 'Atenção'
  if (severity === 'opportunity') return 'Oportunidade'
  return 'Informação'
}

export default async function IntelligencePage() {
  const workspace = await requireCompanyPermission('intelligence_view')
  const supabase = await createClient()
  const rpc = supabase as unknown as RpcClient
  const { data, error } = await rpc.rpc('get_intelligence_command_center', { target_company_id: workspace.company.id })
  if (error) return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}><section className="workspace-error"><strong>Não foi possível carregar Intelligence.</strong><span>{error.message}</span></section></AppShell>

  const payload = asRecord(data)
  const dimensions = asRows(payload.dimensions)
  const coverage = asRecord(payload.coverage)
  const network = asRecord(payload.network)
  const partners = asRows(payload.calibration_partners)
  const signals = asRows(payload.signals)
  const brief = asRecord(payload.latest_brief)
  const canRefresh = workspace.membership.role === 'admin' || workspace.membership.role === 'manager'
  const formulasConfigured = dimensions.filter((row) => row.formula_configured === true).length
  const scoredPartners = amount(coverage.v6_scored_partners)
  const totalPartners = amount(coverage.partners)
  const snapshotPartners = amount(coverage.relationship_snapshots)
  const today = new Date()
  const from = new Date(today)
  from.setDate(from.getDate() - 29)
  const dateFrom = iso(from)
  const dateTo = iso(today)
  const networkRows = [
    { key: 'recent', label: 'Tração recente', count: amount(network.recent) },
    { key: 'cooling', label: 'Esfriando', count: amount(network.cooling) },
    { key: 'dormant', label: 'Dormantes', count: amount(network.dormant) },
  ]
  const maxNetwork = Math.max(...networkRows.map((row) => row.count), 1)
  const sourceRows = [
    { key: 'V1', name: 'Relacionamento', source: 'Snapshots de relacionamento', primary: `${integer.format(snapshotPartners)} parceiros`, secondary: `${integer.format(amount(coverage.activity_events))} atividades registradas`, icon: Network },
    { key: 'V2', name: 'Ativação', source: 'Atividade da rede', primary: `${integer.format(amount(coverage.activity_partners))} parceiros com ações`, secondary: `${integer.format(amount(coverage.positive_activity_scores))} com índice legado > 0`, icon: Activity },
    { key: 'V3', name: 'Geração de Oportunidades', source: 'Pipeline comercial', primary: `${integer.format(amount(coverage.opportunities))} oportunidades`, secondary: `${integer.format(amount(coverage.opportunity_partners))} parceiros geradores`, icon: Target },
    { key: 'V4', name: 'Conversão', source: 'Estágios e fechamentos', primary: `${integer.format(amount(coverage.won_opportunities))} ganhos`, secondary: `${integer.format(amount(coverage.opportunities))} oportunidades observadas`, icon: CircleGauge },
    { key: 'V5', name: 'Valor', source: 'Vendas realizadas', primary: `${integer.format(amount(coverage.sales))} vendas`, secondary: compactCurrency.format(amount(coverage.gross_sales_value)), icon: DatabaseZap },
    { key: 'V6', name: 'Consistência', source: 'Histórico diário', primary: `${integer.format(amount(coverage.daily_metric_rows))} registros`, secondary: `${integer.format(amount(coverage.daily_metric_partners))} parceiros · ${text(coverage.daily_metric_first_date, '—')} a ${text(coverage.daily_metric_last_date, '—')}`, icon: Radar },
  ]
  const calibrationRows = partners.slice(0, 30)
  const latestBriefExists = Boolean(brief.id)

  return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}>
    <PageHeading eyebrow="VETRO Intelligence" title="Método V6 e inteligência comercial" context="Método proprietário, cobertura de dados, sinais objetivos e interpretação executiva">
      <div className={styles.headingActions}>
        {canRefresh ? <form action={refreshSignalsAction}><input type="hidden" name="from" value={dateFrom}/><input type="hidden" name="to" value={dateTo}/><button className={styles.secondaryButton} type="submit"><RefreshCw size={14}/>Atualizar diagnóstico</button></form> : null}
        <Link className={styles.primaryLink} href="/acoes">Plano de ação <ArrowUpRight size={14}/></Link>
      </div>
    </PageHeading>

    <section className={styles.methodHero}>
      <div className={styles.v6Mark}>V6</div>
      <div className={styles.methodCopy}><span>MÉTODO PROPRIETÁRIO</span><h2>Estrutura definida. Fórmulas ainda em calibração.</h2><p>Os seis pilares e seus pesos estão registrados no banco. Nenhum score V6 é publicado enquanto as fórmulas individuais não forem validadas. A VETRO usa os dados reais disponíveis para apoiar essa calibração, sem transformar atividade bruta em nota artificial.</p></div>
      <div className={styles.methodStatus}><b>{scoredPartners ? 'Score ativo' : 'Calibração'}</b><span>{formulasConfigured}/6 fórmulas configuradas</span><span>{integer.format(scoredPartners)} parceiros pontuados</span></div>
    </section>

    <section className={styles.metrics}>
      <article><span>Pilares</span><strong>{integer.format(dimensions.length)}</strong><small>pesos somam {decimal.format(dimensions.reduce((sum,row)=>sum+amount(row.weight),0)*100)}%</small><FlaskConical size={17}/></article>
      <article><span>Base de parceiros</span><strong>{integer.format(totalPartners)}</strong><small>{integer.format(snapshotPartners)} com snapshot de relacionamento</small><Network size={17}/></article>
      <article><span>Índice legado ativo</span><strong>{integer.format(amount(coverage.positive_activity_scores))}</strong><small>apoio de calibração · não é V6</small><Activity size={17}/></article>
      <article><span>Histórico diário</span><strong>{integer.format(amount(coverage.daily_metric_rows))}</strong><small>{integer.format(amount(coverage.daily_metric_partners))} parceiros com série temporal</small><Radar size={17}/></article>
      <article><span>Scores V6 publicados</span><strong>{integer.format(amount(coverage.v6_scores))}</strong><small>{scoredPartners ? `${integer.format(scoredPartners)} parceiros` : 'nenhuma nota artificial'}</small><CircleGauge size={17}/></article>
      <article className={signals.length ? styles.attentionMetric : ''}><span>Sinais ativos</span><strong>{integer.format(signals.length)}</strong><small>{signals.length ? 'diagnóstico requer leitura' : 'atualize o diagnóstico quando necessário'}</small><ShieldCheck size={17}/></article>
    </section>

    <section className={styles.dimensionGrid}>
      {dimensions.map((dimension) => <article key={text(dimension.key)}>
        <div className={styles.dimensionHead}><span>{text(dimension.key).toUpperCase()}</span><b>{decimal.format(amount(dimension.weight)*100)}%</b></div>
        <h3>{text(dimension.name)}</h3><p>{text(dimension.description)}</p>
        <div className={styles.dimensionState}><span className={dimension.formula_configured === true ? styles.configured : styles.calibration}>{dimension.formula_configured === true ? 'Fórmula configurada' : 'Fórmula em calibração'}</span></div>
      </article>)}
    </section>

    <section className={styles.analysisGrid}>
      <article className={styles.panel}>
        <header><div><span>BASE OBSERVADA</span><h2>O que já existe para calibrar cada pilar</h2></div><small>dados ≠ score</small></header>
        <div className={styles.sourceList}>{sourceRows.map(({ key,name,source,primary,secondary,icon:Icon }) => <div key={key}><span className={styles.sourceKey}>{key}</span><Icon size={15}/><div><b>{name}</b><small>{source}</small></div><div><strong>{primary}</strong><span>{secondary}</span></div></div>)}</div>
      </article>
      <article className={styles.panel}>
        <header><div><span>SAÚDE DA REDE</span><h2>Temperatura comercial atual</h2></div><small>{integer.format(amount(network.active_partners))} ativos</small></header>
        <div className={styles.networkBars}>{networkRows.map((row) => <div key={row.key}><div><b>{row.label}</b><span>{integer.format(row.count)}</span></div><div><i className={styles[row.key]} style={{ width: `${row.count/maxNetwork*100}%` }}/></div><small>{amount(network.active_partners) ? decimal.format(row.count/amount(network.active_partners)*100) : '0'}%</small></div>)}</div>
        <div className={styles.networkNote}><BrainCircuit size={16}/><div><b>Isso é diagnóstico operacional, não V6.</b><span>A temperatura considera movimentação recente da rede e serve para priorização comercial enquanto o método proprietário é calibrado.</span></div></div>
      </article>
    </section>

    <section className={styles.analysisGrid}>
      <article className={styles.panel}>
        <header><div><span>ATENÇÃO AGORA</span><h2>Sinais determinísticos</h2></div><Link href="/acoes">Abrir execução</Link></header>
        {signals.length ? <div className={styles.signalList}>{signals.slice(0,8).map((signal) => <article key={text(signal.id)}><div><span className={`${styles.severity} ${styles[text(signal.severity,'info')]}`}>{severityLabel(signal.severity)}</span><small>{text(signal.category)}</small></div><b>{text(signal.title)}</b><p>{text(signal.message)}</p>{signal.recommended_action ? <span><strong>Próximo passo:</strong> {text(signal.recommended_action)}</span> : null}</article>)}</div> : <div className={styles.emptyState}><ShieldCheck size={18}/><div><b>Nenhum sinal persistido agora</b><span>Os alertas são calculados por regras objetivas da operação e só aparecem quando existe evidência suficiente no período analisado.</span></div></div>}
      </article>

      <article className={`${styles.panel} ${styles.aiPanel}`}>
        <header><div><span>VETRO INTELLIGENCE</span><h2>Leitura executiva</h2></div><Sparkles size={17}/></header>
        {latestBriefExists ? <><p className={styles.brief}>{text(brief.executive_summary,'Leitura executiva sem resumo textual.')}</p><div className={styles.briefMeta}>{brief.generated_at ? <span>Atualizado em {dateTime.format(new Date(String(brief.generated_at)))}</span> : null}</div><Link className={styles.textLink} href="/acoes">Transformar recomendações em execução <ArrowUpRight size={13}/></Link></> : <div className={styles.aiEmpty}><Sparkles size={20}/><div><b>Nenhuma leitura executiva publicada</b><span>Os sinais objetivos e o Método V6 continuam disponíveis. Leituras executivas são publicadas pelo time VETRO quando aplicável.</span></div></div>}
      </article>
    </section>

    <section className={styles.panel}>
      <header><div><span>CALIBRAÇÃO</span><h2>Parceiros e evidências disponíveis</h2></div><small>Índice de atividade legado ≠ V6</small></header>
      <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Parceiro</th><th>Carteira</th><th>Índice legado</th><th>Oportunidades</th><th>Ganhos</th><th>Vendas</th><th>VGV</th><th>Série diária</th><th>Último movimento</th><th>V6</th></tr></thead><tbody>{calibrationRows.map((row) => <tr key={text(row.partner_id)}><td><Link href={`/parceiros/${text(row.partner_id)}`}><b>{text(row.partner_name,'Parceiro')}</b></Link></td><td><b>{text(row.portfolio_name,'Sem carteira')}</b><small>{text(row.manager_name)}</small></td><td>{row.legacy_activity_score === null || row.legacy_activity_score === undefined ? <span className={styles.muted}>—</span> : <b>{decimal.format(amount(row.legacy_activity_score))}</b>}</td><td>{integer.format(amount(row.opportunities))}</td><td>{integer.format(amount(row.won_opportunities))}</td><td>{integer.format(amount(row.sales))}</td><td><b title={fullCurrency.format(amount(row.gross_sales_value))}>{compactCurrency.format(amount(row.gross_sales_value))}</b></td><td>{integer.format(amount(row.daily_metric_rows))}</td><td><b>{movementLabel(row.last_movement_at)}</b></td><td>{row.latest_v6_score === null || row.latest_v6_score === undefined ? <span className={styles.calibration}>Calibração</span> : <b>{decimal.format(amount(row.latest_v6_score))}</b>}</td></tr>)}</tbody></table></div>
      {partners.length > calibrationRows.length ? <p className={styles.tableNote}>Exibindo os 30 parceiros com maior índice operacional/resultado para apoiar a calibração. A base completa permanece no Radar de Parceiros.</p> : null}
    </section>
  </AppShell>
}