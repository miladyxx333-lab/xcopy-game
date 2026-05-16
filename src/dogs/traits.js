// ════════════════════════════════════════════════════════
// TRAITS — CANINOS PIXEL v3.0
// Inspired by CrypToadz: 34 breeds · 33 eyes · 18 mouths
// ════════════════════════════════════════════════════════

const traitsData = {

  // ─── BREED / ARCHETYPE (34 types — 20 real breeds + 14 custom) ───
  types: [
    // Real breeds (common-rare)
    "Labrador Retriever", "Golden Retriever", "Beagle", "French Bulldog",
    "Husky", "Poodle", "Corgi", "German Shepherd",
    "Chihuahua", "Dachshund", "Boxer", "Shiba Inu",
    "Dalmatian", "Samoyed", "Great Dane", "Border Collie",
    "Rottweiler", "Dobermann", "Chow Chow", "Dingo",
    // Custom archetypes (legendary-only, hand-drawn)
    "Zombie Doggo",    // undead decay, stitches, bone peeking
    "RoboDog 3000",   // full chrome chassis, LED eyes
    "Ghost Pupper",   // spectral glow, floating, transparent
    "Skeleton Rex",   // bone structure, ribs, skull
    "Demon Shibe",    // dark, horns, hellfire feet
    "Angel Paw",      // divine, wings, golden halo
    "Alien Woof",     // extraterrestrial, oversized head, antenna
    "Pixel Dragon",   // scales, spikes, mythical
    "Cosmic Bork",    // galaxy body, constellation eyes
    "Glitch Doggo",   // corrupted pixels, RGB shift
    "Golden Statue",  // solid museum gold, plinth
    "Mummy Pup",      // ancient bandages, desert spirit
    "Vampire Hound",  // pale noble, crimson eyes, fangs
    "Cyber Mutt"      // neon implants, circuit traces, HUD
  ],

  // ─── HAT (30 options) ───
  hats: [
    "None",
    // common
    "Snapback Cap", "Backwards Cap", "Knit Beanie", "Flower Crown",
    "Baseball Helmet", "Bicycle Helmet", "Hard Hat",
    // uncommon
    "Top Hat", "Fedora", "Cowboy Hat", "Military Cap", "Party Hat",
    "Beret", "Chef Hat", "Sombrero", "Pirate Hat", "Fez Hat",
    "Graduation Cap", "Dunce Cap",
    // rare
    "Viking Helmet", "Space Helmet", "Ninja Headband", "Propeller Hat",
    "Jester Hat", "Tiara", "Crown of Thorns", "Wizard Hat",
    // legendary
    "Pixel Crown", "Devil Horns"
  ],

  // ─── EYEWEAR (9 options) ───
  glasses: [
    "None",
    "Nerd Thick Frames (square black plastic, studious)",
    "Aviator Goggles (round leather strap, adventure dog)",
    "VR Visor (wide reflective cyber visor, future pup)",
    "Black Wayfarers (classic rectangle dark lenses)",
    "Gold Aviators (teardrop, gold frame, style icon)",
    "3D Cinema Glasses (red-cyan anaglyph, movie buff)",
    "Safety Lab Goggles (science dog, yellow tint)",
    "Round Lennon Wire (tiny wire circles, vintage)"
  ],

  // ─── EAR TYPE (10 options) ───
  beards: [
    "Floppy Long (long droopy velvet ears, hound)",
    "Floppy Short (medium soft drop ears, lab style)",
    "Pointy Upright (sharp triangular stand-up ears, alert)",
    "Bat Ears (very large upright rounded, french bulldog)",
    "Folded Forward (semi-erect, tips forward, collie)",
    "Rose Ear (small folded back, greyhound style)",
    "Feathered Floppy (long floppy with feathered texture)",
    "Wolf Ears (thick pointed, fur-textured, husky)",
    "Double Fold (heavily folded layered ear)",
    "Corgi Large (oversized upright with inner pink)"
  ],

  // ─── OUTFIT (13 options) ───
  body: [
    "Natural Fur (no clothing, pure dog)",
    "Red Bandana (tied around neck, cowdog vibes)",
    "Dog Hoodie (cozy knit, front pocket, urban mutt)",
    "Sailor Suit (navy blue with white trim, nautical)",
    "Superhero Cape (pixel cape with emblem, hero pup)",
    "Denim Jacket (blue denim, classic americana)",
    "Wizard Robe (arcane star robe, mystical mutt)",
    "Punk Vest (spiked shoulders, chaos patches)",
    "Yellow Raincoat (bright slicker, weather-ready)",
    "Pajamas (plaid pixel pattern, sleepy dog)",
    "Police Vest (blue K9 vest, badge pixel)",
    "Tuxedo (black pixel tux, formal occasion)",
    "Sports Jersey (numbered jersey, athletic pup)"
  ],

  // ─── COLLAR (9 options) ───
  chains: [
    "None",
    "Simple Red Collar (standard dog collar, classic)",
    "Spiked Punk Collar (chrome spikes, metal attitude)",
    "Golden Fancy Collar (ornate gold, noble hound)",
    "Flower Collar (daisy chain, cute spring pup)",
    "Pearl Collar (elegant beads, fancy pooch)",
    "LED Light Collar (glowing pixel lights, night walk)",
    "Bandana Collar (fabric neckerchief, wild west)",
    "Bowtie Collar (formal bowtie, distinguished dog)"
  ],

  // ─── FRAME (18 options) ───
  frames: [
    "Classic Wood Pixel Frame (oak brown 8-bit carved border, 4px depth)",
    "Gilded Baroque Pixel Frame (gold pixel scrollwork, ornate corners)",
    "Neon LED Frame (pulsing amber/cyan pixel border, glow effect)",
    "Brutalist Concrete Frame (gray blocky pixels, raw industrial edge)",
    "Arcade Cabinet Frame (black with coin-slot detail, player 1 badge)",
    "Glitch Corrupted Frame (broken pixel edges, RGB shift artifacts)",
    "Terminal Green Frame (monochrome phosphor border, CRT curve)",
    "Vaporwave Gradient Frame (pink-to-cyan pixel gradient border)",
    "Pixel Chain Frame (interlocking chain-link pixel pattern)",
    "Mosaic Tile Frame (multicolor tiny square tiles, cathedral style)",
    "Circuit Board Frame (PCB trace green lines, solder point corners)",
    "Bamboo Pixel Frame (natural brown pixel reeds, zen minimalist)",
    "Diamond Pixel Frame (sparkle corners, precious stone pattern)",
    "Rusty Iron Frame (oxidized brown-orange, weathered pixel bolts)",
    "Holographic Pixel Frame (rainbow shift at edges, prismatic glory)",
    "Bone & Paw Frame (pixel bones and paw prints, dog themed)",
    "No Frame — Raw Edge (floating portrait, no border, void bg)",
    "Double-Line Thin Frame (simple 2px line, elegant minimalist)"
  ],

  // ─── HEAD SHAPE (10 options) ───
  faceShapes: [
    "Round Dome (standard round dog head)",
    "Wide Flat (broad head, brachycephalic base)",
    "Long Narrow (slim greyhound-like snout)",
    "Fox-Like (pointy angular, shiba-style)",
    "Square Blocky (wide jaw, boxer style)",
    "Tiny Round (small chihuahua proportions)",
    "Wolf Shape (angular, large, husky style)",
    "Fluffy Cloud (round with fur poof, poodle/samoyed)",
    "Brachycephalic (very flat snout, french bulldog)",
    "Diamond Angular (wide cheekbones, narrow forehead)"
  ],

  // ─── FUR COLOR (25 options) ───
  skins: [
    "Golden #CC8833 (classic labrador/retriever gold)",
    "Cream #F5E6C8 (pale cream, light lab/samoyed)",
    "Black #111111 (deep black, lab/dachshund/rottweiler)",
    "White #EEEEEE (pure white, samoyed/westie)",
    "Brown #8B4513 (rich warm brown, dachshund/bear)",
    "Chocolate #3D1A00 (dark chocolate lab)",
    "Gray #888888 (stone gray, weimaraner/husky mix)",
    "Red-Brown #CC4422 (red setter/vizsla tone)",
    "Merle Blue #6677AA (merle pattern base)",
    "Brindle #665533 (brindle stripe base)",
    "Spotted White #EEEEEE (dalmatian white base)",
    "Husky Gray #AAAACC (husky two-tone base)",
    "Sable #664422 (sable shepherd tone)",
    "Blue-Gray #778899 (slate blue-gray, elegant)",
    "Tan #D4A96A (warm honey tan, beagle/boxer)",
    // special/rare fur types
    "Void Black #0a0a0a (shadow realm, darkest black)",
    "Albino #FFEEEE (pink-tinged pure white, ultra rare)",
    "Caramel #C87941 (warm caramel swirl, sweet pup)",
    "Slate #556677 (cool blue-gray, winter wolf)",
    "Rose Gold #CC7788 (metallic pink, fashion pup)",
    "Mint #88CCAA (ethereal mint-green, forest spirit)",
    "Lavender #9988CC (soft purple-gray, dream dog)",
    "Amber #DD8822 (deep amber fire, ember hound)",
    "Ivory #EEE0C8 (aged ivory, antique look)",
    "Arctic White #E8F4FF (cold blue-white, polar wolf)"
  ],

  // ─── EYES (33 options) ───
  eyes: [
    // Common
    "Brown Puppy Eyes (warm brown, melting gaze)",
    "2px Dot Eyes (minimal classic 8-bit)",
    "Old Wise Eyes (deep set, experienced look)",
    "Sleepy Half Eyes (droopy lids, chill pup)",
    "Closed Happy Eyes (crescent squint, pure joy)",
    // Uncommon
    "Blue Husky Eyes (icy blue, piercing stare)",
    "Excited Wide Eyes (round open, maximum energy)",
    "Angry Slash Eyes (angled lines, fierce look)",
    "Puppy Shine Eyes (oversized with highlight)",
    "Side-Eye (looking hard to the side, suspicious)",
    "Winking Eye (one closed, one open, cheeky)",
    "Teardrop Eyes (gentle tear, emotional pup)",
    "Heart Eyes (tiny pixel hearts as pupils)",
    "Star Eyes (star-shaped pixels, dazzled)",
    // Rare
    "Heterochromia (one blue, one brown, unique)",
    "Wide Anime Eyes (large sparkly pixel eyes)",
    "Glowing Green Eyes (eerie alien-dog glow)",
    "Snake Slit Eyes (vertical pupils, reptilian)",
    "Diamond Eyes (geometric diamond pupils)",
    "Robot Scan Eye (red horizontal HUD line)",
    "Money Eyes ($$ pupils, maximum greed)",
    "Fire Eyes (flame pixel pupils, burning)",
    "Ice Crystal Eyes (blue shard ice stare)",
    "Rainbow Eyes (shifting color iris)",
    "Pixel 8-Ball Eyes (fortune teller pattern)",
    "Matrix Green Rain (code falling in pupils)",
    "Ghost White Eyes (pure white, no pupil)",
    "Neon Glow Outline (electric outline, no iris)",
    // Legendary
    "Glowing Red Eyes (demon dog, crimson glow)",
    "Spiral Hypno Eyes (spinning pixel circles)",
    "Laser Eyes (red beams shooting outward)",
    "Boba Tea Eyes (cute round bubble pattern)",
    "X_X Eyes (knocked out, comic KO)"
  ],

  // ─── MOUTH (18 options) ───
  mouths: [
    // Common
    "Happy Pant (open mouth, tongue out, classic)",
    "Closed Smile (gentle upward curve, content)",
    "Serious Line (flat line, stoic warrior)",
    "Tiny Mouth (minimal dot, understated)",
    // Uncommon
    "Big Goofy Grin (wide open, full teeth showing)",
    "Long Drool (smile with drool drop, hungry)",
    "Tongue Sideways (tongue hanging to one side)",
    "Angry Growl (downward snarl, bared teeth)",
    "Puppy Lip Quiver (trembling lower lip, sad eyes)",
    "Pipe In Mouth (classic detective pipe)",
    "Pixel Smoke (tiny puff cloud from mouth)",
    // Rare
    "Howling O (round open mouth, singing)",
    "Underbite (lower jaw juts out, bulldog)",
    "Vampire Fangs (extended long white fangs)",
    "Braces Smile (metal pixel dental braces)",
    "Bone In Mouth (pixel stick bone, forever)",
    // Legendary
    "Stick In Mouth (brown pixel stick, retriever)",
    "Zipper Mouth (sealed pixel zipper, secrets)"
  ],

  // ─── HEAD MARKINGS (12 options) ───
  hairs: [
    "None (solid fur color)",
    "Head Spot (dark patch on side of head)",
    "Blaze (white stripe down forehead)",
    "Cap Pattern (darker top of head, husky-style)",
    "Merle Swirls (irregular dark swirl patches)",
    "Flame Pattern (fire-color spiky fur ridge)",
    "Star Marking (star-shaped patch on forehead)",
    "Heart Marking (heart-shaped patch on forehead)",
    "Eye Patch Marking (dark ring around one eye)",
    "Full Mask (darker face, lighter forehead)",
    "Tuxedo Top (white lower face on dark head)",
    "Mohawk Fur (spiky ridge down center of skull)"
  ],

  // ─── FACE ACCESSORIES (15 options) ───
  accessories: [
    "None (clean look)",
    "Dog Tag (pixel ID tag on cheek)",
    "Head Bandage (wrapped pixel bandage)",
    "Sunscreen Nose (white zinc stripe on nose)",
    "War Paint (colored pixel stripes on face)",
    "Flower on Ear (pixel daisy tucked at ear)",
    "Pirate Eye Patch (dark patch over one eye)",
    "Freckle Dots (scatter of darker pixel spots)",
    "Blush Cheeks (pink pixel blush on cheeks)",
    "Battle Scar (diagonal scar across face)",
    "Pixel Gem Earring (bright stud at ear)",
    "Face Tattoo (pixel star/bone on cheek)",
    "Monocle (gold single lens, noble pup)",
    "Nose Ring (tiny bright ring at nose)",
    "Crown Tattoo (tiny crown inked on brow)"
  ],

  // ─── BACKGROUND (21 options) ───
  backgrounds: [
    "Void Black #000 (pure darkness, max contrast)",
    "Deep Space (scattered single-pixel white stars on black)",
    "Pixel Grid Paper (light gray grid lines, sketch pad feel)",
    "Sunset Gradient (orange-to-purple horizontal pixel bands)",
    "Matrix Rain (vertical green character streams, dark bg)",
    "Brick Wall (repeating brown/red pixel brick pattern)",
    "Pixel Sky + Clouds (light blue with white pixel clouds)",
    "Dungeon Stone (dark gray stone block pixel texture)",
    "Neon City (dark bg with colored pixel window lights)",
    "Pixel Forest (green pixel tree canopy pattern)",
    "Checkerboard (alternating dark squares, transparency vibe)",
    "Static Noise (random gray pixel noise, TV static)",
    "Pixel Lava (orange-red bubbling pixel lava texture)",
    "Dog Park (green grass with pixel flowers, sunny day)",
    "Pixel Beach (blue pixel waves with sand, vacation)",
    "Rainbow Stripes (vibrant horizontal pixel color bands)",
    "Algorist Waves (plotter sine curves, Verostko·Hébert 1995)",
    "Graffiti Wall (colorful spray pixel tags, urban art)",
    "Cyber Grid (tron-style neon grid lines on black)",
    "Pixel Castle (stone battlements, medieval backdrop)",
    "Tie-Dye Swirl (psychedelic concentric color rings)"
  ],

  // ─── PALETTE (12 options) ───
  palettes: [
    "Game Boy (4 shades of green: #0f380f #306230 #8bac0f #9bbc0f)",
    "NES Classic (full NES palette, vibrant primaries)",
    "CGA Cyan-Magenta (cyan, magenta, white, black — PC retro)",
    "Monochrome Amber (amber phosphor on black, terminal style)",
    "Monochrome Green (green phosphor on black, hacker CRT)",
    "PICO-8 (16-color fantasy console palette, balanced)",
    "Commodore 64 (C64 16-color palette, warm browns + blues)",
    "Pastel Soft (muted soft pixel tones, gentle aesthetic)",
    "High Contrast (pure black + pure white + one accent only)",
    "Vaporwave (hot pink, cyan, purple, chrome highlights)",
    "Sepia Vintage (warm brown tones, aged photograph feel)",
    "Blood Moon (deep reds, blacks, single white accent)"
  ]
};

