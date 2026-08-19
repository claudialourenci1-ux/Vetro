'use client'

import Link from 'next/link'
import { useEffect } from 'react'

const whatsappMessage = encodeURIComponent(
  'Olá! Conheci a VETRO pelo site e quero entender como a plataforma pode ser implementada na operação comercial da minha incorporadora.'
)
const whatsappUrl = `https://wa.me/55944511771?text=${whatsappMessage}`

const modules = [
  ['Parceiros','Saiba quem está ativo, quem gera resultado, quem cresce e quem precisa de atenção.'],
  ['Pipeline','Acompanhe oportunidades, propostas, negociações e vendas em uma visão única.'],
  ['Empreendimentos','Compare performance, VGV, velocidade, conversão e comportamento comercial.'],
  ['Equipe','Entenda gestores, carteiras, atividades, produtividade e resultado.'],
  ['Intelligence','Cruze histórico, comportamento e sinais para apoiar decisões comerciais.'],
  ['V6 Method','Transforme relacionamento e resultado em uma leitura proprietária sobre parceiros.'],
] as const

const pillars = [
  ['V1','Relacionamento','Qualidade, frequência e continuidade da relação com cada parceiro.'],
  ['V2','Ativação','O quanto a imobiliária está mobilizada para trabalhar seus empreendimentos.'],
  ['V3','Oportunidades','Capacidade de gerar atendimentos, propostas e movimento real no pipeline.'],
  ['V4','Conversão','Eficiência para transformar oportunidade comercial em venda.'],
  ['V5','Valor','Impacto financeiro, VGV e relevância econômica produzida pelo parceiro.'],
  ['V6','Consistência','Capacidade de sustentar resultado e atividade ao longo do tempo.'],
] as const

const signals = [
  ['Parceiro estratégico perdendo atividade','Uma imobiliária relevante está há semanas sem interação comercial.'],
  ['Alta ativação, baixa conversão','Existe relacionamento e proposta, mas algo está impedindo o fechamento.'],
  ['Parceiro emergente','Uma imobiliária ainda pequena começa a acelerar oportunidades e recorrência.'],
  ['Dependência comercial','Grande parte do resultado está concentrada em poucos corretores ou produtos.'],
] as const

function Brand({ large = false }: { large?: boolean }) {
  return (
    <span className={`landing-brand-lockup ${large ? 'large' : ''}`}>
      <span className="landing-symbol" aria-hidden="true"><i/><i/><i/></span>
      <span className="landing-word">VETRO</span>
    </span>
  )
}

function Cta({ children }: { children: React.ReactNode }) {
  return (
    <a className="landing-cta" href={whatsappUrl} target="_blank" rel="noreferrer">
      <span>{children}</span><b aria-hidden="true">↗</b>
    </a>
  )
}

