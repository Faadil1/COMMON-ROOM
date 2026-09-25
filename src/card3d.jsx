import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { svgToCanvas } from './raster.js'
import { play } from './sound.js'
import {
  W, H, CODE_ORDER, HOLE_R, TOP_Y, BOT_Y, holeX, notchCode,
  CardFront, CardBack, StampSheet, FoilMask, stampInk,
} from './cardArt.jsx'

/* ACCESSION IN 3D
   The SVG card stays the single source of truth: it is rasterised into textures and
   wrapped around a real die-cut plate. Notches are cut through the board, gilt catches
   the light, the strata are real sheets beneath, and the stamp is pressed into the card. */

const S = 0.01 // svg px → world units
const DEPTH = 5
const STAMP_C = { x: 418, y: 104 }

const FAMILY_SURFACE = {
  reader: { roughness: 0.78, clearcoat: 0, edge: '#5a211e' },
  maker: { roughness: 0.9, clearcoat: 0, edge: '#b98f5c' },
  seeker: { roughness: 0.42, clearcoat: 0.35, edge: '#d9dee6' },
  local: { roughness: 0.55, clearcoat: 0.25, edge: '#e8dfca' },
}
const ACCENT = { reader: '#7a2e2a', maker: '#c8372a', seeker: '#1c4077', local: '#2b5540' }