// ══════════════════════════════════════════════════════
// SPECIAL ARCHETYPE SKIN COLORS
// Used by canvas.js to override fur for custom types
// ══════════════════════════════════════════════════════
const ARCHETYPE_SKINS = {
  'Zombie Doggo':   { fur:'#5a7a3a', snout:'#88aa66', accent:'#3a5a20', dark:'#2a3a10' },
  'RoboDog 3000':   { fur:'#8899aa', snout:'#aabbcc', accent:'#556677', dark:'#334455' },
  'Ghost Pupper':   { fur:'#aabbdd', snout:'#ccddf0', accent:'#8899bb', dark:'#667799' },
  'Skeleton Rex':   { fur:'#ddd8c8', snout:'#eeeeee', accent:'#aaa89a', dark:'#888070' },
  'Demon Shibe':    { fur:'#661122', snout:'#994433', accent:'#440011', dark:'#220008' },
  'Angel Paw':      { fur:'#fffaee', snout:'#ffffff', accent:'#ffe09a', dark:'#ddcc88' },
  'Alien Woof':     { fur:'#44aa44', snout:'#88cc88', accent:'#226622', dark:'#114411' },
  'Pixel Dragon':   { fur:'#226644', snout:'#44aa77', accent:'#114422', dark:'#082211' },
  'Cosmic Bork':    { fur:'#112244', snout:'#224466', accent:'#0a1833', dark:'#060e1e' },
  'Glitch Doggo':   { fur:'#cc3355', snout:'#ff6677', accent:'#991133', dark:'#660022' },
  'Golden Statue':  { fur:'#cc9900', snout:'#ffcc00', accent:'#aa7700', dark:'#885500' },
  'Mummy Pup':      { fur:'#c8b890', snout:'#ddd0b0', accent:'#a09070', dark:'#786050' },
  'Vampire Hound':  { fur:'#d8d0e8', snout:'#eeeeff', accent:'#aa9999', dark:'#887788' },
  'Cyber Mutt':     { fur:'#112233', snout:'#224455', accent:'#0a1a2a', dark:'#060e18' }
};

