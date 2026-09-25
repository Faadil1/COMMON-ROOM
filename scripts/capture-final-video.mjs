import { chromium } from 'playwright'
import fs from 'node:fs'

const base = (process.env.TARGET_URL || 'https://living-collection.common-room-2l0.pages.dev').replace(/\/$/, '')
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const browser = await chromium.launch({
  headless: true,
  args: [
    '--use-angle=swiftshader',
    '--use-gl=angle',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--disable-dev-shm-usage',
    '--autoplay-policy=no-user-gesture-required',
  ],
})

const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  recordVideo: { dir: 'video-raw', size: { width: 1600, height: 900 } },
  permissions: ['clipboard-read', 'clipboard-write'],
})

const page = await context.newPage()
const video = page.video()
let wallRef = null

async function goto(path) {
  await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {})
}

async function nav(label, path) {
  const button = page.getByRole('button', { name: label, exact: true }).first()
  try {
    await button.click({ timeout: 3500 })
  } catch {
    await goto(path)
  }
  await sleep(900)
}

try {
  await goto('/')
  await page.evaluate(() => localStorage.removeItem('common-room-member-record-v2'))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await sleep(2800)

  // The institution first: four rooms, four ways to leave evidence.
  await nav('STACKS', '/stacks')
  await page.mouse.wheel(0, 520)
  await sleep(2300)

  await nav('WORKSHOP', '/workshop')
  await page.mouse.wheel(0, 360)
  await sleep(2400)

  await nav('INDEX', '/index')
  await page.mouse.wheel(0, 420)
  await sleep(2400)

  await nav('QUARTER', '/quarter')
  await page.mouse.wheel(0, 360)
  await sleep(2400)

  // Seed a deterministic, genuinely valid resolved visit so the film can focus
  // on the finished object instead of replaying every interaction.
  await page.evaluate(() => {
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000
    const startedAt = now - 34 * day
    const issuedAt = startedAt + 60 * 60 * 1000
    const record = {
      actions: ['index-021', 'index-114', 'index-403', 'stacks-essay', 'workshop-stock', 'quarter-market'],
      secrets: ['curiosity', 'borrower'],
      name: 'Demo Visitor',
      signature: [],
      startedAt,
      issuedAt,
      stampSeen: false,
      times: {
        'index-021': issuedAt,
        'index-114': issuedAt + 90_000,
        'index-403': issuedAt + 180_000,
        'stacks-essay': issuedAt + 270_000,
        'workshop-stock': issuedAt + 360_000,
        'quarter-market': issuedAt + 450_000,
      },
      visits: [issuedAt, issuedAt + 9 * day, issuedAt + 22 * day, now],
      wall: null,
    }
    localStorage.setItem('common-room-member-record-v2', JSON.stringify(record))
  })

  await goto('/record')
  await sleep(3200)

  // Show the card as a real object. Drag, then flip to its QR/date-slip back.
  const stage = page.locator('.lc3d-stage').first()
  if (await stage.count()) {
    const box = await stage.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width * 0.46, box.y + box.height * 0.48)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width * 0.63, box.y + box.height * 0.38, { steps: 18 })
      await page.mouse.up()
      await sleep(1700)
      await page.mouse.click(box.x + box.width * 0.52, box.y + box.height * 0.5)
      await sleep(3300)
      await page.mouse.click(box.x + box.width * 0.52, box.y + box.height * 0.5)
      await sleep(1200)
    }
  } else {
    await sleep(5200)
  }

  // The share link is part of the object lifecycle.
  const share = page.getByRole('button', { name: /Share your card/i }).first()
  if (await share.count()) {
    await share.click().catch(() => {})
    await sleep(1900)
  }

  // The aperture becomes an instrument: Member Lens.
  const lensButton = page.getByRole('button', { name: /Member Lens/i }).first()
  if (await lensButton.count()) {
    await lensButton.click()
    await sleep(2200)
    const lens = page.locator('.card-lens-stage').first()
    if (await lens.count()) {
      const box = await lens.boundingBox()
      if (box) {
        await page.mouse.move(box.x + box.width * 0.67, box.y + box.height * 0.55)
        await page.mouse.down()
        await page.mouse.move(box.x + box.width * 0.34, box.y + box.height * 0.42, { steps: 22 })
        await page.mouse.up()
      }
    }
    await sleep(2200)
  }

  // Opt in to the real D1-backed wall, capture the live result, then clean it up.
  const consent = page.locator('.nq-wallconsent').first()
  if (await consent.count()) {
    await consent.scrollIntoViewIfNeeded()
    await sleep(1200)
    const checkbox = consent.locator('input[type="checkbox"]')
    if (await checkbox.count()) await checkbox.check()
    const add = consent.getByRole('button', { name: /Add my card to the wall/i }).first()
    if (await add.count()) {
      await add.click()
      await page.getByText('Your card is on the Living Collection wall.').waitFor({ timeout: 12000 }).catch(() => {})
      await sleep(2400)
      wallRef = await page.evaluate(() => {
        try {
          const r = JSON.parse(localStorage.getItem('common-room-member-record-v2') || '{}')
          return r.wall || null
        } catch { return null }
      })
    }
  }

  await goto('/collection')
  await sleep(4700)

  const reveal = page.getByRole('button', { name: /REVEAL THE QUARTER/i }).first()
  if (await reveal.count()) {
    await reveal.click()
    await sleep(4700)
  }

  await goto('/making-of')
  await sleep(5200)
} finally {
  const output = 'video-raw/capture.webm'
  await context.close().catch(() => {})
  await browser.close().catch(() => {})

  const source = await video?.path().catch(() => null)
  if (source && source !== output) {
    fs.mkdirSync('video-raw', { recursive: true })
    fs.copyFileSync(source, output)
  }

  if (wallRef?.id && wallRef?.token) {
    try {
      const res = await fetch(`${base}/api/wall/${wallRef.id}`, {
        method: 'DELETE',
        headers: { 'x-wall-token': wallRef.token },
      })
      console.log('Temporary wall card cleanup:', res.status)
    } catch (error) {
      console.warn('Temporary wall card cleanup failed:', error.message)
    }
  }
}
