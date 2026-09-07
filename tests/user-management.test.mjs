import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')

test('User module menu and route are restricted to rizal.prananda', async () => {
  const [app, navigation, layout, sidebar] = await Promise.all([
    read('src/App.tsx'),
    read('src/routes/navigation.ts'),
    read('src/layouts/AppLayout.tsx'),
    read('src/components/layout/Sidebar.tsx'),
  ])

  assert.match(navigation, /USER_ADMIN_USERNAME\s*=\s*'rizal\.prananda'/)
  assert.match(navigation, /label:\s*'User',\s*path:\s*'\/user'/)
  assert.match(navigation, /icon:\s*(Users|UserRoundCog)/)
  assert.match(navigation, /adminOnly:\s*true/)
  assert.match(app, /path="user"/)
  assert.match(app, /UserAdminGuard/)
  assert.match(app, /username !== USER_ADMIN_USERNAME/)
  assert.match(app, /<Navigate to="\/" replace/)
  assert.match(layout, /<Sidebar[^>]*username=\{user\.login_name\}/s)
  assert.match(sidebar, /item\.adminOnly && username !== USER_ADMIN_USERNAME/)
})

test('User Management loads the real paginated user list and keeps same-page details', async () => {
  const [page, service] = await Promise.all([
    read('src/pages/users/UserManagementPage.tsx'),
    read('src/services/users.ts'),
  ])

  assert.doesNotMatch(page, /const MOCK_USERS/)
  assert.match(page, /userApi\.list/)
  assert.match(page, /setTimeout\([\s\S]*250/)
  assert.match(page, /meta\.total/)
  assert.match(service, /fetch\(`\/api\/users\?\$\{params\.toString\(\)\}`/)
  assert.match(service, /credentials:\s*'include'/)
  assert.match(service, /params\.set\('search'/)
  assert.match(service, /params\.set\('role'/)
  assert.match(service, /params\.set\('status'/)
  assert.match(service, /params\.set\('page'/)
  assert.match(page, /Kelola akun pengguna sistem/)
  assert.match(page, /Akses Terbatas/)
  assert.match(page, /Modul User hanya dapat diakses oleh administrator utama\./)
  assert.match(page, /Daftar User/)
  for (const heading of ['No', 'Username', 'Nama Lengkap', 'Role', 'Status', 'Terakhir Login', 'Aksi']) {
    assert.match(page, new RegExp(`>${heading}<`))
  }
  for (const role of ['Administrator', 'Dokter', 'Perawat', 'Petugas']) assert.match(page, new RegExp(role))
  assert.match(service, /filters\.role !== 'Semua'/)
  assert.match(service, /filters\.status !== 'Semua'/)
  assert.match(page, /setSelectedUserId\(user\.id\)/)
  assert.match(page, /Pilih User/)
  assert.match(page, /Pilih salah satu user dari daftar untuk melihat informasi akun\./)
  assert.match(page, /Informasi pengguna yang dipilih/)
  assert.match(page, /Reset Password/)
  assert.match(page, /Nonaktifkan/)
  assert.match(page, /Untuk perubahan data user selain password silakan hubungi tim IT\./)
  assert.match(page, /Menampilkan \{meta\.from/)
  assert.match(page, /dari \{meta\.total\} user/)
  assert.doesNotMatch(page, />Tambah User<|>Edit User<|>Hapus User</)
})

test('Reset Password validates locally and persists through an authenticated CSRF request', async () => {
  const [page, service] = await Promise.all([
    read('src/pages/users/UserManagementPage.tsx'),
    read('src/services/users.ts'),
  ])

  assert.match(page, /role="dialog"/)
  assert.match(page, /aria-modal="true"/)
  assert.match(page, /Password Baru/)
  assert.match(page, /Konfirmasi Password Baru/)
  assert.match(page, /type=\{showPassword \? 'text' : 'password'\}/)
  assert.match(page, /type=\{showConfirmation \? 'text' : 'password'\}/)
  assert.match(page, /showPassword \? <EyeOff/)
  assert.match(page, /showConfirmation \? <EyeOff/)
  for (const rule of ['Minimal 8 karakter', 'Huruf besar', 'Huruf kecil', 'Angka', 'Karakter khusus']) assert.match(page, new RegExp(rule))
  assert.match(page, /password\.length >= 8/)
  assert.match(page, /valid: \/\[A-Z\]\//)
  assert.match(page, /valid: \/\[a-z\]\//)
  assert.match(page, /valid: \/\\d\//)
  assert.match(page, /password === confirmation/)
  assert.match(page, />Batal</)
  assert.match(page, /userApi\.resetPassword/)
  assert.match(page, /await onComplete\(password\)/)
  assert.match(page, /Menyimpan\.\.\./)
  assert.match(page, /role="alert"/)
  assert.doesNotMatch(page, /Simulasi reset password|reset password[^\n]*Tidak ada data yang diubah/)
  assert.match(service, /\/api\/auth\/csrf/)
  assert.match(service, /method:\s*'PATCH'/)
  assert.match(service, /X-CSRF-TOKEN/)
  assert.match(service, /credentials:\s*'include'/)
  assert.match(service, /password_confirmation:\s*password/)
})

test('User Management keeps a 75/25 desktop layout and responsive detail panel', async () => {
  const theme = await read('src/styles/theme.css')

  assert.match(theme, /\.user-management-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,3fr\) minmax\(280px,1fr\)/)
  assert.match(theme, /\.user-list-card[^}]*border-radius:\s*16px/)
  assert.match(theme, /\.user-detail-card[^}]*border-radius:\s*16px/)
  assert.match(theme, /\.user-filter-popover[^}]*position:\s*absolute[^}]*z-index:/)
  assert.match(theme, /\.user-modal-backdrop[^}]*position:\s*fixed[^}]*z-index:/)
  assert.match(theme, /\.user-reset-modal[^}]*max-width:\s*480px/)
  assert.match(theme, /@media \(max-width:\s*1180px\)[\s\S]*\.user-management-grid\s*\{\s*grid-template-columns:\s*1fr/)
  assert.match(theme, /@media \(max-width:\s*760px\)[\s\S]*\.user-table\s*\{[^}]*min-width:\s*0/)
  assert.match(theme, /@media \(max-width:\s*760px\)[\s\S]*nth-child\(6\)/)
  assert.match(theme, /@media \(max-width:\s*760px\)[\s\S]*\.user-detail-empty\s*\{[^}]*min-height:\s*220px/)
})
