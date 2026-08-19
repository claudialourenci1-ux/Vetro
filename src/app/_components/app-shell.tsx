'use client'

import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  FileUp,
  LayoutDashboard,
  LogOut,
  Network,
  Settings2,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const items = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/parceiros', label: 'Parceiros', icon: UsersRound },
  { href: '/pipeline', label: 'Pipeline', icon: Network },
  { href: '/empreendimentos', label: 'Empreendimentos', icon: Building2 },
  { href: '/intelligence', label: 'Intelligence', icon: Sparkles },
  { href: '/equipe', label: 'Equipe', icon: CircleUserRound },
  { href: '/importar-dados', label: 'Importar dados', icon: FileUp },
  { href: '/admin', label: 'Admin', icon: Settings2 },
]

export function AppShell({ children, companyName, role }: { children: React.ReactNode; companyName?: string; role?: string }) {
  const pathname = usePathname() ?? '/'
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function signOut() {
    setIsSigningOut(true)
    await createClient().auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-head">
          <Link className="brand" href="/" aria-label="VETRO overview">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <strong>VETRO</strong>
          </Link>
          <button className="icon-button collapse-button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}>
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
        </div>

        <nav className="nav" aria-label="Navegação principal">
          {items.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return <Link className={`nav-link ${active ? 'active' : ''}`} href={href} key={href} title={collapsed ? label : undefined}><Icon size={18} /><span>{label}</span></Link>
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="workspace-summary">
            <span className="workspace-dot" />
            <span><b>{companyName ?? 'Workspace VETRO'}</b><small>{role?.replace('_', ' ') ?? 'acesso protegido'}</small></span>
          </div>
          <button className="nav-link sign-out" onClick={signOut} disabled={isSigningOut} title={collapsed ? 'Sair' : undefined}><LogOut size={18} /><span>{isSigningOut ? 'Saindo…' : 'Sair'}</span></button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  )
}

export function PageHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return <header className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>{children}</header>
}

export function MetricIcon({ children }: { children: React.ReactNode }) {
  return <span className="metric-icon"><BarChart3 size={17} />{children}</span>
}
