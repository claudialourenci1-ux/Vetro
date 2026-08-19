import { redirect } from 'next/navigation'
import { requireSuperAdmin } from '@/lib/auth/server'

export default async function PlatformPage() {
  await requireSuperAdmin()
  redirect('/')
}
