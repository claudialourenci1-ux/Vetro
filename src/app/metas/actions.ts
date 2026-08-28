'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireCompanyPermission } from '@/lib/workspace/server'

type RpcClient={rpc:(name:string,args:Record<string,unknown>)=>Promise<{data:unknown;error:{message:string}|null}>}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const datePattern=/^\d{4}-\d{2}-\d{2}$/

export async function saveCommercialGoalAction(formData:FormData){
  const workspace=await requireCompanyPermission('overview_view')
  if(!['admin','manager'].includes(workspace.membership.role))throw new Error('Somente admin ou gestor pode alterar metas.')
  const indicator=String(formData.get('indicator_key')??'').trim()
  const periodStart=String(formData.get('period_start')??''),periodEnd=String(formData.get('period_end')??'')
  const targetValue=Number(formData.get('target_value')??'')
  const scope=String(formData.get('scope')??'company')
  if(!indicator)throw new Error('Selecione um indicador.')
  if(!datePattern.test(periodStart)||!datePattern.test(periodEnd)||periodEnd<periodStart)throw new Error('Período inválido.')
  if(!Number.isFinite(targetValue)||targetValue<0)throw new Error('Informe uma meta válida.')
  let developmentId:string|null=null,portfolioId:string|null=null
  if(scope.startsWith('development:')){const id=scope.slice(12);if(!uuid.test(id))throw new Error('Empreendimento inválido.');developmentId=id}
  else if(scope.startsWith('portfolio:')){const id=scope.slice(10);if(!uuid.test(id))throw new Error('Carteira inválida.');portfolioId=id}
  else if(scope!=='company')throw new Error('Escopo inválido.')
  const supabase=await createClient(),rpc=supabase as unknown as RpcClient
  const {error}=await rpc.rpc('upsert_commercial_goal',{target_company_id:workspace.company.id,goal_indicator_key:indicator,goal_start:periodStart,goal_end:periodEnd,goal_value:targetValue,target_development_id:developmentId,target_portfolio_id:portfolioId})
  if(error)throw new Error(`Não foi possível salvar a meta: ${error.message}`)
  revalidatePath('/');revalidatePath('/metas');revalidatePath('/intelligence')
}

export async function saveVgvGoalAction(formData:FormData){
  if(!formData.has('indicator_key'))formData.set('indicator_key','vgv')
  return saveCommercialGoalAction(formData)
}
