import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')

test('doctor management has nested navigation and separate detail route', async () => {
  const [app, navigation, sidebar, list, detail] = await Promise.all([
    read('src/App.tsx'),
    read('src/routes/navigation.ts'),
    read('src/components/layout/Sidebar.tsx'),
    read('src/pages/doctors/DoctorManagementPage.tsx'),
    read('src/pages/doctors/DoctorDetailPage.tsx'),
  ])

  assert.match(navigation, /label: 'Dokter'/)
  assert.match(navigation, /label: 'Management'/)
  assert.match(navigation, /label: 'Rekam Medis'[\s\S]*children:\s*\[[\s\S]*label: 'Data Pasien'/)
  assert.match(sidebar, /children/)
  assert.doesNotMatch(sidebar, /doctorActive|doctorOpen|doctorExpanded/)
  assert.match(app, /path="dokter\/management"/)
  assert.match(app, /path="dokter\/management\/:pid"/)
  assert.match(list, /Search dokter|Cari dokter/)
  assert.match(list, /if \(nextSearch === search && page === 1\) return/)
  assert.match(list, /function changePage\(nextPage: number\)/)
  assert.match(list, /to=\{`\/dokter\/management\/\$\{doctor\.pid\}`\}/)
  assert.doesNotMatch(list, />Edit<|>Delete<|>Import Dokter<|>Create Dokter</)
  assert.match(detail, /Profil/)
  assert.match(detail, /Penugasan/)
  assert.match(detail, /Jadwal/)
  assert.match(detail, /Riwayat/)
  assert.match(detail, /Kembali ke Dokter Management/)
})
