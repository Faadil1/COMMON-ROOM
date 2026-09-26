import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const base = (process.env.TARGET_URL || 'http://127.0.0.1:5173').replace(/\/$/, '')
const outDir = fileURLToPath(new URL('../captures/', import.meta.url))

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

async function seed() {
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  await page.evaluate((value) => {
    localStorage.setItem('common-room-member-record-v2', JSON.stringify(value))
  }, record)
}

async function capture(path, file, selector) {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  if (selector) {
    const target = page.locator(selector).first()
    await target.waitFor({ state: 'visible', timeout: 10000 })
    await target.screenshot({ path: outputPath(file) })
  } else {
    await page.screenshot({ path: outputPath(file), fullPage: false })
  }
}

await seed()
await capture('/record', '01-member-record.png', '.record-object')
await capture('/record', '02-member-lens.png', '#member-lens')
await capture('/cards', '03-card-object.png')
await capture('/collection', '04-living-collection.png')

await page.goto(base + '/collection', { waitUntil: 'networkidle' })
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
console.log('Clean product captures written to video/captures/')
