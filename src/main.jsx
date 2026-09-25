import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowRight, Download, Eraser, RotateCcw } from 'lucide-react'
import { toPng } from 'html-to-image'
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import '@fontsource/public-sans/400.css'
import '@fontsource/public-sans/500.css'
import '@fontsource/public-sans/600.css'
import '@fontsource/public-sans/700.css'
import './styles.css'
import './refinement.css'
import './rooms.css'
import './memorability.css'
import './record.css'
import '@fontsource/courier-prime/400.css'
import '@fontsource/courier-prime/700.css'
import '@fontsource/public-sans/800.css'
import '@fontsource/public-sans/900.css'
import './cards.css'
import { CardFront, CardBack, CardObject, backEntries } from './cardArt.jsx'

const Card3D = lazy(() => import('./card3d.jsx'))
function supports3D() {
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
    if (new URLSearchParams(window.location.search).has('flat')) return false
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch { return false }
}

const FAMILY = {
  reader: {
    title: 'READER',
    accent: '#7B332F',
    statement: 'For the ones who always return to the page.',
    code: 'NQ 028417',
    edition: '017 / 500',
    detail: 'MARGIN / 213',
  },
  maker: {
    title: 'MAKER',
    accent: '#94452F',
    statement: 'For the ones who use the library to make things.',
    code: 'NQ 034719',
    edition: '046 / 500',
    detail: 'REGISTER / 04',
  },
  seeker: {
    title: 'SEEKER',
    accent: '#26374B',
    statement: 'For the ones who come looking for more.',
    code: 'NQ 618320',
    edition: '109 / 500',
    detail: 'INDEX / 72.4',
  },
  local: {
    title: 'LOCAL',
    accent: '#3F614D',
    statement: 'For the ones who see the library as part of home.',
    code: 'NQ 271904',
    edition: '221 / 500',
    detail: '45.4215° N',
  },
}

const ACTIONS = {
  'stacks-fiction': { family: 'reader', glyph: '¶', label: 'Margin / Fiction' },
  'stacks-essay': { family: 'reader', glyph: '❧', label: 'Margin / Essay' },
  'stacks-poetry': { family: 'reader', glyph: '§', label: 'Margin / Poetry' },
  'workshop-align': { family: 'maker', glyph: '⌗', label: 'Registration / Aligned' },
  'workshop-stock': { family: 'maker', glyph: '▧', label: 'Stock / Uncoated' },
  'workshop-ink': { family: 'maker', glyph: '╳', label: 'Ink / Overprint' },
  'index-021': { family: 'seeker', glyph: '⌖', label: 'Index / 021' },
  'index-114': { family: 'seeker', glyph: '✦', label: 'Index / 114' },
  'index-403': { family: 'seeker', glyph: '→', label: 'Index / 403' },
  'quarter-market': { family: 'local', glyph: '⌑', label: 'Quarter / Market' },
  'quarter-school': { family: 'local', glyph: '◎', label: 'Quarter / School' },
  'quarter-river': { family: 'local', glyph: '≈', label: 'Quarter / River' },
}

const SECRETS = {
  borrower: { family: 'reader', glyph: '1978', label: 'Borrower card / 1978' },
  imperfection: { family: 'maker', glyph: '+2', label: 'Registered imperfection' },
  curiosity: { family: 'seeker', glyph: '000', label: 'Found through curiosity' },
  before: { family: 'local', glyph: '45°', label: 'The room before the library' },
}

const ROUTES = [
  { path: '/', short: 'COMMON', label: 'Common Room' },
  { path: '/stacks', short: 'STACKS', label: 'The Stacks' },
  { path: '/workshop', short: 'WORKSHOP', label: 'The Workshop' },
  { path: '/index', short: 'INDEX', label: 'The Index' },
  { path: '/quarter', short: 'QUARTER', label: 'The Quarter' },
  { path: '/record', short: 'RECORD', label: 'Member Record' },
  { path: '/collection', short: 'COLLECTION', label: 'Living Collection' },
]

const TRANSITIONS = {
  '/stacks': ['SHELF', 'MARGIN'],
  '/workshop': ['MARK', 'REGISTER'],
  '/index': ['QUESTION', 'REFERENCE'],
  '/quarter': ['ADDRESS', 'MEMORY'],
  '/record': ['TRACE', 'RECORD'],
  '/collection': ['MEMBER', 'COLLECTION'],
  '/': ['RETURN', 'COMMON'],
}

const ROOM_FAMILY = {
  '/stacks': 'reader',
  '/workshop': 'maker',
  '/index': 'seeker',
  '/quarter': 'local',
}

function nextRoom(record) {
  const visited = new Set(record.actions.map((id) => ACTIONS[id]?.family))
  const room = Object.keys(ROOM_FAMILY).find((path) => !visited.has(ROOM_FAMILY[path]))
  return room || '/record'
}

const TRACE_FORM = {
  '/stacks': 'margin',
  '/workshop': 'register',
  '/index': 'reference',
  '/quarter': 'street',
  '/record': 'card',
  '/collection': 'city',
  '/': 'return',
}

const STORAGE_KEY = 'common-room-member-record-v2'

const EMPTY_RECORD = { actions: [], secrets: [], name: '', signature: [], startedAt: null, issuedAt: null, stampSeen: false, times: {} }
const RESOLVE_AT = 3

function safeLoadRecord() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const actions = Array.isArray(stored.actions) ? stored.actions.filter((id) => ACTIONS[id]) : []
    return {
      ...EMPTY_RECORD,
      actions,
      secrets: Array.isArray(stored.secrets) ? stored.secrets.filter((id) => SECRETS[id]) : [],
      name: typeof stored.name === 'string' ? stored.name.slice(0, 28) : '',
      signature: Array.isArray(stored.signature) ? stored.signature.filter(Array.isArray).slice(0, 40) : [],
      startedAt: Number.isFinite(stored.startedAt) ? stored.startedAt : (actions.length ? Date.now() : null),
      issuedAt: Number.isFinite(stored.issuedAt) ? stored.issuedAt : (actions.length >= RESOLVE_AT ? Date.now() : null),
      stampSeen: Boolean(stored.stampSeen),
      times: stored.times && typeof stored.times === 'object' ? stored.times : {},
    }
  } catch {
    return { ...EMPTY_RECORD }
  }
}

