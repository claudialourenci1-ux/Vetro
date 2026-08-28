'use server'

import { requireSuperAdmin } from '@/lib/auth/server'

export async function saveIntelligenceSettingsAction() {
  await requireSuperAdmin()
  throw new Error('Configuração de inteligência disponível somente no VETRO Control Center.')
}