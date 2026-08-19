import { createClient } from '@/lib/supabase/server'
import { AppShell, PageHeading } from './_components/app-shell'
import { OnboardingCard } from './_components/onboarding-card'

type DataRecord = Record<string, unknown>
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const number = (value: unknown) => new Intl.NumberFormat('pt-BR').format(Number(value ?? 0))
const value = (row: DataRecord | null, keys: string[]) => keys.map((key) => row?.[key]).find((item) => item !== undefined && item !== null)

export default async function HomePage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  const { data: memberships } = userId
    ? await supabase
        .from('company_memberships')
        .select('company_id, role, companies(name, slug)')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
    : { data: null }

  const membership = memberships?.[0]
  const companyId = membership?.company_id
  const companyRelation = membership?.companies
  const companyName = companyRelation?.[0]?.name

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
    <AppShell companyName={companyName} role={membership?.role}>
      <PageHeading eyebrow="Overview" title={companyName ?? 'Sua operação comercial'} />
      {!companyId ? <OnboardingCard /> : <>
            <section className="metric-grid">
              {cards.map(([label, value]) => (
                <article className="metric-card" key={String(label)}>
                  <div className="metric-label">{label}</div>
                  <div className="metric">{value}</div>
                </article>
              ))}
            </section>
            <section className="overview-grid">
              <article className="data-panel"><div className="panel-heading"><div><p className="eyebrow">Parceiros</p><h2>Ranking de performance</h2></div><span>Top 5</span></div>
                {ranking.length ? <ol className="ranking-list">{ranking.map((partner, index) => <li key={String(value(partner, ['partner_id', 'id', 'partner_name']))}><b>{String(value(partner, ['partner_name', 'name']) ?? 'Parceiro')}</b><span>#{index + 1} · {brl.format(Number(value(partner, ['gross_sales_value', 'sales_value', 'vgv']) ?? 0))}</span></li>)}</ol> : <p className="panel-empty">Ainda não há performance de parceiros para este período.</p>}
              </article>
              <article className="data-panel"><div className="panel-heading"><div><p className="eyebrow">Pipeline</p><h2>Visão por etapa</h2></div><span>{pipeline.length} etapas</span></div>
                {pipeline.length ? <div className="pipeline-list">{pipeline.map((stage) => <div className="pipeline-row" key={String(value(stage, ['stage_id', 'id', 'stage_name']))}><span>{String(value(stage, ['stage_name', 'name']) ?? 'Etapa')}</span><b>{number(value(stage, ['opportunities', 'opportunity_count', 'count']))}</b></div>)}</div> : <p className="panel-empty">O pipeline aparecerá aqui quando as oportunidades entrarem na operação.</p>}
              </article>
            </section>
          </>}
    </AppShell>
  )
}
