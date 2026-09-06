import {
  Activity,
  AtSign,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  Filter,
  IdCard,
  Info,
  Lock,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PageContainer } from '../../components/ui/PageContainer'
import { userApi, type UserAccount, type UserListMeta, type UserRole, type UserStatus } from '../../services/users'

const PAGE_SIZE = 8
const roles: Array<'Semua' | UserRole> = ['Semua', 'Administrator', 'Dokter', 'Perawat', 'Petugas']
const statuses: Array<'Semua' | UserStatus> = ['Semua', 'Aktif', 'Nonaktif']

export function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'Semua' | UserRole>('Semua')
  const [statusFilter, setStatusFilter] = useState<'Semua' | UserStatus>('Semua')
  const [filterOpen, setFilterOpen] = useState(false)
  const [users, setUsers] = useState<UserAccount[]>([])
  const [meta, setMeta] = useState<UserListMeta>({ currentPage: 1, lastPage: 1, perPage: PAGE_SIZE, total: 0, from: null, to: null })
  const [page, setPage] = useState(1)
  const queryKey = `${debouncedSearch}|${roleFilter}|${statusFilter}|${page}`
  const [settledQueryKey, setSettledQueryKey] = useState('')
  const loading = settledQueryKey !== queryKey
  const [loadError, setLoadError] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null)
  const [resetUserId, setResetUserId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
      setPage(1)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    const controller = new AbortController()
    userApi.list({ search: debouncedSearch, role: roleFilter, status: statusFilter, page, perPage: PAGE_SIZE, signal: controller.signal })
      .then(({ users: loadedUsers, meta: loadedMeta }) => {
        setUsers(loadedUsers)
        setMeta(loadedMeta)
        setLoadError('')
        setSettledQueryKey(queryKey)
        setSelectedUser((current) => loadedUsers.find((user) => user.id === current?.id) ?? current)
      })
      .catch((error: unknown) => {
        if ((error as DOMException)?.name !== 'AbortError') {
          setLoadError(error instanceof Error ? error.message : 'Daftar user tidak dapat dimuat.')
          setSettledQueryKey(queryKey)
        }
      })
    return () => controller.abort()
  }, [debouncedSearch, roleFilter, statusFilter, page, queryKey])

  useEffect(() => {
    if (!filterOpen) return
    const closeFilter = (event: MouseEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) setFilterOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setFilterOpen(false)
    document.addEventListener('mousedown', closeFilter)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeFilter)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [filterOpen])

  const resetUser = selectedUser?.id === resetUserId ? selectedUser : null
  const activeFilterCount = Number(roleFilter !== 'Semua') + Number(statusFilter !== 'Semua')

  function clearFilters() {
    setRoleFilter('Semua')
    setStatusFilter('Semua')
    setPage(1)
  }

  return (
    <PageContainer className="user-management-page">
      <header className="module-heading user-page-heading">
        <div><p>Administrasi Sistem</p><h2>User</h2><span>Kelola akun pengguna sistem</span></div>
      </header>

      <section className="user-access-note">
        <span><Lock size={17} /></span>
        <div><strong>Akses Terbatas</strong><p>Modul User hanya dapat diakses oleh administrator utama.</p></div>
      </section>

      {feedback && <div className="user-mock-feedback" role="status"><Info size={16} /><span>{feedback}</span><button type="button" aria-label="Tutup informasi" onClick={() => setFeedback('')}><X size={15} /></button></div>}

      <div className="user-management-grid">
        <section className="user-list-card">
          <header className="user-card-header">
            <div><p>AKUN SISTEM</p><h3>Daftar User</h3><span>Kelola akun pengguna sistem SIMRS DataGuard</span></div>
            <div className="user-list-tools">
              <label className="user-search"><Search size={16} /><input value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setPage(1) }} placeholder="Cari user..." aria-label="Cari user" />{searchTerm && <button type="button" aria-label="Hapus pencarian" onClick={() => { setSearchTerm(''); setPage(1) }}><X size={14} /></button>}</label>
              <div className="user-filter-wrap" ref={filterRef}>
                <button type="button" className={`user-filter-trigger ${activeFilterCount ? 'active' : ''}`} aria-haspopup="dialog" aria-expanded={filterOpen} onClick={() => setFilterOpen((open) => !open)}><Filter size={16} /> Filter {activeFilterCount > 0 && <span>{activeFilterCount}</span>}</button>
                {filterOpen && <div className="user-filter-popover" role="dialog" aria-label="Filter user">
                  <header><strong>Filter User</strong>{activeFilterCount > 0 && <button type="button" onClick={clearFilters}>Reset</button>}</header>
                  <label>Role<select value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value as 'Semua' | UserRole); setPage(1) }}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
                  <label>Status<select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as 'Semua' | UserStatus); setPage(1) }}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                  <button type="button" className="user-filter-apply" onClick={() => setFilterOpen(false)}>Terapkan Filter</button>
                </div>}
              </div>
            </div>
          </header>

          <div className="user-table-wrap">
            <table className="user-table">
              <thead><tr><th>No</th><th>Username</th><th>Nama Lengkap</th><th>Role</th><th>Status</th><th>Terakhir Login</th><th>Aksi</th></tr></thead>
              <tbody>
                {!loading && !loadError && users.map((user, index) => <tr key={user.id} className={selectedUserId === user.id ? 'selected' : ''}>
                  <td>{(meta.from ?? 1) + index}</td>
                  <td><div className="user-identity-cell"><span className={`user-avatar user-avatar--${roleClass(user.role)}`}>{user.initials}</span><strong>{user.username}</strong></div></td>
                  <td>{user.fullName}</td>
                  <td><span className={`user-role-badge user-role-badge--${roleClass(user.role)}`}>{user.role}</span></td>
                  <td><span className={`user-status-badge user-status-badge--${user.status.toLowerCase()}`}><i />{user.status}</span></td>
                  <td><span className="user-last-login"><Clock3 size={13} />{user.lastLogin}</span></td>
                  <td><button type="button" className="user-view-button" onClick={() => { setSelectedUserId(user.id); setSelectedUser(user) }}><Eye size={15} /> Lihat</button></td>
                </tr>)}
                {loading && <tr><td colSpan={7}><div className="user-table-state"><span className="records-spinner" /><strong>Memuat daftar user...</strong></div></td></tr>}
                {!loading && loadError && <tr><td colSpan={7}><div className="user-table-empty"><Info size={27} /><strong>Daftar user gagal dimuat</strong><span>{loadError}</span></div></td></tr>}
                {!loading && !loadError && users.length === 0 && <tr><td colSpan={7}><div className="user-table-empty"><UserRound size={27} /><strong>User tidak ditemukan</strong><span>Coba ubah kata pencarian atau filter.</span></div></td></tr>}
              </tbody>
            </table>
          </div>

          <footer className="records-pagination user-pagination">
            <p>Menampilkan {meta.from ?? 0} - {meta.to ?? 0} dari {meta.total} user</p>
            <div><button type="button" aria-label="Halaman sebelumnya" disabled={loading || page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={15} /></button><button type="button" className="active">{meta.currentPage}</button><button type="button" aria-label="Halaman berikutnya" disabled={loading || page >= meta.lastPage} onClick={() => setPage((value) => Math.min(meta.lastPage, value + 1))}><ChevronRight size={15} /></button></div>
          </footer>
        </section>

        <aside className="user-detail-card">
          {!selectedUser ? <div className="user-detail-empty"><span><UserRound size={28} /></span><h3>Pilih User</h3><p>Pilih salah satu user dari daftar untuk melihat informasi akun.</p></div> : <UserDetail user={selectedUser} onResetPassword={() => setResetUserId(selectedUser.id)} onDeactivate={() => setFeedback(`Simulasi nonaktifkan ${selectedUser.username}. Tidak ada data yang diubah.`)} />}
        </aside>
      </div>
      {resetUser && <PasswordResetModal user={resetUser} onClose={() => setResetUserId(null)} onComplete={() => { setResetUserId(null); setFeedback(`Simulasi reset password ${resetUser.username} selesai. Tidak ada data yang diubah.`) }} />}
    </PageContainer>
  )
}

