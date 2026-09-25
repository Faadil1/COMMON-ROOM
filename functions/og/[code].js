// GET /og/<code>.png — the preview image shown when a card link is shared.
import '../../server/shim.js'
import { initWasm, Resvg } from '@resvg/resvg-wasm'
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm'
import { OG_FONTS, describeCard, cardSvg, renderPng } from '../../server/og.jsx'

let ready = null
let fonts = null

async function setup(env, url) {
  if (!ready) ready = initWasm(resvgWasm)
  if (!fonts) {
    fonts = Promise.all(OG_FONTS.map(async (file) => {
      const res = await env.ASSETS.fetch(new URL(`/og-fonts/${file}`, url))
      return new Uint8Array(await res.arrayBuffer())
    }))
  }
  await ready
  return fonts
}

export async function onRequestGet({ request, params, env, waitUntil }) {
  const cache = caches.default
  const hit = await cache.match(request)
  if (hit) return hit

  const code = String(params.code || '').replace(/\.png$/, '')
  const info = describeCard(code)
  if (!info) return new Response('Card not found', { status: 404 })

  try {
    const fontBuffers = await setup(env, request.url)
    const png = renderPng(Resvg, cardSvg(info), fontBuffers)
    const response = new Response(png, {
      headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=31536000, immutable' },
    })
    waitUntil(cache.put(request, response.clone()))
    return response
  } catch (error) {
    ready = null
    fonts = null
    return new Response(`Could not render card: ${error.message}`, { status: 500 })
  }
}
