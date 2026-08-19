import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeading } from '@/app/_components/app-shell'
import { PlatformShell } from '@/app/_components/platform-shell'

type DataRecord = Record<string, unknown>
const number = (value: unknown) => new Intl.NumberFormat('pt-BR').format(Number(value ?? 0))

export default async function PlatformHealthPage() {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  const { data: profile } = userId ? await supabase.from('profiles').select('global_role').eq('id', userId).maybeSingle() : { data: null }
  if (profile?.global_role !== 'super_admin') redirect('/')

  const [{ data: metrics }, { data: recentImports }, { data: recentAudit }] = await Promise.all([
    supabase.rpc('get_platform_overview_metrics'),
    supabase.from('imports').select('id,status,error_rows,created_at,companies(name)').order('created_at', { ascending: false }).limit(12),
    supabase.from('audit_events').select('id,created_at').order('created_at', { ascending: false }).limit(1),
  ])

  const m = (metrics ?? {}) as DataRecord
  const importErrors = Number(m.import_errors_last_24h ?? 0)
  const lastAuditAt = recentAudit?.[0]?.created_at

  return <PlatformShell>
    <PageHeading eyebrow="Plataforma" title="Saúde da plataforma" />
    <section className="platform-hero">
      <div><p className="eyebrow">Monitoramento operacional</p><h2>O que precisa da sua atenção agora.</h2><p className="subtle">Sinais derivados da atividade real da VETRO. Infraestrutura externa continua sendo monitorada no Supabase e Vercel.</p></div>
      <div className="platform-pulse-status"><span className="workspace-dot" /><b>{importErrors > 0 ? 'Atenção operacional' : 'Sem alertas de importação'}</b></div>
    </section>

    <section className="metric-grid platform-metrics compact">
      <article className="metric-card"><div className="metric-label">Empresas ativas</div><div className="metric">{number(m.companies_active)}</div></article>
      <article className="metric-card"><div className="metric-label">Importações 24h</div><div className="metric">{number(m.imports_last_24h)}</div></article>
      <article className="metric-card"><div className="metric-label">Erros de importação 24h</div><div className="metric">{number(m.import_errors_last_24h)}</div></article>
      <article className="metric-card"><div className="metric-label">Último evento auditado</div><div className="metric health-date">{lastAuditAt ? new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(new Date(lastAuditAt)) : '—'}</div></article>
    </section>

    <section className="data-panel platform-health-panel">
      <div className="panel-heading"><div><p className="eyebrow">Importações</p><h2>Execuções recentes</h2></div><span>{recentImports?.length ?? 0} registros</span></div>
      {recentImports?.length ? <div className="activity-list">{recentImports.map((item) => {
        const companyRelation = item.companies
        const companyName = Array.isArray(companyRelation) ? companyRelation[0]?.name : undefined
        return <div className="activity-row platform-activity-full" key={item.id}><span className={`activity-dot ${Number(item.error_rows ?? 0) > 0 ? 'warning' : ''}`} /><div><b>{companyName ?? 'Empresa'}</b><span>{item.status} · {Number(item.error_rows ?? 0)} erros</span></div><time>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.created_at))}</time></div>
      })}</div> : <p className="panel-empty">Nenhuma importação foi executada ainda.</p>}
    </section>
  </PlatformShell>
}
