import { CircleAlert, CircleUserRound, Gauge, ListChecks, Network, Settings2, ShieldCheck, UserRoundCheck, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { AppShell, PageHeading } from '../_components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { requireCompanyPermission } from '@/lib/workspace/server'
import styles from './page.module.css'

type Row=Record<string,unknown>
type RpcClient={rpc:(name:string,args:Record<string,unknown>)=>Promise<{data:unknown;error:{message:string}|null}>}
const integer=new Intl.NumberFormat('pt-BR')
const decimal=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1})
const compactCurrency=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',notation:'compact',maximumFractionDigits:1})
const shortDate=new Intl.DateTimeFormat('pt-BR',{dateStyle:'short'})
const text=(v:unknown,f='')=>v===null||v===undefined?f:String(v)
const amount=(v:unknown)=>{const n=Number(v??0);return Number.isFinite(n)?n:0}
const asRecord=(v:unknown):Row=>v&&typeof v==='object'&&!Array.isArray(v)?v as Row:{}
const asRows=(v:unknown):Row[]=>Array.isArray(v)?v.filter((x)=>x&&typeof x==='object'&&!Array.isArray(x)) as Row[]:[]
const roleLabel:Record<string,string>={admin:'Administrador',manager:'Gestor',collaborator:'Colaborador'}

export default async function TeamPage(){
  const workspace=await requireCompanyPermission('team_view')
  const supabase=await createClient(),rpc=supabase as unknown as RpcClient
  const {data,error}=await rpc.rpc('get_team_command_center',{target_company_id:workspace.company.id})
  if(error)return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}><section className="workspace-error"><strong>Não foi possível carregar Equipe.</strong><span>{error.message}</span></section></AppShell>
  const payload=asRecord(data),kpis=asRecord(payload.kpis),workload=asRecord(payload.workload),actions=asRecord(payload.actions),members=asRows(payload.members)
  const active=amount(kpis.members),openUnassigned=amount(workload.open_unassigned),unassignedValue=amount(workload.open_unassigned_value),assigned=amount(workload.assigned),opps=amount(workload.opportunities)
  const coverage=opps?assigned/opps*100:0
  const canManage=workspace.membership.role==='admin'||workspace.permissions.includes('team_manage')||workspace.permissions.includes('admin_view')
  const readiness=active<=1?'Estrutura mínima':openUnassigned>0?'Distribuição pendente':'Responsabilidade distribuída'
  return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}>
    <PageHeading eyebrow="Equipe" title="Capacidade e responsabilidade" context="Pessoas, carga operacional e trabalho comercial sem dono">{canManage?<Link className={styles.manageLink} href="/admin"><Settings2 size={14}/>Gerenciar acessos</Link>:null}</PageHeading>
    <section className={styles.metrics}>
      <article><span>Usuários ativos</span><strong>{integer.format(active)}</strong><small>{integer.format(amount(kpis.inactive))} inativos</small><UsersRound size={17}/></article>
      <article><span>Gestores</span><strong>{integer.format(amount(kpis.managers))}</strong><small>{integer.format(amount(kpis.admins))} admin</small><ShieldCheck size={17}/></article>
      <article><span>Colaboradores</span><strong>{integer.format(amount(kpis.collaborators))}</strong><small>operação de campo</small><CircleUserRound size={17}/></article>
      <article className={openUnassigned?styles.attentionMetric:''}><span>Opp. sem responsável</span><strong>{integer.format(openUnassigned)}</strong><small>{compactCurrency.format(unassignedValue)} em pipeline aberto</small><CircleAlert size={17}/></article>
      <article><span>Cobertura de atribuição</span><strong>{decimal.format(coverage)}%</strong><small>{integer.format(assigned)} de {integer.format(opps)} oportunidades</small><Gauge size={17}/></article>
      <article><span>Ações abertas</span><strong>{integer.format(amount(actions.open)+amount(actions.in_progress))}</strong><small>{integer.format(amount(actions.overdue))} atrasadas</small><ListChecks size={17}/></article>
    </section>
    <section className={`${styles.readiness} ${openUnassigned||active<=1?styles.needsAttention:styles.ready}`}><Network size={19}/><div><span>PRONTIDÃO OPERACIONAL</span><b>{readiness}</b><p>{active<=1?`A VETRO tem apenas ${integer.format(active)} usuário ativo nesta incorporadora. O sistema já suporta gestores e colaboradores, mas a operação ainda não foi distribuída.`:openUnassigned?`${integer.format(openUnassigned)} oportunidades abertas ainda estão sem responsável. Distribuir a carteira é necessário para transformar o Pipeline em gestão de execução.`:'As oportunidades abertas estão com responsabilidade definida.'}</p></div>{canManage?<Link href="/admin">Configurar equipe</Link>:null}</section>
    <section className={styles.analysisGrid}>
      <article className={styles.panel}><header><div><span>DISTRIBUIÇÃO</span><h2>Carga comercial</h2></div><small>{integer.format(opps)} oportunidades</small></header><div className={styles.assignment}><div><div><b>Atribuídas</b><span>{integer.format(assigned)}</span></div><i><em style={{width:`${coverage}%`}}/></i></div><div><div><b>Sem responsável</b><span>{integer.format(amount(workload.unassigned))}</span></div><i><em className={styles.warningBar} style={{width:`${opps?amount(workload.unassigned)/opps*100:0}%`}}/></i></div></div><div className={styles.assignmentNote}><UserRoundCheck size={16}/><span>Responsabilidade é uma dimensão operacional, não um KPI de vaidade. O objetivo é evitar pipeline parado sem dono.</span></div></article>
      <article className={styles.panel}><header><div><span>EXECUÇÃO</span><h2>Plano de ação por equipe</h2></div><Link href="/acoes">Abrir plano</Link></header><div className={styles.actionStats}><div><span>Abertas</span><b>{integer.format(amount(actions.open))}</b></div><div><span>Em andamento</span><b>{integer.format(amount(actions.in_progress))}</b></div><div><span>Sem responsável</span><b>{integer.format(amount(actions.unassigned))}</b></div><div><span>Atrasadas</span><b>{integer.format(amount(actions.overdue))}</b></div><div><span>Concluídas</span><b>{integer.format(amount(actions.done))}</b></div></div></article>
    </section>
    <section className={styles.panel}><header><div><span>PESSOAS</span><h2>Equipe da incorporadora</h2></div><small>{members.length} registros</small></header><div className={styles.memberList}>{members.map((member)=><article key={text(member.user_id)}><div className={styles.avatar}>{text(member.name,'U').slice(0,1).toUpperCase()}</div><div className={styles.identity}><b>{text(member.name,'Usuário')}</b><span>{roleLabel[text(member.role)]??text(member.role)} · {member.is_active===false?'inativo':'ativo'}</span><small>{member.last_activity_at?`Última atividade ${shortDate.format(new Date(String(member.last_activity_at)))}`:'Sem atividade registrada pelo usuário'}</small></div><div><span>Atividades</span><b>{integer.format(amount(member.activities_count))}</b></div><div><span>Opp. abertas</span><b>{integer.format(amount(member.open_opportunities))}</b><small>{compactCurrency.format(amount(member.open_pipeline_value))}</small></div><div><span>Ações</span><b>{integer.format(amount(member.open_actions))}</b><small>{integer.format(amount(member.overdue_actions))} atrasadas</small></div><div><span>Concluídas</span><b>{integer.format(amount(member.completed_actions))}</b></div></article>)}</div>{!members.length?<p className={styles.empty}>Nenhum membro ativo encontrado.</p>:null}</section>
  </AppShell>
}
