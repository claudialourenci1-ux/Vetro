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

export async function createManualActionAction(formData: FormData) {
  const workspace = await requireCompanyPermission('intelligence_view')
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const priority = String(formData.get('priority') ?? 'medium')
  const assigned = String(formData.get('assigned_to') ?? '')
  const due = String(formData.get('due_at') ?? '')
  if (!title) throw new Error('Informe o título da ação.')
  const rpc = await rpcClient()
  const result = await rpc.rpc('create_manual_commercial_action', {
    target_company_id: workspace.company.id,
    action_title: title,
    action_description: description || null,
    action_priority: priority,
    action_assigned_to: uuid.test(assigned) ? assigned : null,
    action_due_at: due ? new Date(due).toISOString() : null,
  })
  if (result.error) throw new Error(`Falha ao criar ação: ${result.error.message}`)
  revalidatePath('/')
  revalidatePath('/acoes')
}

export async function updateCommercialActionAction(formData: FormData) {
  const workspace = await requireCompanyPermission('intelligence_view')
  const actionId = String(formData.get('action_id') ?? '')
  const status = String(formData.get('status') ?? '')
  const assignedRaw = String(formData.get('assigned_to') ?? '')
  const dueRaw = String(formData.get('due_at') ?? '')
  const setAssignee = formData.has('set_assignee')
  const setDue = formData.has('set_due')
  if (!uuid.test(actionId)) throw new Error('Ação inválida.')
  const rpc = await rpcClient()
  const result = await rpc.rpc('update_commercial_action', {
    target_company_id: workspace.company.id,
    target_action_id: actionId,
    new_status: status || null,
    new_assigned_to: setAssignee && uuid.test(assignedRaw) ? assignedRaw : null,
    set_assignee: setAssignee,
    new_due_at: setDue && dueRaw ? new Date(dueRaw).toISOString() : null,
    set_due_at: setDue,
  })
  if (result.error) throw new Error(`Falha ao atualizar ação: ${result.error.message}`)
  revalidatePath('/')
  revalidatePath('/acoes')
}
