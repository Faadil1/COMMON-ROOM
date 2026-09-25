/* A card that travels as a link: the visit is encoded in the URL, no server involved. */
export const ACTION_IDS = [
  'stacks-fiction', 'stacks-essay', 'stacks-poetry',
  'workshop-align', 'workshop-stock', 'workshop-ink',
  'index-021', 'index-114', 'index-403',
  'quarter-market', 'quarter-school', 'quarter-river',
]
export const SECRET_IDS = ['borrower', 'imperfection', 'curiosity', 'before']

const b64u = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const unb64u = (text) => Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))

function packSignature(strokes = []) {
  const out = []
  let budget = 420
  strokes.slice(0, 20).forEach((stroke) => {
    let last = null
    stroke.forEach(([x, y]) => {
      if (budget <= 0) return
      const px = Math.max(0, Math.min(200, Math.round(x / 2)))
      const py = Math.max(0, Math.min(60, Math.round(y / 2)))
      if (last && Math.hypot(px - last[0], py - last[1]) < 2) return
      out.push(px, py)
      last = [px, py]
      budget -= 1
    })
    out.push(255)
  })
  return out.length ? b64u(Uint8Array.from(out)) : ''
}

function unpackSignature(text) {
  if (!text) return []
  const bytes = unb64u(text)
  const strokes = []
  let current = []
  for (let i = 0; i < bytes.length; i += 1) {
    if (bytes[i] === 255) { if (current.length) strokes.push(current); current = []; continue }
    current.push([bytes[i] * 2, bytes[i + 1] * 2])
    i += 1
  }
  if (current.length) strokes.push(current)
  return strokes
}

// Compact code: 1<actions hex>.<secret mask>.<started b36>.<issued b36>.<name b64u>[.<signature>]
// Short enough for a QR code on a printed card when the signature is left out.
export function encodeCard(record, { signature = true } = {}) {
  const parts = [
    `1${record.actions.map((id) => ACTION_IDS.indexOf(id).toString(16)).join('')}`,
    SECRET_IDS.reduce((mask, id, i) => (record.secrets.includes(id) ? mask | (1 << i) : mask), 0).toString(16),
    (record.startedAt || 0).toString(36),
    (record.issuedAt || 0).toString(36),
    record.name ? b64u(new TextEncoder().encode(record.name)) : '',
  ]
  const sig = signature ? packSignature(record.signature) : ''
  if (sig) parts.push(sig)
  return parts.join('.')
}

function decodeLegacy(code) {
  const p = JSON.parse(new TextDecoder().decode(unb64u(code)))
  return { a: String(p.a || ''), s: Number(p.s) || 0, t: p.t, i: p.i, n: String(p.n || ''), g: p.g }
}

function decodeCompact(code) {
  const [head, s, t, i, n, g] = code.split('.')
  return { a: head.slice(1), s: parseInt(s || '0', 16) || 0, t, i, n: n ? new TextDecoder().decode(unb64u(n)) : '', g }
}

export function decodeCard(code) {
  try {
    const p = /^1[0-9a-f]*\./.test(code) ? decodeCompact(code) : decodeLegacy(code)
    const actions = [...new Set([...p.a].map((c) => ACTION_IDS[parseInt(c, 16)]).filter(Boolean))]
    return {
      actions,
      secrets: SECRET_IDS.filter((_, i) => p.s & (1 << i)),
      startedAt: parseInt(p.t || '0', 36) || null,
      issuedAt: parseInt(p.i || '0', 36) || null,
      name: p.n.slice(0, 28),
      signature: unpackSignature(p.g),
      times: {},
      visits: [],
      stampSeen: true,
    }
  } catch {
    return null
  }
}

export function shareUrl(record, options) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://common-room-2l0.pages.dev'
  return `${origin}/card/${encodeCard(record, options)}`
}
