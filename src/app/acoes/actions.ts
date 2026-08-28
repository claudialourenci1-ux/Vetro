'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireCompanyPermission } from '@/lib/workspace/server'

type RpcResult = { data: unknown; error: { message: string } | null }
type ManagementRpcClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<RpcResult> }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function rpcClient() {
  return (await createClient()) as unknown as ManagementRpcClient
}

export async function refreshSignalsAction(formData: FormData) {
  const workspace = await requireCompanyPermission('intelligence_view')
  const from = String(formData.get('from') ?? '')
  const to = String(formData.get('to') ?? '')
  const rpc = await rpcClient()
  const result = await rpc.rpc('refresh_commercial_signals', {
    target_company_id: workspace.company.id,
    ...(from ? { date_from: from } : {}),
    ...(to ? { date_to: to } : {}),
  })
  if (result.error) throw new Error(`Falha ao atualizar diagnóstico: ${result.error.message}`)
  revalidatePath('/')
  revalidatePath('/acoes')
}

export async function adoptBriefActionsAction(formData: FormData) {
  const workspace = await requireCompanyPermission('intelligence_view')
  const briefId = String(formData.get('brief_id') ?? '')
  if (!uuid.test(briefId)) throw new Error('Briefing inválido.')
  const rpc = await rpcClient()
  const result = await rpc.rpc('adopt_ai_brief_actions', {
    target_company_id: workspace.company.id,
    target_brief_id: briefId,
  })
  if (result.error) throw new Error(`Falha ao criar plano de ação: ${result.error.message}`)
  revalidatePath('/')
  revalidatePath('/acoes')
}
