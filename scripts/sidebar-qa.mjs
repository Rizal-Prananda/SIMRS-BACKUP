import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', (error) => errors.push(error.message))
await page.goto('http://127.0.0.1:8014/', { waitUntil: 'networkidle' })

const snapshot = () => page.evaluate(() => ({
  sidebarWidth: Math.round(document.querySelector('.sidebar')?.getBoundingClientRect().width ?? 0),
  contentLeft: Math.round(document.querySelector('.app-main')?.getBoundingClientRect().left ?? 0),
  collapsed: document.querySelector('.app-shell')?.classList.contains('app-shell--collapsed'),
  visibleLabels: [...document.querySelectorAll('.nav-item span')].filter((node) => getComputedStyle(node).display !== 'none').length,
  toggleLabel: document.querySelector('.menu-button--desktop')?.getAttribute('aria-label'),
  toggleIcon: document.querySelector('.menu-button--desktop svg')?.getAttribute('class'),
  overflow: document.documentElement.scrollWidth > innerWidth,
}))

const initial = await snapshot()
await page.locator('.menu-button--desktop').click()
await page.waitForTimeout(300)
const collapsed = await snapshot()
await page.locator('.menu-button--desktop').click()
await page.waitForTimeout(300)
const expanded = await snapshot()

await page.setViewportSize({ width: 390, height: 844 })
await page.waitForTimeout(100)
const mobileBefore = await page.evaluate(() => ({
  desktopToggle: getComputedStyle(document.querySelector('.menu-button--desktop')).display,
  mobileToggle: getComputedStyle(document.querySelector('.menu-button--mobile')).display,
  sidebarLeft: Math.round(document.querySelector('.sidebar')?.getBoundingClientRect().left ?? 0),
  overflow: document.documentElement.scrollWidth > innerWidth,
}))
await page.locator('.menu-button--mobile').click()
await page.waitForTimeout(300)
const mobileAfter = await page.evaluate(() => ({
  sidebarLeft: Math.round(document.querySelector('.sidebar')?.getBoundingClientRect().left ?? 0),
  sidebarWidth: Math.round(document.querySelector('.sidebar')?.getBoundingClientRect().width ?? 0),
}))

console.log(JSON.stringify({ initial, collapsed, expanded, mobileBefore, mobileAfter, errors }, null, 2))
await browser.close()
