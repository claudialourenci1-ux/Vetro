'use client'

import { ArrowRight, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function OnboardingCard() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function bootstrapWorkspace() {
    setLoading(true)
    setMessage('')
    const { error } = await createClient().functions.invoke('bootstrap-admin')
    setLoading(false)
    setMessage(error ? 'Não foi possível ativar este workspace. Confirme suas permissões ou fale com o suporte VETRO.' : 'Workspace ativado. Atualize a página para continuar.')
  }

  return <section className="empty-state onboarding"><div><p className="eyebrow">Primeiro acesso</p><h2>Seu workspace ainda não está configurado.</h2><p>Ative a estrutura inicial da sua operação ou peça ao administrador da incorporadora para convidar você.</p>{message && <p className="status-message" role="status">{message}</p>}</div><button className="primary-button" onClick={bootstrapWorkspace} disabled={loading}>{loading ? <LoaderCircle className="spin" size={16} /> : <ArrowRight size={16} />} {loading ? 'Ativando…' : 'Ativar workspace'}</button></section>
}
