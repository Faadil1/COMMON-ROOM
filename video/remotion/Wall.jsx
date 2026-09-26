import React from 'react';
import {spring,useCurrentFrame,useVideoConfig} from 'remotion';
import {Brand,C,Fade,Kicker,SANS,SERIF} from './theme.jsx';

export function Wall({durationFrames}){
 const f=useCurrentFrame();
 const {fps}=useVideoConfig();
 const enter=spring({frame:f-8,fps,config:{damping:18,stiffness:92}});
 const cards=[
  ['READER','MARGIN / PAGE',C.reader,-5,0,55],
  ['MAKER','REGISTER / PLATE',C.maker,2,280,0],
  ['SEEKER','021 → 114 → 403',C.seeker,6,515,190],
  ['LOCAL','MARKET → SCHOOL → RIVER',C.local,3,90,345],
 ];
 return <Fade durationFrames={durationFrames} style={{background:C.ink}}>
  <Brand index="THE LIVING COLLECTION"/>
  <div style={{position:'absolute',left:82,top:168,width:790,opacity:enter,transform:'translateX('+((1-enter)*-60)+'px)'}}>
   <Kicker>FROM PRIVATE RECORD TO SHARED MEMORY</Kicker>
   <div style={{fontFamily:SERIF,fontSize:84,lineHeight:.94,fontWeight:500,marginTop:18}}>Every member<br/>becomes part<br/>of the collection.</div>
   <div style={{fontFamily:SERIF,fontSize:27,lineHeight:1.27,opacity:.8,marginTop:24,width:650}}>Share links preview the real card. The back carries a QR code. Repeat visits age the object. Publishing to the wall is explicit and reversible.</div>
  </div>
  <div style={{position:'absolute',right:55,top:135,width:900,height:740}}>
   {cards.map((c,i)=>{
    const p=spring({frame:f-(16+i*10),fps,config:{damping:16,stiffness:100}});
    return <div key={c[0]} style={{position:'absolute',left:c[4],top:c[5],width:365,height:230,borderRadius:15,background:C.paper2,color:C.ink,padding:22,boxShadow:'0 26px 55px rgba(0,0,0,.32)',border:'1px solid rgba(247,243,234,.16)',transform:'translateY('+((1-p)*100)+'px) rotate('+c[3]+'deg)',opacity:p,overflow:'hidden'}}>
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
 </Fade>;
}
