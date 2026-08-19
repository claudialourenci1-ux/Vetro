import Link from 'next/link'
import { requireAuthenticatedUser } from '@/lib/auth/server'

export default async function AccessRestrictedPage() {
  await requireAuthenticatedUser()
  return <main className="login-wrap"><section className="login-card"><p className="eyebrow">Acesso restrito</p><h1>Esta área é exclusiva da administração da VETRO.</h1><p className="subtle">Seu perfil não possui acesso à administração global da plataforma.</p><Link className="primary platform-link" href="/">Voltar para a operação</Link></section></main>
}
