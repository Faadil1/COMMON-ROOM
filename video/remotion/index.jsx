import React from 'react'
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, registerRoot, Composition } from 'remotion'
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource/public-sans/400.css'
import '@fontsource/public-sans/700.css'

const C = {
  paper: '#F7F3EA',
  paper2: '#E8DDC9',
  ink: '#1C1B18',
  reader: '#7B332F',
  maker: '#94452F',
  seeker: '#26374B',
  local: '#3F614D',
}

const Serif = "'Newsreader Variable', Georgia, serif"
const Sans = "'Public Sans', Arial, sans-serif"

function Scene({ children, duration }) {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 10, duration - 10, duration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>
}

function Opening() {
  return (
    <AbsoluteFill style={{ background: C.paper, color: C.ink, padding: 88 }}>
      <div style={{ fontFamily: Sans, fontSize: 16, letterSpacing: '0.22em', fontWeight: 700 }}>
        NORTH QUARTER PUBLIC LIBRARY / DAY 17
      </div>
      <div style={{ marginTop: 130, fontFamily: Serif, fontSize: 150, lineHeight: 0.84, letterSpacing: '-0.05em' }}>
        COMMON<br/><em style={{ fontWeight: 300 }}>ROOM</em>
      </div>
      <div style={{ marginTop: 56, fontFamily: Serif, fontSize: 42, lineHeight: 1.12 }}>
        A library card shouldn't just unlock access.<br/>It should reveal belonging.
      </div>
      <div style={{
        position: 'absolute', right: 110, top: 170, width: 500, height: 700, background: C.ink,
        clipPath: 'polygon(0 22%,9% 0,100% 0,100% 76%,73% 100%,0 100%)',
      }}/>
      <div style={{ position: 'absolute', left: 88, bottom: 86, display: 'flex', gap: 12 }}>
        {[C.reader, C.maker, C.seeker, C.local].map((color) => (
          <div key={color} style={{ width: 76, height: 7, background: color }}/>
        ))}
      </div>
    </AbsoluteFill>
  )
}

function DirectionCard({ number, title, subtitle }) {
  return (
    <AbsoluteFill style={{ background: C.ink, color: C.paper, padding: 90 }}>
      <div style={{ fontFamily: Sans, fontSize: 15, letterSpacing: '0.2em', opacity: .58 }}>{number}</div>
      <div style={{ marginTop: 180, maxWidth: 1400, fontFamily: Serif, fontSize: 104, lineHeight: .92, letterSpacing: '-0.04em' }}>{title}</div>
      <div style={{ marginTop: 42, maxWidth: 900, fontFamily: Serif, fontSize: 34, lineHeight: 1.18, opacity: .72 }}>{subtitle}</div>
    </AbsoluteFill>
  )
}

export function CommonRoomFilm() {
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Sequence from={0} durationInFrames={150}><Scene duration={150}><Opening/></Scene></Sequence>
      <Sequence from={150} durationInFrames={240}><Scene duration={240}><DirectionCard number="01 / EVIDENCE" title="Four rooms. Four ways to leave a trace." subtitle="No personality quiz. Behavior inside the library becomes the evidence."/></Scene></Sequence>
      <Sequence from={390} durationInFrames={300}><Scene duration={300}><DirectionCard number="02 / OBJECT" title="The card is built from what happened." subtitle="Margin, register, reference and street become ACCESSION STRATA."/></Scene></Sequence>
      <Sequence from={690} durationInFrames={240}><Scene duration={240}><DirectionCard number="03 / APERTURE" title="The object becomes an instrument." subtitle="The same cut that carries evidence becomes the Member Lens."/></Scene></Sequence>
      <Sequence from={930} durationInFrames={270}><Scene duration={270}><DirectionCard number="04 / COLLECTION" title="One record becomes a living wall." subtitle="Publishing is explicit, collective and reversible."/></Scene></Sequence>
      <Sequence from={1200} durationInFrames={270}><Scene duration={270}><DirectionCard number="05 / QUARTER" title="Individual traces become civic memory." subtitle="ONE TRACE → MANY FORMS."/></Scene></Sequence>
      <Sequence from={1470} durationInFrames={150}><Scene duration={150}><AbsoluteFill style={{background:C.paper,color:C.ink,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center'}}><div><div style={{fontFamily:Serif,fontSize:82,lineHeight:.94}}>You don't receive a card.<br/><em style={{fontWeight:300}}>You accumulate one.</em></div><div style={{marginTop:38,fontFamily:Sans,fontSize:13,letterSpacing:'0.2em'}}>COMMON ROOM / DAY 17</div></div></AbsoluteFill></Scene></Sequence>
    </AbsoluteFill>
  )
}

const Root = () => <Composition id="CommonRoomFilm" component={CommonRoomFilm} durationInFrames={1620} fps={30} width={1920} height={1080}/>
registerRoot(Root)