// The accession number is fixed at the moment of issue: the visit's start time
// plus the three marks that resolved the record. Same library, different residue.
function hashString(input) {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function getAccessionNumber(record) {
  if (record.actions.length < RESOLVE_AT) return 'NQ / OPEN'
  const seed = `${record.startedAt || 0}|${record.actions.slice(0, RESOLVE_AT).join(',')}`
  const n = String(hashString(seed) % 1000000).padStart(6, '0')
  return `NQ ${n.slice(0, 3)} ${n.slice(3)}`
}

function formatIssueDate(ts) {
  const date = ts ? new Date(ts) : new Date()
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`
}

function signaturePath(strokes) {
  return strokes.map((stroke) => {
    if (!stroke.length) return ''
    if (stroke.length === 1) {
      const [x, y] = stroke[0]
      return `M${x} ${y}l.1 .1`
    }
    let d = `M${stroke[0][0]} ${stroke[0][1]}`
    for (let i = 1; i < stroke.length - 1; i += 1) {
      const [x, y] = stroke[i]
      const [nx, ny] = stroke[i + 1]
      d += `Q${x} ${y} ${(x + nx) / 2} ${(y + ny) / 2}`
    }
    const last = stroke[stroke.length - 1]
    return `${d}L${last[0]} ${last[1]}`
  }).join('')
}

function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function getFamilyScores(actions) {
  const score = { reader: 0, maker: 0, seeker: 0, local: 0 }
  actions.forEach((id) => {
    const action = ACTIONS[id]
    if (action) score[action.family] += 1
  })
  return score
}

function getOutcome(actions) {
  const score = getFamilyScores(actions)
  const maxScore = Math.max(...Object.values(score))
  if (maxScore <= 0) return 'reader'

  const leaders = Object.keys(score).filter((family) => score[family] === maxScore)
  if (leaders.length === 1) return leaders[0]

  // Ties belong to the most recent behaviour, never to object-key order.
  for (let index = actions.length - 1; index >= 0; index -= 1) {
    const family = ACTIONS[actions[index]]?.family
    if (family && leaders.includes(family)) return family
  }
  return leaders[0]
}

function getPatinaLevel(actions, secrets) {
  const weight = actions.length + (secrets.length * 2)
  if (weight >= 8) return 3
  if (weight >= 4) return 2
  if (weight >= 1) return 1
  return 0
}

const LENS_CONTENT = {
  reader: {
    title: 'MARGIN / PREVIOUS HANDS',
    primary: 'APR 14 1987 — “the room is also the reader.”',
    secondary: 'Borrowed 12 times · returned with one pencilled line.',
  },
  maker: {
    title: 'REGISTER / UNDERPRINT',
    primary: 'PLATE B / +2 MM — retained as evidence, not corrected.',
    secondary: 'Workshop proof 04 · uncoated stock · two-pass ink.',
  },
  seeker: {
    title: 'REFERENCE / UNINDEXED',
    primary: 'NQ.000 → an empty drawer with three handwritten cross-references.',
    secondary: 'A catalogue becomes a route when someone follows the wrong number.',
  },
  local: {
    title: 'ADDRESS / BEFORE',
    primary: '44 Vale, 1963 — reading room above Mercer Grocer.',
    secondary: 'The building disappeared. The habit of gathering did not.',
  },
}

function CardPatinaLayer({ actions = [], secrets = [], compact = false }) {
  const scores = getFamilyScores(actions)
  const level = getPatinaLevel(actions, secrets)
  if (level === 0) return null

  const secretFamilies = secrets.map((id) => SECRETS[id]?.family).filter(Boolean)
  return (
    <div className={`card-patina patina-level-${level} ${compact ? 'card-patina--compact' : ''}`} aria-hidden="true">
      {scores.reader > 0 && <span className="patina-reader"><i /><i /><i /><b>p. {210 + scores.reader}</b></span>}
      {scores.maker > 0 && <span className="patina-maker"><i /><i /><b>REG / +{scores.maker}</b></span>}
      {scores.seeker > 0 && <span className="patina-seeker"><i /><i /><b>NQ.{String(20 + scores.seeker).padStart(3, '0')}</b></span>}
      {scores.local > 0 && <span className="patina-local"><i /><i /><b>45.42° N</b></span>}
      <span className="patina-edge" />
      {secretFamilies.slice(-2).map((family, index) => <span key={`${family}-${index}`} className={`patina-secret patina-secret-${family} patina-secret-${index + 1}`}>NQ / FOUND</span>)}
    </div>
  )
}


const FAMILY_ACTION_ORDER = {
  reader: ['stacks-fiction', 'stacks-essay', 'stacks-poetry'],
  maker: ['workshop-align', 'workshop-stock', 'workshop-ink'],
  seeker: ['index-021', 'index-114', 'index-403'],
  local: ['quarter-market', 'quarter-school', 'quarter-river'],
}

function FamilyEvidenceMark({ family, actions = [], compact = false, unregistered = false }) {
  const active = new Set(actions)
  const familyActions = FAMILY_ACTION_ORDER[family] || []
  const activeCount = familyActions.filter((id) => active.has(id)).length
  const isActive = (id) => active.has(id)
  const classFor = (id, base = 'evidence-stroke') => `${base} ${isActive(id) ? 'is-active' : ''}`
  const apertureCode = {
    reader: 'MARGIN / PAGE',
    maker: 'REGISTER / PLATE',
    seeker: '021 → 114 → 403',
    local: 'MARKET → SCHOOL → RIVER',
  }[family]

  return (
    <div className={`evidence-mark evidence-mark-${family} ${compact ? 'evidence-mark--compact' : ''} ${unregistered ? 'is-open' : ''}`} aria-hidden="true">
      <div className="trace-spine">
        <span>{unregistered ? 'OPEN TRACE' : `TRACE ${String(activeCount).padStart(2, '0')}`}</span>
        {familyActions.map((id) => <i key={id} className={isActive(id) ? 'is-active' : ''} />)}
      </div>
      <div className="accession-aperture">
        {family === 'reader' && (
          <svg viewBox="0 0 100 100">
            <path className="evidence-ghost" d="M19 12V88" />
            <path className={classFor('stacks-fiction')} d="M28 24H82" />
            <path className={classFor('stacks-essay')} d="M28 48H68" />
            <path className={classFor('stacks-poetry')} d="M28 72H77" />
            <circle className={classFor('stacks-fiction', 'evidence-node')} cx="19" cy="24" r="3.6" />
            <circle className={classFor('stacks-essay', 'evidence-node')} cx="19" cy="48" r="3.6" />
            <circle className={classFor('stacks-poetry', 'evidence-node')} cx="19" cy="72" r="3.6" />
          </svg>
        )}
        {family === 'maker' && (
          <svg viewBox="0 0 100 100">
            <rect className={classFor('workshop-stock')} x="22" y="20" width="56" height="60" rx="2" />
            <path className={classFor('workshop-align')} d="M10 50H90M50 10V90M43 43H57V57H43Z" />
            <rect className={classFor('workshop-ink')} x="27" y="16" width="56" height="60" rx="2" />
            <circle className={classFor('workshop-align', 'evidence-node')} cx="50" cy="50" r="4.2" />
          </svg>
        )}
        {family === 'seeker' && (
          <svg viewBox="0 0 100 100">
            <path className="evidence-ghost" d="M15 76C27 60 35 54 47 56C60 58 64 28 86 28" />
            <path className={`evidence-stroke ${isActive('index-021') && isActive('index-114') ? 'is-active' : ''}`} d="M15 76C27 60 35 54 47 56" />
            <path className={`evidence-stroke ${isActive('index-114') && isActive('index-403') ? 'is-active' : ''}`} d="M47 56C60 58 64 28 86 28" />
            <circle className={classFor('index-021', 'evidence-node')} cx="15" cy="76" r="4" />
            <circle className={classFor('index-114', 'evidence-node')} cx="47" cy="56" r="4" />
            <circle className={classFor('index-403', 'evidence-node')} cx="86" cy="28" r="4" />
            <text x="9" y="90" stroke="none" fill="currentColor">021</text><text x="39" y="49" stroke="none" fill="currentColor">114</text><text x="73" y="20" stroke="none" fill="currentColor">403</text>
          </svg>
        )}
        {family === 'local' && (
          <svg viewBox="0 0 100 100">
            <path className="evidence-ghost" d="M8 67L34 55L55 64L89 32M18 18L34 55L28 88M55 64L74 87" />
            <path className={classFor('quarter-market')} d="M8 67L34 55L55 64" />
            <path className={classFor('quarter-school')} d="M18 18L34 55" />
            <path className={classFor('quarter-river')} d="M55 64L89 32" />
            <circle className={classFor('quarter-market', 'evidence-node')} cx="34" cy="55" r="4" />
            <circle className={classFor('quarter-school', 'evidence-node')} cx="18" cy="18" r="4" />
            <circle className={classFor('quarter-river', 'evidence-node')} cx="89" cy="32" r="4" />
          </svg>
        )}
        <span className="aperture-code">{unregistered ? 'NO TRACE / OPEN' : apertureCode}</span>
      </div>
    </div>
  )
}

function CardLensReveal({ family, actions, secrets, navigate }) {
  const [position, setPosition] = useState({ x: 62, y: 54 })
  const [dragging, setDragging] = useState(false)
  const content = LENS_CONTENT[family]

  const moveLens = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.min(82, Math.max(18, ((event.clientX - rect.left) / rect.width) * 100))
    const y = Math.min(76, Math.max(24, ((event.clientY - rect.top) / rect.height) * 100))
    setPosition({ x, y })
  }

  return (
    <section id="member-lens" className={`lens-section family-${family}`}>
      <div className="lens-copy">
        <span className="room-kicker">MEMBER OPTICS / ACCESSION STRATA</span>
        <h2>The card changes<br /><em>what you can see.</em></h2>
        <p>Your record has accumulated layers from what you actually did. Move the card across the archive: the accession aperture cuts through those strata and reveals the memory beneath.</p>
        <div className="lens-proof">
          <span>{actions.length} REGISTERED MARKS</span>
          <span>{secrets.length}/4 HIDDEN TRACES</span>
        </div>
        <button className="lens-continue" onClick={() => navigate('/collection')}>
          <span>ENTER THE LIVING COLLECTION FROM THE LENS</span><ArrowRight size={15} />
        </button>
      </div>
      <div
        className={`card-lens-stage ${dragging ? 'is-dragging' : ''}`}
        onPointerDown={(event) => { setDragging(true); moveLens(event) }}
        onPointerMove={(event) => { if (dragging) moveLens(event) }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        <div className="lens-archive">
          <span>ACCESSION / NQ 1963–2026</span>
          <strong>NORTH QUARTER / PUBLIC MEMORY REGISTER</strong>
          <i />
          <small>Move the card across this surface.</small>
        </div>
        <div
          className="lens-reveal-window"
          style={{ left: `${position.x}%`, top: `${position.y}%` }}
          aria-hidden="true"
        >
          <span>MEMBER-ONLY ARCHIVE / REVEALED</span>
          <strong>{content.primary}</strong>
          <small>{content.secondary}</small>
        </div>
        <div className="lens-card" style={{ left: `${position.x}%`, top: `${position.y}%` }}>
          <span className="lens-card-paper" aria-hidden="true" />
          <span className="lens-accession-aperture" aria-hidden="true"><i /></span>
          <span className="lens-card-mark">NQ</span>
          <span className="lens-card-mode">MEMBER LENS</span>
          <strong>{content.title}</strong>
          <small>DRAG TO READ BENEATH THE PUBLIC SURFACE</small>
        </div>
        <span className="lens-drag-cue" style={{ left: `${position.x}%`, top: `calc(${position.y}% + 116px)` }}>DRAG THE CARD → REVEAL</span>
      </div>
    </section>
  )
}

const QUARTER_POSITIONS = [
  [8,18],[17,16],[27,20],[39,17],[52,19],[65,16],[76,21],[86,18],
  [12,39],[23,36],[34,42],[47,38],[59,41],[71,36],[83,42],
  [7,61],[18,66],[31,60],[43,65],[56,59],[68,64],[81,60],[90,66],
  [20,82],[34,79],[49,83],[64,79],[79,84],
]

function QuarterCollectionReveal({ currentFamily, name }) {
  const families = Object.keys(FAMILY)
  return (
    <section className="collection-quarter" style={{ '--family-accent': FAMILY[currentFamily].accent }} aria-label="The Living Collection rearranged as North Quarter">
      <svg className="quarter-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path className="quarter-path path-1" d="M3 28 C28 21 55 31 97 23" />
        <path className="quarter-path path-2" d="M6 52 C29 46 61 53 95 48" />
        <path className="quarter-path path-3" d="M4 75 C35 68 67 79 96 72" />
        <path className="quarter-path path-4" d="M21 5 C24 34 19 63 27 96" />
        <path className="quarter-path path-5" d="M53 3 C49 35 57 63 52 97" />
        <path className="quarter-path path-6" d="M78 7 C72 34 82 66 76 95" />
        <path className="quarter-path quarter-path-user" d="M43 65 C46 58 49 53 52 48" />
      </svg>
      <div className="quarter-river" aria-hidden="true" />
      {QUARTER_POSITIONS.map(([x, y], index) => {
        const isCurrent = index === 19
        const family = isCurrent ? currentFamily : families[index % families.length]
        return (
          <span
            key={index}
            className={`quarter-record family-${family} ${isCurrent ? 'is-current-record' : ''}`}
            style={{ left: `${x}%`, top: `${y}%`, '--family-accent': FAMILY[family].accent }}
          >
            <i />
            <b>{isCurrent ? (name ? name.toUpperCase() : 'YOUR RECORD') : FAMILY[family].title}</b>
          </span>
        )
      })}
      <div className="quarter-library-node"><span>NQ</span><strong>COMMON ROOM</strong><small>THE COLLECTION BECOMES THE QUARTER</small></div>
      <p className="quarter-statement"><strong>THE LIBRARY REMEMBERS.</strong><span>Every record keeps its own marks. When those traces connect, they draw the place that made them possible.</span></p>
    </section>
  )
}

function Monogram() {
  return (
    <div className="monogram" aria-label="North Quarter mark">
      <span>N</span><span>Q</span>
    </div>
  )
}


function AccessionStrata({ actions = [], secrets = [] }) {
  const visibleActions = actions.slice(-4)
  const visibleSecrets = secrets.slice(-1)
  const layers = [
    ...visibleActions.map((id) => ({
      id,
      family: ACTIONS[id]?.family || 'reader',
      label: ACTIONS[id]?.label || 'Registered mark',
      kind: 'action',
    })),
    ...visibleSecrets.map((id) => ({
      id: `secret-${id}`,
      family: SECRETS[id]?.family || 'reader',
      label: SECRETS[id]?.label || 'Hidden trace',
      kind: 'secret',
    })),
  ]

  if (!layers.length) return null

  return (
    <div className="accession-strata" aria-hidden="true">
      {layers.map((layer, index) => (
        <span
          key={layer.id}
          className={`strata-layer strata-${layer.family} ${layer.kind === 'secret' ? 'strata-secret' : ''}`}
          style={{
            '--strata-index': index + 1,
            '--strata-count': layers.length,
            '--strata-accent': FAMILY[layer.family]?.accent || FAMILY.reader.accent,
          }}
        >
          <i />
          <b>{layer.label}</b>
        </span>
      ))}
    </div>
  )
}

function StratifiedMemberCard({ family, actions, secrets, resolved, children }) {
  const visibleLayerCount = Math.min(actions.length, 4) + Math.min(secrets.length, 1)
  return (
    <div
      className={`member-card-stack family-${family} ${resolved ? 'is-resolved' : ''}`}
      style={{ '--family-accent': FAMILY[family].accent }}
    >
      {resolved && <AccessionStrata actions={actions} secrets={secrets} />}
      {children}
      {resolved && (
        <span className="strata-index" aria-hidden="true">
          ACCESSION STRATA / {String(visibleLayerCount).padStart(2, '0')} VISIBLE / {String(actions.length + secrets.length).padStart(2, '0')} RECORDED
        </span>
      )}
    </div>
  )
}

function SignatureMark({ strokes, name, placeholder = 'Borrower’s signature' }) {
  if (strokes?.length) {
    return (
      <svg className="nq-signature" viewBox="0 0 400 120" preserveAspectRatio="xMinYMid meet" aria-hidden="true">
        <path d={signaturePath(strokes)} fill="none" stroke="#1d2742" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (name) return <span className="nq-signature-name">{name}</span>
  return <span className="nq-signature-empty">{placeholder}</span>
}

function AccessionStamp({ family, date, landing = false }) {
  const id = `stamp-${family}`
  return (
    <div className={`nq-stamp ${landing ? 'is-landing' : ''}`} aria-label={`Accessioned ${date}`}>
      <svg viewBox="0 0 200 200">
        <defs>
          <path id={`${id}-arc`} d="M100 100 m-74 0 a74 74 0 1 1 148 0 a74 74 0 1 1 -148 0" />
        </defs>
        <g fill="currentColor">
          <circle cx="100" cy="100" r="94" className="stamp-ring" fill="none" stroke="currentColor" strokeWidth="5" />
          <circle cx="100" cy="100" r="60" className="stamp-ring stamp-ring-thin" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="1 3.2" />
          <text className="stamp-arc" fontSize="14.5" fontWeight="700" letterSpacing="3.1" fontFamily="Public Sans, Arial, sans-serif"><textPath href={`#${id}-arc`} startOffset="0">NORTH QUARTER PUBLIC LIBRARY · ACCESSIONED ·</textPath></text>
          <text x="100" y="88" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="2.4" fontFamily="Public Sans, Arial, sans-serif" className="stamp-small">MEMBER RECORD</text>
          <text x="100" y="112" textAnchor="middle" fontSize="21" fontWeight="700" letterSpacing="1" fontFamily="Public Sans, Arial, sans-serif" className="stamp-date">{date}</text>
          <text x="100" y="132" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="2.4" fontFamily="Public Sans, Arial, sans-serif" className="stamp-small">{FAMILY[family].title}</text>
        </g>
      </svg>
    </div>
  )
}

