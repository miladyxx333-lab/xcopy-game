const fs = require('fs');
const cards = require('./src/cards.json');

const parsedCards = [];

for (const card of cards) {
  const id = card.id;
  const raw = card.rawText || '';
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  let name = lines[0] || `Card ${id}`;
  if (/^(cost|type|attack|defense):/i.test(name)) name = `Card ${id}`;

  const txt = raw.toLowerCase();
  const norm = txt.replace(/\n/g, ' ');

  // Stats
  let cost = 0, atk = 0, def = 0;
  const cMatch = txt.match(/cost[: ]*\s*(\d+)/); if (cMatch) cost = parseInt(cMatch[1]);
  const aMatch = txt.match(/attack[: ]*\s*(\d+)/) || txt.match(/atk[: ]*\s*(\d+)/); if (aMatch) atk = parseInt(aMatch[1]);
  const dMatch = txt.match(/defense[: ]*\s*(\d+)/) || txt.match(/def[: ]*\s*(\d+)/); if (dMatch) def = parseInt(dMatch[1]);

  let cardType = 'neutral';
  if (/type[: ]*fly/i.test(txt) || /breed of wings/i.test(txt) || /wings/i.test(txt)) cardType = 'fly';
  else if (/type[: ]*death/i.test(txt) || /undead/i.test(txt) || /grave/i.test(txt)) cardType = 'death';
  else if (/type[: ]*doom/i.test(txt) || /terror and doom/i.test(txt)) cardType = 'doom';
  else if (/type[: ]*legendary/i.test(txt)) cardType = 'legendary';
  else if (txt.includes('fly')) cardType = 'fly';
  else if (txt.includes('doom')) cardType = 'doom';
  else if (txt.includes('death')) cardType = 'death';

  // Extract effect text
  let effectText = '';
  const effMatch = raw.match(/Effect:([^]*?)(?:Flavor Text|$)/i) || raw.match(/Effect[: ]+([^]*)/i);
  if (effMatch) {
    effectText = effMatch[1].trim().replace(/\n+/g, ' ');
  } else {
    // Collect non-stat lines
    effectText = lines.filter(l => !/^(cost|attack|defense|type):/i.test(l) && l !== name).join(' ');
  }

  const effLower = effectText.toLowerCase();

  // Parse structured effects
  const effect = {
    trigger: 'NONE', // ON_SUMMON, ON_ATTACK, ON_DEATH, ON_PLAY_TYPE, ACTIVATED, AURA, PASSIVE_ROUND
    actions: []
  };

  // Determine Trigger
  if (id === "0") {
    effect.trigger = 'SOUP_RESOURCE';
    effect.actions.push({ action: 'RESOURCE_SOUP', amount: 1 });
  } else if (/fragment of creation|fragments of creation|soul fragment|mind fragment|body fragment/i.test(effLower)) {
    effect.trigger = 'FRAGMENT_WIN';
    effect.actions.push({ action: 'FRAGMENT_WIN' });
  } else if (/counter/i.test(effLower)) {
    effect.trigger = 'COUNTER';
    let targetType = 'any';
    if (/fly/i.test(effLower)) targetType = 'fly';
    else if (/death/i.test(effLower)) targetType = 'death';
    else if (/doom/i.test(effLower)) targetType = 'doom';
    else if (/legendary/i.test(effLower)) targetType = 'legendary';
    effect.actions.push({ action: 'COUNTER', targetType });
  } else if (/when this card is destroyed|whenever this card is destroyed|when destroyed|destroyed/i.test(effLower)) {
    effect.trigger = 'ON_DEATH';
  } else if (/when this card attacks|whenever this card attacks|when.*attacks/i.test(effLower)) {
    effect.trigger = 'ON_ATTACK';
  } else if (/whenever a (fly|death|doom) card is (summoned|played)|whenever a.*card is (summoned|played)/i.test(effLower)) {
    effect.trigger = 'ON_PLAY_TYPE';
  } else if (/whenever a (fly|death|doom) card is destroyed|whenever an enemy.*destroyed/i.test(effLower)) {
    effect.trigger = 'ON_TYPE_DESTROYED';
  } else if (/all (fly|death|doom).*gain|all cards gain/i.test(effLower)) {
    effect.trigger = 'AURA';
  } else if (/once per turn|once per game|pay \d+|sacrifice/i.test(effLower)) {
    effect.trigger = 'ACTIVATED';
  } else if (/when summoned|when.*summoned|on summon|deal|gain|draw|summon|destroy|heal|corrupt/i.test(effLower)) {
    // Default trigger for spells or entry abilities is ON_SUMMON
    effect.trigger = 'ON_SUMMON';
  }

  // Parse Actions inside effectText
  // 1. Gain soup/can
  const gainCanM = effLower.match(/gain (\d+) (can|soup)/i) || effLower.match(/gain (\d+) cans/i);
  if (gainCanM) {
    effect.actions.push({ action: 'GAIN_SOUP', amount: parseInt(gainCanM[1]) });
  }

  // 2. Draw cards
  const drawM = effLower.match(/draw (\d+) card/i) || effLower.match(/draw one card/i) || effLower.match(/draw a card/i);
  if (drawM) {
    const amt = drawM[1] ? parseInt(drawM[1]) : 1;
    effect.actions.push({ action: 'DRAW', amount: amt, target: /both|all players/i.test(effLower) ? 'BOTH' : 'SELF' });
  }

  // 3. Heal / Life
  const healM = effLower.match(/(heal|gain).*?(\d+).*?(health|life|hp)/i) || effLower.match(/gain (\d+).*?life/i);
  if (healM) {
    effect.actions.push({ action: 'HEAL', amount: parseInt(healM[2] || healM[1]) });
  }

  // 4. Damage
  // All enemy cards
  const dmgAllEnemyM = effLower.match(/deal (\d+) damage to all.*(enemy|opponent)/i);
  if (dmgAllEnemyM) {
    effect.actions.push({ action: 'DAMAGE_ALL_ENEMY', amount: parseInt(dmgAllEnemyM[1]) });
  } else if (/deal (\d+) damage to all cards/i.test(effLower)) {
    const dmgAllM = effLower.match(/deal (\d+) damage to all cards/i);
    effect.actions.push({ action: 'DAMAGE_ALL_CARDS', amount: parseInt(dmgAllM[1]) });
  } else if (/(\d+) damage to (the )?opponent|(\d+) damage to opponent'?s? life/i.test(effLower)) {
    const dmgOppM = effLower.match(/(\d+) damage to/i) || effLower.match(/deal (\d+) damage/i);
    effect.actions.push({ action: 'DAMAGE_PLAYER', amount: parseInt(dmgOppM[1]) });
  } else if (/deal (\d+) damage to an enemy card with the highest defense|highest defense/i.test(effLower)) {
    const dmgHighM = effLower.match(/deal (\d+) damage/i);
    effect.actions.push({ action: 'DAMAGE_HIGHEST_DEFENSE', amount: parseInt(dmgHighM[1]) });
  } else if (/deal (\d+) damage/i.test(effLower)) {
    const dmgM = effLower.match(/deal (\d+) damage/i);
    effect.actions.push({ action: 'DAMAGE_TARGET', amount: parseInt(dmgM[1]) });
  }

  // 5. Summon tokens / cards
  const summonStatsM = effLower.match(/summon (a )?(\d+)\/(\d+) (fly|death|doom|token)?/i) || effLower.match(/summon.*?(\d+)x.*?(\d+)\/(\d+)/i);
  if (summonStatsM) {
    let tAtk = 1, tDef = 1, tCount = 1, tType = cardType;
    if (summonStatsM[0].includes('x')) {
      tCount = parseInt(summonStatsM[1]);
      tAtk = parseInt(summonStatsM[2]);
      tDef = parseInt(summonStatsM[3]);
    } else {
      tAtk = parseInt(summonStatsM[2]);
      tDef = parseInt(summonStatsM[3]);
      if (summonStatsM[4]) tType = summonStatsM[4].toLowerCase();
    }
    effect.actions.push({ action: 'SUMMON_TOKEN', count: tCount, atk: tAtk, def: tDef, type: tType });
  } else if (/summon (\d+) (death|fly|doom)? token/i.test(effLower)) {
    const tokM = effLower.match(/summon (\d+) (death|fly|doom)? token/i);
    effect.actions.push({ action: 'SUMMON_TOKEN', count: parseInt(tokM[1]), atk: 1, def: 1, type: (tokM[2] || cardType).toLowerCase() });
  } else if (/summon another (death|fly|doom) card from your deck|summon.*from.*deck/i.test(effLower)) {
    const deckTypeM = effLower.match(/summon another (death|fly|doom) card/i);
    effect.actions.push({ action: 'SUMMON_FROM_DECK', type: deckTypeM ? deckTypeM[1].toLowerCase() : cardType });
  }

  // 6. Destroy
  if (/destroy all.*cost.*less than (\d+)|cost.*(\d+) or less/i.test(effLower)) {
    const costM = effLower.match(/less than (\d+)/i) || effLower.match(/(\d+) or less/i);
    effect.actions.push({ action: 'DESTROY_BY_COST', maxCost: parseInt(costM[1]) });
  } else if (/destroy all.*(fly|death|doom)/i.test(effLower)) {
    const destTypeM = effLower.match(/destroy all.*(fly|death|doom)/i);
    effect.actions.push({ action: 'DESTROY_BY_TYPE', targetType: destTypeM[1].toLowerCase() });
  } else if (/destroy.*strongest|destroy.*highest attack/i.test(effLower)) {
    effect.actions.push({ action: 'DESTROY_STRONGEST' });
  }

  // 7. Discard
  if (/discard (\d+) card/i.test(effLower) || /discards (\d+) card/i.test(effLower)) {
    const discM = effLower.match(/discard[s]? (\d+)/i);
    effect.actions.push({ action: 'DISCARD', amount: parseInt(discM[1]), target: /opponent/i.test(effLower) ? 'OPPONENT' : 'SELF' });
  }

  // 8. Freeze
  if (/freeze/i.test(effLower)) {
    effect.actions.push({ action: 'FREEZE_TARGET' });
  }

  // 9. Buff (passive/aura)
  if (/gain \+(\d+) attack/i.test(effLower) || /\+(\d+) attack/i.test(effLower)) {
    const buffM = effLower.match(/\+(\d+) attack/i);
    effect.actions.push({ action: 'BUFF_ATK', amount: parseInt(buffM[1]) });
  }

  parsedCards.push({
    id,
    name,
    cost,
    atk,
    def,
    cardType,
    effectText,
    parsedEffect: effect
  });
}

// Summary
const triggerCounts = {};
const actionCounts = {};
let noActionCount = 0;

for (const c of parsedCards) {
  triggerCounts[c.parsedEffect.trigger] = (triggerCounts[c.parsedEffect.trigger] || 0) + 1;
  if (c.parsedEffect.actions.length === 0) noActionCount++;
  for (const a of c.parsedEffect.actions) {
    actionCounts[a.action] = (actionCounts[a.action] || 0) + 1;
  }
}

console.log('=== DEEP CLASSIFICATION RESULTS ===');
console.log('Triggers:', JSON.stringify(triggerCounts, null, 2));
console.log('Actions:', JSON.stringify(actionCounts, null, 2));
console.log('Cards without recognized action:', noActionCount);

// Save parsed database
fs.writeFileSync('./parsed_cards_verified.json', JSON.stringify(parsedCards, null, 2));

if (noActionCount > 0) {
  console.log('\n--- SAMPLE CARDS WITHOUT ACTIONS ---');
  parsedCards.filter(c => c.parsedEffect.actions.length === 0).slice(0, 10).forEach(c => {
    console.log(`[Card ${c.id}] ${c.name}: "${c.effectText}"`);
  });
}
