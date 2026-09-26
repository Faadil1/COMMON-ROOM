import React from 'react'
import {
  AbsoluteFill,
  Audio,
  Composition,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  registerRoot,
} from 'remotion'
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
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
const aperture = 'polygon(0 19%, 9% 0, 100% 0, 100% 75%, 72% 100%, 0 100%)'

const ease=(f,a,b,c,d)=>interpolate(f,[a,b],[c,d],clamp)

function Fade({children,duration,style={}}){
  const f=useCurrentFrame()
  const opacity=interpolate(f,[0,10,duration-10,duration],[0,1,1,0],clamp)
  return <AbsoluteFill style={{...style,opacity}}>{children}</AbsoluteFill>
}
function Brand({dark=false,label='COMMON ROOM'}){
  return <div style={{position:'absolute',left:58,right:58,top:42,display:'flex',justifyContent:'space-between',alignItems:'center',color:dark?C.ink:C.paper,zIndex:50}}>
    <div style={{fontFamily:Sans,fontSize:11,fontWeight:700,letterSpacing:'0.18em'}}>NORTH QUARTER PUBLIC LIBRARY</div>
    <div style={{fontFamily:Sans,fontSize:11,fontWeight:700,letterSpacing:'0.18em',opacity:.55}}>DAY 17 / {label}</div>
  </div>
}
function Caption({children,dark=false}){
  return <div style={{fontFamily:Sans,fontSize:12,fontWeight:700,letterSpacing:'0.2em',color:dark?C.ink:C.paper}}>{children}</div>
}
function PaperNoise(){return <AbsoluteFill style={{pointerEvents:'none',opacity:.045,backgroundImage:'repeating-radial-gradient(circle at 20% 20%,#000 0 1px,transparent 1px 3px)',backgroundSize:'8px 8px',mixBlendMode:'multiply'}}/>}

function TraceSpine(){
  const f=useCurrentFrame()
  const progress=ease(f,0,1800,0,1)
  const phaseColors=[
    [0,C.reader],[150,C.reader],[390,C.maker],[690,C.seeker],[930,C.seeker],[1170,C.local],[1440,C.local],[1800,C.ink],
  ]
  let color=C.reader
  for(let i=0;i<phaseColors.length-1;i++){
    if(f>=phaseColors[i][0] && f<phaseColors[i+1][0]) { color=phaseColors[i][1]; break }
  }
  return <svg viewBox="0 0 1920 1080" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:80}}>
    <path d="M70 1008 H260 L320 968 H520 L585 1010 H785 L850 958 H1060 L1130 1004 H1335 L1405 950 H1600 L1665 996 H1850"
      fill="none" stroke="rgba(247,243,234,.12)" strokeWidth="1.5"/>
    <path d="M70 1008 H260 L320 968 H520 L585 1010 H785 L850 958 H1060 L1130 1004 H1335 L1405 950 H1600 L1665 996 H1850"
      fill="none" stroke={color} strokeWidth="2.4" pathLength="100" strokeDasharray="100" strokeDashoffset={100-progress*100}/>
    <circle cx={70+1780*progress} cy={1008} r="4.5" fill={color} opacity=".9"/>
  </svg>
}

function ApertureGate({tone=C.paper}){
  const f=useCurrentFrame()
  const grow=interpolate(f,[0,9,12,24],[0,1,1,0],clamp)
  const scale=.06+grow*5.2
  return <AbsoluteFill style={{pointerEvents:'none',zIndex:120}}>
    <div style={{position:'absolute',left:'50%',top:'50%',width:720,height:480,background:tone,clipPath:aperture,transform:'translate(-50%,-50%) scale('+scale+') rotate('+((1-grow)*-4)+'deg)',opacity:grow}}/>
  </AbsoluteFill>
}

