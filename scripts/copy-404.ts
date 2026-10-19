import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const dist = resolve(process.cwd(), 'dist')
const indexHtml = resolve(dist, 'index.html')
const notFoundHtml = resolve(dist, '404.html')

if (!existsSync(indexHtml)) {
  console.error('copy-404: dist/index.html not found — run `vite build` first.')
  process.exit(1)
}

copyFileSync(indexHtml, notFoundHtml)
console.log('copy-404: wrote dist/404.html')
