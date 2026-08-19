'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function PlatformInviteUser({ companyId, companyName }: { companyId: string; companyName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    const form = new FormData(event.currentTarget)
    const fullName = String(form.get('full_name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    const role = String(form.get('role') ?? 'collaborator')

    try {
      const supabase = createClient()
      const { data, error: invokeError } = await supabase.functions.invoke('invite-member', {
        body: { company_id: companyId, full_name: fullName, email, role },
      })
      if (invokeError || data?.error) throw new Error(data?.message || invokeError?.message || 'Não foi possível enviar o convite.')
      setMessage(`Convite enviado para ${email}.`)
      setOpen(false)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível enviar o convite.')
    } finally {
      setLoading(false)
    }
  }

  return <>
    <button className="primary platform-create-button" onClick={() => setOpen(true)}><UserPlus size={17} /> Liberar acesso</button>
    {message ? <div className="platform-notice success">{message}</div> : null}
    {error ? <div className="platform-notice error">{error}</div> : null}
    {open ? <div className="platform-modal-backdrop">
      <div className="platform-modal" role="dialog" aria-modal="true">
        <div className="platform-modal-head"><div><p className="eyebrow">{companyName}</p><h2>Liberar novo acesso</h2></div><button className="icon-button" onClick={() => setOpen(false)} aria-label="Fechar"><X size={18} /></button></div>
        <form className="platform-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>Nome<input name="full_name" placeholder="Nome completo" /></label>
            <label>E-mail<input name="email" type="email" required placeholder="usuario@empresa.com.br" /></label>
            <label>Perfil<select name="role" defaultValue="collaborator"><option value="admin">Admin</option><option value="manager">Gestor</option><option value="collaborator">Colaborador</option></select></label>
          </div>
          <p className="form-help">Admins administram o workspace. Gestores acompanham a operação. Colaboradores entram com permissões operacionais mínimas e podem receber acessos extras depois.</p>
          <div className="platform-modal-actions"><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancelar</button><button type="submit" className="primary" disabled={loading}>{loading ? 'Enviando…' : 'Enviar convite'}</button></div>
        </form>
      </div>
    </div> : null}
  </>
}
