import React, { useId, useMemo, useRef, useState } from 'react'
import { play } from './sound.js'

/* NORTH QUARTER LIBRARY CARD — drawn as one SVG object (856 × 540, CR80 proportions).
   One shared geometry, four materials, and a generative accession rosette that is
   computed from the visitor's own marks: nobody carries the same card. */

export const W = 856
export const H = 540

export const APERTURE = 'M520 155 L545 64 L832 64 L832 373 L748 476 L520 476 Z'
export const MED = { x: 676, y: 262, r: 118 }

const COPY = {
  reader: { title: 'READER', line: ['For the ones who always', 'return to the page.'] },
  maker: { title: 'MAKER', line: ['For the ones who use the', 'library to make things.'] },
  seeker: { title: 'SEEKER', line: ['For the ones who come', 'looking for more.'] },
  local: { title: 'LOCAL', line: ['For the ones who see the', 'library as part of home.'] },
}

const ACTION_ROOMS = {
  stacks: 'THE STACKS', workshop: 'THE WORKSHOP', index: 'THE INDEX', quarter: 'THE QUARTER',
}

export function hash32(input) {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const f1 = (n) => Math.round(n * 10) / 10

/* ───────── Generative accession rosette ───────── */
export function rosette({ seed, actions, secrets = [], R = 88, detail = 1 }) {
  const rand = rng(seed)
  const marks = actions.length ? actions : ['open']
  const layers = Math.min(marks.length, 6)
  const copies = Math.max(8, Math.round(20 * detail))
  const steps = Math.max(90, Math.round(260 * detail))
  const bands = []
  for (let l = 0; l < layers; l += 1) {
    const h = hash32(`${marks[l]}|${seed}|${l}`)
    const k = 3 + (h % 10)
    const m = 2 + ((h >>> 5) % 7)
    const base = R * (0.3 + (0.62 * (l + 1)) / layers)
    const amp = R * (0.06 + rand() * 0.09)
    const twist = rand() * Math.PI * 2
    const paths = []
    for (let c = 0; c < copies; c += 1) {
      const phase = (c * Math.PI * 2) / copies
      let d = ''
      for (let s = 0; s <= steps; s += 1) {
        const t = (s / steps) * Math.PI * 2
        const r = base + amp * Math.sin(k * t + phase + twist) + amp * 0.32 * Math.sin(m * t - phase)
        const x = f1(Math.cos(t) * r)
        const y = f1(Math.sin(t) * r)
        d += `${s ? 'L' : 'M'}${x} ${y}`
      }
      paths.push(d)
    }
    bands.push({ key: `${marks[l]}-${l}`, d: paths.join(''), family: familyOf(marks[l]) })
  }
  const stars = secrets.map((id, i) => {
    const a = ((hash32(id + seed) % 360) * Math.PI) / 180 + i
    return { key: id, x: f1(Math.cos(a) * (R + 9)), y: f1(Math.sin(a) * (R + 9)) }
  })
  return { bands, stars }
}

function familyOf(id) {
  if (id.startsWith('stacks')) return 'reader'
  if (id.startsWith('workshop')) return 'maker'
  if (id.startsWith('index')) return 'seeker'
  if (id.startsWith('quarter')) return 'local'
  return 'reader'
}

function signatureD(strokes) {
  return (strokes || []).map((stroke) => {
    if (!stroke.length) return ''
    if (stroke.length === 1) return `M${stroke[0][0]} ${stroke[0][1]}l.1 .1`
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

/* ───────── Family materials ───────── */
const THEME = {
  reader: {
    ink: '#f0d49a', soft: 'rgba(240,212,154,.72)', faint: 'rgba(240,212,154,.34)',
    medal: '#f4ead6', medalInk: '#6b2522', ringInk: '#6b2522', sig: '#f3e6c6',
    titleFont: 'serif', stampInk: '#f0d49a',
  },
  maker: {
    ink: '#1d1b18', soft: 'rgba(29,27,24,.72)', faint: 'rgba(29,27,24,.3)',
    medal: '#f3ead8', medalInk: '#1d3f8f', ringInk: '#1d1b18', sig: '#1d2742',
    titleFont: 'sans', stampInk: '#c8372a',
  },
  seeker: {
    ink: '#eef3fa', soft: 'rgba(238,243,250,.78)', faint: 'rgba(238,243,250,.3)',
    medal: 'none', medalInk: '#eef3fa', ringInk: '#eef3fa', sig: '#f4f7fc',
    titleFont: 'mono', stampInk: '#eef3fa',
  },
  local: {
    ink: '#f3ecdc', soft: 'rgba(243,236,220,.78)', faint: 'rgba(243,236,220,.3)',
    medal: '#efe7d4', medalInk: '#2a5140', ringInk: '#2a5140', sig: '#f3ecdc',
    titleFont: 'sans', stampInk: '#e3b341',
  },
  open: {
    ink: '#2b2823', soft: 'rgba(43,40,35,.7)', faint: 'rgba(43,40,35,.28)',
    medal: 'none', medalInk: '#2b2823', ringInk: '#2b2823', sig: '#1d2742',
    titleFont: 'serif', stampInk: '#2b2823',
  },
}

const FONT = {
  serif: "'Newsreader Variable', Newsreader, Georgia, serif",
  sans: "'Public Sans', Arial, sans-serif",
  mono: "'Courier Prime', 'Courier New', monospace",
}

function ReaderMaterial({ uid, seed }) {
  const rand = rng(seed ^ 0x51)
  const stripes = []
  const colors = ['#efe3c8', '#2d3a5c', '#b8863b', '#7a2e2a', '#f4ead6', '#5d6b52', '#efe3c8', '#2d3a5c']
  for (let i = 0; i < 34; i += 1) {
    const y0 = 40 + i * 14 + rand() * 6
    const A = 10 + rand() * 18
    const l1 = 40 + rand() * 50
    const p1 = rand() * 6.28
    let d = ''
    for (let x = 500; x <= 850; x += 8) {
      const y = y0 + A * Math.sin(x / l1 + p1) + 7 * Math.sin(x / 13 + i)
      d += `${x === 500 ? 'M' : 'L'}${x} ${f1(y)}`
    }
    stripes.push(<path key={i} d={d} stroke={colors[i % colors.length]} strokeWidth={6 + rand() * 12} fill="none" opacity=".92" />)
  }
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-base`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#84322d" /><stop offset=".55" stopColor="#6c2724" /><stop offset="1" stopColor="#521b19" />
        </linearGradient>
        <pattern id={`${uid}-weave`} width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M0 .5H5M.5 0V5" stroke="rgba(0,0,0,.16)" strokeWidth="1" />
          <path d="M0 3H5" stroke="rgba(255,220,180,.05)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#${uid}-base)`} />
      <rect width={W} height={H} fill={`url(#${uid}-weave)`} />
      <rect x="22" y="22" width={W - 44} height={H - 44} rx="14" fill="none" stroke="rgba(0,0,0,.28)" strokeWidth="3" />
      <rect x="23.5" y="23.5" width={W - 47} height={H - 47} rx="13" fill="none" stroke="rgba(255,214,160,.16)" strokeWidth="1" />
      <rect x="30" y="30" width={W - 60} height={H - 60} rx="10" fill="none" stroke="url(#gold)" strokeWidth="1.2" opacity=".6" />
      <g clipPath={`url(#${uid}-ap)`}>
        <rect x="500" y="40" width="350" height="460" fill="#efe3c8" />
        {stripes}
        <rect x="500" y="40" width="350" height="460" fill="rgba(90,40,20,.08)" />
      </g>
      {/* ex libris bookplate */}
      <rect x="36" y="352" width="452" height="156" fill="#f2e6cb" stroke="#b98a3e" strokeWidth="1.2" />
      <rect x="43" y="359" width="438" height="142" fill="none" stroke="#b98a3e" strokeWidth=".7" />
      <text x="262" y="374" textAnchor="middle" fontFamily={FONT.serif} fontStyle="italic" fontSize="12" fill="#7a2e2a" letterSpacing="3">Ex Libris · North Quarter</text>
    </>
  )
}

function MakerMaterial({ uid, seed }) {
  const rand = rng(seed ^ 0x77)
  const fibres = []
  for (let i = 0; i < 220; i += 1) {
    const x = rand() * W
    const y = rand() * H
    const a = rand() * Math.PI
    const l = 3 + rand() * 9
    fibres.push(<path key={i} d={`M${f1(x)} ${f1(y)}l${f1(Math.cos(a) * l)} ${f1(Math.sin(a) * l)}`} stroke={rand() > 0.5 ? 'rgba(80,50,20,.28)' : 'rgba(255,245,225,.3)'} strokeWidth="1" />)
  }
  const crop = (x, y, sx, sy) => <path key={`${x}${y}`} d={`M${x} ${y + sy * 14}V${y}H${x + sx * 14}M${x - sx * 10} ${y}H${x - sx * 2}M${x} ${y - sy * 10}V${y - sy * 2}`} stroke="#1d1b18" strokeWidth="1" fill="none" />
  const bar = ['#00a3d7', '#e5007e', '#ffd400', '#1d1b18', '#7fd1eb', '#f27fbe', '#ffe97f', '#8e8d8b']
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-base`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d2ad7c" /><stop offset=".6" stopColor="#c39a66" /><stop offset="1" stopColor="#b88e5b" />
        </linearGradient>
        <pattern id={`${uid}-dots`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
          <circle cx="4.5" cy="4.5" r="2.3" fill="#1d3f8f" />
        </pattern>
        <linearGradient id={`${uid}-fade`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".9" /><stop offset="1" stopColor="#fff" stopOpacity=".15" />
        </linearGradient>
        <mask id={`${uid}-fademask`}><rect x="500" y="40" width="350" height="460" fill={`url(#${uid}-fade)`} /></mask>
      </defs>
      <rect width={W} height={H} fill={`url(#${uid}-base)`} />
      {fibres}
      {crop(34, 34, 1, 1)}{crop(W - 34, 34, -1, 1)}{crop(34, H - 34, 1, -1)}{crop(W - 34, H - 34, -1, -1)}
      <g clipPath={`url(#${uid}-ap)`}>
        <rect x="500" y="40" width="350" height="460" fill="#efe4cf" />
        <rect x="500" y="40" width="350" height="460" fill={`url(#${uid}-dots)`} mask={`url(#${uid}-fademask)`} opacity=".55" />
        <rect x="505" y="44" width="350" height="460" fill={`url(#${uid}-dots)`} mask={`url(#${uid}-fademask)`} opacity=".22" style={{ mixBlendMode: 'multiply' }} transform="translate(0 0)" />
      </g>
      {bar.map((c, i) => <rect key={c} x={560 + i * 30} y="492" width="28" height="16" fill={c} opacity=".92" />)}
      <text x="552" y="504" textAnchor="end" fontFamily={FONT.sans} fontSize="8" fontWeight="700" letterSpacing="1.5" fill="#1d1b18">PROOF 04</text>
      {/* printed form */}
      <rect x="40" y="356" width="446" height="72" fill="rgba(255,248,235,.45)" stroke="#1d1b18" strokeWidth="1.2" />
      <text x="48" y="370" fontFamily={FONT.sans} fontSize="8" fontWeight="700" letterSpacing="2" fill="#1d1b18">SIGNATURE OF BORROWER</text>
    </>
  )
}

function SeekerMaterial({ uid }) {
  const rules = []
  for (let y = 96; y < H - 20; y += 30) rules.push(<path key={y} d={`M24 ${y}H${W - 24}`} stroke="rgba(230,240,255,.13)" strokeWidth="1" />)
  const grid = []
  for (let x = 500; x < 850; x += 18) grid.push(<path key={`x${x}`} d={`M${x} 40V500`} stroke="rgba(230,240,255,.1)" />)
  for (let y = 40; y < 500; y += 18) grid.push(<path key={`y${y}`} d={`M500 ${y}H850`} stroke="rgba(230,240,255,.1)" />)
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-base`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#24508e" /><stop offset=".55" stopColor="#1c4077" /><stop offset="1" stopColor="#152f58" />
        </linearGradient>
        <radialGradient id={`${uid}-bloom`} cx=".3" cy=".2" r=".9">
          <stop offset="0" stopColor="#6d9fd8" stopOpacity=".35" /><stop offset="1" stopColor="#6d9fd8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${uid}-base)`} />
      <rect width={W} height={H} fill={`url(#${uid}-bloom)`} />
      <path d={`M24 118H${W - 24}`} stroke="#e8a09a" strokeWidth="2" opacity=".75" />
      {rules}
      <path d={`M36 24V${H - 24}`} stroke="rgba(230,240,255,.2)" />
      <g clipPath={`url(#${uid}-ap)`}>
        <rect x="500" y="40" width="350" height="460" fill="#122a50" />
        {grid}
      </g>
      <rect x="560" y="40" width="96" height="24" fill="#eef3fa" />
      <text x="608" y="57" textAnchor="middle" fontFamily={FONT.mono} fontWeight="700" fontSize="14" fill="#1c4077">NQ.114</text>
    </>
  )
}

