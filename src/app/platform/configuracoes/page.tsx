import { requireSuperAdmin } from '@/lib/auth/server'
import { PageHeading } from '@/app/_components/app-shell'
import { PlatformShell } from '@/app/_components/platform-shell'

export default async function PlatformSettingsPage() {
  await requireSuperAdmin()

  return <PlatformShell>
    <PageHeading eyebrow="Plataforma" title="Configurações" />
    <section className="overview-grid platform-overview-grid">
      <article className="data-panel">
        <div className="panel-heading"><div><p className="eyebrow">Ambiente</p><h2>Infraestrutura oficial</h2></div><span>Produção</span></div>
        <div className="settings-list">
          <div><span>Supabase</span><b>Vetro App</b></div>
          <div><span>Project ref</span><b>lcyrkagglsyjrmntwfek</b></div>
          <div><span>Autenticação</span><b>Convite controlado</b></div>
          <div><span>Cadastro público</span><b>Não permitido</b></div>
        </div>
      </article>
      <article className="data-panel">
        <div className="panel-heading"><div><p className="eyebrow">Governança</p><h2>Hierarquia de acesso</h2></div><span>Protegido</span></div>
        <div className="settings-list">
          <div><span>Nível 1</span><b>Super Admin VETRO</b></div>
          <div><span>Nível 2</span><b>Admin da incorporadora</b></div>
          <div><span>Nível 3</span><b>Gestor</b></div>
          <div><span>Nível 4</span><b>Colaborador operacional</b></div>
        </div>
      </article>
    </section>
  </PlatformShell>
}
