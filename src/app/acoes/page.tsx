import { CheckCircle2, CircleAlert, Clock3, ListChecks, RefreshCw, Sparkles, UserRoundCheck } from 'lucide-react'
import { AppShell, PageHeading } from '../_components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { requireCompanyPermission } from '@/lib/workspace/server'
import { adoptBriefActionsAction, createManualActionAction, refreshSignalsAction, updateCommercialActionAction } from './actions'
import styles from './page.module.css'

type ActionRow = { id: string; source?: string; title: string; description?: string | null; rationale?: string | null; priority: string; expected_impact?: string | null; effort?: string | null; status: string; assigned_to?: string | null; assigned_name?: string | null; due_at?: string | null; completed_at?: string | null; created_at?: string }
type Member = { user_id: string; role: string; name?: string | null }
type Signal = { id: string; category?: string; severity?: string; title: string; message?: string; recommended_action?: string }
type Brief = { id: string; executive_summary?: string | null; recommended_actions?: unknown[]; generated_at?: string | null; model?: string | null }
type ActionCenter = { actions?: ActionRow[]; members?: Member[]; signals?: Signal[]; latest_brief?: Brief | null }
type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> }

const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const dateOnly = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })
const statusLabel: Record<string, string> = { open: 'Aberta', in_progress: 'Em andamento', done: 'Concluída', dismissed: 'Descartada' }
const priorityLabel: Record<string, string> = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica' }
function iso(date: Date) { return date.toISOString().slice(0, 10) }
function localInput(value?: string | null) { if (!value) return ''; const date = new Date(value); if (Number.isNaN(date.getTime())) return ''; const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000); return local.toISOString().slice(0, 16) }

function CommercialActionCard({ action, members, canManage, userId }: { action: ActionRow; members: Member[]; canManage: boolean; userId?: string }) {
  const canEdit = canManage || Boolean(userId && action.assigned_to === userId)
  return <article className={styles.actionCard}>
    <div className={styles.actionHeader}><div><span className={`${styles.priority} ${styles[action.priority]}`}>{priorityLabel[action.priority] ?? action.priority}</span><span className={styles.source}>{action.source === 'ai' ? 'VETRO AI' : action.source === 'rule' ? 'Sinal VETRO' : 'Manual'}</span></div><b className={`${styles.status} ${styles[action.status]}`}>{statusLabel[action.status] ?? action.status}</b></div>
    <h3>{action.title}</h3>{action.description ? <p>{action.description}</p> : null}{action.expected_impact ? <small><b>Impacto esperado:</b> {action.expected_impact}</small> : null}
    <div className={styles.actionMeta}><span>Responsável: <b>{action.assigned_name || 'não atribuído'}</b></span><span>Prazo: <b>{action.due_at ? dateOnly.format(new Date(action.due_at)) : 'sem prazo'}</b></span></div>
    {canEdit ? <form action={updateCommercialActionAction} className={styles.actionForm}><input name="action_id" type="hidden" value={action.id}/>
      <label><span>Status</span><select defaultValue={action.status} name="status"><option value="open">Aberta</option><option value="in_progress">Em andamento</option><option value="done">Concluída</option><option value="dismissed">Descartada</option></select></label>
      {canManage ? <><label><span>Responsável</span><select defaultValue={action.assigned_to ?? ''} name="assigned_to"><option value="">Não atribuído</option>{members.map((member) => <option key={member.user_id} value={member.user_id}>{member.name || 'Usuário'}</option>)}</select></label><input name="set_assignee" type="hidden" value="1"/><label><span>Prazo</span><input defaultValue={localInput(action.due_at)} name="due_at" type="datetime-local"/></label><input name="set_due" type="hidden" value="1"/></> : null}
      <button className={styles.smallButton} type="submit">Salvar</button>
    </form> : <p className={styles.readOnly}>Somente o responsável ou a gestão pode atualizar esta ação.</p>}
  </article>
}