function LocalMaterial({ uid, seed }) {
  const rand = rng(seed ^ 0x9e)
  const streets = []
  for (let i = 0; i < 16; i += 1) {
    const vertical = i % 2
    const p = rand() * (vertical ? W : H)
    const tilt = (rand() - 0.5) * 140
    const d = vertical ? `M${f1(p)} 0L${f1(p + tilt)} ${H}` : `M0 ${f1(p)}L${W} ${f1(p + tilt)}`
    streets.push(<path key={i} d={d} stroke="rgba(243,236,220,.07)" strokeWidth={2 + rand() * 7} />)
  }
  const mapStreets = []
  for (let i = 0; i < 14; i += 1) {
    const vertical = i % 2
    const p = vertical ? 500 + rand() * 350 : 40 + rand() * 460
    const tilt = (rand() - 0.5) * 90
    const d = vertical ? `M${f1(p)} 40L${f1(p + tilt)} 500` : `M500 ${f1(p)}L850 ${f1(p + tilt)}`
    mapStreets.push(<path key={i} d={d} stroke="#2a5140" strokeOpacity=".28" strokeWidth={1 + rand() * 4} />)
  }
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-base`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#35644d" /><stop offset=".6" stopColor="#2b5540" /><stop offset="1" stopColor="#214535" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${uid}-base)`} />
      {streets}
      <path d="M-20 430 C 140 380, 250 470, 420 420 S 700 300, 880 340" stroke="#8fb9ae" strokeOpacity=".22" strokeWidth="26" fill="none" />
      <rect x="0" y="0" width={W} height="14" fill="#e3b341" />
      <g clipPath={`url(#${uid}-ap)`}>
        <rect x="500" y="40" width="350" height="460" fill="#efe7d4" />
        {mapStreets}
        <path d="M500 430 C 600 390, 680 470, 850 380" stroke="#7fa9a0" strokeOpacity=".5" strokeWidth="18" fill="none" />
      </g>
    </>
  )
}

