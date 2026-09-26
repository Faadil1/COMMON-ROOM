#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const sleep=(ms)=>new Promise(r=>setTimeout(r,ms))
const root=fileURLToPath(new URL('../../',import.meta.url))
const cfgPath=path.join(root,'video/ai33/common-room-media-pack.json')
const outDir=path.join(root,'public/video-audio')
const generatedDir=path.join(root,'video/generated')
await fs.mkdir(outDir,{recursive:true})
await fs.mkdir(generatedDir,{recursive:true})

const apiKey=process.env.AI33_API_KEY
if(!apiKey) throw new Error('AI33_API_KEY is not loaded in this process.')
const base=(process.env.AI33_BASE_URL||'https://api.ai33.pro').replace(/\/$/,'')
const cfg=JSON.parse(await fs.readFile(cfgPath,'utf8'))
const mode=process.argv[2]||'probe'

async function request(url,options={}){
  const res=await fetch(url,{...options,headers:{'xi-api-key':apiKey,...(options.headers||{})}})
  const text=await res.text()
  let data=null
  try{data=text?JSON.parse(text):null}catch{}
  if(!res.ok) throw new Error((data&&((data.error_message)||(data.message)||(data.error)))||('HTTP '+res.status+' '+url))
  return data
}
async function poll(taskId){
  const started=Date.now()
  while(Date.now()-started<420000){
    const data=await request(base+'/v1/task/'+encodeURIComponent(taskId))
    if(data?.status==='done') return data
    if(['error','failed'].includes(data?.status)||data?.error_message) throw new Error(data?.error_message||('AI33 task '+taskId+' failed'))
    await sleep(2500)
  }
  throw new Error('Timed out waiting for AI33 task '+taskId)
}
function findUrl(obj){
  const preferred=['audio_url','output_uri','output_url','url']
  for(const key of preferred) if(typeof obj?.[key]==='string' && /^https?:/.test(obj[key])) return obj[key]
  if(!obj||typeof obj!=='object') return null
  for(const value of Object.values(obj)){
    if(Array.isArray(value)){
      for(const item of value){const found=findUrl(item); if(found) return found}
    }else if(value&&typeof value==='object'){
      const found=findUrl(value); if(found) return found
    }
  }
  return null
}
async function download(url,file){
  const res=await fetch(url)
  if(!res.ok) throw new Error('Download failed '+res.status+' '+url)
  await fs.writeFile(file,Buffer.from(await res.arrayBuffer()))
}
async function createJson(endpoint,payload){
  const data=await request(base+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
  if(!data?.task_id) throw new Error(endpoint+' returned no task_id')
  return data.task_id
}
async function credits(){
  return request(base+'/v1/credits')
}
async function probe(){
  const result={checked_at:new Date().toISOString(),health:null,credits:null,voices:null,image_models:null}
  result.health=await request(base+'/v1/health-check')
  result.credits=await credits()
  result.voices=await request(base+'/v3/voices?provider=elevenlabs&page=1&page_size=12&search=narration')
  result.image_models=await request(base+'/v1i/models')
  await fs.writeFile(path.join(generatedDir,'ai33-probe.json'),JSON.stringify(result,null,2))
  console.log(JSON.stringify({ok:true,health:result.health,credits:result.credits,voice_count:result.voices?.data?.length??null,image_model_count:Array.isArray(result.image_models)?result.image_models.length:(result.image_models?.data?.length??null)},null,2))
}
async function voice(){
  const form=new FormData()
  form.append('text',cfg.narration.text)
  form.append('voice_id',cfg.voice.voice_id)
  form.append('speed',String(cfg.voice.speed))
  form.append('with_transcript','true')
  const created=await request(base+'/v3/text-to-speech',{method:'POST',body:form})
  if(!created?.task_id) throw new Error('TTS returned no task_id')
  const task=await poll(created.task_id)
  const url=findUrl(task?.metadata)
  if(!url) throw new Error('TTS completed without audio URL')
  await download(url,path.join(outDir,'narration.mp3'))
  await fs.writeFile(path.join(generatedDir,'ai33-voice-receipt.json'),JSON.stringify({task_id:created.task_id,metadata:task.metadata},null,2))
  console.log(JSON.stringify({ok:true,type:'voice',task_id:created.task_id,audio:'public/video-audio/narration.mp3'},null,2))
}
async function sfx(){
  const receipts=[]
  for(const item of cfg.sound_effects){
    const taskId=await createJson('/v1/task/sound-effect',{text:item.text,duration_seconds:item.duration_seconds,prompt_influence:item.prompt_influence,loop:false,model_id:'eleven_text_to_sound_v2'})
    const task=await poll(taskId)
    const url=findUrl(task?.metadata)||findUrl(task)
    if(!url) throw new Error('SFX '+item.id+' completed without audio URL')
    const file='sfx-'+item.id+'.mp3'
    await download(url,path.join(outDir,file))
    receipts.push({id:item.id,task_id:taskId,file,credit_cost:task.credit_cost??null})
    console.log('AI33 SFX ready:',item.id)
  }
  await fs.writeFile(path.join(generatedDir,'ai33-sfx-receipts.json'),JSON.stringify(receipts,null,2))
  console.log(JSON.stringify({ok:true,type:'sfx',count:receipts.length},null,2))
}
async function music(){
  const m=cfg.music
  const taskId=await createJson('/v1m/task/music-generation',{title:m.title,model:m.model,generation_type:1,idea:m.idea,lyrics:'',n:m.n,rewrite_idea_switch:false,instrumental:true})
  const task=await poll(taskId)
  const url=findUrl(task?.metadata)||findUrl(task)
  if(!url) throw new Error('Music completed without audio URL')
  await download(url,path.join(outDir,'score.mp3'))
  await fs.writeFile(path.join(generatedDir,'ai33-music-receipt.json'),JSON.stringify({task_id:taskId,credit_cost:task.credit_cost??null,metadata:task.metadata},null,2))
  console.log(JSON.stringify({ok:true,type:'music',task_id:taskId,audio:'public/video-audio/score.mp3'},null,2))
}
async function main(){
  if(mode==='probe') return probe()
  if(mode==='voice') return voice()
  if(mode==='sfx') return sfx()
  if(mode==='music') return music()
  if(mode==='pack'){await probe(); await voice(); await sfx(); await music(); return}
  throw new Error('Usage: node video/scripts/ai33-media-pack.mjs [probe|voice|sfx|music|pack]')
}
main().catch(e=>{console.error('AI33_MEDIA_ERROR:',e.message);process.exit(1)})
