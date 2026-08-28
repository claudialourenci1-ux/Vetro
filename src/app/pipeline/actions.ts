'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireCompanyPermission } from '@/lib/workspace/server'

type ActionResult = { ok: boolean; error?: string }
type RpcResult = { data: unknown; error: { message: string } | null }
type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<RpcResult> }

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const datePattern = /^\d{4}-\d{2}-\d{2}$/

function messageFor(error: string) {
  if (error.includes('forbidden')) return 'Você não tem permissão para alterar esta oportunidade.'
  if (error.includes('invalid_stage')) return 'A etapa selecionada não é válida.'
  if (error.includes('use_finalize_for_closed_stage')) return 'Venda e perda precisam ser registradas pelo fechamento da oportunidade.'
  if (error.includes('opportunity_not_open_or_missing')) return 'A oportunidade não está mais aberta ou não foi encontrada.'
  if (error.includes('loss_reason_required')) return 'Informe o motivo da perda.'
  if (error.includes('gross_value_required')) return 'Informe o valor final da venda.'
  return 'Não foi possível atualizar a oportunidade. Tente novamente.'
}

function refreshPipeline() {
  revalidatePath('/pipeline')
  revalidatePath('/')
  revalidatePath('/parceiros')
  revalidatePath('/empreendimentos')
}

export async function moveOpportunityAction(input: { opportunityId: string; stageId: string }): Promise<ActionResult> {
  const workspace = await requireCompanyPermission('opportunities_manage')
  if (!uuid.test(input.opportunityId) || !uuid.test(input.stageId)) return { ok: false, error: 'Dados inválidos.' }

  const supabase = await createClient()
  const rpc = supabase as unknown as RpcClient
  const { error } = await rpc.rpc('move_pipeline_opportunity', {
    target_company_id: workspace.company.id,
    target_opportunity_id: input.opportunityId,
    target_stage_id: input.stageId,
  })

  if (error) return { ok: false, error: messageFor(error.message) }
  refreshPipeline()
  return { ok: true }
}

export async function closeWonOpportunityAction(input: { opportunityId: string; grossValue: number; soldAt: string }): Promise<ActionResult> {
  const workspace = await requireCompanyPermission('opportunities_manage')
  if (!uuid.test(input.opportunityId)) return { ok: false, error: 'Oportunidade inválida.' }
  if (!Number.isFinite(input.grossValue) || input.grossValue <= 0) return { ok: false, error: 'Informe um valor final válido.' }
  if (!datePattern.test(input.soldAt)) return { ok: false, error: 'Informe a data da venda.' }

  const supabase = await createClient()
  const rpc = supabase as unknown as RpcClient
  const { error } = await rpc.rpc('finalize_pipeline_opportunity', {
    target_company_id: workspace.company.id,
    target_opportunity_id: input.opportunityId,
    outcome: 'won',
    gross_value: input.grossValue,
    outcome_date: input.soldAt,
    loss_reason: null,
  })

  if (error) return { ok: false, error: messageFor(error.message) }
  refreshPipeline()
  return { ok: true }
}

export async function closeLostOpportunityAction(input: { opportunityId: string; reason: string; lostAt: string }): Promise<ActionResult> {
  const workspace = await requireCompanyPermission('opportunities_manage')
  const reason = input.reason.trim()
  if (!uuid.test(input.opportunityId)) return { ok: false, error: 'Oportunidade inválida.' }
  if (reason.length < 3) return { ok: false, error: 'Informe um motivo de perda mais claro.' }
  if (!datePattern.test(input.lostAt)) return { ok: false, error: 'Informe a data do encerramento.' }

  const supabase = await createClient()
  const rpc = supabase as unknown as RpcClient
  const { error } = await rpc.rpc('finalize_pipeline_opportunity', {
    target_company_id: workspace.company.id,
    target_opportunity_id: input.opportunityId,
    outcome: 'lost',
    gross_value: null,
    outcome_date: input.lostAt,
    loss_reason: reason,
  })

  if (error) return { ok: false, error: messageFor(error.message) }
  refreshPipeline()
  return { ok: true }
}
