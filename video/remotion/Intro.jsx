import React from 'react';
import {spring,useCurrentFrame,useVideoConfig} from 'remotion';
import {Brand,C,Fade,Grain,Kicker,SERIF} from './theme.jsx';

export function Intro({durationFrames}){
 const f=useCurrentFrame();
 const {fps}=useVideoConfig();
 const a=spring({frame:f-8,fps,config:{damping:18,stiffness:88,mass:.8}});
 const b=spring({frame:f-24,fps,config:{damping:18,stiffness:90,mass:.8}});
 const ap=spring({frame:f-12,fps,config:{damping:16,stiffness:72}});
 return <Fade durationFrames={durationFrames} style={{background:C.paper,color:C.ink}}>
  <Brand dark index="COMMON ROOM"/>
  <div style={{position:'absolute',left:116,top:160,width:1160}}>
   <Kicker dark>A CARD AS A BELONGING ARTIFACT</Kicker>
   <div style={{fontFamily:SERIF,fontSize:164,lineHeight:.79,letterSpacing:-8,fontWeight:500,marginTop:24,transform:'translateY('+((1-a)*46)+'px)',opacity:a}}>COMMON</div>
   <div style={{fontFamily:SERIF,fontSize:164,lineHeight:.79,letterSpacing:-8,fontWeight:300,fontStyle:'italic',transform:'translateY('+((1-b)*46)+'px)',opacity:b}}>ROOM</div>
   <div style={{fontFamily:SERIF,fontSize:39,lineHeight:1.15,marginTop:54,width:900,opacity:a}}>A library card shouldn't just unlock access.<br/><em>It should reveal belonging.</em></div>
  </div>
  <div style={{position:'absolute',right:110,top:155,width:520,height:720,background:C.ink,clipPath:'polygon(0 22%,9% 0,100% 0,100% 76%,73% 100%,0 100%)',transform:'scaleY('+(.05+.95*ap)+')',transformOrigin:'50% 50%'}}><div style={{position:'absolute',inset:24,border:'1px solid rgba(247,243,234,.24)',clipPath:'inherit'}}/></div>
  <div style={{position:'absolute',left:116,bottom:88,display:'flex',gap:12}}>{[C.reader,C.maker,C.seeker,C.local].map(x=><div key={x} style={{width:70*a,height:7,background:x}}/>)}</div>
  <Grain/>
 </Fade>;
}
