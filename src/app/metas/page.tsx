import { Building2, Goal, Landmark, Target } from 'lucide-react'
import { AppShell, PageHeading } from '../_components/app-shell'
import { createClient } from '@/lib/supabase/server'
import { requireCompanyPermission } from '@/lib/workspace/server'
import { saveVgvGoalAction } from './actions'
import styles from './page.module.css'

type DataRecord = Record<string, unknown>
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

function iso(value: Date) { return value.toISOString().slice(0, 10) }
function text(value: unknown, fallback = '—') { return value == null || value === '' ? fallback : String(value) }
function amount(value: unknown) { const parsed = Number(value ?? 0); return Number.isFinite(parsed) ? parsed : 0 }

export default async function GoalsPage() {
  const workspace = await requireCompanyPermission('overview_view')
  const supabase = await createClient()
  const [goalsResult, developmentsResult, portfoliosResult] = await Promise.all([
    supabase.from('commercial_goals').select('*').eq('company_id', workspace.company.id).eq('indicator_key', 'vgv').order('period_start', { ascending: false }),
    supabase.from('developments').select('id,name').eq('company_id', workspace.company.id).eq('status', 'active').order('name'),
    supabase.from('portfolios').select('id,name,manager_name').eq('company_id', workspace.company.id).eq('is_active', true).order('name'),
  ])
  const error = goalsResult.error ?? developmentsResult.error ?? portfoliosResult.error
  const goals = (goalsResult.data ?? []) as DataRecord[]
  const developments = (developmentsResult.data ?? []) as DataRecord[]
  const portfolios = (portfoliosResult.data ?? []) as DataRecord[]
  const developmentNames = new Map(developments.map((row) => [String(row.id), text(row.name)]))
  const portfolioNames = new Map(portfolios.map((row) => [String(row.id), text(row.name)]))
  const canManage = workspace.membership.role === 'admin' || workspace.membership.role === 'manager'
  const companyGoals = goals.filter((row) => !row.development_id && !row.portfolio_id)
  const developmentGoals = goals.filter((row) => row.development_id)
  const portfolioGoals = goals.filter((row) => row.portfolio_id)
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
  const current = companyGoals.find((row) => String(row.period_start) <= iso(now) && String(row.period_end) >= iso(now))

  return <AppShell companyName={workspace.company.name} role={workspace.membership.role} permissions={workspace.permissions}>
    <PageHeading eyebrow="Planejamento comercial" title="Metas" />
    {error ? <section className="workspace-error"><strong>Não foi possível carregar as metas.</strong><span>{error.message}</span></section> : <>
      <section className={styles.summary}>
        <article><Target size={17}/><span>Meta corporativa vigente</span><strong>{current ? money.format(amount(current.target_value)) : 'Não definida'}</strong></article>
        <article><Building2 size={17}/><span>Metas por empreendimento</span><strong>{developmentGoals.length}</strong></article>
        <article><Landmark size={17}/><span>Metas por carteira</span><strong>{portfolioGoals.length}</strong></article>
        <article><Goal size={17}/><span>Períodos cadastrados</span><strong>{goals.length}</strong></article>
      </section>

      {canManage ? <section className={styles.panel}>
        <header><div><span>NOVA META</span><h2>Definir VGV esperado</h2></div><Target size={18}/></header>
        <form action={saveVgvGoalAction} className={styles.form}>
          <label><span>Escopo</span><select defaultValue="company" name="scope"><option value="company">Empresa inteira</option><optgroup label="Empreendimentos">{developments.map((item) => <option key={String(item.id)} value={`development:${String(item.id)}`}>{text(item.name)}</option>)}</optgroup><optgroup label="Carteiras comerciais">{portfolios.map((item) => <option key={String(item.id)} value={`portfolio:${String(item.id)}`}>{text(item.name)}</option>)}</optgroup></select></label>
          <label><span>Início</span><input defaultValue={iso(monthStart)} name="period_start" type="date" required /></label>
          <label><span>Fim</span><input defaultValue={iso(monthEnd)} name="period_end" type="date" required /></label>
          <label><span>Meta de VGV (R$)</span><input min="0" name="target_value" placeholder="30000000" step="0.01" type="number" required /></label>
          <button type="submit">Salvar meta</button>
        </form>
        <p className={styles.helper}>Se já existir uma meta para o mesmo escopo e início de período, a VETRO atualiza o valor em vez de duplicar o registro.</p>
      </section> : null}

      <section className={styles.panel}>
        <header><div><span>HISTÓRICO</span><h2>Metas comerciais cadastradas</h2></div><span className={styles.counter}>{goals.length}</span></header>
        <div className={styles.tableWrap}><table><thead><tr><th>Escopo</th><th>Período</th><th>Meta</th><th>Nível</th></tr></thead><tbody>{goals.length ? goals.map((goal) => {
          const scopeName = goal.development_id ? developmentNames.get(String(goal.development_id)) ?? 'Empreendimento' : goal.portfolio_id ? portfolioNames.get(String(goal.portfolio_id)) ?? 'Carteira' : workspace.company.name
          const level = goal.development_id ? 'Empreendimento' : goal.portfolio_id ? 'Carteira' : 'Corporativa'
          return <tr key={String(goal.id)}><td><b>{scopeName}</b><small>{text(goal.indicator_name, 'VGV')}</small></td><td>{date.format(new Date(`${String(goal.period_start)}T12:00:00`))} → {date.format(new Date(`${String(goal.period_end)}T12:00:00`))}</td><td><strong>{money.format(amount(goal.target_value))}</strong></td><td><span className={styles.level}>{level}</span></td></tr>
        }) : <tr><td className={styles.empty} colSpan={4}>Nenhuma meta de VGV cadastrada ainda.</td></tr>}</tbody></table></div>
      </section>
    </>}
  </AppShell>
}
