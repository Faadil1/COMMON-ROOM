import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const C = {
  paper:'#F7F3EA', paper2:'#E8DDC9', ink:'#1C1B18',
  reader:'#7B332F', maker:'#94452F', seeker:'#26374B', local:'#3F614D',
};

const SANS="'Public Sans','Helvetica Neue',Arial,sans-serif";
const SERIF="'Newsreader',Georgia,serif";

const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'};

function Fade({children,durationFrames,style={}}){
  const f=useCurrentFrame();
  const op=interpolate(f,[0,12,durationFrames-12,durationFrames],[0,1,1,0],clamp);
  return <AbsoluteFill style={{...style,opacity:op}}>{children}</AbsoluteFill>;
}

function Grain(){
  return <AbsoluteFill style={{
    pointerEvents:'none',opacity:.12,mixBlendMode:'multiply',
    backgroundImage:'repeating-radial-gradient(circle at 20% 20%,rgba(0,0,0,.13) 0 1px,transparent 1px 3px)',
    backgroundSize:'7px 7px'
  }}/>;
}

function Brand({dark=false,index}){
  return <div style={{position:'absolute',top:44,left:52,right:52,display:'flex',justifyContent:'space-between',alignItems:'center',zIndex:20,color:dark?C.ink:C.paper}}>
    <div style={{display:'flex',gap:14,alignItems:'center'}}>
      <div style={{width:28,height:28,border:'1px solid currentColor',borderRadius:'50%',position:'relative'}}>
        <div style={{position:'absolute',left:13,top:4,bottom:4,width:1,background:'currentColor'}}/>
        <div style={{position:'absolute',top:13,left:4,right:4,height:1,background:'currentColor'}}/>
      </div>
      <div style={{fontFamily:SANS,fontSize:11,lineHeight:1.2,fontWeight:800,letterSpacing:1.7}}>NORTH QUARTER<br/>PUBLIC LIBRARY</div>
    </div>
    <div style={{fontFamily:SANS,fontSize:11,fontWeight:700,letterSpacing:2.2,opacity:.58}}>DAY 17 / {index}</div>
  </div>
}

function Kicker({children,dark=false}){
  return <div style={{fontFamily:SANS,fontSize:15,fontWeight:800,letterSpacing:3.4,color:dark?C.ink:C.paper}}>{children}</div>
}

function Intro({durationFrames}){
  const f=useCurrentFrame(); const {fps}=useVideoConfig();
  const a=spring({frame:f-8,fps,config:{damping:18,stiffness:88,mass:.8}});
  const b=spring({frame:f-24,fps,config:{damping:18,stiffness:90,mass:.8}});
  const ap=spring({frame:f-12,fps,config:{damping:16,stiffness:72}});
  return <Fade durationFrames={durationFrames} style={{background:C.paper,color:C.ink}}>
    <Brand dark index="COMMON ROOM"/>
    <div style={{position:'absolute',left:116,top:160,width:1160}}>
      <Kicker dark>A CARD AS A BELONGING ARTIFACT</Kicker>
      <div style={{fontFamily:SERIF,fontSize:164,lineHeight:.79,letterSpacing:-8,fontWeight:500,marginTop:24,transform:`translateY(${(1-a)*46}px)`,opacity:a}}>COMMON</div>
      <div style={{fontFamily:SERIF,fontSize:164,lineHeight:.79,letterSpacing:-8,fontWeight:300,fontStyle:'italic',transform:`translateY(${(1-b)*46}px)`,opacity:b}}>ROOM</div>
      <div style={{fontFamily:SERIF,fontSize:39,lineHeight:1.15,marginTop:54,width:900,opacity:interpolate(f,[34,58],[0,1],clamp)}}>
        A library card shouldn't just unlock access.<br/><em>It should reveal belonging.</em>
      </div>
    </div>
    <div style={{position:'absolute',right:110,top:155,width:520,height:720,background:C.ink,clipPath:'polygon(0 22%,9% 0,100% 0,100% 76%,73% 100%,0 100%)',transform:`scaleY(${.05+.95*ap})`,transformOrigin:'50% 50%'}}>
      <div style={{position:'absolute',inset:24,border:'1px solid rgba(247,243,234,.24)',clipPath:'inherit'}}/>
    </div>
    <div style={{position:'absolute',left:116,bottom:88,display:'flex',gap:12}}>
      {[C.reader,C.maker,C.seeker,C.local].map((x,i)=><div key={x} style={{width:70*a,height:7,background:x,transformOrigin:'0 50%'}}/> )}
    </div>
    <Grain/>
  </Fade>
}