function Opening({duration}){
  const f=useCurrentFrame(); const {fps}=useVideoConfig()
  const title=spring({frame:f-9,fps,config:{damping:18,stiffness:85}})
  const cut=spring({frame:f-28,fps,config:{damping:16,stiffness:70}})
  const strip=ease(f,86,130,1,0)
  return <Fade duration={duration} style={{background:C.paper,color:C.ink}}>
    <Brand dark label="BELONGING ARTIFACT"/>
    <div style={{position:'absolute',left:94,top:180,width:1180,opacity:title,transform:'translateY('+((1-title)*38)+'px)'}}>
      <Caption dark>MOST LIBRARY CARDS PROVE ACCESS.</Caption>
      <div style={{fontFamily:Serif,fontSize:142,lineHeight:.85,letterSpacing:'-0.05em',marginTop:30}}>What if one<br/><em style={{fontWeight:300}}>proved belonging?</em></div>
    </div>
    <div style={{position:'absolute',right:120,top:220,width:520,height:330,background:C.paper2,border:'1px solid rgba(28,27,24,.18)',borderRadius:16,transform:'rotate(-4deg) scale('+(.92+.08*title)+')'}}>
      <div style={{position:'absolute',left:32,top:34,width:190,height:14,background:C.ink,opacity:.75*strip}}/>
      <div style={{position:'absolute',left:32,top:70,width:290,height:8,background:C.ink,opacity:.22*strip}}/>
      <div style={{position:'absolute',left:32,top:92,width:220,height:8,background:C.ink,opacity:.13*strip}}/>
      <div style={{position:'absolute',right:22,top:24,width:190,height:275,background:C.ink,clipPath:aperture,transform:'scaleY('+(.12+.88*cut)+')',transformOrigin:'50% 50%'}}/>
    </div>
    <div style={{position:'absolute',left:94,bottom:80,display:'flex',gap:10}}>
      {[C.reader,C.maker,C.seeker,C.local].map(x=><i key={x} style={{display:'block',width:74,height:7,background:x}}/> )}
    </div>
    <PaperNoise/>
  </Fade>
}

const rooms=[
  ['room-stacks.png','STACKS','READ',C.reader,'MARGIN'],
  ['room-workshop.png','WORKSHOP','MAKE',C.maker,'REGISTER'],
  ['room-index.png','INDEX','SEEK',C.seeker,'REFERENCE'],
  ['room-quarter.png','QUARTER','BELONG',C.local,'STREET'],
]
function Rooms({duration}){
  const f=useCurrentFrame()
  const segment=60
  return <Fade duration={duration} style={{background:C.ink,color:C.paper}}>
    <Brand label="ROOMS LEAVE EVIDENCE"/>
    {rooms.map((r,i)=>{
      const start=i*segment
      const end=start+segment
      const op=interpolate(f,[start,start+8,end-10,end],[0,1,1,0],clamp)
      const x=ease(f,start,start+18,110,0)
      const trace=ease(f,start+10,start+48,0,1)
      return <AbsoluteFill key={r[1]} style={{opacity:op}}>
        <div style={{position:'absolute',left:70,top:175,width:520}}>
          <Caption>{String(i+1).padStart(2,'0')} / {r[4]}</Caption>
          <div style={{fontFamily:Serif,fontSize:104,lineHeight:.9,letterSpacing:'-0.045em',marginTop:18}}>{r[1]}</div>
          <div style={{fontFamily:Serif,fontSize:30,lineHeight:1.15,opacity:.7,marginTop:18}}>{r[2]} leaves evidence.</div>
          <div style={{marginTop:34,height:2,width:(300*trace),background:r[3]}}/>
        </div>
        <div style={{position:'absolute',right:70,top:122,width:1110,height:800,clipPath:aperture,overflow:'hidden',transform:'translateX('+x+'px)',background:'#2a2925'}}>
          <Img src={staticFile('video-captures/'+r[0])} style={{width:'100%',height:'100%',objectFit:'cover',transform:'scale(1.05)',filter:'saturate(.9) contrast(1.03)'}}/>
          <div style={{position:'absolute',inset:0,boxShadow:'inset 0 0 0 1px rgba(247,243,234,.14)'}}/>
        </div>
        <div style={{position:'absolute',left:70,right:70,bottom:56,height:1,background:'rgba(247,243,234,.15)'}}>
          <div style={{height:2,width:(trace*100)+'%',background:r[3]}}/>
        </div>
      </AbsoluteFill>
    })}
  </Fade>
}

