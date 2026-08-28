'use client'

import { LoaderCircle, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AiBriefButton({
  companyId,
  dateFrom,
  dateTo,
  developmentId,
  portfolioId,
}: {
  companyId: string
  dateFrom: string
  dateTo: string
  developmentId?: string
  portfolioId?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setMessage(null)
    const supabase = createClient()
    const { data, error } = await supabase.functions.invoke('commercial-brief', {
      body: {
        company_id: companyId,
        date_from: dateFrom,
        date_to: dateTo,
        development_id: developmentId,
        portfolio_id: portfolioId,
        briefing_type: 'on_demand',
      },
    })

    if (error) {
      const context = error.context as { json?: () => Promise<Record<string, unknown>> } | undefined
      let code = ''
      try {
        const payload = await context?.json?.()
        code = String(payload?.error ?? '')
      } catch {
        code = ''
      }
      setMessage(code === 'ai_disabled'
        ? 'Ative a inteligência por IA nas configurações da incorporadora.'
        : code === 'openai_not_configured'
          ? 'A chave da OpenAI ainda não foi configurada no ambiente seguro.'
          : 'Não foi possível gerar a leitura agora.')
      setLoading(false)
      return
    }

    if (!data?.ok) {
      setMessage('A leitura não foi concluída. Tente novamente.')
      setLoading(false)
      return
    }

    setMessage('Leitura atualizada.')
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="cockpit-ai-control">
      <button className="cockpit-ai-button" disabled={loading} onClick={generate} type="button">
        {loading ? <LoaderCircle className="spin" size={15} /> : <Sparkles size={15} />}
        {loading ? 'Analisando operação…' : 'Gerar leitura VETRO AI'}
      </button>
      {message ? <span aria-live="polite">{message}</span> : null}
    </div>
  )
}