function MemberCard({ family = 'reader', actions = [], secrets = [], compact = false, resolved = false, unregistered = false, owner = null, stamp = false, stampLanding = false }) {
  const meta = FAMILY[family]
  const number = unregistered ? 'NQ / OPEN' : (owner?.number || meta.code)
  const issued = unregistered ? '—' : (owner?.issued || formatIssueDate())
  const title = unregistered ? 'Unregistered' : meta.title
  return (
    <article
      className={`member-card nq-card family-${family} ${compact ? 'member-card--compact' : ''} ${resolved ? 'member-card--resolved' : ''} ${unregistered ? 'member-card--unregistered' : ''} ${stampLanding ? 'is-stamped' : ''}`}
      style={{ '--family-accent': meta.accent }}
    >
      <div className="paper-grain" aria-hidden="true" />
      <div className="accession-rail" aria-hidden="true"><span>ACCESSION / NQ</span><i /><i /><i /></div>
      <div className="card-register" aria-hidden="true"><span /><span /></div>
      <header className="nq-card-brand">
        <Monogram />
        <div><strong>North Quarter</strong><span>Public Library</span></div>
      </header>
      <div className="nq-card-body">
        <span className="nq-card-edition">{unregistered ? 'MEMBER RECORD / OPEN' : `MEMBER RECORD / ${meta.edition}`}</span>
        <h3 className={`nq-card-title ${unregistered ? 'is-long' : ''}`}>{title}</h3>
        {!compact && <p className="nq-card-statement">{unregistered ? 'Leave three marks in the rooms. The card will follow.' : meta.statement}</p>}
      </div>
      <FamilyEvidenceMark family={family} actions={actions} compact={compact} unregistered={unregistered} />
      <CardPatinaLayer actions={actions} secrets={secrets} compact={compact} />
      {!compact && (
        <footer className="nq-card-foot">
          <div className="nq-card-sign">
            <SignatureMark strokes={owner?.signature} name={owner?.name} placeholder={unregistered ? 'Signature after accession' : 'Borrower’s signature'} />
          </div>
          <dl className="nq-card-meta">
            <div><dt>No.</dt><dd>{number}</dd></div>
            <div><dt>Borrower</dt><dd>{owner?.name || (unregistered ? '—' : 'Unsigned')}</dd></div>
            <div><dt>Issued</dt><dd>{issued}</dd></div>
          </dl>
        </footer>
      )}
      {stamp && !unregistered && <AccessionStamp family={family} date={issued} landing={stampLanding} />}
    </article>
  )
}

