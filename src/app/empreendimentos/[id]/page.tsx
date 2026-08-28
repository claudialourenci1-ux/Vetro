import { ArrowLeft, ArrowUpRight, Warehouse } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell, PageHeading } from '../../_components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { requireCompanyPermission } from '@/lib/workspace/server'
import styles from '../developments.module.css'

type Row=Record<string,unknown>
type RpcResult={data:unknown;error:{message:string}|null}
type RpcClient={rpc:(name:string,args:Record<string,unknown>)=>Promise<RpcResult>}
const integer=new Intl.NumberFormat('pt-BR')
const decimal=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1})
const compactCurrency=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',notation:'compact',maximumFractionDigits:1})
const fullCurrency=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})
const shortDate=new Intl.DateTimeFormat('pt-BR',{dateStyle:'short'})
function amount(value:unknown){const n=Number(value??0);return Number.isFinite(n)?n:0}
function text(value:unknown,fallback=''){return value===null||value===undefined?fallback:String(value)}
function asRecord(value:unknown):Row{return value&&typeof value==='object'&&!Array.isArray(value)?value as Row:{}}
function asRows(value:unknown):Row[]{return Array.isArray(value)?value.filter((item)=>item&&typeof item==='object'&&!Array.isArray(item)) as Row[]:[]}
function daysSince(value:unknown){if(!value)return null;const d=new Date(String(value));if(Number.isNaN(d.getTime())||d.getUTCFullYear()<2000)return null;return Math.max(0,Math.floor((Date.now()-d.getTime())/86_400_000))}
function healthFor(days:number|null){if(days!==null&&days<=30)return 'traction' as const;if(days!==null&&days<=90)return 'cooling' as const;return 'dormant' as const}
function movementLabel(value:unknown,days:number|null){if(!value||days===null)return 'Sem movimento';if(days===0)return 'Hoje';if(days===1)return 'Há 1 dia';if(days<30)return `Há ${days} dias`;return shortDate.format(new Date(String(value)))}
function activityLabel(value:unknown){const labels:Record<string,string>={client_service:'Atendimento',partner_visit:'Visita à imobiliária',training:'Treinamento',proposal:'Proposta',duty:'Plantão'};return labels[text(value)]??text(value,'Atividade')}
function stageClass(value:unknown){const type=text(value);return type==='won'?styles.stageWon:type==='lost'?styles.stageLost:styles.stageOpen}

