import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import type { AuthUser } from '../services/auth'

type Props = { user: AuthUser; onLogout: () => void }

export function AppLayout({ user, onLogout }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  return (
    <div className={`app-shell ${sidebarCollapsed ? 'app-shell--collapsed' : ''}`}>
      <Sidebar open={sidebarOpen} collapsed={sidebarCollapsed} username={user.login_name} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Topbar
          sidebarCollapsed={sidebarCollapsed}
          user={user}
          onLogout={onLogout}
          onMenu={() => setSidebarOpen((open) => !open)}
          onToggleSidebar={() => setSidebarCollapsed((collapsed) => !collapsed)}
        />
        <main className="workspace"><Outlet /></main>
      </div>
    </div>
  )
}
