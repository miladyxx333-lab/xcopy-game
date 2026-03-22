const { parseCardData } = require('../src/engine.cjs');
const cardsData = require('../src/cards.json');
const fs = require('fs');

class GameSim {
  constructor(id) {
    this.id = id;
    this.hp = [30, 30];
    this.soup = [{ c: 3, m: 3 }, { c: 3, m: 3 }];
    this.deck = [[], []];
    this.hand = [[], []];
    this.playArea = [[], []];
    this.grave = [[], []];
    this.turn = 0;
    this.winner = null;
    this.logs = [];
    this.rounds = 0;
    this.bugs = [];
    this.init();
  }

  log(m) { this.logs.push(`R${this.rounds} - P${this.turn} | ${m}`); }

  init() {
    const pool = cardsData.filter(c => c.id !== "0" && !c.id.includes("back") && !c.id.includes("DS_Store")).map(c => c.id);
    this.deck[0] = Array(45).fill(0).map(() => pool[Math.floor(Math.random() * pool.length)]);
    this.deck[1] = Array(45).fill(0).map(() => pool[Math.floor(Math.random() * pool.length)]);
    this.hand[0] = this.deck[0].splice(0, 7);
    this.hand[1] = this.deck[1].splice(0, 7);
  }

  run() {
    while (this.winner === null && this.rounds < 400) {
      this.playTurn();
      this.turn = 1 - this.turn;
      this.rounds++;
    }
    return this.winner !== null ? `RESULT: ${this.winner}` : "RESULT: DRAW/TIMEOUT";
  }

  playTurn() {
    const p = this.turn;
    const opp = 1 - p;
    // Draw
    if (this.deck[p].length) this.hand[p].push(this.deck[p].shift());
    else { this.winner = `P${opp} WON (MILL)`; return; }
    
    this.soup[p].c = this.soup[p].m;

    let runaway = 0;
    while (runaway < 30) {
      const playable = this.hand[p].map((cid, i) => ({ cid, i, data: parseCardData(cid) }))
        .filter(x => x.data.cost <= this.soup[p].c);
      
      if (playable.length) {
        const soupCard = playable.find(x => x.cid === "0");
        const card = soupCard || playable.sort((a,b) => b.data.cost - a.data.cost)[0];
        this.hand[p].splice(card.i, 1);
        
        if (card.cid === "0") {
          this.soup[p].m++; this.soup[p].c++;
          this.log(`Played SOUP`);
        } else {
          if (card.data.effects.ghostEffectFound) {
             this.bugs.push(`GHOST EFFECT in Card ${card.cid}: "${card.data.rawText}"`);
          }
          this.soup[p].c -= card.data.cost;
          if (card.data.isCreature) {
             const obj = { id: Math.random(), cid: card.cid, atk: card.data.attack, def: card.data.defense, canAtk: false };
             this.playArea[p].push(obj);
             this.applyEffects(card.data, p);
          } else {
             this.applyEffects(card.data, p);
          }
        }
      } else break;
      runaway++;
    }

    this.playArea[p].forEach(c => {
      if (c.canAtk) {
        let dmg = (c.atk || 0);
        this.hp[opp] -= dmg;
        if (dmg > 1000 || isNaN(dmg)) this.bugs.push(`INVALID DAMAGE detected from card ${c.cid}`);
      }
      c.canAtk = true;
    });

    this.checkWinConditions();
  }

  checkWinConditions() {
    if (this.hp[0] <= 0 && this.hp[1] <= 0) this.winner = "DRAW";
    else if (this.hp[0] <= 0) this.winner = "P1 WON";
    else if (this.hp[1] <= 0) this.winner = "P0 WON";
  }

  applyEffects(card, p) {
    const e = card.effects;
    const opp = 1 - p;
    if (e.onSummonGainSoup) this.soup[p].m += e.onSummonGainSoup;
    if (e.onSummonDraw) { for(let i=0; i<e.onSummonDraw; i++) if (this.deck[p].length) this.hand[p].push(this.deck[p].shift()); }
    if (e.onSummonHeal) this.hp[p] += e.onSummonHeal;
    if (e.onSummonDmgPlayer) this.hp[opp] -= e.onSummonDmgPlayer;
    if (e.onSummonDiscardOpp) { for(let i=0; i<e.onSummonDiscardOpp; i++) if (this.hand[opp].length) this.hand[opp].splice(0,1); }
    if (e.winCombo) {
      if (this.hand[p].filter(cid => parseCardData(cid).effects.winCombo).length >= 5) {
         this.winner = `P${p} WON (EXODIA)`;
         this.log("!!! FRAGMENTS OF CREATION ASSEMBLY !!!");
      }
    }
  }
}

async function runAudit() {
  console.log("--- BATTLE LAB AUDIT: 50 MATCHES ---");
  let ghostCards = new Set();
  let results = { p0: 0, p1: 0, draw: 0, mill: 0, exodia: 0 };

  for (let i = 1; i <= 50; i++) {
    const sim = new GameSim(i);
    const res = sim.run();
    if (res.includes("P0 WON")) results.p0++;
    else if (res.includes("P1 WON")) results.p1++;
    else results.draw++;
    if (res.includes("MILL")) results.mill++;
    if (res.includes("EXODIA")) results.exodia++;
    
    sim.bugs.forEach(b => ghostCards.add(b));
    if (i % 10 === 0) console.log(`Completed ${i}/50...`);
  }

  console.log("\n--- AUDIT SUMMARY ---");
  console.log(`P0 Wins: ${results.p0} | P1 Wins: ${results.p1} | Ties/D: ${results.draw}`);
  console.log(`Wins by Mill: ${results.mill} | Wins by Exodia: ${results.exodia}`);
  
  if (ghostCards.size > 0) {
    console.log("\n--- GHOST CARDS FOUND (Parser Gaps) ---");
    [...ghostCards].forEach(g => console.log(`[!] ${g}`));
    fs.writeFileSync('./automation/audit_report.txt', [...ghostCards].join('\n'));
  } else {
    console.log("\nNo Ghost Cards detected in this run. Parser looks robust.");
  }
}

runAudit();