function Rooms({durationFrames}){
  const f=useCurrentFrame(); const {fps}=useVideoConfig();
  const panel=spring({frame:f-8,fps,config:{damping:18,stiffness:95}});
  const rooms=[
    ['01','STACKS','READ',C.reader],['02','WORKSHOP','MAKE',C.maker],['03','INDEX','SEEK',C.seeker],['04','QUARTER','BELONG',C.local]
  ];
  return <Fade durationFrames={durationFrames} style={{background:C.ink}}>
    <OffthreadVideo src={staticFile('video-assets/runtime.mp4')} startFrom={0} endAt={300} muted style={{width:'100%',height:'100%',objectFit:'cover',transform:'scale(1.03)'}}/>
    <AbsoluteFill style={{background:'linear-gradient(90deg,rgba(20,19,16,.82) 0%,rgba(20,19,16,.28) 45%,rgba(20,19,16,.12) 68%,rgba(20,19,16,.65) 100%)'}}/>
    <Brand index="ROOMS, NOT PAGES"/>
    <div style={{position:'absolute',left:52,top:178,width:520,padding:'28px 30px',background:'rgba(23,22,18,.82)',border:'1px solid rgba(247,243,234,.15)',backdropFilter:'blur(8px)',transform:`translateX(${(1-panel)*-80}px)`,opacity:panel}}>
      <Kicker>THE LIBRARY WATCHES WHAT YOU DO</Kicker>
      <div style={{marginTop:24}}>
        {rooms.map((r,i)=>{
          const p=spring({frame:f-(26+i*18),fps,config:{damping:20,stiffness:110}});
          return <div key={r[1]} style={{display:'grid',gridTemplateColumns:'44px 1fr auto',alignItems:'center',gap:12,padding:'18px 0',borderBottom:i<3?'1px solid rgba(247,243,234,.12)':'none',transform:`translateX(${(1-p)*-22}px)`,opacity:p}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:r[3]}}/>
            <div style={{fontFamily:SERIF,fontSize:32,fontWeight:500}}>{r[1]}</div>
            <div style={{fontFamily:SANS,fontSize:10,letterSpacing:2.2,opacity:.65}}>{r[2]}</div>
          </div>
        })}
      </div>
    </div>
    <div style={{position:'absolute',left:52,right:52,bottom:48,display:'flex',justifyContent:'space-between',alignItems:'end'}}>
      <div style={{fontFamily:SERIF,fontSize:40,lineHeight:1.02,fontWeight:300}}>Do not ask who they are.<br/>Let behavior leave the evidence.</div>
      <div style={{fontFamily:SANS,fontSize:11,letterSpacing:2.5,opacity:.7}}>MARK → MEMORY</div>
    </div>
  </Fade>
}

function Causal({durationFrames}){
  const f=useCurrentFrame(); const {fps}=useVideoConfig();
  const steps=[['MARK','room action'],['LAYER','evidence'],['ACCUMULATE','record'],['APERTURE','one cut'],['REVEAL','memory'],['BELONG','collection']];
  return <Fade durationFrames={durationFrames} style={{background:C.paper,color:C.ink}}>
    <Brand dark index="CAUSAL SYSTEM"/>
    <div style={{position:'absolute',left:145,right:145,top:470,height:2,background:'rgba(28,27,24,.17)'}}/>
    <div style={{position:'absolute',left:145,right:145,top:350,display:'grid',gridTemplateColumns:'repeat(6,1fr)'}}>
      {steps.map((s,i)=>{
        const p=spring({frame:f-(8+i*10),fps,config:{damping:18,stiffness:120}});
        return <div key={s[0]} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:18,opacity:p,transform:`translateY(${(1-p)*24}px)`}}>
          <div style={{height:84,fontFamily:SANS,fontSize:12,fontWeight:800,letterSpacing:2.3,display:'flex',alignItems:'end'}}>{s[0]}</div>
          <div style={{width:19,height:19,borderRadius:'50%',background:p>.8?C.ink:C.paper,border:`2px solid ${C.ink}`}}/>
          <div style={{fontFamily:SERIF,fontSize:25,fontWeight:300}}>{s[1]}</div>
        </div>
      })}
    </div>
    <div style={{position:'absolute',left:140,bottom:110,fontFamily:SERIF,fontSize:44,fontStyle:'italic'}}>The card is the compressed evidence of the whole visit.</div>
    <Grain/>
  </Fade>
}

