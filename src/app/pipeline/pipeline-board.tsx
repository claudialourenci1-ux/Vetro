'use client'

import { ArrowRight, BadgeCheck, Building2, CalendarDays, CircleX, Clock3, GripVertical, Landmark, UserRound, UsersRound, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { closeLostOpportunityAction, closeWonOpportunityAction, moveOpportunityAction } from './actions'
import styles from './page.module.css'

type Stage = { id: string; key: string; name: string; position: number; stageType: string }
export type PipelineOpportunity = {
  id: string
  stageId: string | null
  stageKey: string
  unitCode: string
  contactName: string
  partnerName: string
  developmentName: string
  portfolioName: string
  managerName: string
  brokerName: string
  ownerName: string
  value: number
  tableValue: number
  proposalValue: number
  daysInStage: number
  sourceDate: string | null
  farol: string
  motivation: string
}

type ClosingState = { type: 'won' | 'lost'; opportunity: PipelineOpportunity } | null

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 })
const fullCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const shortDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

function dateInputToday() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

function toneForFarol(value: string) {
  const normalized = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (normalized.includes('vermelh') || normalized.includes('crit')) return styles.danger
  if (normalized.includes('amarel') || normalized.includes('atenc')) return styles.warning
  if (normalized.includes('verd') || normalized.includes('posit')) return styles.positive
  return styles.neutral
}

