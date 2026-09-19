const fs = require('fs');
const engine = require('./src/engine.cjs');
const cards = require('./src/cards.json');

let unmapped = [];
let mapped = [];

for (const card of cards) {
  if (card.id === "0") continue;
  const parsed = engine.parseCardData(card.id);
  const text = (card.rawText || '').toLowerCase();
  
  if (text.includes('effect:')) {
    const effectStr = (text.match(/effect:([^]*?)(?:flavor|$)/i) || ['', text])[1].trim();
    if (effectStr.length > 3 && Object.keys(parsed.effects).length === 0) {
      unmapped.push({ id: card.id, effectStr, rawText: card.rawText });
    } else {
      mapped.push({ id: card.id, effectStr, effects: parsed.effects });
    }
  }
}

console.log(`Total cards analyzed: ${cards.length}`);
console.log(`Successfully mapped effects: ${mapped.length}`);
console.log(`Unmapped/Failed effects: ${unmapped.length}`);

if (unmapped.length > 0) {
  console.log("\n--- UNMAPPED EFFECTS ---");
  unmapped.slice(0, 15).forEach(c => {
    console.log(`[Card ${c.id}] Text: ${c.effectStr}`);
  });
}
