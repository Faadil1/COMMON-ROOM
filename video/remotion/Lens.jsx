import React from 'react';
import {OffthreadVideo,interpolate,spring,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {Brand,C,Fade,Grain,Kicker,SERIF,clamp} from './theme.jsx';

export function Lens({durationFrames}){
 const f=useCurrentFrame();
 const {fps}=useVideoConfig();
 const e=spring({frame:f-7,fps,config:{damping:17,stiffness:92}});
 const drift=interpolate(f,[30,150],[0,1],clamp);
 return <Fade durationFrames={durationFrames} style={{background:C.paper2,color:C.ink}}>
  <Brand dark index="MEMBER LENS"/>
  <div style={{position:'absolute',left:86,top:175,width:625,opacity:e,transform:'translateX('+((1-e)*-55)+'px)'}}>
   <Kicker dark>THE OBJECT BECOMES AN INSTRUMENT</Kicker>
   <div style={{fontFamily:SERIF,fontSize:88,lineHeight:.92,letterSpacing:-3.2,fontWeight:500,marginTop:18}}>The aperture<br/>becomes a lens.</div>
   <div style={{fontFamily:SERIF,fontSize:29,lineHeight:1.26,marginTop:28,width:570}}>The same opening that carries your traces is used to reveal provenance and hidden memory.</div>
  </div>
  <div style={{position:'absolute',right:85,top:125,width:1000,height:720,clipPath:'polygon(0 19%,8% 0,100% 0,100% 76%,74% 100%,0 100%)',overflow:'hidden',background:C.ink,boxShadow:'0 40px 90px rgba(28,27,24,.18)',opacity:e,transform:'translate('+((1-e)*80-drift*42)+'px,'+(drift*18)+'px) scale('+(.95+.05*e)+')'}}>
   <OffthreadVideo src={staticFile('video-assets/runtime.mp4')} startFrom={870} endAt={1110} muted style={{width:'100%',height:'100%',objectFit:'cover',transform:'scale(1.18)'}}/>
   <div style={{position:'absolute',inset:18,border:'2px solid rgba(123,51,47,.42)',clipPath:'inherit'}}/>
  </div>
  <Grain/>
 </Fade>;
}
