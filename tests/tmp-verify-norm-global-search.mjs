import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const browserErrors = []
page.on('pageerror', (error) => browserErrors.push(`pageerror: ${error.message}`))
page.on('console', (message) => message.type() === 'error' && browserErrors.push(`console: ${message.text()}`))
let patientRequests = 0
let visitRequests = 0
await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { login_id: 1, login_name: 'rizal.prananda', name_real: 'Rizal Prananda', name_family: '' } }) }))
await page.route('**/api/medical-records/**', async (route) => {
  const url = new URL(route.request().url())
  if (url.pathname.endsWith('/patients')) {
    patientRequests++
    await new Promise((resolve) => setTimeout(resolve, 120))
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ pid: 16786, name: 'TEST PATIENT', medical_record_number: '00-01-67-86', date_of_birth: '1 Jan 2000', sex: 'Laki-laki' }], meta: { current_page: 1, last_page: 1, per_page: 10, total: 1 } }) })
  }
  if (url.pathname.endsWith('/patients/16786/visits')) {
    visitRequests++
    await new Promise((resolve) => setTimeout(resolve, 120))
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { patient: { pid: 16786, medical_record_number: '00-01-67-86', name: 'TEST PATIENT', national_id: '-', date_of_birth: '1 Jan 2000', age: '26 tahun', sex: 'Laki-laki' }, visits: [{ regpid: '999', registration_number: '2501010001', visit_date: '1 Jan 2025', department: 'Poli', doctor: 'Dokter', guarantor: 'UMUM', status: 'Selesai' }] } }) })
  }
  return route.continue()
})

await page.goto('http://100.20.30.55:8014', { waitUntil: 'networkidle' })
if (await page.locator('.search-button input').count() === 0) {
  console.error(JSON.stringify({ url: page.url(), title: await page.title(), body: (await page.locator('body').innerText()).slice(0, 1000), browserErrors, html: (await page.content()).slice(0, 1000) }))
  process.exit(2)
}
await page.locator('.search-button input').fill('00-01-67-86')
await page.locator('.search-button').press('Enter')
await page.getByText('TEST PATIENT', { exact: true }).first().waitFor({ timeout: 5000 })
const result = {
  url: page.url(),
  patientRequests,
  visitRequests,
  stuckHistorySpinner: await page.getByText('Memuat riwayat pasien', { exact: true }).count(),
  patientVisible: await page.getByText('TEST PATIENT', { exact: true }).count(),
  visitVisible: await page.getByText('2501010001', { exact: true }).count(),
}
console.log(JSON.stringify(result))
if (result.stuckHistorySpinner || !result.patientVisible || !result.visitVisible) process.exitCode = 1
await browser.close()