function Strata({duration}){
  const f=useCurrentFrame(); const {fps}=useVideoConfig()
  const enter=spring({frame:f-8,fps,config:{damping:17,stiffness:90}})
  const spread=spring({frame:f-36,fps,config:{damping:14,stiffness:64}})
  const settle=ease(f,165,250,1,0)
  const offsets=[72,54,36,18]
  return <Fade duration={duration} style={{background:C.ink,color:C.paper}}>
    <Brand label="ACCESSION STRATA"/>
    <div style={{position:'absolute',left:80,top:175,width:650,opacity:enter}}>
      <Caption>THE CARD REMEMBERS IN LAYERS</Caption>
      <div style={{fontFamily:Serif,fontSize:92,lineHeight:.91,letterSpacing:'-0.04em',marginTop:22}}>The card is built<br/>from what happened.</div>
      <div style={{fontFamily:Serif,fontSize:28,lineHeight:1.24,opacity:.72,marginTop:30}}>Margin. Registration. Reference. Street. Real behavior becomes a physical object.</div>
    </div>
    <div style={{position:'absolute',right:100,top:190,width:920,height:590,perspective:1400,opacity:enter}}>
      {offsets.map((o,i)=>{
        const k=spread*(o*(.65+.35*settle))
        const room=rooms[i]
        return <div key={o} style={{position:'absolute',inset:0,transform:'translate('+k+'px,'+k+'px) rotate('+(i*.25*spread)+'deg)',borderRadius:24,overflow:'hidden',border:'1px solid rgba(247,243,234,.24)',clipPath:aperture,opacity:.22+i*.11}}>
          <Img src={staticFile('video-captures/'+room[0])} style={{width:'100%',height:'100%',objectFit:'cover',filter:'grayscale(.45) contrast(1.08)',transform:'scale(1.08)'}}/>
          <div style={{position:'absolute',inset:0,background:'linear-gradient(120deg,'+room[3]+'55,rgba(28,27,24,.72))'}}/>
        </div>
      })}
      <div style={{position:'absolute',inset:0,overflow:'hidden',borderRadius:24,clipPath:aperture,border:'1px solid rgba(247,243,234,.34)',background:C.paper2}}>
        <Img src={staticFile('video-captures/01-member-record.png')} style={{width:'100%',height:'100%',objectFit:'cover',transform:'scale(1.06)'}}/>
      </div>
    </div>
    <div style={{position:'absolute',right:100,bottom:64,fontFamily:Sans,fontSize:10,letterSpacing:'0.18em',opacity:.58}}>MARK → LAYER → ACCUMULATE → APERTURE</div>
  </Fade>
}

function ObjectShot({duration}){
  const f=useCurrentFrame()
  const flip=ease(f,82,155,0,180)
  const zoom=ease(f,18,duration-24,1.08,1)
  const showBack=flip>90
  const rot=showBack?flip-180:flip
  return <Fade duration={duration} style={{background:C.paper,color:C.ink}}>
    <Brand dark label="CARD AS OBJECT"/>
    <div style={{position:'absolute',left:84,top:185,width:560}}>
      <Caption dark>THE CARD LEAVES THE SCREEN</Caption>
      <div style={{fontFamily:Serif,fontSize:78,lineHeight:.94,marginTop:20}}>QR. Share code.<br/>Renewal marks.<br/>Wear over time.</div>
      <div style={{fontFamily:Sans,fontSize:10,letterSpacing:'0.17em',marginTop:34,opacity:.5}}>FRONT → BACK / ONE CONTROLLED TURN</div>
    </div>
    <div style={{position:'absolute',right:125,top:185,width:900,height:590,perspective:1600}}>
      <div style={{position:'absolute',inset:0,transform:'rotateY('+rot+'deg) rotateX(2deg) scale('+zoom+')',transformStyle:'preserve-3d',transformOrigin:'50% 50%',filter:'drop-shadow(0 35px 35px rgba(28,27,24,.18))'}}>
        <Img src={staticFile(showBack?'video-captures/card-seeker-back.png':'video-captures/card-seeker-front.png')} style={{width:'100%',height:'100%',objectFit:'contain'}}/>
      </div>
    </div>
    <div style={{position:'absolute',right:120,bottom:78,display:'flex',gap:10}}>
      {['SHORT CODE','QR','RENEWED','PATINA'].map(x=><span key={x} style={{fontFamily:Sans,fontSize:10,letterSpacing:'0.15em',border:'1px solid rgba(28,27,24,.18)',padding:'10px 12px'}}>{x}</span>)}
    </div>
    <PaperNoise/>
  </Fade>
}

