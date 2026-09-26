import React from 'react';
import {OffthreadVideo,spring,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {Brand,C,Fade,Kicker,SANS,SERIF} from './theme.jsx';

export function Record({durationFrames}){
 const f=useCurrentFrame();
 const {fps}=useVideoConfig();
 const enter=spring({frame:f-8,fps,config:{damping:17,stiffness:90}});
 const spread=spring({frame:f-30,fps,config:{damping:14,stiffness:65}});
 const layers=[3,2,1];
 return <Fade durationFrames={durationFrames} style={{background:C.ink}}>
  <Brand index="MEMBER RECORD"/>
  <div style={{position:'absolute',left:80,top:190,width:670,opacity:enter,transform:'translateX('+((1-enter)*-60)+'px)'}}>
   <Kicker>THE CARD REMEMBERS IN LAYERS</Kicker>
   <div style={{fontFamily:SERIF,fontSize:91,lineHeight:.92,letterSpacing:-3.5,fontWeight:500,marginTop:18}}>You don't receive<br/>a finished card.</div>
   <div style={{fontFamily:SERIF,fontSize:29,lineHeight:1.27,opacity:.78,marginTop:28,width:610}}>Real actions become visible strata. Every exposed layer comes from something the visitor actually did.</div>
   <div style={{display:'flex',flexWrap:'wrap',gap:9,marginTop:36}}>
    {['ACCESSION APERTURE','BEHAVIOR-DERIVED','PHYSICAL DEPTH'].map(x=><span key={x} style={{fontFamily:SANS,fontSize:10,letterSpacing:1.9,border:'1px solid rgba(247,243,234,.23)',padding:'10px 12px'}}>{x}</span>)}
   </div>
  </div>
  <div style={{position:'absolute',right:90,top:180,width:900,height:620,perspective:1400,opacity:enter,transform:'translateX('+((1-enter)*120)+'px)'}}>
   {layers.map((n,i)=><div key={n} style={{position:'absolute',inset:0,borderRadius:26,border:'1px solid rgba(247,243,234,.25)',background:'linear-gradient(120deg,rgba(247,243,234,.12),rgba(247,243,234,.025))',clipPath:'polygon(0 0,100% 0,100% 80%,87% 100%,0 100%)',transform:'translate('+(spread*(18+n*12))+'px,'+(spread*(18+n*12))+'px) rotate('+(spread*n*.15)+'deg)',opacity:.18+i*.12}}/>)}
   <div style={{position:'absolute',inset:0,borderRadius:26,overflow:'hidden',clipPath:'polygon(0 0,100% 0,100% 80%,87% 100%,0 100%)',border:'1px solid rgba(247,243,234,.35)',background:'#26241f'}}>
    <OffthreadVideo src={staticFile('video-assets/runtime.mp4')} startFrom={510} endAt={810} muted style={{width:'100%',height:'100%',objectFit:'cover',transform:'scale(1.35)'}}/>
   </div>
  </div>
 </Fade>;
}
