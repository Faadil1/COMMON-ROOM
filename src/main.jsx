import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createPortal } from 'react-dom'
import { ArrowRight, Download, Eraser, Printer, RotateCcw, Share2, Volume2, VolumeX, X } from 'lucide-react'
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
import './rooms2.css'
import './makingOf.css'
import { StacksScene, WorkshopScene, IndexScene, QuarterScene } from './rooms.jsx'
import { play, soundEnabled, setSoundEnabled, onSoundChange } from './sound.js'
import { encodeCard, decodeCard, shareUrl } from './share.js'
import { RESOLVE_AT, getAccessionNumber, formatIssueDate, getOutcome } from './recordLogic.js'
import { CardFront, CardBack, CardObject, backEntries } from './cardArt.jsx'

const Card3D = lazy(() => import('./card3d.jsx'))
const MakingOf = lazy(() => import('./makingOf.jsx'))
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

const EMPTY_RECORD = { actions: [], secrets: [], name: '', signature: [], startedAt: null, issuedAt: null, stampSeen: false, times: {}, visits: [] }

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
      visits: Array.isArray(stored.visits) ? stored.visits.filter(Number.isFinite).slice(-24) : [],
      wall: stored.wall && typeof stored.wall.id === 'string' && typeof stored.wall.token === 'string' ? stored.wall : null,
    }
  } catch {
    return { ...EMPTY_RECORD }
  }
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


const FAMILY_ACTION_ORDER = {
  reader: ['stacks-fiction', 'stacks-essay', 'stacks-poetry'],
  maker: ['workshop-align', 'workshop-stock', 'workshop-ink'],
  seeker: ['index-021', 'index-114', 'index-403'],
  local: ['quarter-market', 'quarter-school', 'quarter-river'],
}

function CardLensReveal({ family, actions, secrets, navigate, owner }) {
  const [position, setPosition] = useState({ x: 58, y: 52 })
  const [dragging, setDragging] = useState(false)
  const content = LENS_CONTENT[family]

  const moveLens = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.min(80, Math.max(20, ((event.clientX - rect.left) / rect.width) * 100))
    const y = Math.min(74, Math.max(26, ((event.clientY - rect.top) / rect.height) * 100))
    setPosition({ x, y })
  }

  return (
    <section id="member-lens" className={`lens-section family-${family}`}>
      <div className="lens-copy">
        <span className="room-kicker">MEMBER OPTICS / ACCESSION STRATA</span>
        <h2>The card changes<br /><em>what you can see.</em></h2>
        <p>Your card is also an instrument. Drag it across the public register: its window cuts through the page and shows the memory the library keeps for members.</p>
        <div className="lens-proof">
          <span>{actions.length} REGISTERED MARKS</span>
          <span>{secrets.length}/4 HIDDEN TRACES</span>
        </div>
        <button className="lens-continue" onClick={() => navigate('/collection')}>
          <span>ENTER THE LIVING COLLECTION</span><ArrowRight size={15} />
        </button>
      </div>
      <div
        className={`card-lens-stage lens2-stage ${dragging ? 'is-dragging' : ''}`}
        onPointerDown={(event) => { event.currentTarget.setPointerCapture?.(event.pointerId); setDragging(true); moveLens(event) }}
        onPointerMove={(event) => { if (dragging) moveLens(event) }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        <div className="lens-archive">
          <span>ACCESSION / NQ 1963–2026</span>
          <strong>NORTH QUARTER / PUBLIC MEMORY REGISTER</strong>
          <i />
          <small>Drag your card across this surface.</small>
        </div>
        <div className="lens2" style={{ left: `${position.x}%`, top: `${position.y}%` }}>
          <div className="lens2-window" aria-hidden="true">
            <span>MEMBER-ONLY ARCHIVE</span>
            <strong>{content.title}</strong>
            <p>{content.primary}</p>
            <small>{content.secondary}</small>
          </div>
          <CardFront family={family} actions={actions} secrets={secrets} owner={owner} hollow compact />
          <span className="lens2-cue">{dragging ? 'READING BENEATH…' : 'DRAG THE CARD'}</span>
        </div>
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

// A visit counts as a renewal when it happens at least six hours after the card was issued.
const VISIT_GAP = 6 * 60 * 60 * 1000
function renewalsOf(record) {
  if (!record.issuedAt) return []
  return (record.visits || []).filter((ts) => ts - record.issuedAt > VISIT_GAP)
}

function ownerFromRecord(record) {
  const renewals = renewalsOf(record)
  const days = record.issuedAt ? (Date.now() - record.issuedAt) / 86400000 : 0
  const resolved = record.actions.length >= RESOLVE_AT
  return {
    name: record.name,
    signature: record.signature,
    number: getAccessionNumber(record),
    issued: formatIssueDate(record.issuedAt),
    renewals: renewals.length,
    renewed: renewals.length ? formatIssueDate(renewals[renewals.length - 1]) : null,
    wear: Math.min(1, renewals.length * 0.18 + Math.max(0, days) / 90),
    qr: resolved ? shareUrl(record, { signature: false }) : null,
  }
}

function recordEntries(record) {
  return backEntries({ actions: record.actions, secrets: record.secrets, times: record.times, labels: cardLabels(), accents: CARD_ACCENTS, fallback: record.issuedAt || record.startedAt, renewals: renewalsOf(record) })
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
    setRecord((current) => {
      if (!current.actions.length) return current
      const last = current.visits[current.visits.length - 1] || 0
      const now = Date.now()
      return now - last > VISIT_GAP ? { ...current, visits: [...current.visits, now].slice(-24) } : current
    })
  }, [])
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
  const setWall = (wall) => setRecord((current) => ({ ...current, wall }))
  const reset = () => { setRecord((current) => ({ ...EMPTY_RECORD, wall: null, pastWall: current.wall || current.pastWall || null })); setLastMark(null) }
  return { record, lastMark, addAction, addSecret, setName, setSignature, markStampSeen, setWall, reset }
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
      <div className="nq-header-tools">
        <SoundToggle />
        <MemberPassport record={record} navigate={navigate} current={path === '/record'} />
      </div>
    </header>
  )
}

