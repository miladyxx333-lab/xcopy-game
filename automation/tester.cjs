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
    this.init();
  }

  log(m) { this.logs.push(`R${this.rounds} - P${this.turn} | ${m}`); }

  init() {
    const pool = cardsData.filter(c => c.id !== "0" && !c.id.includes("back") && !c.id.includes("DS_Store")).map(c => c.id);
    this.deck[0] = Array(35).fill(0).map(() => pool[Math.floor(Math.random() * pool.length)]);
    this.deck[1] = Array(35).fill(0).map(() => pool[Math.floor(Math.random() * pool.length)]);
    this.hand[0] = this.deck[0].splice(0, 7);
    this.hand[1] = this.deck[1].splice(0, 7);
  }

  run() {
    while (!this.winner && this.rounds < 250) {
      this.playTurn();
      this.turn = 1 - this.turn;
      this.rounds++;
    }
    return this.winner !== null ? `P${this.winner} WON` : "DRAW/TIMEOUT";
  }

  playTurn() {
    const p = this.turn;
    const opp = 1 - p;
    // Draw
    if (this.deck[p].length) this.hand[p].push(this.deck[p].shift());
    // Regrow soup
    this.soup[p].c = this.soup[p].m;

    // AI logic: Play cards
    let runawayGuard = 0;
    while (runawayGuard < 20) {
      const playable = this.hand[p].map((cid, i) => ({ cid, i, data: parseCardData(cid) }))
        .filter(x => x.data.cost <= this.soup[p].c);
      
      if (playable.length) {
        const soupCard = playable.find(x => x.cid === "0");
        const card = soupCard || playable.sort((a,b) => b.data.cost - a.data.cost)[0];
        
        this.hand[p].splice(card.i, 1);
        if (card.cid === "0") {
          this.soup[p].m++; this.soup[p].c++;
          this.log(`Played SOUP. New Max: ${this.soup[p].m}`);
        } else {
          this.log(`Played ${card.data.id} (Cost: ${card.data.cost})`);
          this.soup[p].c -= card.data.cost;
          if (card.data.isCreature) {
             const obj = { id: Math.random().toString(), cid: card.cid, atk: card.data.attack, def: card.data.defense, canAtk: false };
             this.playArea[p].push(obj);
             this.applySummonEffects(card.data, p, obj.id);
          } else {
             this.applySummonEffects(card.data, p, null);
          }
        }
      } else break;
      runawayGuard++;
    }

    // Battle
    this.playArea[p].forEach(c => {
      if (c.canAtk) {
        let dmg = (c.atk || 0);
        this.hp[opp] -= dmg;
        if (dmg > 0) this.log(`${c.cid} attacked face for ${dmg}. Opp HP: ${this.hp[opp]}`);
      }
      c.canAtk = true;
    });

    if (this.hp[opp] <= 0) this.winner = p;
    if (this.hp[p] <= 0) this.winner = opp;
  }

  applySummonEffects(card, p, instId) {
    const e = card.effects;
    const opp = 1 - p;
    if (e.onSummonGainSoup) { this.soup[p].m += e.onSummonGainSoup; this.log(`+${e.onSummonGainSoup} SOUP MAX`); }
    if (e.onSummonDraw) { 
      for(let i=0; i<e.onSummonDraw; i++) {
        if (this.deck[p].length) this.hand[p].push(this.deck[p].shift());
        else { this.winner = 1 - p; this.log("DECK OUT!"); break; }
      }
      this.log(`DREW ${e.onSummonDraw} CARDS`);
    }
    if (e.onSummonHeal) { this.hp[p] += e.onSummonHeal; this.log(`HEALED ${e.onSummonHeal}`); }
    if (e.onSummonDmgPlayer) { 
      this.hp[opp] -= e.onSummonDmgPlayer; 
      this.log(`DMG TO PLAYER: ${e.onSummonDmgPlayer}. Opp HP: ${this.hp[opp]}`); 
    }
    if (e.onSummonDiscardOpp) { 
      for(let i=0; i<e.onSummonDiscardOpp; i++) if (this.hand[opp].length) this.hand[opp].splice(0,1); 
      this.log(`FORCED OPPONENT DISCARD ${e.onSummonDiscardOpp}`);
    }
    
    // Check for Win Combination
    if (e.winCombo) {
      const fragsInPlay = this.playArea[p].filter(c => parseCardData(c.cid).effects.winCombo).length;
      const fragsInHand = this.hand[p].filter(cid => parseCardData(cid).effects.winCombo).length;
      if (fragsInPlay + fragsInHand >= 5) {
         this.winner = p;
         this.log("!!! WIN COMBINATION ACHIEVED !!!");
      }
    }

    // Immediate win check after effects
    if (this.hp[opp] <= 0 && this.hp[p] <= 0) { this.winner = 'DRAW'; this.log("DRAW!"); }
    else if (this.hp[opp] <= 0) { this.winner = p; this.log("WIN BY HP!"); }
    else if (this.hp[p] <= 0) { this.winner = opp; this.log("LOSS BY HP!"); }
  }

}

async function runTests() {
  console.log("--- STARTING 25 MATCH STRESS TEST ---");
  for (let i = 1; i <= 25; i++) {
    const sim = new GameSim(i);
    try {
      const res = sim.run();
      console.log(`Match ${i}: ${res} (${sim.rounds} rounds, ${sim.logs.length} events) - Final HP: P0:${sim.hp[0]} P1:${sim.hp[1]}`);
      if (sim.rounds > 50) {
         fs.writeFileSync(`./automation/match_${i}_bug.log`, sim.logs.join('\n'));
         console.log(`  > LONG MATCH! Warning logged to match_${i}_bug.log`);
      }
    } catch (err) {
      console.error(`Match ${i} CRASHED:`, err.stack);
      fs.writeFileSync(`./automation/match_${i}_crash.log`, (sim.logs.join('\n') + '\n\nERROR:\n' + err.stack));
    }
  }
  console.log("--- TEST COMPLETE ---");
}

runTests();
