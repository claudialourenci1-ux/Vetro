import Link from 'next/link'
import { BrainCircuit, DatabaseZap, KeyRound, Radar, ShieldCheck } from 'lucide-react'
import { AppShell, PageHeading } from '../../_components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { requireCompanyPermission } from '@/lib/workspace/server'
import { saveIntelligenceSettingsAction } from './actions'
import styles from './page.module.css'

type Thresholds = { stale_opportunity_days?: number; partner_inactivity_days?: number; conversion_drop_pp?: number; concentration_top5_pct?: number }
type Settings = { ai_enabled?: boolean; ai_model?: string | null; signal_thresholds?: Thresholds | null }

export default async function IntelligenceSettingsPage() {
  const workspace = await requireCompanyPermission('settings_manage')
  const supabase = await createClient()
  const { data, error } = await supabase.from('company_settings').select('*').eq('company_id', workspace.company.id).maybeSingle()
  const settings = (data ?? {}) as unknown as Settings
  const thresholds = (settings.signal_thresholds && typeof settings.signal_thresholds === 'object' ? settings.signal_thresholds : {}) as Thresholds

  return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}>
    <PageHeading eyebrow="Administração" title="Inteligência comercial"><Link className={styles.backLink} href="/admin">Voltar ao Admin</Link></PageHeading>
    {error ? <section className="workspace-error"><strong>Não foi possível carregar a configuração.</strong><span>{error.message}</span></section> : <>
      <section className={styles.intro}>
        <div><span>VETRO INTELLIGENCE</span><h2>Dados calculam. IA interpreta.</h2><p>Os números continuam sendo calculados pelo banco da VETRO. A OpenAI recebe somente o cockpit comercial agregado para produzir resumo executivo, pontos de atenção e recomendações. Ela não substitui os KPIs nem executa ações sozinha.</p></div>
        <BrainCircuit size={34}/>
      </section>

      <section className={styles.architecture}>
        <article><DatabaseZap size={18}/><div><strong>Fonte de verdade</strong><span>Postgres calcula VGV, meta, conversão, aging, pipeline, concentração, estoque e V6.</span></div></article>
        <article><Radar size={18}/><div><strong>Sinais determinísticos</strong><span>A VETRO identifica regras objetivas antes de chamar qualquer modelo de IA.</span></div></article>
        <article><BrainCircuit size={18}/><div><strong>Interpretação executiva</strong><span>A IA prioriza o que merece atenção e sugere próximos passos sustentados pelos dados.</span></div></article>
        <article><ShieldCheck size={18}/><div><strong>Ação sob controle</strong><span>Recomendações só viram tarefas quando a gestão decide adotá-las.</span></div></article>
      </section>

      <section className={styles.panel}>
        <header><div><span>CONFIGURAÇÃO</span><h2>VETRO AI e critérios de atenção</h2></div><KeyRound size={18}/></header>
        <form action={saveIntelligenceSettingsAction} className={styles.form}>
          <label className={styles.toggleRow}><input defaultChecked={Boolean(settings.ai_enabled)} name="ai_enabled" type="checkbox"/><span><b>Ativar VETRO AI nesta incorporadora</b><small>A leitura sob demanda só funciona quando a chave OpenAI também estiver configurada no ambiente seguro do servidor.</small></span></label>
          <label><span>Modelo</span><select defaultValue={settings.ai_model || 'gpt-5.6-terra'} name="ai_model"><option value="gpt-5.6-terra">GPT-5.6 Terra · recomendado</option></select></label>
          <div className={styles.divider}/>
          <div className={styles.thresholdHeading}><strong>Quando a VETRO deve chamar atenção?</strong><span>Esses limites alimentam sinais objetivos. Podem ser calibrados por incorporadora sem alterar código.</span></div>
          <div className={styles.thresholdGrid}>
            <label><span>Oportunidade parada</span><input defaultValue={thresholds.stale_opportunity_days ?? 7} min="1" name="stale_days" type="number"/><small>dias na mesma etapa</small></label>
            <label><span>Parceiro inativo</span><input defaultValue={thresholds.partner_inactivity_days ?? 14} min="1" name="inactivity_days" type="number"/><small>dias sem movimentação</small></label>
            <label><span>Queda de conversão</span><input defaultValue={thresholds.conversion_drop_pp ?? 3} min="0" name="conversion_drop" step="0.1" type="number"/><small>pontos percentuais</small></label>
            <label><span>Concentração Top 5</span><input defaultValue={thresholds.concentration_top5_pct ?? 60} max="100" min="0" name="concentration_pct" step="0.1" type="number"/><small>% do VGV</small></label>
          </div>
          <button type="submit">Salvar inteligência</button>
        </form>
      </section>

      <section className={styles.securityNote}><KeyRound size={18}/><div><strong>A chave da OpenAI nunca aparece nesta tela.</strong><p>Ela deve existir somente como segredo de servidor com o nome <code>OPENAI_API_KEY</code>. Se estiver ausente, a VETRO informa que a IA não está configurada e mantém todo o restante da plataforma funcionando.</p></div></section>
    </>}
  </AppShell>
}
