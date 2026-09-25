/* Pure record logic, shared by the app and the Cloudflare functions (OG image, wall API). */
export const RESOLVE_AT = 3
export const FAMILY_TITLE = { reader: 'READER', maker: 'MAKER', seeker: 'SEEKER', local: 'LOCAL' }

export function familyOfAction(id) {
  if (id.startsWith('stacks')) return 'reader'
  if (id.startsWith('workshop')) return 'maker'
  if (id.startsWith('index')) return 'seeker'
  if (id.startsWith('quarter')) return 'local'
  return null
}

// The accession number is fixed at the moment of issue: the visit's start time
// plus the three marks that resolved the record. Same library, different residue.
export function hashString(input) {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function getAccessionNumber(record) {
  if (record.actions.length < RESOLVE_AT) return 'NQ / OPEN'
  const seed = `${record.startedAt || 0}|${record.actions.slice(0, RESOLVE_AT).join(',')}`
  const n = String(hashString(seed) % 1000000).padStart(6, '0')
  return `NQ ${n.slice(0, 3)} ${n.slice(3)}`
}

export function formatIssueDate(ts) {
  const date = ts ? new Date(ts) : new Date()
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`
}

export function getFamilyScores(actions) {
  const score = { reader: 0, maker: 0, seeker: 0, local: 0 }
  actions.forEach((id) => {
    const family = familyOfAction(id)
    if (family) score[family] += 1
  })
  return score
}

export function getOutcome(actions) {
  const score = getFamilyScores(actions)
  const maxScore = Math.max(...Object.values(score))
  if (maxScore <= 0) return 'reader'
  const leaders = Object.keys(score).filter((family) => score[family] === maxScore)
  if (leaders.length === 1) return leaders[0]
  // Ties belong to the most recent behaviour, never to object-key order.
  for (let index = actions.length - 1; index >= 0; index -= 1) {
    const family = familyOfAction(actions[index])
    if (family && leaders.includes(family)) return family
  }
  return leaders[0]
}
