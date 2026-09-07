import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Check, ChevronDown, ChevronUp, Eye, EyeOff, Info, Lock, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, User, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { currentRoute } from '../../routes/navigation'
import { authApi, type AuthUser } from '../../services/auth'

type Props = { sidebarCollapsed: boolean; user: AuthUser; onMenu: () => void; onToggleSidebar: () => void; onLogout: () => void }

function userInitials(name: string) {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean)
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return (parts[0] || 'U').slice(0, 2).toUpperCase()
}

export function Topbar({ sidebarCollapsed, user, onMenu, onToggleSidebar, onLogout }: Props) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const page = currentRoute(pathname)
  const [patientSearch, setPatientSearch] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const profileRef = useRef<HTMLDivElement>(null)
  const profileButtonRef = useRef<HTMLButtonElement>(null)
  const role = 'SIMRS User'
  const initials = userInitials(user.full_name)

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

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 4000)
    return () => window.clearTimeout(timer)
  }, [notice])

  function openProfile() {
    setProfileOpen(false)
    setPasswordOpen(true)
  }

  function handleLogout() {
    setProfileOpen(false)
    onLogout()
  }

  async function savePassword(currentPassword: string, password: string) {
    const result = await authApi.changePassword(currentPassword, password)
    setPasswordOpen(false)
    setNotice(result.message)
  }

  function searchPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = patientSearch.trim()
    if (!query) return
    navigate({
      pathname: '/rekam-medis/data-medis',
      search: `?q=${encodeURIComponent(query)}`,
    })
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
        <form className="search-button" role="search" onSubmit={searchPatient}>
          <Search size={18} />
          <input value={patientSearch} onChange={(event) => setPatientSearch(event.target.value)} placeholder="Cari nama atau No. RM..." aria-label="Cari nama atau No. RM pasien" />
          <kbd>Enter</kbd>
        </form>
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
            <span className="profile-copy"><strong>{user.full_name}</strong><small>{role}</small></span>
            <span className="profile-chevron" aria-hidden="true">{profileOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
          </button>

          {profileOpen && (
            <div className="profile-menu" id="profile-menu" role="menu" aria-label="Menu pengguna">
              <div className="profile-menu__header">
                <span className="avatar profile-menu__avatar">{initials}</span>
                <span><strong>{user.full_name}</strong><small>@{user.login_name}</small></span>
              </div>
              <div className="profile-menu__divider" />
              <div className="profile-menu__items">
                <button type="button" role="menuitem" onClick={openProfile}><User size={17} /><span>Profil Saya</span></button>
              </div>
              <div className="profile-menu__divider" />
              <div className="profile-menu__items">
                <button className="profile-menu__logout" type="button" role="menuitem" onClick={handleLogout}><LogOut size={17} /><span>Keluar</span></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {passwordOpen && createPortal(<ProfilePasswordModal user={user} onClose={() => setPasswordOpen(false)} onSave={savePassword} />, document.body)}
      {notice && createPortal(<div className="profile-success-toast" role="status"><Check size={16} /><span>{notice}</span><button type="button" aria-label="Tutup notifikasi" onClick={() => setNotice('')}><X size={15} /></button></div>, document.body)}
    </header>
  )
}

function ProfilePasswordModal({ user, onClose, onSave }: { user: AuthUser; onClose: () => void; onSave: (currentPassword: string, password: string) => Promise<void> }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose, submitting])

  const rules = [
    { label: 'Minimal 8 karakter', valid: password.length >= 8 },
    { label: 'Huruf besar', valid: /[A-Z]/.test(password) },
    { label: 'Huruf kecil', valid: /[a-z]/.test(password) },
    { label: 'Angka', valid: /\d/.test(password) },
    { label: 'Karakter khusus', valid: /[^A-Za-z0-9]/.test(password) },
  ]
  const confirmationMatches = confirmation.length > 0 && password === confirmation
  const formValid = currentPassword.length > 0 && rules.every((rule) => rule.valid) && confirmationMatches

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!formValid || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await onSave(currentPassword, password)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Password gagal disimpan.')
      setSubmitting(false)
    }
  }

  return <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !submitting && onClose()}>
    <section className="profile-password-modal" role="dialog" aria-modal="true" aria-labelledby="profile-password-title">
      <header><div><span><Lock size={18} /></span><div><h2 id="profile-password-title">Profil Saya</h2><p>Ubah password akun SIMRS Anda.</p></div></div><button type="button" aria-label="Tutup modal" disabled={submitting} onClick={onClose}><X size={17} /></button></header>
      <form onSubmit={submit}>
        <div className="profile-modal-user"><span className="avatar">{userInitials(user.full_name)}</span><div><strong>{user.full_name}</strong><small>@{user.login_name}</small></div></div>
        <PasswordField label="Password Saat Ini" value={currentPassword} show={showCurrent} disabled={submitting} autoFocus onChange={setCurrentPassword} onToggle={() => setShowCurrent((value) => !value)} />
        <PasswordField label="Password Baru" value={password} show={showPassword} disabled={submitting} onChange={setPassword} onToggle={() => setShowPassword((value) => !value)} />
        <PasswordField label="Konfirmasi Password Baru" value={confirmation} show={showConfirmation} disabled={submitting} onChange={setConfirmation} onToggle={() => setShowConfirmation((value) => !value)} />
        <div className="profile-password-rules"><strong>Ketentuan password</strong><div>{rules.map((rule) => <span className={rule.valid ? 'valid' : ''} key={rule.label}><i>{rule.valid && <Check size={10} />}</i>{rule.label}</span>)}</div><span className={confirmationMatches ? 'valid' : ''}><i>{confirmationMatches && <Check size={10} />}</i>Konfirmasi password sesuai</span></div>
        {error && <div className="profile-password-error" role="alert"><Info size={15} /><span>{error}</span></div>}
        <footer><button type="button" className="profile-modal-cancel" disabled={submitting} onClick={onClose}>Batal</button><button type="submit" className="profile-modal-save" disabled={!formValid || submitting}>{submitting ? <><span className="records-spinner" /> Menyimpan...</> : <><Lock size={15} /> Simpan Password</>}</button></footer>
      </form>
    </section>
  </div>
}

function PasswordField({ label, value, show, disabled, autoFocus = false, onChange, onToggle }: { label: string; value: string; show: boolean; disabled: boolean; autoFocus?: boolean; onChange: (value: string) => void; onToggle: () => void }) {
  return <label className="profile-password-field"><span>{label}</span><div><Lock size={16} /><input autoFocus={autoFocus} disabled={disabled} type={show ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={label === 'Password Saat Ini' ? 'current-password' : 'new-password'} /><button type="button" disabled={disabled} aria-label={show ? `Sembunyikan ${label}` : `Tampilkan ${label}`} onClick={onToggle}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
}
