import React, { useMemo, useState } from 'react'
import { play } from './sound.js'

/* THE ROOMS — each one an archive object you actually handle.
   Every registered action still maps to the same record ids, so the card logic is unchanged. */

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const press = (fn) => ({
  role: 'button',
  tabIndex: 0,
  onClick: fn,
  onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn() } },
})

/* ───────────────────────── THE STACKS ───────────────────────── */
const CLOTH = ['#6c2a26', '#2d3a5c', '#3f614d', '#8a6a3a', '#5b4a6e', '#2b2823', '#94452f', '#1c4077', '#7a6a52', '#4b5b3a', '#a2803f', '#3a2f28']
const SPINE_WORDS = ['Atlas', 'Letters', 'Rivers', 'On Maps', 'Tides', 'Weather', 'Tables', 'Hours', 'Pages', 'Bread', 'Glass', 'Salt', 'Nights', 'Bridges', 'Stone', 'Ferries']

const BOOKS = {
  'stacks-fiction': {
    cls: '813', genre: 'FICTION', title: 'A room inside a room', cloth: '#6c2a26',
    left: 'She kept returning to the same page, as if the room behind the words might have moved while she was away.',
    right: ['The lamp was already on. Someone had left the chair turned toward the window, the way you leave a door open for a person who is coming back.', 'She read the line again. It was the third time this winter.'],
    note: 'again — 3rd time',
  },
  'stacks-essay': {
    cls: '028', genre: 'ESSAY', title: 'The public life of reading', cloth: '#2d3a5c',
    left: 'A library is the only room in the city where staying costs nothing and leaving takes something with you.',
    right: ['Nobody asks what you are for. You are allowed to be unfinished here, among other unfinished people.', 'That is the whole argument. The rest is furniture.'],
    note: 'yes. this.',
  },
  'stacks-poetry': {
    cls: '811', genre: 'POETRY', title: 'Margins for weather', cloth: '#3f614d',
    left: 'write the forecast / in the margin / so the next reader / knows it rained here too',
    right: ['snow on the steps,', 'the radiator knocking,', 'a stranger’s pencil', 'agreeing with mine.'],
    note: 'it did.',
  },
}

function shelfRow(seed, count, featured = {}) {
  const rand = rng(seed)
  return Array.from({ length: count }, (_, i) => {
    if (featured[i]) return { featured: featured[i], key: featured[i] }
    return {
      key: `${seed}-${i}`,
      w: 20 + Math.round(rand() * 22),
      h: 70 + Math.round(rand() * 26),
      color: CLOTH[Math.floor(rand() * CLOTH.length)],
      band: rand() > 0.45,
      word: rand() > 0.55 ? SPINE_WORDS[Math.floor(rand() * SPINE_WORDS.length)] : '',
      lean: rand() > 0.93 ? (rand() > 0.5 ? 4 : -4) : 0,
    }
  })
}

