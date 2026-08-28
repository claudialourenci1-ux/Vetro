import { Activity, BarChart3, Building2, CalendarDays, Flame, Network, Plus, Search, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { AppShell, PageHeading } from '../_components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { requireCompanyPermission } from '@/lib/workspace/server'
import { logActivityAction } from './actions'
import styles from './page.module.css'

type Row = Record<string, unknown>
type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> }
type SearchParams = { from?: string|string[]; to?: string|string[]; type?: string|string[]; portfolio?: string|string[]; q?: string|string[] }
const integer = new Intl.NumberFormat('pt-BR')
const decimal = new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1})
const shortDate = new Intl.DateTimeFormat('pt-BR',{dateStyle:'short'})
const dateTime = new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'})
const first = (v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v
const text=(v:unknown,f='')=>v===null||v===undefined?f:String(v)
const amount=(v:unknown)=>{const n=Number(v??0);return Number.isFinite(n)?n:0}
const asRecord=(v:unknown):Row=>v&&typeof v==='object'&&!Array.isArray(v)?v as Row:{}
const asRows=(v:unknown):Row[]=>Array.isArray(v)?v.filter((x)=>x&&typeof x==='object'&&!Array.isArray(x)) as Row[]:[]
const iso=(d:Date)=>d.toISOString().slice(0,10)
const validDate=(v:string|undefined)=>Boolean(v&&/^\d{4}-\d{2}-\d{2}$/.test(v))
const activityLabels:Record<string,string>={client_service:'Atendimento ao cliente',partner_visit:'Visita à imobiliária',training:'Treinamento',proposal:'Proposta',duty:'Plantão'}
const activityLabel=(v:unknown)=>activityLabels[text(v)]??text(v,'Atividade')

export default async function ActivitiesPage({searchParams}:{searchParams?:Promise<SearchParams>}){
  const workspace=await requireCompanyPermission('activities_log')
  const supabase=await createClient()
  const requested=await searchParams??{}
  const today=new Date(); const defaultFrom=new Date(today); defaultFrom.setDate(defaultFrom.getDate()-29)
  const fromRaw=first(requested.from),toRaw=first(requested.to)
  const dateFrom=validDate(fromRaw)?fromRaw!:iso(defaultFrom),dateTo=validDate(toRaw)?toRaw!:iso(today)
  const safeFrom=dateFrom<=dateTo?dateFrom:dateTo,safeTo=dateFrom<=dateTo?dateTo:dateFrom
  const rpc=supabase as unknown as RpcClient
  const [centerResult,brokersResult]=await Promise.all([
    rpc.rpc('get_activities_command_center',{target_company_id:workspace.company.id,date_from:safeFrom,date_to:safeTo}),
    supabase.from('brokers').select('id,full_name').eq('company_id',workspace.company.id).eq('status','active').order('full_name').limit(500),
  ])
  if(centerResult.error)return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}><section className="workspace-error"><strong>Não foi possível carregar Atividades.</strong><span>{centerResult.error.message}</span></section></AppShell>
  const payload=asRecord(centerResult.data),kpis=asRecord(payload.kpis),filters=asRecord(payload.filters)
  const daily=asRows(payload.daily_series),types=asRows(payload.type_breakdown),farols=asRows(payload.farol_breakdown),portfolios=asRows(payload.portfolio_breakdown),topPartners=asRows(payload.top_partners),recent=asRows(payload.recent)
  const partnerOptions=asRows(filters.partners),developmentOptions=asRows(filters.developments),portfolioOptions=asRows(filters.portfolios),brokerOptions=(brokersResult.data??[]) as Row[]
  const typeFilter=first(requested.type)??'',portfolioFilter=first(requested.portfolio)??'',query=(first(requested.q)??'').trim().toLocaleLowerCase('pt-BR')
  const visible=recent.filter((row)=>{if(typeFilter&&text(row.activity_type)!==typeFilter)return false;if(portfolioFilter&&text(row.portfolio_id)!==portfolioFilter)return false;if(!query)return true;return [row.partner_name,row.broker_name,row.development_name,row.client_name,row.visit_summary,row.portfolio_name].map((v)=>text(v).toLocaleLowerCase('pt-BR')).join(' ').includes(query)})
  const maxDaily=Math.max(...daily.map((r)=>amount(r.quantity)),1),maxType=Math.max(...types.map((r)=>amount(r.quantity)),1)
  const canLog=workspace.membership.role==='admin'||workspace.membership.role==='manager'||workspace.permissions.includes('activities_log')
  const localNow=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)
  return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}>
    <PageHeading eyebrow="Atividades" title="Pulso da operação" context={`${shortDate.format(new Date(`${safeFrom}T12:00:00`))} a ${shortDate.format(new Date(`${safeTo}T12:00:00`))} · rotina comercial registrada`}>
      <Link className={styles.pipelineLink} href="/pipeline">Abrir pipeline <Network size={14}/></Link>
    </PageHeading>
    <section className={styles.metrics}>
      <article><span>Ações</span><strong>{integer.format(amount(kpis.quantity))}</strong><small>{integer.format(amount(kpis.records))} registros</small><Activity size={17}/></article>
      <article><span>Parceiros alcançados</span><strong>{integer.format(amount(kpis.partners))}</strong><small>rede movimentada no período</small><UsersRound size={17}/></article>
      <article><span>Corretores</span><strong>{integer.format(amount(kpis.brokers))}</strong><small>corretores relacionados</small><UsersRound size={17}/></article>
      <article><span>Empreendimentos</span><strong>{integer.format(amount(kpis.developments))}</strong><small>produtos movimentados</small><Building2 size={17}/></article>
      <article><span>Com farol</span><strong>{integer.format(amount(kpis.with_farol))}</strong><small>sinais qualitativos registrados</small><Flame size={17}/></article>
      <article><span>Com resumo</span><strong>{integer.format(amount(kpis.with_summary))}</strong><small>memória comercial enriquecida</small><BarChart3 size={17}/></article>
    </section>
    <form className={styles.filters} method="get">
      <label><span>De</span><input name="from" type="date" defaultValue={safeFrom}/></label><label><span>Até</span><input name="to" type="date" defaultValue={safeTo}/></label>
      <label><span>Tipo</span><select name="type" defaultValue={typeFilter}><option value="">Todos</option>{Object.entries(activityLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
      <label><span>Carteira</span><select name="portfolio" defaultValue={portfolioFilter}><option value="">Todas</option>{portfolioOptions.map((p)=><option key={text(p.id)} value={text(p.id)}>{text(p.name)}</option>)}</select></label>
      <label className={styles.search}><Search size={13}/><input name="q" defaultValue={first(requested.q)??''} placeholder="Parceiro, corretor, cliente..."/></label><button type="submit">Aplicar</button>
    </form>
    <section className={styles.analysisGrid}>
      <article className={styles.panel}><header><div><span>CADÊNCIA</span><h2>Atividade ao longo do período</h2></div><small>{daily.length} dias</small></header><div className={styles.dailyChart}>{daily.map((row)=><div key={text(row.activity_day)} title={`${text(row.activity_day)} · ${integer.format(amount(row.quantity))} ações`}><i style={{height:`${Math.max(4,amount(row.quantity)/maxDaily*100)}%`}}/><small>{new Date(`${text(row.activity_day)}T12:00:00`).getDate()}</small></div>)}</div></article>
      <article className={styles.panel}><header><div><span>COMPOSIÇÃO</span><h2>Onde a rotina comercial acontece</h2></div><small>{types.length} tipos</small></header><div className={styles.typeBars}>{types.map((row)=><div key={text(row.activity_type)}><div><b>{activityLabel(row.activity_type)}</b><span>{integer.format(amount(row.quantity))}</span></div><div><i style={{width:`${amount(row.quantity)/maxType*100}%`}}/></div><small>{integer.format(amount(row.records))} registros</small></div>)}</div></article>
    </section>
    <section className={styles.analysisGrid}>
      <article className={styles.panel}><header><div><span>REDE</span><h2>Parceiros mais movimentados</h2></div><Link href="/parceiros">Radar de parceiros</Link></header><div className={styles.rankList}>{topPartners.length?topPartners.map((row,index)=><div key={text(row.partner_id)}><span>{String(index+1).padStart(2,'0')}</span><div><Link href={`/parceiros/${text(row.partner_id)}`}><b>{text(row.partner_name,'Parceiro')}</b></Link><small>{row.last_activity_at?dateTime.format(new Date(String(row.last_activity_at))):'sem data'}</small></div><strong>{integer.format(amount(row.quantity))}</strong></div>):<p className={styles.empty}>Sem atividade no período.</p>}</div></article>
      <article className={styles.panel}><header><div><span>CARTEIRAS E FARÓIS</span><h2>Cobertura comercial</h2></div><small>{portfolios.length} carteiras</small></header><div className={styles.portfolioList}>{portfolios.map((row)=><div key={text(row.portfolio_id,'none')}><div><b>{text(row.portfolio_name,'Sem carteira')}</b><small>{text(row.manager_name,'sem responsável')}</small></div><span>{integer.format(amount(row.partners))} parceiros</span><strong>{integer.format(amount(row.quantity))} ações</strong></div>)}</div><div className={styles.farols}>{farols.map((row)=><span key={text(row.farol)}><b>{text(row.farol)}</b>{integer.format(amount(row.records))}</span>)}</div></article>
    </section>
    {canLog?<section className={styles.panel}><header><div><span>NOVO REGISTRO</span><h2>Adicionar atividade comercial</h2></div><Plus size={16}/></header><form action={logActivityAction} className={styles.logForm}>
      <label><span>Tipo</span><select name="activity_type" required><option value="client_service">Atendimento ao cliente</option><option value="partner_visit">Visita à imobiliária</option><option value="training">Treinamento</option><option value="proposal">Proposta</option><option value="duty">Plantão</option></select></label><label><span>Data e hora</span><input name="happened_at" type="datetime-local" defaultValue={localNow}/></label><label><span>Quantidade</span><input name="quantity" type="number" min="1" max="1000" defaultValue="1"/></label>
      <label><span>Parceiro</span><select name="partner_id"><option value="">Não vincular</option>{partnerOptions.map((p)=><option key={text(p.id)} value={text(p.id)}>{text(p.name)}</option>)}</select></label><label><span>Corretor</span><select name="broker_id"><option value="">Não vincular</option>{brokerOptions.map((b)=><option key={text(b.id)} value={text(b.id)}>{text(b.full_name)}</option>)}</select></label><label><span>Carteira</span><select name="portfolio_id"><option value="">Não vincular</option>{portfolioOptions.map((p)=><option key={text(p.id)} value={text(p.id)}>{text(p.name)}</option>)}</select></label>
      <label><span>Empreendimento</span><select name="development_id"><option value="">Não vincular</option>{developmentOptions.map((d)=><option key={text(d.id)} value={text(d.id)}>{text(d.name)}</option>)}</select></label><label><span>2º empreendimento</span><select name="secondary_development_id"><option value="">Nenhum</option>{developmentOptions.map((d)=><option key={text(d.id)} value={text(d.id)}>{text(d.name)}</option>)}</select></label><label><span>Farol</span><input name="farol" maxLength={40} placeholder="Ex.: Quente, Atenção..."/></label>
      <label className={styles.wide}><span>Cliente / contexto</span><input name="client_name" maxLength={160} placeholder="Cliente ou contexto da interação"/></label><label className={styles.wide}><span>Resumo</span><textarea name="summary" maxLength={1200} rows={3} placeholder="O que aconteceu, próximo passo e qualquer contexto relevante"/></label><button className={styles.primaryButton} type="submit"><Plus size={14}/>Registrar atividade</button>
    </form></section>:null}
    <section className={styles.panel}><header><div><span>LINHA DO TEMPO</span><h2>Movimentos recentes</h2></div><small>{visible.length} no recorte da lista</small></header><div className={styles.timeline}>{visible.length?visible.map((row)=><article key={text(row.id)}><time>{row.happened_at?dateTime.format(new Date(String(row.happened_at))):'—'}</time><div><b>{activityLabel(row.activity_type)}{row.partner_name?` · ${text(row.partner_name)}`:''}</b><span>{[text(row.broker_name),text(row.development_name),text(row.portfolio_name)].filter(Boolean).join(' · ')||'Operação comercial'}</span>{row.visit_summary?<small>{text(row.visit_summary)}</small>:row.client_name?<small>Cliente: {text(row.client_name)}</small>:null}</div><aside>{row.farol?<em>{text(row.farol)}</em>:null}<strong>{integer.format(amount(row.quantity))}</strong></aside></article>):<p className={styles.empty}>Nenhuma atividade encontrada nesse recorte.</p>}</div></section>
  </AppShell>
}
