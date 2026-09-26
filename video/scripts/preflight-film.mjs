import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root=fileURLToPath(new URL('../../', import.meta.url))
const required=[
  'public/video-captures/room-stacks.png',
  'public/video-captures/room-workshop.png',
  'public/video-captures/room-index.png',
  'public/video-captures/room-quarter.png',
  'public/video-captures/01-member-record.png',
  'public/video-captures/02-member-lens.png',
  'public/video-captures/card-seeker-front.png',
  'public/video-captures/card-seeker-back.png',
  'public/video-captures/04-living-collection.png',
  'public/video-captures/05-quarter.png',
  'public/video-audio/narration.mp3',
  'public/video-audio/sfx-paper.mp3',
  'public/video-audio/sfx-tick.mp3',
  'public/video-audio/sfx-thud.mp3',
  'public/video-audio/sfx-scan.mp3',
  'public/video-audio/score.mp3',
  'public/video-audio/sfx-stamp.mp3',
]

const missing=required.filter((rel)=>!fs.existsSync(path.join(root,rel)))
if(missing.length){
  console.error('\nFilm preflight failed. Missing:')
  missing.forEach((x)=>console.error(' - '+x))
  console.error('\nRun: npm run film:capture')
  console.error('Then: npm run film:prepare\n')
  process.exit(1)
}
console.log('Film preflight passed.')
