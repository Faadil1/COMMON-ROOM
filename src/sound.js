/* Library sounds, synthesised (no audio files). Off by default; the visitor turns them on. */
const KEY = 'common-room-sound'
let ctx = null
let enabled = false
try { enabled = localStorage.getItem(KEY) === 'on' } catch { /* storage unavailable */ }
const listeners = new Set()

export const soundEnabled = () => enabled
export function setSoundEnabled(on) {
  enabled = on
  try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* ignore */ }
  listeners.forEach((fn) => fn(on))
  if (on) play('mark')
}
export function onSoundChange(fn) { listeners.add(fn); return () => listeners.delete(fn) }

function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function noise(ac, seconds) {
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * seconds), ac.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < data.length; i += 1) { last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.04; data[i] = last * 3.5 }
  const src = ac.createBufferSource()
  src.buffer = buffer
  return src
}

function burst(ac, { at, dur, type, freq, q = 1, gain, sweepTo }) {
  const src = noise(ac, dur)
  const filter = ac.createBiquadFilter()
  filter.type = type
  filter.frequency.setValueAtTime(freq, at)
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, at + dur)
  filter.Q.value = q
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  src.connect(filter).connect(g).connect(ac.destination)
  src.start(at)
  src.stop(at + dur + 0.02)
}

function thump(ac, { at, from, to, dur, gain }) {
  const osc = ac.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(from, at)
  osc.frequency.exponentialRampToValueAtTime(to, at + dur)
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + 0.006)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(g).connect(ac.destination)
  osc.start(at)
  osc.stop(at + dur + 0.02)
}

const PRESETS = {
  mark: (ac, t) => { burst(ac, { at: t, dur: 0.05, type: 'highpass', freq: 2400, gain: 0.25 }); thump(ac, { at: t, from: 900, to: 500, dur: 0.05, gain: 0.08 }) },
  pencil: (ac, t) => { burst(ac, { at: t, dur: 0.32, type: 'bandpass', freq: 3200, q: 2, gain: 0.12, sweepTo: 4200 }) },
  paper: (ac, t) => { burst(ac, { at: t, dur: 0.28, type: 'bandpass', freq: 1200, q: 0.8, gain: 0.3, sweepTo: 4000 }) },
  drawer: (ac, t) => { burst(ac, { at: t, dur: 0.34, type: 'lowpass', freq: 700, gain: 0.5, sweepTo: 300 }); thump(ac, { at: t + 0.3, from: 180, to: 90, dur: 0.1, gain: 0.25 }) },
  press: (ac, t) => { thump(ac, { at: t, from: 120, to: 45, dur: 0.25, gain: 0.7 }); burst(ac, { at: t, dur: 0.12, type: 'lowpass', freq: 900, gain: 0.35 }) },
  stamp: (ac, t) => { thump(ac, { at: t, from: 95, to: 42, dur: 0.22, gain: 0.8 }); burst(ac, { at: t, dur: 0.09, type: 'lowpass', freq: 1400, gain: 0.5 }) },
  pin: (ac, t) => { thump(ac, { at: t, from: 1400, to: 700, dur: 0.06, gain: 0.12 }); burst(ac, { at: t, dur: 0.04, type: 'highpass', freq: 3000, gain: 0.15 }) },
}

export function play(name) {
  if (!enabled || !PRESETS[name]) return
  try { const ac = audio(); PRESETS[name](ac, ac.currentTime + 0.01) } catch { /* audio unavailable */ }
}
