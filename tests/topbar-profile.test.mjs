import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')

test('topbar profile owns account actions and accessible close behavior', async () => {
  const [topbar, styles, auth, app, layout] = await Promise.all([
    read('src/components/layout/Topbar.tsx'),
    read('src/styles/theme.css'),
    read('src/services/auth.ts'),
    read('src/App.tsx'),
    read('src/layouts/AppLayout.tsx'),
  ])

  for (const icon of ['ChevronDown', 'ChevronUp', 'User', 'Lock', 'Eye', 'EyeOff', 'LogOut']) {
    assert.match(topbar, new RegExp(`\\b${icon}\\b`))
  }

  assert.match(topbar, /function userInitials/)
  assert.match(topbar, /split\(\/\[\\s._-\]\+\//)
  assert.match(topbar, /aria-haspopup="menu"/)
  assert.match(topbar, /aria-expanded=\{profileOpen\}/)
  assert.match(topbar, /role="menu"/)
  assert.match(topbar, />Profil Saya</)
  assert.doesNotMatch(topbar, /Pengaturan Akun|\bSettings\b/)
  assert.match(topbar, /\{user\.full_name\}/)
  assert.match(topbar, /onClick=\{openProfile\}/)
  assert.match(topbar, /createPortal/)
  assert.match(topbar, /role="dialog"/)
  assert.match(topbar, /label="Password Saat Ini"/)
  assert.match(topbar, /label="Password Baru"/)
  assert.match(topbar, /label="Konfirmasi Password Baru"/)
  assert.match(topbar, /await onSave\(currentPassword, password\)/)
  assert.match(topbar, /authApi\.changePassword/)
  assert.match(topbar, /role="status"/)
  assert.match(topbar, />Keluar</)
  assert.match(topbar, /event\.key === 'Escape'/)
  assert.match(topbar, /document\.addEventListener\('mousedown'/)
  assert.match(topbar, /onLogout\(\)/)
  assert.doesNotMatch(topbar, /className="icon-button logout-button"/)

  assert.match(styles, /\.profile-menu\s*\{/)
  assert.match(styles, /z-index:\s*80/)
  assert.match(styles, /@keyframes profile-menu-in/)
  assert.match(styles, /\.profile-menu__logout:hover/)
  assert.match(styles, /\.profile-password-modal\s*\{/)
  assert.match(auth, /export type AuthUser = \{ login_name: string; full_name: string \}/)
  assert.match(auth, /async changePassword/)
  assert.match(auth, /'\/api\/auth\/password'/)
  assert.match(app, /<AppLayout user=\{user\}/)
  assert.match(layout, /<Topbar[\s\S]*user=\{user\}/)
})
