import React from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame} from 'remotion';

export const C={paper:'#F7F3EA',paper2:'#E8DDC9',ink:'#1C1B18',reader:'#7B332F',maker:'#94452F',seeker:'#26374B',local:'#3F614D'};
export const SANS="'Public Sans','Helvetica Neue',Arial,sans-serif";
export const SERIF="'Newsreader',Georgia,serif";
export const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'};

export function Fade({children,durationFrames,style={}}){
 const f=useCurrentFrame();
 const op=interpolate(f,[0,12,durationFrames-12,durationFrames],[0,1,1,0],clamp);
 return <AbsoluteFill style={{...style,opacity:op}}>{children}</AbsoluteFill>;
}
export function Grain(){return <AbsoluteFill style={{pointerEvents:'none',opacity:.11,mixBlendMode:'multiply',backgroundImage:'repeating-radial-gradient(circle at 20% 20%,rgba(0,0,0,.13) 0 1px,transparent 1px 3px)',backgroundSize:'7px 7px'}}/>}
export function Brand({dark=false,index}){return <div style={{position:'absolute',top:44,left:52,right:52,display:'flex',justifyContent:'space-between',alignItems:'center',zIndex:20,color:dark?C.ink:C.paper}}>
 <div style={{display:'flex',gap:14,alignItems:'center'}}><div style={{width:28,height:28,border:'1px solid currentColor',borderRadius:'50%',position:'relative'}}><div style={{position:'absolute',left:13,top:4,bottom:4,width:1,background:'currentColor'}}/><div style={{position:'absolute',top:13,left:4,right:4,height:1,background:'currentColor'}}/></div><div style={{fontFamily:SANS,fontSize:11,lineHeight:1.2,fontWeight:800,letterSpacing:1.7}}>NORTH QUARTER<br/>PUBLIC LIBRARY</div></div>
 <div style={{fontFamily:SANS,fontSize:11,fontWeight:700,letterSpacing:2.2,opacity:.58}}>DAY 17 / {index}</div></div>}
export function Kicker({children,dark=false}){return <div style={{fontFamily:SANS,fontSize:15,fontWeight:800,letterSpacing:3.4,color:dark?C.ink:C.paper}}>{children}</div>}
