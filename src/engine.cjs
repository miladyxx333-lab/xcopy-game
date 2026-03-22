const cardsData = require('./cards.json');

module.exports.parseCardData = (id) => {
  if (!id) return { id: '??', rawText: '', cost: 0, attack: 0, defense: 0, isCreature: false, effects: {} };
  if (id.startsWith('TOKEN_')) {
    const m = id.match(/TOKEN_(\d+)_(\d+)/);
    const type = id.includes('_DEATH') ? 'death' : id.includes('_DOOM') ? 'doom' : id.includes('_FLY') ? 'fly' : 'neutral';
    return { id, rawText: 'Token', cost: 0, attack: m ? +m[1] : 1, defense: m ? +m[2] : 1, isCreature: true, cardType: type, effects: {} };
  }
  const c = cardsData.find(c => c.id === id) || { id, rawText: 'No Data' };
  const txt = (c.rawText || '').toLowerCase();

  let cost = 0, atk = 0, def = 0;
  const cMatch = txt.match(/cost[: ]*\s*(\d+)/); if (cMatch) cost = parseInt(cMatch[1]);
  const aMatch = txt.match(/attack[: ]*\s*(\d+)/) || txt.match(/atk[: ]*\s*(\d+)/); if (aMatch) atk = parseInt(aMatch[1]);
  const dMatch = txt.match(/defense[: ]*\s*(\d+)/) || txt.match(/def[: ]*\s*(\d+)/); if (dMatch) def = parseInt(dMatch[1]);

  let cardType = 'neutral';
  if (txt.includes('fly')) cardType = 'fly';
  else if (txt.includes('doom')) cardType = 'doom';
  else if (txt.includes('death')) cardType = 'death';
  else if (txt.includes('legendary')) cardType = 'legendary';

  const isFragment = txt.includes('fragment of creation -') || txt.includes('soul fragment') || txt.includes('mind fragment') || txt.includes('body fragment');
  const isCreature = ((atk > 0 || def > 0) || (id !== "0" && isFragment)) && id !== "0";
  const isSpell = !isCreature && id !== "0";

  const e = {};
  const eff = (txt.match(/effect:([^]*?)(?:flavor|$)/i) || ['', txt])[1];

  // PASSIVE TRIGGERS
  if (/whenever.*destroyed/i.test(eff) || /when.*destroyed/i.test(eff)) {
    if (/gain (\d+) soup/i.test(eff) || /gain (\d+) can/i.test(eff)) e.passiveOnDeathGainSoup = parseInt((eff.match(/gain (\d+)/i) || [0, 1])[1]);
    if (/deal (\d+) damage to all/i.test(eff)) e.passiveOnDeathDmgAll = parseInt((eff.match(/deal (\d+)/i) || [0, 2])[1]);
    if (/heal|gain.*life/i.test(eff)) e.passiveOnDeathHeal = parseInt((eff.match(/(\d+).*life/i) || eff.match(/heal.*?(\d+)/i) || [0, 2])[1]);
    if (/death/i.test(eff)) e.passiveTriggerType = 'death';
    else if (/fly/i.test(eff)) e.passiveTriggerType = 'fly';
    else if (/doom/i.test(eff)) e.passiveTriggerType = 'doom';
    else if (/enemy/i.test(eff)) e.passiveTriggerType = 'enemy';
  }

  // SUMMON EFFECTS
  if (/gain (\d+) soup/i.test(eff)) e.onSummonGainSoup = parseInt((eff.match(/gain (\d+) soup/i) || [0, 1])[1]);
  if (/draw (\d+) card/i.test(eff)) {
     const drawM = eff.match(/draw (\d+)/i);
     if (drawM && !/attack.*draw/i.test(eff) && !/opponent.*draw/i.test(eff)) e.onSummonDraw = parseInt(drawM[1]);
     if (/attack.*draw/i.test(eff)) e.onAttackDraw = parseInt(drawM[1]);
  }
  if (/heal|gain.*life|extra life/i.test(eff)) {
    const healM = eff.match(/(\d+).*life/i) || eff.match(/heal.*?(\d+)/i) || eff.match(/(\d+).*health/i);
    if (healM) e.onSummonHeal = parseInt(healM[1]);
  }
  if (/discard.*opponent/i.test(eff)) {
    const discardM = eff.match(/discard.*?(\d+)/i) || eff.match(/(\d+).*discard/i);
    const amt = discardM ? parseInt(discardM[1]) : 1;
    if (/once per turn/i.test(eff)) e.onAttackDiscardOpp = amt;
    else e.onSummonDiscardOpp = amt;
  }
  if (/deal (\d+) damage to all.*enem/i.test(eff)) e.onSummonDmgAllEnemy = parseInt((eff.match(/deal (\d+) damage/i) || [0, 2])[1]);
  if (/deal (\d+) damage to all card/i.test(eff)) e.onSummonDmgAll = parseInt((eff.match(/deal (\d+) damage/i) || [0, 2])[1]);
  if (/damage to.*opponent.*life|damage to opponent/i.test(eff)) e.onSummonDmgPlayer = parseInt((eff.match(/(\d+) damage/i) || [0, 2])[1]);
  
  if (/deal (\d+) damage/i.test(eff) && !/all/i.test(eff)) {
    const amt = parseInt((eff.match(/deal (\d+) damage/i) || [0, 2])[1]);
    if (/once per turn/i.test(eff)) { e.onAttackDmgTarget = amt; e.oncePerTurn = true; }
    else if (!/attack/i.test(eff)) { e.onSummonDmgTargetEnemy = amt; }
  }
  
  if (/destroy all.*fly/i.test(eff)) e.onSummonDestroyTypeFly = true;
  if (/destroy all.*death/i.test(eff)) e.onSummonDestroyTypeDeath = true;
  if (/destroy all.*doom/i.test(eff)) e.onSummonDestroyTypeDoom = true;
  if (/destroy.*strongest/i.test(eff)) e.onSummonDestroyStrongest = true;
  if (/summon/i.test(eff)) {
    const tm = eff.match(/summon.*?(\d+).*?(\d+)\/(\d+)/i);
    if (tm) e.onSummonToken = { count: +tm[1], atk: +tm[2], def: +tm[3] };
    else if (/summon/i.test(eff)) e.onSummonTokenGeneric = true;
  }

  if (/counter/i.test(eff)) e.onSummonCounter = true;
  if (/discard.*entire.*hand|hand.*reset/i.test(eff)) e.onSummonWheel = true;
  if (/combined.*fragment|fragments? of creation/i.test(eff)) e.winCombo = true;

  if (isSpell && Object.keys(e).length === 0) e.onSummonDmgPlayer = 2;
  e.isInstant = isSpell;

  return { id, cost, attack: atk, defense: def, isCreature, cardType, effects: e, rawText: c.rawText };
};
