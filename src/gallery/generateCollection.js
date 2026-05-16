// Deterministic generation of all 2825 CryptoDogos
// Same seed → same dog, every time. Gallery is reproducible.
import { traitsData, calcRarity, ARCHETYPE_SKINS } from '../dogs/traits.js'

// Fast xorshift32 — deterministic, no dependencies
function xorshift(seed) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5
    return (s >>> 0) / 0xffffffff
  }
}

const DATA_TO_KEY = [
  ['hats','hat'], ['glasses','glasses'], ['beards','beard'],
  ['body','body'], ['chains','chain'], ['frames','frame'],
  ['faceShapes','faceShape'], ['skins','skin'], ['eyes','eye'],
  ['mouths','mouth'], ['hairs','hair'], ['accessories','accessory'],
  ['backgrounds','bg'], ['palettes','palette'],
]

const REAL_BREED_COUNT = 20

function generateDog(id) {
  const rng = xorshift(id * 2654435761 + 0xdeadbeef)

  const t = {}

  // Breed — 5% archetype bias (matches batch generator)
  const breeds = traitsData.types
  if (rng() < 0.05 && breeds.length > REAL_BREED_COUNT) {
    t.type = breeds[REAL_BREED_COUNT + Math.floor(rng() * (breeds.length - REAL_BREED_COUNT))]
  } else {
    t.type = breeds[Math.floor(rng() * REAL_BREED_COUNT)]
  }

  // All other traits
  DATA_TO_KEY.forEach(([dataKey, traitKey]) => {
    const arr = traitsData[dataKey]
    t[traitKey] = arr[Math.floor(rng() * arr.length)]
  })

  // Bias: hat & collar lean toward None (matches batch generator)
  if (rng() < 0.32) t.hat   = traitsData.hats[0]
  if (rng() < 0.22) t.chain = traitsData.chains[0]

  return t
}

// ── Lazy-cached collection ─────────────────────────────────
let _dogs   = null
let _custom = null

export function getAllDogs() {
  if (_dogs) return _dogs
  _dogs = Array.from({ length: 2825 }, (_, i) => {
    const id     = i + 1
    const traits = generateDog(id)
    const rarity = calcRarity(traits)
    return { id, traits, rarity, custom: false }
  })
  return _dogs
}

export function getCustoms() {
  if (_custom) return _custom
  const archetypes = Object.keys(ARCHETYPE_SKINS)
  _custom = archetypes.map((name, i) => {
    const rng = xorshift((i + 1) * 987654321)
    const t   = {}
    t.type = name
    DATA_TO_KEY.forEach(([dataKey, traitKey]) => {
      const arr = traitsData[dataKey]
      t[traitKey] = arr[Math.floor(rng() * arr.length)]
    })
    return {
      id:       `C${String(i + 1).padStart(2, '0')}`,
      traits:   t,
      rarity:   { tier: 'LEGENDARY', score: 27, max: 27, color: '#ffe600' },
      custom:   true,
      archetype: name,
    }
  })
  return _custom
}

// ── Filter helpers ─────────────────────────────────────────
export function filterDogs(dogs, { tier, breed, search }) {
  return dogs.filter(d => {
    if (tier   && tier   !== 'ALL' && d.rarity.tier !== tier)               return false
    if (breed  && breed  !== 'ALL' && d.traits.type !== breed)              return false
    if (search && !d.traits.type.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
}

export const ALL_BREEDS = ['ALL', ...Object.keys(
  Object.fromEntries(traitsData.types.map(t => [t, 1]))
)]
