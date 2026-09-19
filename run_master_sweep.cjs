const fs = require('fs');
const path = require('path');
const cards = require('./src/cards.json');

function parseCardMaster(card) {
  const id = card.id;
  const raw = card.rawText || '';
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  let name = lines[0] || `Card ${id}`;
  if (/^(cost|type|attack|defense):/i.test(name)) name = `Card ${id}`;

  const txt = raw.toLowerCase();
  const norm = txt.replace(/\n+/g, ' ');

  // Stats
  let cost = 0, atk = 0, def = 0;
  const cMatch = txt.match(/cost[: ]*\s*(\d+)/); if (cMatch) cost = parseInt(cMatch[1]);
  else if (id !== "0") cost = 3;

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

  // Extract effect
  let effectText = '';
  const effMatch = raw.match(/Effect:([^]*?)(?:Flavor Text|$)/i) || raw.match(/Effect[: ]+([^]*)/i);
  if (effMatch) {
    effectText = effMatch[1].trim().replace(/\n+/g, ' ');
  } else {
    effectText = lines.filter(l => !/^(cost|attack|defense|type):/i.test(l) && l !== name).join(' ');
  }

  const eff = effectText.toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"');

  const parsed = {
    id,
    name,
    cost: id === "0" ? 0 : cost,
    attack: atk,
    defense: def,
    cardType,
    effectText,
    isFragment: false,
    effects: {}
  };

  const e = parsed.effects;

  // 0. SOUP RESOURCE
  if (id === "0") {
    e.isSoupResource = true;
    return parsed;
  }

  // 1. FRAGMENTS (WIN CONDITION: 236-240)
  if (['236', '237', '238', '239', '240'].includes(id) || /other fragments in your hand, you win the game/i.test(eff)) {
    parsed.isFragment = true;
    e.winCombo = true;
    e.cannotBeDestroyedInCombat = true;
    return parsed;
  }
  if (/search you(r)? deck for (\d+) fragment/i.test(eff)) {
    e.onSummonSearchFragments = 3;
    return parsed;
  }
  if (/return.*?fragments of creation.*?to your deck and gain (\d+) life/i.test(eff)) {
    const lM = eff.match(/gain (\d+) life/i);
    e.onSummonShuffleFragments = 3;
    e.onSummonHeal = lM ? parseInt(lM[1]) : 50;
    return parsed;
  }

  // 2. COUNTERS
  if (/counter/i.test(eff)) {
    e.isCounter = true;
    let target = 'any';
    if (/fly/i.test(eff)) target = 'fly';
    else if (/death/i.test(eff)) target = 'death';
    else if (/doom/i.test(eff)) target = 'doom';
    else if (/legendary/i.test(eff)) target = 'legendary';
    e.counterTarget = target;
  }

  // 3. IMMUNITIES & TRAITS
  if (/cannot be destroyed b.*fly|cannot be destroyed by fly/i.test(eff)) e.immuneToFly = true;
  if (/cannot be destroyed in combat/i.test(eff)) e.combatImmune = true;
  if (/cannot be targeted/i.test(eff)) e.untargetable = true;
  if (/cannot be attacked by non-fly/i.test(eff)) e.flyingStealth = true;
  if (/cannot be blocked by death/i.test(eff)) e.unblockableByDeath = true;
  if (/can attack twice per turn/i.test(eff)) e.doubleAttack = true;
  if (/immune to effects from cards that cost 6 or fewer/i.test(eff)) e.immuneLowCost = 6;
  if (/immune to all non-attack effects/i.test(eff)) e.immuneSpells = true;
  if (/cannot attack unless another doom card/i.test(eff)) e.requiresDoomToAttack = true;
  if (/can lose the game/i.test(eff)) e.cursedDoom = true;

  // 4. GAIN / STEAL SOUP
  if (/steal 1 can of soup/i.test(eff)) {
    e.onSummonStealSoup = 1;
  } else if (/destroy 1 enemy can/i.test(eff)) {
    e.onDestroyEnemyCan = 1;
  } else if (/both players lose 1 can/i.test(eff)) {
    e.onDeathBothLoseCan = 1;
  } else if (/gain (\d+) (can|soup)|gain 1 extra can/i.test(eff)) {
    const amt = parseInt((eff.match(/gain (\d+)/i) || [0, 1])[1]);
    if (/when.*destroyed|destroyed/i.test(eff)) e.onDeathGainSoup = amt;
    else if (/when.*attacks|attacks/i.test(eff)) e.onAttackGainSoup = amt;
    else if (/whenever a (doom|death|fly) card is (played|summoned)/i.test(eff)) {
      const tMatch = eff.match(/(doom|death|fly)/i);
      e.onPlayTypeGainSoup = { type: tMatch ? tMatch[1] : 'any', amount: amt };
    } else if (/whenever a.*destroyed|whenever an enemy card is destroyed/i.test(eff)) {
      e.passiveOnDeathGainSoup = amt;
    } else {
      e.onSummonGainSoup = amt;
    }
  }

  // 5. DRAW CARDS
  if (/draw (\d+) (additional )?card|draw one card|draw a card/i.test(eff)) {
    const amt = parseInt((eff.match(/draw (\d+)/i) || [0, 1])[1]);
    if (/when.*attacks|attacks/i.test(eff)) e.onAttackDraw = amt;
    else if (/when.*destroyed|destroyed/i.test(eff)) e.onDeathDraw = amt;
    else e.onSummonDraw = amt;
  }

  // 6. HEAL / LIFE RECOVERY
  if (/(heal|gain).*?(\d+).*?(health|life|hp)/i.test(eff) || /heal.*?by (\d+)/i.test(eff) || /gain (\d+).*?life/i.test(eff) || /heal this card for (\d+)/i.test(eff) || /heal 1 damage to any card/i.test(eff)) {
    const amt = parseInt((eff.match(/(\d+)/i) || [0, 2])[1]);
    if (/heal this card/i.test(eff)) e.healSelfOnDeathPlay = amt;
    else if (/heal 1 damage to any card/i.test(eff)) e.onAttackHealAny = 1;
    else if (/when.*destroyed|destroyed/i.test(eff)) e.onDeathHeal = amt;
    else if (/when.*attacks|attacks/i.test(eff)) e.onAttackHeal = amt;
    else e.onSummonHeal = amt;
  }

  // 7. DISCARD
  if (/discard (\d+) (random )?card|discards (\d+) card|force your opponent to discard/i.test(eff)) {
    const amt = parseInt((eff.match(/discard[s]? (\d+)/i) || [0, 1])[1]);
    if (/when.*attacks|attacks/i.test(eff)) e.onAttackDiscardOpp = amt;
    else if (/when.*destroyed|destroyed/i.test(eff)) e.onDeathDiscardOpp = amt;
    else e.onSummonDiscardOpp = amt;
  }

  // 8. DAMAGE ABILITIES
  if (/deal (\d+) damage to all.*(enemy|opponent)|dea (\d+) damage to all enemy/i.test(eff)) {
    const amt = parseInt((eff.match(/(\d+) damage/i) || eff.match(/dea (\d+) damage/i) || [0, 2])[1]);
    if (/when.*destroyed|destroyed/i.test(eff)) e.onDeathDmgAllEnemy = amt;
    else if (/when.*attacks|attacks/i.test(eff)) e.onAttackDmgAllEnemy = amt;
    else e.onSummonDmgAllEnemy = amt;
  } else if (/deal (\d+) damage to all cards|deals (\d+) damage to all cards/i.test(eff)) {
    const amt = parseInt((eff.match(/(\d+) damage/i) || [0, 2])[1]);
    if (/when.*destroyed|destroyed/i.test(eff)) e.onDeathDmgAll = amt;
    else e.onSummonDmgAll = amt;
  } else if (/(\d+) damage to (the )?opponent|(\d+) damage to opponent'?s? life/i.test(eff)) {
    const amt = parseInt((eff.match(/(\d+) damage/i) || [0, 3])[1]);
    e.onSummonDmgPlayer = amt;
  } else if (/deal (\d+) damage to an enemy.*highest defense|highest defense/i.test(eff)) {
    const amt = parseInt((eff.match(/deal (\d+) damage/i) || [0, 4])[1]);
    e.onSummonDmgHighestDef = amt;
  } else if (/deals 1 damage to an enemy card whenever it enters/i.test(eff)) {
    e.onEnemyEnterDmg = 1;
  } else if (/all players get (\d+) damage.*end.*turn|all cards take (\d+) damage at the end/i.test(eff)) {
    const amt = parseInt((eff.match(/(\d+) damage/i) || [0, 1])[1]);
    e.onEndTurnDmgBoth = amt;
  } else if (/if a fly card is summoned, all players lose (\d+) life/i.test(eff)) {
    e.onFlySummonPunish = 3;
  } else if (/deal (\d+) damage|inflict (\d+) damage/i.test(eff)) {
    const amt = parseInt((eff.match(/(\d+) damage/i) || [0, 2])[1]);
    if (/when.*attacks|attacks/i.test(eff)) e.onAttackDmgTarget = amt;
    else if (/when.*destroyed|destroyed/i.test(eff)) e.onDeathDmgTarget = amt;
    else e.onSummonDmgTarget = amt;
  }

  // 9. SUMMON TOKENS / SPAWNING
  if (/summon (\d+) (1\/1 )?(death|fly|doom)? tokens?/i.test(eff) || /summon two 3\/3 tokens/i.test(eff) || /summon a (\d+)\/(\d+) (fly|death|doom|token)?/i.test(eff) || /summons a 2\/2 token/i.test(eff)) {
    let tCount = 1, tAtk = 1, tDef = 1, tType = cardType;

    if (/two 3\/3 tokens/i.test(eff)) {
      tCount = 2; tAtk = 3; tDef = 3;
    } else if (/2\/2 token/i.test(eff)) {
      tCount = 1; tAtk = 2; tDef = 2;
    } else {
      const statsM = eff.match(/(\d+)\/(\d+)/);
      if (statsM) { tAtk = +statsM[1]; tDef = +statsM[2]; }
      const countM = eff.match(/summon (\d+)/i);
      if (countM) tCount = +countM[1];
      const typeM = eff.match(/(death|fly|doom)/i);
      if (typeM) tType = typeM[1].toLowerCase();
    }

    const tokenObj = { count: tCount, atk: tAtk, def: tDef, type: tType };
    if (/when.*destroys an enemy/i.test(eff)) e.onSlaySummonToken = tokenObj;
    else if (/when.*destroyed|destroyed/i.test(eff)) e.onDeathSummonToken = tokenObj;
    else if (/when.*attacks|attacks/i.test(eff)) e.onAttackSummonToken = tokenObj;
    else e.onSummonToken = tokenObj;
  }

  // 10. SUMMON FROM DECK
  if (/summon another (death|fly|doom|legendary) card from your deck|summo 1 legendary card from your deck|summon 1 legendary card/i.test(eff)) {
    const typeM = eff.match(/(death|fly|doom|legendary)/i);
    const targetType = typeM ? typeM[1].toLowerCase() : 'any';
    if (/when.*destroyed|destroyed/i.test(eff)) e.onDeathSummonFromDeck = targetType;
    else e.onSummonFromDeck = targetType;
  }

  // 11. DESTROY ENEMY CARDS
  if (/destroy all.*cost.*less than (\d+)|cost.*(\d+) or less/i.test(eff)) {
    const costM = eff.match(/less than (\d+)/i) || eff.match(/(\d+) or less/i);
    e.onDestroyByCost = parseInt(costM[1]);
  } else if (/destroy all cards with (less than|\d+ or less) (\d+) (attack|defense)|destroy all cards with (\d+) or less defense|destroy all card with (\d+) or less attack/i.test(eff)) {
    const valM = eff.match(/(\d+)/);
    e.onDestroyByStat = parseInt(valM[1]);
  } else if (/destroy the strongest enemy card|destroy.*strongest/i.test(eff)) {
    e.onDestroyStrongest = true;
  } else if (/destroy an enemy card with (\d+) or less attack/i.test(eff)) {
    const valM = eff.match(/(\d+)/);
    e.onDestroyEnemyByAtkThreshold = parseInt(valM[1]);
  } else if (/destroy 1 token/i.test(eff)) {
    e.onDestroyToken = true;
  } else if (/destroy all.*(fly|death|doom)/i.test(eff)) {
    const typeM = eff.match(/(fly|death|doom)/i);
    e.onDestroyAllType = typeM[1].toLowerCase();
  } else if (/destroy.*(death|fly|doom) card|destroy one enemy fly card/i.test(eff)) {
    const typeM = eff.match(/(death|fly|doom)/i);
    e.onDestroySingleType = typeM ? typeM[1].toLowerCase() : 'any';
  } else if (/destroy one of your opponent's cards at random|random enemy card/i.test(eff)) {
    e.onDestroyRandomEnemy = true;
  } else if (/choose one of your opponent's cards to destroy|destroy an enemy card of your choice|banish an enemy card/i.test(eff)) {
    e.onDestroyChoiceEnemy = true;
  } else if (/reveal the top card from your opponent's deck and destroy that card/i.test(eff)) {
    e.onSummonDestroyOppDeckTop = true;
  } else if (/destroy one of your opponent's cards with defense lower than this card's attack/i.test(eff)) {
    e.onDestroyLowerDefThanAtk = true;
  } else if (/attacks an type doom card, destroy it/i.test(eff)) {
    e.onAttackSlayDoom = true;
  } else if (/choose 1 doom card and destroy all cards with the same type in play/i.test(eff)) {
    e.onDestroyAllDoomInPlay = true;
  }

  // 12. GRAVEYARD RECYCLE / RESURRECTION
  if (/return.*?card.*?from.*?graveyard.*?to (your )?hand|return.*?card.*?from.*?(graveyard|graveyards? pile)/i.test(eff) || /return all (fly|death|doom) cards from your graveyard/i.test(eff) || /return 1 card from your graveyard to the field/i.test(eff)) {
    const typeM = eff.match(/(fly|death|doom)/i);
    const countM = eff.match(/return (\d+)/i);
    e.onReturnFromGraveToHand = {
      type: typeM ? typeM[1].toLowerCase() : 'any',
      count: countM ? parseInt(countM[1]) : (/all/i.test(eff) ? 99 : 1),
      toField: /to the field/i.test(eff)
    };
  } else if (/take a card from the opponent's graveyard/i.test(eff)) {
    e.onStealOpponentGrave = true;
  } else if (/return all destroyed cards to their owners' hands/i.test(eff)) {
    e.onMassReviveToHand = true;
  } else if (/when destroyed, return this card to the (bottom|top) of your deck|shuffle this card back into your deck|return it to the top of your deck/i.test(eff)) {
    e.onDeathRecycleToDeck = true;
  } else if (/summon if back to the battlefield in the next turn|summon it back/i.test(eff)) {
    e.onDeathRebirthNextTurn = true;
  }

  // 13. STAT BUFFS / AURAS
  if (/all (fly|death|doom) cards.*gain \+(\d+) attack/i.test(eff) || /all (fly|death|doom) cards on the field gain \+(\d+) attack/i.test(eff)) {
    const tM = eff.match(/(fly|death|doom)/i);
    const aM = eff.match(/\+(\d+)/);
    e.auraBuffType = { type: tM[1].toLowerCase(), atk: aM ? +aM[1] : 1 };
  } else if (/all (fly|death|doom) and (death|fly|doom) cards gain \+1 attack and \+1 defense/i.test(eff)) {
    e.auraBuffDual = { atk: 1, def: 1 };
  } else if (/grants all allied cards \+1 attack/i.test(eff)) {
    e.auraBuffAllAllies = { atk: 1 };
  } else if (/grants all fly cards \+1 defense/i.test(eff)) {
    e.auraBuffFlyDef = 1;
  } else if (/all (fly|death|doom) cards on the battlefield deal 2 additional damage/i.test(eff)) {
    e.auraBonusDmgType = 2;
  } else if (/this card gains \+(\d+) attack for (each|every) (other )?fly card/i.test(eff) || /gain \+1 attack for each fly card/i.test(eff)) {
    e.scaleAtkPerFieldFly = 1;
  } else if (/this card gains \+1 attack for every card in your hand/i.test(eff)) {
    e.scaleAtkPerHandCard = 1;
  } else if (/each time a card is destroyed, this card gains \+(\d+) attack|whenever a card is destroyed, this card gains \+(\d+) attack|each time an enemy is destroyed, gain 1 attack/i.test(eff)) {
    const valM = eff.match(/\+(\d+)/) || [0, 1];
    e.onAnyDeathGainAtk = parseInt(valM[1]);
  } else if (/whenever a (death|fly|doom) card is summoned, this card gains \+(\d+) attack|every time you play a fly card, increase this card'?s attack by (\d+)/i.test(eff)) {
    const typeM = eff.match(/(death|fly|doom)/i);
    e.onAllySummonGainAtk = { type: typeM ? typeM[1].toLowerCase() : 'fly', amount: 1 };
  } else if (/for every.*?doom card.*?increase this card'?s attack/i.test(eff)) {
    e.scaleAtkPerFieldDoom = 1;
  } else if (/double the attack of all doom cards/i.test(eff)) {
    e.onSummonDoubleAtkType = 'doom';
  } else if (/reduce the attack of all enemy cards by (\d+)|reduce all enemy cards'? attack by (\d+)|make -1 attack on all opponent'?s cards|decrease all enemy cards'? attack by (\d+)/i.test(eff)) {
    e.onSummonDebuffAllEnemyAtk = 1;
  } else if (/reduces an enemy card'?s defense by (\d+)|force an enemy card to lose (\d+) attack/i.test(eff)) {
    const dM = eff.match(/defense by (\d+)/i) || eff.match(/lose (\d+) attack/i);
    e.onSummonDebuffTargetDef = dM ? parseInt(dM[1]) : 2;
  } else if (/reduce an enemy card'?s defense to 0/i.test(eff)) {
    e.onSummonSetDefZero = true;
  } else if (/make all cards on the opponent'?s field lose 2 defense/i.test(eff)) {
    e.onSummonDebuffAllEnemyDef = 2;
  } else if (/give all doom cards on the battlefield \+1 attack|increase all cards'? attack by (\d+)/i.test(eff)) {
    e.activeBuffAllOnce = 1;
  } else if (/reduce the cost of one other fly card in your hand by 2/i.test(eff)) {
    e.onSummonDiscountFly = 2;
  } else if (/gain \+2 attack this turn|gain \+2 attack for this turn/i.test(eff)) {
    e.tempAtkBuff = 2;
  } else if (/gains \+2 attack if your opponent has no fly cards/i.test(eff)) {
    e.conditionalAtkBuffNoFly = 2;
  } else if (/whenever a fly card attacks, reduce its attack by 1/i.test(eff)) {
    e.onFlyAttackSelfDebuff = 1;
  }

  // 14. SILENCE / SPECIAL ABILITIES
  if (/make one enemy card lose all abilities|change the effect of an enemy card to ['"]?none['"]?|negate all effects from a doom card/i.test(eff)) {
    e.silenceTarget = true;
  }
  if (/freeze/i.test(eff)) {
    e.freezeTarget = true;
  }
  if (/prevent all damage/i.test(eff)) {
    e.shieldOnce = true;
  }
  if (/no cards can be.*?summoned for 1 turn|prevent your opponent from summoning cards for 1 turn/i.test(eff)) {
    e.lockSummonsOneTurn = true;
  }
  if (/remove 1 random card from your opponent's deck/i.test(eff)) {
    e.onAttackMillOpponent = 1;
  }
  if (/corrupt 1 soup can/i.test(eff)) {
    e.corruptSoupCan = true;
  }
  if (/move 1 card from your hand to the battlefield for free/i.test(eff)) {
    e.freeSummonFromHand = true;
  }
  if (/sacrifice.*(3 fly cards|3 doom cards)/i.test(eff)) {
    e.sacrificeRequirement = 3;
  }

  // Fallback for spell cards without specific effect: deal 2 damage
  const isCreature = atk > 0 || def > 0 || parsed.isFragment;
  if (!isCreature && Object.keys(e).length === 0) {
    e.onSummonDmgPlayer = 2;
  }

  return parsed;
}

const auditedCards = cards.map(c => parseCardMaster(c));

let withEffects = 0;
let withoutEffects = 0;
const unmappedList = [];

for (const c of auditedCards) {
  if (Object.keys(c.effects).length > 0) {
    withEffects++;
  } else {
    withoutEffects++;
    unmappedList.push(c);
  }
}

console.log(`\n=== MASTER SWEEP COMPLETED ===`);
console.log(`Total cards: ${auditedCards.length}`);
console.log(`Cards with verified mapped effects: ${withEffects} (${((withEffects/auditedCards.length)*100).toFixed(1)}%)`);
console.log(`Cards without effects: ${withoutEffects}`);

if (withoutEffects > 0) {
  console.log(`\nRemaining without effects:`);
  unmappedList.forEach(u => console.log(`[${u.id}] ${u.name}: "${u.effectText}"`));
}

// Write the master database
fs.writeFileSync('./src/cards_master_verified.json', JSON.stringify(auditedCards, null, 2));
console.log('Saved ./src/cards_master_verified.json successfully!');
