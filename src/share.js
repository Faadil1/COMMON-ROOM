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

export function encodeCard(record) {
  const payload = {
    a: record.actions.map((id) => ACTION_IDS.indexOf(id).toString(16)).join(''),
    s: SECRET_IDS.reduce((mask, id, i) => (record.secrets.includes(id) ? mask | (1 << i) : mask), 0),
    t: (record.startedAt || 0).toString(36),
    i: (record.issuedAt || 0).toString(36),
    n: record.name || '',
    g: packSignature(record.signature),
  }
  return b64u(new TextEncoder().encode(JSON.stringify(payload)))
}

export function decodeCard(code) {
  try {
    const p = JSON.parse(new TextDecoder().decode(unb64u(code)))
    const actions = [...String(p.a || '')].map((c) => ACTION_IDS[parseInt(c, 16)]).filter(Boolean)
    const unique = [...new Set(actions)]
    return {
      actions: unique,
      secrets: SECRET_IDS.filter((_, i) => (Number(p.s) || 0) & (1 << i)),
      startedAt: parseInt(p.t || '0', 36) || null,
      issuedAt: parseInt(p.i || '0', 36) || null,
      name: String(p.n || '').slice(0, 28),
      signature: unpackSignature(p.g),
      times: {},
      stampSeen: true,
    }
  } catch {
    return null
  }
}
