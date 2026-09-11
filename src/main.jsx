import React, { useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowDownRight, ArrowRight, RotateCcw } from 'lucide-react'
import './styles.css'
import './refinement.css'

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

const FRAGMENTS = [
  { id: 'margin', family: 'reader', kicker: 'READ', title: 'Margin note', body: 'Ideas travel further here.', glyph: '¶' },
  { id: 'leaf', family: 'reader', kicker: 'READ', title: 'Pressed page', body: 'Return to the page.', glyph: '❧' },
  { id: 'crop', family: 'maker', kicker: 'MAKE', title: 'Registration', body: 'Things become real by making.', glyph: '⌗' },
  { id: 'grid', family: 'maker', kicker: 'MAKE', title: 'Workshop grid', body: 'Build, test, leave a trace.', glyph: '╳' },
  { id: 'index', family: 'seeker', kicker: 'SEEK', title: 'Index card', body: 'Questions create paths.', glyph: '⌖' },
  { id: 'catalog', family: 'seeker', kicker: 'SEEK', title: 'Catalogue mark', body: 'Keep looking.', glyph: '✦' },
  { id: 'map', family: 'local', kicker: 'BELONG', title: 'Quarter map', body: 'A place held in common.', glyph: '⌑' },
  { id: 'stamp', family: 'local', kicker: 'BELONG', title: 'Civic stamp', body: 'Same library. Different stories.', glyph: '◎' },
]

function getOutcome(selected) {
  if (!selected.length) return 'reader'
  const score = selected.reduce((acc, id) => {
    const item = FRAGMENTS.find((fragment) => fragment.id === id)
    if (item) acc[item.family] = (acc[item.family] || 0) + 1
    return acc
  }, {})
  return Object.entries(score).sort((a, b) => b[1] - a[1])[0]?.[0] || 'reader'
}

function Monogram() {
  return (
    <div className="monogram" aria-label="North Quarter mark">
      <span>N</span><span>Q</span>
    </div>
  )
}

function MemberCard({ family = 'reader', selected = [], compact = false, resolved = false }) {
  const meta = FAMILY[family]
  return (
    <article
      className={`member-card family-${family} ${compact ? 'member-card--compact' : ''} ${resolved ? 'member-card--resolved' : ''}`}
      style={{ '--family-accent': meta.accent }}
    >
      <div className="paper-grain" aria-hidden="true" />
      <div className="card-register" aria-hidden="true"><span /><span /></div>
      <header className="card-brand">
        <Monogram />
        <div>
          <strong>North Quarter</strong>
          <span>Public Library</span>
        </div>
      </header>
      <div className="card-title-row">
        <h3>{meta.title}</h3>
        {!compact && <span className="card-edition">{meta.edition}</span>}
      </div>
      <div className="card-mark" aria-hidden="true">
        <span className="mark mark-a" />
        <span className="mark mark-b" />
        <span className="mark mark-c" />
        <span className="mark-line" />
      </div>
      {!compact && (
        <>
          <p className="card-statement">{meta.statement}</p>
          <div className="card-member">
            <strong>{meta.code}</strong>
            <span>MARA ELLIS</span>
          </div>
          <div className="card-detail">{meta.detail}</div>
        </>
      )}
      {selected.map((id, index) => {
        const fragment = FRAGMENTS.find((item) => item.id === id)
        return fragment ? (
          <span key={id} className={`card-trace trace-${index + 1}`}>{fragment.glyph}</span>
        ) : null
      })}
    </article>
  )
}

function Fragment({ item, selected, onSelect }) {
  return (
    <button
      className={`fragment fragment-${item.family} ${selected ? 'fragment--selected' : ''}`}
      draggable={!selected}
      onDragStart={(event) => event.dataTransfer.setData('text/plain', item.id)}
      onClick={() => onSelect(item.id)}
      aria-pressed={selected}
    >
      <span className="fragment-kicker">{item.kicker}</span>
      <span className="fragment-glyph">{item.glyph}</span>
      <strong>{item.title}</strong>
      <small>{item.body}</small>
    </button>
  )
}