function Lens({duration}){
  const f=useCurrentFrame(); const move=ease(f,40,duration-35,0,1)
  return <Fade duration={duration} style={{background:C.paper2,color:C.ink}}>
    <Brand dark label="MEMBER LENS"/>
    <div style={{position:'absolute',left:78,top:170,width:590}}>
      <Caption dark>THE OBJECT BECOMES AN INSTRUMENT</Caption>
      <div style={{fontFamily:Serif,fontSize:85,lineHeight:.92,letterSpacing:'-0.035em',marginTop:22}}>The aperture<br/>becomes a lens.</div>
      <div style={{fontFamily:Serif,fontSize:28,lineHeight:1.24,marginTop:28}}>The same cut that carries evidence reveals the archive underneath.</div>
    </div>
    <div style={{position:'absolute',right:70,top:125,width:1080,height:760,overflow:'hidden',background:C.ink,clipPath:aperture,transform:'translate('+(move*-60)+'px,'+(move*18)+'px)'}}>
      <Img src={staticFile('video-captures/02-member-lens.png')} style={{width:'100%',height:'100%',objectFit:'cover',transform:'scale(1.04)'}}/>
      <div style={{position:'absolute',inset:18,border:'2px solid rgba(123,51,47,.4)',clipPath:aperture}}/>
    </div>
  </Fade>
}

function Wall({duration}){
  const f=useCurrentFrame()
  const reveal=ease(f,105,165,0,1)
  const cardP=ease(f,10,70,0,1)
  const positions=[
    [70,85,-8,.84],[390,20,4,.78],[655,155,8,.72],[190,330,2,.76]
  ]
  return <Fade duration={duration} style={{background:C.ink,color:C.paper}}>
    <Brand label="THE LIVING COLLECTION"/>
    <div style={{position:'absolute',left:78,top:150,width:660}}>
      <Caption>FROM PRIVATE RECORD TO SHARED MEMORY</Caption>
      <div style={{fontFamily:Serif,fontSize:82,lineHeight:.93,marginTop:20}}>One card becomes<br/>a collective wall.</div>
      <div style={{fontFamily:Serif,fontSize:27,lineHeight:1.25,opacity:.72,marginTop:26}}>Not a feed. Not a leaderboard. A public accession surface.</div>
    </div>
    <div style={{position:'absolute',right:60,top:125,width:1100,height:770,opacity:1-reveal}}>
      {positions.map((p,i)=><div key={i} style={{position:'absolute',left:p[0],top:p[1],width:390,height:255,transform:'translateY('+((1-cardP)*(80+i*14))+'px) rotate('+(p[2]*cardP)+'deg) scale('+p[3]+')',opacity:cardP,filter:'drop-shadow(0 24px 26px rgba(0,0,0,.26))'}}>
        <Img src={staticFile('video-captures/card-seeker-front.png')} style={{width:'100%',height:'100%',objectFit:'contain'}}/>
      </div>)}
    </div>
    <div style={{position:'absolute',right:55,top:105,width:1120,height:820,overflow:'hidden',opacity:reveal,transform:'scale('+(0.96+0.04*reveal)+')'}}>
      <Img src={staticFile('video-captures/04-living-collection.png')} style={{width:'100%',height:'100%',objectFit:'cover',filter:'contrast(1.03)'}}/>
      <div style={{position:'absolute',inset:0,boxShadow:'inset 0 0 110px rgba(0,0,0,.32)'}}/>
    </div>
    <div style={{position:'absolute',left:78,bottom:72,display:'flex',gap:10}}>
      {['PUBLISHED WITH CONSENT','REVERSIBLE','LIVE WALL'].map(x=><div key={x} style={{fontFamily:Sans,fontSize:10,letterSpacing:'0.15em',border:'1px solid rgba(247,243,234,.24)',padding:'10px 12px'}}>{x}</div>)}
    </div>
  </Fade>
}

function Quarter({duration}){
  const f=useCurrentFrame(); const line=ease(f,18,duration-30,100,0); const text=ease(f,24,60,0,1)
  return <Fade duration={duration} style={{background:C.ink,color:C.paper}}>
    <Img src={staticFile('video-captures/05-quarter.png')} style={{width:'100%',height:'100%',objectFit:'cover',filter:'saturate(.8) contrast(1.08)'}}/>
    <AbsoluteFill style={{background:'linear-gradient(90deg,rgba(20,19,16,.72),transparent 48%,rgba(20,19,16,.14))'}}/>
    <Brand label="NORTH QUARTER"/>
    <svg viewBox="0 0 1920 1080" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
      <path d="M-20 820 C320 700 520 650 760 680 S1210 770 1450 540 S1710 330 1950 390" fill="none" stroke={C.paper} strokeWidth="2" opacity=".48" pathLength="100" strokeDasharray="100" strokeDashoffset={line}/>
      <path d="M180 100 C420 260 500 420 790 470 S1270 360 1510 580 S1690 850 1910 920" fill="none" stroke={C.paper} strokeWidth="2" opacity=".32" pathLength="100" strokeDasharray="100" strokeDashoffset={line+14}/>
    </svg>
    <div style={{position:'absolute',left:76,top:170,width:760,opacity:text,transform:'translateY('+((1-text)*24)+'px)'}}>
      <Caption>ONE TRACE → MANY FORMS</Caption>
      <div style={{fontFamily:Serif,fontSize:72,lineHeight:.94,marginTop:14}}>Individual traces<br/>become civic memory.</div>
      <div style={{fontFamily:Sans,fontSize:11,letterSpacing:'0.18em',marginTop:20,opacity:.65}}>THE LIBRARY REMEMBERS.</div>
    </div>
  </Fade>
}

