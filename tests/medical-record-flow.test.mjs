import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')

test('Data Medis uses patient selection then a separate visit detail route', async () => {
  const [app, navigation, list, detail, service] = await Promise.all([
    read('src/App.tsx'),
    read('src/routes/navigation.ts'),
    read('src/pages/medical-records/DataMedisPage.tsx'),
    read('src/pages/medical-records/MedicalVisitDetailPage.tsx'),
    read('src/services/medicalRecords.ts'),
  ])

  assert.match(navigation, /label: 'Data Pasien', path: '\/rekam-medis'/)
  assert.match(navigation, /label: 'Data Medis', path: '\/rekam-medis\/data-medis'/)
  assert.match(app, /path="rekam-medis" element=\{<MedicalRecordsPage/)
  assert.match(app, /path="rekam-medis\/:pid" element=\{<MedicalRecordDetailPage/)
  assert.match(app, /path="rekam-medis\/data-medis"/)
  assert.match(app, /path="rekam-medis\/data-medis\/kunjungan\/:regpid"/)
  assert.match(list, /Riwayat Kunjungan/)
  assert.match(list, /Lihat Kunjungan/)
  assert.match(list, /data-medis\/kunjungan\/\$\{visit\.regpid\}/)
  assert.doesNotMatch(list, /Detail Kunjungan[\s\S]*panel|drawer|modal/i)

  for (const label of ['Data Medis (SOAP)', 'Diagnosis', 'Tindakan', 'Penunjang', 'Riwayat']) {
    assert.match(detail, new RegExp(label.replace(/[()]/g, '\\$&')))
  }
  for (const label of ['Subjective', 'Objective', 'Assessment', 'Planning']) {
    assert.match(detail, new RegExp(label))
  }
  assert.match(detail, /Belum ada catatan SOAP pada kunjungan ini\./)
  assert.doesNotMatch(detail, /<textarea|<input/)
  assert.match(service, /\/medical-records\/patients/)
  assert.match(service, /\/visits\/\$\{encodeURIComponent\(regpid\)\}\/soap/)
})

test('visit history can be searched by registration number', async () => {
  const list = await read('src/pages/medical-records/DataMedisPage.tsx')

  assert.match(list, /Cari No\. Registrasi/)
  assert.match(list, /visit\.registration_number\.toLowerCase\(\)\.includes/)
  assert.match(list, /filteredVisits\.map/)
})

test('topbar patient search opens Data Medis and automatically loads visits on Enter', async () => {
  const [topbar, dataMedis, service, api, styles] = await Promise.all([
    read('src/components/layout/Topbar.tsx'),
    read('src/pages/medical-records/DataMedisPage.tsx'),
    read('src/services/medicalRecords.ts'),
    read('src/services/api.ts'),
    read('src/styles/theme.css'),
  ])

  assert.match(topbar, /useNavigate/)
  assert.match(topbar, /<form className="search-button"[^>]*onSubmit=\{searchPatient\}/)
  assert.match(topbar, /placeholder="Cari nama atau No\. RM\.\.\."/)
  assert.match(topbar, /search:\s*`\?q=\$\{encodeURIComponent\(query\)\}`/)
  assert.match(dataMedis, /searchParams\.get\('q'\)/)
  assert.match(dataMedis, /medicalRecordsApi\.patients\(querySearch/)
  assert.match(dataMedis, /await medicalRecordsApi\.visits\(matchedPatient\.pid, '', '', controller\.signal\)/)
  assert.match(dataMedis, /setPatient\(visitResponse\.data\.patient\)/)
  assert.match(dataMedis, /setVisits\(visitResponse\.data\.visits\)/)
  assert.match(dataMedis, /const searchRequestId = useRef\(0\)/)
  assert.match(dataMedis, /requestId !== searchRequestId\.current/)
  assert.match(dataMedis, /new URLSearchParams\(window\.location\.search\)\.get\('q'\) !== querySearch/)
  assert.match(dataMedis, /const controller = new AbortController\(\)/)
  assert.match(dataMedis, /controller\.abort\(\)/)
  assert.match(dataMedis, /medicalRecordsApi\.patients\(querySearch, 1, 10, controller\.signal\)/)
  assert.match(service, /patients\(search: string, page = 1, perPage = 10, signal\?: AbortSignal\)/)
  assert.match(api, /AbortSignal\.any\(\[controller\.signal, init\.signal\]\)/)
  assert.doesNotMatch(dataMedis, /if \(!querySearch \|\| selectedPid\) return/)
  assert.match(styles, /\.search-button input\s*\{/)
})

test('SOAP panel distinguishes nurse SOAP entries', async () => {
  const [detail, service] = await Promise.all([
    read('src/pages/medical-records/MedicalVisitDetailPage.tsx'),
    read('src/services/medicalRecords.ts'),
  ])

  assert.match(service, /entry_type: 'doctor' \| 'nurse'/)
  assert.match(service, /'ops_diagnosa'/)
  assert.match(service, /odid\?: number \| null/)
  assert.match(service, /'ops_catper'/)
  assert.match(service, /catperid\?: number \| null/)
  assert.match(detail, /entry\.role_label/)
  assert.match(detail, /soap-entry--\$\{entry\.entry_type\}/)
  assert.match(detail, /SOAP Perawat/)
})

test('Tindakan tab displays grouped existing billing rows read-only', async () => {
  const [detail, service] = await Promise.all([
    read('src/pages/medical-records/MedicalVisitDetailPage.tsx'),
    read('src/services/medicalRecords.ts'),
  ])

  assert.match(service, /export type ProcedureBillingData/)
  assert.match(service, /\/visits\/\$\{encodeURIComponent\(regpid\)\}\/procedures/)
  assert.match(detail, /medicalRecordsApi\.procedures\(regpid\)/)
  assert.match(detail, /activeTab === 'procedures' \? <ProceduresPanel/)
  assert.match(detail, /Rincian Tindakan & Biaya/)
  for (const label of ['Tarif', 'Jumlah', 'Nilai', 'Potongan / Penjamin', 'Tagihan Pasien']) {
    assert.match(detail, new RegExp(label.replace('/', '\\/')))
  }
  assert.match(detail, /formatRupiah/)
  assert.match(detail, /Belum ada tindakan atau rincian biaya pada kunjungan ini\./)
})

test('visit back action is compact and aligned with the patient card', async () => {
  const [detail, theme] = await Promise.all([
    read('src/pages/medical-records/MedicalVisitDetailPage.tsx'),
    read('src/styles/theme.css'),
  ])

  assert.match(detail, /className="back-link visit-back-link"/)
  assert.match(detail, /<ArrowLeft size=\{16\}/)
  assert.match(theme, /\.page-container\.visit-detail-page\s*\{[^}]*padding-top:\s*16px/)
  assert.match(theme, /\.visit-back-link\s*\{[^}]*height:\s*36px[^}]*gap:\s*8px[^}]*margin:\s*0 0 10px[^}]*padding:\s*0 12px/)
  assert.match(theme, /\.visit-back-link\s*\{[^}]*border:\s*0[^}]*border-radius:\s*9px[^}]*background:\s*transparent[^}]*font-size:\s*13px[^}]*font-weight:\s*500/)
  assert.match(theme, /\.visit-back-link\s*\{[^}]*transition:/)
  assert.match(theme, /\.visit-back-link:hover\s*\{[^}]*color:\s*#2563cf[^}]*background:\s*#eef5ff/)
})
