const cardsMaster = require('./cards_master_verified.json');
const cardMap = new Map();
cardsMaster.forEach(c => cardMap.set(c.id, c));

module.exports.parseCardData = (id) => {
  if (!id) return { id: '??', rawText: '', cost: 0, attack: 0, defense: 0, isCreature: false, effects: {} };
  if (id.startsWith('TOKEN_')) {
    const m = id.match(/TOKEN_(\d+)_(\d+)/);
    const type = id.includes('_DEATH') ? 'death' : id.includes('_DOOM') ? 'doom' : id.includes('_FLY') ? 'fly' : 'neutral';
    return { id, rawText: 'Token', cost: 0, attack: m ? +m[1] : 1, defense: m ? +m[2] : 1, isCreature: true, cardType: type, effects: {} };
  }
  const c = cardMap.get(id);
  if (c) {
    const isCreature = (c.attack > 0 || c.defense > 0 || c.isFragment) && id !== "0";
    return {
      id: c.id,
      name: c.name,
      cost: c.cost,
      attack: c.attack,
      defense: c.defense,
      cardType: c.cardType,
      isCreature,
      isSpell: !isCreature && id !== "0",
      effects: { ...c.effects },
      rawText: c.effectText || ''
    };
  }
  return { id, rawText: 'No Data', cost: 3, attack: 0, defense: 0, isCreature: false, cardType: 'neutral', effects: {} };
};
