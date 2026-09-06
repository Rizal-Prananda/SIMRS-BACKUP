import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:8014/', { waitUntil: 'networkidle' })
const loginPage = page.locator('.login-page')
if (await loginPage.count() !== 1) {
  throw new Error('Login page is not protecting the application')
}
if ((await page.locator('.login-panel h1').textContent())?.trim() !== 'Masuk ke DataGuard') {
  throw new Error('Login heading is missing')
}
console.log('Login page protection is active')
await browser.close()
