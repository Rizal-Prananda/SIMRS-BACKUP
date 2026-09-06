import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'

type Props = { username: string; onLogout: () => void }

export function AppLayout({ username, onLogout }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  return (
    <div className={`app-shell ${sidebarCollapsed ? 'app-shell--collapsed' : ''}`}>
      <Sidebar open={sidebarOpen} collapsed={sidebarCollapsed} username={username} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Topbar
          sidebarCollapsed={sidebarCollapsed}
          username={username}
          onLogout={onLogout}
          onMenu={() => setSidebarOpen((open) => !open)}
          onToggleSidebar={() => setSidebarCollapsed((collapsed) => !collapsed)}
        />
        <main className="workspace"><Outlet /></main>
      </div>
    </div>
  )
}
