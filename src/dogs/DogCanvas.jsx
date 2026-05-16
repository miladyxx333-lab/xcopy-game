import { useEffect, useRef } from 'react'
import { traitsData } from './traits.js'
import { drawPixelDog } from './canvas.js'

// Mapping: traitsData key → drawPixelDog trait key
const DATA_TO_KEY = {
  types:'type', hats:'hat', glasses:'glasses', beards:'beard',
  body:'body', chains:'chain', frames:'frame', faceShapes:'faceShape',
  skins:'skin', eyes:'eye', mouths:'mouth', hairs:'hair',
  accessories:'accessory', backgrounds:'bg', palettes:'palette'
}

// 5% chance of picking an archetype (same bias as the generator)
const REAL_BREED_COUNT = 20

function pickBreed() {
  const arr = traitsData.types
  if (Math.random() < 0.05 && arr.length > REAL_BREED_COUNT) {
    return arr[REAL_BREED_COUNT + Math.floor(Math.random() * (arr.length - REAL_BREED_COUNT))]
  }
  return arr[Math.floor(Math.random() * REAL_BREED_COUNT)]
}

export function randomTraits(overrides = {}) {
  const t = {}
  Object.entries(DATA_TO_KEY).forEach(([dataKey, traitKey]) => {
    const arr = traitsData[dataKey]
    t[traitKey] = arr[Math.floor(Math.random() * arr.length)]
  })
  t.type = pickBreed()
  // Bias hat / collar toward None
  if (Math.random() < 0.35) t.hat   = traitsData.hats[0]   // 'None'
  if (Math.random() < 0.25) t.chain = traitsData.chains[0] // 'None'
  return { ...t, ...overrides }
}

// ── DogCanvas component ───────────────────────────────────
// Renders one CryptoDogo on a 256×320 canvas.
// Re-renders whenever `seed` prop changes.
export default function DogCanvas({ traits, seed, scale = 1, className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const t = traits || randomTraits()
    try { drawPixelDog(canvas, t) } catch (e) { /* ignore render errors */ }
  }, [traits, seed])

  return (
    <canvas
      ref={canvasRef}
      width={256}
      height={320}
      className={className}
      style={{
        width:  256 * scale,
        height: 320 * scale,
        imageRendering: 'pixelated',
        display: 'block',
      }}
    />
  )
}
