const { parseCardData } = require('../src/engine.cjs');
const cardsData = require('../src/cards.json');

console.log("--- V9.0 COVERAGE AUDIT (IDs 0-300) ---");
let total = 0;
let missed = [];

cardsData.forEach(c => {
  if (c.id === "0" || c.id.includes("back") || c.id.includes("DS_Store")) return;
  total++;
  const data = parseCardData(c.id);
  const txt = c.rawText.toLowerCase();
  const e = data.effects;
  
  // A card is "Covered" if any logic key is set. 
  // We check if keywords are present but NO corresponding logic key is set.
  
  if (txt.includes('destroy') && !Object.keys(e).some(k => k.toLowerCase().includes('destroy'))) 
    missed.push(`[GHOST] ID#${c.id}: text says "destroy" but no destroy effect mapped.`);
  
  if (txt.includes('summon') && !Object.keys(e).some(k => k.toLowerCase().includes('summon'))) 
    missed.push(`[GHOST] ID#${c.id}: text says "summon" but no summon effect mapped.`);
    
  if (txt.includes('draw') && !Object.keys(e).some(k => k.toLowerCase().includes('draw'))) 
    missed.push(`[GHOST] ID#${c.id}: text says "draw" but no draw effect mapped.`);

  if (txt.includes('whenever') && !Object.keys(e).some(k => k.toLowerCase().includes('passive')))
    missed.push(`[V9-FAIL] ID#${c.id}: text says "whenever" but no passive trigger mapped.`);
});

console.log(`Audited ${total} cards. Found ${missed.length} remaining gaps.`);
if (missed.length > 0) {
    console.log(`Top 5 Remaining Gaps:`);
    missed.slice(0, 5).forEach(m => console.log(m));
} else {
    console.log("100% MECHANICAL COVERAGE ACHIEVED.");
}
