import { notFound } from 'next/navigation'
import { AppShell, PageHeading } from '../_components/app-shell'
import { ModuleEmptyState } from '../_components/module-empty-state'
import { createClient } from '@/lib/supabase/server'

const modules = {
  parceiros: { title: 'Parceiros', table: 'partners' },
  pipeline: { title: 'Pipeline', table: 'opportunities' },
  empreendimentos: { title: 'Empreendimentos', table: 'developments' },
  intelligence: { title: 'Intelligence', table: 'v6_scores' },
  equipe: { title: 'Equipe', table: 'company_memberships' },
  'importar-dados': { title: 'Importar dados', table: 'imports' },
  admin: { title: 'Administração', table: 'company_settings' },
} as const

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params
  const definition = modules[module as keyof typeof modules]
  if (!definition) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: membership } = user ? await supabase.from('company_memberships').select('company_id, role, companies(name)').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle() : { data: null }
  const company = Array.isArray(membership?.companies) ? membership.companies[0] : membership?.companies
  const query = supabase.from(definition.table).select('*', { count: 'exact', head: true })
  const result = membership?.company_id ? await query.eq('company_id', membership.company_id) : { count: null, error: null }

  return <AppShell companyName={company?.name} role={membership?.role}><PageHeading eyebrow="Módulo" title={definition.title} /><ModuleEmptyState label={definition.title} count={result.count} error={Boolean(result.error)} /></AppShell>
}