function Record({durationFrames}){
  const f=useCurrentFrame(); const {fps}=useVideoConfig();
  const enter=spring({frame:f-8,fps,config:{damping:17,stiffness:90}});
  const spread=spring({frame:f-30,fps,config:{damping:14,stiffness:65}});
  const layers=[3,2,1];
  return <Fade durationFrames={durationFrames} style={{background:C.ink}}>
    <Brand index="MEMBER RECORD"/>
    <div style={{position:'absolute',left:80,top:190,width:670,opacity:enter,transform:`translateX(${(1-enter)*-60}px)`}}>
      <Kicker>THE CARD REMEMBERS IN LAYERS</Kicker>
      <div style={{fontFamily:SERIF,fontSize:91,lineHeight:.92,letterSpacing:-3.5,fontWeight:500,marginTop:18}}>You don't receive<br/>a finished card.</div>
      <div style={{fontFamily:SERIF,fontSize:29,lineHeight:1.27,opacity:.78,marginTop:28,width:610}}>Real actions become visible strata. Every exposed layer comes from something the visitor actually did.</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:9,marginTop:36}}>
        {['ACCESSION APERTURE','BEHAVIOR-DERIVED','PHYSICAL DEPTH'].map(x=><span key={x} style={{fontFamily:SANS,fontSize:10,letterSpacing:1.9,border:'1px solid rgba(247,243,234,.23)',padding:'10px 12px'}}>{x}</span>)}
      </div>
    </div>
    <div style={{position:'absolute',right:90,top:180,width:900,height:620,perspective:1400,opacity:enter,transform:`translateX(${(1-enter)*120}px)`}}>
      {layers.map((n,i)=><div key={n} style={{position:'absolute',inset:0,borderRadius:26,border:'1px solid rgba(247,243,234,.25)',background:'linear-gradient(120deg,rgba(247,243,234,.12),rgba(247,243,234,.025))',clipPath:'polygon(0 0,100% 0,100% 80%,87% 100%,0 100%)',transform:`translate(${spread*(18+n*12)}px,${spread*(18+n*12)}px) rotate(${spread*n*.15}deg)`,opacity:.18+i*.12}}/> )}
      <div style={{position:'absolute',inset:0,borderRadius:26,overflow:'hidden',clipPath:'polygon(0 0,100% 0,100% 80%,87% 100%,0 100%)',border:'1px solid rgba(247,243,234,.35)',background:'#26241f'}}>
        <OffthreadVideo src={staticFile('video-assets/runtime.mp4')} startFrom={510} endAt={810} muted style={{width:'100%',height:'100%',objectFit:'cover',transform:'scale(1.35)'}}/>
      </div>
    </div>
  </Fade>
}

function Lens({durationFrames}){
  const f=useCurrentFrame(); const {fps}=useVideoConfig();
  const e=spring({frame:f-7,fps,config:{damping:17,stiffness:92}});
  const drift=interpolate(f,[30,150],[0,1],clamp);
  return <Fade durationFrames={durationFrames} style={{background:C.paper2,color:C.ink}}>
    <Brand dark index="MEMBER LENS"/>
    <div style={{position:'absolute',left:86,top:175,width:625,opacity:e,transform:`translateX(${(1-e)*-55}px)`}}>
      <Kicker dark>THE OBJECT BECOMES AN INSTRUMENT</Kicker>
      <div style={{fontFamily:SERIF,fontSize:88,lineHeight:.92,letterSpacing:-3.2,fontWeight:500,marginTop:18}}>The aperture<br/>becomes a lens.</div>
      <div style={{fontFamily:SERIF,fontSize:29,lineHeight:1.26,marginTop:28,width:570}}>The same opening that carries your traces is used to reveal provenance and hidden memory.</div>
    </div>
    <div style={{position:'absolute',right:85,top:125,width:1000,height:720,clipPath:'polygon(0 19%,8% 0,100% 0,100% 76%,74% 100%,0 100%)',overflow:'hidden',background:C.ink,boxShadow:'0 40px 90px rgba(28,27,24,.18)',opacity:e,transform:`translate(${(1-e)*80-drift*42}px,${drift*18}px) scale(${.95+.05*e})`}}>
      <OffthreadVideo src={staticFile('video-assets/runtime.mp4')} startFrom={870} endAt={1110} muted style={{width:'100%',height:'100%',objectFit:'cover',transform:'scale(1.18)'}}/>
      <div style={{position:'absolute',inset:18,border:`2px solid rgba(123,51,47,.42)`,clipPath:'inherit'}}/>
    </div>
    <Grain/>
  </Fade>
}

