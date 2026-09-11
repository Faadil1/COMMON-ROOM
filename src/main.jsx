import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import './styles.css'
import './refinement.css'
import './rooms.css'

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

function getOutcome(actions) {
  const score = { reader: 0, maker: 0, seeker: 0, local: 0 }
  actions.forEach((id) => {
    const action = ACTIONS[id]
    if (action) score[action.family] += 1
  })
  const ranked = Object.entries(score).sort((a, b) => b[1] - a[1])
  return ranked[0][1] > 0 ? ranked[0][0] : 'reader'
}

function Monogram() {
  return (
    <div className="monogram" aria-label="North Quarter mark">
      <span>N</span><span>Q</span>
    </div>
  )
}

function MemberCard({ family = 'reader', actions = [], compact = false, resolved = false, unregistered = false }) {
  const meta = FAMILY[family]
  const visualTraces = actions.slice(-3).map((id) => ACTIONS[id]).filter(Boolean)
  return (
    <article
      className={`member-card family-${family} ${compact ? 'member-card--compact' : ''} ${resolved ? 'member-card--resolved' : ''} ${unregistered ? 'member-card--unregistered' : ''}`}
      style={{ '--family-accent': meta.accent }}
    >
      <div className="paper-grain" aria-hidden="true" />
      <div className="card-register" aria-hidden="true"><span /><span /></div>
      <header className="card-brand">
        <Monogram />
        <div><strong>North Quarter</strong><span>Public Library</span></div>
      </header>
      <div className="card-title-row">
        <h3>{unregistered ? 'UNREGISTERED' : meta.title}</h3>
        {!compact && <span className="card-edition">{unregistered ? 'OPEN / 000' : meta.edition}</span>}
      </div>
      <div className="card-mark" aria-hidden="true">
        <span className="mark mark-a" /><span className="mark mark-b" /><span className="mark mark-c" /><span className="mark-line" />
      </div>
      {!compact && (
        <>
          <p className="card-statement">{unregistered ? 'Your record changes as you move through the library.' : meta.statement}</p>
          <div className="card-member"><strong>{unregistered ? 'NQ / OPEN' : meta.code}</strong><span>MARA ELLIS</span></div>
          <div className="card-detail">{unregistered ? 'NO TRACE YET' : meta.detail}</div>
        </>
      )}
      {visualTraces.map((trace, index) => (
        <span key={`${trace.label}-${index}`} className={`card-trace trace-${index + 1}`}>{trace.glyph}</span>
      ))}
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
  return (
    <main className={`room-page room-tone-${tone}`}>
      <SiteHeader path={path} navigate={navigate} />
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
          <div className="lobby-vitrine"><MemberCard family={family} actions={record.actions} resolved={record.actions.length >= 3} unregistered={!record.actions.length} /></div>
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
  const [registration, setRegistration] = useState(31)
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
            <button className="room-primary room-primary-light" onClick={() => navigate(resolved ? '/collection' : '/stacks')}>{resolved ? 'Enter the living collection' : 'Keep exploring'} <ArrowRight size={16} /></button>
            <button className="room-reset" onClick={reset}><RotateCcw size={14} /> Reset record</button>
          </div>
        </div>
        <div className="record-object">
          <div className="record-light" />
          <MemberCard family={family} actions={record.actions} resolved={resolved} unregistered={!resolved} />
          <span className="hidden-emboss">YOU WERE HERE.</span>
          <div className="record-ledger">
            <span>{record.actions.length} REGISTERED MARKS</span><span>{record.secrets.length}/4 HIDDEN TRACES</span>
          </div>
          {record.secrets.length > 0 && <div className="secret-ledger">{record.secrets.map((id) => <span key={id}>{SECRETS[id].glyph} / {SECRETS[id].label}</span>)}</div>}
        </div>
      </section>
    </RoomShell>
  )
}

function CollectionRoom({ path, navigate, record }) {
  const [filter, setFilter] = useState('all')
  const families = Object.keys(FAMILY)
  const wall = Array.from({ length: 28 }).map((_, index) => families[index % 4]).filter((family) => filter === 'all' || filter === family)
  return (
    <RoomShell path={path} navigate={navigate} record={record} tone="collection">
      <section className="collection-room-head">
        <span className="room-kicker">THE LIVING COLLECTION / ACCESSION WALL</span>
        <h1>Different people.<br /><em>Same library.</em></h1>
        <p>Every record keeps the common system, but no two visits leave exactly the same residue.</p>
        <div className="collection-filters">
          {['all', ...families].map((key) => <button key={key} className={filter === key ? 'is-current' : ''} onClick={() => setFilter(key)}>{key === 'all' ? 'ALL RECORDS' : FAMILY[key].title}</button>)}
        </div>
      </section>
      <section className="living-wall">
        {wall.map((family, index) => (
          <button key={`${family}-${index}`} className={`living-record family-${family}`} style={{ '--family-accent': FAMILY[family].accent }}>
            <span>NQ / {String(index + 17).padStart(4, '0')}</span><strong>{FAMILY[family].title}</strong><i /><small>{index % 3 === 0 ? 'MARGIN' : index % 3 === 1 ? 'REGISTER' : 'TRACE'}</small>
          </button>
        ))}
      </section>
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
    setTransition(words)
    window.setTimeout(() => {
      window.history.pushState({}, '', next)
      setPath(next)
      window.scrollTo(0, 0)
    }, 260)
    window.setTimeout(() => setTransition(null), 640)
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
      <div className={`passage-transition ${transition ? 'is-active' : ''}`} aria-hidden="true">
        {transition && <><span>{transition[0]}</span><i>→</i><strong>{transition[1]}</strong></>}
      </div>
    </>
  )
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