export function StacksScene({ record, addAction, addSecret }) {
  const rows = useMemo(() => [
    shelfRow(11, 17),
    shelfRow(23, 15, { 2: 'stacks-fiction', 7: 'stacks-essay', 12: 'stacks-poetry' }),
    shelfRow(37, 16, { 10: 'borrower' }),
  ], [])
  const firstMarked = Object.keys(BOOKS).find((id) => record.actions.includes(id))
  const [picked, setPicked] = useState(firstMarked || null)
  const [justMarked, setJustMarked] = useState(null)
  const found = record.secrets.includes('borrower')
  const book = picked ? BOOKS[picked] : null
  const marked = picked && record.actions.includes(picked)

  const pull = (id) => { setPicked(id); play('paper') }
  const mark = () => {
    if (!picked || marked) return
    addAction(picked)
    setJustMarked(picked)
    play('pencil')
  }

  return (
    <section className="rm-stacks">
      <div className="rm-shelf" aria-label="Bookshelf">
        {rows.map((row, r) => (
          <div className="rm-shelf-row" key={r}>
            {row.map((b) => {
              if (b.featured === 'borrower') {
                return (
                  <button key={b.key} className={`rm-spine rm-spine-old ${found ? 'is-out' : ''}`} aria-label="A slightly protruding old book" onClick={() => { addSecret('borrower'); play('paper') }}>
                    <span className="rm-spine-word">1978</span>
                  </button>
                )
              }
              if (b.featured) {
                const meta = BOOKS[b.featured]
                const isMarked = record.actions.includes(b.featured)
                return (
                  <button
                    key={b.key}
                    className={`rm-spine rm-spine-feature ${picked === b.featured ? 'is-out' : ''} ${isMarked ? 'is-marked' : ''}`}
                    style={{ '--cloth': meta.cloth }}
                    onClick={() => pull(b.featured)}
                    aria-pressed={picked === b.featured}
                    aria-label={`${meta.genre}: ${meta.title}${isMarked ? ' (marked)' : ''}`}
                  >
                    <span className="rm-spine-title">{meta.title}</span>
                    <span className="rm-spine-label">{meta.cls}</span>
                    {isMarked && <span className="rm-spine-tick" aria-hidden="true">✓</span>}
                  </button>
                )
              }
              return (
                <span
                  key={b.key}
                  className={`rm-spine ${b.band ? 'has-band' : ''}`}
                  style={{ '--cloth': b.color, width: b.w, height: `${b.h}%`, transform: b.lean ? `rotate(${b.lean}deg)` : undefined }}
                  aria-hidden="true"
                >
                  {b.word && <span className="rm-spine-word">{b.word}</span>}
                </span>
              )
            })}
          </div>
        ))}
      </div>

      <div className="rm-desk">
        {!book && (
          <div className="rm-desk-empty">
            <span className="rm-kicker">READING TABLE</span>
            <p>Pull one of the three labelled books from the shelf. It opens here.</p>
          </div>
        )}
        {book && (
          <div className={`rm-openbook ${marked ? 'is-marked' : ''} ${justMarked === picked ? 'is-fresh' : ''}`} key={picked} style={{ '--cloth': book.cloth }}>
            <div className="rm-page rm-page-left">
              <span className="rm-page-head">{book.genre} / {book.cls}</span>
              <h3>{book.title}</h3>
              <p>{book.left}</p>
              <span className="rm-folio">212</span>
            </div>
            <div className="rm-page rm-page-right">
              {book.right.map((line) => <p key={line}>{line}</p>)}
              <svg className="rm-margin" viewBox="0 0 60 180" aria-hidden="true">
                <path className="rm-pencil" d="M40 12 C 30 14, 30 16, 30 26 L 30 150 C 30 160, 30 162, 40 166" />
              </svg>
              <span className="rm-pencil-note" aria-hidden="true">{book.note}</span>
              <span className="rm-folio">213</span>
            </div>
            <button className="rm-mark-btn" onClick={mark} disabled={marked}>
              {marked ? 'Margin mark kept in your record' : '✎ Leave a margin mark'}
            </button>
          </div>
        )}
        {found && (
          <aside className="rm-borrower" aria-label="Hidden trace found: borrower card, 1978">
            <span className="rm-borrower-head">BORROWER’S CARD · 1978</span>
            {[['MAR 14 ’78', 'E. Marchand'], ['APR 02 ’78', 'J. Okoye'], ['JUN 19 ’81', 'R. Lévesque']].map(([d, n]) => (
              <div key={d}><b>{d}</b><i>{n}</i></div>
            ))}
            <p>Three names. Twelve dates. One book returning through different hands.</p>
          </aside>
        )}
      </div>
    </section>
  )
}

