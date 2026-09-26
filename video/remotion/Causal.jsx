import React from 'react';
import {spring,useCurrentFrame,useVideoConfig} from 'remotion';
import {Brand,C,Fade,Grain,SANS,SERIF} from './theme.jsx';

export function Causal({durationFrames}){
 const f=useCurrentFrame();
 const {fps}=useVideoConfig();
 const steps=[['MARK','room action'],['LAYER','evidence'],['ACCUMULATE','record'],['APERTURE','one cut'],['REVEAL','memory'],['BELONG','collection']];
 return <Fade durationFrames={durationFrames} style={{background:C.paper,color:C.ink}}>
  <Brand dark index="CAUSAL SYSTEM"/>
  <div style={{position:'absolute',left:145,right:145,top:470,height:2,background:'rgba(28,27,24,.17)'}}/>
  <div style={{position:'absolute',left:145,right:145,top:350,display:'grid',gridTemplateColumns:'repeat(6,1fr)'}}>
   {steps.map((s,i)=>{
    const p=spring({frame:f-(8+i*10),fps,config:{damping:18,stiffness:120}});
    return <div key={s[0]} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:18,opacity:p,transform:'translateY('+((1-p)*24)+'px)'}}>
     <div style={{height:84,fontFamily:SANS,fontSize:12,fontWeight:800,letterSpacing:2.3,display:'flex',alignItems:'end'}}>{s[0]}</div>
     <div style={{width:19,height:19,borderRadius:'50%',background:p>.8?C.ink:C.paper,border:'2px solid '+C.ink}}/>
     <div style={{fontFamily:SERIF,fontSize:25,fontWeight:300}}>{s[1]}</div>
    </div>
   })}
  </div>
  <div style={{position:'absolute',left:140,bottom:110,fontFamily:SERIF,fontSize:44,fontStyle:'italic'}}>The card is the compressed evidence of the whole visit.</div>
  <Grain/>
 </Fade>;
}