function Wall({durationFrames}){
  const f=useCurrentFrame(); const {fps}=useVideoConfig();
  const enter=spring({frame:f-8,fps,config:{damping:18,stiffness:92}});
  const cards=[
    ['READER','MARGIN / PAGE',C.reader,-5,0,55],
    ['MAKER','REGISTER / PLATE',C.maker,2,280,0],
    ['SEEKER','021 → 114 → 403',C.seeker,6,515,190],
    ['LOCAL','MARKET → SCHOOL → RIVER',C.local,3,90,345],
  ];
  return <Fade durationFrames={durationFrames} style={{background:C.ink}}>
    <Brand index="THE LIVING COLLECTION"/>
    <div style={{position:'absolute',left:82,top:168,width:790,opacity:enter,transform:`translateX(${(1-enter)*-60}px)`}}>
      <Kicker>FROM PRIVATE RECORD TO SHARED MEMORY</Kicker>
      <div style={{fontFamily:SERIF,fontSize:84,lineHeight:.94,fontWeight:500,marginTop:18}}>Every member<br/>becomes part<br/>of the collection.</div>
      <div style={{fontFamily:SERIF,fontSize:27,lineHeight:1.27,opacity:.8,marginTop:24,width:650}}>Share links preview the real card. The back carries a QR code. Repeat visits age the object. Publishing to the wall is explicit and reversible.</div>
    </div>
    <div style={{position:'absolute',right:55,top:135,width:900,height:740}}>
      {cards.map((c,i)=>{
        const p=spring({frame:f-(16+i*10),fps,config:{damping:16,stiffness:100}});
        return <div key={c[0]} style={{position:'absolute',left:c[4],top:c[5],width:365,height:230,borderRadius:15,background:C.paper2,color:C.ink,padding:22,boxShadow:'0 26px 55px rgba(0,0,0,.32)',border:'1px solid rgba(247,243,234,.16)',transform:`translateY(${(1-p)*100}px) rotate(${c[3]}deg)`,opacity:p,overflow:'hidden'}}>
          <div style={{fontFamily:SERIF,fontSize:31,fontWeight:500}}>{c[0]}</div>
          <div style={{position:'absolute',right:0,top:0,width:'44%',height:'100%',background:'#24231f',clipPath:'polygon(0 18%,8% 0,100% 0,100% 77%,72% 100%,0 100%)'}}>
            <div style={{position:'absolute',left:18,right:18,top:'48%',height:1,background:c[2],opacity:.9}}/>
          </div>
          <div style={{position:'absolute',left:22,bottom:19,fontFamily:SANS,fontSize:9,letterSpacing:1.6,opacity:.6}}>{c[1]}</div>
        </div>
      })}
    </div>
    <div style={{position:'absolute',left:82,bottom:76,display:'flex',gap:10,opacity:enter}}>
      {['QR','SHARE','RENEWED','D1 WALL'].map(x=><span key={x} style={{fontFamily:SANS,fontSize:10,letterSpacing:1.7,border:'1px solid rgba(247,243,234,.24)',padding:'10px 12px'}}>{x}</span>)}
    </div>
  </Fade>
}