function UserDetail({ user, onResetPassword, onDeactivate }: { user: UserAccount; onResetPassword: () => void; onDeactivate: () => void }) {
  return <div className="user-detail-content">
    <header><div><p>AKUN TERPILIH</p><h3>Detail User</h3><span>Informasi pengguna yang dipilih</span></div></header>
    <section className="user-detail-profile"><span className={`user-avatar user-detail-avatar user-avatar--${roleClass(user.role)}`}>{user.initials}</span><div><strong>{user.fullName}</strong><span>@{user.username}</span><div><span className={`user-role-badge user-role-badge--${roleClass(user.role)}`}>{user.role}</span><span className={`user-status-badge user-status-badge--${user.status.toLowerCase()}`}><i />{user.status}</span></div></div></section>
    <dl className="user-detail-list">
      <DetailRow icon={<AtSign size={16} />} label="Username" value={user.username} />
      <DetailRow icon={<IdCard size={16} />} label="Nama Lengkap" value={user.fullName} />
      <DetailRow icon={<ShieldCheck size={16} />} label="Role" value={user.role} />
      <DetailRow icon={<Activity size={16} />} label="Status" value={user.status} />
      <DetailRow icon={<Clock3 size={16} />} label="Terakhir Login" value={user.lastLogin} />
      <DetailRow icon={<CalendarDays size={16} />} label="Dibuat Pada" value={user.createdAt} />
    </dl>
    <div className="user-detail-note"><Info size={16} /><p>Untuk perubahan data user selain password silakan hubungi tim IT.</p></div>
    <footer><button type="button" className="user-reset-button" onClick={onResetPassword}><Lock size={15} /> Reset Password</button><button type="button" className="user-deactivate-button" onClick={onDeactivate}>Nonaktifkan</button></footer>
  </div>
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div><dt><span>{icon}</span>{label}</dt><dd>{value}</dd></div>
}

