const fs = require('fs');
const cardsData = JSON.parse(fs.readFileSync('src/cards.json'));

let creatureCount = 0;
let spellCount = 0;

cardsData.forEach(c => {
  const txt = c.rawText.toLowerCase() || '';
  let atk = 0;
  let def = 0;
  
  const aMatch = txt.match(/attack[: ]*\s*(\d+)/) || txt.match(/atk[: ]*\s*(\d+)/);
  if (aMatch) atk = parseInt(aMatch[1]);

  const dMatch = txt.match(/defense[: ]*\s*(\d+)/) || txt.match(/def[: ]*\s*(\d+)/);
  if (dMatch) def = parseInt(dMatch[1]);
  
  if (atk > 0 || def > 0) {
      creatureCount++;
  } else {
      if(c.id !== "0") spellCount++;
  }
});

console.log(`Creatures: ${creatureCount}, Spells: ${spellCount}`);