function App() {
  const [selected, setSelected] = useState([])
  const [revealed, setRevealed] = useState(false)
  const discoverRef = useRef(null)
  const revealRef = useRef(null)
  const outcome = useMemo(() => getOutcome(selected), [selected])
  const result = FAMILY[outcome]

  const addFragment = (id) => {
    setRevealed(false)
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      if (current.length >= 3) return [...current.slice(1), id]
      return [...current, id]
    })
  }

  const reveal = () => {
    if (selected.length < 3) return
    setRevealed(true)
    window.setTimeout(() => revealRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  const reset = () => {
    setSelected([])
    setRevealed(false)
  }

  const drop = (event) => {
    event.preventDefault()
    const id = event.dataTransfer.getData('text/plain')
    if (id) addFragment(id)
  }

  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-ambient hero-ambient-a" />
        <div className="hero-ambient hero-ambient-b" />
        <nav className="masthead">
          <div className="institution"><Monogram /><span>NORTH QUARTER<br />PUBLIC LIBRARY</span></div>
          <span className="day-label">DAY 17 / THE LIVING COLLECTION</span>
        </nav>
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">MEMBERSHIP / BELONGING / PUBLIC CULTURE</span>
            <h1 id="hero-title">COMMON<br /><em>ROOM</em></h1>
            <p>A library card that feels like belonging.</p>
            <button className="cta cta-light" onClick={() => discoverRef.current?.scrollIntoView({ behavior: 'smooth' })}>
              Discover your card <ArrowDownRight size={18} />
            </button>
          </div>
          <div className="vitrine-stage" aria-label="A library member card displayed as a cultural object">
            <div className="vitrine-shadow" />
            <div className="vitrine">
              <MemberCard family="reader" selected={['leaf']} resolved />
            </div>
            <div className="plinth">
              <span>BELONGING</span>
              <span>IS A FORM</span>
              <span>OF KNOWLEDGE.</span>
              <small>NQ / ACCESSION 001</small>
            </div>
          </div>
        </div>
        <footer className="hero-footer">
          <span>PEOPLE / PLACES / IDEAS / POSSIBILITIES</span>
          <span>A MORE CURIOUS TOMORROW</span>
        </footer>
      </section>

      <section className="discover" ref={discoverRef} id="discover" aria-labelledby="discover-title">
        <header className="section-head section-head-dark">
          <span>02 / DISCOVER</span>
          <span>LEAVE YOUR MARK</span>
        </header>
        <div className="discover-intro">
          <div>
            <span className="eyebrow eyebrow-dark">MEMBER RECORD / OPEN</span>
            <h2 id="discover-title">What brings<br />you here?</h2>
          </div>
          <p>Collect three traces from the library. Each one changes the record until your way of belonging becomes visible.</p>
        </div>

        <div className="discover-workbench">
          <div className="fragment-board" aria-label="Cultural fragments">
            {FRAGMENTS.map((item) => (
              <Fragment key={item.id} item={item} selected={selected.includes(item.id)} onSelect={addFragment} />
            ))}
          </div>

          <div className="assembly-column">
            <div
              className={`drop-zone ${selected.length ? 'drop-zone--active' : ''}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={drop}
            >
              <div className="assembly-meta">
                <span>MEMBER RECORD</span>
                <strong>{selected.length}/3 TRACES REGISTERED</strong>
              </div>
              <MemberCard family={outcome} selected={selected} resolved={selected.length === 3} />
              <p className="drop-hint">Drag a fragment here, or tap one on the board.</p>
            </div>

            <div className="assembly-actions">
              <button className="reset" onClick={reset} disabled={!selected.length}><RotateCcw size={15} /> Reset</button>
              <button className="cta cta-dark" onClick={reveal} disabled={selected.length < 3}>
                Reveal your card <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={`reveal ${revealed ? 'reveal--active' : ''}`} ref={revealRef} aria-labelledby="reveal-title">
        <header className="section-head">
          <span>03 / MEMBER RECORD</span>
          <span>YOU’RE PART OF THE COLLECTION</span>
        </header>
        <div className="reveal-grid">
          <div className="reveal-copy">
            <span className="eyebrow">ACCESSION / ACCEPTED</span>
            <h2 id="reveal-title">Your mark<br />has a place.</h2>
            <p>Your card resolves as <strong>{result.title}</strong> — one expression of a shared institution, shaped by the traces you left behind.</p>
            <div className="specimen-facts">
              <div><span>RECORD</span><strong>{result.code}</strong></div>
              <div><span>EDITION</span><strong>{result.edition}</strong></div>
              <div><span>TRACE</span><strong>{result.detail}</strong></div>
            </div>
          </div>
          <div className="reveal-object">
            <div className="object-light" />
            <MemberCard family={outcome} selected={selected} resolved />
            <div className="material-strip">
              <span><i className="material-swatch swatch-emboss" />Embossed identity</span>
              <span><i className="material-swatch swatch-print" />Registered trace</span>
              <span><i className="material-swatch swatch-edge" />Tactile stock</span>
            </div>
          </div>
        </div>
      </section>

      <section className="collection" aria-labelledby="collection-title">
        <header className="section-head section-head-dark">
          <span>04 / THE COLLECTION</span>
          <span>DIFFERENT PEOPLE. SAME LIBRARY.</span>
        </header>
        <div className="collection-headline">
          <h2 id="collection-title">Every member becomes<br /><em>part of the collection.</em></h2>
          <p>Four relationship identities. One shared institution. The card is not the end of the experience — it is the record that you were here.</p>
        </div>
        <div className="family-grid">
          {Object.keys(FAMILY).map((family) => (
            <div className="family-item" key={family}>
              <MemberCard family={family} compact resolved />
              <div className="family-caption"><strong>{FAMILY[family].title}</strong><span>{family === 'reader' ? 'Knowledge' : family === 'maker' ? 'Creation' : family === 'seeker' ? 'Exploration' : 'Community'}</span></div>
            </div>
          ))}
        </div>
        <div className="archive-wall" aria-label="A glimpse of the larger living collection">
          {Array.from({ length: 20 }).map((_, index) => {
            const family = Object.keys(FAMILY)[index % 4]
            return <div key={index} className={`archive-mini family-${family}`}><span>NQ</span><i /></div>
          })}
          <div className="archive-message">
            <span>A LIVING COLLECTION</span>
            <strong>BUILT BY ITS MEMBERS.</strong>
          </div>
        </div>
        <footer className="collection-footer">
          <div><Monogram /><span>NORTH QUARTER PUBLIC LIBRARY</span></div>
          <strong>YOUR LIBRARY. YOUR WAY IN.</strong>
          <span>DAY 17 / COMMON ROOM</span>
        </footer>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