function ProductMock({ large = false }: { large?: boolean }) {
  const cards = [
    ['VGV DO MÊS','R$ 48,6M','+12,4%'],
    ['PARCEIROS ESTRATÉGICOS','128','+8 novos'],
    ['OPORTUNIDADES ATIVAS','312','+15,7%'],
    ['CONVERSÃO','21,6%','+3,2 p.p.'],
    ['VETRO SCORE MÉDIO','78','+5 pts'],
  ]

  return (
    <div className={`landing-dashboard ${large ? 'large' : ''}`}>
      <aside className="landing-dashboard-sidebar">
        <span className="landing-symbol mini"><i/><i/><i/></span>
        {Array.from({ length: 5 }).map((_, i) => <span className="landing-menu-stub" key={i}/>) }
      </aside>
      <div className="landing-dashboard-main">
        <div className="landing-dashboard-top">
          <div><strong>Bom dia, time Vetro!</strong><small>Desempenho comercial atualizado</small></div>
          <button>Filtros</button>
        </div>
        <div className="landing-dashboard-cards">
          {cards.map(([label,value,delta]) => (
            <article key={label}><small>{label}</small><strong>{value}</strong><em>{delta}</em></article>
          ))}
        </div>
        <div className="landing-dashboard-lower">
          <section className="landing-chart-card">
            <small>VGV ACUMULADO</small><strong>R$ 212,7M</strong>
            <svg viewBox="0 0 500 150" preserveAspectRatio="none" aria-hidden="true">
              <defs><linearGradient id={large ? 'landingGradientLarge' : 'landingGradient'}><stop stopColor="#6d28d9"/><stop offset="1" stopColor="#b69cff"/></linearGradient></defs>
              <path d="M0 128 C45 121 80 109 112 104 S166 95 196 89 S241 77 271 72 S330 62 360 51 S422 45 500 19" fill="none" stroke={`url(#${large ? 'landingGradientLarge' : 'landingGradient'})`} strokeWidth="5"/>
            </svg>
          </section>
          <section className="landing-ranking-card">
            <small>RANKING DE PARCEIROS</small>
            {['Partner Prime','Imobi House','Link Imóveis','Conecta Brokers'].map((name,i) => (
              <p key={name}><b>{i+1}</b><span>{name}</span><em>{92-i*7}</em></p>
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}

export default function LandingClient() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: .12 }
    )
    document.querySelectorAll('.landing-reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <main className="landing-page">
      <header className="landing-nav-public">
        <a href="#top" aria-label="VETRO"><Brand/></a>
        <nav aria-label="Navegação principal">
          <a href="#plataforma">Plataforma</a>
          <a href="#v6">V6 Method</a>
          <a href="#intelligence">Intelligence</a>
          <a href="#origem">Por que VETRO</a>
        </nav>
        <div className="landing-nav-actions">
          <Link href="/login" className="landing-login-link">Acessar plataforma</Link>
          <Cta>Conhecer a VETRO</Cta>
        </div>
      </header>

      <section className="landing-hero" id="top">
        <div className="landing-grid-bg"/>
        <div className="landing-aurora landing-aurora-one"/>
        <div className="landing-aurora landing-aurora-two"/>
        <div className="landing-container landing-hero-grid">
          <div className="landing-hero-copy landing-reveal is-visible">
            <span className="landing-kicker"><i/> Inteligência comercial para incorporadoras</span>
            <h1>A inteligência por trás da <em>operação comercial.</em></h1>
            <p>Sua operação gera dados todos os dias. A VETRO transforma relacionamento, parceiros, pipeline, empreendimentos e vendas em <strong>visão, gestão e direção comercial.</strong></p>
            <div className="landing-hero-actions"><Cta>Conhecer a VETRO</Cta><a className="landing-text-link" href="#plataforma">Ver a plataforma ↓</a></div>
            <div className="landing-proof-line"><span>Multiempresa</span><i/><span>Gestão de parceiros</span><i/><span>V6 Method</span><i/><span>Inteligência aplicada</span></div>
          </div>
          <div className="landing-product landing-reveal is-visible">
            <div className="landing-product-glow"/>
            <div className="landing-browser"><div className="landing-browser-top"><i/><i/><i/><span>app.vetro</span></div><ProductMock/></div>
            <div className="landing-floating landing-floating-score"><small>VETRO SCORE</small><strong>78</strong><span>Parceiro forte</span></div>
            <div className="landing-floating landing-floating-signal"><i/><div><small>VETRO SIGNAL</small><strong>Parceiro em aceleração</strong></div></div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-problem" id="plataforma"><div className="landing-container">
        <span className="landing-eyebrow landing-reveal">O problema não é falta de dados</span>
        <div className="landing-split landing-reveal"><h2>Sua incorporadora tem dados.<br/><em>Você consegue enxergar o que eles estão dizendo?</em></h2><div><p>Informações comerciais costumam ficar espalhadas entre planilhas, gestores, sistemas, imobiliárias e controles paralelos.</p><p>Quando a informação está fragmentada, a gestão também fica.</p></div></div>
        <div className="landing-data-strip landing-reveal">{['Relacionamento','Visitas','Corretores','Propostas','Vendas','VGV','Pipeline','Empreendimentos'].map(item => <span key={item}>{item}</span>)}</div>
        <div className="landing-center landing-reveal"><Cta>Quero enxergar melhor minha operação</Cta></div>
      </div></section>

      <section className="landing-section landing-platform"><div className="landing-container">
        <div className="landing-section-head landing-reveal"><div><span className="landing-eyebrow">Uma plataforma, uma leitura</span><h2>Não é mais um dashboard.</h2></div><p>A VETRO conecta o que acontece no campo ao que a gestão precisa enxergar para decidir.</p></div>
        <div className="landing-modules-grid">{modules.map(([title,description],i) => <article className="landing-module landing-reveal" key={title}><span>0{i+1}</span><div className="landing-module-icon"><i/><i/></div><h3>{title}</h3><p>{description}</p></article>)}</div>
        <div className="landing-center landing-reveal"><Cta>Ver a VETRO na minha operação</Cta></div>
      </div></section>

      <section className="landing-section landing-v6" id="v6"><div className="landing-orbit"/><div className="landing-container">
        <div className="landing-v6-intro landing-reveal"><div><span className="landing-eyebrow">Método proprietário VETRO</span><h2>V6 Method</h2></div><blockquote>“Vender é resultado.<br/>Entender <em>por que vende</em> é inteligência.”</blockquote></div>
        <div className="landing-v6-layout"><div className="landing-pillars">{pillars.map(([code,title,description]) => <article className="landing-pillar landing-reveal" key={code}><span>{code}</span><div><h3>{title}</h3><p>{description}</p></div></article>)}</div><div className="landing-score-panel landing-reveal"><div className="landing-score-rings"><i/><i/><i/><strong>78</strong><small>VETRO SCORE</small></div><b>Parceiro forte</b><p>Uma leitura única sobre força, saúde e desempenho da parceria comercial.</p></div></div>
        <div className="landing-v6-note landing-reveal"><strong>O parceiro que mais vendeu ontem não é necessariamente o mais estratégico para amanhã.</strong><p>A VETRO cruza relacionamento, ativação, oportunidades, conversão, valor e consistência para mostrar a força real de cada parceria.</p></div>
        <div className="landing-center landing-reveal"><Cta>Quero analisar meus parceiros com a VETRO</Cta></div>
      </div></section>

      <section className="landing-section landing-intelligence" id="intelligence"><div className="landing-container landing-intelligence-grid">
        <div className="landing-reveal"><span className="landing-eyebrow">Inteligência aplicada</span><h2>A VETRO não deveria apenas mostrar o que aconteceu.</h2><h3>Ela deve mostrar <em>onde agir.</em></h3><p>Menos tempo procurando informação. Mais tempo tomando decisão.</p><Cta>Transformar dados em decisão</Cta></div>
        <div className="landing-signals">{signals.map(([title,description],i) => <article className="landing-signal-row landing-reveal" key={title}><span>{String(i+1).padStart(2,'0')}</span><div><small>VETRO SIGNAL</small><h3>{title}</h3><p>{description}</p></div></article>)}</div>
      </div></section>

      <section className="landing-section landing-executive"><div className="landing-container">
        <div className="landing-section-head landing-reveal"><div><span className="landing-eyebrow">Visão executiva</span><h2>Abra a VETRO.<br/>Entenda sua operação.</h2></div><p>VGV, pipeline, conversão, parceiros, empreendimentos, equipe e VETRO Score em uma única visão.</p></div>
        <div className="landing-dashboard-stage landing-reveal"><ProductMock large/></div>
        <div className="landing-center landing-reveal"><Cta>Centralizar minha operação comercial</Cta></div>
      </div></section>

      <section className="landing-section landing-origin" id="origem"><div className="landing-container landing-origin-grid">
        <div className="landing-reveal"><span className="landing-eyebrow">Nascida da operação real</span><h2>Tecnologia construída a partir do campo.</h2></div>
        <div className="landing-origin-copy landing-reveal"><p>A VETRO não nasceu de uma hipótese sobre como uma incorporadora deveria trabalhar. Nasceu da rotina de gestores, do relacionamento com imobiliárias, das planilhas, propostas, empreendimentos, vendas e das decisões tomadas todos os dias.</p><strong>A experiência comercial de campo transformada em tecnologia proprietária.</strong></div>
      </div></section>

      <section className="landing-section landing-audience"><div className="landing-container">
        <div className="landing-section-head landing-reveal"><div><span className="landing-eyebrow">Para quem é</span><h2>Feita para operações que precisam enxergar mais.</h2></div></div>
        <div className="landing-audience-grid">{['Incorporadoras','Construtoras com operação comercial estruturada','Diretores comerciais','Heads e gerentes comerciais','Operações com rede de imobiliárias parceiras','Empresas com dados comerciais dispersos'].map((item,i) => <div className="landing-reveal" key={item}><span>0{i+1}</span>{item}</div>)}</div>
      </div></section>

      <section className="landing-final"><div className="landing-final-glow"/><div className="landing-container landing-reveal"><Brand large/><span className="landing-eyebrow">A inteligência por trás da operação comercial.</span><h2>Sua operação já produz os dados.<br/><em>Está na hora de enxergar a inteligência por trás deles.</em></h2><p>Conheça a VETRO e entenda como a plataforma pode ser aplicada à operação comercial da sua incorporadora.</p><Cta>Quero a VETRO na minha operação</Cta><small>Implantação consultiva. Fale com nosso especialista comercial.</small></div></section>

      <footer className="landing-footer"><div className="landing-container"><div><Brand/><small>A inteligência por trás da operação comercial.</small></div><nav><a href="#plataforma">Plataforma</a><a href="#v6">V6 Method</a><Link href="/login">Acessar</Link></nav><span>© 2026 VETRO. Todos os direitos reservados.</span></div></footer>
    </main>
  )
}
