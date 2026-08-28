'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireCompanyPermission } from '@/lib/workspace/server'

type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> }

function positiveInt(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value ?? fallback)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}
function nonNegative(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value ?? fallback)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export async function saveIntelligenceSettingsAction(formData: FormData) {
  const workspace = await requireCompanyPermission('settings_manage')
  const aiEnabled = formData.get('ai_enabled') === 'on'
  const model = String(formData.get('ai_model') ?? 'gpt-5.6-terra').trim() || 'gpt-5.6-terra'
  const staleDays = positiveInt(formData.get('stale_days'), 7)
  const inactivityDays = positiveInt(formData.get('inactivity_days'), 14)
  const conversionDrop = nonNegative(formData.get('conversion_drop'), 3)
  const concentration = Math.min(100, nonNegative(formData.get('concentration_pct'), 60))

  const supabase = await createClient()
  const rpc = supabase as unknown as RpcClient
  const result = await rpc.rpc('update_commercial_intelligence_settings', {
    target_company_id: workspace.company.id,
    enabled: aiEnabled,
    model_name: model,
    daily_enabled: false,
    weekly_enabled: false,
    briefing_hour: 8,
    stale_days: staleDays,
    inactivity_days: inactivityDays,
    conversion_drop: conversionDrop,
    concentration_pct: concentration,
  })
  if (result.error) throw new Error(`Não foi possível salvar a configuração: ${result.error.message}`)
  revalidatePath('/')
  revalidatePath('/acoes')
  revalidatePath('/admin/intelligence')
}
