import { requireSuperAdmin } from '@/lib/auth/server'
import { PageHeading } from '@/app/_components/app-shell'
import { PlatformShell } from '@/app/_components/platform-shell'

type EventRow = {
  id: number
  company_name: string | null
  event_type: string | null
  entity_type: string | null
  created_at: string | null
  payload: Record<string, unknown> | null
}

const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Sem data'

export default async function PlatformActivityPage() {
  const { supabase } = await requireSuperAdmin()

  const { data } = await supabase.rpc('get_platform_recent_activity', { limit_rows: 50 })
  const events = (data ?? []) as EventRow[]

  return <PlatformShell>
    <PageHeading eyebrow="Plataforma" title="Atividade" />
    <section className="platform-section-intro"><div><h2>Histórico global</h2><p className="subtle">Movimentos relevantes registrados em todos os workspaces da VETRO.</p></div><div className="platform-count-badge">{events.length} eventos recentes</div></section>
    <section className="data-panel platform-activity-panel">
      {events.length ? <div className="activity-list">{events.map((event) => <div className="activity-row platform-activity-full" key={event.id}>
        <span className="activity-dot" />
        <div><b>{event.company_name || 'VETRO Platform'}</b><span>{event.event_type || 'atividade'}{event.entity_type ? ` · ${event.entity_type}` : ''}</span></div>
        <time>{dateTime(event.created_at)}</time>
      </div>)}</div> : <p className="panel-empty">Ainda não existem eventos de auditoria para exibir.</p>}
    </section>
  </PlatformShell>
}