function Outro({duration}){
  const f=useCurrentFrame(); const p=ease(f,8,45,0,1)
  return <Fade duration={duration} style={{background:C.paper,color:C.ink}}>
    <AbsoluteFill style={{display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',opacity:p,transform:'translateY('+((1-p)*30)+'px)'}}>
      <div>
        <Caption dark>COMMON ROOM / DAY 17</Caption>
        <div style={{fontFamily:Serif,fontSize:84,lineHeight:.92,letterSpacing:'-0.03em',marginTop:22}}>You don't receive a card.<br/><em style={{fontWeight:300}}>You accumulate one.</em></div>
        <div style={{fontFamily:Sans,fontSize:11,letterSpacing:'0.2em',marginTop:42,opacity:.55}}>NORTH QUARTER PUBLIC LIBRARY · THE LIBRARY REMEMBERS</div>
      </div>
    </AbsoluteFill>
    <PaperNoise/>
  </Fade>
}

export function CommonRoomFilm(){
  const transitions=[
    [150,C.ink],[390,C.paper],[690,C.ink],[930,C.paper2],[1170,C.ink],[1440,C.paper2],[1650,C.paper],
  ]
  return <AbsoluteFill style={{background:C.ink}}>
    <Sequence from={0} durationInFrames={150}><Opening duration={150}/></Sequence>
    <Sequence from={150} durationInFrames={240}><Rooms duration={240}/></Sequence>
    <Sequence from={390} durationInFrames={300}><Strata duration={300}/></Sequence>
    <Sequence from={690} durationInFrames={240}><ObjectShot duration={240}/></Sequence>
    <Sequence from={930} durationInFrames={240}><Lens duration={240}/></Sequence>
    <Sequence from={1170} durationInFrames={270}><Wall duration={270}/></Sequence>
    <Sequence from={1440} durationInFrames={210}><Quarter duration={210}/></Sequence>
    <Sequence from={1650} durationInFrames={150}><Outro duration={150}/></Sequence>

    <TraceSpine/>
    {transitions.map(([at,tone])=><Sequence key={at} from={at-12} durationInFrames={24}><ApertureGate tone={tone}/></Sequence>)}

    <Sequence from={18} durationInFrames={1650}><Audio src={staticFile('video-audio/narration.wav')} volume={.96}/></Sequence>

    {[150,210,270,330].map((at)=><Sequence key={'tick-'+at} from={at} durationInFrames={8}><Audio src={staticFile('video-audio/tick.wav')} volume={.20}/></Sequence>)}
    <Sequence from={390} durationInFrames={12}><Audio src={staticFile('video-audio/thud.wav')} volume={.30}/></Sequence>
    <Sequence from={690} durationInFrames={10}><Audio src={staticFile('video-audio/paper.wav')} volume={.22}/></Sequence>
    <Sequence from={930} durationInFrames={30}><Audio src={staticFile('video-audio/scan.wav')} volume={.20}/></Sequence>
    <Sequence from={1170} durationInFrames={12}><Audio src={staticFile('video-audio/thud.wav')} volume={.18}/></Sequence>
    <Sequence from={1440} durationInFrames={54}><Audio src={staticFile('video-audio/swell.wav')} volume={.24}/></Sequence>
    <Sequence from={1650} durationInFrames={10}><Audio src={staticFile('video-audio/paper.wav')} volume={.12}/></Sequence>
  </AbsoluteFill>
}

const Root=()=> <Composition id="CommonRoomFilm" component={CommonRoomFilm} durationInFrames={1800} fps={30} width={1920} height={1080}/>
registerRoot(Root)
