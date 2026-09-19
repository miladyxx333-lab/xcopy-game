const engine = require('./src/engine.cjs');
const cards = require('./src/cards.json');

const allEffectKeys = new Set();
const effectToCards = {};

for (const card of cards) {
  if (card.id === "0") continue;
  const parsed = engine.parseCardData(card.id);
  for (const key of Object.keys(parsed.effects)) {
    allEffectKeys.add(key);
    if (!effectToCards[key]) effectToCards[key] = [];
    effectToCards[key].push(card.id);
  }
}

console.log("All unique effect keys parsed by engine:");
for (const key of Array.from(allEffectKeys).sort()) {
  console.log(`- ${key} (used in ${effectToCards[key].length} cards)`);
}
