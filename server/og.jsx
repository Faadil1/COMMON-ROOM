/* Server-side preview image for a shared card (1200 × 630, used as og:image).
   Renders the same CardFront component as the site, then rasterises it with resvg. */
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CardFront, W, H } from '../src/cardArt.jsx'
import { decodeCard } from '../src/share.js'
import { RESOLVE_AT, FAMILY_TITLE, getAccessionNumber, formatIssueDate, getOutcome } from '../src/recordLogic.js'

export const OG_FONTS = [
  'Newsreader_400Regular.ttf', 'Newsreader_400Regular_Italic.ttf', 'Newsreader_500Medium.ttf', 'Newsreader_600SemiBold.ttf',
  'PublicSans_500Medium.ttf', 'PublicSans_600SemiBold.ttf', 'PublicSans_700Bold.ttf', 'PublicSans_800ExtraBold.ttf', 'PublicSans_900Black.ttf',
  'CourierPrime_400Regular.ttf', 'CourierPrime_700Bold.ttf',
]

const BG = { reader: '#1c1210', maker: '#1d1812', seeker: '#0f1726', local: '#0f1a15' }
const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export function describeCard(code) {
  const record = decodeCard(code)
  if (!record || record.actions.length < RESOLVE_AT) return null
  const family = getOutcome(record.actions)
  const number = getAccessionNumber(record)
  const issued = formatIssueDate(record.issuedAt)
  const first = record.name ? record.name.split(' ')[0] : ''
  return {
    record,
    family,
    number,
    issued,
    title: first ? `${first}’s North Quarter library card — ${FAMILY_TITLE[family]}` : `A North Quarter library card — ${FAMILY_TITLE[family]}`,
    description: `Accessioned ${issued}. ${record.actions.length} marks, ${record.secrets.length} hidden trace${record.secrets.length === 1 ? '' : 's'}. You don’t receive a card at COMMON ROOM — you accumulate one.`,
  }
}

export function cardSvg(info) {
  const { record, family, number, issued } = info
  const owner = { name: record.name, signature: record.signature, number, issued }
  let card = renderToStaticMarkup(<CardFront family={family} actions={record.actions} secrets={record.secrets} owner={owner} stamp />)
  const cw = 700
  const ch = Math.round(cw * (H / W))
  const cx = 1200 - cw - 44
  const cy = Math.round((630 - ch) / 2)
  card = card.replace('<svg ', `<svg x="${cx}" y="${cy}" width="${cw}" height="${ch}" `)
  const first = record.name ? record.name.split(' ')[0] : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="og-glow" cx=".68" cy=".5" r=".6"><stop offset="0" stop-color="#f7f3ea" stop-opacity=".12"/><stop offset="1" stop-color="#f7f3ea" stop-opacity="0"/></radialGradient>
    <filter id="og-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#000" flood-opacity=".6"/></filter>
  </defs>
  <rect width="1200" height="630" fill="${BG[family]}"/>
  <rect width="1200" height="630" fill="url(#og-glow)"/>
  <text x="56" y="84" font-family="Public Sans" font-weight="700" font-size="15" letter-spacing="4" fill="#f7f3ea" fill-opacity=".62">COMMON ROOM</text>
  <text x="56" y="106" font-family="Public Sans" font-weight="500" font-size="13" letter-spacing="3" fill="#f7f3ea" fill-opacity=".45">NORTH QUARTER PUBLIC LIBRARY</text>
  <text x="56" y="250" font-family="Newsreader" font-weight="500" font-size="54" fill="#f7f3ea">${esc(first ? `${first}’s` : 'A member’s')}</text>
  <text x="56" y="306" font-family="Newsreader" font-style="italic" font-size="54" fill="#f7f3ea">library card.</text>
  <text x="56" y="366" font-family="Public Sans" font-weight="800" font-size="15" letter-spacing="3" fill="#f7f3ea" fill-opacity=".7">${esc(FAMILY_TITLE[family])} · ${esc(number)}</text>
  <text x="56" y="560" font-family="Newsreader" font-style="italic" font-size="21" fill="#f7f3ea" fill-opacity=".72">You don’t receive a card.</text>
  <text x="56" y="588" font-family="Newsreader" font-style="italic" font-size="21" fill="#f7f3ea" fill-opacity=".72">You accumulate one.</text>
  <g filter="url(#og-shadow)" transform="rotate(-3 ${cx + cw / 2} ${cy + ch / 2})">${card}</g>
</svg>`
}

// resvg is passed in so the same code runs in Node (tests) and in the Cloudflare function.
export function renderPng(Resvg, svg, fontBuffers) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: { fontBuffers, loadSystemFonts: false, defaultFontFamily: 'Public Sans' },
  })
  return resvg.render().asPng()
}
