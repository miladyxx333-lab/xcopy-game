const fs = require('fs');
const engine = require('./src/engine.cjs');
const cards = require('./src/cards.json');

let md = "# Reporte de Mapeo de Cartas y Efectos\n\n";
md += "Este documento detalla cómo el motor lee e interpreta los efectos de cada carta, para ayudar a identificar cuáles no están funcionando en el juego.\n\n";

const effectCategories = {};

for (const card of cards) {
  if (card.id === "0") continue;
  const parsed = engine.parseCardData(card.id);
  const text = (card.rawText || '').toLowerCase();
  
  if (Object.keys(parsed.effects).length > 0) {
    for (const [effName, effVal] of Object.entries(parsed.effects)) {
      if (!effectCategories[effName]) effectCategories[effName] = [];
      effectCategories[effName].push(`- **[${card.id}]** (Valor: ${effVal}): _"${card.rawText.replace(/\n/g, ' ')}"_`);
    }
  }
}

for (const [effName, cardList] of Object.entries(effectCategories)) {
  md += `## Efecto: \`${effName}\`\n`;
  md += `Implementado en el motor de lectura. Aparece en ${cardList.length} cartas:\n\n`;
  md += cardList.join('\n') + '\n\n';
}

fs.writeFileSync('/Users/urielhernandez/.gemini/antigravity-ide/brain/fd4b5fc5-8e3c-4433-813c-97fe8aaa98c6/card_effects_analysis.md', md);
console.log("Report generated.");
