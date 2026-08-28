import type { CSSProperties } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  Clock3,
  Gauge,
  Network,
  Sparkles,
  Target,
  UsersRound,
} from 'lucide-react'
import { AiBriefButton } from './ai-brief-button'

type JsonRecord = Record<string, unknown>
type VgvPoint = { date: string; vgv: number; sales: number }
type FunnelRow = { stage_id?: string | null; stage: string; position: number; opportunities: number; pipeline_value: number; avg_age_days: number }
type PartnerRow = { partner_id: string; partner_name: string; opportunities: number; won: number; sales: number; vgv: number; last_activity_at?: string | null; v6_score?: number | null; conversion_rate: number }
type DevelopmentRow = { id: string; name: string; sales: number; vgv: number; opportunities: number; pipeline_value: number; available_units: number; available_inventory_value: number; target_vgv: number }
type SignalRow = { id?: string; category?: string; severity?: string; title?: string; message?: string; recommended_action?: string; last_seen_at?: string }
type AiAttention = { title?: string; severity?: string; why_it_matters?: string; evidence?: string[]; recommended_action?: string }
type AiAction = { title?: string; priority?: string; expected_impact?: string; effort?: string; rationale?: string; owner_role?: string }

type CockpitData = {
  period?: { from?: string; to?: string }
  kpis?: {
    partners_registered?: number
    partners_engaged?: number
    brokers_registered?: number
    brokers_engaged?: number
    opportunities?: number
    sales?: number
    vgv?: number
    activities?: number
    conversion_rate?: number
    changes?: { opportunities_pct?: number | null; sales_pct?: number | null; vgv_pct?: number | null; conversion_pp?: number | null }
  }
  vgv_series?: VgvPoint[]
  goal?: { target?: number; realized?: number; attainment_pct?: number | null; gap?: number; remaining_daily_pace?: number }
  forecast?: { method?: string; realized?: number; run_rate_forecast?: number | null; open_pipeline_value?: number; target?: number; confidence?: string; note?: string }
  funnel?: FunnelRow[]
  aging?: Record<string, { count?: number; value?: number }>
  partners?: PartnerRow[]
  developments?: DevelopmentRow[]
  inventory?: { total_units?: number; available_units?: number; reserved_units?: number; sold_units?: number; blocked_units?: number; available_value?: number; absorption_pct?: number | null }
  v6?: { partners_scored?: number; overall?: number | null; v1?: number | null; v2?: number | null; v3?: number | null; v4?: number | null; v5?: number | null; v6?: number | null }
  concentration?: { top5_vgv?: number; total_vgv?: number; top5_share_pct?: number | null }
  signals?: SignalRow[]
  actions?: Array<{ id?: string; source?: string; title?: string; description?: string; priority?: string; status?: string; due_at?: string | null }>
  latest_ai_brief?: {
    id?: string
    briefing_type?: string
    model?: string
    executive_summary?: string
    attention_points?: AiAttention[]
    recommended_actions?: AiAction[]
    generated_at?: string | null
  } | null
  freshness?: { last_data_at?: string | null }
}

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const compactMoney = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 })
const integer = new Intl.NumberFormat('pt-BR')
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const dateTime = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

