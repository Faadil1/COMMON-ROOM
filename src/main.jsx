import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import './styles.css'
import './refinement.css'
import './rooms.css'
import './memorability.css'

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

function safeLoadRecord() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      actions: Array.isArray(stored.actions) ? stored.actions.filter((id) => ACTIONS[id]) : [],
      secrets: Array.isArray(stored.secrets) ? stored.secrets.filter((id) => SECRETS[id]) : [],
    }
  } catch {
    return { actions: [], secrets: [] }
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
            <text x="9" y="90">021</text><text x="39" y="49">114</text><text x="73" y="20">403</text>
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
        <span className="room-kicker">MEMBER OPTICS / HIDDEN LAYER</span>
        <h2>The card changes<br /><em>what you can see.</em></h2>
        <p>Move the card across the archive. Only its accession aperture reveals the hidden layer: the same opening that carries your traces becomes an instrument for provenance and memory.</p>
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

function QuarterCollectionReveal({ currentFamily }) {
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
            <b>{isCurrent ? 'YOUR RECORD' : FAMILY[family].title}</b>
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

function MemberCard({ family = 'reader', actions = [], secrets = [], compact = false, resolved = false, unregistered = false }) {
  const meta = FAMILY[family]
  return (
    <article
      className={`member-card family-${family} ${compact ? 'member-card--compact' : ''} ${resolved ? 'member-card--resolved' : ''} ${unregistered ? 'member-card--unregistered' : ''}`}
      style={{ '--family-accent': meta.accent }}
    >
      <div className="paper-grain" aria-hidden="true" />
      <div className="accession-rail" aria-hidden="true"><span>ACCESSION / NQ</span><i /><i /><i /></div>
      <div className="card-register" aria-hidden="true"><span /><span /></div>
      <header className="card-brand">
        <Monogram />
        <div><strong>North Quarter</strong><span>Public Library</span></div>
      </header>
      <div className="card-title-row">
        <h3>{unregistered ? 'UNREGISTERED' : meta.title}</h3>
        {!compact && <span className="card-edition">{unregistered ? 'OPEN / 000' : meta.edition}</span>}
      </div>
      <FamilyEvidenceMark family={family} actions={actions} compact={compact} unregistered={unregistered} />
      <CardPatinaLayer actions={actions} secrets={secrets} compact={compact} />
      {!compact && (
        <>
          <p className="card-statement">{unregistered ? 'Your record changes as you move through the library.' : meta.statement}</p>
          <div className="card-member"><strong>{unregistered ? 'NQ / OPEN' : meta.code}</strong><span>MARA ELLIS</span></div>
          <div className="card-detail">{unregistered ? 'NO TRACE YET' : meta.detail}</div>
        </>
      )}
    </article>
  )
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

function useMemberRecord() {
  const [record, setRecord] = useState(safeLoadRecord)
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(record)), [record])

  const addAction = (id) => {
    if (!ACTIONS[id]) return
    setRecord((current) => current.actions.includes(id) ? current : { ...current, actions: [...current.actions, id] })
  }
  const addSecret = (id) => {
    if (!SECRETS[id]) return
    setRecord((current) => current.secrets.includes(id) ? current : { ...current, secrets: [...current.secrets, id] })
  }
  const reset = () => setRecord({ actions: [], secrets: [] })
  return { record, addAction, addSecret, reset }
}

function SiteHeader({ path, navigate }) {
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
      <span className="room-day">DAY 17</span>
    </header>
  )
}

function MemberPassport({ record, navigate }) {
  const family = getOutcome(record.actions)
  const meta = FAMILY[family]
  const isOpen = record.actions.length < 3
  return (
    <button className="member-passport" onClick={() => navigate('/record')} style={{ '--passport-accent': meta.accent }}>
      <span className="passport-mark">NQ</span>
      <span className="passport-copy"><strong>{isOpen ? 'MEMBER RECORD / OPEN' : meta.title}</strong><small>{record.actions.length} MARKS · {record.secrets.length}/4 HIDDEN</small></span>
      <ArrowRight size={15} />
    </button>
  )
}

function RoomShell({ path, navigate, record, children, tone = 'paper' }) {
  const roomFamily = ROOM_FAMILY[path]
  const roomMarks = roomFamily ? record.actions.filter((id) => ACTIONS[id]?.family === roomFamily) : []
  const remembered = roomMarks.length > 0

  return (
    <main className={`room-page room-tone-${tone} ${remembered ? 'room-is-remembered' : ''}`}>
      <SiteHeader path={path} navigate={navigate} />
      {remembered && (
        <div className={`room-memory-residue memory-${roomFamily} memory-level-${Math.min(3, roomMarks.length)}`} aria-hidden="true">
          <span className="memory-line memory-line-a" />
          <span className="memory-line memory-line-b" />
          <i>{roomMarks.length} TRACE{roomMarks.length > 1 ? 'S' : ''} RETAINED</i>
        </div>
      )}
      {children}
      {path !== '/record' && <MemberPassport record={record} navigate={navigate} />}
    </main>
  )
}

