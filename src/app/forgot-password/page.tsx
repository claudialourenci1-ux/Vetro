'use client'
import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(''); const [sent, setSent] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl}/update-password` }); setSent(true) }
  return <main className="login-wrap"><section className="login-card"><h1>Redefina sua senha.</h1>{sent ? <p>Se houver uma conta para este e-mail, você receberá as instruções em instantes.</p> : <form onSubmit={submit}><div className="field"><label htmlFor="email">E-mail</label><input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div><button className="primary">Enviar instruções</button></form>}</section></main>
}
