'use client'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
export default function UpdatePasswordPage() {
  const router = useRouter(); const [ready, setReady] = useState(false); const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState(''); const [message, setMessage] = useState('')
  useEffect(() => { const client = createClient(); const { data } = client.auth.onAuthStateChange((event, session) => { if (event === 'PASSWORD_RECOVERY' && session) setReady(true) }); client.auth.getSession().then(({ data }) => setReady(Boolean(data.session))); return () => data.subscription.unsubscribe() }, [])
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (password.length < 12 || !/[a-z]/i.test(password) || !/\d/.test(password)) return setMessage('Use pelo menos 12 caracteres, incluindo letras e números.'); if (password !== confirmation) return setMessage('As senhas não coincidem.'); const { error } = await createClient().auth.updateUser({ password }); if (error) return setMessage(error.message); setMessage('Senha atualizada.'); setTimeout(() => router.replace('/login'), 1000) }
  if (!ready) return <main className="login-wrap"><section className="login-card"><h1>Link inválido ou expirado.</h1></section></main>
  return <main className="login-wrap"><section className="login-card"><h1>Escolha uma nova senha.</h1><form onSubmit={submit}><div className="field"><label htmlFor="password">Nova senha</label><input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} /></div><div className="field"><label htmlFor="confirmation">Confirmar nova senha</label><input id="confirmation" type="password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></div>{message && <p className="error">{message}</p>}<button className="primary">Atualizar senha</button></form></section></main>
}
