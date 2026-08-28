import { redirect } from 'next/navigation'
import { requireSuperAdmin } from '@/lib/auth/server'

export default async function IntelligenceSettingsPage() {
  await requireSuperAdmin()
  redirect('/platform/intelligence')
}