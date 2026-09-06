import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')

test('sidebar uses semantic icons and polished navigation structure', async () => {
  const [navigation, sidebar, styles] = await Promise.all([
    read('src/routes/navigation.ts'),
    read('src/components/layout/Sidebar.tsx'),
    read('src/styles/theme.css'),
  ])

  for (const icon of ['UsersRound', 'FileHeart', 'UserRoundCog', 'Building2']) {
    assert.match(navigation, new RegExp(`icon: ${icon}`))
  }
  assert.match(sidebar, /className="nav-item__icon"/)
  assert.match(sidebar, /className="nav-child__icon"/)
  assert.match(sidebar, /groupActive \? 'nav-item--section-active' : ''/)
  assert.doesNotMatch(sidebar, /groupActive \? 'nav-item--active' : ''/)
  assert.match(sidebar, /activeChildPath/)
  assert.match(sidebar, /child\.path === activeChildPath/)
  assert.doesNotMatch(sidebar, /className=\{\(\{ isActive \}\) => `nav-child/)
  assert.doesNotMatch(sidebar, /<i \/><span>\{child\.label\}/)
  assert.match(styles, /\.nav-child__icon/)
  assert.match(styles, /\.nav-children::before/)
  assert.match(styles, /\.app-shell--collapsed \.nav-item > span:not\(\.nav-item__icon\)/)
  assert.doesNotMatch(styles, /\.app-shell--collapsed \.nav-item span\s*\{/)
})
