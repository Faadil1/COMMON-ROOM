import React from 'react';
import {AbsoluteFill,OffthreadVideo,interpolate,staticFile,useCurrentFrame} from 'remotion';
import {Brand,C,Fade,Kicker,SANS,SERIF,clamp} from './theme.jsx';

export function MapScene({durationFrames}){
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
  <div style={{position:'absolute',left:76,bottom:70,width:870,opacity:label,transform:'translateY('+((1-label)*35)+'px)'}}>
   <Kicker>ONE TRACE → MANY FORMS</Kicker>
   <div style={{fontFamily:SERIF,fontSize:74,lineHeight:.95,fontWeight:500,marginTop:10}}>Individual traces become civic memory.</div>
   <div style={{fontFamily:SANS,fontSize:12,letterSpacing:2.1,marginTop:18,opacity:.68}}>THE LIVING COLLECTION → NORTH QUARTER</div>
  </div>
 </Fade>;
}
