import { Activity, ArrowUpRight, Building2, CircleGauge, Filter, Landmark, Search, Warehouse } from 'lucide-react'
import Link from 'next/link'
import { AppShell, PageHeading } from '../_components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { requireCompanyPermission } from '@/lib/workspace/server'
import styles from './developments.module.css'

type Row = Record<string, unknown>
type RpcResult = { data: unknown; error: { message: string } | null }
type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<RpcResult> }
type SearchParams = { q?: string | string[]; health?: string | string[]; result?: string | string[] }
type ProductHealth = 'traction' | 'cooling' | 'dormant'
type DevelopmentView = {
  id:string; name:string; code:string; status:string; activities:number; opportunities:number; openOpportunities:number; openPipelineValue:number; sales:number; vgv:number; partnerReach:number; inventory:number; inventoryValue:number; lastMovement:string|null; days:number|null; health:ProductHealth
}

const integer = new Intl.NumberFormat('pt-BR')
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const compactCurrency = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', notation:'compact', maximumFractionDigits:1 })
const fullCurrency = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 })
const shortDate = new Intl.DateTimeFormat('pt-BR', { dateStyle:'short' })
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value}
function amount(value:unknown){const n=Number(value??0);return Number.isFinite(n)?n:0}
function text(value:unknown,fallback=''){return value===null||value===undefined?fallback:String(value)}
function asRecord(value:unknown):Row{return value&&typeof value==='object'&&!Array.isArray(value)?value as Row:{}}
function asRows(value:unknown):Row[]{return Array.isArray(value)?value.filter((item)=>item&&typeof item==='object'&&!Array.isArray(item)) as Row[]:[]}
function daysSince(value:unknown){if(!value)return null;const d=new Date(String(value));if(Number.isNaN(d.getTime())||d.getUTCFullYear()<2000)return null;return Math.max(0,Math.floor((Date.now()-d.getTime())/86_400_000))}
function healthFor(days:number|null):ProductHealth{if(days!==null&&days<=30)return 'traction';if(days!==null&&days<=90)return 'cooling';return 'dormant'}
function healthLabel(value:ProductHealth){return value==='traction'?'Tração':value==='cooling'?'Em observação':'Sem movimento'}
function movementLabel(value:string|null,days:number|null){if(!value||days===null)return 'Sem movimento';if(days===0)return 'Hoje';if(days===1)return 'Há 1 dia';if(days<30)return `Há ${days} dias`;return shortDate.format(new Date(value))}

