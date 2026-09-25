// GET  /api/wall        — newest cards on the shared wall
// POST /api/wall {code} — add your card (explicit consent in the UI); returns a private removal token
import { json, notConfigured, sha256, validateCode, readBody } from '../../server/wall.js'

const HOURLY_LIMIT = 5

export async function onRequestGet({ env, request }) {
  if (!env.DB) return notConfigured()
  const limit = Math.min(120, Math.max(1, Number(new URL(request.url).searchParams.get('limit')) || 60))
  const { results } = await env.DB.prepare('SELECT id, code, created_at FROM wall_cards ORDER BY created_at DESC LIMIT ?').bind(limit).all()
  const { total } = await env.DB.prepare('SELECT COUNT(*) AS total FROM wall_cards').first()
  return json({ total, cards: results }, 200, { 'cache-control': 'public, max-age=20' })
}

export async function onRequestPost({ env, request }) {
  if (!env.DB) return notConfigured()
  const { code } = await readBody(request)
  const { card, error } = validateCode(code)
  if (error) return json({ error }, 422)

  const ip = request.headers.get('cf-connecting-ip') || 'unknown'
  const ipHash = await sha256(`${ip}|${env.WALL_SALT || 'north-quarter'}`)
  const since = Date.now() - 60 * 60 * 1000
  const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM wall_cards WHERE ip_hash = ? AND created_at > ?').bind(ipHash, since).first()
  if (recent.n >= HOURLY_LIMIT) return json({ error: 'rate-limited' }, 429)

  const existing = await env.DB.prepare('SELECT id FROM wall_cards WHERE number = ?').bind(card.number).first()
  if (existing) return json({ error: 'already-on-wall' }, 409)

  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
  const token = crypto.randomUUID()
  const now = Date.now()
  await env.DB.prepare('INSERT INTO wall_cards (id, code, family, number, created_at, updated_at, token_hash, ip_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, code, card.family, card.number, now, now, await sha256(token), ipHash).run()
  return json({ id, token, number: card.number }, 201)
}
