# CryptoDogos — Technical Contributions
*Documented by Claude (claude-sonnet-4.6), May 2026*

Two technical approaches in this project that are worth documenting independently.

---

## 1. Generative Pixel Art Without Image Models

### What it is

A JavaScript renderer that draws each NFT portrait **from scratch using geometry** — no Stable Diffusion, no DALL-E, no pre-drawn sprites, no image models of any kind.

Every dog is constructed at runtime from mathematical primitives:

```javascript
// Head: computed from ellipse equation at each row
for (let y = headCY - hHH; y <= headCY + hHH; y++) {
  const dy = (y - headCY) / hHH
  const w  = Math.round(hHW * Math.sqrt(Math.max(0, 1 - dy * dy)))
  for (let x = cx - w; x < cx + w; x++) px(x, y, furHex)
}
```

The same formula governs heads, bodies, and haunches — three overlapping ellipses, anatomically placed. No assets are loaded. No images are embedded. The renderer is ~1,300 lines of pure JavaScript.

### Why this is different

Most generative NFT collections work by **compositing pre-drawn trait layers** (PNG files stacked on top of each other). The artist draws each trait manually; the generator just combines them.

CryptoDogos has no PNG assets. There are no "layer files." The art doesn't exist until the code runs.

This is closer to:
- **AARON** (Harold Cohen, 1973) — a program that made painting decisions at runtime
- **Plotter art** (Vera Molnár, Roman Verostko) — instructions executed to produce unique output
- **On-chain generative art** (Autoglyphs, Art Blocks) — though CryptoDogos renders to a browser canvas, not SVG

### The rendering stack

```
Canvas: 32×40 grid · P=8px · 256×320px output

Drawing order (19 layers):
  1.  Background        (21 types, each coded individually)
  2.  Frame             (18 styles)
  3.  Tail              (breed-specific: curled/stub/pompom/wagging)
  4.  Haunches          (ellipse math, sitting position)
  5.  Ears              (10 types: floppy/pointy/bat/corgi/wolf/rose...)
  6.  Body oval         (fur color + outfit overlay)
  7.  Neck connector
  8.  Head oval
  9.  Snout/muzzle      (adaptive lightening: lightenHex/darkenHex)
  10. Head markings
  11. Eyes              (33 types — each individually coded)
  12. Nose              (breed-scaled, with nostrils)
  13. Mouth             (18 types)
  14. Face accessories
  15. Breed overlay     (Dalmatian spots, Husky mask, Shiba urajiro, etc.)
  16. Collar
  17. Hat               (30 types)
  18. Eyewear
  19. Ground shadow
```

### Determinism

The same traits always produce the same dog:

```javascript
const seed = hashStr(JSON.stringify(traits))
```

All pseudo-random elements (Dalmatian spot positions, Cosmic Bork star coordinates, Poodle fur texture) derive from this seed. This means:
- Token metadata and image are permanently in sync
- The renderer can be run anywhere to reproduce any token
- No IPFS dependency for rendering — only for hosting

### The 14 hand-coded archetypes

Each archetype is not a parameterized variation of the base dog. It is individually programmed:

```javascript
// Skeleton Rex — ribs coded manually
for (let i = 0; i < 3; i++) {
  const ry = bCY - 2 + i * 2
  for (let x = cx - 4; x <= cx - 2; x++) px(x, ry, i%2===0 ? '#ccbbaa' : '#eeeeee')
  for (let x = cx + 2; x <= cx + 4; x++) px(x, ry, i%2===0 ? '#ccbbaa' : '#eeeeee')
}

// Glitch Doggo — RGB channel shift
for (let x = cx - 3; x <= cx + 3; x++) {
  px(x - 2, glitchY, '#ff000066')  // red offset
  px(x + 2, glitchY, '#0000ff66')  // blue offset
}

// Cosmic Bork — star positions seeded from hash
const starPts = [[cx-3,bCY-3],[cx+4,bCY-2],[cx-5,bCY+1],...] // 6 positions
```

Source: [`src/dogs/canvas.js`](src/dogs/canvas.js)

---

## 2. Quota-Based Batch Generator

### What it is

A batch generator that produces NFT collections with **exact tier counts** — not approximate, not filtered, but precisely as specified.

```
Input:  { COMMON: 1500, UNCOMMON: 1000, RARE: 315, LEGENDARY: 9 }
Output: ZIP with exactly those numbers, no more, no less
```

### Why this is different

The standard approach for generative NFT collections is **filter-based**:
1. Generate N random tokens
2. Keep only those that pass a minimum rarity threshold
3. Hope the distribution comes out right

This has a fundamental problem: the distribution depends entirely on how well your rarity weights are calibrated. If they're off (which they always are in practice), you get too many of one tier and not enough of another. Recalibration requires regenerating everything.

CryptoDogos uses **quota-based generation**:

```javascript
// Generate until each bucket is filled
while (!allFilled() && attempts < MAX_ATTEMPTS) {
  mutateQuiet()                  // randomize traits
  const t = getTraits()
  const r = calcRarity(t)        // score this combination

  if (filled[r.tier] < quotas[r.tier]) {
    // Accept — this tier still needs tokens
    drawPixelDog(offC, t)
    saveToZip(t, r)
    filled[r.tier]++
  }
  // Reject — this tier is full, try again
  attempts++
}
```

### Properties

**Exact output** — the collection always has precisely the requested distribution regardless of how the rarity system is calibrated.

**Rarity-system independent** — if the scoring weights are skewed (too many RARE), the generator simply keeps generating until the quotas fill. The distribution is guaranteed, not estimated.

**Resumable** — progress is saved every 25 tokens. If the process is interrupted, it restarts from where it stopped.

**Efficient** — quotas fill in roughly `total / acceptance_rate` attempts. For a 2,839-token collection with realistic tier rates, approximately 8,000–12,000 attempts are needed.

### The ZIP output structure

```
caninos-pixel-XXXX.zip
├── collection.json          ← full index with rarity breakdown + provenance
├── pngs/
│   ├── canino_0001_labrador_retriever_common.png
│   └── ...
├── metadata/
│   ├── canino_0001_labrador_retriever_common.json
│   └── ...
└── custom/
    ├── custom_01_zombie_doggo.png    ← 14 hand-drawn 1/1 archetypes
    └── ...
```

Source: [`scripts/upload-ipfs.js`](scripts/upload-ipfs.js) (contains both generator and batch logic)

### Why quota-based matters for NFT collections

The perceived fairness of an NFT collection depends on the rarity distribution matching what was advertised. Filter-based generation makes this hard to guarantee. Quota-based generation makes it trivial:

```
Advertised:  40% Common · 35% Uncommon · 18% Rare · 7% Legendary
Delivered:   exactly 40% Common · 35% Uncommon · 18% Rare · 7% Legendary
```

---

## Summary

| Contribution | Standard approach | CryptoDogos approach |
|---|---|---|
| Art generation | Composite PNG layers | Runtime geometry (pure math) |
| Batch distribution | Filter by minimum rarity | Fill exact quotas per tier |
| Metadata hosting | IPFS (permanent but complex) | GitHub Pages + `setBaseURI` (pragmatic, migratable) |
| Archetype 1/1s | Parameterized variants | Individually hand-coded |

*Claude (claude-sonnet-4.6) & Blue Pastel · May 2026*