export default async function DevelopmentsPage({searchParams}:{searchParams?:Promise<SearchParams>}){
  const workspace=await requireCompanyPermission('developments_view')
  const supabase=await createClient()
  const rpc=supabase as unknown as RpcClient
  const requested=await searchParams??{}
  const query=(first(requested.q)??'').trim().toLocaleLowerCase('pt-BR')
  const healthFilter=first(requested.health)??''
  const resultFilter=first(requested.result)??''
  const {data,error}=await rpc.rpc('get_developments_command_center',{target_company_id:workspace.company.id})
  if(error)return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}><section className="workspace-error"><strong>Não foi possível carregar Empreendimentos.</strong><span>{error.message}</span></section></AppShell>

  const payload=asRecord(data)
  const raw=asRows(payload.developments)
  const canPipeline=workspace.membership.role==='admin'||workspace.membership.role==='manager'||workspace.permissions.includes('pipeline_view')
  const canStrategic=workspace.membership.role==='admin'||workspace.membership.role==='manager'||workspace.permissions.includes('overview_view')||workspace.permissions.includes('intelligence_view')
  const products:DevelopmentView[]=raw.map((row)=>{
    const movement=row.last_movement_at&&new Date(String(row.last_movement_at)).getUTCFullYear()>=2000?String(row.last_movement_at):null
    const days=daysSince(movement)
    return {id:text(row.id),name:text(row.name,'Empreendimento'),code:text(row.code),status:text(row.status,'active'),activities:amount(row.activities_count),opportunities:amount(row.opportunities_count),openOpportunities:amount(row.open_opportunities_count),openPipelineValue:amount(row.open_pipeline_value),sales:amount(row.sales_count),vgv:amount(row.gross_sales_value),partnerReach:amount(row.partner_reach),inventory:amount(row.inventory_units),inventoryValue:amount(row.inventory_value),lastMovement:movement,days,health:healthFor(days)}
  })
  const filtered=products.filter((product)=>{
    if(healthFilter&&product.health!==healthFilter)return false
    if(resultFilter==='open_pipeline'&&product.openOpportunities<=0)return false
    if(resultFilter==='sales'&&product.sales<=0)return false
    if(resultFilter==='inventory'&&product.inventory<=0)return false
    if(!query)return true
    return [product.name,product.code].join(' ').toLocaleLowerCase('pt-BR').includes(query)
  })

  const traction=products.filter((x)=>x.health==='traction').length
  const cooling=products.filter((x)=>x.health==='cooling').length
  const dormant=products.filter((x)=>x.health==='dormant').length
  const openProducts=products.filter((x)=>x.openOpportunities>0).length
  const salesProducts=products.filter((x)=>x.sales>0).length
  const inventoryProducts=products.filter((x)=>x.inventory>0).length
  const totalVgv=products.reduce((sum,x)=>sum+x.vgv,0)
  const totalOpenValue=products.reduce((sum,x)=>sum+x.openPipelineValue,0)
  const healthRows=[{key:'traction',label:'Tração',count:traction},{key:'cooling',label:'Em observação',count:cooling},{key:'dormant',label:'Sem movimento',count:dormant}]
  const maxHealth=Math.max(...healthRows.map((x)=>x.count),1)
  const ranking=[...products].sort((a,b)=>canStrategic?b.vgv-a.vgv:b.activities-a.activities).slice(0,7)
  const rankingMax=Math.max(...ranking.map((x)=>canStrategic?x.vgv:x.activities),1)
  const filtersActive=Boolean(query||healthFilter||resultFilter)

  return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}>
    <PageHeading eyebrow="Empreendimentos" title="Radar de performance por produto" context="Tração comercial, pipeline, rede ativada e resultado por empreendimento"/>
    <section className={styles.metrics}>
      <article><span>Portfólio</span><strong>{integer.format(products.length)}</strong><small>{integer.format(products.filter(x=>x.status==='active').length)} ativos no cadastro</small><Building2 size={17}/></article>
      <article className={styles.positiveMetric}><span>Tração 30 dias</span><strong>{integer.format(traction)}</strong><small>produtos com movimento recente</small><Activity size={17}/></article>
      {canPipeline?<article><span>Com pipeline aberto</span><strong>{integer.format(openProducts)}</strong><small>{compactCurrency.format(totalOpenValue)} em valor potencial</small><CircleGauge size={17}/></article>:<article><span>Rede movimentada</span><strong>{integer.format(products.filter(x=>x.partnerReach>0).length)}</strong><small>produtos com parceiros envolvidos</small><CircleGauge size={17}/></article>}
      {canStrategic?<article><span>Com vendas</span><strong>{integer.format(salesProducts)}</strong><small>{compactCurrency.format(totalVgv)} de VGV</small><Landmark size={17}/></article>:<article><span>Com atividades</span><strong>{integer.format(products.filter(x=>x.activities>0).length)}</strong><small>ações de campo registradas</small><Activity size={17}/></article>}
      <article className={inventoryProducts===0?styles.warningMetric:''}><span>Estoque conectado</span><strong>{integer.format(inventoryProducts)}</strong><small>{inventoryProducts?`${integer.format(products.reduce((sum,x)=>sum+x.inventory,0))} unidades mapeadas`:'ainda não importado'}</small><Warehouse size={17}/></article>
      <article><span>Sem movimento</span><strong>{integer.format(dormant)}</strong><small>sem tração registrada em 90+ dias</small><Building2 size={17}/></article>
    </section>

    <form className={styles.filters} method="get">
      <label className={styles.search}><Search size={14}/><input name="q" defaultValue={first(requested.q)??''} placeholder="Buscar empreendimento ou código..."/></label>
      <label><span>Tração</span><select name="health" defaultValue={healthFilter}><option value="">Todos</option><option value="traction">Tração</option><option value="cooling">Em observação</option><option value="dormant">Sem movimento</option></select></label>
      <label><span>Recorte</span><select name="result" defaultValue={resultFilter}><option value="">Todos</option>{canPipeline?<option value="open_pipeline">Pipeline aberto</option>:null}{canStrategic?<option value="sales">Com vendas</option>:null}<option value="inventory">Estoque conectado</option></select></label>
      <button type="submit"><Filter size={14}/>Aplicar</button>{filtersActive?<Link href="/empreendimentos">Limpar</Link>:null}
    </form>

    <section className={styles.analysisGrid}>
      <article className={styles.panel}><header><div><span>PORTFÓLIO</span><h2>Distribuição da tração comercial</h2></div><small>{products.length} produtos</small></header><div className={styles.healthBars}>{healthRows.map((row)=><div key={row.key}><div><b>{row.label}</b><span>{integer.format(row.count)}</span></div><div><i className={styles[row.key]} style={{width:`${row.count/maxHealth*100}%`}}/></div><small>{products.length?decimal.format(row.count/products.length*100):'0'}%</small></div>)}</div></article>
      <article className={styles.panel}><header><div><span>{canStrategic?'RESULTADO':'ATIVAÇÃO'}</span><h2>{canStrategic?'Produtos que concentram VGV':'Produtos com mais atividade'}</h2></div><small>top {ranking.length}</small></header><div className={styles.rankingBars}>{ranking.map((row,index)=>{const metric=canStrategic?row.vgv:row.activities;return <div key={row.id}><span>{index+1}</span><div><b>{row.name}</b><small>{row.partnerReach} parceiro{row.partnerReach===1?'':'s'} alcançado{row.partnerReach===1?'':'s'}</small></div><div className={styles.rankTrack}><i style={{width:`${metric/rankingMax*100}%`}}/></div><strong title={canStrategic?fullCurrency.format(row.vgv):undefined}>{canStrategic?compactCurrency.format(row.vgv):integer.format(row.activities)}</strong></div>})}</div></article>
    </section>

    <section className={styles.panel}><header><div><span>MAPA DE PRODUTOS</span><h2>Performance por empreendimento</h2></div><small>{filtered.length} no recorte</small></header><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Empreendimento</th><th>Tração</th><th>Parceiros</th><th>Atividades</th>{canPipeline?<><th>Oportunidades</th><th>Pipeline aberto</th></>:null}{canStrategic?<><th>Vendas</th><th>VGV</th></>:null}<th>Estoque</th><th>Último movimento</th><th/></tr></thead><tbody>{filtered.map((product)=><tr key={product.id}><td><Link href={`/empreendimentos/${product.id}`}><b>{product.name}</b><small>{product.code||'sem código'} · {product.status}</small></Link></td><td><span className={`${styles.healthBadge} ${styles[product.health]}`}>{healthLabel(product.health)}</span></td><td>{integer.format(product.partnerReach)}</td><td>{integer.format(product.activities)}</td>{canPipeline?<><td>{integer.format(product.opportunities)}</td><td><b title={fullCurrency.format(product.openPipelineValue)}>{compactCurrency.format(product.openPipelineValue)}</b><small>{product.openOpportunities} abertas</small></td></>:null}{canStrategic?<><td>{integer.format(product.sales)}</td><td><b title={fullCurrency.format(product.vgv)}>{compactCurrency.format(product.vgv)}</b></td></>:null}<td>{product.inventory?<><b>{integer.format(product.inventory)}</b><small>{compactCurrency.format(product.inventoryValue)}</small></>:<span className={styles.notConnected}>Não conectado</span>}</td><td><b>{movementLabel(product.lastMovement,product.days)}</b><small>{product.lastMovement?shortDate.format(new Date(product.lastMovement)):'nenhum registro'}</small></td><td><Link className={styles.openLink} href={`/empreendimentos/${product.id}`} aria-label={`Abrir ${product.name}`}><ArrowUpRight size={14}/></Link></td></tr>)}</tbody></table></div>{!filtered.length?<p className={styles.empty}>Nenhum empreendimento corresponde aos filtros atuais.</p>:null}</section>
  </AppShell>
}