/* ───────────────────────── THE WORKSHOP ───────────────────────── */
export function WorkshopScene({ record, addAction, addSecret }) {
  const registered = record.actions.includes('workshop-align')
  const [offset, setOffset] = useState(registered ? 0 : -19)
  const [pressing, setPressing] = useState(false)
  const aligned = Math.abs(offset) <= 3
  const secret = record.secrets.includes('imperfection')

  const pull = () => {
    if (!aligned || registered || pressing) return
    setPressing(true)
    play('press')
    window.setTimeout(() => { addAction('workshop-align'); setPressing(false); setOffset(0) }, 650)
  }

  const Impression = ({ color, shift }) => (
    <g style={{ transform: `translateX(${shift}px)`, mixBlendMode: 'multiply' }} fill={color} stroke={color}>
      <text x="200" y="196" textAnchor="middle" fontFamily="'Newsreader Variable', Georgia, serif" fontWeight="600" fontSize="170" stroke="none">N<tspan fontStyle="italic" dx="-8">Q</tspan></text>
      {[[40, 40], [360, 40], [40, 250], [360, 250]].map(([x, y]) => (
        <g key={`${x}${y}`} fill="none" strokeWidth="1.2"><circle cx={x} cy={y} r="9" /><path d={`M${x - 15} ${y}H${x + 15}M${x} ${y - 15}V${y + 15}`} /></g>
      ))}
      <text x="200" y="262" textAnchor="middle" fontFamily="'Public Sans', Arial, sans-serif" fontWeight="800" fontSize="11" letterSpacing="4" stroke="none">NORTH QUARTER · PROOF 04</text>
    </g>
  )

  return (
    <section className="rm-workshop">
      <div className={`rm-press ${pressing ? 'is-pressing' : ''} ${registered ? 'is-registered' : ''} ${aligned ? 'is-aligned' : ''}`}>
        <div className="rm-platen" aria-hidden="true" />
        <div className="rm-sheet">
          <svg viewBox="0 0 400 290" aria-label={`Proof sheet, registration offset ${offset} millimetres`}>
            <rect width="400" height="290" fill="#f4ecdc" />
            <Impression color="#e2432f" shift={0} />
            <Impression color="#2d5bd0" shift={registered ? 0 : offset} />
            {registered && (
              <g className="rm-okstamp" transform="translate(300 60) rotate(-12)">
                <rect x="-58" y="-18" width="116" height="36" fill="none" stroke="#2b2823" strokeWidth="2.4" />
                <text textAnchor="middle" y="6" fontFamily="'Public Sans', Arial, sans-serif" fontWeight="900" fontSize="15" letterSpacing="2" fill="#2b2823">OK TO PRINT</text>
              </g>
            )}
          </svg>
          <button className="rm-plus2" aria-label="A tiny misregistration mark" onClick={() => { addSecret('imperfection'); play('pin') }}>+2</button>
        </div>
        <label className="rm-ruler">
          <span>REGISTRATION · {offset > 0 ? '+' : ''}{offset} mm {aligned && !registered ? '· aligned' : ''}</span>
          <input type="range" min="-40" max="40" value={registered ? 0 : offset} disabled={registered} onChange={(e) => setOffset(Number(e.target.value))} />
        </label>
        <button className="rm-lever" onClick={pull} disabled={!aligned || registered || pressing}>
          {registered ? 'Impression registered' : pressing ? 'Pulling…' : aligned ? 'Pull the proof' : 'Align the two impressions first'}
        </button>
        {secret && (
          <aside className="rm-note-card">
            <b>REGISTERED IMPERFECTION</b>
            <p>The error was kept because it proved a hand had aligned the press.</p>
          </aside>
        )}
      </div>

      <div className="rm-materials">
        <button className={`rm-stock ${record.actions.includes('workshop-stock') ? 'is-marked' : ''}`} onClick={() => { addAction('workshop-stock'); play('paper') }}>
          <span className="rm-swatch rm-swatch-a" /><span className="rm-swatch rm-swatch-b" /><span className="rm-swatch rm-swatch-c" />
          <strong>Uncoated stock · 120 g</strong>
          <small>{record.actions.includes('workshop-stock') ? 'Chosen for your proof' : 'Choose the paper'}</small>
        </button>
        <button className={`rm-ink ${record.actions.includes('workshop-ink') ? 'is-marked' : ''}`} onClick={() => { addAction('workshop-ink'); play('mark') }}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="54" fill="#8e8a82" />
            <circle cx="60" cy="60" r="48" fill="#3a2f5a" />
            <path d="M28 64 C 40 40, 70 88, 92 52" stroke="#6b5aa0" strokeWidth="9" fill="none" strokeLinecap="round" />
            <circle cx="60" cy="60" r="54" fill="none" stroke="#d8d2c6" strokeWidth="3" />
          </svg>
          <strong>Overprint ink · NQ-04</strong>
          <small>{record.actions.includes('workshop-ink') ? 'Loaded on the press' : 'Choose the process'}</small>
        </button>
      </div>
    </section>
  )
}

/* ───────────────────────── THE INDEX ───────────────────────── */
const DRAWERS = ['011', '014', '021', '027', '033', '048', '056', '071', '088', '092', '103', '114', '129', '207', '315', '372', '403', '512', '640', '']
const CHAIN = [
  { id: 'index-021', no: '021', title: 'PUBLIC ROOMS', body: 'Rooms kept open for anyone, without appointment.', next: '114' },
  { id: 'index-114', no: '114', title: 'SHARED MEMORY', body: 'What a place remembers because many people used it.', next: '403' },
  { id: 'index-403', no: '403', title: 'BELONGING', body: 'See your own record. Reference complete.', next: null },
]

