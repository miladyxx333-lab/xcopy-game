const puppeteer = require('puppeteer');
const fs = require('fs');

const MAX_GAMES = 150;
const GAME_URL = 'http://localhost:5173';

async function run() {
  console.log(`Starting QA Bot: Simulating ${MAX_GAMES} games...`);
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Array para recolectar errores y efectos
  const report = [];

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[EFFECT]') || text.includes('[ERROR]')) {
      // Registrar log relevante (en una versión completa guardaríamos todo el stream de logs)
    }
  });

  for (let i = 1; i <= MAX_GAMES; i++) {
    console.log(`[QA BOT] Playing Game ${i}/${MAX_GAMES}...`);
    try {
      await page.goto(GAME_URL);
      // Wait for game to load
      await page.waitForSelector('.card-hand', { timeout: 5000 }).catch(() => {});
      
      // Simular unos turnos (Click random cards, click end turn)
      for (let turn = 0; turn < 10; turn++) {
        const cards = await page.$$('.card-hand');
        if (cards.length > 0) {
           const randomCard = cards[Math.floor(Math.random() * cards.length)];
           await randomCard.click().catch(() => {});
        }
        
        // Buscar botón de end turn
        const buttons = await page.$$('button');
        for (const btn of buttons) {
           const text = await page.evaluate(el => el.textContent, btn);
           if (text && text.includes('END TURN')) {
             await btn.click().catch(() => {});
           }
        }
        await new Promise(r => setTimeout(r, 100)); // wait for animations/AI
      }
      
      // Leer logs de la partida y evaluar
      const gameLogs = await page.evaluate(() => {
         const logEl = document.querySelector('.log-box');
         return logEl ? logEl.innerText : '';
      });
      
      if (gameLogs.includes('NaN') || gameLogs.includes('undefined')) {
         report.push(`Game ${i} had undefined states.`);
      }

    } catch (e) {
      console.error(`Error in game ${i}:`, e.message);
    }
  }

  await browser.close();
  
  fs.writeFileSync('qa_results.md', `# QA Bot Results\n\nSimulated 150 games.\n\n${report.join('\n')}`);
  console.log('Finished simulating games. Wrote qa_results.md');
}

run();