function OpenMaterial({ uid }) {
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-base`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ece5d6" /><stop offset="1" stopColor="#d9d0bf" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${uid}-base)`} />
      <rect x="22" y="22" width={W - 44} height={H - 44} rx="14" fill="none" stroke="rgba(43,40,35,.3)" strokeDasharray="3 5" />
      <g clipPath={`url(#${uid}-ap)`}>
        <rect x="500" y="40" width="350" height="460" fill="rgba(43,40,35,.06)" />
      </g>
    </>
  )
}

/* ───────── Pieces shared by every card ───────── */
function Rosette({ family, seed, actions, secrets, detail, theme, number, marksLabel }) {
  const { bands, stars } = useMemo(() => rosette({ seed, actions, secrets, detail }), [seed, actions.join(','), secrets.join(','), detail])
  const ringId = `ring-${seed}-${family}`
  const isMaker = family === 'maker'
  return (
    <g transform={`translate(${MED.x} ${MED.y})`}>
      {theme.medal !== 'none' && <circle r={MED.r} fill={theme.medal} />}
      <circle r={MED.r} fill="none" stroke={theme.medalInk} strokeWidth="2.4" opacity=".85" />
      <circle r={MED.r - 7} fill="none" stroke={theme.medalInk} strokeWidth=".8" opacity=".6" />
      <circle r={MED.r - 24} fill="none" stroke={theme.medalInk} strokeWidth=".6" opacity=".4" strokeDasharray="1 3" />
      <defs><path id={ringId} d={`M0 ${-(MED.r - 16)} a${MED.r - 16} ${MED.r - 16} 0 1 1 -.1 0`} /></defs>
      <text fontFamily={FONT.sans} fontSize="9.5" fontWeight="700" letterSpacing="2.2" fill={theme.ringInk} opacity=".85">
        <textPath href={`#${ringId}`}>{`${number} · ${marksLabel} · NORTH QUARTER PUBLIC LIBRARY ·`}</textPath>
      </text>
      {isMaker && bands.map((b) => <path key={`r-${b.key}`} d={b.d} fill="none" stroke="#c8372a" strokeWidth=".7" opacity=".55" transform="translate(2.5 2)" />)}
      {bands.map((b) => <path key={b.key} d={b.d} fill="none" stroke={theme.medalInk} strokeWidth=".7" opacity=".78" />)}
      {stars.map((s) => (
        <g key={s.key} transform={`translate(${s.x} ${s.y})`}>
          <path d="M0 -7L1.6 -1.6L7 0L1.6 1.6L0 7L-1.6 1.6L-7 0L-1.6 -1.6Z" fill="url(#gold)" stroke={theme.medalInk} strokeWidth=".5" />
        </g>
      ))}
      <circle r="15" fill={theme.medal !== 'none' ? theme.medal : '#122a50'} stroke={theme.medalInk} strokeWidth="1" />
      <text y="4.5" textAnchor="middle" fontFamily={FONT.serif} fontWeight="600" fontSize="13" fill={theme.medalInk}>NQ</text>
    </g>
  )
}

