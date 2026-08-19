'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password !== confirmPassword) {
      setMessage('As senhas não coincidem.')
      return
    }

    setLoading(true)
    setMessage('')
    try {
      const { error } = await createClient().auth.updateUser({ password })
      setMessage(error ? error.message : 'Senha atualizada. Você já pode entrar na VETRO.')
    } catch {
      setMessage('Não foi possível atualizar a senha. Solicite um novo link de recuperação.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="login-wrap"><section className="login-card"><div className="brand"><div className="brand-mark" aria-hidden="true"><span /><span /><span /></div><span>VETRO</span></div><p className="eyebrow" style={{ marginTop: 30 }}>Recuperação de acesso</p><h1>Defina uma nova senha.</h1><form onSubmit={handleSubmit}><div className="field"><label htmlFor="password">Nova senha</label><input id="password" type="password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} /></div><div className="field"><label htmlFor="confirmPassword">Confirmar nova senha</label><input id="confirmPassword" type="password" minLength={12} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div>{message ? <p className="error" role="status">{message}</p> : null}<button className="primary" type="submit" disabled={loading}>{loading ? 'Atualizando…' : 'Atualizar senha'}</button></form></section></main>
}
