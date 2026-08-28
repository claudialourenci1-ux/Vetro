'use server'

import { revalidatePath } from 'next/cache'
import { requireSuperAdmin } from '@/lib/auth/server'

type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function positiveInt(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value ?? fallback)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function nonNegative(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value ?? fallback)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export async function savePlatformIntelligenceSettingsAction(formData: FormData) {
  const { supabase } = await requireSuperAdmin()
  const companyId = String(formData.get('company_id') ?? '')
  if (!uuid.test(companyId)) throw new Error('Incorporadora inválida.')

  const aiEnabled = formData.get('ai_enabled') === 'on'
  const model = String(formData.get('ai_model') ?? 'gpt-5.6-terra').trim() || 'gpt-5.6-terra'
  const staleDays = positiveInt(formData.get('stale_days'), 7)
  const inactivityDays = positiveInt(formData.get('inactivity_days'), 14)
  const conversionDrop = nonNegative(formData.get('conversion_drop'), 3)
  const concentration = Math.min(100, nonNegative(formData.get('concentration_pct'), 60))

  const rpc = supabase as unknown as RpcClient
  const result = await rpc.rpc('update_commercial_intelligence_settings', {
    target_company_id: companyId,
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

  revalidatePath('/platform/intelligence')
  revalidatePath('/')
  revalidatePath('/intelligence')
  revalidatePath('/acoes')
}