export function Stamp({ date, family, ink }) {
  return (
    <g className="lc-stamp"><g transform="translate(418 104) rotate(-13)" opacity=".86" style={{ mixBlendMode: family === 'maker' ? 'multiply' : 'normal' }}>
      <circle r="66" fill="none" stroke={ink} strokeWidth="3.5" />
      <circle r="44" fill="none" stroke={ink} strokeWidth="1.2" strokeDasharray="1 3" />
      <defs><path id={`stamp-arc-${family}`} d="M0 -54 a54 54 0 1 1 -.1 0" /></defs>
      <text fontFamily={FONT.sans} fontSize="10" fontWeight="800" letterSpacing="2.4" fill={ink}>
        <textPath href={`#stamp-arc-${family}`}>ACCESSIONED · NORTH QUARTER ·</textPath>
      </text>
      <text y="-6" textAnchor="middle" fontFamily={FONT.sans} fontSize="8" fontWeight="800" letterSpacing="2" fill={ink}>MEMBER RECORD</text>
      <text y="12" textAnchor="middle" fontFamily={FONT.mono} fontSize="15" fontWeight="700" fill={ink}>{date}</text>
    </g></g>
  )
}

function Brand({ theme }) {
  return (
    <g>
      <text x="46" y="84" fontFamily={FONT.serif} fontWeight="600" fontSize="34" fill={theme.ink === '#f0d49a' ? 'url(#gold)' : theme.ink}>N<tspan dx="-2" fontStyle="italic">Q</tspan></text>
      <text x="112" y="70" fontFamily={FONT.sans} fontWeight="700" fontSize="12.5" letterSpacing="2.4" fill={theme.ink}>NORTH QUARTER</text>
      <text x="112" y="86" fontFamily={FONT.sans} fontWeight="500" fontSize="11" letterSpacing="2.4" fill={theme.soft}>PUBLIC LIBRARY</text>
    </g>
  )
}

function Title({ family, theme, text }) {
  if (family === 'maker') {
    return (
      <g fontFamily={FONT.sans} fontWeight="900" fontSize="96" letterSpacing="-2">
        <text x="50" y="241" fill="#e2432f" opacity=".9" style={{ mixBlendMode: 'multiply' }}>{text}</text>
        <text x="43" y="236" fill="#2d5bd0" opacity=".82" style={{ mixBlendMode: 'multiply' }}>{text}</text>
      </g>
    )
  }
  if (family === 'seeker') return <text x="44" y="236" fontFamily={FONT.mono} fontWeight="700" fontSize="84" letterSpacing="-3" fill={theme.ink}>{text}</text>
  if (family === 'local') return <text x="42" y="238" fontFamily={FONT.sans} fontWeight="900" fontSize="100" letterSpacing="-4" fill={theme.ink}>{text}</text>
  if (family === 'reader') return <text x="42" y="238" fontFamily={FONT.serif} fontWeight="500" fontSize="100" letterSpacing="-3" fill="url(#gold)">{text}</text>
  return <text x="44" y="232" fontFamily={FONT.serif} fontWeight="500" fontSize="54" letterSpacing="-1.5" fill={theme.ink}>{text}</text>
}

function LocalLine({ actions }) {
  const stops = [['quarter-market', 'MARKET'], ['quarter-school', 'SCHOOL'], ['quarter-river', 'RIVER']]
  return (
    <g transform="translate(46 300)">
      <path d="M0 0H300" stroke="#e3b341" strokeWidth="6" strokeLinecap="round" />
      {stops.map(([id, label], i) => {
        const on = actions.includes(id)
        return (
          <g key={id} transform={`translate(${i * 150} 0)`}>
            <circle r="9" fill={on ? '#f3ecdc' : '#2b5540'} stroke="#e3b341" strokeWidth="4" />
            <text y="30" textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'} fontFamily={FONT.sans} fontWeight="800" fontSize="10.5" letterSpacing="1.8" fill={on ? '#f3ecdc' : 'rgba(243,236,220,.45)'}>{label}</text>
          </g>
        )
      })}
    </g>
  )
}

