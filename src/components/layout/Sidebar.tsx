import { ChevronDown, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { routeItems, USER_ADMIN_USERNAME } from '../../routes/navigation'

type Props = { open: boolean; collapsed: boolean; username: string; onClose: () => void }

export function Sidebar({ open, collapsed, username, onClose }: Props) {
  const { pathname } = useLocation()
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  return (
    <>
      <aside className={`sidebar ${open ? 'sidebar--open' : ''} ${collapsed ? 'sidebar--collapsed' : ''}`} aria-label="Navigasi utama">
        <div className="brand">
          <div className="brand__mark"><ShieldCheck size={23} strokeWidth={2.3} /></div>
          <div className="brand__copy"><strong>SIMRS</strong><span>DataGuard</span></div>
        </div>
        <div className="nav-heading">Workspace</div>
        <nav className="nav-list">
          {routeItems.filter((item) => !(item.adminOnly && username !== USER_ADMIN_USERNAME)).map(({ label, path, icon: Icon, children }) => {
            const activeChildPath = children
              ?.filter((child) => pathname === child.path || pathname.startsWith(`${child.path}/`))
              .sort((first, second) => second.path.length - first.path.length)[0]?.path
            const groupActive = Boolean(activeChildPath)
            const groupExpanded = groupActive || openGroup === path

            return children ? (
              <div className={`nav-group ${groupExpanded ? 'nav-group--open' : ''} ${groupActive ? 'nav-group--active' : ''}`} key={path}>
                <button type="button" title={collapsed ? label : undefined} aria-label={label} aria-expanded={groupExpanded} onClick={() => setOpenGroup((current) => current === path ? null : path)} className={`nav-item nav-parent ${groupActive ? 'nav-item--section-active' : ''}`}>
                  <span className="nav-item__icon"><Icon size={18} strokeWidth={1.9} /></span><span>{label}</span><ChevronDown className="nav-parent__chevron" size={15} />
                </button>
                <div className="nav-children">
                  {children.map((child) => {
                    const ChildIcon = child.icon
                    return (
                    <Link key={child.path} to={child.path} onClick={onClose} aria-current={child.path === activeChildPath ? 'page' : undefined} className={`nav-child ${child.path === activeChildPath ? 'nav-child--active' : ''}`}>
                      <span className="nav-child__icon"><ChildIcon size={15} strokeWidth={1.9} /></span><span>{child.label}</span>
                    </Link>
                    )
                  })}
                </div>
              </div>
            ) : (
              <NavLink key={path} to={path} end={path === '/'} title={collapsed ? label : undefined} aria-label={label} onClick={onClose} className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}>
                <span className="nav-item__icon"><Icon size={18} strokeWidth={1.9} /></span><span>{label}</span>
              </NavLink>
            )
          })}
        </nav>
        <div className="system-status">
          <div className="system-status__icon"><LockKeyhole size={17} /></div>
          <div><strong><i /> Mode Aman</strong><span>Akses baca-saja</span></div>
        </div>
      </aside>
      {open && <button className="sidebar-backdrop" aria-label="Tutup navigasi" onClick={onClose} />}
    </>
  )
}
