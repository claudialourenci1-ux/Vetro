'use client'

import {
  Activity,
  Building2,
  ChevronLeft,
  ChevronRight,
  Gauge,
  LogOut,
  Menu,
  Settings2,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const platformItems = [
  { href: '/platform', label: 'Visão geral', icon: Gauge },
  { href: '/platform/empresas', label: 'Empresas', icon: Building2 },
  { href: '/platform/usuarios', label: 'Usuários', icon: UsersRound },
  { href: '/platform/atividade', label: 'Atividade', icon: Activity },
  { href: '/platform/saude', label: 'Saúde da plataforma', icon: ShieldCheck },
  { href: '/platform/configuracoes', label: 'Configurações', icon: Settings2 },
]

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/'
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function signOut() {
    setIsSigningOut(true)
    await createClient().auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <aside className={`sidebar platform-sidebar ${mobileOpen ? 'is-mobile-open' : ''}`}>
        <div className="sidebar-head">
          <Link className="brand" href="/platform" aria-label="VETRO Control Center">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <strong>VETRO</strong>
          </Link>
          <button className="icon-button collapse-button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}>
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
          <button className="icon-button mobile-nav-toggle" onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}><Menu size={17} /></button>
        </div>

        <div className="platform-context">
          <span>PLATAFORMA</span>
          <strong>Control Center</strong>
        </div>

        <nav className="nav" aria-label="Administração da plataforma">
          {platformItems.map(({ href, label, icon: Icon }) => {
            const active = href === '/platform' ? pathname === '/platform' : pathname.startsWith(href)
            return <Link className={`nav-link ${active ? 'active' : ''}`} href={href} onClick={() => setMobileOpen(false)} key={href} title={collapsed ? label : undefined}><Icon size={18} /><span>{label}</span></Link>
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="workspace-summary">
            <span className="workspace-dot" />
            <span><b>VETRO Platform</b><small>super admin</small></span>
          </div>
          <button className="nav-link sign-out" onClick={signOut} disabled={isSigningOut} title={collapsed ? 'Sair' : undefined}><LogOut size={18} /><span>{isSigningOut ? 'Saindo…' : 'Sair'}</span></button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  )
}
