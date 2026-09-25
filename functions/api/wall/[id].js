// PUT    /api/wall/:id {code} — update your card (new signature, name…)  — needs x-wall-token
// DELETE /api/wall/:id                                                   — take your card down — needs x-wall-token
import { json, notConfigured, sha256, validateCode, readBody } from '../../../server/wall.js'

async function authorise(env, request, id) {
  const token = request.headers.get('x-wall-token') || ''
  const row = await env.DB.prepare('SELECT id, number, token_hash FROM wall_cards WHERE id = ?').bind(id).first()
  if (!row) return { status: 404 }
  if (!token || (await sha256(token)) !== row.token_hash) return { status: 403 }
  return { row }
}

export async function onRequestPut({ env, request, params }) {
  if (!env.DB) return notConfigured()
  const auth = await authorise(env, request, params.id)
  if (!auth.row) return json({ error: auth.status === 404 ? 'not-found' : 'forbidden' }, auth.status)
  const { code } = await readBody(request)
  const { card, error } = validateCode(code)
  if (error) return json({ error }, 422)
  if (card.number !== auth.row.number) return json({ error: 'different-card' }, 409)
  await env.DB.prepare('UPDATE wall_cards SET code = ?, family = ?, updated_at = ? WHERE id = ?').bind(code, card.family, Date.now(), params.id).run()
  return json({ ok: true })
}

export async function onRequestDelete({ env, request, params }) {
  if (!env.DB) return notConfigured()
  const auth = await authorise(env, request, params.id)
  if (!auth.row) return json({ error: auth.status === 404 ? 'not-found' : 'forbidden' }, auth.status)
  await env.DB.prepare('DELETE FROM wall_cards WHERE id = ?').bind(params.id).run()
  return json({ ok: true })
}