export function PipelineBoard({ stages, opportunities, canManage, staleDays }: { stages: Stage[]; opportunities: PipelineOpportunity[]; canManage: boolean; staleDays: number }) {
  const router = useRouter()
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [overStageId, setOverStageId] = useState<string | null>(null)
  const [closing, setClosing] = useState<ClosingState>(null)
  const [grossValue, setGrossValue] = useState('')
  const [reason, setReason] = useState('')
  const [outcomeDate, setOutcomeDate] = useState(dateInputToday())
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const byStage = useMemo(() => {
    const map = new Map<string, PipelineOpportunity[]>()
    for (const stage of stages) map.set(stage.id, [])
    for (const opportunity of opportunities) {
      if (!opportunity.stageId) continue
      const rows = map.get(opportunity.stageId)
      if (rows) rows.push(opportunity)
    }
    for (const rows of map.values()) rows.sort((a, b) => b.daysInStage - a.daysInStage || b.value - a.value)
    return map
  }, [stages, opportunities])

  function move(opportunityId: string, stageId: string) {
    if (!canManage || pending) return
    const current = opportunities.find((row) => row.id === opportunityId)
    if (!current || current.stageId === stageId) return
    setError('')
    startTransition(async () => {
      const result = await moveOpportunityAction({ opportunityId, stageId })
      if (!result.ok) setError(result.error ?? 'Não foi possível mover a oportunidade.')
      else router.refresh()
      setDraggedId(null)
      setOverStageId(null)
    })
  }

  function openClosing(type: 'won' | 'lost', opportunity: PipelineOpportunity) {
    setClosing({ type, opportunity })
    setGrossValue(opportunity.value > 0 ? String(opportunity.value) : '')
    setReason('')
    setOutcomeDate(dateInputToday())
    setError('')
  }

  function submitClosing() {
    if (!closing || pending) return
    setError('')
    startTransition(async () => {
      const result = closing.type === 'won'
        ? await closeWonOpportunityAction({ opportunityId: closing.opportunity.id, grossValue: Number(grossValue.replace(',', '.')), soldAt: outcomeDate })
        : await closeLostOpportunityAction({ opportunityId: closing.opportunity.id, reason, lostAt: outcomeDate })
      if (!result.ok) setError(result.error ?? 'Não foi possível encerrar a oportunidade.')
      else {
        setClosing(null)
        router.refresh()
      }
    })
  }

  return <>
    {error && !closing ? <div className={styles.errorBar}>{error}</div> : null}
    <div className={styles.boardWrap}>
      <div className={styles.board}>
        {stages.map((stage) => {
          const rows = byStage.get(stage.id) ?? []
          const stageValue = rows.reduce((total, row) => total + row.value, 0)
          const stale = rows.filter((row) => row.daysInStage >= staleDays).length
          return <section
            className={`${styles.column} ${overStageId === stage.id ? styles.dropTarget : ''}`}
            key={stage.id}
            onDragOver={(event) => { if (canManage) { event.preventDefault(); setOverStageId(stage.id) } }}
            onDragLeave={() => setOverStageId((current) => current === stage.id ? null : current)}
            onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData('text/plain') || draggedId; if (id) move(id, stage.id) }}
          >
            <header className={styles.columnHeader}>
              <div><span>{stage.name}</span><b>{rows.length}</b></div>
              <strong title={fullCurrency.format(stageValue)}>{currency.format(stageValue)}</strong>
              <small>{stale ? `${stale} com aging alto` : 'sem aging crítico'}</small>
            </header>
            <div className={styles.cards}>
              {rows.length ? rows.map((opportunity) => <article
                className={`${styles.card} ${opportunity.daysInStage >= staleDays ? styles.staleCard : ''}`}
                draggable={canManage && !pending}
                key={opportunity.id}
                onDragStart={(event) => { setDraggedId(opportunity.id); event.dataTransfer.setData('text/plain', opportunity.id); event.dataTransfer.effectAllowed = 'move' }}
                onDragEnd={() => { setDraggedId(null); setOverStageId(null) }}
              >
                <div className={styles.cardTop}>
                  <div className={styles.unit}><GripVertical size={13}/><b>{opportunity.unitCode || 'Sem unidade'}</b></div>
                  <span className={`${styles.farol} ${toneForFarol(opportunity.farol)}`}>{opportunity.farol || 'Sem farol'}</span>
                </div>
                <div className={styles.cardProduct}><Building2 size={13}/><span>{opportunity.developmentName || 'Empreendimento não informado'}</span></div>
                <strong className={styles.cardValue} title={fullCurrency.format(opportunity.value)}>{currency.format(opportunity.value)}</strong>
                <div className={styles.cardMeta}>
                  <span><UsersRound size={12}/>{opportunity.partnerName || 'Sem parceiro'}</span>
                  <span><UserRound size={12}/>{opportunity.portfolioName || opportunity.managerName || 'Sem carteira'}</span>
                  <span className={opportunity.daysInStage >= staleDays ? styles.ageWarning : ''}><Clock3 size={12}/>{opportunity.daysInStage} dia{opportunity.daysInStage === 1 ? '' : 's'} na etapa</span>
                  {opportunity.sourceDate ? <span><CalendarDays size={12}/>{shortDate.format(new Date(`${opportunity.sourceDate}T12:00:00`))}</span> : null}
                </div>
                {opportunity.contactName ? <p className={styles.contact}>{opportunity.contactName}</p> : null}
                {canManage ? <div className={styles.cardActions}>
                  <select aria-label={`Mover ${opportunity.unitCode || 'oportunidade'} para outra etapa`} disabled={pending} value={opportunity.stageId ?? ''} onChange={(event) => move(opportunity.id, event.target.value)}>
                    {stages.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                  </select>
                  <button type="button" onClick={() => openClosing('won', opportunity)} title="Registrar venda"><BadgeCheck size={14}/></button>
                  <button type="button" onClick={() => openClosing('lost', opportunity)} title="Marcar como perdida"><CircleX size={14}/></button>
                </div> : null}
              </article>) : <div className={styles.emptyColumn}><ArrowRight size={15}/><span>Nenhuma oportunidade nesta etapa</span></div>}
            </div>
          </section>
        })}
      </div>
    </div>

    {closing ? <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target && !pending) setClosing(null) }}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="pipeline-close-title">
        <header><div><span>{closing.type === 'won' ? 'FECHAMENTO' : 'ENCERRAMENTO'}</span><h2 id="pipeline-close-title">{closing.type === 'won' ? 'Registrar venda' : 'Marcar oportunidade como perdida'}</h2></div><button type="button" disabled={pending} onClick={() => setClosing(null)} aria-label="Fechar"><X size={17}/></button></header>
        <div className={styles.modalOpportunity}><b>{closing.opportunity.unitCode || 'Sem unidade'} · {closing.opportunity.developmentName}</b><span>{closing.opportunity.partnerName}</span></div>
        {closing.type === 'won' ? <label><span>Valor final da venda</span><input inputMode="decimal" type="number" min="0.01" step="0.01" value={grossValue} onChange={(event) => setGrossValue(event.target.value)} /></label> : <label><span>Motivo da perda</span><textarea rows={4} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ex.: cliente desistiu, crédito não aprovado, escolheu outro produto..." /></label>}
        <label><span>{closing.type === 'won' ? 'Data da venda' : 'Data do encerramento'}</span><input type="date" value={outcomeDate} onChange={(event) => setOutcomeDate(event.target.value)} /></label>
        {error ? <p className={styles.modalError}>{error}</p> : null}
        <footer><button className={styles.cancelButton} type="button" disabled={pending} onClick={() => setClosing(null)}>Cancelar</button><button className={closing.type === 'won' ? styles.confirmButton : styles.lossButton} type="button" disabled={pending} onClick={submitClosing}>{pending ? 'Salvando...' : closing.type === 'won' ? 'Confirmar venda' : 'Confirmar perda'}</button></footer>
      </section>
    </div> : null}
  </>
}