function n(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

function pct(value: unknown) {
  return `${decimal.format(n(value))}%`
}

function Delta({ value, suffix = '%' }: { value?: number | null; suffix?: string }) {
  if (value === null || value === undefined || !Number.isFinite(value)) return <span className="cockpit-delta neutral">Sem base comparável</span>
  const positive = value > 0
  const negative = value < 0
  return (
    <span className={`cockpit-delta ${positive ? 'positive' : negative ? 'negative' : 'neutral'}`}>
      {positive ? <ArrowUpRight size={12} /> : negative ? <ArrowDownRight size={12} /> : null}
      {positive ? '+' : ''}{decimal.format(value)}{suffix}
    </span>
  )
}

function MetricCard({ label, value, detail, icon }: { label: string; value: string; detail?: React.ReactNode; icon: React.ReactNode }) {
  return (
    <article className="cockpit-metric">
      <div className="cockpit-metric-top"><span>{label}</span><i>{icon}</i></div>
      <strong title={value}>{value}</strong>
      <div className="cockpit-metric-detail">{detail}</div>
    </article>
  )
}

function PanelHeading({ eyebrow, title, aside }: { eyebrow?: string; title: string; aside?: React.ReactNode }) {
  return (
    <header className="cockpit-panel-heading">
      <div>{eyebrow ? <span>{eyebrow}</span> : null}<h2>{title}</h2></div>
      {aside ? <div>{aside}</div> : null}
    </header>
  )
}

function VgvChart({ points }: { points: VgvPoint[] }) {
  if (!points.length) return <div className="cockpit-empty-chart">Ainda não há série de vendas para o período.</div>
  const width = 760
  const height = 250
  const padX = 24
  const padY = 24
  const max = Math.max(...points.map((point) => n(point.vgv)), 1)
  const chartW = width - padX * 2
  const chartH = height - padY * 2
  const coords = points.map((point, index) => {
    const x = padX + (points.length === 1 ? chartW / 2 : index / (points.length - 1) * chartW)
    const y = padY + chartH - (n(point.vgv) / max) * chartH
    return { ...point, x, y }
  })
  const line = coords.map((point) => `${point.x},${point.y}`).join(' ')
  const area = `M ${coords[0].x} ${padY + chartH} L ${coords.map((point) => `${point.x} ${point.y}`).join(' L ')} L ${coords.at(-1)?.x ?? padX} ${padY + chartH} Z`
  const labels = [coords[0], coords[Math.floor(coords.length / 2)], coords.at(-1)].filter(Boolean) as typeof coords

  return (
    <div className="cockpit-chart-wrap">
      <svg aria-label="Evolução diária do VGV no período" className="cockpit-chart" role="img" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="vgvArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--mint)" stopOpacity=".22" />
            <stop offset="100%" stopColor="var(--mint)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, .25, .5, .75, 1].map((ratio) => {
          const y = padY + chartH * ratio
          return <line key={ratio} stroke="var(--cockpit-grid)" strokeWidth="1" x1={padX} x2={width - padX} y1={y} y2={y} />
        })}
        <path d={area} fill="url(#vgvArea)" />
        <polyline fill="none" points={line} stroke="var(--mint)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        {coords.filter((_, index) => index === coords.length - 1 || (n(coords[index]?.vgv) > n(coords[index - 1]?.vgv) && n(coords[index]?.vgv) >= n(coords[index + 1]?.vgv))).slice(-5).map((point) => (
          <circle key={`${point.date}-${point.x}`} cx={point.x} cy={point.y} fill="var(--mint)" r="3.5" stroke="var(--bg)" strokeWidth="2" />
        ))}
        {labels.map((point) => (
          <text key={`label-${point.date}`} fill="var(--muted)" fontSize="10" textAnchor={point === coords[0] ? 'start' : point === coords.at(-1) ? 'end' : 'middle'} x={point.x} y={height - 3}>
            {shortDate.format(new Date(`${point.date}T12:00:00`))}
          </text>
        ))}
      </svg>
    </div>
  )
}

function Progress({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(value, 100))
  return <div className="cockpit-progress"><i style={{ width: `${clamped}%` }} /></div>
}

function V6Ring({ label, value, caption }: { label: string; value?: number | null; caption: string }) {
  const score = value == null ? 0 : Math.max(0, Math.min(n(value), 100))
  const style = { '--score-angle': `${score * 3.6}deg` } as CSSProperties
  return (
    <article className="cockpit-v6-item">
      <div className="cockpit-v6-ring" style={style}><span>{value == null ? '—' : decimal.format(score)}</span></div>
      <div><strong>{label}</strong><span>{caption}</span></div>
    </article>
  )
}

function Severity({ value }: { value?: string }) {
  const normalized = ['critical', 'warning', 'opportunity', 'info'].includes(value ?? '') ? value : 'info'
  return <span className={`cockpit-severity ${normalized}`}>{normalized === 'critical' ? 'Crítico' : normalized === 'warning' ? 'Atenção' : normalized === 'opportunity' ? 'Oportunidade' : 'Informação'}</span>
}

