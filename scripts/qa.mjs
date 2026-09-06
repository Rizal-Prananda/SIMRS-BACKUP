import { chromium } from 'playwright'
import fs from 'node:fs'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const errors = []
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`) })
page.on('pageerror', (err) => errors.push(`page: ${err.message}`))
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
const home = await page.evaluate(() => {
  const box = (s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r ? { x:r.x, y:r.y, width:r.width, height:r.height } : null }
  return {
    title: document.title,
    heading: document.querySelector('.hero-content h2')?.textContent?.trim(),
    navCount: document.querySelectorAll('.nav-item').length,
    activeNav: document.querySelector('.nav-item--active')?.textContent?.trim(),
    sidebar: box('.sidebar'), topbar: box('.topbar'), hero: box('.hero-panel'),
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    monitoringDataOnHome: !!document.querySelector('canvas, table, .chart, .stat-card, .monitoring-widget'),
  }
})
await page.screenshot({ path: 'dataguard-home-desktop.png', fullPage: true })
const routes = ['/dashboard','/database','/backup','/restore-readiness','/server','/integrations','/alerts','/logs','/reports','/settings']
const checks = []
for (const path of routes) {
  await page.goto(`http://localhost:4173${path}`, { waitUntil: 'networkidle' })
  checks.push({ path, heading: await page.locator('.page-heading h2').textContent(), active: (await page.locator('.nav-item--active').textContent())?.trim(), placeholder: await page.locator('.placeholder-panel').count() })
}
await page.setViewportSize({ width: 1024, height: 768 })
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
const laptop = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, sidebarWidth: document.querySelector('.sidebar')?.getBoundingClientRect().width, heroVisible: !!document.querySelector('.hero-panel') }))
await page.setViewportSize({ width: 390, height: 844 })
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
await page.locator('.menu-button').click()
await page.waitForTimeout(300)
const mobile = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, menuVisible: getComputedStyle(document.querySelector('.menu-button')).display !== 'none', sidebarLeft: document.querySelector('.sidebar')?.getBoundingClientRect().left }))
fs.writeFileSync('qa-results.json', JSON.stringify({ home, routes: checks, laptop, mobile, errors }, null, 2))
await browser.close()
console.log(JSON.stringify({ home, routes: checks, laptop, mobile, errors }, null, 2))
