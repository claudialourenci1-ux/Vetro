import { createClient } from '@/lib/supabase/server'

const nav = ['Overview','Parceiros','Pipeline','Empreendimentos','Intelligence','Equipe','Importar dados','Admin']

export default async function HomePage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  const { data: memberships } = userId
    ? await supabase
        .from('company_memberships')
        .select('company_id, role, companies(name, slug)')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
    : { data: null }

  const membership = memberships?.[0]
  const companyId = membership?.company_id
  const companyName = Array.isArray(membership?.companies)
    ? membership.companies[0]?.name
    : (membership?.companies as unknown as { name?: string } | null)?.name

  const { data: metrics } = companyId
    ? await supabase.rpc('get_overview_metrics', { target_company_id: companyId })
    : { data: null }

  const cards = [
    ['Parceiros ativos', metrics?.partners ?? 0],
    ['Corretores ativos', metrics?.active_brokers ?? 0],
    ['Oportunidades', metrics?.opportunities ?? 0],
    ['VGV vendido', new Intl.NumberFormat('pt-BR',{ style:'currency', currency:'BRL', maximumFractionDigits:0 }).format(Number(metrics?.gross_sales_value ?? 0))],
  ]

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <span>VETRO</span>
        </div>
        <nav className="nav">
          {nav.map((item, index) => <a className={index === 0 ? 'active' : ''} href="#" key={item}>{item}</a>)}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">Overview</div>
            <h1>{companyName ?? 'Sua operação comercial'}</h1>
          </div>
          <span className="subtle">{membership?.role ?? 'VETRO'}</span>
        </header>

        {!companyId ? (
          <section className="card">
            <div className="eyebrow">Configuração inicial</div>
            <h2>Workspace ainda não vinculado.</h2>
            <p className="subtle">O primeiro acesso administrativo criará a incorporadora e liberará os módulos da operação.</p>
          </section>
        ) : (
          <>
            <section className="grid">
              {cards.map(([label, value]) => (
                <article className="card" key={String(label)}>
                  <div className="metric-label">{label}</div>
                  <div className="metric">{value}</div>
                </article>
              ))}
            </section>
            <section className="card panel">
              <div className="eyebrow">Intelligence</div>
              <h2>Leitura da operação</h2>
              <p className="subtle">Pipeline, performance de parceiros, V6 e alertas estratégicos serão consolidados aqui.</p>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
