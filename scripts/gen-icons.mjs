// Generates PWA icons: 192x192, 512x512, 180x180 (apple-touch)
import { createCanvas } from '@napi-rs/canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '../public')
mkdirSync(join(publicDir, 'icons'), { recursive: true })

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background — indigo gradient
  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, '#6366f1')   // indigo-500
  grad.addColorStop(1, '#7c3aed')   // violet-600
  ctx.fillStyle = grad
  const r = size * 0.18
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fill()

  // Letter W — clean white
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.round(size * 0.52)}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('W', size / 2, size / 2 + size * 0.03)

  return canvas.toBuffer('image/png')
}

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32.png', size: 32 },
]

for (const { name, size } of sizes) {
  const buf = drawIcon(size)
  writeFileSync(join(publicDir, 'icons', name), buf)
  console.log(`✓ icons/${name}`)
}

// Also write 32px favicon to public root
writeFileSync(join(publicDir, 'favicon.png'), drawIcon(32))
console.log('✓ favicon.png')
console.log('\nAll icons generated.')
