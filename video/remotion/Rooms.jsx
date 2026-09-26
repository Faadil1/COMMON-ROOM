import React from 'react';
import {AbsoluteFill,OffthreadVideo,spring,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {Brand,C,Fade,Kicker,SANS,SERIF} from './theme.jsx';

export function Rooms({durationFrames}){
 const f=useCurrentFrame();
 const {fps}=useVideoConfig();
 const panel=spring({frame:f-8,fps,config:{damping:18,stiffness:95}});
 const rooms=[['STACKS','READ',C.reader],['WORKSHOP','MAKE',C.maker],['INDEX','SEEK',C.seeker],['QUARTER','BELONG',C.local]];
 return <Fade durationFrames={durationFrames} style={{background:C.ink}}>
  <OffthreadVideo src={staticFile('video-assets/runtime.mp4')} startFrom={0} endAt={300} muted style={{width:'100%',height:'100%',objectFit:'cover',transform:'scale(1.03)'}}/>
  <AbsoluteFill style={{background:'linear-gradient(90deg,rgba(20,19,16,.82),rgba(20,19,16,.24) 48%,rgba(20,19,16,.62))'}}/>
  <Brand index="ROOMS, NOT PAGES"/>
  <div style={{position:'absolute',left:52,top:178,width:520,padding:'28px 30px',background:'rgba(23,22,18,.82)',border:'1px solid rgba(247,243,234,.15)',transform:'translateX('+((1-panel)*-80)+'px)',opacity:panel}}>
   <Kicker>THE LIBRARY WATCHES WHAT YOU DO</Kicker>
   <div style={{marginTop:24}}>
    {rooms.map((r,i)=>{
      const p=spring({frame:f-(26+i*18),fps,config:{damping:20,stiffness:110}});
      return <div key={r[0]} style={{display:'grid',gridTemplateColumns:'44px 1fr auto',alignItems:'center',gap:12,padding:'18px 0',borderBottom:i<3?'1px solid rgba(247,243,234,.12)':'none',transform:'translateX('+((1-p)*-22)+'px)',opacity:p}}>
       <div style={{width:10,height:10,borderRadius:'50%',background:r[2]}}/>
       <div style={{fontFamily:SERIF,fontSize:32,fontWeight:500}}>{r[0]}</div>
       <div style={{fontFamily:SANS,fontSize:10,letterSpacing:2.2,opacity:.65}}>{r[1]}</div>
      </div>
    })}
   </div>
  </div>
  <div style={{position:'absolute',left:52,right:52,bottom:48,display:'flex',justifyContent:'space-between',alignItems:'end'}}>
   <div style={{fontFamily:SERIF,fontSize:40,lineHeight:1.02,fontWeight:300}}>Do not ask who they are.<br/>Let behavior leave the evidence.</div>
   <div style={{fontFamily:SANS,fontSize:11,letterSpacing:2.5,opacity:.7}}>MARK → MEMORY</div>
  </div>
 </Fade>;
}
