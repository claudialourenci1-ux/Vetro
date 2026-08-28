'use client'

import {
  Activity,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  FileUp,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Network,
  Settings2,
  Sparkles,
  Target,
  UsersRound,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const items = [
  { href: '/', label: 'Overview', icon: LayoutDashboard, permission: 'overview_view' },
  { href: '/parceiros', label: 'Parceiros', icon: UsersRound, permission: 'partners_view' },
  { href: '/atividades', label: 'Atividades', icon: Activity, permission: 'activities_log' },
  { href: '/pipeline', label: 'Pipeline', icon: Network, permission: 'pipeline_view' },
  { href: '/empreendimentos', label: 'Empreendimentos', icon: Building2, permission: 'developments_view' },
  { href: '/metas', label: 'Metas', icon: Target, permission: 'overview_view' },
  { href: '/equipe', label: 'Equipe', icon: CircleUserRound, permission: 'team_view' },
  { href: '/intelligence', label: 'Intelligence', icon: Sparkles, permission: 'intelligence_view' },
  { href: '/acoes', label: 'Plano de ação', icon: ListChecks, permission: 'intelligence_view' },
  { href: '/importar-dados', label: 'Importar dados', icon: FileUp, permission: 'imports_execute' },
  { href: '/admin', label: 'Admin', icon: Settings2, permission: 'admin_view' },
]

export function AppShell({ children, companyName, role, permissions }: { children: React.ReactNode; companyName?: string; role?: string; permissions?: string[] }) {
  const pathname = usePathname() ?? '/'
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const canSee = (permission: string) => {
    if (role === 'admin') return true
    if (!permissions) return true
    return permission === 'overview_view' || permissions.includes(permission)
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  async function signOut() {
    setIsSigningOut(true)
    await createClient().auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
    <aside className={`sidebar ${mobileOpen ? 'is-mobile-open' : ''}`}>
      <div className="sidebar-head">
        <Link className="brand" href="/" aria-label="VETRO overview"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><strong>VETRO</strong></Link>
        <button className="icon-button collapse-button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}>{collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button>
        <button className="icon-button mobile-nav-toggle" onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}><Menu size={17}/></button>
      </div>
      <nav className="nav" aria-label="Navegação principal">
        {items.filter((item) => canSee(item.permission)).map(({ href, label, icon: Icon }) => <Link className={`nav-link ${isActive(href) ? 'active' : ''}`} href={href} key={href} onClick={() => setMobileOpen(false)} title={collapsed ? label : undefined}><Icon size={18}/><span>{label}</span></Link>)}
      </nav>
      <div className="sidebar-footer">
        <div className="workspace-summary"><span className="workspace-dot"/><span><b>{companyName ?? 'Workspace VETRO'}</b><small>{role?.replace('_', ' ') ?? 'acesso protegido'}</small></span></div>
        <button className="nav-link sign-out" onClick={signOut} disabled={isSigningOut} title={collapsed ? 'Sair' : undefined}><LogOut size={18}/><span>{isSigningOut ? 'Saindo…' : 'Sair'}</span></button>
      </div>
    </aside>
    <main className="main-content">{children}</main>
  </div>
}

export function PageHeading({ eyebrow, title, context, children }: { eyebrow: string; title: string; context?: string; children?: React.ReactNode }) {
  return <header className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{context ? <p className="page-context">{context}</p> : null}</div>{children}</header>
}

export function MetricIcon({ children }: { children: React.ReactNode }) {
  return <span className="metric-icon"><BarChart3 size={17}/>{children}</span>
}
