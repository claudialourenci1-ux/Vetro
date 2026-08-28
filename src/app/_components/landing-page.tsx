import { ArrowUpRight, BarChart3, Building2, Check, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

const pillars = [
  { icon: Building2, title: 'Ecossistema comercial', copy: 'Centralize parceiros, corretores, empreendimentos e oportunidades em uma única operação.' },
  { icon: BarChart3, title: 'Inteligência aplicada', copy: 'Acompanhe indicadores reais, VGV, conversão e performance sem depender de planilhas paralelas.' },
  { icon: ShieldCheck, title: 'Governança por acesso', copy: 'Uma arquitetura de permissões para a plataforma e para cada incorporadora.' },
]

export function LandingPage() {
  return <main className="landing-page">
    <header className="landing-header">
      <Link className="brand" href="/" aria-label="VETRO"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><strong>VETRO</strong></Link>
      <nav className="landing-nav" aria-label="Navegação institucional"><a href="#inteligencia">Inteligência</a><a href="#operacao">Operação</a><a href="#governanca">Governança</a></nav>
      <Link href="/login" className="button button-primary">Entrar <ArrowUpRight size={16} /></Link>
    </header>

    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-hero-copy">
        <p className="eyebrow">Inteligência comercial para incorporadoras</p>
        <h1 id="landing-title">Clareza para decidir. Controle para crescer.</h1>
        <p>VETRO organiza a operação comercial imobiliária em uma visão precisa: parceiros, pipeline, desempenho e governança no mesmo ambiente.</p>
        <div className="landing-actions"><Link href="/login" className="button button-primary">Acessar a VETRO <ArrowUpRight size={16} /></Link><a href="#inteligencia" className="button button-ghost">Conhecer a plataforma</a></div>
      </div>
      <div className="landing-signal" aria-label="Visão da operação VETRO">
        <div className="landing-signal-top"><span>OPERAÇÃO COMERCIAL</span><b>Visão integrada</b></div>
        <div className="landing-signal-lines"><i /><i /><i /><i /><i /></div>
        <div className="landing-signal-footer"><span>Dados reais. Decisões melhores.</span><span className="signal-status"><i /> Ativo</span></div>
      </div>
    </section>

    <section className="landing-proof" aria-label="Proposta de valor"><span>Uma camada única para a operação comercial</span><span>Dados conectados</span><span>Gestão orientada à ação</span><span>Controle por empresa</span></section>

    <section className="landing-section" id="inteligencia"><div className="section-intro"><p className="eyebrow">Inteligência que serve à operação</p><h2>Menos ruído, mais leitura do que realmente move o resultado.</h2></div><div className="landing-pillar-grid">{pillars.map(({ icon: Icon, title, copy }) => <article className="landing-pillar" key={title}><Icon size={18} /><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

    <section className="landing-section landing-operation" id="operacao"><div><p className="eyebrow">Do dado à ação</p><h2>Uma cadência clara para cada frente comercial.</h2></div><ol className="landing-steps"><li><span>01</span><div><b>Conectar</b><p>Importe e organize a base da operação.</p></div></li><li><span>02</span><div><b>Acompanhar</b><p>Leia pipeline, parceiros e oportunidades em tempo real.</p></div></li><li><span>03</span><div><b>Decidir</b><p>Priorize esforços com visão compartilhada.</p></div></li></ol></section>

    <section className="landing-section landing-governance" id="governanca"><div><p className="eyebrow">Governança nativa</p><h2>O nível certo de acesso para cada responsabilidade.</h2></div><ul>{['Plataforma VETRO para super admins', 'Workspaces independentes para incorporadoras', 'Permissões operacionais por função'].map((item) => <li key={item}><Check size={15} />{item}</li>)}</ul></section>

    <footer className="landing-footer"><div><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><strong>VETRO</strong></div><p>A inteligência por trás da operação comercial.</p><Link href="/login">Entrar na plataforma <ArrowUpRight size={15} /></Link></footer>
  </main>
}