export function IndexScene({ record, addAction, addSecret }) {
  const [open, setOpen] = useState(null)
  const [empty, setEmpty] = useState(null)
  const found = record.secrets.includes('curiosity')
  const doneIds = CHAIN.filter((c) => record.actions.includes(c.id))
  const next = CHAIN.find((c) => !record.actions.includes(c.id))

  const pull = (no) => {
    play('drawer')
    setOpen(no)
    window.setTimeout(() => setOpen((cur) => (cur === no ? null : cur)), 900)
    if (no === '') { addSecret('curiosity'); return }
    const link = CHAIN.find((c) => c.no === no)
    if (link && (!next || link.id === next.id || record.actions.includes(link.id))) {
      if (!record.actions.includes(link.id)) addAction(link.id)
      setEmpty(null)
      return
    }
    setEmpty(link ? `NQ.${no} is filed further along. Follow the references in order.` : `Nothing filed under NQ.${no}. Follow the references.`)
  }

  return (
    <section className="rm-index">
      <div className="rm-cabinet" aria-label="Card catalogue">
        {DRAWERS.map((no) => {
          const link = CHAIN.find((c) => c.no === no)
          const isNext = next && link && link.id === next.id
          const isDone = link && record.actions.includes(link.id)
          return (
            <button
              key={no || 'blank'}
              className={`rm-drawer ${open === no ? 'is-open' : ''} ${isNext ? 'is-next' : ''} ${isDone ? 'is-done' : ''} ${no === '' ? 'is-blank' : ''}`}
              onClick={() => pull(no)}
              aria-label={no ? `Drawer NQ.${no}` : 'An unlabelled drawer'}
            >
              <span className="rm-drawer-label">{no ? `NQ.${no}` : ''}</span>
              <span className="rm-drawer-pull" aria-hidden="true" />
            </button>
          )
        })}
      </div>
      <div className="rm-tray" aria-live="polite">
        <span className="rm-kicker">REFERENCE TRAY</span>
        {!doneIds.length && <p className="rm-tray-empty">Start with drawer <b>NQ.021</b>. Each card tells you where to look next.</p>}
        <div className="rm-refcards">
          {doneIds.map((c, i) => (
            <article key={c.id} className="rm-refcard" style={{ '--i': i }}>
              <header><b>NQ.{c.no}</b><span>NORTH QUARTER CATALOGUE</span></header>
              <strong>{c.title}</strong>
              <p>{c.body}</p>
              <em>{c.next ? `see also → NQ.${c.next}` : 'reference complete'}</em>
            </article>
          ))}
        </div>
        {empty && <p className="rm-tray-empty is-warn">{empty}</p>}
        {found && (
          <aside className="rm-refcard rm-refcard-zero">
            <header><b>NQ.000</b><span>NOT INDEXED</span></header>
            <strong>FOUND THROUGH CURIOSITY</strong>
            <p>It only appears to people who check what the system says is empty.</p>
          </aside>
        )}
      </div>
    </section>
  )
}

/* ───────────────────────── THE QUARTER ───────────────────────── */
const PLACES = [
  { id: 'quarter-market', name: 'MARKET HALL', address: '12 Mercer St', x: 250, y: 168, n: 1 },
  { id: 'quarter-school', name: 'NORTH SCHOOL', address: '44 Vale Ave', x: 742, y: 150, n: 2 },
  { id: 'quarter-river', name: 'RIVER WALK', address: 'East bank', x: 660, y: 470, n: 3 },
]
const LIB = { x: 492, y: 318 }