function ownerFromRecord(record) {
  return {
    name: record.name,
    signature: record.signature,
    number: getAccessionNumber(record),
    issued: formatIssueDate(record.issuedAt),
  }
}

function usePath() {
  const [path, setPath] = useState(window.location.pathname || '/')
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || '/')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return [path, setPath]
}

function readStorage() {
  try { return safeLoadRecord() } catch { return { ...EMPTY_RECORD } }
}

function useMemberRecord() {
  const [record, setRecord] = useState(readStorage)
  const [lastMark, setLastMark] = useState(null)
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(record)) } catch { /* private mode: keep in memory */ }
  }, [record])

  const addAction = (id) => {
    if (!ACTIONS[id] || record.actions.includes(id)) return
    setRecord((current) => {
      if (current.actions.includes(id)) return current
      const actions = [...current.actions, id]
      const now = Date.now()
      return {
        ...current,
        actions,
        startedAt: current.startedAt || now,
        issuedAt: current.issuedAt || (actions.length >= RESOLVE_AT ? now : null),
        times: { ...current.times, [id]: now },
      }
    })
    setLastMark({ kind: 'action', id, at: Date.now(), count: record.actions.length + 1 })
  }
  const addSecret = (id) => {
    if (!SECRETS[id] || record.secrets.includes(id)) return
    setRecord((current) => current.secrets.includes(id) ? current : { ...current, secrets: [...current.secrets, id], startedAt: current.startedAt || Date.now(), times: { ...current.times, [`s-${id}`]: Date.now() } })
    setLastMark({ kind: 'secret', id, at: Date.now(), count: record.actions.length })
  }
  const setName = (name) => setRecord((current) => ({ ...current, name: name.slice(0, 28) }))
  const setSignature = (signature) => setRecord((current) => ({ ...current, signature }))
  const markStampSeen = () => setRecord((current) => ({ ...current, stampSeen: true }))
  const reset = () => { setRecord({ ...EMPTY_RECORD }); setLastMark(null) }
  return { record, lastMark, addAction, addSecret, setName, setSignature, markStampSeen, reset }
}

function SiteHeader({ path, navigate, record }) {
  return (
    <header className="room-header">
      <button className="room-brand" onClick={() => navigate('/')}>
        <Monogram /><span>NORTH QUARTER<br />PUBLIC LIBRARY</span>
      </button>
      <nav className="room-nav" aria-label="Library rooms">
        {ROUTES.slice(1, 6).map((route) => (
          <button key={route.path} className={path === route.path ? 'is-current' : ''} onClick={() => navigate(route.path)}>{route.short}</button>
        ))}
      </nav>
      <MemberPassport record={record} navigate={navigate} current={path === '/record'} />
    </header>
  )
}

function MemberPassport({ record, navigate, current }) {
  const family = getOutcome(record.actions)
  const meta = FAMILY[family]
  const isOpen = record.actions.length < RESOLVE_AT
  const dots = Array.from({ length: RESOLVE_AT })
  return (
    <button className={`nq-passport ${current ? 'is-current' : ''} ${isOpen ? 'is-open' : 'is-resolved'}`} onClick={() => navigate('/record')} style={{ '--passport-accent': meta.accent }} aria-label={`Member record: ${isOpen ? 'open' : meta.title}, ${record.actions.length} marks`}>
      <span className="nq-passport-dots" aria-hidden="true">
        {dots.map((_, i) => <i key={i} className={i < record.actions.length ? 'is-on' : ''} />)}
      </span>
      <span className="nq-passport-copy">
        <strong>{isOpen ? 'RECORD OPEN' : meta.title}</strong>
        <small>{isOpen ? `${RESOLVE_AT - record.actions.length} MARK${RESOLVE_AT - record.actions.length > 1 ? 'S' : ''} TO ACCESSION` : `${record.actions.length} MARKS · ${record.secrets.length}/4 HIDDEN`}</small>
      </span>
    </button>
  )
}

// A date-due slip that slides in every time the library registers something you did.
function MarkSlip({ lastMark }) {
  const [visible, setVisible] = useState(null)
  useEffect(() => {
    if (!lastMark) return undefined
    setVisible(lastMark)
    const timer = window.setTimeout(() => setVisible(null), 2600)
    return () => window.clearTimeout(timer)
  }, [lastMark])
  if (!visible) return null
  const isSecret = visible.kind === 'secret'
  const entry = isSecret ? SECRETS[visible.id] : ACTIONS[visible.id]
  const family = entry.family
  const resolvedNow = !isSecret && visible.count === RESOLVE_AT
  return (
    <div key={visible.at} className={`nq-slip family-${family} ${isSecret ? 'is-secret' : ''}`} style={{ '--family-accent': FAMILY[family].accent }} role="status">
      <span className="nq-slip-head">NORTH QUARTER · {isSecret ? 'HIDDEN TRACE' : 'DATE REGISTERED'}</span>
      <strong className="nq-slip-label">{entry.label}</strong>
      <span className="nq-slip-count">{isSecret ? 'Kept in your record' : resolvedNow ? 'Record ready for accession →' : `Mark ${String(visible.count).padStart(2, '0')}`}</span>
      <span className="nq-slip-stamp" aria-hidden="true">{formatIssueDate(visible.at)}</span>
    </div>
  )
}

