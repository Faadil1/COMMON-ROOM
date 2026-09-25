// Copies the TTF fonts the server-side card renderer needs into public/og-fonts.
// resvg (used by the /og image function) reads TTF/OTF, not the WOFF2 files the site uses.
import { copyFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const FILES = {
  '@expo-google-fonts/newsreader': ['Newsreader_400Regular.ttf', 'Newsreader_400Regular_Italic.ttf', 'Newsreader_500Medium.ttf', 'Newsreader_600SemiBold.ttf'],
  '@expo-google-fonts/public-sans': ['PublicSans_500Medium.ttf', 'PublicSans_600SemiBold.ttf', 'PublicSans_700Bold.ttf', 'PublicSans_800ExtraBold.ttf', 'PublicSans_900Black.ttf'],
  '@expo-google-fonts/courier-prime': ['CourierPrime_400Regular.ttf', 'CourierPrime_700Bold.ttf'],
}
const out = new URL('../public/og-fonts/', import.meta.url).pathname
mkdirSync(out, { recursive: true })
for (const [pkg, files] of Object.entries(FILES)) {
  const root = dirname(require.resolve(`${pkg}/package.json`))
  for (const file of files) {
    const found = [join(root, file), ...['400Regular', '400Regular_Italic', '500Medium', '600SemiBold', '700Bold', '800ExtraBold', '900Black'].map((d) => join(root, d, file))]
    const src = found.find((path) => { try { require('node:fs').accessSync(path); return true } catch { return false } })
    if (!src) throw new Error(`Missing font ${file} in ${pkg}`)
    copyFileSync(src, join(out, file))
  }
}
console.log('og fonts copied')
