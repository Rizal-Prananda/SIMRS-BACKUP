import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')

test('master bagian is a read-only nested list route', async () => {
  const [app, navigation, page, service] = await Promise.all([
    read('src/App.tsx'),
    read('src/routes/navigation.ts'),
    read('src/pages/master-data/MasterDepartmentsPage.tsx'),
    read('src/services/departments.ts'),
  ])

  assert.match(navigation, /label: 'Master Data'[\s\S]*children:\s*\[[\s\S]*label: 'Master Bagian'/)
  assert.match(app, /path="master-data\/bagian"/)
  for (const label of ['Kode', 'Nama Bagian', 'Nama Singkat', 'Spesialis', 'Status Aktif', 'Status Delete', 'Lokasi']) {
    assert.match(page, new RegExp(label))
  }
  assert.match(page, /\[10, 25, 50, 100\]/)
  assert.doesNotMatch(page, />Detail<|>Edit<|>Delete<|>Import<|>Tambah</)
  assert.match(service, /\/master\/departments/)
})