function RoomShell({ path, navigate, record, children, tone = 'paper' }) {
  const roomFamily = ROOM_FAMILY[path]
  const roomMarks = roomFamily ? record.actions.filter((id) => ACTIONS[id]?.family === roomFamily) : []
  const remembered = roomMarks.length > 0

  return (
    <main className={`room-page room-tone-${tone} ${remembered ? 'room-is-remembered' : ''}`}>
      <SiteHeader path={path} navigate={navigate} record={record} />
      {remembered && (
        <div className={`room-memory-residue memory-${roomFamily} memory-level-${Math.min(3, roomMarks.length)}`} aria-hidden="true">
          <span className="memory-line memory-line-a" />
          <span className="memory-line memory-line-b" />
          <i>{roomMarks.length} TRACE{roomMarks.length > 1 ? 'S' : ''} RETAINED</i>
        </div>
      )}
      {children}
    </main>
  )
}

function Lobby({ path, navigate, record }) {
  const family = getOutcome(record.actions)
  const started = record.actions.length > 0
  const resolved = record.actions.length >= RESOLVE_AT
  const firstName = record.name.trim().split(/\s+/)[0]
  const rooms = [
    ['/stacks', '01', 'THE STACKS', 'Read between the lines.', 'Margins / pages / traces'],
    ['/workshop', '02', 'THE WORKSHOP', 'Make a mark hold.', 'Print / registration / material'],
    ['/index', '03', 'THE INDEX', 'Follow one question further.', 'Catalogues / references / paths'],
    ['/quarter', '04', 'THE QUARTER', 'Find the library in the city.', 'Places / memory / belonging'],
  ]
  return (
    <RoomShell path={path} navigate={navigate} record={record} tone="dark">
      <section className="lobby-grid">
        <div className="lobby-copy">
          <span className="room-kicker">{resolved ? `WELCOME BACK / ${getAccessionNumber(record)}` : 'THE LIVING COLLECTION / MEMBER ENTRY'}</span>
          <h1>COMMON<br /><em>ROOM</em></h1>
          {resolved && firstName
            ? <p className="lobby-remembered">The library remembers you, <em>{firstName}</em>. {record.actions.length} marks, {record.secrets.length} hidden trace{record.secrets.length === 1 ? '' : 's'}, one card.</p>
            : <p>You don’t get a library card here. You <em>accumulate</em> one, from what you actually do inside.</p>}
          <button className="room-primary room-primary-light" onClick={() => navigate(started ? (resolved ? '/record' : nextRoom(record)) : '/stacks')}>
            {!started ? 'Enter the library' : resolved ? 'Open your record' : 'Continue your visit'} <ArrowRight size={17} />
          </button>
        </div>
        <div className="lobby-object">
          <div className="lobby-vitrine">
            <RecordCard record={record} stamp={resolved} />
          </div>
          <div className="lobby-plaque"><strong>MEMBERSHIP IS A RECORD OF PARTICIPATION.</strong><span>NQ / ACCESSION DESK</span></div>
        </div>
      </section>
      <section className="room-directory" aria-label="Four rooms to explore">
        {rooms.map(([route, number, title, line, meta]) => (
          <button key={route} onClick={() => navigate(route)}>
            <span>{number}</span><strong>{title}</strong><em>{line}</em><small>{meta}</small><ArrowRight size={16} />
          </button>
        ))}
      </section>
    </RoomShell>
  )
}

function StacksRoom({ path, navigate, record, addAction, addSecret }) {
  const books = [
    { id: 'stacks-fiction', spine: 'FICTION / 813', title: 'A room inside a room' },
    { id: 'stacks-essay', spine: 'ESSAY / 028', title: 'The public life of reading' },
    { id: 'stacks-poetry', spine: 'POETRY / 811', title: 'Margins for weather' },
  ]
  const found = record.secrets.includes('borrower')
  return (
    <RoomShell path={path} navigate={navigate} record={record} tone="paper">
      <section className="room-intro">
        <div><span className="room-kicker">01 / READ / THE STACKS</span><h1>Some books<br /><em>remember you.</em></h1></div>
        <p>Open a volume. What you choose to spend time with leaves a margin in your Member Record.</p>
      </section>
      <section className="stacks-scene">
        <div className="shelf-wall">
          {Array.from({ length: 13 }).map((_, i) => <span key={i} className={`shelf-book shelf-book-${(i % 5) + 1}`} />)}
          <button className="borrower-trigger" aria-label="A slightly protruding old book" onClick={() => addSecret('borrower')}>1978</button>
        </div>
        <div className="reading-table">
          {books.map((book) => {
            const marked = record.actions.includes(book.id)
            return (
              <button key={book.id} className={`open-book ${marked ? 'is-marked' : ''}`} onClick={() => addAction(book.id)}>
                <span className="book-spine">{book.spine}</span><strong>{book.title}</strong><p>Leave a margin mark</p><i>{marked ? 'REGISTERED' : 'OPEN'}</i>
              </button>
            )
          })}
        </div>
        {found && <aside className="secret-reveal secret-reader"><span>HIDDEN TRACE / FOUND</span><strong>BORROWER CARD — 1978</strong><p>Three names. Twelve dates. One book returning through different hands.</p></aside>}
      </section>
      <RoomNext label="Follow a mark into the workshop" onClick={() => navigate('/workshop')} />
    </RoomShell>
  )
}

function WorkshopRoom({ path, navigate, record, addAction, addSecret }) {
  const [registration, setRegistration] = useState(record.actions.includes('workshop-align') ? 50 : 31)
  const aligned = Math.abs(registration - 50) <= 4
  const secretFound = record.secrets.includes('imperfection')
  return (
    <RoomShell path={path} navigate={navigate} record={record} tone="workshop">
      <section className="room-intro">
        <div><span className="room-kicker">02 / MAKE / THE WORKSHOP</span><h1>Make the mark<br /><em>hold.</em></h1></div>
        <p>Registration is never abstract here. Move the plate until two impressions become one, then choose what the object is made from.</p>
      </section>
      <section className="press-bench">
        <div className="registration-stage">
          <span className="plate plate-a" style={{ transform: `translateX(${registration - 50}px)` }}>NQ</span>
          <span className="plate plate-b">NQ</span>
          <div className="registration-target" />
          <label>REGISTRATION / {registration > 50 ? '+' : ''}{registration - 50}<input type="range" min="0" max="100" value={registration} onChange={(event) => setRegistration(Number(event.target.value))} /></label>
          <button className="room-primary" disabled={!aligned} onClick={() => addAction('workshop-align')}>{record.actions.includes('workshop-align') ? 'Impression registered' : 'Lock the impression'}</button>
          <button className="imperfection-trigger" aria-label="A tiny misregistration mark" onClick={() => addSecret('imperfection')}>+2</button>
        </div>
        <div className="material-drawer">
          <button onClick={() => addAction('workshop-stock')} className={record.actions.includes('workshop-stock') ? 'is-marked' : ''}><i className="stock-swatch" /><strong>UNCOATED STOCK</strong><span>Choose material</span></button>
          <button onClick={() => addAction('workshop-ink')} className={record.actions.includes('workshop-ink') ? 'is-marked' : ''}><i className="ink-swatch" /><strong>OVERPRINT INK</strong><span>Choose process</span></button>
        </div>
        {secretFound && <aside className="secret-reveal secret-maker"><span>HIDDEN TRACE / FOUND</span><strong>REGISTERED IMPERFECTION</strong><p>The error was kept because it proved a hand had aligned the press.</p></aside>}
      </section>
      <RoomNext label="Follow the registration number" onClick={() => navigate('/index')} />
    </RoomShell>
  )
}

