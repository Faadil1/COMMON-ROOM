import React from 'react';
import {spring,useCurrentFrame,useVideoConfig} from 'remotion';
import {C,Fade,Grain,Kicker,SANS,SERIF} from './theme.jsx';

export function Outro({durationFrames}){
 const f=useCurrentFrame();
 const {fps}=useVideoConfig();
 const p=spring({frame:f-6,fps,config:{damping:18,stiffness:86}});
 return <Fade durationFrames={durationFrames} style={{background:C.paper,color:C.ink}}>
  <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',opacity:p,transform:'translateY('+((1-p)*34)+'px)'}}>
   <div>
    <Kicker dark>COMMON ROOM / DAY 17</Kicker>
    <div style={{fontFamily:SERIF,fontSize:83,lineHeight:.92,fontWeight:500,letterSpacing:-3,marginTop:20}}>You don't receive a card.<br/><em style={{fontWeight:300}}>You accumulate one.</em></div>
    <div style={{fontFamily:SANS,fontSize:12,letterSpacing:2.4,marginTop:40,opacity:.58}}>NORTH QUARTER PUBLIC LIBRARY · THE LIBRARY REMEMBERS</div>
    <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:34}}>
     {[C.reader,C.maker,C.seeker,C.local].map(x=><div key={x} style={{width:72,height:6,background:x}}/>)}
    </div>
   </div>
  </div>
  <Grain/>
 </Fade>;
}
