import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, ChevronUp, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, Settings, User } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { currentRoute } from '../../routes/navigation'

type Props = { sidebarCollapsed: boolean; username: string; onMenu: () => void; onToggleSidebar: () => void; onLogout: () => void }

function userInitials(name: string) {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean)
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return (parts[0] || 'U').slice(0, 2).toUpperCase()
}

export function Topbar({ sidebarCollapsed, username, onMenu, onToggleSidebar, onLogout }: Props) {
  const { pathname } = useLocation()
  const page = currentRoute(pathname)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const profileButtonRef = useRef<HTMLButtonElement>(null)
  const role = 'SIMRS User'
  const initials = userInitials(username)

  useEffect(() => {
    if (!profileOpen) return

    function closeOnOutsideClick(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileOpen(false)
        profileButtonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [profileOpen])

  function handleLogout() {
    setProfileOpen(false)
    onLogout()
  }

  return (
    <header className="topbar">
      <div className="topbar__title-wrap">
        <button className="menu-button menu-button--mobile icon-button" onClick={onMenu} aria-label="Buka navigasi"><Menu size={21} /></button>
        <button className="menu-button menu-button--desktop icon-button" onClick={onToggleSidebar} aria-label={sidebarCollapsed ? 'Buka sidebar' : 'Ciutkan sidebar'} title={sidebarCollapsed ? 'Buka sidebar' : 'Ciutkan sidebar'}>
          {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
        <div><span className="topbar__eyebrow">DataGuard Workspace</span><h1>{page.label}</h1></div>
      </div>

      <div className="topbar__actions">
        <button className="search-button" aria-label="Cari"><Search size={18} /><span>Cari menu...</span><kbd>⌘ K</kbd></button>
        <button className="icon-button notification-button" aria-label="Notifikasi"><Bell size={19} /><i /></button>
        <div className="topbar__divider" />

        <div className="profile-menu-wrap" ref={profileRef}>
          <button
            ref={profileButtonRef}
            type="button"
            className={`profile-button ${profileOpen ? 'profile-button--open' : ''}`}
            onClick={() => setProfileOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            aria-controls="profile-menu"
          >
            <span className="avatar">{initials}</span>
            <span className="profile-copy"><strong>{username}</strong><small>{role}</small></span>
            <span className="profile-chevron" aria-hidden="true">{profileOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
          </button>

          {profileOpen && (
            <div className="profile-menu" id="profile-menu" role="menu" aria-label="Menu pengguna">
              <div className="profile-menu__header">
                <span className="avatar profile-menu__avatar">{initials}</span>
                <span><strong>{username}</strong><small>{role}</small></span>
              </div>
              <div className="profile-menu__divider" />
              <div className="profile-menu__items">
                <button type="button" role="menuitem"><User size={17} /><span>Profil Saya</span></button>
                <button type="button" role="menuitem"><Settings size={17} /><span>Pengaturan Akun</span></button>
              </div>
              <div className="profile-menu__divider" />
              <div className="profile-menu__items">
                <button className="profile-menu__logout" type="button" role="menuitem" onClick={handleLogout}><LogOut size={17} /><span>Keluar</span></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