function IndexRoom({ path, navigate, record, addAction, addSecret }) {
  const has021 = record.actions.includes('index-021')
  const has114 = record.actions.includes('index-114')
  const has403 = record.actions.includes('index-403')
  const found = record.secrets.includes('curiosity')
  const step = (id, enabled) => {
    if (!enabled) return
    addAction(id)
  }
  return (
    <RoomShell path={path} navigate={navigate} record={record} tone="index">
      <section className="room-intro room-intro-light">
        <div><span className="room-kicker">03 / SEEK / THE INDEX</span><h1>A question is<br /><em>a route.</em></h1></div>
        <p>One reference points to another. Follow the chain far enough and the catalogue stops behaving like a list.</p>
      </section>
      <section className="index-cabinet">
        <div className="index-drawers">
          {Array.from({ length: 15 }).map((_, i) => <span key={i}>{String(i + 11).padStart(3, '0')}</span>)}
          <button className="zero-drawer" onClick={() => addSecret('curiosity')}>NQ.000</button>
        </div>
        <div className="reference-chain">
          <button className={`reference-card ${has021 ? 'is-open' : ''}`} onClick={() => step('index-021', true)}><span>NQ.021</span><strong>PUBLIC ROOMS</strong><small>SEE ALSO → NQ.114</small></button>
          <button disabled={!has021} className={`reference-card ${has114 ? 'is-open' : ''}`} onClick={() => step('index-114', has021)}><span>NQ.114</span><strong>SHARED MEMORY</strong><small>SEE ALSO → NQ.403</small></button>
          <button disabled={!has114} className={`reference-card ${has403 ? 'is-open' : ''}`} onClick={() => step('index-403', has114)}><span>NQ.403</span><strong>BELONGING</strong><small>REFERENCE COMPLETE</small></button>
        </div>
        {found && <aside className="secret-reveal secret-seeker"><span>HIDDEN TRACE / FOUND</span><strong>FOUND THROUGH CURIOSITY</strong><p>NQ.000 is not indexed. It only appears to people who check what the system says is empty.</p></aside>}
      </section>
      <RoomNext label="Turn references into places" onClick={() => navigate('/quarter')} />
    </RoomShell>
  )
}

function QuarterRoom({ path, navigate, record, addAction, addSecret }) {
  const found = record.secrets.includes('before')
  const points = [
    ['quarter-market', 'MARKET HALL', '12 Mercer'],
    ['quarter-school', 'NORTH SCHOOL', '44 Vale'],
    ['quarter-river', 'RIVER WALK', 'East bank'],
  ]
  return (
    <RoomShell path={path} navigate={navigate} record={record} tone="quarter">
      <section className="room-intro">
        <div><span className="room-kicker">04 / BELONG / THE QUARTER</span><h1>The library is<br /><em>larger than its walls.</em></h1></div>
        <p>Choose places that make the institution feel local. Each address brings another piece of the quarter into your record.</p>
      </section>
      <section className="quarter-map">
        <div className="map-grid" aria-label="North Quarter map">
          <span className="street street-a" /><span className="street street-b" /><span className="street street-c" /><span className="street street-d" />
          {points.map(([id, label, address], index) => (
            <button key={id} className={`map-point map-point-${index + 1} ${record.actions.includes(id) ? 'is-marked' : ''}`} onClick={() => addAction(id)}><i /><strong>{label}</strong><small>{address}</small></button>
          ))}
          <button className="map-hidden" aria-label="An unlabeled point on the map" onClick={() => addSecret('before')}><i /></button>
          <div className="library-pin"><Monogram /><span>YOU ARE HERE</span></div>
        </div>
        {found && <aside className="secret-reveal secret-local"><span>HIDDEN TRACE / FOUND</span><strong>THE ROOM BEFORE THE LIBRARY</strong><p>Before North Quarter opened here, this address was a reading room above a grocer. The building is gone. The habit stayed.</p></aside>}
      </section>
      <RoomNext label="Resolve your Member Record" onClick={() => navigate('/record')} />
    </RoomShell>
  )
}

function SignaturePad({ strokes, onChange }) {
  const svgRef = useRef(null)
  const drawing = useRef(null)
  const [live, setLive] = useState(strokes)
  useEffect(() => { if (!drawing.current) setLive(strokes) }, [strokes])

  const point = (event) => {
    const rect = svgRef.current.getBoundingClientRect()
    return [
      Math.round(Math.min(400, Math.max(0, ((event.clientX - rect.left) / rect.width) * 400))),
      Math.round(Math.min(120, Math.max(0, ((event.clientY - rect.top) / rect.height) * 120))),
    ]
  }
  const start = (event) => {
    event.preventDefault()
    svgRef.current.setPointerCapture?.(event.pointerId)
    drawing.current = [...live.slice(-30), [point(event)]]
    setLive(drawing.current)
  }
  const move = (event) => {
    if (!drawing.current) return
    const stroke = drawing.current[drawing.current.length - 1]
    const [x, y] = point(event)
    const [lx, ly] = stroke[stroke.length - 1]
    if (Math.hypot(x - lx, y - ly) < 2.5 || stroke.length > 400) return
    stroke.push([x, y])
    setLive([...drawing.current])
  }
  const end = () => {
    if (!drawing.current) return
    onChange(drawing.current)
    drawing.current = null
  }

  return (
    <div className="nq-signpad">
      <svg
        ref={svgRef}
        viewBox="0 0 400 120"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={end}
        role="img"
        aria-label="Signature pad: draw your signature"
      >
        <line x1="14" y1="96" x2="386" y2="96" className="nq-signpad-line" />
        <text x="16" y="113" className="nq-signpad-hint">{live.length ? 'SIGNED IN INK / NQ' : 'SIGN HERE WITH YOUR FINGER OR MOUSE'}</text>
        <path d={signaturePath(live)} className="nq-signpad-ink" />
      </svg>
      {live.length > 0 && <button type="button" className="nq-signpad-clear" onClick={() => { setLive([]); onChange([]) }}><Eraser size={13} /> Clear</button>}
    </div>
  )
}

function ExportFrame({ family, record, frameRef }) {
  return (
    <div className="nq-export-host" aria-hidden="true">
      <div className="nq-export" ref={frameRef} style={{ '--family-accent': FAMILY[family].accent }}>
        <div className="nq-export-top"><span>COMMON ROOM</span><span>NORTH QUARTER PUBLIC LIBRARY</span></div>
        <span className="nq-export-fonts" aria-hidden="true"><i style={{ fontFamily: "'Courier Prime'", fontWeight: 700 }}>a</i><i style={{ fontFamily: "'Courier Prime'" }}>a</i><i style={{ fontFamily: "'Public Sans'", fontWeight: 900 }}>a</i><i style={{ fontFamily: "'Public Sans'", fontWeight: 800 }}>a</i><i style={{ fontFamily: "'Newsreader Variable'", fontStyle: 'italic' }}>a</i></span>
        <div className="nq-export-card">
          <div className="nq-export-back"><CardBack family={family} owner={ownerFromRecord(record)} entries={backEntries({ actions: record.actions, secrets: record.secrets, times: record.times, labels: cardLabels(), accents: CARD_ACCENTS, fallback: record.issuedAt })} /></div>
          <div className="nq-export-front"><CardFront family={family} actions={record.actions} secrets={record.secrets} owner={ownerFromRecord(record)} stamp /></div>
        </div>
        <div className="nq-export-foot">
          <strong>You do not receive a card. You accumulate one.</strong>
          <span>{record.actions.length} MARKS · {record.secrets.length}/4 HIDDEN TRACES · {getAccessionNumber(record)}</span>
        </div>
      </div>
    </div>
  )
}

