import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = fileURLToPath(new URL('../../public/video-audio/', import.meta.url))
fs.mkdirSync(dir, { recursive: true })

const SR = 48000

function writeWav(name, duration, render) {
  const n = Math.floor(SR * duration)
  const data = Buffer.alloc(n * 2)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const x = Math.max(-1, Math.min(1, render(t, duration)))
    data.writeInt16LE(Math.round(x * 32767), i * 2)
  }
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(SR, 24)
  header.writeUInt32LE(SR * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  fs.writeFileSync(path.join(dir, name), Buffer.concat([header, data]))
}

let seed = 17
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 4294967296
}

writeWav('paper.wav', .22, (t,d) => {
  const env = Math.pow(1 - t/d, 2.4)
  const noise = (rand()*2-1)
  return noise * env * .22
})

writeWav('tick.wav', .12, (t,d) => {
  const env = Math.pow(1 - t/d, 4)
  return Math.sin(2*Math.PI*1250*t) * env * .24
})

writeWav('thud.wav', .36, (t,d) => {
  const env = Math.pow(1 - t/d, 3)
  const f = 82 - 30*(t/d)
  return (Math.sin(2*Math.PI*f*t) + .28*Math.sin(2*Math.PI*f*2*t)) * env * .42
})

writeWav('scan.wav', .8, (t,d) => {
  const p=t/d
  const f=360+520*p
  const env=Math.sin(Math.PI*p)
  return (Math.sin(2*Math.PI*f*t) + .18*Math.sin(2*Math.PI*(f*1.5)*t)) * env * .11
})

writeWav('swell.wav', 1.8, (t,d) => {
  const p=t/d
  const env=Math.sin(Math.PI*p)
  const low=Math.sin(2*Math.PI*58*t)
  const air=(rand()*2-1)*.18
  return (low*.35+air)*env*.20
})

console.log('Sound design assets written to public/video-audio/')