export function QuarterScene({ record, addAction, addSecret }) {
  const found = record.secrets.includes('before')
  const blocks = useMemo(() => {
    const rand = rng(63)
    const list = []
    for (let i = 0; i < 46; i += 1) {
      const x = 60 + rand() * 860
      const y = 60 + rand() * 500
      if (Math.abs(x - LIB.x) < 150 && Math.abs(y - LIB.y) < 70) continue
      if (y > 380 && y < 470 && x > 80) continue
      const w = 30 + rand() * 50
      const h = 22 + rand() * 36
      list.push({ x, y, w, h, a: (rand() - 0.5) * 12 })
    }
    return list
  }, [])
  const route = (p) => `M${LIB.x} ${LIB.y} Q ${(LIB.x + p.x) / 2 + (p.y - LIB.y) * 0.25} ${(LIB.y + p.y) / 2 - (p.x - LIB.x) * 0.15} ${p.x} ${p.y}`

  return (
    <section className="rm-quarter">
      <svg className="rm-map" viewBox="0 0 1000 620" aria-label="Engraved civic map of North Quarter">
        <defs>
          <pattern id="rm-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
            <path d="M0 0V6" stroke="#6b5d48" strokeWidth=".8" opacity=".55" />
          </pattern>
          <pattern id="rm-water" width="14" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 4 q3.5 -3 7 0 t7 0" fill="none" stroke="#4d6e78" strokeWidth=".7" opacity=".6" />
          </pattern>
          <radialGradient id="rm-paper" cx=".5" cy=".45" r=".75">
            <stop offset="0" stopColor="#f3ead6" /><stop offset="1" stopColor="#e2d4b6" />
          </radialGradient>
          <path id="rm-st-1" d="M40 250 C 300 210, 620 250, 960 200" />
          <path id="rm-st-2" d="M470 30 C 480 200, 500 400, 470 600" />
          <path id="rm-st-3" d="M60 560 C 300 480, 520 380, 940 330" />
        </defs>
        <rect width="1000" height="620" fill="url(#rm-paper)" />
        <rect x="18" y="18" width="964" height="584" fill="none" stroke="#3b3326" strokeWidth="2.4" />
        <rect x="26" y="26" width="948" height="568" fill="none" stroke="#3b3326" strokeWidth=".8" />
        {Array.from({ length: 24 }).map((_, i) => <path key={`t${i}`} d={`M${26 + i * 39.5} 18V26M${26 + i * 39.5} 594V602`} stroke="#3b3326" strokeWidth=".8" />)}
        <path d="M26 440 C 220 390, 380 470, 560 430 S 860 360, 974 400 L974 470 C 850 440, 700 500, 540 500 S 200 470, 26 510 Z" fill="#c9d6d0" />
        <path d="M26 440 C 220 390, 380 470, 560 430 S 860 360, 974 400 L974 470 C 850 440, 700 500, 540 500 S 200 470, 26 510 Z" fill="url(#rm-water)" />
        <text x="140" y="478" fontFamily="'Newsreader Variable', Georgia, serif" fontStyle="italic" fontSize="17" fill="#4d6e78" letterSpacing="6">the river</text>
        {blocks.map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} transform={`rotate(${b.a} ${b.x} ${b.y})`} fill="url(#rm-hatch)" stroke="#6b5d48" strokeWidth=".7" />)}
        {['rm-st-1', 'rm-st-2', 'rm-st-3'].map((id) => <use key={id} href={`#${id}`} stroke="#f3ead6" strokeWidth="16" fill="none" />)}
        {['rm-st-1', 'rm-st-2', 'rm-st-3'].map((id) => <use key={`${id}e`} href={`#${id}`} stroke="#6b5d48" strokeWidth="17" fill="none" strokeOpacity=".35" strokeDasharray="0" style={{ mixBlendMode: 'multiply' }} />)}
        <g fontFamily="'Public Sans', Arial, sans-serif" fontWeight="700" fontSize="9.5" letterSpacing="3" fill="#3b3326">
          <text dy="3"><textPath href="#rm-st-1" startOffset="12%">MERCER STREET</textPath></text>
          <text dy="3"><textPath href="#rm-st-2" startOffset="8%">VALE AVENUE</textPath></text>
          <text dy="3"><textPath href="#rm-st-3" startOffset="58%">BANK ROW</textPath></text>
        </g>

        {PLACES.map((p) => {
          const on = record.actions.includes(p.id)
          return <path key={`r-${p.id}`} className={`rm-route ${on ? 'is-on' : ''}`} d={route(p)} />
        })}

        <g transform={`translate(${LIB.x} ${LIB.y})`}>
          <rect x="-34" y="-26" width="68" height="52" fill="#2b2823" />
          <text y="9" textAnchor="middle" fontFamily="'Newsreader Variable', Georgia, serif" fontWeight="600" fontSize="26" fill="#f3ead6">NQ</text>
          <text y="44" textAnchor="middle" fontFamily="'Public Sans', Arial, sans-serif" fontWeight="800" fontSize="9" letterSpacing="2.4" fill="#2b2823">THE LIBRARY · YOU ARE HERE</text>
        </g>

        {PLACES.map((p) => {
          const on = record.actions.includes(p.id)
          return (
            <g key={p.id} className={`rm-place ${on ? 'is-on' : ''}`} transform={`translate(${p.x} ${p.y})`} {...press(() => { if (!on) { addAction(p.id); play('pin') } })} aria-label={`${p.name}, ${p.address}${on ? ' (in your record)' : ''}`}>
              <circle r="26" fill="transparent" />
              <circle r="11" fill="#f3ead6" stroke="#3b3326" strokeWidth="1.6" />
              <text y="4" textAnchor="middle" fontFamily="'Public Sans', Arial, sans-serif" fontWeight="800" fontSize="11" fill="#3b3326">{p.n}</text>
              <text y="-22" textAnchor="middle" fontFamily="'Public Sans', Arial, sans-serif" fontWeight="800" fontSize="12" letterSpacing="2" fill="#2b2823">{p.name}</text>
              <text y="30" textAnchor="middle" fontFamily="'Newsreader Variable', Georgia, serif" fontStyle="italic" fontSize="13" fill="#5a4e3c">{p.address}</text>
              <g className="rm-pin" transform="translate(18 4)">
                <path d="M0 -4 L-3 -30 L3 -30 Z" fill="#8a1f1a" />
                <circle cy="-36" r="9" fill="#b3261e" stroke="#5a1210" strokeWidth="1.2" />
                <circle cx="-3" cy="-39" r="2.5" fill="#f5b7b0" />
              </g>
            </g>
          )
        })}

        <g className={`rm-before ${found ? 'is-found' : ''}`} {...press(() => { addSecret('before'); play('paper') })} aria-label="An unlabeled point on the map" transform="translate(356 372)">
          <rect x="-22" y="-16" width="44" height="32" fill="transparent" stroke="#6b5d48" strokeDasharray="2 3" />
          <text y="30" textAnchor="middle" fontFamily="'Newsreader Variable', Georgia, serif" fontStyle="italic" fontSize="10" fill="#6b5d48">{found ? '1963 · reading room' : ''}</text>
        </g>

        <g transform="translate(900 96)" stroke="#3b3326" fill="none">
          <circle r="34" strokeWidth=".8" />
          <circle r="26" strokeWidth=".6" strokeDasharray="2 3" />
          <path d="M0 -44 L7 0 L0 44 L-7 0 Z" fill="#3b3326" />
          <path d="M-44 0 L0 -6 L44 0 L0 6 Z" fill="#f3ead6" />
          <text y="-50" textAnchor="middle" stroke="none" fill="#3b3326" fontFamily="'Public Sans', Arial, sans-serif" fontWeight="800" fontSize="11">N</text>
        </g>
        <g transform="translate(60 568)" fontFamily="'Public Sans', Arial, sans-serif" fontSize="8" fontWeight="700" letterSpacing="1.5" fill="#3b3326">
          {[0, 1, 2, 3].map((i) => <rect key={i} x={i * 40} y="0" width="40" height="6" fill={i % 2 ? '#f3ead6' : '#3b3326'} stroke="#3b3326" strokeWidth=".6" />)}
          <text y="-6">0</text><text x="150" y="-6">400 M</text>
        </g>
        <g transform="translate(640 546)">
          <rect x="0" y="0" width="300" height="42" fill="#f3ead6" stroke="#3b3326" />
          <text x="150" y="18" textAnchor="middle" fontFamily="'Public Sans', Arial, sans-serif" fontWeight="800" fontSize="11" letterSpacing="3.4" fill="#2b2823">NORTH QUARTER · CIVIC PLAN</text>
          <text x="150" y="33" textAnchor="middle" fontFamily="'Newsreader Variable', Georgia, serif" fontStyle="italic" fontSize="12" fill="#5a4e3c">surveyed 1963, annotated by members</text>
        </g>
      </svg>
      {found && (
        <aside className="rm-note-card rm-note-map">
          <b>THE ROOM BEFORE THE LIBRARY</b>
          <p>Before North Quarter opened here, this address was a reading room above a grocer. The building is gone. The habit stayed.</p>
        </aside>
      )}
    </section>
  )
}
