// GET /card/<code> — the single-page app, with per-card preview tags for link unfurls.
import { describeCard } from '../../server/og.jsx'

const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export async function onRequestGet({ request, params, env }) {
  const page = await env.ASSETS.fetch(new URL('/', request.url))
  const info = describeCard(String(params.code || ''))
  if (!info) return page
  const url = new URL(request.url)
  const image = `${url.origin}/og/${params.code}.png`
  const tags = [
    ['property', 'og:type', 'website'],
    ['property', 'og:site_name', 'COMMON ROOM — North Quarter Public Library'],
    ['property', 'og:title', info.title],
    ['property', 'og:description', info.description],
    ['property', 'og:url', url.href],
    ['property', 'og:image', image],
    ['property', 'og:image:width', '1200'],
    ['property', 'og:image:height', '630'],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', info.title],
    ['name', 'twitter:description', info.description],
    ['name', 'twitter:image', image],
  ].map(([attr, key, value]) => `<meta ${attr}="${key}" content="${esc(value)}">`).join('')
  return new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(info.title) } })
    .on('head', { element(el) { el.append(tags, { html: true }) } })
    .transform(new Response(page.body, page))
}