export default async function DevelopmentDetailPage({params}:{params:Promise<{id:string}>}){
  const workspace=await requireCompanyPermission('developments_view')
  const {id}=await params
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))notFound()
  const supabase=await createClient()
  const rpc=supabase as unknown as RpcClient
  const {data,error}=await rpc.rpc('get_development_360',{target_company_id:workspace.company.id,target_development_id:id})
  if(error?.message.includes('development_missing'))notFound()
  if(error)return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}><section className="workspace-error"><strong>Não foi possível carregar o empreendimento.</strong><span>{error.message}</span></section></AppShell>

  const payload=asRecord(data)
  const product=asRecord(payload.development)
  if(!product.id)notFound()
  const stages=asRows(payload.pipeline_stages)
  const activities=asRows(payload.activities)
  const opportunities=asRows(payload.opportunities)
  const sales=asRows(payload.sales)
  const partners=asRows(payload.partners)
  const inventory=asRows(payload.inventory)
  const canPipeline=workspace.membership.role==='admin'||workspace.membership.role==='manager'||workspace.permissions.includes('pipeline_view')
  const canPartners=workspace.membership.role==='admin'||workspace.membership.role==='manager'||workspace.permissions.includes('partners_view')
  const canStrategic=workspace.membership.role==='admin'||workspace.membership.role==='manager'||workspace.permissions.includes('overview_view')||workspace.permissions.includes('intelligence_view')
  const movement=product.last_movement_at&&new Date(String(product.last_movement_at)).getUTCFullYear()>=2000?String(product.last_movement_at):null
  const movementDays=daysSince(movement)
  const health=healthFor(movementDays)
  const openCount=amount(product.open_opportunities_count)
  const openValue=amount(product.open_pipeline_value)
  const salesCount=amount(product.sales_count)
  const vgv=amount(product.gross_sales_value)
  const inventoryCount=amount(product.inventory_units)
  const conversion=amount(product.opportunities_count)>0?amount(product.won_opportunities_count)/amount(product.opportunities_count)*100:0
  const attentionTitle=health==='traction'?'Produto em tração comercial':health==='cooling'?'Produto perdeu cadência recente':'Produto sem movimento recente'
  let attentionCopy=health==='traction'?'Há atividade, oportunidade ou venda registrada nos últimos 30 dias.':health==='cooling'?`O último movimento ocorreu há ${movementDays??'mais de 30'} dias.`:'Não há movimentação comercial registrada nos últimos 90 dias.'
  if(canPipeline&&openCount>0)attentionCopy+=` O pipeline atual mantém ${integer.format(openCount)} oportunidade${openCount===1?'':'s'} aberta${openCount===1?'':'s'}, somando ${compactCurrency.format(openValue)}.`
  const maxStageValue=Math.max(...stages.map((row)=>amount(row.value)),1)

  return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}>
    <PageHeading eyebrow="Empreendimento 360" title={text(product.name,'Empreendimento')} context={`${text(product.code,'sem código')} · ${text(product.status,'active')}`}>
      <div className={styles.detailActions}><Link className={styles.backLink} href="/empreendimentos"><ArrowLeft size={14}/>Portfólio</Link>{canPipeline?<Link className={styles.pipelineLink} href={`/pipeline?development=${id}`}>Abrir no Pipeline <ArrowUpRight size={14}/></Link>:null}</div>
    </PageHeading>
    <section className={styles.identityStrip}><div><span>PRODUTO</span><b>{text(product.name)}</b><span>{text(product.code,'Código não informado')}</span></div><div className={styles.identityMeta}><span>{text(product.status,'active')}</span><span>{integer.format(amount(product.partner_reach))} parceiros alcançados</span><span>{integer.format(inventoryCount)} unidades mapeadas</span></div></section>
    <section className={`${styles.attentionBanner} ${styles[health]}`}><i/><div><b>{attentionTitle}</b><span>{attentionCopy}</span></div>{canPipeline&&openCount>0?<Link href={`/pipeline?development=${id}`}>Ver pipeline</Link>:null}</section>
    {inventoryCount===0?<section className={styles.stockNotice}><Warehouse size={18}/><div><b>Estoque comercial ainda não conectado</b><span>A VETRO já possui a estrutura de unidades, preço, reserva, venda e histórico de mudança. Este empreendimento só receberá leitura de estoque e absorção quando os dados reais forem importados.</span></div></section>:null}

    <section className={styles.detailMetrics}>
      <article><span>Atividades</span><strong>{integer.format(amount(product.activities_count))}</strong><small>ações comerciais registradas</small></article>
      <article><span>Rede alcançada</span><strong>{integer.format(amount(product.partner_reach))}</strong><small>parceiros com movimento</small></article>
      {canPipeline?<article><span>Oportunidades</span><strong>{integer.format(amount(product.opportunities_count))}</strong><small>{decimal.format(conversion)}% de ganho</small></article>:<article><span>Estoque</span><strong>{integer.format(inventoryCount)}</strong><small>unidades conectadas</small></article>}
      {canPipeline?<article><span>Pipeline aberto</span><strong title={fullCurrency.format(openValue)}>{compactCurrency.format(openValue)}</strong><small>{integer.format(openCount)} abertas</small></article>:<article><span>Último movimento</span><strong>{movementDays===null?'—':`${movementDays}d`}</strong><small>{movementLabel(movement,movementDays)}</small></article>}
      {canStrategic?<article><span>Vendas</span><strong>{integer.format(salesCount)}</strong><small>resultado vinculado</small></article>:<article><span>Último movimento</span><strong>{movementDays===null?'—':`${movementDays}d`}</strong><small>{movementLabel(movement,movementDays)}</small></article>}
      {canStrategic?<article><span>VGV</span><strong title={fullCurrency.format(vgv)}>{compactCurrency.format(vgv)}</strong><small>valor bruto vendido</small></article>:<article><span>Estoque conectado</span><strong>{integer.format(inventoryCount)}</strong><small>{inventoryCount?compactCurrency.format(amount(product.inventory_value)):'aguardando dados'}</small></article>}
    </section>

    <section className={styles.detailGrid}>
      {canPipeline?<article className={styles.panel}><header><div><span>FUNIL DO PRODUTO</span><h2>Pipeline por etapa</h2></div><small>{integer.format(amount(product.opportunities_count))} oportunidades</small></header><div className={styles.stageFlow}>{stages.map((stage)=><div key={text(stage.stage_id)}><div><b>{text(stage.stage_name)}</b><span>{integer.format(amount(stage.count))} oportunidade{amount(stage.count)===1?'':'s'}</span></div><div className={styles.stageTrack}><i style={{width:`${Math.max(amount(stage.value)/maxStageValue*100,amount(stage.count)?4:0)}%`}}/></div><strong title={fullCurrency.format(amount(stage.value))}>{compactCurrency.format(amount(stage.value))}</strong></div>)}</div></article>:null}
      {canPartners?<article className={styles.panel}><header><div><span>REDE COMERCIAL</span><h2>Parceiros que movimentam o produto</h2></div><small>{partners.length} parceiros</small></header>{partners.length?<div className={styles.partnerList}>{partners.slice(0,12).map((partner)=><article key={text(partner.partner_id)}><div><Link href={`/parceiros/${text(partner.partner_id)}`}><b>{text(partner.partner_name,'Parceiro')}</b></Link><span>{integer.format(amount(partner.activities_count))} ações</span></div><span>{integer.format(amount(partner.opportunities_count))} opp.</span>{canStrategic?<span>{integer.format(amount(partner.sales_count))} vendas</span>:<span>—</span>}{canStrategic?<strong title={fullCurrency.format(amount(partner.gross_sales_value))}>{compactCurrency.format(amount(partner.gross_sales_value))}</strong>:<strong> </strong>}</article>)}</div>:<p className={styles.empty}>Nenhum parceiro movimentou este produto na base atual.</p>}</article>:null}
    </section>

    <section className={styles.detailGrid}>
      <article className={styles.panel}><header><div><span>ATIVIDADE RECENTE</span><h2>Movimentos comerciais</h2></div><small>últimas {Math.min(activities.length,50)}</small></header>{activities.length?<div className={styles.timeline}>{activities.map((activity)=><article key={text(activity.id)}><time>{activity.happened_at?shortDate.format(new Date(String(activity.happened_at))):'—'}</time><div><b>{activityLabel(activity.activity_type)}{activity.partner_name?` · ${text(activity.partner_name)}`:''}</b><span>{text(activity.broker_name,text(activity.portfolio_name,'Operação comercial'))}</span>{activity.visit_summary?<small>{text(activity.visit_summary)}</small>:activity.client_name?<small>Cliente: {text(activity.client_name)}</small>:null}</div></article>)}</div>:<p className={styles.empty}>Nenhuma atividade registrada para este produto.</p>}</article>
      {canPipeline?<article className={styles.panel}><header><div><span>OPORTUNIDADES</span><h2>Negócios vinculados</h2></div><Link className={styles.openLink} href={`/pipeline?development=${id}`} aria-label="Abrir pipeline do empreendimento"><ArrowUpRight size={14}/></Link></header>{opportunities.length?<div className={styles.opportunityList}>{opportunities.slice(0,12).map((opportunity)=><article key={text(opportunity.id)}><div><span className={`${styles.stageBadge} ${stageClass(opportunity.stage_type)}`}>{text(opportunity.stage_name,'Etapa')}</span><b>{text(opportunity.unit_code,'Sem unidade')} · {text(opportunity.partner_name,'Sem parceiro')}</b><small>{text(opportunity.contact_name,opportunity.lost_reason?`Perda: ${text(opportunity.lost_reason)}`:'Cliente não informado')}</small></div><strong title={fullCurrency.format(amount(opportunity.value))}>{compactCurrency.format(amount(opportunity.value))}</strong></article>)}</div>:<p className={styles.empty}>Nenhuma oportunidade vinculada.</p>}</article>:null}
    </section>

    <section className={styles.detailGrid}>
      {canStrategic?<article className={styles.panel}><header><div><span>RESULTADO</span><h2>Vendas do empreendimento</h2></div><small>{sales.length} registros</small></header>{sales.length?<div className={styles.salesList}>{sales.slice(0,12).map((sale)=><article key={text(sale.id)}><div><b>{text(sale.partner_name,'Parceiro não informado')}</b><span>{sale.sold_at?shortDate.format(new Date(String(sale.sold_at))):'Sem data'}{sale.broker_name?` · ${text(sale.broker_name)}`:''}</span></div><strong title={fullCurrency.format(amount(sale.gross_value))}>{compactCurrency.format(amount(sale.gross_value))}</strong></article>)}</div>:<p className={styles.empty}>Nenhuma venda vinculada a este empreendimento.</p>}</article>:null}
      <article className={styles.panel}><header><div><span>ESTOQUE</span><h2>Unidades e disponibilidade</h2></div><small>{inventory.length?`${inventory.length} unidades`:'não conectado'}</small></header>{inventory.length?<><div className={styles.inventorySummary}><div><span>Total</span><b>{integer.format(inventory.length)}</b></div><div><span>Disponíveis</span><b>{integer.format(amount(product.inventory_available))}</b></div><div><span>Reservadas</span><b>{integer.format(amount(product.inventory_reserved))}</b></div><div><span>Vendidas</span><b>{integer.format(amount(product.inventory_sold))}</b></div></div><div className={styles.inventoryList}>{inventory.slice(0,16).map((unit)=><article key={text(unit.id)}><div><b>Unidade {text(unit.unit_code)}</b><span>{[text(unit.tower),text(unit.floor),text(unit.typology)].filter(Boolean).join(' · ')||'sem tipologia'}</span><small>{text(unit.status,'status não informado')}</small></div><strong title={fullCurrency.format(amount(unit.current_price??unit.list_price))}>{compactCurrency.format(amount(unit.current_price??unit.list_price))}</strong></article>)}</div></>:<p className={styles.empty}>Nenhuma unidade real foi importada. A VETRO não cria estoque fictício para preencher esta tela.</p>}</article>
    </section>
  </AppShell>
}
