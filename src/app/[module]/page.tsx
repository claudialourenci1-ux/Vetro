import { notFound } from 'next/navigation'
import { AppShell, PageHeading } from '../_components/app-shell'
import { WorkspaceModuleContent } from '../_components/workspace-modules'
import { requireCompanyPermission, type CompanyPermission } from '@/lib/workspace/server'

const modules = {
  parceiros: {
    title: 'Parceiros',
    eyebrow: 'Rede comercial',
    permission: 'partners_view',
  },
  atividades: {
    title: 'Atividades',
    eyebrow: 'Operação de campo',
    permission: 'activities_log',
  },
  pipeline: {
    title: 'Pipeline',
    eyebrow: 'Negócios',
    permission: 'pipeline_view',
  },
  empreendimentos: {
    title: 'Empreendimentos',
    eyebrow: 'Produtos',
    permission: 'developments_view',
  },
  intelligence: {
    title: 'Intelligence',
    eyebrow: 'Método VETRO',
    permission: 'intelligence_view',
  },
  equipe: {
    title: 'Equipe',
    eyebrow: 'Carteiras e metas',
    permission: 'team_view',
  },
  'importar-dados': {
    title: 'Importar dados',
    eyebrow: 'Governança',
    permission: 'imports_execute',
  },
  admin: {
    title: 'Administração',
    eyebrow: 'Configurações',
    permission: 'admin_view',
  },
} as const satisfies Record<string, { title: string; eyebrow: string; permission: CompanyPermission }>

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params
  const definition = modules[module as keyof typeof modules]
  if (!definition) notFound()

  const workspace = await requireCompanyPermission(definition.permission)

  return (
    <AppShell
      companyName={workspace.company.name}
      role={workspace.membership.role}
      permissions={workspace.permissions}
    >
      <PageHeading eyebrow={definition.eyebrow} title={definition.title} />
      <WorkspaceModuleContent
        module={module as keyof typeof modules}
        companyId={workspace.company.id}
      />
    </AppShell>
  )
}
