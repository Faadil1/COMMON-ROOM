import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const base = (process.env.TARGET_URL || 'http://127.0.0.1:5173').replace(/\/$/, '')
const outDir = fileURLToPath(new URL('../../public/video-captures/', import.meta.url))

await fs.mkdir(outDir, { recursive: true })

function outputPath(file) {
  return path.join(outDir, file)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })

const record = {
  actions: ['index-021', 'index-114', 'index-403', 'stacks-essay', 'workshop-stock', 'quarter-market'],
  secrets: ['curiosity', 'borrower'],
  name: 'Demo Visitor',
  signature: [],
  startedAt: Date.now() - 34 * 86400000,
  issuedAt: Date.now() - 33 * 86400000,
  stampSeen: true,
  times: {},
  visits: [Date.now() - 33 * 86400000, Date.now() - 20 * 86400000, Date.now() - 8 * 86400000, Date.now()],
  wall: null,
}

// Inject the deterministic record before the app boots on every navigation.
await page.addInitScript(({ key, value }) => {
  localStorage.setItem(key, JSON.stringify(value))
}, { key: 'common-room-member-record-v2', value: record })

function filmUrl(route) {
  const url = new URL(base + route)
  url.searchParams.set('flat', '1')
  return url.toString()
}

async function capture(path, file, selector) {
  await page.goto(filmUrl(path), { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {})
  await page.waitForTimeout(1400)
  if (selector) {
    const target = page.locator(selector).first()
    try {
      await target.waitFor({ state: 'visible', timeout: 15000 })
    } catch (error) {
      await page.screenshot({ path: outputPath('DEBUG-' + file), fullPage: true }).catch(() => {})
      console.error('Capture failed', { route: path, selector, url: page.url() })
      throw error
    }
    await target.screenshot({ path: outputPath(file) })
  } else {
    await page.screenshot({ path: outputPath(file), fullPage: false })
  }
}


await capture('/stacks', 'room-stacks.png', '.rm-stacks')
await capture('/workshop', 'room-workshop.png', '.rm-workshop')
await capture('/index', 'room-index.png', '.rm-index')
await capture('/quarter', 'room-quarter.png', '.rm-quarter')
await capture('/record', '01-member-record.png', '.record-object')
await capture('/record', '02-member-lens.png', '.card-lens-stage')
await capture('/cards', '03-card-object.png', '.lc-board-grid')

// Isolate one real SEEKER card as a hero object, then flip the same DOM object for its back.
await page.goto(filmUrl('/cards'), { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {})
await page.waitForTimeout(1200)
const seekerFigure = page.locator('.lc-board-grid figure').nth(2)
const seekerCard = seekerFigure.locator('.lc-object').first()
await seekerCard.waitFor({ state: 'visible', timeout: 15000 })
const frontFace = seekerFigure.locator('.lc-face-front .lc-svg').first()
await frontFace.waitFor({ state: 'visible', timeout: 15000 })
await frontFace.screenshot({ path: outputPath('card-seeker-front.png') })
const flip = seekerFigure.locator('.lc-flip').first()
if (await flip.count()) {
  await flip.click()
  await page.waitForTimeout(850)
  const backFace = seekerFigure.locator('.lc-face-back .lc-svg').first()
  await backFace.waitFor({ state: 'visible', timeout: 15000 })
  await backFace.screenshot({ path: outputPath('card-seeker-back.png') })
}

await capture('/collection', '04-living-collection.png', '.nq-wall')

await page.goto(filmUrl('/collection'), { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {})
const reveal = page.getByRole('button', { name: /REVEAL THE QUARTER/i }).first()
if (await reveal.count()) {
  await reveal.click()
  await page.waitForTimeout(1400)
}
const quarter = page.locator('.collection-quarter').first()
if (await quarter.count()) {
  await quarter.screenshot({ path: outputPath('05-quarter.png') })
} else {
  await page.screenshot({ path: outputPath('05-quarter.png') })
}

await browser.close()
console.log('Clean product captures written to public/video-captures/')