function arcPoints(cx, cy, r, a0, a1, n = 10) {
  const pts = []
  for (let i = 0; i <= n; i += 1) {
    const a = a0 + ((a1 - a0) * i) / n
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return pts
}

// Outline in SVG coordinates (y down), then flipped into three's y-up space.
function cardShape({ actions, secrets, number, mirror = false, withHoles = true }) {
  const r = 30
  const have = new Set([...actions, ...secrets.map((id) => `s:${id}`)])
  const topNotched = CODE_ORDER.map((id) => have.has(id))
  const bits = notchCode(number)
  const pts = []
  const push = (list) => list.forEach((p) => pts.push(p))

  push(arcPoints(r, r, r, Math.PI, Math.PI * 1.5, 8))
  CODE_ORDER.forEach((_, i) => {
    if (!topNotched[i] || !withHoles) return
    const x = holeX(i)
    pts.push([x - HOLE_R, 0], [x - HOLE_R, TOP_Y])
    push(arcPoints(x, TOP_Y, HOLE_R, Math.PI, 0, 8))
    pts.push([x + HOLE_R, 0])
  })
  push(arcPoints(W - r, r, r, -Math.PI / 2, 0, 8))
  push(arcPoints(W - r, H - r, r, 0, Math.PI / 2, 8))
  for (let i = 13; i >= 0; i -= 1) {
    if (!bits[i] || !withHoles) continue
    const x = holeX(i + 1)
    pts.push([x + HOLE_R, H], [x + HOLE_R, BOT_Y])
    push(arcPoints(x, BOT_Y, HOLE_R, 0, -Math.PI, 8))
    pts.push([x - HOLE_R, H])
  }
  push(arcPoints(r, H - r, r, Math.PI / 2, Math.PI, 8))

  const map = ([x, y]) => new THREE.Vector2(mirror ? W - x : x, H - y)
  const shape = new THREE.Shape(pts.map(map))
  if (withHoles) {
    const circle = (cx, cy) => {
      const path = new THREE.Path(arcPoints(cx, cy, HOLE_R, 0, Math.PI * 2, 16).map(map))
      shape.holes.push(path)
    }
    CODE_ORDER.forEach((_, i) => { if (!topNotched[i]) circle(holeX(i), TOP_Y) })
    for (let i = 0; i < 14; i += 1) if (!bits[i]) circle(holeX(i + 1), BOT_Y)
  }
  return shape
}

function rasterise(host, pr) {
  const svg = host.querySelector('svg')
  return svgToCanvas(svg, { width: W, height: H, scale: pr })
}

function maskToMaps(maskCanvas) {
  const w = maskCanvas.width
  const h = maskCanvas.height
  const src = maskCanvas.getContext('2d').getImageData(0, 0, w, h)
  const metal = document.createElement('canvas')
  const rough = document.createElement('canvas')
  metal.width = rough.width = w
  metal.height = rough.height = h
  const m = metal.getContext('2d').createImageData(w, h)
  const r = rough.getContext('2d').createImageData(w, h)
  for (let i = 0; i < src.data.length; i += 4) {
    const v = src.data[i] / 255
    const mv = Math.round(v * 255)
    const rv = Math.round((1 - v * 0.72) * 255)
    m.data[i] = m.data[i + 1] = m.data[i + 2] = mv; m.data[i + 3] = 255
    r.data[i] = r.data[i + 1] = r.data[i + 2] = rv; r.data[i + 3] = 255
  }
  metal.getContext('2d').putImageData(m, 0, 0)
  rough.getContext('2d').putImageData(r, 0, 0)
  return { metal, rough }
}

function texture(canvas, renderer, srgb = true) {
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  t.anisotropy = renderer.capabilities.getMaxAnisotropy()
  t.repeat.set(1 / W, 1 / H)
  t.needsUpdate = true
  return t
}

export function canUse3D() {
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function Card3D({ family, record, owner, entries, ceremony, fallback }) {
  const hostRef = useRef(null)
  const canvasWrapRef = useRef(null)
  const sheetsRef = useRef(null)
  const apiRef = useRef({})
  const [ready, setReady] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const key = `${family}|${record.actions.join(',')}|${record.secrets.join(',')}|${owner.name}|${record.signature.length}|${owner.number}`

  useEffect(() => {
    let disposed = false
    let frame = 0
    const wrap = canvasWrapRef.current
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.NeutralToneMapping ?? THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.92
    wrap.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environmentIntensity = 0.55
    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100)
    camera.position.set(0, 0, 21)

    scene.add(new THREE.HemisphereLight('#fff4e0', '#2a2620', 0.35))
    const key = new THREE.DirectionalLight('#fff1dc', 1.25)
    key.position.set(-4, 6, 9)
    scene.add(key)
    const glint = new THREE.PointLight('#ffe6b8', 18, 30, 1.6)
    glint.position.set(2, 2, 7)
    scene.add(glint)

    const pivot = new THREE.Group()
    scene.add(pivot)
    const card = new THREE.Group()
    card.position.set((-W / 2) * S, (-H / 2) * S, 0)
    card.scale.set(S, S, S)
    pivot.add(card)

    // Contact shadow
    const shadowCanvas = document.createElement('canvas')
    shadowCanvas.width = shadowCanvas.height = 256
    const sctx = shadowCanvas.getContext('2d')
    const grad = sctx.createRadialGradient(128, 128, 10, 128, 128, 128)
    grad.addColorStop(0, 'rgba(0,0,0,.55)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    sctx.fillStyle = grad
    sctx.fillRect(0, 0, 256, 256)
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(W * S * 1.25, H * S * 1.3), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }))
    shadow.position.set(0.35, -0.55, -2.2)
    scene.add(shadow)

    const resize = () => {
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      const fitH = (H * S * 1.32) / 2 / Math.tan((camera.fov * Math.PI) / 360)
      const fitW = (W * S * 1.22) / 2 / Math.tan((camera.fov * Math.PI) / 360) / camera.aspect
      camera.position.z = Math.max(fitH, fitW)
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()

    // Interaction state
    const state = { yaw: -0.18, pitch: 0.08, tYaw: -0.18, tPitch: 0.08, flip: 0, tFlip: 0, spread: 0, tSpread: 0, drag: null, moved: 0, px: 0, py: 0, dip: 0, stampT: 1, visible: true }
    apiRef.current.flip = () => { state.tFlip = state.tFlip ? 0 : Math.PI; setFlipped(Boolean(state.tFlip)); play('paper') }
    apiRef.current.land = () => { state.stampT = 0 }

    const onDown = (e) => { state.drag = { x: e.clientX, y: e.clientY, yaw: state.tYaw, pitch: state.tPitch }; state.moved = 0; wrap.setPointerCapture?.(e.pointerId) }
    const onMove = (e) => {
      const r = wrap.getBoundingClientRect()
      state.px = ((e.clientX - r.left) / r.width) * 2 - 1
      state.py = ((e.clientY - r.top) / r.height) * 2 - 1
      state.tSpread = 1
      if (!state.drag) return
      const dx = e.clientX - state.drag.x
      const dy = e.clientY - state.drag.y
      state.moved = Math.max(state.moved, Math.abs(dx) + Math.abs(dy))
      state.tYaw = state.drag.yaw + dx * 0.008
      state.tPitch = Math.max(-0.7, Math.min(0.7, state.drag.pitch + dy * 0.006))
    }
    const onUp = () => {
      if (state.drag && state.moved < 6) apiRef.current.flip()
      state.drag = null
      state.tYaw = Math.max(-0.9, Math.min(0.9, state.tYaw))
    }
    const onLeave = () => { state.tSpread = 0; state.px = 0; state.py = 0; if (!state.drag) { state.tYaw = -0.18; state.tPitch = 0.08 } }
    wrap.addEventListener('pointerdown', onDown)
    wrap.addEventListener('pointermove', onMove)
    wrap.addEventListener('pointerup', onUp)
    wrap.addEventListener('pointercancel', onUp)
    wrap.addEventListener('pointerleave', onLeave)
    const io = new IntersectionObserver(([entry]) => { state.visible = entry.isIntersecting })
    io.observe(wrap)

    let stampPivot = null
    let stampMat = null
    const strata = []

    const build = async () => {
      const host = hostRef.current
      if (!host || disposed) return
      const pr = window.innerWidth < 700 ? 1.6 : 2.4
      const [front, back, foil, stampC] = await Promise.all([
        rasterise(host.querySelector('[data-t="front"]'), pr),
        rasterise(host.querySelector('[data-t="back"]'), pr),
        rasterise(host.querySelector('[data-t="foil"]'), 1),
        rasterise(host.querySelector('[data-t="stamp"]'), pr),
      ])
      if (disposed) return
      const { metal, rough } = maskToMaps(foil)
      const surface = FAMILY_SURFACE[family]

      const frontShape = cardShape({ ...record, number: owner.number })
      const backShape = cardShape({ ...record, number: owner.number, mirror: true })

      const body = new THREE.Mesh(
        new THREE.ExtrudeGeometry(frontShape, { depth: DEPTH, bevelEnabled: false, curveSegments: 12 }),
        new THREE.MeshStandardMaterial({ color: surface.edge, roughness: 0.9 }),
      )
      card.add(body)

      const frontMat = new THREE.MeshPhysicalMaterial({
        map: texture(front, renderer),
        metalnessMap: texture(metal, renderer, false),
        roughnessMap: texture(rough, renderer, false),
        metalness: 1,
        roughness: surface.roughness,
        clearcoat: surface.clearcoat,
        clearcoatRoughness: 0.35,
        envMapIntensity: 1.6,
      })
      const frontMesh = new THREE.Mesh(new THREE.ShapeGeometry(frontShape, 12), frontMat)
      frontMesh.position.z = DEPTH + 0.06
      card.add(frontMesh)

      const backMat = new THREE.MeshPhysicalMaterial({ map: texture(back, renderer), roughness: 0.85, metalness: 0 })
      const backMesh = new THREE.Mesh(new THREE.ShapeGeometry(backShape, 12), backMat)
      backMesh.rotation.y = Math.PI
      backMesh.position.set(W, 0, -0.06)
      card.add(backMesh)

      // Accession strata: one real sheet per recent mark, under the card.
      const layers = [...record.actions.slice(-4), ...record.secrets.slice(-1).map((id) => `s:${id}`)]
      const plain = cardShape({ actions: [], secrets: [], number: owner.number, withHoles: false })
      layers.forEach((id, i) => {
        const fam = id.startsWith('s:') ? 'secret' : id.startsWith('stacks') ? 'reader' : id.startsWith('workshop') ? 'maker' : id.startsWith('index') ? 'seeker' : 'local'
        const color = fam === 'secret' ? '#c9a24e' : ACCENT[fam]
        const sheet = new THREE.Mesh(
          new THREE.ExtrudeGeometry(plain, { depth: 1.6, bevelEnabled: false, curveSegments: 8 }),
          new THREE.MeshPhysicalMaterial({ color, roughness: 0.7, metalness: fam === 'secret' ? 0.7 : 0 }),
        )
        sheet.userData.index = i + 1
        card.add(sheet)
        strata.push(sheet)
      })

      // Stamp, pressed onto the face.
      stampMat = new THREE.MeshStandardMaterial({
        map: texture(stampC, renderer),
        transparent: true,
        depthWrite: false,
        roughness: 0.5,
        metalness: family === 'reader' || family === 'local' ? 0.75 : 0,
        opacity: ceremony ? 0 : 1,
      })
      const stampMesh = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([
        new THREE.Vector2(0, 0), new THREE.Vector2(W, 0), new THREE.Vector2(W, H), new THREE.Vector2(0, H),
      ])), stampMat)
      stampPivot = new THREE.Group()
      stampPivot.position.set(STAMP_C.x, H - STAMP_C.y, DEPTH + 0.12)
      stampMesh.position.set(-STAMP_C.x, -(H - STAMP_C.y), 0)
      stampPivot.add(stampMesh)
      stampPivot.visible = !ceremony
      card.add(stampPivot)

      setReady(true)
      // First visit after accession: wait for the card to settle, then press the stamp.
      if (ceremony) window.setTimeout(() => { if (!disposed) state.stampT = 0 }, 700)
    }
    build().catch((error) => console.error('3D card failed', error))

    const timer = new THREE.Timer()
    const tick = () => {
      frame = requestAnimationFrame(tick)
      if (!state.visible) return
      timer.update()
      const dt = Math.min(timer.getDelta(), 0.05)
      const t = timer.getElapsed()
      const k = 1 - Math.pow(0.001, dt)
      state.yaw += (state.tYaw + state.px * 0.18 - state.yaw) * k * 0.9
      state.pitch += (state.tPitch + state.py * 0.1 - state.pitch) * k * 0.9
      state.flip += (state.tFlip - state.flip) * k * 0.7
      state.spread += (state.tSpread - state.spread) * k * 0.5
      pivot.rotation.set(state.pitch + Math.sin(t * 0.7) * 0.015, state.yaw + state.flip + Math.sin(t * 0.5) * 0.02, Math.sin(t * 0.4) * 0.008)

      strata.forEach((sheet) => {
        const i = sheet.userData.index
        const gap = 2.2 + state.spread * 14
        sheet.position.set(i * (5 + state.spread * 4), -i * (4 + state.spread * 3), -1.6 - i * gap)
        sheet.visible = Math.abs(state.flip) < Math.PI / 2
      })

      glint.position.set(state.px * 6, -state.py * 4 + 1.5, 7)

      if (stampPivot) {
        if (state.stampT < 1) {
          state.stampT = Math.min(1, state.stampT + dt / 1.1)
          const p = state.stampT
          stampPivot.visible = true
          if (p < 0.55) {
            const q = p / 0.55
            const e = q * q
            stampPivot.position.z = DEPTH + 0.12 + (1 - e) * 220
            stampPivot.scale.setScalar(1 + (1 - e) * 0.9)
            stampPivot.rotation.z = (1 - e) * -0.35
            stampMat.opacity = 0.25 + e * 0.5
          } else {
            if (!state.stampSounded) { state.stampSounded = true; play('stamp') }
            const q = (p - 0.55) / 0.45
            stampPivot.position.z = DEPTH + 0.12
            stampPivot.scale.setScalar(1 + Math.sin(q * Math.PI) * -0.04)
            stampPivot.rotation.z = 0
            stampMat.opacity = 0.75 + q * 0.25
            state.dip = Math.sin(Math.min(1, q * 2) * Math.PI) * 0.18
          }
        } else {
          state.dip *= 0.9
        }
        card.position.z = -state.dip
      }
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      ro.disconnect()
      io.disconnect()
      wrap.removeEventListener('pointerdown', onDown)
      wrap.removeEventListener('pointermove', onMove)
      wrap.removeEventListener('pointerup', onUp)
      wrap.removeEventListener('pointercancel', onUp)
      wrap.removeEventListener('pointerleave', onLeave)
      scene.traverse((obj) => {
        obj.geometry?.dispose?.()
        const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : []
        mats.forEach((m) => { Object.values(m).forEach((v) => v?.isTexture && v.dispose()); m.dispose() })
      })
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
      setReady(false)
    }
  }, [key])


  return (
    <div className={`lc3d ${ready ? 'is-ready' : ''}`}>
      <div className="lc3d-stage" ref={canvasWrapRef} aria-label="Your library card in 3D. Drag to turn it, tap to flip it." role="img" />
      {!ready && <div className="lc3d-fallback">{fallback}</div>}
      <div className="lc3d-hint">{ready ? (flipped ? 'Drag to turn · tap for the front' : 'Drag to turn · tap to see the back') : 'Pressing your card…'}</div>
      <div className="nq-export-host" ref={hostRef} aria-hidden="true">
        <div data-t="front" style={{ width: W }}><CardFront family={family} actions={record.actions} secrets={record.secrets} owner={owner} /></div>
        <div data-t="back" style={{ width: W }}><CardBack family={family} owner={owner} entries={entries} /></div>
        <div data-t="foil" style={{ width: W }}><FoilMask family={family} /></div>
        <div data-t="stamp" style={{ width: W }}><StampSheet family={family} date={owner.issued} ink={stampInk(family)} /></div>
      </div>
    </div>
  )
}