function MapScene({durationFrames}){
  const f=useCurrentFrame();
  const dash=interpolate(f,[20,durationFrames-20],[900,0],clamp);
  const label=interpolate(f,[22,52],[0,1],clamp);
  return <Fade durationFrames={durationFrames} style={{background:C.ink}}>
    <OffthreadVideo src={staticFile('video-assets/runtime.mp4')} startFrom={1320} endAt={1620} muted style={{width:'100%',height:'100%',objectFit:'cover',filter:'saturate(.84) contrast(1.04)'}}/>
    <AbsoluteFill style={{background:'linear-gradient(90deg,rgba(23,22,18,.68),transparent 42%,rgba(23,22,18,.18))'}}/>
    <Brand index="NORTH QUARTER"/>
    <svg style={{position:'absolute',inset:0,width:'100%',height:'100%'}} viewBox="0 0 1920 1080" preserveAspectRatio="none">
      {[
        'M-40 820 C260 710 410 610 660 650 S1080 790 1260 620 S1590 350 1980 410',
        'M240 110 C430 290 520 420 730 460 S1110 410 1320 530 S1600 870 1870 930',
        'M30 440 C370 390 610 320 860 350 S1330 510 1580 470 S1760 390 1950 270'
      ].map((d,i)=><path key={i} d={d} fill="none" stroke={C.paper} strokeWidth={2} opacity={.35} strokeDasharray="18 10" strokeDashoffset={dash+i*70}/>)}
    </svg>
    <div style={{position:'absolute',left:76,bottom:70,width:870,opacity:label,transform:`translateY(${(1-label)*35}px)`}}>
      <Kicker>ONE TRACE → MANY FORMS</Kicker>
      <div style={{fontFamily:SERIF,fontSize:74,lineHeight:.95,fontWeight:500,marginTop:10}}>Individual traces become civic memory.</div>
      <div style={{fontFamily:SANS,fontSize:12,letterSpacing:2.1,marginTop:18,opacity:.68}}>THE LIVING COLLECTION → NORTH QUARTER</div>
    </div>
  </Fade>
}

function Outro({durationFrames}){
  const f=useCurrentFrame(); const {fps}=useVideoConfig();
  const p=spring({frame:f-6,fps,config:{damping:18,stiffness:86}});
  return <Fade durationFrames={durationFrames} style={{background:C.paper,color:C.ink}}>
    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',opacity:p,transform:`translateY(${(1-p)*34}px)`}}>
      <div>
        <Kicker dark>COMMON ROOM / DAY 17</Kicker>
        <div style={{fontFamily:SERIF,fontSize:83,lineHeight:.92,fontWeight:500,letterSpacing:-3,marginTop:20}}>You don't receive a card.<br/><em style={{fontWeight:300}}>You accumulate one.</em></div>
        <div style={{fontFamily:SANS,fontSize:12,letterSpacing:2.4,marginTop:40,opacity:.58}}>NORTH QUARTER PUBLIC LIBRARY · THE LIBRARY REMEMBERS</div>
        <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:34}}>
          {[C.reader,C.maker,C.seeker,C.local].map(x=><div key={x} style={{width:72,height:6,background:x}}/> )}
        </div>
      </div>
    </div>
    <Grain/>
  </Fade>
}

export const CommonRoomFilm=()=>{
  return <AbsoluteFill style={{background:C.ink}}>
    <Sequence from={0} durationInFrames={150}><Intro durationFrames={150}/></Sequence>
    <Sequence from={150} durationInFrames={300}><Rooms durationFrames={300}/></Sequence>
    <Sequence from={450} durationInFrames={150}><Causal durationFrames={150}/></Sequence>
    <Sequence from={600} durationInFrames={300}><Record durationFrames={300}/></Sequence>
    <Sequence from={900} durationInFrames={240}><Lens durationFrames={240}/></Sequence>
    <Sequence from={1140} durationInFrames={240}><Wall durationFrames={240}/></Sequence>
    <Sequence from={1380} durationInFrames={180}><MapScene durationFrames={180}/></Sequence>
    <Sequence from={1560} durationInFrames={120}><Outro durationFrames={120}/></Sequence>

    <Sequence from={12} durationInFrames={1549}>
      <Audio src={staticFile('video-assets/narration.m4a')} volume={1}/>
    </Sequence>
    {[150,450,600,900,1140,1380,1560].map((at,i)=>
      <Sequence key={at} from={at} durationInFrames={18}>
        <Audio src={staticFile(i%2===0?'video-assets/paper.wav':'video-assets/thud.wav')} volume={i===6?.24:.13}/>
      </Sequence>
    )}
  </AbsoluteFill>;
};
