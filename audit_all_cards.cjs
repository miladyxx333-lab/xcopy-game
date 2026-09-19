const fs = require('fs');
const path = require('path');
const cards = require('./src/cards.json');

const results = [];

for (const card of cards) {
  const id = card.id;
  const raw = card.rawText || '';
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Extract name: usually first line if it doesn't start with cost/type
  let name = lines[0] || `Card ${id}`;
  if (/^(cost|type|attack|defense):/i.test(name)) name = `Card ${id}`;

  const txt = raw.toLowerCase();
  const norm = txt.replace(/\n/g, ' ');

  // Cost, Atk, Def
  let cost = 0, atk = 0, def = 0;
  const cMatch = txt.match(/cost[: ]*\s*(\d+)/); if (cMatch) cost = parseInt(cMatch[1]);
  const aMatch = txt.match(/attack[: ]*\s*(\d+)/) || txt.match(/atk[: ]*\s*(\d+)/); if (aMatch) atk = parseInt(aMatch[1]);
  const dMatch = txt.match(/defense[: ]*\s*(\d+)/) || txt.match(/def[: ]*\s*(\d+)/); if (dMatch) def = parseInt(dMatch[1]);

  // Type
  let cardType = 'neutral';
  if (txt.includes('type: fly') || txt.includes('type:fly')) cardType = 'fly';
  else if (txt.includes('type: death') || txt.includes('type:death')) cardType = 'death';
  else if (txt.includes('type: doom') || txt.includes('type:doom')) cardType = 'doom';
  else if (txt.includes('type: legendary') || txt.includes('type:legendary')) cardType = 'legendary';
  else if (txt.includes('fly')) cardType = 'fly';
  else if (txt.includes('doom')) cardType = 'doom';
  else if (txt.includes('death')) cardType = 'death';

  // Extract effect text
  let effectText = '';
  const effMatch = raw.match(/Effect:([^]*?)(?:Flavor Text|$)/i) || raw.match(/Effect[: ]+([^]*)/i);
  if (effMatch) {
    effectText = effMatch[1].trim().replace(/\n+/g, ' ');
  } else {
    // If no explicit "Effect:", check if there is special text
    effectText = lines.filter(l => !/^(cost|attack|defense|type):/i.test(l)).join(' ');
  }

  // Determine actual effect categories
  const categories = [];
  const effNorm = effectText.toLowerCase();

  if (/when.*summoned|when summoned|on summon/i.test(effNorm)) categories.push('ON_SUMMON');
  if (/when this card attacks|whenever this card attacks|when.*attacks|attacks/i.test(effNorm) && !/attack[: ]*\d+/i.test(effNorm)) categories.push('ON_ATTACK');
  if (/when this card is destroyed|whenever this card is destroyed|when destroyed|destroyed/i.test(effNorm)) categories.push('ON_DEATH');
  if (/whenever.*(summoned|destroyed|dies)|for each|for every/i.test(effNorm) && !categories.includes('ON_SUMMON')) categories.push('PASSIVE_TRIGGER');
  if (/all (fly|death|doom).*gain/i.test(effNorm)) categories.push('AURA');
  if (/pay \d+|once per turn|sacrifice/i.test(effNorm)) categories.push('ACTIVATED');
  if (/fragment of creation|soul fragment|mind fragment|body fragment|fragments of creation/i.test(effNorm)) categories.push('FRAGMENT_WIN');
  if (/counter/i.test(effNorm)) categories.push('COUNTER');

  if (categories.length === 0 && effectText.length > 5) {
    categories.push('UNCLASSIFIED');
  }

  results.push({
    id,
    name,
    cost,
    atk,
    def,
    cardType,
    effectText,
    categories
  });
}

// Write JSON and Summary
fs.writeFileSync('./audit_cards.json', JSON.stringify(results, null, 2));

const categoryCounts = {};
for (const r of results) {
  for (const c of r.categories) {
    categoryCounts[c] = (categoryCounts[c] || 0) + 1;
  }
}

console.log('=== CARD AUDIT COMPLETE ===');
console.log(`Total Cards Analyzed: ${results.length}`);
console.log('Categories Breakdown:');
console.log(JSON.stringify(categoryCounts, null, 2));

// Check unclassified cards
const unclassified = results.filter(r => r.categories.includes('UNCLASSIFIED'));
console.log(`\nUnclassified Cards count: ${unclassified.length}`);
if (unclassified.length > 0) {
  console.log('Sample Unclassified:');
  unclassified.slice(0, 10).forEach(u => console.log(`[${u.id}] ${u.name}: "${u.effectText}"`));
}
