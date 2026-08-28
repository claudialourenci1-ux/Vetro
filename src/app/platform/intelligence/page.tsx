import { BrainCircuit, KeyRound, Radar, ShieldCheck, Sparkles } from 'lucide-react'
import { AiBriefButton } from '@/app/_components/ai-brief-button'
import { PageHeading } from '@/app/_components/app-shell'
import { PlatformShell } from '@/app/_components/platform-shell'
import { requireSuperAdmin } from '@/lib/auth/server'
import { savePlatformIntelligenceSettingsAction } from './actions'
import styles from '../../admin/intelligence/page.module.css'

type SearchParams = { company?: string | string[] }
type Thresholds = { stale_opportunity_days?: number; partner_inactivity_days?: number; conversion_drop_pp?: number; concentration_top5_pct?: number }
type Settings = { ai_enabled?: boolean; ai_model?: string | null; signal_thresholds?: Thresholds | null }
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value
const iso = (date: Date) => date.toISOString().slice(0, 10)

export default async function PlatformIntelligencePage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const { supabase } = await requireSuperAdmin()
  const requested = await searchParams ?? {}
  const { data: companies, error: companiesError } = await supabase.from('companies').select('id,name').eq('is_active', true).order('name')
  const list = companies ?? []
  const requestedCompany = first(requested.company)
  const selectedCompany = list.find((item) => item.id === requestedCompany) ?? list[0]

  let settings: Settings = {}
  let settingsError: { message: string } | null = null
  if (selectedCompany) {
    const result = await supabase.from('company_settings').select('ai_enabled,ai_model,signal_thresholds').eq('company_id', selectedCompany.id).maybeSingle()
    settings = (result.data ?? {}) as Settings
    settingsError = result.error
  }
  const thresholds = (settings.signal_thresholds && typeof settings.signal_thresholds === 'object' ? settings.signal_thresholds : {}) as Thresholds
  const today = new Date()
  const from = new Date(today)
  from.setDate(from.getDate() - 29)

  return <PlatformShell>
    <PageHeading eyebrow="VETRO Platform" title="Inteligência interna" context="Controles de interpretação executiva exclusivos do time VETRO" />
    {companiesError ? <section className="workspace-error"><strong>Não foi possível carregar as incorporadoras.</strong><span>{companiesError.message}</span></section> : null}
    {!list.length ? <section className="platform-empty"><p>Nenhuma incorporadora ativa disponível.</p></section> : <>
      <section className={styles.panel}>
        <header><div><span>ESCOPO INTERNO</span><h2>Selecionar incorporadora</h2></div><ShieldCheck size={18}/></header>
        <form method="get" className={styles.form}>
          <label><span>Incorporadora</span><select name="company" defaultValue={selectedCompany?.id}>{list.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
          <button type="submit">Abrir configuração</button>
        </form>
      </section>
      {settingsError ? <section className="workspace-error"><strong>Não foi possível carregar a configuração.</strong><span>{settingsError.message}</span></section> : selectedCompany ? <>
        <section className={styles.intro}>
          <div><span>USO INTERNO VETRO</span><h2>{selectedCompany.name}</h2><p>Esta área não é exposta à incorporadora. O cliente recebe somente leituras e recomendações publicadas como VETRO Intelligence.</p></div>
          <BrainCircuit size={34}/>
        </section>
        <section className={styles.architecture}>
          <article><Radar size={18}/><div><strong>Fonte de verdade</strong><span>Os KPIs continuam calculados pelo banco da VETRO.</span></div></article>
          <article><BrainCircuit size={18}/><div><strong>Interpretação interna</strong><span>Somente super admins podem acionar a camada de IA.</span></div></article>
          <article><ShieldCheck size={18}/><div><strong>Cliente protegido</strong><span>Admins da incorporadora não veem modelo, chave, toggle ou botão de geração.</span></div></article>
          <article><Sparkles size={18}/><div><strong>Publicação controlada</strong><span>O resultado aparece para o cliente apenas como VETRO Intelligence.</span></div></article>
        </section>
        <section className={styles.panel}>
          <header><div><span>CONFIGURAÇÃO INTERNA</span><h2>Modelo e critérios</h2></div><KeyRound size={18}/></header>
          <form action={savePlatformIntelligenceSettingsAction} className={styles.form}>
            <input type="hidden" name="company_id" value={selectedCompany.id}/>
            <label className={styles.toggleRow}><input defaultChecked={Boolean(settings.ai_enabled)} name="ai_enabled" type="checkbox"/><span><b>Ativar inteligência assistida nesta incorporadora</b><small>O controle é exclusivo do time VETRO.</small></span></label>
            <label><span>Modelo interno</span><select defaultValue={settings.ai_model || 'gpt-5.6-terra'} name="ai_model"><option value="gpt-5.6-terra">GPT-5.6 Terra</option></select></label>
            <div className={styles.divider}/>
            <div className={styles.thresholdHeading}><strong>Critérios de atenção</strong><span>Limites usados pelos sinais objetivos da operação.</span></div>
            <div className={styles.thresholdGrid}>
              <label><span>Oportunidade parada</span><input defaultValue={thresholds.stale_opportunity_days ?? 7} min="1" name="stale_days" type="number"/><small>dias na mesma etapa</small></label>
              <label><span>Parceiro inativo</span><input defaultValue={thresholds.partner_inactivity_days ?? 14} min="1" name="inactivity_days" type="number"/><small>dias sem movimentação</small></label>
              <label><span>Queda de conversão</span><input defaultValue={thresholds.conversion_drop_pp ?? 3} min="0" name="conversion_drop" step="0.1" type="number"/><small>pontos percentuais</small></label>
              <label><span>Concentração Top 5</span><input defaultValue={thresholds.concentration_top5_pct ?? 60} max="100" min="0" name="concentration_pct" step="0.1" type="number"/><small>% do VGV</small></label>
            </div>
            <button type="submit">Salvar configuração interna</button>
          </form>
        </section>
        <section className={styles.panel}>
          <header><div><span>LEITURA SOB DEMANDA</span><h2>Gerar briefing interno</h2></div><Sparkles size={18}/></header>
          <p className={styles.securityNote}>A geração é autorizada no servidor somente para perfil global <code>super_admin</code>.</p>
          {settings.ai_enabled ? <AiBriefButton companyId={selectedCompany.id} dateFrom={iso(from)} dateTo={iso(today)}/> : <p className={styles.securityNote}>Ative a inteligência assistida para liberar a geração.</p>}
        </section>
      </> : null}
    </>}
  </PlatformShell>
}