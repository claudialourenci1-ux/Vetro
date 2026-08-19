'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data, error: signInError } = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Login timeout')), 15_000)),
      ])

      if (signInError) {
        setError(
          signInError.message.toLowerCase().includes('email not confirmed')
            ? 'Confirme o e-mail da sua conta antes de entrar.'
            : 'Não foi possível entrar. Verifique e-mail e senha.'
        )
        return
      }

      if (!data.session || !data.user) {
        setError('O login foi aceito, mas a sessão não foi criada. Tente novamente.')
        return
      }

      router.replace('/')
      router.refresh()
    } catch {
      setError('Não foi possível concluir o login. Tente novamente em alguns instantes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-wrap">
      <section className="login-card">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <span>VETRO</span>
        </div>
        <p className="eyebrow" style={{ marginTop: 30 }}>Inteligência comercial</p>
        <h1>Acesse sua operação.</h1>
        <p className="subtle">A inteligência por trás da operação comercial.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Senha</label>
            <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error ? <div className="error">{error}</div> : null}
          <button className="primary" type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>
      </section>
    </main>
  )
}