function SoundToggle() {
  const [on, setOn] = useState(soundEnabled())
  useEffect(() => onSoundChange(setOn), [])
  return (
    <button type="button" className={`nq-sound ${on ? 'is-on' : ''}`} onClick={() => setSoundEnabled(!on)} aria-pressed={on} aria-label={on ? 'Turn library sounds off' : 'Turn library sounds on'} title={on ? 'Sound on' : 'Sound off'}>
      {on ? <Volume2 size={15} /> : <VolumeX size={15} />}
    </button>
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

function LobbyFan({ record, resolved }) {
  // The fan is decorative: draw it after first paint so the lobby shows up immediately.
  const [showFan, setShowFan] = useState(false)
  useEffect(() => {
    const idle = window.requestIdleCallback || ((fn) => window.setTimeout(fn, 250))
    const cancel = window.cancelIdleCallback || window.clearTimeout
    const id = idle(() => setShowFan(true), { timeout: 900 })
    return () => cancel(id)
  }, [])
  const fan = showFan ? SPECIMENS.filter((sp) => !resolved || sp.family !== getOutcome(record.actions)) : []
  return (
    <div className={`nq-fan ${resolved ? 'is-resolved' : ''}`}>
      <div className="nq-fan-back" aria-hidden="true">
        {fan.map((sp, i) => (
          <div key={sp.family} className="nq-fan-card" style={{ '--i': i, '--n': fan.length }}>
            <CardFront family={sp.family} actions={sp.actions} secrets={sp.secrets} owner={specimenOwner(sp)} detail={0.5} stamp />
          </div>
        ))}
      </div>
      <div className="nq-fan-front"><RecordCard record={record} stamp={resolved} /></div>
      <p className="nq-fan-caption">{resolved ? 'Yours, in front. The others are what other visits became.' : 'Four families. Which one you carry depends on what you do inside.'}</p>
    </div>
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
            ? <p className="lobby-remembered">The library remembers you, <em>{firstName}</em>. {record.actions.length} marks, {record.secrets.length} hidden trace{record.secrets.length === 1 ? '' : 's'}, one card.{renewalsOf(record).length ? ` Visit ${renewalsOf(record).length + 1}: your card was stamped renewed.` : ''}</p>
            : <p>You don’t get a library card here. You <em>accumulate</em> one, from what you actually do inside.</p>}
          <button className="room-primary room-primary-light" onClick={() => navigate(started ? (resolved ? '/record' : nextRoom(record)) : '/stacks')}>
            {!started ? 'Enter the library' : resolved ? 'Open your record' : 'Continue your visit'} <ArrowRight size={17} />
          </button>
        </div>
        <div className="lobby-object">
          <LobbyFan record={record} resolved={resolved} />
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
  return (
    <RoomShell path={path} navigate={navigate} record={record} tone="paper">
      <section className="room-intro">
        <div><span className="room-kicker">01 / READ / THE STACKS</span><h1>Some books<br /><em>remember you.</em></h1></div>
        <p>Pull one of the labelled books from the shelf and leave a pencil mark in its margin. Look closely: not every book is on the catalogue.</p>
      </section>
      <StacksScene record={record} addAction={addAction} addSecret={addSecret} />
      <RoomNext label="Follow a mark into the workshop" onClick={() => navigate('/workshop')} />
    </RoomShell>
  )
}

function WorkshopRoom({ path, navigate, record, addAction, addSecret }) {
  return (
    <RoomShell path={path} navigate={navigate} record={record} tone="workshop">
      <section className="room-intro">
        <div><span className="room-kicker">02 / MAKE / THE WORKSHOP</span><h1>Make the mark<br /><em>hold.</em></h1></div>
        <p>Slide the plate until the red and blue impressions become one, then pull the proof. Choose the paper and the ink it is made from.</p>
      </section>
      <WorkshopScene record={record} addAction={addAction} addSecret={addSecret} />
      <RoomNext label="Follow the registration number" onClick={() => navigate('/index')} />
    </RoomShell>
  )
}

function IndexRoom({ path, navigate, record, addAction, addSecret }) {
  return (
    <RoomShell path={path} navigate={navigate} record={record} tone="index">
      <section className="room-intro room-intro-light">
        <div><span className="room-kicker">03 / SEEK / THE INDEX</span><h1>A question is<br /><em>a route.</em></h1></div>
        <p>Open drawer NQ.021. Every catalogue card points to the next one. Follow the chain far enough and the catalogue stops behaving like a list.</p>
      </section>
      <IndexScene record={record} addAction={addAction} addSecret={addSecret} />
      <RoomNext label="Turn references into places" onClick={() => navigate('/quarter')} />
    </RoomShell>
  )
}

function QuarterRoom({ path, navigate, record, addAction, addSecret }) {
  return (
    <RoomShell path={path} navigate={navigate} record={record} tone="quarter">
      <section className="room-intro">
        <div><span className="room-kicker">04 / BELONG / THE QUARTER</span><h1>The library is<br /><em>larger than its walls.</em></h1></div>
        <p>Pin the places that make the library feel local. Each one draws a route from the reading room into the city, and into your record.</p>
      </section>
      <QuarterScene record={record} addAction={addAction} addSecret={addSecret} />
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

// Offscreen source SVGs for the PNG export and the print sheet.
function ExportFrame({ family, record, frameRef }) {
  const owner = ownerFromRecord(record)
  return (
    <div className="nq-export-host" aria-hidden="true" ref={frameRef}>
      <div data-print="back" style={{ width: 856 }}><CardBack family={family} owner={owner} entries={recordEntries(record)} qr={owner.qr} /></div>
      <div data-print="front" style={{ width: 856 }}><CardFront family={family} actions={record.actions} secrets={record.secrets} owner={owner} stamp /></div>
    </div>
  )
}

function WallConsent({ record, setWall }) {
  const [agree, setAgree] = useState(false)
  const [state, setState] = useState(null)
  const code = encodeCard(record)
  const call = async (method, url, body) => {
    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json', ...(record.wall ? { 'x-wall-token': record.wall.token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
  }
  const explain = (status, data) => {
    if (status === 503) return 'The shared wall isn’t switched on yet. Your card is still yours, here.'
    if (data?.error === 'name-not-allowed') return 'That name can’t go on a public wall. Try just your first name.'
    if (data?.error === 'already-on-wall') return 'This card is already on the wall.'
    if (status === 429) return 'Too many cards from here in the last hour. Try again later.'
    return 'Couldn’t reach the wall. Try again in a moment.'
  }
  const add = async () => {
    setState({ busy: true })
    try {
      const { ok, status, data } = await call('POST', '/api/wall', { code })
      if (ok) { setWall({ id: data.id, token: data.token }); play('stamp'); setState({ msg: 'Your card is on the Living Collection wall.' }) } else setState({ msg: explain(status, data) })
    } catch { setState({ msg: explain(0) }) }
  }
  const update = async () => {
    setState({ busy: true })
    try {
      const { ok, status, data } = await call('PUT', `/api/wall/${record.wall.id}`, { code })
      setState({ msg: ok ? 'The wall now shows your latest card.' : explain(status, data) })
    } catch { setState({ msg: explain(0) }) }
  }
  const remove = async () => {
    setState({ busy: true })
    try {
      const { ok, status, data } = await call('DELETE', `/api/wall/${record.wall.id}`)
      if (ok || status === 404) { setWall(null); setState({ msg: 'Your card was taken down from the wall.' }) } else setState({ msg: explain(status, data) })
    } catch { setState({ msg: explain(0) }) }
  }
  return (
    <div className="nq-wallconsent">
      <span className="nq-desk-kicker">THE LIVING COLLECTION</span>
      {record.wall ? (
        <>
          <p>Your card hangs on the shared wall, next to other visitors’ cards.</p>
          <div className="nq-wallconsent-actions">
            <button type="button" className="room-secondary" onClick={update} disabled={state?.busy}>Update it</button>
            <button type="button" className="room-secondary" onClick={remove} disabled={state?.busy}>Take it down</button>
          </div>
        </>
      ) : (
        <>
          <label className="nq-wallconsent-check">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>Put my card on the public wall. Anyone visiting will see its marks, dates{record.name ? ', the name I wrote' : ''}{record.signature.length ? ' and my signature' : ''}. I can take it down any time.</span>
          </label>
          <button type="button" className="room-secondary" onClick={add} disabled={!agree || state?.busy}>{state?.busy ? 'Hanging it…' : 'Add my card to the wall'}</button>
        </>
      )}
      {state?.msg && <p className="nq-wallconsent-msg" role="status">{state.msg}</p>}
    </div>
  )
}

function RecordRoom({ path, navigate, record, reset, setName, setSignature, markStampSeen, setWall }) {
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
    const thud = use3D ? null : window.setTimeout(() => play('stamp'), 1260)
    const done = window.setTimeout(() => { setLanding(false); markStampSeen() }, 2400)
    return () => { window.clearTimeout(start); window.clearTimeout(done); if (thud) window.clearTimeout(thud) }
  }, [resolved, record.stampSeen])

  const showStamp = resolved && (record.stampSeen || landing)

  const [shareState, setShareState] = useState(null)
  const [printing, setPrinting] = useState(false)
  const shareCard = async () => {
    const url = `${window.location.origin}/card/${encodeCard(record)}`
    if (navigator.share) {
      try { await navigator.share({ title: 'My North Quarter library card', text: `${meta.title} · ${getAccessionNumber(record)}. You don’t receive a card here, you accumulate one.`, url }); return } catch (error) { if (error?.name === 'AbortError') return }
    }
    try { await navigator.clipboard.writeText(url); setShareState('Link copied. Anyone who opens it sees your card.') } catch { setShareState(url) }
  }
  const printPdf = async () => {
    const front = exportRef.current?.querySelector('[data-print="front"] svg')
    const back = exportRef.current?.querySelector('[data-print="back"] svg')
    if (!front || !back || printing) return
    setPrinting(true)
    try {
      const { printCard } = await import('./print.js')
      await printCard({ front, back, number: getAccessionNumber(record), name: record.name })
    } catch (error) {
      console.error('Print failed', error)
    } finally {
      setPrinting(false)
    }
  }

  const download = async () => {
    const front = exportRef.current?.querySelector('[data-print="front"] svg')
    const back = exportRef.current?.querySelector('[data-print="back"] svg')
    if (!front || !back || exporting) return
    setExporting(true)
    try {
      const { exportCardImage } = await import('./exportImage.js')
      await exportCardImage({ front, back, number: getAccessionNumber(record), footer: `${record.actions.length} MARKS · ${record.secrets.length}/4 HIDDEN TRACES · ${getAccessionNumber(record)}` })
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
              <p className="nq-desk-note">Stays in this browser, unless you choose to add your card to the wall below.</p>
            </div>
          )}
          {resolved && <WallConsent record={record} setWall={setWall} />}
          <div className="record-actions">
            {resolved
              ? <button className="room-primary room-primary-light" onClick={download} disabled={exporting}><Download size={16} /> {exporting ? 'Printing your card…' : 'Take your card home'}</button>
              : <button className="room-primary room-primary-light" onClick={() => navigate(nextRoom(record))}>Keep exploring <ArrowRight size={16} /></button>}
            {resolved && <button className="room-secondary" onClick={printPdf} disabled={printing}><Printer size={14} /> {printing ? 'Preparing the sheet…' : 'Print it (PDF)'}</button>}
            {resolved && <button className="room-secondary" onClick={shareCard}><Share2 size={14} /> Share your card</button>}
            {resolved && <button className="room-secondary" onClick={() => document.getElementById('member-lens')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Member Lens <ArrowRight size={14} /></button>}
            <button className="room-reset" onClick={reset}><RotateCcw size={14} /> Reset record</button>
          </div>
          {shareState && <p className="nq-share-state" role="status">{shareState}</p>}
        </div>
        <div className="record-object">
          <div className="record-light" />
          {use3D ? (
            <Suspense fallback={<RecordCard record={record} stamp={showStamp} flippable={false} />}>
              <Card3D
                family={family}
                record={record}
                owner={ownerFromRecord(record)}
                entries={recordEntries(record)}
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
      {resolved && <CardLensReveal family={family} actions={record.actions} secrets={record.secrets} navigate={navigate} owner={ownerFromRecord(record)} />}
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

function WallTile({ entry, isYou, onOpen, index }) {
  return (
    <button type="button" className={`nq-tile2 ${isYou ? 'is-you' : ''}`} style={{ '--family-accent': FAMILY[entry.family].accent, '--d': `${Math.min(index, 20) * 35}ms` }} onClick={() => onOpen(entry)} aria-label={`${isYou ? 'Your card' : `${entry.name}'s card`}: ${FAMILY[entry.family].title}, ${entry.number}. Open`}>
      {isYou && <span className="nq-tile-you">YOUR RECORD</span>}
      {entry.specimen && <span className="nq-tile-specimen">SPECIMEN</span>}
      <CardFront family={entry.family} actions={entry.actions} secrets={entry.secrets || []} owner={{ name: entry.name, number: entry.number, issued: entry.issued || '24 SEP 2026', signature: entry.strokes }} detail={0.45} stamp={isYou} />
    </button>
  )
}

function CardModal({ entry, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const owner = { name: entry.name, number: entry.number, issued: entry.issued || '24 SEP 2026', signature: entry.strokes }
  const entries = backEntries({ actions: entry.actions, secrets: entry.secrets || [], times: entry.times || {}, labels: cardLabels(), accents: CARD_ACCENTS, fallback: entry.issuedAt || Date.now() })
  return createPortal(
    <div className="nq-modal" role="dialog" aria-modal="true" aria-label={`${entry.name || 'Member'} card`} onClick={onClose}>
      <div className="nq-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="nq-modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <CardObject front={<CardFront family={entry.family} actions={entry.actions} secrets={entry.secrets || []} owner={owner} stamp />} back={<CardBack family={entry.family} owner={owner} entries={entries} />} />
        <p className="nq-modal-caption">{entry.name || 'Unsigned'} · {FAMILY[entry.family].title} · {entry.actions.length} marks{entry.secrets?.length ? ` · ${entry.secrets.length} hidden` : ''}</p>
      </div>
    </div>,
    document.body,
  )
}

// The shared Living Collection (Cloudflare D1). When it isn't configured, the wall falls back to specimens.
function useLiveWall(refreshKey) {
  const [wall, setWall] = useState({ status: 'loading', cards: [], total: 0 })
  useEffect(() => {
    let alive = true
    fetch('/api/wall?limit=60', { headers: { accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => { if (alive) setWall({ status: 'live', cards: data.cards || [], total: data.total || 0 }) })
      .catch(() => { if (alive) setWall({ status: 'offline', cards: [], total: 0 }) })
    return () => { alive = false }
  }, [refreshKey])
  return wall
}

function entryFromCode(id, code, createdAt) {
  const rec = decodeCard(code)
  if (!rec || rec.actions.length < RESOLVE_AT) return null
  return {
    key: `live-${id}`,
    liveId: id,
    family: getOutcome(rec.actions),
    actions: rec.actions,
    secrets: rec.secrets,
    name: rec.name,
    strokes: rec.signature,
    number: getAccessionNumber(rec),
    issuedAt: rec.issuedAt,
    issued: formatIssueDate(rec.issuedAt),
    added: createdAt,
  }
}

function CollectionRoom({ path, navigate, record }) {
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('wall')
  const [openEntry, setOpenEntry] = useState(null)
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
    times: record.times,
    issuedAt: record.issuedAt,
    issued: formatIssueDate(record.issuedAt),
    hidden: record.secrets.length > 0,
  } : null
  const live = useLiveWall(record.wall?.id || '')
  const liveEntries = useMemo(() => live.cards.map((c) => entryFromCode(c.id, c.code, c.created_at)).filter(Boolean), [live.cards])
  let all
  if (live.status === 'live' && liveEntries.length) {
    const mine = liveEntries.find((e) => e.liveId === record.wall?.id)
    const others = liveEntries.filter((e) => e !== mine)
    const own = mine ? { ...mine, key: 'you' } : you
    const specimens = base.slice(0, Math.max(0, 8 - liveEntries.length)).map((e) => ({ ...e, specimen: true }))
    all = [...(own ? [own] : []), ...others, ...specimens]
  } else {
    all = you ? [...base.slice(0, 12), you, ...base.slice(12, 27)] : base
  }
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
          {live.status === 'live' && <p className="nq-wall-note nq-wall-live">{live.total ? `${live.total} ${live.total === 1 ? 'visitor has' : 'visitors have'} added their card to this wall.` : 'No visitor has added a card yet. Be the first, from your Member Record.'}{resolved && !record.wall ? ' Add yours from your Member Record.' : ''}</p>}
          {!resolved && <p className="nq-wall-note">Your card isn’t on the wall yet. Leave {RESOLVE_AT - record.actions.length} more mark{RESOLVE_AT - record.actions.length > 1 ? 's' : ''} in the rooms and it will be accessioned here.</p>}
          {wall.map((entry, index) => <WallTile key={entry.key} entry={entry} index={index} isYou={entry.key === 'you'} onOpen={setOpenEntry} />)}
        </section>
      ) : (
        <QuarterCollectionReveal currentFamily={currentFamily} name={record.name} />
      )}

      {openEntry && <CardModal entry={openEntry} onClose={() => setOpenEntry(null)} />}
      <p className="nq-makingof"><button className="nq-makingof-link" onClick={() => navigate('/making-of')}>THE MAKING OF COMMON ROOM →</button></p>
      <footer className="collection-room-footer"><div><Monogram /><span>NORTH QUARTER PUBLIC LIBRARY</span></div><strong>YOUR LIBRARY. YOUR WAY IN.</strong><button onClick={() => navigate('/')}>RETURN TO COMMON ROOM</button></footer>
    </RoomShell>
  )
}


function RecordCard({ record, stamp = false, landing = false, flippable = true, tilt = true }) {
  const resolved = record.actions.length >= RESOLVE_AT
  const family = getOutcome(record.actions)
  const owner = ownerFromRecord(record)
  const front = <CardFront family={family} open={!resolved} actions={record.actions} secrets={record.secrets} owner={owner} stamp={stamp && resolved} />
  const back = <CardBack family={family} open={!resolved} owner={owner} entries={recordEntries(record)} qr={owner.qr} />
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

function SharedCardPage({ code, navigate }) {
  const shared = useMemo(() => decodeCard(code), [code])
  const ok = shared && shared.actions.length >= RESOLVE_AT
  const family = ok ? getOutcome(shared.actions) : 'reader'
  const owner = ok ? ownerFromRecord(shared) : null
  return (
    <main className="room-page room-tone-dark nq-shared">
      <header className="room-header">
        <button className="room-brand" onClick={() => navigate('/')}><Monogram /><span>NORTH QUARTER<br />PUBLIC LIBRARY</span></button>
      </header>
      {ok ? (
        <section className="nq-shared-grid">
          <div className="nq-shared-copy">
            <span className="room-kicker">A NORTH QUARTER MEMBER RECORD · {owner.number}</span>
            <h1>{shared.name ? <>{shared.name.split(' ')[0]}’s<br /><em>library card.</em></> : <>A member’s<br /><em>library card.</em></>}</h1>
            <p>Accessioned {owner.issued} as <strong>{FAMILY[family].title}</strong>. {shared.actions.length} marks, {shared.secrets.length} hidden trace{shared.secrets.length === 1 ? '' : 's'}. Every notch, stamp and line on it is something they actually did in the library.</p>
            <button className="room-primary room-primary-light" onClick={() => navigate('/')}>Accumulate your own <ArrowRight size={16} /></button>
          </div>
          <div className="nq-shared-card"><RecordCard record={shared} stamp /></div>
        </section>
      ) : (
        <section className="nq-shared-grid"><div className="nq-shared-copy"><span className="room-kicker">NQ / UNCATALOGUED</span><h1>This card could<br /><em>not be read.</em></h1><button className="room-primary room-primary-light" onClick={() => navigate('/')}>Enter the library <ArrowRight size={16} /></button></div></section>
      )}
    </main>
  )
}

function RoomNext({ label, onClick }) {
  return <div className="room-next"><button onClick={onClick}><span>NEXT PASSAGE</span><strong>{label}</strong><ArrowRight size={18} /></button></div>
}

function NotFound({ navigate }) {
  return <main className="not-found"><Monogram /><span>NQ / UNCATALOGUED</span><h1>This room is not in the index.</h1><button onClick={() => navigate('/')}>Return to Common Room</button></main>
}

// Each registered mark flies from where you touched to the passport in the header.
const lastPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
window.addEventListener('pointerdown', (e) => { lastPointer.x = e.clientX; lastPointer.y = e.clientY }, true)

function useMarkFlight(lastMark) {
  useEffect(() => {
    if (!lastMark) return
    const target = document.querySelector('.nq-passport')
    if (!target) return
    const entry = lastMark.kind === 'secret' ? SECRETS[lastMark.id] : ACTIONS[lastMark.id]
    const rect = target.getBoundingClientRect()
    const tx = rect.left + 18
    const ty = rect.top + rect.height / 2
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const bump = () => { target.classList.remove('is-bumped'); void target.offsetWidth; target.classList.add('is-bumped') }
    if (reduce || !entry) { bump(); return }
    const chip = document.createElement('span')
    chip.className = 'nq-flyer'
    chip.textContent = entry.glyph.length > 2 ? '✦' : entry.glyph
    chip.style.setProperty('--c', lastMark.kind === 'secret' ? '#9a7a2e' : FAMILY[entry.family].accent)
    document.body.appendChild(chip)
    const sx = lastPointer.x
    const sy = lastPointer.y
    const mx = (sx + tx) / 2
    const my = Math.min(sy, ty) - 120
    const anim = chip.animate([
      { transform: `translate(${sx}px, ${sy}px) scale(.4)`, opacity: 0 },
      { transform: `translate(${sx}px, ${sy - 30}px) scale(1.25)`, opacity: 1, offset: 0.18 },
      { transform: `translate(${mx}px, ${my}px) scale(1)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${tx}px, ${ty}px) scale(.5)`, opacity: .2 },
    ], { duration: 900, easing: 'cubic-bezier(.45,0,.25,1)' })
    anim.onfinish = () => { chip.remove(); bump(); play('mark') }
    return () => { chip.remove() }
  }, [lastMark])
}

function App() {
  const [path, setPath] = usePath()
  const { record, lastMark, addAction, addSecret, setName, setSignature, markStampSeen, setWall, reset } = useMemberRecord()
  const [transition, setTransition] = useState(null)
  useMarkFlight(lastMark)

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

  const props = { path, navigate, record, addAction, addSecret, setName, setSignature, markStampSeen, setWall, reset }
  let page
  if (path === '/') page = <Lobby {...props} />
  else if (path === '/stacks') page = <StacksRoom {...props} />
  else if (path === '/workshop') page = <WorkshopRoom {...props} />
  else if (path === '/index') page = <IndexRoom {...props} />
  else if (path === '/quarter') page = <QuarterRoom {...props} />
  else if (path === '/record') page = <RecordRoom {...props} />
  else if (path === '/collection') page = <CollectionRoom {...props} />
  else if (path === '/cards') page = <SpecimenBoard />
  else if (path === '/making-of') page = <Suspense fallback={<main className="mo" />}><MakingOf navigate={navigate} /></Suspense>
  else if (path.startsWith('/card/')) page = <SharedCardPage code={path.slice(6)} navigate={navigate} />
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
