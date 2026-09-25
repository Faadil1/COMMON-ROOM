/* Shared helpers for the Living Collection API (Cloudflare D1 binding: DB). */
import { decodeCard } from '../src/share.js'
import { RESOLVE_AT, getAccessionNumber, getOutcome } from '../src/recordLogic.js'

export const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
})

export const notConfigured = () => json({ error: 'wall-not-configured', message: 'The shared wall is not switched on yet.' }, 503)

export async function sha256(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const LINKISH = /(https?:|www\.|\.[a-z]{2,}\/|@[a-z0-9_]{3,})/i

// Returns { card } or { error } — only complete, well-formed cards can go on the wall.
export function validateCode(code) {
  if (typeof code !== 'string' || code.length < 8 || code.length > 2400) return { error: 'invalid-code' }
  const record = decodeCard(code)
  if (!record || record.actions.length < RESOLVE_AT) return { error: 'invalid-code' }
  if (record.name && (LINKISH.test(record.name) || /[\u0000-\u001f<>]/.test(record.name))) return { error: 'name-not-allowed' }
  return { card: { record, family: getOutcome(record.actions), number: getAccessionNumber(record) } }
}

export async function readBody(request) {
  try { return await request.json() } catch { return {} }
}