function Lobby({ path, navigate, record }) {
  const family = getOutcome(record.actions)
  const started = record.actions.length > 0
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
          <span className="room-kicker">THE LIVING COLLECTION / MEMBER ENTRY</span>
          <h1>COMMON<br /><em>ROOM</em></h1>
          <p>A library card should not just unlock access. It should remember how you belong.</p>
          <button className="room-primary room-primary-light" onClick={() => navigate(started ? '/record' : '/stacks')}>
            {started ? 'Continue your record' : 'Enter the library'} <ArrowRight size={17} />
          </button>
        </div>
        <div className="lobby-object">
          <div className="lobby-vitrine"><MemberCard family={family} actions={record.actions} secrets={record.secrets} resolved={record.actions.length >= 3} unregistered={!record.actions.length} /></div>
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

function RecordRoom({ path, navigate, record, reset }) {
  const family = getOutcome(record.actions)
  const meta = FAMILY[family]
  const resolved = record.actions.length >= 3
  const familyCounts = Object.keys(FAMILY).map((key) => [key, record.actions.filter((id) => ACTIONS[id]?.family === key).length])
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
          <div className="record-actions">
            <button className="room-primary room-primary-light" onClick={() => resolved ? document.getElementById('member-lens')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) : navigate('/stacks')}>{resolved ? 'Use your Member Lens' : 'Keep exploring'} <ArrowRight size={16} /></button>
            <button className="room-reset" onClick={reset}><RotateCcw size={14} /> Reset record</button>
          </div>
        </div>
        <div className="record-object">
          <div className="record-light" />
          <MemberCard family={family} actions={record.actions} secrets={record.secrets} resolved={resolved} unregistered={!resolved} />
          <span className="hidden-emboss">YOU WERE HERE.</span>
          <div className="record-ledger">
            <span>{record.actions.length} REGISTERED MARKS</span><span>{record.secrets.length}/4 HIDDEN TRACES</span>
          </div>
          {record.secrets.length > 0 && <div className="secret-ledger">{record.secrets.map((id) => <span key={id}>{SECRETS[id].glyph} / {SECRETS[id].label}</span>)}</div>}
        </div>
      </section>
      {resolved && <CardLensReveal family={family} actions={record.actions} secrets={record.secrets} navigate={navigate} />}
    </RoomShell>
  )
}

function CollectionRoom({ path, navigate, record }) {
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('wall')
  const families = Object.keys(FAMILY)
  const currentFamily = getOutcome(record.actions)
  const wall = Array.from({ length: 28 }).map((_, index) => families[index % 4]).filter((family) => filter === 'all' || filter === family)

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
        <section className="living-wall">
          {wall.map((family, index) => (
            <button key={`${family}-${index}`} className={`living-record family-${family}`} style={{ '--family-accent': FAMILY[family].accent }}>
              <span>NQ / {String(index + 17).padStart(4, '0')}</span><strong>{FAMILY[family].title}</strong><i className="living-aperture" /><small>{family === 'reader' ? 'MARGIN' : family === 'maker' ? 'REGISTER' : family === 'seeker' ? 'REFERENCE' : 'ADDRESS'}</small>
            </button>
          ))}
        </section>
      ) : (
        <QuarterCollectionReveal currentFamily={currentFamily} />
      )}

      <footer className="collection-room-footer"><div><Monogram /><span>NORTH QUARTER PUBLIC LIBRARY</span></div><strong>YOUR LIBRARY. YOUR WAY IN.</strong><button onClick={() => navigate('/')}>RETURN TO COMMON ROOM</button></footer>
    </RoomShell>
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
  const { record, addAction, addSecret, reset } = useMemberRecord()
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

  const props = { path, navigate, record, addAction, addSecret, reset }
  let page
  if (path === '/') page = <Lobby {...props} />
  else if (path === '/stacks') page = <StacksRoom {...props} />
  else if (path === '/workshop') page = <WorkshopRoom {...props} />
  else if (path === '/index') page = <IndexRoom {...props} />
  else if (path === '/quarter') page = <QuarterRoom {...props} />
  else if (path === '/record') page = <RecordRoom {...props} />
  else if (path === '/collection') page = <CollectionRoom {...props} />
  else page = <NotFound navigate={navigate} />

  return (
    <>
      {page}
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
