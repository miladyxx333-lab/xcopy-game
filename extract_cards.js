import fs from 'fs';
import path from 'path';
import { createWorker } from 'tesseract.js';

const inputFolder = '/Users/urielhernandez/Downloads/xcopy/xcopy png';
const outputJsonPath = path.join(process.cwd(), 'src', 'cards.json');

async function extractCards() {
  const worker = await createWorker('eng');
  
  const files = fs.readdirSync(inputFolder).filter(f => f.endsWith('.png'));
  console.log(`Starting extraction of ${files.length} cards...`);

  let db = [];
  
  // Create output file initially empty
  fs.writeFileSync(outputJsonPath, JSON.stringify(db, null, 2));

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fp = path.join(inputFolder, file);
    try {
      const { data: { text } } = await worker.recognize(fp);
      console.log(`Progress: ${i+1}/${files.length} - Extracted ${file}`);
      
      const cardData = {
        id: file.replace('.png', ''),
        originalImage: fp,
        rawText: text.trim()
      };
      db.push(cardData);
      
      // Write incrementally in case it gets interrupted
      if (i % 5 === 0) {
        fs.writeFileSync(outputJsonPath, JSON.stringify(db, null, 2));
      }
    } catch (err) {
      console.error(`Error processing ${file}: ${err.message}`);
    }
  }

  await worker.terminate();
  fs.writeFileSync(outputJsonPath, JSON.stringify(db, null, 2));
  console.log(`Finished extraction! Database saved to ${outputJsonPath}`);
}

extractCards().catch(console.error);
