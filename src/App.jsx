import { useState, useEffect, useRef, useCallback } from 'react'
import cardsData from './cards.json'
import './index.css'

// ==========================================
// AGENT: CARD PARSER ENGINE V5.0
// Full OCR text -> Structured Effect Map
// Category coverage:
//   ON_SUMMON: draw, heal, gainSoup, dmgAll, dmgPlayer, discardOpp, destroyTarget, destroyByDef, destroyByAtk, destroyByCost, destroyType
//   ON_ATTACK: draw, discardOpp, dmgAllEnemy, dmgPlayer, summonToken
//   ON_DEATH:  dmgAll, dmgPlayer, gainSoup, summonToken, returnToDeck
//   PASSIVE:   counter, isInstant
// ==========================================
const parseCardData = (id) => {
  if (!id) return { id: '??', rawText: '', cost: 0, attack: 0, defense: 0, isCreature: false, effects: {} };
  if (id.startsWith('TOKEN_')) {
    const m = id.match(/TOKEN_(\d+)_(\d+)/);
    const type = id.includes('_DEATH') ? 'death' : id.includes('_DOOM') ? 'doom' : id.includes('_FLY') ? 'fly' : 'neutral';
    return { id, rawText: 'Token', cost: 0, attack: m ? +m[1] : 1, defense: m ? +m[2] : 1, isCreature: true, cardType: type, effects: {} };
  }
  const c = cardsData.find(c => c.id === id) || { id, rawText: 'No Data' };
  const txt = (c.rawText || '').toLowerCase();

  let cost = 0;
  const cMatch = txt.match(/cost[: ]*\s*(\d+)/);
  if (cMatch) cost = parseInt(cMatch[1]);
  else if (id !== "0") cost = 3; // Default cost for unreadable OCR
  if (id === "0") cost = 0;

  let atk = 0;
  const aMatch = txt.match(/attack[: ]*\s*(\d+)/) || txt.match(/atk[: ]*\s*(\d+)/);
  if (aMatch) atk = parseInt(aMatch[1]);

  let def = 0;
  const dMatch = txt.match(/defense[: ]*\s*(\d+)/) || txt.match(/def[: ]*\s*(\d+)/);
  if (dMatch) def = parseInt(dMatch[1]);

  let cardType = 'neutral';
  if (txt.includes('fly')) cardType = 'fly';
  else if (txt.includes('doom')) cardType = 'doom';
  else if (txt.includes('death')) cardType = 'death';
  else if (txt.includes('legendary')) cardType = 'legendary';

  const isFragment = txt.includes('fragment of creation -') || txt.includes('soul fragment') || txt.includes('mind fragment') || txt.includes('body fragment');
  const isCreature = ((atk > 0 || def > 0) || (id !== "0" && isFragment)) && id !== "0";
  const isSpell = !isCreature && id !== "0";

  // ---------- EFFECT CLASSIFICATION V6 (COMPREHENSIVE) ----------
  const e = {};
  const eff = (txt.match(/effect:([^]*?)(?:flavor|$)/i) || ['', txt])[1];

  // ====== ON SUMMON ======
  if (/gain (\d+) can/i.test(eff) && !/destroyed/i.test(eff) && !/attack/i.test(eff))
    e.onSummonGainSoup = parseInt((eff.match(/gain (\d+) can/i) || [0, 1])[1]);

  const drawM = eff.match(/draw (\d+) card/i);
  if (drawM && !/attack.*draw/i.test(eff) && !/opponent.*draw/i.test(eff))
    e.onSummonDraw = parseInt(drawM[1]);

  if (/gain (\d+) extra life|gain (\d+).*life|heal.*?(\d+)/i.test(eff)) {
    const healM = eff.match(/gain (\d+).*life/i) || eff.match(/heal.*?(\d+)/i) || eff.match(/(\d+).*health/i) || eff.match(/(\d+).*life/i);
    if (healM) e.onSummonHeal = parseInt(healM[1] || healM[2] || healM[3]);
  }

  if (/discard.*opponent|opponent.*discard|force.*discard/i.test(eff) && !/attack/i.test(eff)) {
    const discardM = eff.match(/discard.*?(\d+)/i) || eff.match(/(\d+).*discard/i);
    const amt = discardM ? parseInt(discardM[1]) : 1;
    if (/once per turn/i.test(eff)) e.onAttackDiscardOpp = amt;
    else e.onSummonDiscardOpp = amt;
  }

  // Damage: all enemy > all cards > player HP > single target
  if (/deal (\d+) damage to all.*enem|deal (\d+) damage to all.*opponent/i.test(eff))
    e.onSummonDmgAllEnemy = parseInt((eff.match(/deal (\d+) damage/i) || [0, 2])[1]);
  else if (/deal (\d+) damage to all card/i.test(eff))
    e.onSummonDmgAll = parseInt((eff.match(/deal (\d+) damage/i) || [0, 2])[1]);
  else if (/(\d+) damage to.*opponent.*life|(\d+) damage to opponent/i.test(eff))
    e.onSummonDmgPlayer = parseInt((eff.match(/(\d+) damage/i) || [0, 2])[1]);
  if (/deal (\d+) damage/i.test(eff) && !/destroyed/i.test(eff) && !/end of/i.test(eff)) {
    const amt = parseInt((eff.match(/deal (\d+) damage/i) || [0, 2])[1]);
    if (/once per turn/i.test(eff)) {
      e.onAttackDmgTarget = amt;
      e.oncePerTurn = true;
      if (/of your choice/i.test(eff)) e.targetChoice = true;
    } else if (!/attack/i.test(eff)) {
      e.onSummonDmgTargetEnemy = amt;
    }
    if (/of your choice/i.test(eff) && !e.onAttackDmgTarget) e.targetChoice = true;
  }

  // Destroy cards
  if (/destroy all.*fly/i.test(eff)) e.onSummonDestroyTypeFly = true;
  else if (/destroy (one|1|a).*fly/i.test(eff)) e.onSummonDestroyOneFly = true;

  if (/destroy all.*death/i.test(eff)) e.onSummonDestroyTypeDeath = true;
  else if (/destroy (one|1|a).*death/i.test(eff)) e.onSummonDestroyOneDeath = true;

  if (/destroy all.*doom|doom.*destroy/i.test(eff)) e.onSummonDestroyTypeDoom = true;
  else if (/destroy (one|1|a).*doom/i.test(eff)) e.onSummonDestroyOneDoom = true;
  if (/destroy all.*cost.*less than (\d+)|destroy all.*cost.*(\d+) or less/i.test(eff))
    e.onSummonDestroyByCost = parseInt((eff.match(/less than (\d+)|(\d+) or less/i) || [0, 5])[1] || 5);
  if (/(\d+) or less (attack|defense)|less than (\d+) attack/i.test(eff))
    e.onSummonDestroyByDef = parseInt((eff.match(/(\d+) or less/i) || eff.match(/less than (\d+)/i) || [0, 3])[1]);
  if (/destroy.*strongest|destroy.*highest/i.test(eff))
    e.onSummonDestroyStrongest = true;
  if (/destroy (\d+).*random.*(enemy|opponent)/i.test(eff) && !e.onSummonDestroyTypeFly && !e.onSummonDestroyTypeDeath && !e.onSummonDestroyByCost && !e.onSummonDestroyStrongest)
    e.onSummonDestroyRandom = parseInt((eff.match(/destroy (\d+)/i) || [0, 1])[1]);

  // Reduce enemy attack
  if (/reduce.*attack/i.test(eff))
    e.onSummonReduceAtk = parseInt((eff.match(/(\d+)/i) || [0, 1])[1]);

  // Summon tokens on entry
  if (/summon/i.test(eff) && !/attack|destroyed/i.test(eff)) {
    const tm = eff.match(/summon.*?(\d+).*?(\d+)\/(\d+)/i);
    if (tm) e.onSummonToken = { count: +tm[1], atk: +tm[2], def: +tm[3] };
    else if (/death token/i.test(eff)) e.onSummonToken = { count: 2, atk: 1, def: 1, type: 'death' };
    else e.onSummonTokenGeneric = true;
  }
  if (e.onSummonToken) {
    if (/death/i.test(eff)) e.onSummonToken.type = 'death';
    else if (/doom/i.test(eff)) e.onSummonToken.type = 'doom';
    else if (/fly/i.test(eff)) e.onSummonToken.type = 'fly';
  }

  // Buff own cards on summon
  if (/all.*fly.*gain \+(\d+)|all.*type.*fly.*\+(\d+)/i.test(eff))
    e.onSummonBuffFly = parseInt((eff.match(/\+(\d+)/i) || [0, 1])[1]);
  if (/all.*doom.*\+(\d+)|all doom.*gain \+(\d+)/i.test(eff))
    e.onSummonBuffDoom = parseInt((eff.match(/\+(\d+)/i) || [0, 1])[1]);

  // Steal
  if (/steal/i.test(eff)) e.onSummonSteal = true;

  // ====== ON ATTACK ======
  if (/attack.*discard|when this card attacks.*discard/i.test(eff))
    e.onAttackDiscardOpp = true;
  if (/attack.*draw (\d+)/i.test(eff))
    e.onAttackDraw = parseInt((eff.match(/draw (\d+)/i) || [0, 1])[1]);
  if (/attack.*deal (\d+) damage.*all/i.test(eff))
    e.onAttackDmgAllEnemy = parseInt((eff.match(/deal (\d+)/i) || [0, 1])[1]);
  else if (/attack.*deal (\d+) damage/i.test(eff))
    e.onAttackDmgPlayer = parseInt((eff.match(/deal (\d+)/i) || [0, 2])[1]);
  if (/attack.*summon.*?(\d+)\/(\d+)/i.test(eff)) {
    const tm = eff.match(/summon.*?(\d+)\/(\d+)/i);
    if (tm) e.onAttackSummonToken = { atk: +tm[1], def: +tm[2] };
  }
  if (/freeze/i.test(eff) && /attack/i.test(eff)) e.onAttackFreeze = true;
  if (/gain.*\+(\d+) attack/i.test(eff) && /attack/i.test(eff) && !/summon/i.test(eff))
    e.onAttackSelfBuff = parseInt((eff.match(/\+(\d+)/i) || [0, 1])[1]);

  // ====== ON DEATH ======
  if (/destroyed.*deal (\d+) damage/i.test(eff))
    e.onDeathDmg = parseInt(eff.match(/deal (\d+)/i)[1]);
  if (/destroyed.*gain (\d+) can/i.test(eff))
    e.onDeathGainSoup = parseInt(eff.match(/gain (\d+)/i)[1]);
  if (/destroyed.*return.*deck|destroyed.*return.*bottom/i.test(eff))
    e.onDeathReturnToDeck = true;
  if (/destroyed.*summon.*?(\d+)\/(\d+)/i.test(eff)) {
    const tm = eff.match(/summon.*?(\d+)\/(\d+)/i);
    if (tm) e.onDeathSummonToken = { atk: +tm[1], def: +tm[2] };
  }

  // ====== PASSIVE AURA ======
  if (/all doom.*gain \+(\d+) attack/i.test(eff))
    e.auraBuff = { type: 'doom', amount: parseInt((eff.match(/\+(\d+)/i) || [0, 1])[1]) };
  else if (/all fly.*gain \+(\d+)/i.test(eff))
    e.auraBuff = { type: 'fly', amount: parseInt((eff.match(/\+(\d+)/i) || [0, 1])[1]) };
  else if (/all.*death.*gain \+(\d+)/i.test(eff))
    e.auraBuff = { type: 'death', amount: parseInt((eff.match(/\+(\d+)/i) || [0, 1])[1]) };

  // Self-buff per card type on field or hand
  if (/this card.*gain.*\+(\d+).*for (each|every)/i.test(eff) || /gain \+(\d+) attack for (each|every)/i.test(eff)) {
    e.selfBuffPerType = true;
    if (/hand/i.test(eff)) e.selfBuffSource = 'hand';
  }

  // ====== COUNTER / INSTANT ======
  if (/counter.*opponent.*card|negat.*opponent.*card/i.test(eff)) e.onSummonCounter = true;
  if (/counter/i.test(eff)) e.isCounter = true;

  // ====== IMMUNITY / SHIELD ======
  if (/cannot be destroyed/i.test(eff)) e.isImmune = true;
  if (/cannot be blocked by death/i.test(eff)) e.unblockableByDeath = true;
  if (/prevent all damage/i.test(eff)) e.hasShield = true;

  // ====== WIN CONDITION (FRAGMENTS) ======
  // ====== PASSIVE TRIGGERS (V9) ======
  if (/whenever.*destroyed/i.test(eff) || /when.*destroyed/i.test(eff)) {
    if (/gain (\d+) soup/i.test(eff) || /gain (\d+) can/i.test(eff)) {
      e.passiveOnDeathGainSoup = parseInt((eff.match(/gain (\d+)/i) || [0, 1])[1]);
    }
    if (/deal (\d+) damage to all/i.test(eff)) {
      e.passiveOnDeathDmgAll = parseInt((eff.match(/deal (\d+)/i) || [0, 2])[1]);
    }
    if (/heal/i.test(eff) || /gain.*life/i.test(eff)) {
      e.passiveOnDeathHeal = parseInt((eff.match(/(\d+).*life/i) || eff.match(/heal.*?(\d+)/i) || [0, 2])[1]);
    }
    if (/death/i.test(eff)) e.passiveTriggerType = 'death';
    else if (/fly/i.test(eff)) e.passiveTriggerType = 'fly';
    else if (/doom/i.test(eff)) e.passiveTriggerType = 'doom';
    else if (/enemy/i.test(eff)) e.passiveTriggerType = 'enemy';
  }
  if (/for every/i.test(eff)) {
     e.onSummonBuffPerCount = parseInt((eff.match(/increase.*?by (\d+)/i) || [0, 1])[1]);
     if (/doom/i.test(eff)) e.buffType = 'doom';
     else if (/death/i.test(eff)) e.buffType = 'death';
     else if (/fly/i.test(eff)) e.buffType = 'fly';
  }

  // ====== LIMITERS ======
  if (/once per game/i.test(eff)) e.oncePerGame = true;
  if (/once per turn/i.test(eff)) e.oncePerTurn = true;

  // ====== WHEEL / DISCARD ALL ======
  if (/discard.*entire.*hand/i.test(eff) || /hand.*reset/i.test(eff) || /wheel/i.test(eff))
    e.onSummonWheel = true;

  // ====== SEARCH DECK / LIBRARY ======
  if (/search.*(deck|library|biblioteca|mazo)|look at.*(deck|library|biblioteca|mazo)|find a card/i.test(eff)) {
    if (/destroyed|death/i.test(eff)) {
      if (/summon/i.test(eff)) e.onDeathSummonFromDeck = true;
      else e.onDeathSearch = true;
    } else {
      e.onSummonSearch = true;
    }
  }

  // ====== GRAVEYARD RETURN ======
  if (/return all destroyed cards to owners' hands/i.test(eff))
    e.onSummonReturnAllGrave = true;
  if (/return.*fragment.*discard pile to.*deck/i.test(eff))
    e.onSummonShuffleFragments = true;

  // ====== SACRIFICE ======
  if (/requires.*sacrifice.*?(\d+)/i.test(eff)) {
    e.requiresSacrifice = parseInt((eff.match(/sacrifice.*?(\d+)/i) || [0, 3])[1]);
    if (/doom/i.test(eff)) e.sacrificeType = 'doom';
    else if (/death/i.test(eff)) e.sacrificeType = 'death';
    else if (/fly/i.test(eff)) e.sacrificeType = 'fly';
  }
  if (/sacrifice (one|1|a) card/i.test(eff) && !e.requiresSacrifice)
    e.sacrificeForEffect = true;

  // ====== DOUBLE ATTACK ======
  if (/double.*attack/i.test(eff))
    e.doubleAttack = true;

  // ====== CORRUPT / DESTROY SOUP ======
  if (/corrupt.*soup|destroy.*can|destroy.*enemy.*can/i.test(eff))
    e.corruptSoup = true;

  // Default spell damage
  if (isSpell && Object.keys(e).filter(k => k !== 'isInstant').length === 0) e.onSummonDmgPlayer = 2;
  e.isInstant = isSpell;

  return { ...c, cost, attack: atk, defense: def, isCreature, cardType, effects: e };
};

const INITIAL_HP = 30;

function App() {
  const [turn, setTurn] = useState('PLAYER');
  const [phase, setPhase] = useState('MAIN');
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);

  const [deck, setDeck] = useState([]);
  const [hand, setHand] = useState([]);
  const [playArea, setPlayArea] = useState([]);
  const [grave, setGrave] = useState([]);
  const [hp, setHp] = useState(INITIAL_HP);
  const [soup, setSoup] = useState({ current: 0, max: 0 });

  const [oppDeck, setOppDeck] = useState([]);
  const [oppHand, setOppHand] = useState([]);
  const [oppPlayArea, setOppPlayArea] = useState([]);
  const [oppGrave, setOppGrave] = useState([]);
  const [oppHp, setOppHp] = useState(INITIAL_HP);
  const [oppSoup, setOppSoup] = useState({ current: 0, max: 0 });

  const [executionStack, setExecutionStack] = useState([]);
  const [log, setLog] = useState(["SYSTEM_ONLINE // ENGINE V5.0 (FULL EFFECTS)", "ALL CARD ABILITIES MAPPED & ARMED."]);

  const [selectedBlocker, setSelectedBlocker] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [zoomedCard, setZoomedCard] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const gsRef = useRef(false);
  gsRef.current = gameStarted;
  const pRef = useRef(playArea);
  useEffect(() => { pRef.current = playArea; }, [playArea]);
  const oRef = useRef(oppPlayArea);
  useEffect(() => { oRef.current = oppPlayArea; }, [oppPlayArea]);
  const winRef = useRef(winner);
  useEffect(() => { winRef.current = winner; }, [winner]);
  const oppSoupRef = useRef(oppSoup);
  useEffect(() => { oppSoupRef.current = oppSoup; }, [oppSoup]);
  const handRef = useRef(hand);
  useEffect(() => { handRef.current = hand; }, [hand]);
  const oppHandRef = useRef(oppHand);
  useEffect(() => { oppHandRef.current = oppHand; }, [oppHand]);

  const addLog = useCallback((msg) => {
    setLog(prev => [...prev.slice(-6), msg]);
  }, []);

  const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });

  const startGame = useCallback(() => {
    const buildDeck = () => {
      let d = Array(15).fill("0");
      const pool = cardsData.filter(c => c.id !== "0" && !c.id.includes("back") && !c.id.includes("DS_Store")).map(c => c.id);
      for (let i = 0; i < 25; i++) d.push(pool[Math.floor(Math.random() * pool.length)]);
      return d.sort(() => Math.random() - 0.5);
    };
    const pD = buildDeck(), aD = buildDeck();
    setHand(pD.splice(0, 7)); setOppHand(aD.splice(0, 7));
    setDeck(pD); setOppDeck(aD);
    setSoup({ current: 3, max: 3 }); setOppSoup({ current: 3, max: 3 });
    setHp(INITIAL_HP); setOppHp(INITIAL_HP);
    setPlayArea([]); setOppPlayArea([]);
    setExecutionStack([]); setGrave([]); setOppGrave([]);
    setTurn('PLAYER'); setPhase('MAIN');
    setWinner(null); setGameStarted(true);
    addLog("> MATCH ENGAGED. 3 BASE SOUP. DRAW 7.");
  }, [addLog]);

  // ---- DRAW ----
  const drawCard = useCallback((isPlayer) => {
    if (winner) return;
    if (isPlayer) {
      setDeck(prev => { 
        if (!prev.length) { setWinner('AI OVERLORD (MILL)'); return prev; } 
        const d = [...prev]; setHand(h => [...h, d.shift()]); return d; 
      });
    } else {
      setOppDeck(prev => { 
        if (!prev.length) { setWinner('PLAYER ONE (MILL)'); return prev; } 
        const d = [...prev]; setOppHand(h => [...h, d.shift()]); return d; 
      });
    }
  }, [winner]);

  // ---- EFFECT HOOKS (V7 - WITH ONCE-PER-GAME ENFORCEMENT) ----
  const runOnSummon = useCallback((info, isPlayer, cardInstanceId) => {
    const e = info.effects;

    // Once-per-game: check if already used, and mark as used
    if (e.oncePerGame && cardInstanceId) {
      const setArea = isPlayer ? setPlayArea : setOppPlayArea;
      let alreadyUsed = false;
      setArea(prev => {
        const card = prev.find(c => c.id === cardInstanceId);
        if (card && card.usedOnceEffect) { alreadyUsed = true; }
        return prev.map(c => c.id === cardInstanceId ? { ...c, usedOnceEffect: true } : c);
      });
      if (alreadyUsed) { addLog(`[EFFECT] ${info.id}: ONCE PER GAME ALREADY USED`); return; }
    }

    if (e.onSummonGainSoup) {
      (isPlayer ? setSoup : setOppSoup)(s => ({ max: s.max + e.onSummonGainSoup, current: s.current + e.onSummonGainSoup }));
      addLog(`[EFFECT] ${info.id}: +${e.onSummonGainSoup} SOUP`);
    }
    if (e.onSummonDraw) {
      for (let i = 0; i < e.onSummonDraw; i++) drawCard(isPlayer);
      addLog(`[EFFECT] ${info.id}: DREW ${e.onSummonDraw} CARD(S)`);
    }
    if (e.onSummonHeal) {
      (isPlayer ? setHp : setOppHp)(h => h + e.onSummonHeal);
      addLog(`[EFFECT] ${info.id}: HEALED ${e.onSummonHeal} HP`);
    }
    if (e.onSummonDmgPlayer) {
      (isPlayer ? setOppHp : setHp)(h => Math.max(0, h - e.onSummonDmgPlayer));
      addLog(`[EFFECT] ${info.id}: ${e.onSummonDmgPlayer} DMG TO ENEMY HP`);
    }
    if (e.onSummonDmgTargetEnemy) {
      const setEnemy = isPlayer ? setOppPlayArea : setPlayArea;
      const setEGrave = isPlayer ? setOppGrave : setGrave;
      setEnemy(prev => {
        if (!prev.length) return prev;
        // If 'choice', pick strongest enemy
        let idx = Math.floor(Math.random() * prev.length);
        if (e.targetChoice) {
          let maxH = -1;
          prev.forEach((c, i) => { const def = parseCardData(c.cardId).defense; if (def > maxH) { maxH = def; idx = i; } });
        }
        const tgt = prev[idx];
        const ci = parseCardData(tgt.cardId);
        if (ci.defense <= e.onSummonDmgTargetEnemy) {
          setEGrave(g => [...g, tgt.cardId]);
          addLog(`[EFFECT] ${info.id}: TARGETED ${tgt.cardId} → DESTROYED`);
          return prev.filter((_, i) => i !== idx);
        }
        addLog(`[EFFECT] ${info.id}: HIT ${tgt.cardId} FOR ${e.onSummonDmgTargetEnemy}`);
        return prev;
      });
    }
    if (e.onSummonDmgAllEnemy) {
      const setEnemy = isPlayer ? setOppPlayArea : setPlayArea;
      const setEGrave = isPlayer ? setOppGrave : setGrave;
      setEnemy(prev => prev.filter(c => {
        const d = parseCardData(c.cardId).defense;
        if (d <= e.onSummonDmgAllEnemy) { setEGrave(g => [...g, c.cardId]); addLog(`[EFFECT] AOE KILLED ${c.cardId}`); return false; }
        addLog(`[EFFECT] ${c.cardId} SURVIVED AOE (DEF ${d} > DMG ${e.onSummonDmgAllEnemy})`);
        return true;
      }));
    }
    if (e.onSummonDmgAll) {
      const dmg = e.onSummonDmgAll;
      setPlayArea(prev => prev.filter(c => { if (parseCardData(c.cardId).defense <= dmg) { setGrave(g => [...g, c.cardId]); return false; } return true; }));
      setOppPlayArea(prev => prev.filter(c => { if (parseCardData(c.cardId).defense <= dmg) { setOppGrave(g => [...g, c.cardId]); return false; } return true; }));
    }
    if (e.onSummonDiscardOpp) {
      (isPlayer ? setOppHand : setHand)(h => { if (!h.length) return h; const n = [...h]; n.splice(Math.floor(Math.random() * n.length), 1); return n; });
      addLog(`[EFFECT] ${info.id}: FORCED DISCARD!`);
    }
    if (e.onSummonWheel) {
      const setOppH = isPlayer ? setOppHand : setHand;
      setOppH([]);
      for (let i = 0; i < 5; i++) drawCard(!isPlayer);
      addLog(`[WHEEL] ${info.id}: OPPONENT HAND HAS BEEN RELOADED!`);
    }
    if (e.onSummonDestroyStrongest) {
      const setEnemy = isPlayer ? setOppPlayArea : setPlayArea;
      const setEGrave = isPlayer ? setOppGrave : setGrave;
      setEnemy(prev => {
        if (!prev.length) return prev;
        let maxAtk = -1, idx = 0;
        prev.forEach((c, i) => { const a = parseCardData(c.cardId).attack; if (a > maxAtk) { maxAtk = a; idx = i; } });
        setEGrave(g => [...g, prev[idx].cardId]);
        addLog(`[EFFECT] DESTROYED STRONGEST: ${prev[idx].cardId}`);
        return prev.filter((_, i) => i !== idx);
      });
    }
    if (e.onSummonDestroyRandom) {
      const setEnemy = isPlayer ? setOppPlayArea : setPlayArea;
      const setEGrave = isPlayer ? setOppGrave : setGrave;
      for (let dr = 0; dr < e.onSummonDestroyRandom; dr++) {
        setEnemy(prev => {
          if (!prev.length) return prev;
          const idx = Math.floor(Math.random() * prev.length);
          setEGrave(g => [...g, prev[idx].cardId]);
          addLog(`[EFFECT] DESTROYED RANDOM: ${prev[idx].cardId}`);
          return prev.filter((_, i) => i !== idx);
        });
      }
    }
    if (e.onSummonDestroyByCost) {
      const threshold = e.onSummonDestroyByCost;
      setPlayArea(prev => prev.filter(c => { if (parseCardData(c.cardId).cost <= threshold) { setGrave(g => [...g, c.cardId]); return false; } return true; }));
      setOppPlayArea(prev => prev.filter(c => { if (parseCardData(c.cardId).cost <= threshold) { setOppGrave(g => [...g, c.cardId]); return false; } return true; }));
    }
    if (e.onSummonDestroyTypeFly || e.onSummonDestroyTypeDeath || e.onSummonDestroyTypeDoom) {
      const type = e.onSummonDestroyTypeFly ? 'fly' : e.onSummonDestroyTypeDeath ? 'death' : 'doom';
      const setEnemy = isPlayer ? setOppPlayArea : setPlayArea;
      const setEGrave = isPlayer ? setOppGrave : setGrave;
      setEnemy(prev => prev.filter(c => {
        const pd = parseCardData(c.cardId);
        if (pd.cardType === type || pd.rawText.toLowerCase().includes(type)) { setEGrave(g => [...g, c.cardId]); addLog(`[EFFECT] DESTROYED ${type.toUpperCase()}: ${c.cardId}`); return false; }
        return true;
      }));
    }
    if (e.onSummonDestroyOneFly || e.onSummonDestroyOneDeath || e.onSummonDestroyOneDoom) {
      const type = e.onSummonDestroyOneFly ? 'fly' : e.onSummonDestroyOneDeath ? 'death' : 'doom';
      const setEnemy = isPlayer ? setOppPlayArea : setPlayArea;
      const setEGrave = isPlayer ? setOppGrave : setGrave;
      setEnemy(prev => {
        const idx = prev.findIndex(c => {
          const pd = parseCardData(c.cardId);
          return pd.cardType === type || pd.rawText.toLowerCase().includes(type);
        });
        if (idx > -1) {
          setEGrave(g => [...g, prev[idx].cardId]);
          addLog(`[EFFECT] ${info.id}: DESTROYED ONE ${type.toUpperCase()} CARD`);
          return prev.filter((_, i) => i !== idx);
        }
        return prev;
      });
    }
    if (e.onSummonReduceAtk) {
      (isPlayer ? setOppPlayArea : setPlayArea)(prev => prev.map(c => ({ ...c, atkMod: (c.atkMod || 0) - e.onSummonReduceAtk })));
    }
    if (e.onSummonToken) {
      const count = e.onSummonToken.count || 1;
      const tkType = e.onSummonToken.type ? `_${e.onSummonToken.type.toUpperCase()}` : "";
      const tkId = `TOKEN_${e.onSummonToken.atk}_${e.onSummonToken.def}${tkType}`;
      const tokens = Array.from({ length: count }, () => ({ 
        id: Math.random().toString(), 
        cardId: tkId, 
        canAttack: false, 
        isAttacking: false, 
        blockedBy: null, 
        atkMod: 0,
        usedOnceEffect: false,
        usedTurnEffect: false
      }));
      (isPlayer ? setPlayArea : setOppPlayArea)(prev => [...prev, ...tokens]);
      addLog(`[EFFECT] ${info.id}: SUMMONED ${count}x ${e.onSummonToken.atk}/${e.onSummonToken.def} ${e.onSummonToken.type || 'NEUTRAL'} TOKENS`);
    }
    if (e.onSummonBuffFly) {
      (isPlayer ? setPlayArea : setOppPlayArea)(prev => prev.map(c => {
        if (parseCardData(c.cardId).rawText.toLowerCase().includes('fly')) return { ...c, atkMod: (c.atkMod || 0) + e.onSummonBuffFly };
        return c;
      }));
      addLog(`[EFFECT] ${info.id}: ALL FLY +${e.onSummonBuffFly} ATK`);
    }
    if (e.onSummonBuffDoom) {
      (isPlayer ? setPlayArea : setOppPlayArea)(prev => prev.map(c => {
        if (parseCardData(c.cardId).rawText.toLowerCase().includes('doom')) return { ...c, atkMod: (c.atkMod || 0) + e.onSummonBuffDoom };
        return c;
      }));
      addLog(`[EFFECT] ${info.id}: ALL DOOM +${e.onSummonBuffDoom} ATK`);
    }
    if (e.onSummonSteal) {
      const setEnemy = isPlayer ? setOppPlayArea : setPlayArea;
      setEnemy(prev => {
        if (!prev.length) return prev;
        const idx = Math.floor(Math.random() * prev.length);
        addLog(`[EFFECT] ${info.id}: STOLE STATS FROM ${prev[idx].cardId}`);
        return prev;
      });
    }
    // Wheel effect (#247)
    if (e.onSummonWheel) {
      const setOppH = isPlayer ? setOppHand : setHand;
      setOppH([]);
      // Draw 5 for the opponent
      for (let i = 0; i < 5; i++) drawCard(!isPlayer);
      addLog(`[WHEEL] ${info.id}: OPPONENT HAND HAS BEEN RELOADED!`);
    }
    // Return all graveyard cards to hand (#120)
    if (e.onSummonCounter) {
      setExecutionStack(prev => {
        if (!prev.length) { addLog("> COUNTER: NOTHING IN STACK TO NEGATE"); return prev; }
        const last = prev[prev.length - 1];
        // If the last card in stack is from opponent, negate it
        if (last.owner !== (isPlayer ? 'PLAYER' : 'AI')) {
           const negatedCid = last.cardId;
           addLog(`[COUNTER] ${info.id}: NEGATED ${negatedCid}!`);
           (isPlayer ? setOppGrave : setGrave)(g => [...g, negatedCid]);
           return prev.slice(0, -1);
        }
        addLog("> COUNTER: CANNOT NEGATE OWN STACK");
        return prev;
      });
    }
    if (e.onSummonReturnAllGrave) {
      setHand(prev => [...prev, ...grave]);
      setOppHand(prev => [...prev, ...oppGrave]);
      setGrave([]);
      setOppGrave([]);
      addLog(`[EFFECT] ${info.id}: ALL GRAVEYARDS RETURNED TO HANDS`);
    }
    // Shuffle fragments from grave into deck (#244)
    if (e.onSummonShuffleFragments) {
      const myGrave = isPlayer ? grave : oppGrave;
      const setMyGrave = isPlayer ? setGrave : setOppGrave;
      const setMyDeck = isPlayer ? setDeck : setOppDeck;
      const frags = myGrave.filter(cid => parseCardData(cid).effects.winCombo);
      const others = myGrave.filter(cid => !parseCardData(cid).effects.winCombo);
      setMyGrave(others);
      setMyDeck(prev => [...prev, ...frags].sort(() => Math.random() - 0.5));
      addLog(`[EFFECT] ${info.id}: RETURNED ${frags.length} FRAGMENTS TO DECK`);
    }
    // Search Deck / Library (randomized for simplicity)
    if (e.onSummonSearch) {
      const setD = isPlayer ? setDeck : setOppDeck;
      const setH = isPlayer ? setHand : setOppHand;
      setD(prev => {
        if (!prev.length) { addLog("! LIBRARY EMPTY"); return prev; }
        const d = [...prev];
        const idx = Math.floor(Math.random() * d.length);
        const cardFound = d.splice(idx, 1)[0];
        setH(h => [...h, cardFound]);
        return d;
      });
      addLog(`[EFFECT] ${info.id}: SEARCHED LIBRARY & DREW 1 CARD`);
    }
    // Win Combo: Fragments of Creation
    if (e.winCombo) {
      const myHand = isPlayer ? handRef.current : oppHandRef.current;
      const myField = isPlayer ? pRef.current : oRef.current;
      const allCards = [...myHand, ...myField.map(c => c.cardId)];
      const fragmentsFound = new Set();
      allCards.forEach(cid => {
        if (!cid) return;
        const d = parseCardData(cid);
        if (d.effects.winCombo) {
           // We identify fragments by their unique name keywords in rawText or ID
           if (d.rawText.toLowerCase().includes('soul')) fragmentsFound.add('soul');
           if (d.rawText.toLowerCase().includes('mind')) fragmentsFound.add('mind');
           if (d.rawText.toLowerCase().includes('body')) fragmentsFound.add('body');
           if (d.rawText.toLowerCase().includes('heart')) fragmentsFound.add('heart');
           if (d.rawText.toLowerCase().includes('life')) fragmentsFound.add('life');
        }
      });
      // If played card itself is one of them, it should be in fragmentsFound already (if it's on field)
      if (fragmentsFound.size >= 5) {
        addLog(`[ULTIMATE] FRAGMENTS OF CREATION ASSEMBLED!`);
        setTimeout(() => setWinner(isPlayer ? 'PLAYER ONE' : 'AI OVERLORD'), 1000);
      }
    }
    // Self-buff per type on field or hand (V7.1 Dynamic)
    if (e.selfBuffPerType) {
      let count = 0;
      let label = "";
      if (e.selfBuffSource === 'hand') {
        count = isPlayer ? handRef.current.length : oppHandRef.current.length;
        label = "CARDS IN HAND";
      } else {
        const type = /fly/i.test(info.id) || /fly/i.test(info.rawText) ? 'fly' : /doom/i.test(info.id) || /doom/i.test(info.rawText) ? 'doom' : 'death';
        const myArea = isPlayer ? pRef.current : oRef.current;
        count = myArea.filter(c => parseCardData(c.cardId).rawText.toLowerCase().includes(type) || c.cardId === info.id).length;
        label = `${type.toUpperCase()} COUNT`;
      }
      
      if (count > 0) {
        (isPlayer ? setPlayArea : setOppPlayArea)(prev => prev.map(c => 
          (c.id === cardInstanceId) ? { ...c, atkMod: (c.atkMod || 0) + count } : c
        ));
        addLog(`[EFFECT] ${info.id}: SELF-BUFF +${count} ATK (${label})`);
      }
    }
    // Double Attack: all doom cards get 2x attack this turn
    if (e.doubleAttack) {
      (isPlayer ? setPlayArea : setOppPlayArea)(prev => prev.map(c => {
        const pd = parseCardData(c.cardId);
        if (pd.cardType === 'doom' || pd.rawText.toLowerCase().includes('doom'))
          return { ...c, atkMod: (c.atkMod || 0) + (pd.attack || 0) };
        return c;
      }));
      addLog(`[EFFECT] ${info.id}: DOUBLED ALL DOOM ATK!`);
    }
    // Corrupt soup
    if (e.corruptSoup) {
      (isPlayer ? setOppSoup : setSoup)(s => ({ ...s, max: Math.max(0, s.max - 1), current: Math.max(0, s.current - 1) }));
      addLog(`[EFFECT] ${info.id}: CORRUPTED 1 ENEMY SOUP CAN`);
    }
    // Sacrifice for effect: sacrifice 1 own card to get a benefit
    if (e.sacrificeForEffect) {
      (isPlayer ? setPlayArea : setOppPlayArea)(prev => {
        if (prev.length <= 1) return prev; // Don't sacrifice self
        const sacrificeIdx = prev.findIndex(c => c.cardId !== info.id && !c.cardId.startsWith('TOKEN'));
        if (sacrificeIdx === -1) return prev;
        const sacrificed = prev[sacrificeIdx];
        (isPlayer ? setGrave : setOppGrave)(g => [...g, sacrificed.cardId]);
        addLog(`[EFFECT] ${info.id}: SACRIFICED ${sacrificed.cardId}`);
        return prev.filter((_, i) => i !== sacrificeIdx);
      });
    }
  }, [addLog, drawCard]);

  const runOnDeath = useCallback((cardId, isPlayer) => {
    const e = parseCardData(cardId).effects;
    if (e.onDeathGainSoup) {
      (isPlayer ? setSoup : setOppSoup)(s => ({ ...s, max: s.max + e.onDeathGainSoup, current: s.current + e.onDeathGainSoup }));
      addLog(`[DEATH] ${cardId}: +${e.onDeathGainSoup} SOUP`);
    }
    if (e.onDeathDmg) {
      const setEnemy = isPlayer ? setOppPlayArea : setPlayArea;
      const setEGrave = isPlayer ? setOppGrave : setGrave;
      setEnemy(prev => prev.filter(c => { if (parseCardData(c.cardId).defense <= e.onDeathDmg) { setEGrave(g => [...g, c.cardId]); return false; } return true; }));
      addLog(`[DEATH] ${cardId}: AOE ${e.onDeathDmg} DMG`);
    }
    if (e.onDeathDmgPlayer) {
      (isPlayer ? setOppHp : setHp)(h => Math.max(0, h - e.onDeathDmgPlayer));
      addLog(`[DEATH] ${cardId}: ${e.onDeathDmgPlayer} DMG TO ENEMY HP`);
    }
    if (e.onDeathReturnToDeck) {
      (isPlayer ? setDeck : setOppDeck)(d => [...d, cardId]);
      addLog(`[DEATH] ${cardId}: RETURNED TO DECK`);
    }
    if (e.onDeathSummonToken) {
      const tkId = `TOKEN_${e.onDeathSummonToken.atk}_${e.onDeathSummonToken.def}`;
      const token = { id: Math.random().toString(), cardId: tkId, canAttack: false, isAttacking: false, blockedBy: null, atkMod: 0, usedOnceEffect: false, usedTurnEffect: false };
      (isPlayer ? setPlayArea : setOppPlayArea)(prev => [...prev, token]);
      addLog(`[DEATH] ${cardId}: SPAWNED ${e.onDeathSummonToken.atk}/${e.onDeathSummonToken.def} TOKEN`);
    }
    // Death Search / Summon from deck
    if (e.onDeathSearch || e.onDeathSummonFromDeck) {
      const setD = isPlayer ? setDeck : setOppDeck;
      const setArea = isPlayer ? setPlayArea : setOppPlayArea;
      const setH = isPlayer ? setHand : setOppHand;
      setD(prev => {
        if (!prev.length) return prev;
        const d = [...prev];
        const idx = Math.floor(Math.random() * d.length);
        const cid = d.splice(idx, 1)[0];
        if (e.onDeathSummonFromDeck) {
          const obj = { id: Math.random().toString(), cardId: cid, canAttack: false, isAttacking: false, blockedBy: null, atkMod: 0, usedOnceEffect: false, usedTurnEffect: false };
          setArea(p => [...p, obj]);
          addLog(`[DEATH] ${cardId}: SUMMONED ${cid} FROM LIBRARY`);
        } else {
          setH(h => [...h, cid]);
          addLog(`[DEATH] ${cardId}: SEARCHED LIBRARY FOR ${cid}`);
        }
        return d;
      });
    }
  }, [addLog]);

  const runOnAttack = useCallback((cardId, isPlayer, cardInstanceId) => {
    const e = parseCardData(cardId).effects;

    // Once-per-turn enforcement
    if (e.oncePerTurn && cardInstanceId) {
      const setArea = isPlayer ? setPlayArea : setOppPlayArea;
      let alreadyUsed = false;
      setArea(prev => {
        const card = prev.find(c => c.id === cardInstanceId);
        if (card && card.usedTurnEffect) { alreadyUsed = true; }
        return prev.map(c => c.id === cardInstanceId ? { ...c, usedTurnEffect: true } : c);
      });
      if (alreadyUsed) { addLog(`[ATK] ${cardId}: ONCE PER TURN ALREADY USED`); return; }
    }

    if (e.onAttackDiscardOpp) {
      (isPlayer ? setOppHand : setHand)(h => { if (!h.length) return h; const n = [...h]; n.pop(); return n; });
      addLog(`[ATK] ${cardId}: FORCED DISCARD`);
    }
    if (e.onAttackDraw) {
      for (let i = 0; i < e.onAttackDraw; i++) drawCard(isPlayer);
      addLog(`[ATK] ${cardId}: DREW ${e.onAttackDraw}`);
    }
    if (e.onAttackDmgPlayer) {
      (isPlayer ? setOppHp : setHp)(h => Math.max(0, h - e.onAttackDmgPlayer));
      addLog(`[ATK] ${cardId}: ${e.onAttackDmgPlayer} EXTRA DMG`);
    }
    if (e.onAttackDmgAllEnemy) {
      const setEnemy = isPlayer ? setOppPlayArea : setPlayArea;
      const setEGrave = isPlayer ? setOppGrave : setGrave;
      setEnemy(prev => prev.filter(c => {
        if (parseCardData(c.cardId).defense <= e.onAttackDmgAllEnemy) { setEGrave(g => [...g, c.cardId]); return false; }
        return true;
      }));
      addLog(`[ATK] ${cardId}: AOE ${e.onAttackDmgAllEnemy} DMG`);
    }
    if (e.onAttackSummonToken) {
      const tkId = `TOKEN_${e.onAttackSummonToken.atk}_${e.onAttackSummonToken.def}`;
      const token = { id: Math.random().toString(), cardId: tkId, canAttack: false, isAttacking: false, blockedBy: null, atkMod: 0 };
      (isPlayer ? setPlayArea : setOppPlayArea)(prev => [...prev, token]);
      addLog(`[ATK] ${cardId}: SPAWNED ${e.onAttackSummonToken.atk}/${e.onAttackSummonToken.def} TOKEN`);
    }
    if (e.onAttackFreeze) {
      const setEnemy = isPlayer ? setOppPlayArea : setPlayArea;
      setEnemy(prev => {
        if (!prev.length) return prev;
        const unfrozen = prev.filter(c => c.canAttack);
        if (!unfrozen.length) return prev;
        const idx = prev.findIndex(c => c.id === unfrozen[0].id);
        const n = [...prev]; n[idx] = { ...n[idx], canAttack: false };
        addLog(`[ATK] ${cardId}: FROZE ${n[idx].cardId}`);
        return n;
      });
    }
  }, [addLog, drawCard]);

  // ---- PLAY CARD ----
  const playCard = (index) => {
    const cardId = hand[index];
    const card = parseCardData(cardId);
    const isCounter = card.effects.onSummonCounter || card.effects.isCounter;
    
    // Stack Response: allow Counter if stack has items
    if (executionStack.length > 0 && !isCounter) {
      addLog("! STACK BUSY. WAIT FOR RESOLUTION."); 
      return; 
    }

    const canPlay = (turn === 'PLAYER' && phase === 'MAIN') || (turn === 'AI' && phase === 'DECLARE_BLOCKS' && card.effects.isInstant) || isCounter;
    if (!canPlay) return;

    if (cardId === "0") {
      setHand(h => { const n = [...h]; n.splice(index, 1); return n; });
      setSoup(s => ({ current: s.current + 1, max: s.max + 1 }));
      addLog(`> PLAYER PLAYED SOUP`); return;
    }
    if (soup.current < card.cost) { addLog(`! INSUFFICIENT SOUP (need ${card.cost})`); return; }
    // Sacrifice requirement check
    if (card.effects.requiresSacrifice) {
      const type = card.effects.sacrificeType || '';
      const ownCreatures = playArea.filter(c => {
        if (!type) return c.cardId !== '0' && !c.cardId.startsWith('TOKEN');
        return parseCardData(c.cardId).rawText.toLowerCase().includes(type);
      });
      if (ownCreatures.length < card.effects.requiresSacrifice) {
        addLog(`! NEED ${card.effects.requiresSacrifice} ${type.toUpperCase()} CARDS TO SACRIFICE`);
        return;
      }
    }
    setSoup(s => ({ ...s, current: s.current - card.cost }));
    setHand(h => { const n = [...h]; n.splice(index, 1); return n; });
    setExecutionStack(prev => [...prev, { owner: 'PLAYER', cardId }]);
    addLog(`> QUEUED: ${card.id}`);
  };

  // ---- RESOLVE STACK ----
  const forceResolveStack = useCallback((stack) => {
    let addP = [], addO = [], pendingEffects = [];
    
    stack.forEach(item => {
      const card = parseCardData(item.cardId);
      if (card.isCreature) {
        const obj = { id: Math.random().toString(), cardId: item.cardId, canAttack: false, isAttacking: false, blockedBy: null, atkMod: 0, usedOnceEffect: false, usedTurnEffect: false };
        if (item.owner === 'PLAYER') {
          addP.push(obj);
          addLog(`> SUMMONED: ${card.id}`);
          if (card.effects.requiresSacrifice) {
            let rem = card.effects.requiresSacrifice, type = card.effects.sacrificeType;
            setPlayArea(prev => {
              const res = [];
              for (const c of prev) {
                if (rem > 0 && (type ? parseCardData(c.cardId).rawText.toLowerCase().includes(type) : (c.cardId !== '0' && !c.cardId.startsWith('TOKEN'))))
                  { setGrave(g => [...g, c.cardId]); rem--; }
                else res.push(c);
              }
              return res;
            });
          }
        } else {
          addO.push(obj);
          addLog(`> AI SUMMONED: ${card.id}`);
          if (card.effects.requiresSacrifice) {
            let rem = card.effects.requiresSacrifice, type = card.effects.sacrificeType;
            setOppPlayArea(prev => {
              const res = [];
              for (const c of prev) {
                if (rem > 0 && (type ? parseCardData(c.cardId).rawText.toLowerCase().includes(type) : (c.cardId !== '0' && !c.cardId.startsWith('TOKEN'))))
                  { setOppGrave(g => [...g, c.cardId]); rem--; }
                else res.push(c);
              }
              return res;
            });
          }
        }
        pendingEffects.push({ card, owner: item.owner, instanceId: obj.id });
      } else {
        if (item.owner === 'PLAYER') setGrave(g => [...g, item.cardId]);
        else setOppGrave(g => [...g, item.cardId]);

        if (card.effects.isCounter) {
          const setEnemy = item.owner === 'PLAYER' ? setOppPlayArea : setPlayArea;
          const setEGrave = item.owner === 'PLAYER' ? setOppGrave : setGrave;
          setEnemy(prev => {
            const idx = prev.findIndex(c => c.isAttacking);
            if (idx > -1) { setEGrave(g => [...g, prev[idx].cardId]); addLog(`> COUNTER: DESTROYED ATTACKER!`); return prev.filter((_, i) => i !== idx); }
            return prev;
          });
        }
        pendingEffects.push({ card, owner: item.owner, instanceId: null });
        addLog(`> SPELL RESOLVED: ${card.id}`);
      }
    });

    if (addP.length) setPlayArea(prev => [...prev, ...addP]);
    if (addO.length) setOppPlayArea(prev => [...prev, ...addO]);
    
    // Decouple effect execution to ensure field is updated
    setTimeout(() => {
      pendingEffects.forEach(e => runOnSummon(e.card, e.owner === 'PLAYER', e.instanceId));
    }, 50);

    setExecutionStack([]);
  }, [addLog, runOnSummon]);

  const resolveStack = () => {
    if (!executionStack.length) return;
    forceResolveStack([executionStack[0]]);
    setExecutionStack(prev => prev.slice(1));
  };

  // ---- ATTACK/BLOCK ----
  const toggleAttack = (index) => {
    if (turn !== 'PLAYER' || phase !== 'DECLARE_ATTACKS') return;
    setPlayArea(prev => {
      const n = [...prev]; if (!n[index].canAttack || n[index].cardId === "0") return n;
      n[index] = { ...n[index], isAttacking: !n[index].isAttacking }; return n;
    });
  };
  const selectBlocker = (index) => {
    if (turn !== 'AI' || phase !== 'DECLARE_BLOCKS') return;
    if (!playArea[index].canAttack || playArea[index].cardId === "0") return;
    setSelectedBlocker(index);
    addLog("> SELECT ENEMY ATTACKER TO BLOCK");
  };
  const assignBlocker = (oppIndex) => {
    if (turn !== 'AI' || phase !== 'DECLARE_BLOCKS' || selectedBlocker === null) return;
    if (!oppPlayArea[oppIndex].isAttacking) return;
    setOppPlayArea(prev => { const n = [...prev]; n[oppIndex] = { ...n[oppIndex], blockedBy: playArea[selectedBlocker].id }; return n; });
    setPlayArea(prev => { const n = [...prev]; n[selectedBlocker] = { ...n[selectedBlocker], canAttack: false }; return n; });
    setSelectedBlocker(null);
    addLog(`> BLOCKER ASSIGNED!`);
  };

  // ---- CONFIRM PHASE ----
  const confirmPhase = () => {
    if (turn === 'PLAYER') {
      if (phase === 'MAIN') {
        if (executionStack.length) forceResolveStack(executionStack);
        setPhase('DECLARE_ATTACKS');
      } else if (phase === 'DECLARE_ATTACKS') {
        autoAIBlocks();
      }
    } else if (turn === 'AI' && phase === 'DECLARE_BLOCKS') {
      if (executionStack.length) forceResolveStack(executionStack);
      resolveCombat();
    }
  };

  // ---- AI BLOCKS ----
  const autoAIBlocks = () => {
    let pF = [...pRef.current];
    let oF = [...oRef.current];
    let blockers = oF.filter(c => c.canAttack && c.cardId !== "0");
    const attackers = pF.filter(c => c.isAttacking);

    if (!attackers.length) {
      setPhase('MAIN'); setTurn('AI');
      return;
    }

    let attackerCardIds = [];
    attackers.forEach(a => {
      attackerCardIds.push(a.cardId);
      const ai = pF.findIndex(c => c.id === a.id);
      if (blockers.length) {
        const b = blockers.shift();
        const bi = oF.findIndex(c => c.id === b.id);
        pF[ai] = { ...pF[ai], blockedBy: b.id };
        oF[bi] = { ...oF[bi], canAttack: false };
      }
    });

    setPlayArea(pF);
    setOppPlayArea(oF);
    attackers.forEach(a => runOnAttack(a.cardId, true, a.id));
    setTimeout(() => resolveCombat(), 800);
  };

  // ---- COMBAT RESOLUTION ----
  const resolveCombat = useCallback(() => {
    let dmgP = 0, dmgO = 0;
    let nP = [...pRef.current], nO = [...oRef.current];

    if (turn === 'PLAYER') {
      nP.forEach((a, i) => {
        if (!a.isAttacking) return;
        const ai = parseCardData(a.cardId);
        if (a.blockedBy) {
          const bi = nO.findIndex(c => c.id === a.blockedBy);
          if (bi > -1) {
            const di = parseCardData(nO[bi].cardId);
            if (ai.attack >= di.defense) { setOppGrave(g => [...g, nO[bi].cardId]); runOnDeath(nO[bi].cardId, false); nO[bi] = { ...nO[bi], dead: true }; }
            if (di.attack >= ai.defense) { setGrave(g => [...g, a.cardId]); runOnDeath(a.cardId, true); nP[i] = { ...nP[i], dead: true }; }
          }
        } else { dmgO += ai.attack; }
        nP[i] = { ...nP[i], isAttacking: false, canAttack: false, blockedBy: null };
      });
      if (dmgO) setOppHp(h => Math.max(0, h - dmgO));
      setPlayArea(nP.filter(c => !c.dead));
      setOppPlayArea(nO.filter(c => !c.dead));
      setPhase('MAIN'); setTurn('AI');
    } else {
      nO.forEach((a, i) => {
        if (!a.isAttacking) return;
        const ai = parseCardData(a.cardId);
        runOnAttack(a.cardId, false, a.id);
        if (a.blockedBy) {
          const bi = nP.findIndex(c => c.id === a.blockedBy);
          if (bi > -1) {
            const di = parseCardData(nP[bi].cardId);
            if (ai.attack >= di.defense) { setGrave(g => [...g, nP[bi].cardId]); runOnDeath(nP[bi].cardId, true); nP[bi] = { ...nP[bi], dead: true }; }
            if (di.attack >= ai.defense) { setOppGrave(g => [...g, a.cardId]); runOnDeath(a.cardId, false); nO[i] = { ...nO[i], dead: true }; }
          }
        } else { dmgP += ai.attack; }
        nO[i] = { ...nO[i], isAttacking: false, canAttack: false, blockedBy: null };
      });
      if (dmgP) setHp(h => Math.max(0, h - dmgP));
      setOppPlayArea(nO.filter(c => !c.dead));
      setPlayArea(nP.filter(c => !c.dead));
      setPhase('MAIN'); setTurn('PLAYER');
    }
  }, [turn, runOnDeath, runOnAttack]);

  // ---- PLAYER TURN INIT ----
  useEffect(() => {
    if (!gsRef.current || winRef.current !== null) return;
    if (turn === 'PLAYER' && phase === 'MAIN') {
      setSoup(s => ({ ...s, current: s.max }));
      setPlayArea(prev => prev.map(c => ({ ...c, canAttack: true, isAttacking: false, blockedBy: null, usedTurnEffect: false })));
      setOppPlayArea(prev => prev.map(c => ({ ...c, usedTurnEffect: false })));
      drawCard(true);
      addLog(">> YOUR TURN. READY.");
    }
  }, [turn, addLog, drawCard]);
  // ---- AI TURN ----
  useEffect(() => {
    if (turn !== 'AI' || winRef.current !== null || phase !== 'MAIN') return;
    let live = true;

    const ai = async () => {
      await new Promise(r => setTimeout(r, 500));
      if (!live || winRef.current !== null) return;

      // Reset AI creatures
      setOppPlayArea(prev => prev.map(o => ({ ...o, canAttack: true, isAttacking: false, blockedBy: null, usedTurnEffect: false })));
      setPlayArea(prev => prev.map(c => ({ ...c, usedTurnEffect: false })));
      drawCard(false);

      await new Promise(r => setTimeout(r, 700));
      if (!live || winRef.current !== null) return;

      // ---- AI PLAYS CARDS (using refs, NO setState callbacks) ----
      let currentHand = [...oppHandRef.current];
      let locSoup = oppSoupRef.current.max;
      let maxSoup = oppSoupRef.current.max;
      let pending = [];

      // Play all soup cards
      currentHand = currentHand.filter(c => {
        if (c === "0") { maxSoup++; locSoup++; return false; }
        return true;
      });

      // AI plays at most 2 non-soup cards per turn
      for (let p = 0; p < 2; p++) {
        let affordable = [];
        currentHand.forEach(c => {
          const info = parseCardData(c);
          if (info.cost > 0 && info.cost <= locSoup) {
            // Check sacrifice
            if (info.effects.requiresSacrifice) {
              const type = info.effects.sacrificeType || '';
              const matches = oRef.current.filter(x => type ? parseCardData(x.cardId).rawText.toLowerCase().includes(type) : (x.cardId !== "0" && !x.cardId.startsWith("TOKEN")));
              if (matches.length < info.effects.requiresSacrifice) return;
            }
            affordable.push({ c, info });
          }
        });
        if (!affordable.length) break;
        affordable.sort((a, b) => b.info.cost - a.info.cost);
        const pick = affordable[0];
        locSoup -= pick.info.cost;
        pending.push({ owner: 'AI', cardId: pick.c });
        currentHand.splice(currentHand.indexOf(pick.c), 1);
        addLog(`[AI] PLAYED ${pick.c} (COST:${pick.info.cost}, LEFT:${locSoup})`);
      }

      // Update state directly (not inside callbacks)
      setOppHand(currentHand);
      setOppSoup({ current: Math.max(0, locSoup), max: maxSoup });
      if (pending.length) forceResolveStack(pending);

      await new Promise(r => setTimeout(r, 1100));
      if (!live || winRef.current !== null) return;

      // AI attacks using ref
      const field = [...oRef.current];
      let willAttack = false;
      field.forEach((o, i) => {
        const ci = parseCardData(o.cardId);
        if (o.canAttack && o.cardId !== "0" && ci.attack > 0) {
          field[i] = { ...field[i], isAttacking: true };
          willAttack = true;
        }
      });
      setOppPlayArea(field);
      if (willAttack) setPhase('DECLARE_BLOCKS');
      else { setTurn('PLAYER'); setPhase('MAIN'); }
    };

    ai();
    return () => { live = false; };
  }, [turn, phase, addLog, drawCard, forceResolveStack]);

  // ---- GLOBAL WATCHER (V9 - CHAIN REACTIONS) ----
  const [lastGraveLen, setLastGraveLen] = useState({ p: 0, o: 0 });
  useEffect(() => {
    if (grave.length === lastGraveLen.p && oppGrave.length === lastGraveLen.o) return;
    
    const wasP = grave.length > lastGraveLen.p;
    const wasO = oppGrave.length > lastGraveLen.o;
    const newCard = wasP ? grave[grave.length-1] : (wasO ? oppGrave[oppGrave.length-1] : null);
    if (!newCard) return;

    setLastGraveLen({ p: grave.length, o: oppGrave.length });
    const cardData = parseCardData(newCard);
    const type = cardData.cardType;

    // Trigger passives on self field
    const checkPassives = (isP) => {
      const area = isP ? playArea : oppPlayArea;
      area.forEach(obj => {
        const ci = parseCardData(obj.cardId);
        const p = ci.effects;
        if (p.passiveOnDeathGainSoup || p.passiveOnDeathDmgAll || p.passiveOnDeathHeal) {
           const matchType = (p.passiveTriggerType === 'enemy' && (isP ? wasO : wasP)) || (p.passiveTriggerType === type);
           if (matchType || !p.passiveTriggerType) {
              if (p.passiveOnDeathGainSoup) (isP ? setSoup : setOppSoup)(s => ({ ...s, current: s.current + p.passiveOnDeathGainSoup }));
              if (p.passiveOnDeathHeal) (isP ? setHp : setOppHp)(h => h + p.passiveOnDeathHeal);
              if (p.passiveOnDeathDmgAll) {
                 const targetArea = isP ? setOppPlayArea : setPlayArea;
                 const targetGrave = isP ? setOppGrave : setGrave;
                 targetArea(prev => prev.filter(c => { 
                    if (parseCardData(c.cardId).defense <= p.passiveOnDeathDmgAll) { targetGrave(g => [...g, c.cardId]); return false; } 
                    return true; 
                 }));
                 addLog(`[CHAIN] ${ci.id} TRIGGERED BY ${newCard}`);
              }
           }
        }
      });
    };
    checkPassives(true); checkPassives(false);
  }, [grave, oppGrave, playArea, oppPlayArea]);
  useEffect(() => {
    if (winner || !gameStarted) return;
    if (hp <= 0 && oppHp <= 0) setWinner('NEUTRALIZED (DRAW)');
    else if (hp <= 0) setWinner('AI OVERLORD');
    else if (oppHp <= 0) setWinner('PLAYER ONE');
  }, [hp, oppHp, winner, gameStarted]);

  // ---- GAME OVER ----
  if (winner) {
    return (
      <div className="game-board" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="neon-box-pink" style={{ padding: '50px', textAlign: 'center' }}>
          <h1 className={winner === 'PLAYER ONE' ? 'neon-text-cyan' : 'neon-text-red'} style={{ fontSize: '3rem' }}>GAME OVER</h1>
          <h2 style={{ color: 'white', marginTop: '20px' }}>{winner} TERMINATED THE SYSTEM.</h2>
          <button onClick={startGame} style={{ marginTop: '30px', padding: '10px 30px', background: 'transparent', color: '#ff00ff', border: '2px solid #ff00ff', cursor: 'pointer' }}>REBOOT OS</button>
        </div>
      </div>
    );
  }

  // ---- ZOOM MODAL ----
  const renderZoom = () => {
    if (!zoomedCard) return null;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', cursor: 'zoom-out' }} onClick={() => setZoomedCard(null)}>
        <img src={`/cards/${zoomedCard}.png`} style={{ maxHeight: '85vh', maxWidth: '90vw', border: '3px solid #0ff', boxShadow: '0 0 50px #0ff', borderRadius: '15px' }} alt="Enlarged Card" />
        <div style={{ position: 'absolute', bottom: '30px', color: '#0ff', background: 'rgba(0,0,0,0.9)', padding: '10px 20px', borderRadius: '5px', border: '1px solid #f0f', fontFamily: 'monospace' }}>[ CLICK ANYWHERE TO CLOSE ]</div>
      </div>
    );
  };

  // ---- CARD INSPECTOR ----
  const renderInspector = () => {
    if (!hoveredCard || hoveredCard === 'card_back (9)') return null;
    const ci = parseCardData(hoveredCard);
    const efx = Object.entries(ci.effects).filter(([k, v]) => v && v !== false && k !== 'isInstant');
    return (
      <div style={{ position: 'fixed', left: mousePos.x + 20, top: Math.max(0, mousePos.y - 150), width: 270, background: 'rgba(0,0,0,0.95)', border: '1px solid var(--neon-cyan)', padding: 10, zIndex: 9999, pointerEvents: 'none', boxShadow: '0 0 20px rgba(0,255,255,0.4)' }}>
        <div style={{ color: '#fff', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: 5, marginBottom: 5 }}>{ci.id === "0" ? 'King Cricket Soup' : ci.id}</div>
        {ci.cost > 0 && <div style={{ color: 'var(--neon-green)' }}>COST: {ci.cost} SOUP</div>}
        {(ci.attack > 0 || ci.defense > 0) && <div style={{ color: 'var(--neon-red)' }}>ATK: {ci.attack} / DEF: {ci.defense}</div>}
        {efx.length > 0 && (
          <div style={{ background: 'rgba(255,0,255,0.2)', padding: 5, marginTop: 5, border: '1px dotted #f0f' }}>
            <div style={{ color: '#f0f', fontSize: 10 }}>ENGINE MODULES:</div>
            <ul style={{ margin: '2px 0 0 15px', color: '#fff', fontSize: 11 }}>
              {efx.map(([k, v]) => <li key={k}>{k}: {typeof v === 'boolean' ? '✓' : (typeof v === 'object' ? JSON.stringify(v) : v)}</li>)}
            </ul>
          </div>
        )}
        <div style={{ fontSize: 12, marginTop: 10, whiteSpace: 'pre-wrap', color: '#ccc', maxHeight: 120, overflow: 'hidden' }}>{ci.rawText}</div>
      </div>
    );
  };

  const bH = (id) => ({ onMouseEnter: () => setHoveredCard(id), onMouseLeave: () => setHoveredCard(null), onContextMenu: (ev) => { ev.preventDefault(); setZoomedCard(id); } });
  const zBtn = (id) => id === 'card_back (9)' ? null : (
    <div onClick={(ev) => { ev.stopPropagation(); setZoomedCard(id); }} style={{ position: 'absolute', top: 2, left: 2, width: 18, height: 18, background: 'rgba(0,0,0,0.8)', border: '1px solid #0ff', borderRadius: '50%', color: '#0ff', fontSize: 14, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-in', zIndex: 20 }}>+</div>
  );

  // ---- RENDER FIELD CARD ----
  const fieldCard = (obj, i, isOpp) => {
    const ci = parseCardData(obj.cardId);
    const isSoup = obj.cardId === "0";
    const isTarget = isOpp && phase === 'DECLARE_BLOCKS' && obj.isAttacking && selectedBlocker !== null;
    const isSel = !isOpp && selectedBlocker === i;
    return (
      <div key={i}
        onClick={() => isOpp ? assignBlocker(i) : (turn === 'PLAYER' && phase === 'DECLARE_ATTACKS' && !isSoup ? toggleAttack(i) : selectBlocker(i))}
        {...bH(obj.cardId)}
        className={`card-placeholder ${isSoup ? 'card-soup neon-border-green' : 'card-field'} ${obj.isAttacking ? 'neon-border-pink' : (isOpp ? 'neon-border-red' : 'neon-border-cyan')}`}
        style={{
          position: 'relative', backgroundImage: `url(/cards/${obj.cardId}.png)`,
          opacity: isSoup || obj.canAttack ? 1 : 0.5,
          transform: obj.isAttacking ? (isOpp ? 'translateY(20px)' : 'translateY(-20px)') : 'none',
          boxShadow: isTarget ? '0 0 15px #f0f' : (isSel ? '0 0 15px #0ff' : ''),
          cursor: isTarget || (!isSoup && obj.canAttack && (phase === 'DECLARE_ATTACKS' || phase === 'DECLARE_BLOCKS')) ? 'pointer' : 'default',
        }}>
        {zBtn(obj.cardId)}
        {!isSoup && <div style={{ position: 'absolute', bottom: 0, background: 'rgba(0,0,0,0.8)', width: '100%', fontSize: 8, color: isOpp ? '#f00' : '#0ff' }}>ATK:{ci.attack} DEF:{ci.defense}</div>}
        {obj.blockedBy && <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,0,255,0.8)', padding: 2, fontSize: 9, color: '#fff' }}>BLOCKED</div>}
      </div>
    );
  };

  return (
    <div className="game-board" onMouseMove={handleMouseMove}>
      {renderInspector()}
      {renderZoom()}

      <header className="hud">
        <div className="player-info opponent">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="neon-text-red">AI CPU SERVER</span>
            <span className="neon-text-red" style={{ fontSize: '0.8rem' }}>HP: {oppHp} / {INITIAL_HP}</span>
          </div>
          <div className="energy neon-box-red">SOUP: {oppSoup.current} / {oppSoup.max}</div>
        </div>
        <div className="game-status">
          <h1 className="neon-text-pink">XCOPY::ARENA</h1>
          {!gameStarted ? (
            <button onClick={startGame} style={{ padding: '5px 15px', background: 'transparent', color: '#0ff', border: '1px solid #0ff', cursor: 'pointer' }}>START MATCH</button>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <span className={`turn-indicator ${turn === 'PLAYER' ? 'neon-text-cyan' : 'neon-text-red'}`}>
                {turn === 'PLAYER'
                  ? (phase === 'MAIN' ? 'YOUR TURN [MAIN]' : 'YOUR TURN [ATTACKS]')
                  : (phase === 'DECLARE_BLOCKS' ? 'AI ATTACKING! [RESPOND/BLOCK]' : 'AI THINKING...')}
              </span>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 5 }}>
                {turn === 'PLAYER' && <button onClick={confirmPhase} style={{ padding: '4px 20px', background: 'transparent', color: '#0ff', border: '1px solid #0ff', cursor: 'pointer' }}>CONFIRM {phase === 'MAIN' ? 'ACTION' : 'ATTACKS'}</button>}
                {turn === 'AI' && phase === 'DECLARE_BLOCKS' && <button onClick={confirmPhase} style={{ padding: '4px 20px', background: 'transparent', color: '#f0f', border: '1px solid #f0f', cursor: 'pointer' }}>CONFIRM BLOCKS</button>}
              </div>
            </div>
          )}
        </div>
        <div className="player-info me">
          <div className="energy neon-box-cyan">SOUP: {soup.current} / {soup.max}</div>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
            <span className="neon-text-cyan">PLAYER_ONE</span>
            <span className="neon-text-cyan" style={{ fontSize: '0.8rem' }}>HP: {hp} / {INITIAL_HP}</span>
          </div>
        </div>
      </header>

      <main className="table">
        <div className="opponent-zone">
          <div className="zone hand">
            {oppHand.map((_, i) => <div key={i} {...bH('card_back (9)')} className="card-placeholder card-soup neon-border-red" style={{ backgroundImage: "url('/cards/card_back (9).png')" }} />)}
          </div>
          <div className="zone play-area">{oppPlayArea.map((o, i) => fieldCard(o, i, true))}</div>
        </div>

        <div className="execution-stack neon-box-pink" onClick={resolveStack} style={{ cursor: 'pointer', zIndex: 10 }} title="Click to resolve">
          <div className="stack-title">EXECUTION QUEUE</div>
          <div className="stack-area">
            {executionStack.map((item, i) => (
              <div key={i} {...bH(item.cardId)} className={`card-placeholder card-soup ${item.owner === 'PLAYER' ? 'neon-border-cyan' : 'neon-border-red'}`} style={{ position: 'relative', backgroundImage: `url(/cards/${item.cardId}.png)` }}>
                {zBtn(item.cardId)}
              </div>
            ))}
          </div>
        </div>

        <div className="player-zone">
          <div className="zone play-area">{playArea.map((o, i) => fieldCard(o, i, false))}</div>
          <div className="zone hand">
            {hand.map((cardId, i) => {
              const ci = parseCardData(cardId);
              return (
                <div key={`h-${i}`} {...bH(cardId)} className="card-placeholder card-hand neon-border-cyan" style={{ position: 'relative', backgroundImage: `url(/cards/${cardId}.png)` }} onClick={() => playCard(i)}>
                  {zBtn(cardId)}
                  {cardId !== "0" && <div style={{ position: 'absolute', top: 0, right: 0, background: '#0ff', color: '#000', padding: 2, fontSize: 10 }}>{ci.cost} S</div>}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <aside className="side-zones">
        <div className="terminal-log" style={{ flex: 1, borderBottom: '1px solid rgba(0,255,255,0.2)', marginBottom: 10, fontSize: '0.7rem', color: 'var(--neon-cyan)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 5, fontFamily: 'monospace', overflow: 'hidden' }}>
          {log.map((l, i) => <div key={i} style={{ marginBottom: 4 }}>{l}</div>)}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <div className="deck-zone">
            <span className="neon-text-red">OPP</span>
            <div className="deck-slot neon-border-red">{oppDeck.length}</div>
            <div className="grave-slot grave-opponent" {...bH(oppGrave.length ? oppGrave[oppGrave.length - 1] : null)} style={{ position: 'relative', backgroundImage: oppGrave.length ? `url(/cards/${oppGrave[oppGrave.length - 1]}.png)` : 'none', backgroundSize: 'cover' }}>
              {oppGrave.length > 0 && zBtn(oppGrave[oppGrave.length - 1])}
            </div>
          </div>
          <div className="grave-zone">
            <div className="grave-slot grave-player" {...bH(grave.length ? grave[grave.length - 1] : null)} style={{ position: 'relative', backgroundImage: grave.length ? `url(/cards/${grave[grave.length - 1]}.png)` : 'none', backgroundSize: 'cover' }}>
              {grave.length > 0 && zBtn(grave[grave.length - 1])}
            </div>
            <div className="deck-slot neon-border-cyan">{deck.length}</div>
            <span className="neon-text-cyan">YOU</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App