function PasswordResetModal({ user, onClose, onComplete }: { user: UserAccount; onClose: () => void; onComplete: () => void }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const rules = [
    { label: 'Minimal 8 karakter', valid: password.length >= 8 },
    { label: 'Huruf besar', valid: /[A-Z]/.test(password) },
    { label: 'Huruf kecil', valid: /[a-z]/.test(password) },
    { label: 'Angka', valid: /\d/.test(password) },
    { label: 'Karakter khusus', valid: /[^A-Za-z0-9]/.test(password) },
  ]
  const confirmationMatches = confirmation.length > 0 && password === confirmation
  const formValid = rules.every((rule) => rule.valid) && confirmationMatches

  return <div className="user-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="user-reset-modal" role="dialog" aria-modal="true" aria-labelledby="reset-password-title">
      <header><div><span><Lock size={18} /></span><div><h3 id="reset-password-title">Reset Password</h3><p>Buat password baru untuk akun terpilih.</p></div></div><button type="button" aria-label="Tutup modal" onClick={onClose}><X size={17} /></button></header>
      <form onSubmit={(event) => { event.preventDefault(); if (formValid) onComplete() }}>
        <div className="reset-user-summary"><span className={`user-avatar user-avatar--${roleClass(user.role)}`}>{user.initials}</span><div><small>USERNAME</small><strong>{user.username}</strong><p>{user.fullName}</p></div></div>
        <label className="user-password-field"><span>Password Baru</span><div><Lock size={16} /><input autoFocus type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" /><button type="button" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
        <label className="user-password-field"><span>Konfirmasi Password Baru</span><div><Lock size={16} /><input type={showConfirmation ? 'text' : 'password'} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" /><button type="button" aria-label={showConfirmation ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'} onClick={() => setShowConfirmation((value) => !value)}>{showConfirmation ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
        <div className="password-rules"><strong>Ketentuan password</strong><div>{rules.map((rule) => <span className={rule.valid ? 'valid' : ''} key={rule.label}><i>{rule.valid ? <Check size={11} /> : null}</i>{rule.label}</span>)}</div><span className={confirmationMatches ? 'valid' : ''}><i>{confirmationMatches ? <Check size={11} /> : null}</i>Konfirmasi password sesuai</span></div>
        <footer><button type="button" className="user-modal-cancel" onClick={onClose}>Batal</button><button type="submit" className="user-modal-submit" disabled={!formValid}><Lock size={15} /> Reset Password</button></footer>
      </form>
    </section>
  </div>
}

function roleClass(role: UserRole) {
  return role.toLowerCase()
}