function Footer({ family, theme, owner }) {
  const onPlate = family === 'reader'
  const ink = onPlate ? '#3b1d1a' : theme.ink
  const soft = onPlate ? 'rgba(59,29,26,.6)' : theme.soft
  const sigInk = onPlate ? '#1d2742' : theme.sig
  const cols = [['NO.', owner.number, 52], ['BORROWER', owner.name || 'Unsigned', 210], ['ISSUED', owner.issued, 372]]
  const font = family === 'seeker' ? FONT.mono : FONT.sans
  return (
    <g>
      {owner.signature?.length
        ? <path d={signatureD(owner.signature)} transform="translate(56 356) scale(.92 .6)" fill="none" stroke={sigInk} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        : owner.name
          ? <text x="58" y="424" fontFamily={FONT.serif} fontStyle="italic" fontSize="36" fill={sigInk}>{owner.name}</text>
          : <text x="58" y="422" fontFamily={FONT.serif} fontStyle="italic" fontSize="16" fill={soft}>Borrower’s signature</text>}
      <path d="M52 436H474" stroke={soft} strokeWidth="1" />
      {cols.map(([label, value, x]) => (
        <g key={label}>
          <text x={x} y="458" fontFamily={font} fontWeight="700" fontSize="8.5" letterSpacing="2" fill={soft}>{label}</text>
          <text x={x} y="480" fontFamily={font} fontWeight="700" fontSize="14.5" letterSpacing=".6" fill={ink}>{String(value).slice(0, 18)}</text>
        </g>
      ))}
    </g>
  )
}

function Defs({ uid, family }) {
  return (
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f7e2ac" /><stop offset=".35" stopColor="#c9974a" /><stop offset=".6" stopColor="#f5dca0" /><stop offset="1" stopColor="#a8742f" />
      </linearGradient>
      <clipPath id={`${uid}-ap`}><path d={APERTURE} /></clipPath>
      <clipPath id={`${uid}-card`}><rect width={W} height={H} rx="30" /></clipPath>
    </defs>
  )
}


/* ───────── Archive layer ─────────
   Edge-notched card (McBee Keysort, 1930s–70s): every registered mark opens a notch;
   the accession number is notched in binary along the bottom edge.
   Hidden traces arrive as tipped-in ephemera. Marks are tallied in graphite. */
export const CODE_ORDER = [
  'stacks-fiction', 'stacks-essay', 'stacks-poetry',
  'workshop-align', 'workshop-stock', 'workshop-ink',
  'index-021', 'index-114', 'index-403',
  'quarter-market', 'quarter-school', 'quarter-river',
  's:borrower', 's:imperfection', 's:curiosity', 's:before',
]
export const HOLE_R = 5.5
export const TOP_Y = 17
export const BOT_Y = H - 17
export const holeX = (i) => 92 + i * 44.5

export function notchCode(number) {
  const n = hash32(number || 'open') & 0x3fff
  return Array.from({ length: 14 }, (_, i) => Boolean((n >> i) & 1))
}