const SPECIAL_ARCHETYPES = new Set(Object.keys(ARCHETYPE_SKINS));

// ══════════════════════════════════════════════════════
// RARITY SYSTEM — 9 cats × 3pts = 27 max
//
// Análisis matemático (con sesgo 5% archetypes en random):
//   E[score] ≈ 7.95   σ ≈ 2.80
//   COMMON    < 0.27  →  score 0-7   (≈40%)
//   UNCOMMON  0.27-0.36 → score 8-9  (≈35%)
//   RARE      0.36-0.45 → score 10-12 (≈18%)
//   LEGENDARY ≥ 0.45   → score 13+  (≈7%)
//
// Clave: eye/mouth/hair tienen POCOS opciones non-cero
// para no inflar el promedio. La mayoría de traits score 0.
// ══════════════════════════════════════════════════════
const RARITY_WEIGHTS = {
  // ── TYPE — E≈0.91 ──────────────────────────────────
  type: {
    // score 0 — razas comunes (8)
    'Labrador Retriever':0,'Golden Retriever':0,'Beagle':0,'French Bulldog':0,
    'Boxer':0,'Dachshund':0,'German Shepherd':0,'Chihuahua':0,
    // score 1 — razas uncommon (7)
    'Husky':1,'Poodle':1,'Corgi':1,'Shiba Inu':1,'Great Dane':1,'Samoyed':1,'Beagle':1,
    // score 2 — razas raras (5)
    'Dalmatian':2,'Border Collie':2,'Rottweiler':2,'Dobermann':2,'Chow Chow':2,
    // score 3 — archetypes (14, pero solo 5% en random)
    'Dingo':2,
    'Zombie Doggo':3,'RoboDog 3000':3,'Ghost Pupper':3,'Skeleton Rex':3,
    'Demon Shibe':3,'Angel Paw':3,'Alien Woof':3,'Pixel Dragon':3,
    'Cosmic Bork':3,'Glitch Doggo':3,'Golden Statue':3,'Mummy Pup':3,
    'Vampire Hound':3,'Cyber Mutt':3
  },
  // ── HAT — E≈0.77 (32% bias toward None=0) ──────────
  hat: {
    'None':0,'Snapback Cap':0,'Backwards Cap':0,'Knit Beanie':0,'Flower Crown':0,
    'Baseball Helmet':0,'Bicycle Helmet':0,'Hard Hat':0,
    'Top Hat':1,'Fedora':1,'Cowboy Hat':1,'Military Cap':1,'Party Hat':1,
    'Beret':1,'Chef Hat':1,'Sombrero':1,'Pirate Hat':1,'Fez Hat':1,
    'Graduation Cap':1,'Dunce Cap':1,
    'Viking Helmet':2,'Space Helmet':2,'Ninja Headband':2,'Propeller Hat':2,
    'Jester Hat':2,'Tiara':2,'Crown of Thorns':2,'Wizard Hat':2,
    'Pixel Crown':3,'Devil Horns':3
  },
  // ── GLASSES — E≈0.89 ───────────────────────────────
  glasses: {
    'None':0,'Nerd Thick Frames':0,'Black Wayfarers':0,'Gold Aviators':0,
    'Aviator Goggles':1,'Round Lennon Wire':2,
    'VR Visor':2,'Safety Lab Goggles':2,
    '3D Cinema Glasses':3
  },
  // ── EARS — E≈0.80 ─────────────────────────────────
  beard: {
    'Floppy Long':0,'Floppy Short':0,'Pointy Upright':0,
    'Folded Forward':1,'Feathered Floppy':1,'Wolf Ears':2,
    'Bat Ears':1,'Rose Ear':2,
    'Double Fold':2,'Corgi Large':3
  },
  // ── OUTFIT — E≈0.80 ────────────────────────────────
  body: {
    'Natural Fur':0,'Red Bandana':0,'Dog Hoodie':0,'Yellow Raincoat':0,
    'Denim Jacket':1,'Sports Jersey':1,'Pajamas':1,'Sailor Suit':2,
    'Wizard Robe':2,'Police Vest':1,
    'Punk Vest':2,'Superhero Cape':2,
    'Tuxedo':3
  },
  // ── COLLAR — E≈0.80 (22% bias toward None=0) ───────
  chain: {
    'None':0,'Simple Red Collar':0,'Bandana Collar':0,
    'Flower Collar':1,'Bowtie Collar':2,'Pearl Collar':2,
    'Spiked Punk Collar':3,'LED Light Collar':2,
    'Golden Fancy Collar':3
  },
  // ── EYE — E≈0.36 — SOLO 8/33 opciones non-cero ────
  // (era 1.58 antes → causaba inflación masiva)
  eye: {
    // score 0 — la gran mayoría (25 opciones)
    'Brown Puppy Eyes':0,'2px Dot Eyes':0,'Old Wise Eyes':0,
    'Sleepy Half Eyes':0,'Closed Happy Eyes':0,
    'Blue Husky Eyes':0,'Excited Wide Eyes':0,'Angry Slash Eyes':0,
    'Puppy Shine Eyes':0,'Side-Eye':0,'Winking Eye':0,
    'Teardrop Eyes':0,'Heart Eyes':0,'Star Eyes':0,
    'Snake Slit Eyes':0,'Diamond Eyes':0,'Robot Scan Eye':0,
    'Money Eyes':0,'Rainbow Eyes':0,'Pixel 8-Ball Eyes':0,
    'Ghost White Eyes':0,'Neon Glow Outline':0,'Glowing Green Eyes':0,
    'Boba Tea Eyes':0,'Laser Eyes':0,
    // score 1 — ojos especiales (5 opciones)
    'Heterochromia':1,'Wide Anime Eyes':1,'Fire Eyes':1,
    'Ice Crystal Eyes':1,'Matrix Green Rain':1,
    // score 2 — ojos raros (2 opciones)
    'Glowing Red Eyes':2,'Spiral Hypno Eyes':2,
    // score 3 — legendario (1 opción)
    'X_X Eyes':3
  },
  // ── MOUTH — E≈0.39 — SOLO 4/18 opciones non-cero ──
  // (era 1.28 antes → causaba inflación)
  mouth: {
    // score 0 — la mayoría (14 opciones)
    'Happy Pant':0,'Closed Smile':0,'Serious Line':0,'Tiny Mouth':0,
    'Big Goofy Grin':0,'Long Drool':0,'Tongue Sideways':0,
    'Angry Growl':0,'Puppy Lip Quiver':0,'Pixel Smoke':0,
    'Underbite':0,'Braces Smile':0,'Bone In Mouth':0,'Pipe In Mouth':0,
    // score 1 — bocas especiales (2 opciones)
    'Vampire Fangs':1,'Howling O':1,
    // score 2 — bocas raras (1 opción)
    'Zipper Mouth':2,
    // score 3 — legendario (1 opción)
    'Stick In Mouth':3
  },
  // ── MARKINGS — E≈0.50 — SOLO 3/12 non-cero ────────
  // (era 1.50 antes → causaba inflación)
  hair: {
    // score 0 — la mayoría (9 opciones)
    'None':0,'Head Spot':0,'Cap Pattern':0,'Star Marking':0,
    'Heart Marking':0,'Eye Patch Marking':0,'Full Mask':0,
    'Tuxedo Top':0,'Mohawk Fur':0,
    // score 1 — marking especial (1 opción)
    'Blaze':1,
    // score 2 — marking raro (1 opción)
    'Merle Swirls':2,
    // score 3 — legendario (1 opción)
    'Flame Pattern':3
  }
};

function calcRarity(traits) {
  let total = 0, maxScore = 0;
  for (const [cat, map] of Object.entries(RARITY_WEIGHTS)) {
    maxScore += 3;
    const val = traits[cat] || '';
    let score = 0;
    for (const [key, r] of Object.entries(map)) {
      if (val === key || val.startsWith(key + ' ') || val.startsWith(key + '(')) {
        score = r; break;
      }
    }
    total += score;
  }
  // Thresholds calibrados para E≈7.95, σ≈2.80
  // → ~40% COMMON · ~35% UNCOMMON · ~18% RARE · ~7% LEGENDARY
  const pct = maxScore > 0 ? total / maxScore : 0;
  if (pct >= 0.45) return { tier:'LEGENDARY', score:total, max:maxScore, color:'#ffe600' };
  if (pct >= 0.36) return { tier:'RARE',      score:total, max:maxScore, color:'#b026ff' };
  if (pct >= 0.27) return { tier:'UNCOMMON',  score:total, max:maxScore, color:'#ff7722' };
  return                  { tier:'COMMON',    score:total, max:maxScore, color:'#888888' };
}

export { traitsData, calcRarity, ARCHETYPE_SKINS, SPECIAL_ARCHETYPES, RARITY_WEIGHTS };
