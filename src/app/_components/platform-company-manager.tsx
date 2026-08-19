'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, UserPlus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function PlatformCompanyManager() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const legalName = String(form.get('legal_name') ?? '').trim()
    const document = String(form.get('document') ?? '').replace(/\D/g, '')
    const planName = String(form.get('plan_name') ?? '').trim()
    const adminName = String(form.get('admin_name') ?? '').trim()
    const adminEmail = String(form.get('admin_email') ?? '').trim().toLowerCase()

    if (!name || !adminEmail) {
      setError('Informe o nome da empresa e o e-mail do primeiro administrador.')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name,
          legal_name: legalName || null,
          document: document || null,
          slug: `${slugify(name)}-${Date.now().toString().slice(-5)}`,
          plan_name: planName || null,
          contract_status: 'active',
          is_active: true,
          activated_at: new Date().toISOString(),
        })
        .select('id,name')
        .single()

      if (companyError || !company) throw new Error(companyError?.message || 'Não foi possível criar a empresa.')

      const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-member', {
        body: {
          company_id: company.id,
          email: adminEmail,
          full_name: adminName,
          role: 'admin',
        },
      })

      if (inviteError || inviteData?.error) {
        setMessage(`${company.name} foi criada, mas o convite do Admin precisa ser reenviado.`)
        setError(inviteData?.message || inviteError?.message || 'Falha ao convidar o administrador.')
      } else {
        setMessage(`${company.name} foi ativada e o primeiro Admin foi convidado.`)
        setOpen(false)
        event.currentTarget.reset()
      }
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível concluir o cadastro.')
    } finally {
      setLoading(false)
    }
  }

  return <>
    <button className="primary platform-create-button" onClick={() => setOpen(true)}><Building2 size={17} /> Nova empresa</button>
    {message ? <div className="platform-notice success">{message}</div> : null}
    {error ? <div className="platform-notice error">{error}</div> : null}

    {open ? <div className="platform-modal-backdrop" role="presentation">
      <div className="platform-modal" role="dialog" aria-modal="true" aria-labelledby="company-modal-title">
        <div className="platform-modal-head">
          <div><p className="eyebrow">Ativação de cliente</p><h2 id="company-modal-title">Nova incorporadora</h2></div>
          <button className="icon-button" onClick={() => setOpen(false)} aria-label="Fechar"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="platform-form">
          <div className="form-grid">
            <label>Nome da empresa<input name="name" required placeholder="Ex.: OAD Incorporações" /></label>
            <label>Razão social<input name="legal_name" placeholder="Razão social" /></label>
            <label>CNPJ<input name="document" inputMode="numeric" placeholder="00.000.000/0000-00" /></label>
            <label>Plano<input name="plan_name" placeholder="Ex.: VETRO Intelligence" /></label>
          </div>
          <div className="form-divider"><UserPlus size={17} /><span>Primeiro administrador da incorporadora</span></div>
          <div className="form-grid">
            <label>Nome do Admin<input name="admin_name" placeholder="Nome completo" /></label>
            <label>E-mail do Admin<input name="admin_email" type="email" required placeholder="admin@empresa.com.br" /></label>
          </div>
          <div className="platform-modal-actions">
            <button type="button" className="secondary" onClick={() => setOpen(false)}>Cancelar</button>
            <button type="submit" className="primary" disabled={loading}>{loading ? 'Ativando…' : 'Ativar empresa e convidar Admin'}</button>
          </div>
        </form>
      </div>
    </div> : null}
  </>
}
