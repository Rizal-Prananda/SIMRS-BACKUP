import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')

test('topbar profile owns account actions and accessible close behavior', async () => {
  const [topbar, styles] = await Promise.all([
    read('src/components/layout/Topbar.tsx'),
    read('src/styles/theme.css'),
  ])

  for (const icon of ['ChevronDown', 'ChevronUp', 'User', 'Settings', 'LogOut']) {
    assert.match(topbar, new RegExp(`\\b${icon}\\b`))
  }

  assert.match(topbar, /function userInitials/)
  assert.match(topbar, /split\(\/\[\\s._-\]\+\//)
  assert.match(topbar, /aria-haspopup="menu"/)
  assert.match(topbar, /aria-expanded=\{profileOpen\}/)
  assert.match(topbar, /role="menu"/)
  assert.match(topbar, />Profil Saya</)
  assert.match(topbar, />Pengaturan Akun</)
  assert.match(topbar, />Keluar</)
  assert.match(topbar, /event\.key === 'Escape'/)
  assert.match(topbar, /document\.addEventListener\('mousedown'/)
  assert.match(topbar, /onLogout\(\)/)
  assert.doesNotMatch(topbar, /className="icon-button logout-button"/)

  assert.match(styles, /\.profile-menu\s*\{/)
  assert.match(styles, /z-index:\s*80/)
  assert.match(styles, /@keyframes profile-menu-in/)
  assert.match(styles, /\.profile-menu__logout:hover/)
})
