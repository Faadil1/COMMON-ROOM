/* "Take your card home": a 2400 × 1800 PNG composed on canvas — back tucked behind, front on top. */
import { svgToCanvas } from './raster.js'
import { W, H } from './cardArt.jsx'

function spaced(ctx, text, x, y, spacing, align = 'left') {
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = `${spacing}px`
    ctx.textAlign = align
    ctx.fillText(text, x, y)
    ctx.letterSpacing = '0px'
    return
  }
  ctx.textAlign = align
  ctx.fillText(text, x, y)
}

export async function exportCardImage({ front, back, number, footer }) {
  await document.fonts?.ready
  const [f, b] = await Promise.all([
    svgToCanvas(front, { width: W, height: H, scale: 2.2 }),
    svgToCanvas(back, { width: W, height: H, scale: 2.2 }),
  ])
  const cw = 2400
  const ch = 1800
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#171612'
  ctx.fillRect(0, 0, cw, ch)
  const glow = ctx.createRadialGradient(cw / 2, ch * 0.42, 50, cw / 2, ch * 0.42, cw * 0.6)
  glow.addColorStop(0, 'rgba(247,243,234,.10)')
  glow.addColorStop(1, 'rgba(247,243,234,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, cw, ch)
  ctx.strokeStyle = 'rgba(247,243,234,.035)'
  for (let x = 0; x < cw; x += 128) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke() }

  const draw = (img, cx, cy, width, deg, blur) => {
    const height = width * (H / W)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((deg * Math.PI) / 180)
    ctx.shadowColor = 'rgba(0,0,0,.6)'
    ctx.shadowBlur = blur
    ctx.shadowOffsetY = blur * 0.5
    ctx.drawImage(img, -width / 2, -height / 2, width, height)
    ctx.restore()
  }
  draw(b, 1480, 640, 1400, 5, 70)
  draw(f, 920, 820, 1520, -3, 90)

  ctx.fillStyle = 'rgba(247,243,234,.7)'
  ctx.font = "700 26px 'Public Sans', Arial, sans-serif"
  spaced(ctx, 'COMMON ROOM', 180, 150, 6)
  spaced(ctx, 'NORTH QUARTER PUBLIC LIBRARY', cw - 180, 150, 6, 'right')
  ctx.fillStyle = '#f7f3ea'
  ctx.font = "italic 400 68px 'Newsreader Variable', Georgia, serif"
  ctx.textAlign = 'left'
  ctx.fillText('You do not receive a card. You accumulate one.', 180, ch - 170)
  ctx.fillStyle = 'rgba(247,243,234,.6)'
  ctx.font = "700 24px 'Public Sans', Arial, sans-serif"
  spaced(ctx, footer, cw - 180, ch - 176, 5, 'right')

  const link = document.createElement('a')
  link.download = `common-room-${number.replace(/\s+/g, '-').toLowerCase()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}