export default async function ActionsPage() {
  const workspace = await requireCompanyPermission('intelligence_view')
  const supabase = await createClient()
  const [{ data, error }, authResult] = await Promise.all([
    (supabase as unknown as RpcClient).rpc('get_commercial_action_center', { target_company_id: workspace.company.id }),
    supabase.auth.getUser(),
  ])
  const center = (data && typeof data === 'object' && !Array.isArray(data) ? data : {}) as ActionCenter
  const actions = Array.isArray(center.actions) ? center.actions : []
  const members = Array.isArray(center.members) ? center.members : []
  const signals = Array.isArray(center.signals) ? center.signals : []
  const brief = center.latest_brief ?? null
  const canManage = workspace.membership.role === 'admin' || workspace.membership.role === 'manager'
  const userId = authResult.data.user?.id
  const today = new Date()
  const from = new Date(today.getTime()); from.setDate(from.getDate() - 29)
  const open = actions.filter((item) => item.status === 'open')
  const doing = actions.filter((item) => item.status === 'in_progress')
  const done = actions.filter((item) => item.status === 'done')

  return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}>
    <PageHeading eyebrow="Execução comercial" title="Plano de ação">{canManage ? <form action={refreshSignalsAction}><input name="from" type="hidden" value={iso(from)} /><input name="to" type="hidden" value={iso(today)} /><button className={styles.secondaryButton} type="submit"><RefreshCw size={15}/>Atualizar diagnóstico</button></form> : null}</PageHeading>
    {error ? <section className="workspace-error"><strong>Não foi possível carregar o plano de ação.</strong><span>{error.message}</span></section> : <>
      <section className={styles.summaryGrid}><article><span>Ações abertas</span><strong>{open.length}</strong><ListChecks size={17}/></article><article><span>Em andamento</span><strong>{doing.length}</strong><Clock3 size={17}/></article><article><span>Concluídas</span><strong>{done.length}</strong><CheckCircle2 size={17}/></article><article><span>Sinais ativos</span><strong>{signals.length}</strong><CircleAlert size={17}/></article></section>
      <section className={styles.topGrid}>
        <article className={styles.panel}><div className={styles.panelHeading}><div><span>VETRO INTELLIGENCE</span><h2>Pontos que pedem ação</h2></div><CircleAlert size={18}/></div><div className={styles.signalList}>{signals.length ? signals.slice(0, 6).map((signal) => <div className={styles.signal} key={signal.id}><div><b className={`${styles.badge} ${styles[signal.severity ?? 'info']}`}>{signal.severity === 'critical' ? 'Crítico' : signal.severity === 'warning' ? 'Atenção' : signal.severity === 'opportunity' ? 'Oportunidade' : 'Informação'}</b><span>{signal.category}</span></div><strong>{signal.title}</strong><p>{signal.message}</p>{signal.recommended_action ? <small><b>Próximo passo:</b> {signal.recommended_action}</small> : null}</div>) : <p className={styles.empty}>Atualize o diagnóstico para a VETRO calcular sinais a partir dos dados reais da operação.</p>}</div></article>
        <article className={`${styles.panel} ${styles.aiPanel}`}><div className={styles.panelHeading}><div><span>VETRO AI</span><h2>Leitura executiva mais recente</h2></div><Sparkles size={18}/></div>{brief ? <><p className={styles.brief}>{brief.executive_summary || 'Briefing gerado sem resumo textual.'}</p><div className={styles.briefMeta}><span>{brief.model || 'OpenAI'}</span><span>{brief.generated_at ? dateTime.format(new Date(brief.generated_at)) : 'gerado recentemente'}</span></div>{canManage ? <form action={adoptBriefActionsAction}><input name="brief_id" type="hidden" value={brief.id}/><button className={styles.primaryButton} type="submit"><ListChecks size={15}/>Transformar recomendações em plano de ação</button></form> : null}</> : <p className={styles.empty}>Gere uma leitura no Overview. A IA interpreta o cockpit calculado pela VETRO, sem recalcular ou inventar KPIs.</p>}</article>
      </section>
      {canManage ? <section className={styles.panel}><div className={styles.panelHeading}><div><span>NOVA AÇÃO</span><h2>Registrar iniciativa comercial</h2></div><UserRoundCheck size={18}/></div><form action={createManualActionAction} className={styles.createForm}><label className={styles.wide}><span>Título</span><input maxLength={160} name="title" placeholder="Ex.: Revisar propostas paradas há mais de 7 dias" required /></label><label className={styles.wide}><span>Descrição</span><input maxLength={500} name="description" placeholder="Contexto e resultado esperado" /></label><label><span>Prioridade</span><select defaultValue="medium" name="priority"><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="critical">Crítica</option></select></label><label><span>Responsável</span><select defaultValue="" name="assigned_to"><option value="">Não atribuído</option>{members.map((member) => <option key={member.user_id} value={member.user_id}>{member.name || 'Usuário'} · {member.role}</option>)}</select></label><label><span>Prazo</span><input name="due_at" type="datetime-local" /></label><button className={styles.primaryButton} type="submit">Criar ação</button></form></section> : null}
      <section className={styles.panel}><div className={styles.panelHeading}><div><span>EXECUÇÃO</span><h2>Ações comerciais</h2></div><span className={styles.counter}>{actions.length}</span></div><div className={styles.actionList}>{actions.length ? actions.map((action) => <CommercialActionCard action={action} canManage={canManage} key={action.id} members={members} userId={userId}/>) : <p className={styles.empty}>Nenhuma ação criada ainda. Sinais e recomendações podem ser transformados em execução sem sair da VETRO.</p>}</div></section>
    </>}
  </AppShell>
}