function RecordRoom({ path, navigate, record, reset, setName, setSignature, markStampSeen }) {
  const family = getOutcome(record.actions)
  const meta = FAMILY[family]
  const resolved = record.actions.length >= RESOLVE_AT
  const familyCounts = Object.keys(FAMILY).map((key) => [key, record.actions.filter((id) => ACTIONS[id]?.family === key).length])
  const [landing, setLanding] = useState(false)
  const [exporting, setExporting] = useState(false)
  const use3D = useMemo(() => resolved && supports3D(), [resolved])
  const [ceremony3D] = useState(() => !record.stampSeen)
  const exportRef = useRef(null)

  useEffect(() => {
    if (!resolved || record.stampSeen) return undefined
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) { markStampSeen(); return undefined }
    const start = window.setTimeout(() => setLanding(true), 650)
    const done = window.setTimeout(() => { setLanding(false); markStampSeen() }, 2400)
    return () => { window.clearTimeout(start); window.clearTimeout(done) }
  }, [resolved, record.stampSeen])

  const showStamp = resolved && (record.stampSeen || landing)

  const download = async () => {
    if (!exportRef.current || exporting) return
    setExporting(true)
    try {
      const url = await toPng(exportRef.current, { pixelRatio: 2, cacheBust: true })
      const link = document.createElement('a')
      link.download = `common-room-${getAccessionNumber(record).replace(/\s+/g, '-').toLowerCase()}.png`
      link.href = url
      link.click()
    } catch (error) {
      console.error('Card export failed', error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <RoomShell path={path} navigate={navigate} record={record} tone="dark">
      <section className="record-layout">
        <div className="record-copy">
          <span className="room-kicker">MEMBER RECORD / {resolved ? 'ACCESSION ACCEPTED' : 'STILL OPEN'}</span>
          <h1>{resolved ? <>Your mark<br /><em>has a place.</em></> : <>Your record<br /><em>is still forming.</em></>}</h1>
          <p>{resolved ? <>Your card resolves as <strong>{meta.title}</strong>. It is not a personality quiz result; it is the residue of what you actually explored.</> : <>Visit the rooms and leave at least three marks. Your card follows your behaviour instead of asking you to describe yourself.</>}</p>
          <div className="record-score">
            {familyCounts.map(([key, count]) => <div key={key}><span>{FAMILY[key].title}</span><i><b style={{ width: `${Math.min(100, count * 34)}%`, background: FAMILY[key].accent }} /></i><strong>{count}</strong></div>)}
          </div>
          {resolved && (
            <div className="nq-desk" style={{ '--family-accent': meta.accent }}>
              <span className="nq-desk-kicker">ACCESSION DESK / SIGN YOUR CARD</span>
              <label className="nq-desk-name">
                <span>Name on the card</span>
                <input value={record.name} maxLength={28} placeholder="Your name" onChange={(event) => setName(event.target.value)} autoComplete="name" />
              </label>
              <SignaturePad strokes={record.signature} onChange={setSignature} />
              <p className="nq-desk-note">Stays in this browser. Nothing is sent anywhere.</p>
            </div>
          )}
          <div className="record-actions">
            {resolved
              ? <button className="room-primary room-primary-light" onClick={download} disabled={exporting}><Download size={16} /> {exporting ? 'Printing your card…' : 'Take your card home'}</button>
              : <button className="room-primary room-primary-light" onClick={() => navigate(nextRoom(record))}>Keep exploring <ArrowRight size={16} /></button>}
            {resolved && <button className="room-secondary" onClick={() => document.getElementById('member-lens')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Use your Member Lens <ArrowRight size={14} /></button>}
            <button className="room-reset" onClick={reset}><RotateCcw size={14} /> Reset record</button>
          </div>
        </div>
        <div className="record-object">
          <div className="record-light" />
          {use3D ? (
            <Suspense fallback={<RecordCard record={record} stamp={showStamp} flippable={false} />}>
              <Card3D
                family={family}
                record={record}
                owner={ownerFromRecord(record)}
                entries={backEntries({ actions: record.actions, secrets: record.secrets, times: record.times, labels: cardLabels(), accents: CARD_ACCENTS, fallback: record.issuedAt })}
                ceremony={ceremony3D}
                fallback={<RecordCard record={record} stamp={showStamp} flippable={false} tilt={false} />}
              />
            </Suspense>
          ) : (
            <StratifiedMemberCard family={family} actions={record.actions} secrets={record.secrets} resolved={resolved}>
              <RecordCard record={record} stamp={showStamp} landing={landing} />
            </StratifiedMemberCard>
          )}
          <span className="hidden-emboss">YOU WERE HERE.</span>
          <div className="record-ledger">
            <span>{record.actions.length} REGISTERED MARKS</span>
            <span>{Math.min(record.actions.length, 4) + Math.min(record.secrets.length, 1)} VISIBLE STRATA</span>
            <span>{record.secrets.length}/4 HIDDEN TRACES</span>
          </div>
          {record.secrets.length > 0 && <div className="secret-ledger">{record.secrets.map((id) => <span key={id}>{SECRETS[id].glyph} / {SECRETS[id].label}</span>)}</div>}
        </div>
      </section>
      {resolved && <CardLensReveal family={family} actions={record.actions} secrets={record.secrets} navigate={navigate} />}
      {resolved && <ExportFrame family={family} record={record} frameRef={exportRef} />}
    </RoomShell>
  )
}

const WALL_NAMES = ['A. Okafor', 'L. Tremblay', 'M. Nguyen', 'S. Haddad', 'J. Ouellet', 'R. Mensah', 'C. Lavoie', 'H. Diallo', 'E. Kowalski', 'N. Bélanger', 'T. Adeyemi', 'P. Gagnon', 'Y. Chen', 'F. Côté', 'K. Amani', 'D. Leblanc', 'I. Moreau', 'B. Sow', 'G. Fortin', 'O. Traoré', 'V. Roy', 'W. Nakamura', 'Z. Pelletier', 'A. Bouchard', 'M. Kaboré', 'É. Girard', 'S. Park', 'L. Mbeki']

function buildWall() {
  const rand = mulberry32(17)
  const families = Object.keys(FAMILY)
  return WALL_NAMES.map((name, index) => {
    const family = families[Math.floor(rand() * 4)]
    const pool = FAMILY_ACTION_ORDER[family]
    const count = 1 + Math.floor(rand() * 3)
    const others = Object.keys(ACTIONS).filter((id) => !pool.includes(id))
    const actions = [...[...pool].sort(() => rand() - 0.5).slice(0, count + 1), ...others.sort(() => rand() - 0.5).slice(0, Math.floor(rand() * 3))]
    const secrets = rand() > 0.6 ? [Object.keys(SECRETS)[Math.floor(rand() * 4)]] : []
    return {
      key: `wall-${index}`,
      family,
      actions,
      name,
      strokes: [],
      number: `NQ ${String(Math.floor(rand() * 1000)).padStart(3, '0')} ${String(Math.floor(rand() * 1000)).padStart(3, '0')}`,
      secrets,
      hidden: secrets.length > 0,
    }
  })
}

function WallTile({ entry, isYou }) {
  return (
    <article className={`nq-tile2 ${isYou ? 'is-you' : ''}`} style={{ '--family-accent': FAMILY[entry.family].accent }}>
      {isYou && <span className="nq-tile-you">YOUR RECORD</span>}
      <CardFront family={entry.family} actions={entry.actions} secrets={entry.secrets || []} owner={{ name: entry.name, number: entry.number, issued: entry.issued || '24 SEP 2026', signature: entry.strokes }} detail={0.45} stamp={isYou} />
    </article>
  )
}

function CollectionRoom({ path, navigate, record }) {
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('wall')
  const families = Object.keys(FAMILY)
  const currentFamily = getOutcome(record.actions)
  const resolved = record.actions.length >= RESOLVE_AT
  const base = useMemo(buildWall, [])
  const you = resolved ? {
    key: 'you',
    family: currentFamily,
    actions: record.actions,
    name: record.name,
    strokes: record.signature,
    number: getAccessionNumber(record),
    secrets: record.secrets,
    issued: formatIssueDate(record.issuedAt),
    hidden: record.secrets.length > 0,
  } : null
  const all = you ? [...base.slice(0, 12), you, ...base.slice(12, 27)] : base
  const wall = all.filter((entry) => filter === 'all' || filter === entry.family)

  return (
    <RoomShell path={path} navigate={navigate} record={record} tone="collection">
      <section className="collection-room-head">
        <span className="room-kicker">THE LIVING COLLECTION / {view === 'wall' ? 'ACCESSION WALL' : 'NORTH QUARTER'}</span>
        <h1>{view === 'wall' ? <>Different people.<br /><em>Same library.</em></> : <>The collection<br /><em>reveals the quarter.</em></>}</h1>
        <p>{view === 'wall' ? 'Every record keeps the common system, but no two visits leave exactly the same residue.' : 'Pull back far enough and individual records stop looking isolated. Together they form a civic memory of North Quarter.'}</p>
        <div className={`collection-view-toggle ${view === 'wall' ? 'is-wall' : 'is-quarter'}`} role="group" aria-label="Collection view">
          <button className={view === 'wall' ? 'is-current' : ''} onClick={() => setView('wall')}>COLLECTION WALL</button>
          <button className={`collection-reveal-cta ${view === 'quarter' ? 'is-current' : ''}`} onClick={() => setView('quarter')}>
            <span>REVEAL THE QUARTER</span><ArrowRight size={15} />
          </button>
        </div>
        {view === 'wall' && (
          <div className="collection-filters">
            {['all', ...families].map((key) => <button key={key} className={filter === key ? 'is-current' : ''} onClick={() => setFilter(key)}>{key === 'all' ? 'ALL RECORDS' : FAMILY[key].title}</button>)}
          </div>
        )}
      </section>

      {view === 'wall' ? (
        <section className="nq-wall">
          {!resolved && <p className="nq-wall-note">Your card isn’t on the wall yet. Leave {RESOLVE_AT - record.actions.length} more mark{RESOLVE_AT - record.actions.length > 1 ? 's' : ''} in the rooms and it will be accessioned here.</p>}
          {wall.map((entry) => <WallTile key={entry.key} entry={entry} isYou={entry.key === 'you'} />)}
        </section>
      ) : (
        <QuarterCollectionReveal currentFamily={currentFamily} name={record.name} />
      )}

      <footer className="collection-room-footer"><div><Monogram /><span>NORTH QUARTER PUBLIC LIBRARY</span></div><strong>YOUR LIBRARY. YOUR WAY IN.</strong><button onClick={() => navigate('/')}>RETURN TO COMMON ROOM</button></footer>
    </RoomShell>
  )
}


function RecordCard({ record, stamp = false, landing = false, flippable = true, tilt = true }) {
  const resolved = record.actions.length >= RESOLVE_AT
  const family = getOutcome(record.actions)
  const owner = ownerFromRecord(record)
  const front = <CardFront family={family} open={!resolved} actions={record.actions} secrets={record.secrets} owner={owner} stamp={stamp && resolved} />
  const back = <CardBack family={family} open={!resolved} owner={owner} entries={backEntries({ actions: record.actions, secrets: record.secrets, times: record.times, labels: cardLabels(), accents: CARD_ACCENTS, fallback: record.issuedAt || record.startedAt })} />
  return <CardObject front={front} back={back} flippable={flippable} tilt={tilt} landing={landing} />
}

const SPECIMENS = [
  { family: 'reader', actions: ['stacks-fiction', 'stacks-poetry', 'index-021', 'stacks-essay'], secrets: ['borrower'], name: 'Amina Okafor', number: 'NQ 028 417' },
  { family: 'maker', actions: ['workshop-align', 'workshop-ink', 'quarter-market', 'workshop-stock'], secrets: ['imperfection', 'before'], name: 'Luc Tremblay', number: 'NQ 347 190' },
  { family: 'seeker', actions: ['index-021', 'index-114', 'stacks-essay', 'index-403', 'workshop-stock'], secrets: ['curiosity'], name: 'Mei Nguyen', number: 'NQ 618 320' },
  { family: 'local', actions: ['quarter-market', 'quarter-river', 'stacks-fiction'], secrets: ['before', 'borrower'], name: 'Faadil Boussari', number: 'NQ 271 904' },
]

function specimenOwner(s) { return { name: s.name, number: s.number, issued: '24 SEP 2026', signature: [] } }

function cardLabels() {
  return {
    actions: Object.fromEntries(Object.entries(ACTIONS).map(([k, v]) => [k, v.label])),
    secrets: Object.fromEntries(Object.entries(SECRETS).map(([k, v]) => [k, v.label])),
  }
}
const CARD_ACCENTS = { reader: '#7a2e2a', maker: '#c8372a', seeker: '#1c4077', local: '#2b5540' }

function SpecimenBoard() {
  const labels = cardLabels()
  return (
    <main className="lc-board">
      <h1>North Quarter cards</h1>
      <p>Four materials, one cut. The rosette in the window is drawn from each visitor’s own marks: no two cards are the same.</p>
      <ul className="lc-refs">
        <li><b>Edge-notched cards</b> McBee Keysort, 1930s–70s: each mark opens a notch; the accession number is notched in binary along the bottom.</li>
        <li><b>Security guilloche</b> banknotes and passports: the rosette is generated from the visitor’s own marks.</li>
        <li><b>Book cloth, marbled endpapers, ex libris</b> READER.</li>
        <li><b>Letterpress proofs</b> two inks, registration marks, colour bars: MAKER.</li>
        <li><b>Catalogue cards and cyanotypes</b> typewriter, ruled lines: SEEKER.</li>
        <li><b>Transit passes and civic maps</b> LOCAL.</li>
        <li><b>Tipped-in ephemera</b> hidden traces arrive as a 1978 borrower’s card, a kept misprint, an NQ.000 slip, a 1963 postmark.</li>
      </ul>
      <div className="lc-board-grid">
        {SPECIMENS.map((s) => (
          <figure key={s.family}>
            <div className="lc-board-pair">
              <CardObject front={<CardFront family={s.family} actions={s.actions} secrets={s.secrets} owner={specimenOwner(s)} stamp />} back={<CardBack family={s.family} owner={specimenOwner(s)} entries={backEntries({ actions: s.actions, secrets: s.secrets, labels, accents: CARD_ACCENTS, fallback: Date.now() })} />} />
            </div>
            <figcaption>{s.family.toUpperCase()} · {s.actions.length} MARKS · {s.secrets.length} HIDDEN</figcaption>
          </figure>
        ))}
        <figure>
          <CardObject front={<CardFront open actions={[]} secrets={[]} owner={{ number: 'NQ / OPEN', issued: '—' }} />} back={<CardBack open owner={{ number: 'NQ / OPEN' }} entries={[]} />} />
          <figcaption>BEFORE ACCESSION · TEMPORARY CARD</figcaption>
        </figure>
      </div>
    </main>
  )
}

function RoomNext({ label, onClick }) {
  return <div className="room-next"><button onClick={onClick}><span>NEXT PASSAGE</span><strong>{label}</strong><ArrowRight size={18} /></button></div>
}

function NotFound({ navigate }) {
  return <main className="not-found"><Monogram /><span>NQ / UNCATALOGUED</span><h1>This room is not in the index.</h1><button onClick={() => navigate('/')}>Return to Common Room</button></main>
}

function App() {
  const [path, setPath] = usePath()
  const { record, lastMark, addAction, addSecret, setName, setSignature, markStampSeen, reset } = useMemberRecord()
  const [transition, setTransition] = useState(null)

  const navigate = (next) => {
    if (next === path) return
    const words = TRANSITIONS[next] || ['NEXT', 'ROOM']
    setTransition({
      words,
      from: TRACE_FORM[path] || 'origin',
      to: TRACE_FORM[next] || 'next',
    })
    window.setTimeout(() => {
      window.history.pushState({}, '', next)
      setPath(next)
      window.scrollTo(0, 0)
    }, 260)
    window.setTimeout(() => setTransition(null), 720)
  }

  const props = { path, navigate, record, addAction, addSecret, setName, setSignature, markStampSeen, reset }
  let page
  if (path === '/') page = <Lobby {...props} />
  else if (path === '/stacks') page = <StacksRoom {...props} />
  else if (path === '/workshop') page = <WorkshopRoom {...props} />
  else if (path === '/index') page = <IndexRoom {...props} />
  else if (path === '/quarter') page = <QuarterRoom {...props} />
  else if (path === '/record') page = <RecordRoom {...props} />
  else if (path === '/collection') page = <CollectionRoom {...props} />
  else if (path === '/cards') page = <SpecimenBoard />
  else page = <NotFound navigate={navigate} />

  return (
    <>
      {page}
      <MarkSlip lastMark={lastMark} />
      <div className={`passage-transition ${transition ? 'is-active' : ''} ${transition ? `trace-from-${transition.from} trace-to-${transition.to}` : ''}`} aria-hidden="true">
        {transition && (
          <>
            <span>{transition.words[0]}</span>
            <div className="passage-trace">
              <i className="trace-segment trace-segment-a" />
              <i className="trace-segment trace-segment-b" />
              <b className="trace-node" />
            </div>
            <strong>{transition.words[1]}</strong>
            <small>ONE TRACE / MANY FORMS</small>
          </>
        )}
      </div>
    </>
  )
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
