/* Fast SVG → canvas: serialise the card SVG with its fonts embedded and draw it as an image.
   Much quicker than DOM cloning, and identical output for the 3D textures and the print PDF. */
import newsNormal from '@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2?url'
import newsItalic from '@fontsource-variable/newsreader/files/newsreader-latin-opsz-italic.woff2?url'
import sans400 from '@fontsource/public-sans/files/public-sans-latin-400-normal.woff2?url'
import sans500 from '@fontsource/public-sans/files/public-sans-latin-500-normal.woff2?url'
import sans600 from '@fontsource/public-sans/files/public-sans-latin-600-normal.woff2?url'
import sans700 from '@fontsource/public-sans/files/public-sans-latin-700-normal.woff2?url'
import sans800 from '@fontsource/public-sans/files/public-sans-latin-800-normal.woff2?url'
import sans900 from '@fontsource/public-sans/files/public-sans-latin-900-normal.woff2?url'
import mono400 from '@fontsource/courier-prime/files/courier-prime-latin-400-normal.woff2?url'
import mono700 from '@fontsource/courier-prime/files/courier-prime-latin-700-normal.woff2?url'

const FACES = [
  ['Newsreader Variable', newsNormal, 'normal', '200 800'],
  ['Newsreader Variable', newsItalic, 'italic', '200 800'],
  ['Public Sans', sans400, 'normal', '400'],
  ['Public Sans', sans500, 'normal', '500'],
  ['Public Sans', sans600, 'normal', '600'],
  ['Public Sans', sans700, 'normal', '700'],
  ['Public Sans', sans800, 'normal', '800'],
  ['Public Sans', sans900, 'normal', '900'],
  ['Courier Prime', mono400, 'normal', '400'],
  ['Courier Prime', mono700, 'normal', '700'],
]

let fontCssPromise = null

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

export function fontCss() {
  if (!fontCssPromise) {
    fontCssPromise = Promise.all(FACES.map(async ([family, url, style, weight]) => {
      const data = toBase64(await (await fetch(url)).arrayBuffer())
      return `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};src:url(data:font/woff2;base64,${data}) format('woff2');}`
    })).then((rules) => rules.join(''))
  }
  return fontCssPromise
}

export async function svgToCanvas(svg, { width, height, scale = 2, background = null, rotate180 = false }) {
  const css = await fontCss()
  const clone = svg.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  clone.removeAttribute('class')
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = css
  clone.insertBefore(style, clone.firstChild)
  const markup = new XMLSerializer().serializeToString(clone)
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    const ctx = canvas.getContext('2d')
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height) }
    if (rotate180) { ctx.translate(canvas.width, canvas.height); ctx.rotate(Math.PI) }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas
  } finally {
    URL.revokeObjectURL(url)
  }
}