function formatFreshness(value?: string | null) {
  if (!value) return 'Sem atualização registrada'
  try { return `Dados atualizados em ${dateTime.format(new Date(value))}` } catch { return 'Atualização disponível' }
}

export function CommercialCockpit({
  raw,
  companyId,
  companyName,
  dateFrom,
  dateTo,
  developments,
  selectedDevelopmentId,
}: {
  raw: unknown
  companyId: string
  companyName: string
  dateFrom: string
  dateTo: string
  developments: Array<{ id: string; name: string }>
  selectedDevelopmentId?: string
}) {
  const data = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as CockpitData
  const kpis = data.kpis ?? {}
  const changes = kpis.changes ?? {}
  const goal = data.goal ?? {}
  const forecast = data.forecast ?? {}
  const v6 = data.v6 ?? {}
  const inventory = data.inventory ?? {}
  const concentration = data.concentration ?? {}
  const funnel = safeArray<FunnelRow>(data.funnel)
  const partners = safeArray<PartnerRow>(data.partners)
  const developmentRows = safeArray<DevelopmentRow>(data.developments)
  const points = safeArray<VgvPoint>(data.vgv_series)
  const signals = safeArray<SignalRow>(data.signals)
  const aiBrief = data.latest_ai_brief ?? null
  const aiAttention = safeArray<AiAttention>(aiBrief?.attention_points)
  const aiActions = safeArray<AiAction>(aiBrief?.recommended_actions)
  const attention = signals.length ? signals : aiAttention.map((item, index) => ({
    id: `ai-${index}`,
    severity: item.severity,
    title: item.title,
    message: item.why_it_matters,
    recommended_action: item.recommended_action,
  }))
  const aging = data.aging ?? {}
  const staleCount = ['6_10', '11_20', '21_plus'].reduce((sum, key) => sum + n(aging[key]?.count), 0)
  const staleValue = ['6_10', '11_20', '21_plus'].reduce((sum, key) => sum + n(aging[key]?.value), 0)
  const target = n(goal.target)
  const forecastValue = forecast.run_rate_forecast == null ? null : n(forecast.run_rate_forecast)

  return (
    <div className="commercial-cockpit">
      <section className="cockpit-commandbar">
        <div>
          <p className="cockpit-kicker">OVERVIEW</p>
          <h1>{companyName}</h1>
          <p>{formatFreshness(data.freshness?.last_data_at)} · visão executiva da operação comercial</p>
        </div>
        <form className="cockpit-filters" method="get">
          <label><span>De</span><input defaultValue={dateFrom} max={dateTo} name="from" type="date" /></label>
          <label><span>Até</span><input defaultValue={dateTo} min={dateFrom} name="to" type="date" /></label>
          <label className="cockpit-filter-wide"><span>Empreendimento</span>
            <select defaultValue={selectedDevelopmentId ?? ''} name="development">
              <option value="">Todos</option>
              {developments.map((development) => <option key={development.id} value={development.id}>{development.name}</option>)}
            </select>
          </label>
          <button type="submit">Aplicar</button>
        </form>
      </section>

      <section className="cockpit-metrics-grid">
        <MetricCard label="VGV no período" value={compactMoney.format(n(kpis.vgv))} icon={<ChartNoAxesCombined size={16} />} detail={<Delta value={changes.vgv_pct} />} />
        <MetricCard label="Meta comercial" value={target > 0 ? compactMoney.format(target) : 'Sem meta'} icon={<Target size={16} />} detail={target > 0 ? <span>{pct(goal.attainment_pct)} atingido</span> : <span>Cadastre a meta do período</span>} />
        <MetricCard label="Oportunidades" value={integer.format(n(kpis.opportunities))} icon={<Network size={16} />} detail={<Delta value={changes.opportunities_pct} />} />
        <MetricCard label="Vendas" value={integer.format(n(kpis.sales))} icon={<Building2 size={16} />} detail={<Delta value={changes.sales_pct} />} />
        <MetricCard label="Conversão" value={pct(kpis.conversion_rate)} icon={<Gauge size={16} />} detail={<Delta suffix=" p.p." value={changes.conversion_pp} />} />
        <MetricCard label="VETRO Score" value={v6.overall == null ? 'Em calibração' : decimal.format(n(v6.overall))} icon={<Sparkles size={16} />} detail={<span>{integer.format(n(v6.partners_scored))} parceiros avaliados</span>} />
      </section>

      <section className="cockpit-major-grid">
        <article className="cockpit-panel cockpit-vgv-panel">
          <PanelHeading eyebrow="PERFORMANCE" title="Evolução do VGV" aside={<span className="cockpit-panel-meta">{dateFrom} → {dateTo}</span>} />
          <div className="cockpit-chart-number"><strong>{money.format(n(kpis.vgv))}</strong><Delta value={changes.vgv_pct} /></div>
          <VgvChart points={points} />
          <div className="cockpit-inline-stats">
            <div><span>Vendas</span><strong>{integer.format(n(kpis.sales))}</strong></div>
            <div><span>Parceiros mobilizados</span><strong>{integer.format(n(kpis.partners_engaged))} / {integer.format(n(kpis.partners_registered))}</strong></div>
            <div><span>Corretores mobilizados</span><strong>{integer.format(n(kpis.brokers_engaged))} / {integer.format(n(kpis.brokers_registered))}</strong></div>
          </div>
        </article>

        <article className="cockpit-panel cockpit-goal-panel">
          <PanelHeading eyebrow="META & RITMO" title="Fechamento projetado" />
          <div className="cockpit-goal-value"><span>Realizado</span><strong>{compactMoney.format(n(kpis.vgv))}</strong></div>
          {target > 0 ? <>
            <Progress value={n(goal.attainment_pct)} />
            <div className="cockpit-goal-split"><div><span>Meta</span><strong>{compactMoney.format(target)}</strong></div><div><span>Gap</span><strong>{compactMoney.format(n(goal.gap))}</strong></div></div>
          </> : <p className="cockpit-panel-copy">Cadastre uma meta de VGV para acompanhar atingimento, gap e ritmo necessário.</p>}
          <div className="cockpit-forecast-box">
            <span>Forecast por ritmo</span>
            <strong>{forecastValue == null ? 'Dados insuficientes' : compactMoney.format(forecastValue)}</strong>
            <small>Confiança: {forecast.confidence === 'high' ? 'alta' : forecast.confidence === 'medium' ? 'média' : forecast.confidence === 'low' ? 'baixa' : 'insuficiente'}</small>
          </div>
          <div className="cockpit-goal-split"><div><span>Pipeline aberto</span><strong>{compactMoney.format(n(forecast.open_pipeline_value))}</strong></div><div><span>Ritmo diário necessário</span><strong>{compactMoney.format(n(goal.remaining_daily_pace))}</strong></div></div>
        </article>
      </section>

      <section className="cockpit-mid-grid">
        <article className="cockpit-panel">
          <PanelHeading eyebrow="PIPELINE" title="Onde os negócios estão" aside={<span className="cockpit-panel-meta">{integer.format(funnel.reduce((sum, row) => sum + n(row.opportunities), 0))} abertas</span>} />
          <div className="cockpit-funnel-list">
            {funnel.length ? funnel.map((row) => {
              const maxCount = Math.max(...funnel.map((item) => n(item.opportunities)), 1)
              return <div className="cockpit-funnel-row" key={`${row.stage_id ?? row.stage}-${row.position}`}>
                <div><strong>{row.stage}</strong><span>{decimal.format(n(row.avg_age_days))} dias médios</span></div>
                <div className="cockpit-funnel-bar"><i style={{ width: `${Math.max(4, n(row.opportunities) / maxCount * 100)}%` }} /></div>
                <div><strong>{integer.format(n(row.opportunities))}</strong><span>{compactMoney.format(n(row.pipeline_value))}</span></div>
              </div>
            }) : <div className="cockpit-empty">Nenhuma oportunidade aberta neste recorte.</div>}
          </div>
        </article>

        <article className="cockpit-panel cockpit-attention-panel">
          <PanelHeading eyebrow="INTELLIGENCE" title="Atenção agora" aside={<AlertTriangle size={17} />} />
          <div className="cockpit-attention-list">
            {attention.length ? attention.slice(0, 5).map((item, index) => <div className="cockpit-attention-item" key={item.id ?? `${item.title}-${index}`}>
              <div><Severity value={item.severity} /><span>{item.last_seen_at ? dateTime.format(new Date(item.last_seen_at)) : ''}</span></div>
              <strong>{item.title ?? 'Ponto de atenção'}</strong>
              <p>{item.message ?? ''}</p>
              {item.recommended_action ? <small><b>Ação sugerida:</b> {item.recommended_action}</small> : null}
            </div>) : <div className="cockpit-empty">Nenhum alerta consolidado ainda. Assim que houver histórico suficiente, os sinais aparecem aqui.</div>}
          </div>
        </article>
      </section>

      <section className="cockpit-mid-grid">
        <article className="cockpit-panel">
          <PanelHeading eyebrow="AGING" title="Oportunidades paradas" aside={<Clock3 size={17} />} />
          <div className="cockpit-aging-summary"><strong>{integer.format(staleCount)}</strong><span>oportunidades com 6+ dias na etapa</span><b>{compactMoney.format(staleValue)} em VGV potencial</b></div>
          <div className="cockpit-aging-bars">
            {[
              ['0_2', '0–2 dias'], ['3_5', '3–5 dias'], ['6_10', '6–10 dias'], ['11_20', '11–20 dias'], ['21_plus', '21+ dias'],
            ].map(([key, label]) => {
              const bucket = aging[key] ?? {}
              return <div key={key}><span>{label}</span><strong>{integer.format(n(bucket.count))}</strong><em>{compactMoney.format(n(bucket.value))}</em></div>
            })}
          </div>
        </article>

        <article className="cockpit-panel">
          <PanelHeading eyebrow="RISCO COMERCIAL" title="Concentração do VGV" aside={<UsersRound size={17} />} />
          <div className="cockpit-concentration"><strong>{concentration.top5_share_pct == null ? '—' : pct(concentration.top5_share_pct)}</strong><span>do VGV está concentrado nos 5 maiores parceiros</span></div>
          <Progress value={n(concentration.top5_share_pct)} />
          <div className="cockpit-goal-split"><div><span>Top 5</span><strong>{compactMoney.format(n(concentration.top5_vgv))}</strong></div><div><span>Total</span><strong>{compactMoney.format(n(concentration.total_vgv))}</strong></div></div>
          <p className="cockpit-panel-copy">A concentração não é boa ou ruim por si só. A VETRO acompanha a tendência para mostrar dependência excessiva ou expansão da base produtiva.</p>
        </article>
      </section>

      <section className="cockpit-major-grid cockpit-ranking-grid">
        <article className="cockpit-panel">
          <PanelHeading eyebrow="PARCEIROS" title="Ranking de performance" aside={<span className="cockpit-panel-meta">Top {Math.min(partners.length, 10)}</span>} />
          <div className="cockpit-table">
            <div className="cockpit-table-head partner"><span>#</span><span>Parceiro</span><span>VGV</span><span>Vendas</span><span>Opps.</span><span>Conv.</span><span>V6</span></div>
            {partners.length ? partners.map((partner, index) => <div className="cockpit-table-row partner" key={partner.partner_id}>
              <span>{index + 1}</span><strong title={partner.partner_name}>{partner.partner_name}</strong><b>{compactMoney.format(n(partner.vgv))}</b><span>{integer.format(n(partner.sales))}</span><span>{integer.format(n(partner.opportunities))}</span><span>{pct(partner.conversion_rate)}</span><span>{partner.v6_score == null ? '—' : decimal.format(n(partner.v6_score))}</span>
            </div>) : <div className="cockpit-empty">Sem movimentação de parceiros no período.</div>}
          </div>
        </article>

        <article className="cockpit-panel">
          <PanelHeading eyebrow="PRODUTO" title="Performance por empreendimento" />
          <div className="cockpit-development-list">
            {developmentRows.length ? developmentRows.slice(0, 8).map((development) => {
              const attainment = n(development.target_vgv) > 0 ? n(development.vgv) / n(development.target_vgv) * 100 : null
              return <div className="cockpit-development-row" key={development.id}>
                <div><strong>{development.name}</strong><span>{integer.format(n(development.sales))} vendas · {integer.format(n(development.opportunities))} oportunidades</span></div>
                <div><b>{compactMoney.format(n(development.vgv))}</b><span>{attainment == null ? `${integer.format(n(development.available_units))} un. disponíveis` : `${decimal.format(attainment)}% da meta`}</span></div>
              </div>
            }) : <div className="cockpit-empty">Cadastre empreendimentos e relacione vendas para comparar performance.</div>}
          </div>
        </article>
      </section>

      <section className="cockpit-panel cockpit-v6-panel">
        <PanelHeading eyebrow="V6 — MÉTODO VETRO" title="Saúde da rede comercial" aside={<span className="cockpit-panel-meta">{integer.format(n(v6.partners_scored))} parceiros avaliados</span>} />
        <div className="cockpit-v6-grid">
          <V6Ring caption="Qualidade e frequência" label="Relacionamento" value={v6.v1} />
          <V6Ring caption="Capacidade de mobilizar" label="Ativação" value={v6.v2} />
          <V6Ring caption="Geração qualificada" label="Oportunidades" value={v6.v3} />
          <V6Ring caption="Eficiência no funil" label="Conversão" value={v6.v4} />
          <V6Ring caption="VGV e produção" label="Valor" value={v6.v5} />
          <V6Ring caption="Regularidade de resultado" label="Consistência" value={v6.v6} />
        </div>
      </section>

      <section className="cockpit-mid-grid">
        <article className="cockpit-panel">
          <PanelHeading eyebrow="ESTOQUE" title="Absorção comercial" aside={<Boxes size={17} />} />
          <div className="cockpit-stock-hero"><strong>{inventory.absorption_pct == null ? '—' : pct(inventory.absorption_pct)}</strong><span>absorvido</span></div>
          <div className="cockpit-stock-grid">
            <div><span>Disponíveis</span><strong>{integer.format(n(inventory.available_units))}</strong></div>
            <div><span>Reservadas</span><strong>{integer.format(n(inventory.reserved_units))}</strong></div>
            <div><span>Vendidas</span><strong>{integer.format(n(inventory.sold_units))}</strong></div>
            <div><span>VGV disponível</span><strong>{compactMoney.format(n(inventory.available_value))}</strong></div>
          </div>
        </article>

        <article className="cockpit-panel cockpit-ai-panel">
          <PanelHeading eyebrow="VETRO AI" title="Leitura executiva" aside={<Sparkles size={17} />} />
          {aiBrief?.executive_summary ? <>
            <p className="cockpit-ai-summary">{aiBrief.executive_summary}</p>
            <div className="cockpit-ai-actions">
              {aiActions.slice(0, 3).map((action, index) => <div key={`${action.title}-${index}`}><Severity value={action.priority === 'critical' ? 'critical' : action.priority === 'high' ? 'warning' : 'opportunity'} /><strong>{action.title}</strong><span>{action.expected_impact}</span></div>)}
            </div>
            <small className="cockpit-ai-meta">{aiBrief.model ? `Modelo: ${aiBrief.model}` : 'VETRO Intelligence'}{aiBrief.generated_at ? ` · ${dateTime.format(new Date(aiBrief.generated_at))}` : ''}</small>
          </> : <p className="cockpit-panel-copy">A camada de IA interpreta os números calculados pela VETRO e transforma desempenho, gargalos e riscos em um resumo executivo e recomendações. Nenhum KPI é calculado pelo modelo.</p>}
          <AiBriefButton companyId={companyId} dateFrom={dateFrom} dateTo={dateTo} developmentId={selectedDevelopmentId} />
        </article>
      </section>
    </div>
  )
}
