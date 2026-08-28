'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireCompanyPermission } from '@/lib/workspace/server'

type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const optionalId = (value: FormDataEntryValue | null) => { const text = String(value ?? ''); return uuid.test(text) ? text : null }

export async function logActivityAction(formData: FormData) {
  const workspace = await requireCompanyPermission('activities_log')
  const supabase = await createClient()
  const rpc = supabase as unknown as RpcClient
  const kind = String(formData.get('activity_type') ?? '').trim()
  const happenedRaw = String(formData.get('happened_at') ?? '').trim()
  const quantity = Math.max(1, Number(formData.get('quantity') ?? 1) || 1)
  const result = await rpc.rpc('log_commercial_activity', {
    target_company_id: workspace.company.id,
    activity_kind: kind,
    activity_happened_at: happenedRaw ? new Date(happenedRaw).toISOString() : new Date().toISOString(),
    activity_quantity: quantity,
    target_partner_id: optionalId(formData.get('partner_id')),
    target_broker_id: optionalId(formData.get('broker_id')),
    target_development_id: optionalId(formData.get('development_id')),
    target_secondary_development_id: optionalId(formData.get('secondary_development_id')),
    target_portfolio_id: optionalId(formData.get('portfolio_id')),
    activity_client_name: String(formData.get('client_name') ?? '').trim() || null,
    activity_summary: String(formData.get('summary') ?? '').trim() || null,
    activity_farol: String(formData.get('farol') ?? '').trim() || null,
  })
  if (result.error) throw new Error(`Falha ao registrar atividade: ${result.error.message}`)
  revalidatePath('/atividades')
  revalidatePath('/')
  revalidatePath('/parceiros')
  revalidatePath('/empreendimentos')
  revalidatePath('/intelligence')
}
