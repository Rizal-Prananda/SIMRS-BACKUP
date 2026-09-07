import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const projectRoot = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, projectRoot), 'utf8')

test('browser and sidebar use the requested development read-only label', async () => {
  const [index, login, sidebar] = await Promise.all([
    read('index.html'),
    read('src/pages/auth/LoginPage.tsx'),
    read('src/components/layout/Sidebar.tsx'),
  ])

  assert.match(index, /<title>SIMRS - Development Read Only By RP<\/title>/)
  assert.match(login, /document\.title = 'SIMRS - Development Read Only By RP'/)
  assert.match(sidebar, /<strong><i \/> SIMRS - Development<\/strong><span>Read Only By RP<\/span>/)
  assert.doesNotMatch(sidebar, /Mode Aman|Akses baca-saja/)
  assert.doesNotMatch(index, /<title>SIMRS DataGuard<\/title>/)
})