function NotchMask({ uid, actions, secrets, number, open, hollow }) {
  const have = new Set([...actions, ...secrets.map((id) => `s:${id}`)])
  const bits = open ? [] : notchCode(number)
  return (
    <mask id={`${uid}-notch`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
      <rect width={W} height={H} fill="#fff" />
      {hollow && <path d={APERTURE} fill="#000" />}
      {CODE_ORDER.map((id, i) => (
        <g key={id}>
          <circle cx={holeX(i)} cy={TOP_Y} r={HOLE_R} fill="#000" />
          {have.has(id) && <rect x={holeX(i) - HOLE_R} y="-2" width={HOLE_R * 2} height={TOP_Y + 2} fill="#000" />}
        </g>
      ))}
      {Array.from({ length: 14 }).map((_, i) => (
        <g key={`b${i}`}>
          <circle cx={holeX(i + 1)} cy={BOT_Y} r={HOLE_R} fill="#000" />
          {bits[i] && <rect x={holeX(i + 1) - HOLE_R} y={BOT_Y} width={HOLE_R * 2} height="20" fill="#000" />}
        </g>
      ))}
    </mask>
  )
}

function NotchLabels({ ink }) {
  return (
    <g fontFamily={FONT.sans} fontSize="6.5" fontWeight="700" fill={ink} textAnchor="middle" opacity=".7">
      {CODE_ORDER.map((id, i) => <text key={id} x={holeX(i)} y={TOP_Y + 16}>{i + 1}</text>)}
    </g>
  )
}

function Tally({ count, ink, seed }) {
  const rand = rng(seed ^ 0x3a)
  const marks = []
  for (let i = 0; i < count; i += 1) {
    const group = Math.floor(i / 5)
    const inGroup = i % 5
    const gx = 382 + group * 42
    if (inGroup === 4) {
      marks.push(<path key={i} d={`M${gx - 4} 322 L${gx + 30} 300`} />)
    } else {
      const x = gx + inGroup * 7.5
      marks.push(<path key={i} d={`M${f1(x + (rand() - 0.5) * 2)} ${f1(296 + rand() * 2)} L${f1(x + (rand() - 0.5) * 3)} ${f1(324 + rand() * 2)}`} />)
    }
  }
  return <g stroke={ink} strokeWidth="1.6" strokeLinecap="round" opacity=".7">{marks}</g>
}

const PAPER = '#efe2c4'
const TAPE = 'rgba(255,250,232,.55)'

function BorrowerSlip() {
  const rows = [['MAR 14 ’78', 'E. Marchand'], ['APR 02 ’78', 'J. Okoye'], ['JUN 19 ’81', 'R. Lévesque']]
  return (
    <g transform="translate(688 382) rotate(6)">
      <rect width="146" height="92" fill={PAPER} stroke="rgba(60,40,20,.28)" />
      <rect width="146" height="14" fill="#c8a86a" opacity=".55" />
      <text x="6" y="10.5" fontFamily={FONT.sans} fontSize="7" fontWeight="800" letterSpacing="1.4" fill="#3b2a18">BORROWER’S CARD · 1978</text>
      {rows.map(([d, n], i) => (
        <g key={d}>
          <path d={`M6 ${34 + i * 22}H140`} stroke="rgba(60,40,20,.25)" />
          <text x="8" y={30 + i * 22} fontFamily={FONT.mono} fontSize="9" fontWeight="700" fill="#5b3f8a" transform={`rotate(${i - 1} 8 ${30 + i * 22})`}>{d}</text>
          <text x="76" y={30 + i * 22} fontFamily={FONT.serif} fontStyle="italic" fontSize="11" fill="#2b2823">{n}</text>
        </g>
      ))}
      <rect x="44" y="-9" width="58" height="18" fill={TAPE} transform="rotate(-4 73 0)" />
    </g>
  )
}

function CatalogueSlip({ family }) {
  const x = family === 'seeker' ? 690 : 600
  return (
    <g transform={`translate(${x} 34) rotate(-4)`}>
      <rect width="128" height="50" fill="#f7f2e6" stroke="rgba(0,0,0,.22)" />
      <path d="M0 13H128" stroke="#d0685f" strokeWidth="1.2" />
      <text x="6" y="10" fontFamily={FONT.mono} fontSize="8" fontWeight="700" fill="#1c4077">NQ.000</text>
      <text x="6" y="27" fontFamily={FONT.mono} fontSize="8.5" fill="#1d1b18">see also → 021</text>
      <text x="6" y="40" fontFamily={FONT.mono} fontSize="8.5" fill="#1d1b18">see also → 114 → 403</text>
      <path d="M100 -8 v34 a6 6 0 0 0 12 0 v-28 a4 4 0 0 0 -8 0 v24" fill="none" stroke="#8d9296" strokeWidth="2.2" strokeLinecap="round" />
    </g>
  )
}

function Postmark({ ink }) {
  return (
    <g transform="translate(772 116) rotate(-8)" stroke={ink} fill="none" opacity=".62">
      <circle r="34" strokeWidth="2" />
      <circle r="27" strokeWidth=".8" />
      {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M-44 ${-16 + i * 8} q -12 -5 -24 0 t -24 0 t -24 0 t -24 0 t -24 0`} strokeWidth="1.6" />)}
      <g stroke="none" fill={ink} textAnchor="middle" fontFamily={FONT.sans} fontWeight="800">
        <text y="-9" fontSize="7" letterSpacing="1.4">44 VALE</text>
        <text y="6" fontSize="13" letterSpacing=".5">1963</text>
        <text y="18" fontSize="6" letterSpacing="1.2">READING RM.</text>
      </g>
    </g>
  )
}

function Misregistration({ ink }) {
  return (
    <g transform="translate(446 196) rotate(-10)" stroke={ink} fill="none" opacity=".75">
      <circle r="10" strokeWidth="1" />
      <path d="M-16 0H16M0 -16V16" strokeWidth="1" />
      <g transform="translate(2 2)" opacity=".6"><circle r="10" strokeWidth="1" stroke="#e2432f" /><path d="M-16 0H16M0 -16V16" stroke="#e2432f" /></g>
      <text x="-22" y="34" stroke="none" fill={ink} fontFamily={FONT.serif} fontStyle="italic" fontSize="15">+2 mm, kept</text>
    </g>
  )
}

function Ephemera({ family, secrets, apInk, pencil }) {
  return (
    <g>
      {secrets.includes('before') && <Postmark ink={apInk} />}
      {secrets.includes('curiosity') && <CatalogueSlip family={family} />}
      {secrets.includes('imperfection') && <Misregistration ink={pencil} />}
      {secrets.includes('borrower') && <BorrowerSlip />}
    </g>
  )
}

const AP_INK = { reader: '#2b2823', maker: '#2b2823', seeker: '#eef3fa', local: '#2b2823', open: '#2b2823' }

export function CardFront({ family = 'reader', open = false, actions = [], secrets = [], owner, detail = 1, stamp = false, compact = false, hollow = false }) {
  const raw = useId()
  const uid = `c${raw.replace(/[^a-zA-Z0-9]/g, '')}`
  const fam = open ? 'open' : family
  const theme = THEME[fam]
  const seed = hash32(`${owner?.number || 'open'}|${actions.join(',')}`)
  const Material = { reader: ReaderMaterial, maker: MakerMaterial, seeker: SeekerMaterial, local: LocalMaterial, open: OpenMaterial }[fam]
  const title = open ? 'UNREGISTERED' : COPY[family].title
  const lines = open ? ['Leave three marks in the rooms.', 'The card will follow.'] : COPY[family].line
  const marksLabel = `${String(actions.length).padStart(2, '0')} MARKS · ${secrets.length}/4 HIDDEN`
  return (
    <svg className={`lc-svg lc-${fam}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title} library card${owner?.name ? ` for ${owner.name}` : ''}`}>
      <Defs uid={uid} family={fam} />
      <defs><NotchMask uid={uid} actions={actions} secrets={secrets} number={owner?.number} open={open} hollow={hollow} /></defs>
      <g mask={`url(#${uid}-notch)`}>
      <g clipPath={`url(#${uid}-card)`}>
        <Material uid={uid} seed={seed} />
        <path d={APERTURE} fill="none" stroke={theme.faint} strokeWidth="1.5" />
        {open ? (
          <g transform={`translate(${MED.x} ${MED.y})`}>
            <circle r={MED.r} fill="none" stroke={theme.faint} strokeWidth="1.5" strokeDasharray="4 6" />
            <text y="-6" textAnchor="middle" fontFamily={FONT.sans} fontSize="10" fontWeight="700" letterSpacing="2" fill={theme.soft}>YOUR MARK</text>
            <text y="12" textAnchor="middle" fontFamily={FONT.sans} fontSize="10" fontWeight="700" letterSpacing="2" fill={theme.soft}>APPEARS HERE</text>
          </g>
        ) : (
          <Rosette family={family} seed={seed} actions={actions} secrets={secrets} detail={detail} theme={theme} number={owner.number} marksLabel={marksLabel} />
        )}
        <Brand theme={theme} />
        <text x="46" y="150" fontFamily={fam === 'seeker' ? FONT.mono : FONT.sans} fontWeight="700" fontSize="11" letterSpacing="2.6" fill={family === 'maker' && !open ? '#c8372a' : theme.soft}>{open ? 'TEMPORARY · RECORD OPEN' : `MEMBER RECORD · ${owner.number}`}</text>
        <Title family={fam} theme={theme} text={title} />
        {!compact && family === 'local' && !open
          ? <LocalLine actions={actions} />
          : !compact && lines.map((l, i) => (
            <text key={l} x="46" y={282 + i * 25} fontFamily={fam === 'seeker' ? FONT.mono : FONT.serif} fontStyle={fam === 'seeker' ? 'normal' : 'italic'} fontSize={fam === 'seeker' ? 17 : 21} fill={family === 'reader' && !open ? theme.soft : theme.soft}>{l}</text>
          ))}
        {!compact && <Footer family={fam} theme={theme} owner={owner || { number: 'NQ / OPEN', issued: '—' }} />}
        <NotchLabels ink={theme.soft} />
        {!open && <Tally count={actions.length} ink={theme.soft} seed={seed} />}
        {!open && <Ephemera family={family} secrets={secrets} apInk={AP_INK[fam]} pencil={theme.soft} />}
        {stamp && !open && <Stamp date={owner.issued} family={family} ink={theme.stampInk} />}
        <rect x=".75" y=".75" width={W - 1.5} height={H - 1.5} rx="29.5" fill="none" stroke="rgba(0,0,0,.25)" strokeWidth="1.5" />
      </g>
      </g>
    </svg>
  )
}

/* ───────── The back: a date-registered slip and a barcode ───────── */
function Barcode({ value, x, y, w, h }) {
  const bits = []
  let seed = hash32(value)
  const rand = rng(seed)
  let cx = x
  while (cx < x + w - 4) {
    const bar = 1 + Math.floor(rand() * 3.2)
    const gap = 1 + Math.floor(rand() * 2.4)
    bits.push(<rect key={cx} x={cx} y={y} width={bar * 1.6} height={h} fill="#1d1b18" />)
    cx += (bar + gap) * 1.6
  }
  return <g>{bits}</g>
}

export function CardBack({ family = 'reader', open = false, owner, entries = [] }) {
  const accent = { reader: '#7a2e2a', maker: '#c8372a', seeker: '#1c4077', local: '#2b5540', open: '#2b2823' }[open ? 'open' : family]
  const rows = entries.slice(0, 9)
  return (
    <svg className="lc-svg lc-back" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Back of the card: registered marks">
      <defs>
        <clipPath id={`back-${family}`}><rect width={W} height={H} rx="30" /></clipPath>
        <linearGradient id={`back-paper-${family}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f5eddd" /><stop offset="1" stopColor="#e6dbc5" /></linearGradient>
      </defs>
      <g clipPath={`url(#back-${family})`}>
        <rect width={W} height={H} fill={`url(#back-paper-${family})`} />
        <rect width={W} height="18" fill={accent} />
        <Barcode value={owner?.number || 'open'} x={46} y={48} w={300} h={58} />
        <text x="46" y="126" fontFamily={FONT.mono} fontWeight="700" fontSize="15" letterSpacing="3" fill="#1d1b18">{owner?.number || 'NQ / OPEN'}</text>
        <text x={W - 46} y="66" textAnchor="end" fontFamily={FONT.sans} fontWeight="800" fontSize="12" letterSpacing="2.6" fill={accent}>DATE REGISTERED</text>
        <text x={W - 46} y="86" textAnchor="end" fontFamily={FONT.serif} fontStyle="italic" fontSize="16" fill="rgba(29,27,24,.7)">Every line is something you actually did.</text>
        <path d={`M46 150H${W - 46}`} stroke="#1d1b18" strokeWidth="1.4" />
        {['DATE', 'ROOM', 'MARK'].map((h, i) => <text key={h} x={[46, 200, 400][i]} y="170" fontFamily={FONT.sans} fontWeight="800" fontSize="9" letterSpacing="2" fill="rgba(29,27,24,.6)">{h}</text>)}
        {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M46 ${186 + i * 34}H${W - 46}`} stroke={accent} strokeOpacity=".22" />)}
        <path d="M188 150V492M388 150V492" stroke={accent} strokeOpacity=".22" />
        {rows.map((row, i) => {
          const y = 208 + i * 34
          const tilt = ((hash32(row.id) % 7) - 3) * 0.9
          const ink = row.secret ? '#9a7a2e' : row.accent
          return (
            <g key={row.id}>
              <g transform={`translate(56 ${y}) rotate(${tilt})`}>
                <rect x="-6" y="-15" width="118" height="21" fill="none" stroke={ink} strokeWidth="1.6" opacity=".85" />
                <text x="53" y="0" textAnchor="middle" fontFamily={FONT.mono} fontWeight="700" fontSize="13" fill={ink} opacity=".9">{row.date}</text>
              </g>
              <text x="200" y={y} fontFamily={FONT.sans} fontWeight="700" fontSize="10.5" letterSpacing="1.5" fill="#1d1b18">{row.room}</text>
              <text x="400" y={y} fontFamily={FONT.serif} fontStyle={row.secret ? 'italic' : 'normal'} fontSize="17" fill={row.secret ? '#7a5a1e' : '#1d1b18'}>{row.label}{row.secret ? ' — found' : ''}</text>
            </g>
          )
        })}
        {!rows.length && <text x="46" y="230" fontFamily={FONT.serif} fontStyle="italic" fontSize="22" fill="rgba(29,27,24,.55)">Nothing registered yet. The rooms are open.</text>}
        <text x="46" y={H - 26} fontFamily={FONT.sans} fontWeight="600" fontSize="9" letterSpacing="1.6" fill="rgba(29,27,24,.55)">THIS CARD REMEMBERS. IF FOUND, RETURN TO NORTH QUARTER PUBLIC LIBRARY · 44 VALE</text>
      </g>
      <rect x=".75" y=".75" width={W - 1.5} height={H - 1.5} rx="29.5" fill="none" stroke="rgba(0,0,0,.25)" strokeWidth="1.5" />
    </svg>
  )
}

export function backEntries({ actions, secrets, times = {}, labels, accents, fallback }) {
  const rows = actions.map((id) => ({
    id,
    date: fmt(times[id] || fallback),
    room: ACTION_ROOMS[id.split('-')[0]] || 'THE LIBRARY',
    label: labels.actions[id] || id,
    accent: accents[familyOf(id)],
  }))
  secrets.forEach((id) => rows.push({ id: `s-${id}`, date: fmt(times[`s-${id}`] || fallback), room: 'HIDDEN TRACE', label: labels.secrets[id] || id, secret: true }))
  return rows
}

function fmt(ts) {
  const d = ts ? new Date(ts) : new Date()
  const m = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d.getMonth()]
  return `${String(d.getDate()).padStart(2, '0')} ${m} ${String(d.getFullYear()).slice(2)}`
}

/* ───────── The physical object: tilt, light, flip ───────── */
export function CardObject({ front, back, flippable = true, className = '', tilt = true, landing = false }) {
  const ref = useRef(null)
  const [flipped, setFlipped] = useState(false)
  const move = (event) => {
    if (!tilt || !ref.current || event.pointerType === 'touch') return
    const r = ref.current.getBoundingClientRect()
    const x = (event.clientX - r.left) / r.width
    const y = (event.clientY - r.top) / r.height
    ref.current.style.setProperty('--rx', `${(0.5 - y) * 10}deg`)
    ref.current.style.setProperty('--ry', `${(x - 0.5) * 14}deg`)
    ref.current.style.setProperty('--gx', `${x * 100}%`)
    ref.current.style.setProperty('--gy', `${y * 100}%`)
    ref.current.style.setProperty('--glare', '1')
  }
  const leave = () => {
    if (!ref.current) return
    ref.current.style.setProperty('--rx', '0deg')
    ref.current.style.setProperty('--ry', '0deg')
    ref.current.style.setProperty('--glare', '0')
  }
  return (
    <div className={`lc-object ${flipped ? 'is-flipped' : ''} ${landing ? 'is-landing' : ''} ${className}`} ref={ref} onPointerMove={move} onPointerLeave={leave}>
      <div className="lc-inner">
        <div className="lc-face lc-face-front">{front}<span className="lc-glare" aria-hidden="true" /></div>
        {back && <div className="lc-face lc-face-back">{back}<span className="lc-glare" aria-hidden="true" /></div>}
      </div>
      {flippable && back && (
        <button type="button" className="lc-flip" onClick={() => { setFlipped((v) => !v); play('paper') }}>
          {flipped ? '↺ Front of the card' : '↻ Turn the card over'}
        </button>
      )}
    </div>
  )
}

/* Texture helpers for the 3D card */
export function StampSheet({ family, date, ink }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: 'block' }}>
      <Stamp date={date} family={family} ink={ink} />
    </svg>
  )
}

export function stampInk(family) { return THEME[family]?.stampInk || '#2b2823' }

// White where the card is gilt or foil-printed, black elsewhere: drives metalness/roughness.
export function FoilMask({ family }) {
  const reader = family === 'reader'
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: 'block' }}>
      <rect width={W} height={H} fill="#000" />
      {reader && <rect x="30" y="30" width={W - 60} height={H - 60} rx="10" fill="none" stroke="#fff" strokeWidth="1.6" />}
      {reader && <text x="42" y="238" fontFamily={FONT.serif} fontWeight="500" fontSize="100" letterSpacing="-3" fill="#fff">READER</text>}
      {reader && <text x="46" y="84" fontFamily={FONT.serif} fontWeight="600" fontSize="34" fill="#fff">N<tspan dx="-2" fontStyle="italic">Q</tspan></text>}
      <g transform={`translate(${MED.x} ${MED.y})`} fill="none" stroke="#fff">
        <circle r={MED.r} strokeWidth="2.8" />
        <circle r={MED.r - 7} strokeWidth="1.2" />
        <circle r="15" strokeWidth="1.4" />
      </g>
    </svg>
  )
}
