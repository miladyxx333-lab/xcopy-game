const path = require('path');
const cards = require(path.join(__dirname, 'src', 'cards.json'));

const R = [];
cards.forEach(function(c) {
  if (c.id === '0' || c.id.indexOf('back') >= 0 || c.id.indexOf('DS_Store') >= 0) return;
  var t = (c.rawText || '').toLowerCase();
  var effM = t.match(/effect:([\s\S]*?)(?:flavor|$)/i);
  if (!effM) return;
  var ef = effM[1].replace(/\n/g, ' ').trim();

  var w = [];
  if (/sacrifice/i.test(ef)) w.push('SACRIFICE');
  if (/double/i.test(ef)) w.push('DOUBLE');
  if (/once per game/i.test(ef)) w.push('ONCE_PER_GAME');
  if (/once per turn/i.test(ef)) w.push('ONCE_PER_TURN');
  if (/search.*deck|look.*deck/i.test(ef)) w.push('DECK_SEARCH');
  if (/corrupt/i.test(ef)) w.push('CORRUPT');
  if (/gains? \+\d+.*attack/i.test(ef)) w.push('BUFF');
  if (/immune|cannot be/i.test(ef)) w.push('IMMUNITY');
  if (/requires.*sacrifice/i.test(ef)) w.push('SACRIFICE_REQ');
  if (/summon.*\d+\/\d+|summon.*token/i.test(ef)) w.push('HAS_TOKEN');
  if (/deal \d+ damage/i.test(ef)) w.push('HAS_DAMAGE');
  if (/draw \d+ card/i.test(ef)) w.push('HAS_DRAW');
  if (/discard/i.test(ef)) w.push('HAS_DISCARD');
  if (/destroy/i.test(ef)) w.push('HAS_DESTROY');
  if (/gain \d+ can/i.test(ef)) w.push('HAS_GAIN_SOUP');
  if (/heal|life/i.test(ef)) w.push('HAS_HEAL');
  if (/steal/i.test(ef)) w.push('HAS_STEAL');
  if (/freeze/i.test(ef)) w.push('HAS_FREEZE');
  if (/counter/i.test(ef)) w.push('HAS_COUNTER');
  if (/reduce.*attack/i.test(ef)) w.push('HAS_REDUCE_ATK');

  var cm = t.match(/cost[: ]*\s*(\d+)/); var cost = cm ? parseInt(cm[1]) : 3;
  var am = t.match(/attack[: ]*\s*(\d+)/); var atk = am ? parseInt(am[1]) : 0;
  var dm = t.match(/defense[: ]*\s*(\d+)/); var def = dm ? parseInt(dm[1]) : 0;

  // Separate unimplemented warnings from implemented effects
  var unimplemented = w.filter(function(x) {
    return ['SACRIFICE', 'DOUBLE', 'ONCE_PER_GAME', 'ONCE_PER_TURN', 'DECK_SEARCH', 'CORRUPT', 'SACRIFICE_REQ'].indexOf(x) >= 0;
  });
  var implemented = w.filter(function(x) {
    return ['HAS_TOKEN', 'HAS_DAMAGE', 'HAS_DRAW', 'HAS_DISCARD', 'HAS_DESTROY', 'HAS_GAIN_SOUP', 'HAS_HEAL', 'HAS_STEAL', 'HAS_FREEZE', 'HAS_COUNTER', 'HAS_REDUCE_ATK', 'BUFF', 'IMMUNITY'].indexOf(x) >= 0;
  });

  R.push({ id: c.id, c: cost, a: atk, d: def, unimpl: unimplemented, impl: implemented, ef: ef.substring(0, 120) });
});

// Sort by ID
R.sort(function(a, b) { return parseInt(a.id) - parseInt(b.id); });

var problems = R.filter(function(r) { return r.unimpl.length > 0; });
var ok = R.filter(function(r) { return r.unimpl.length === 0; });

console.log('===========================================');
console.log('  XCOPY ARENA - FULL CARD AUDIT V6');
console.log('  Total cards with effects: ' + R.length);
console.log('===========================================\n');

console.log('--- CARDS NEEDING WORK (' + problems.length + ') ---');
problems.forEach(function(r) {
  console.log('#' + r.id + ' C:' + r.c + ' A:' + r.a + ' D:' + r.d + ' [' + r.unimpl.join(', ') + '] => ' + r.ef);
});

console.log('\n--- FULLY WORKING (' + ok.length + ') ---');
ok.forEach(function(r) {
  console.log('#' + r.id + ' C:' + r.c + ' A:' + r.a + ' D:' + r.d + ' [' + r.impl.join(', ') + '] => ' + r.ef);
});

var wc = {};
problems.forEach(function(r) {
  r.unimpl.forEach(function(x) { wc[x] = (wc[x] || 0) + 1; });
});
console.log('\n=== SUMMARY ===');
console.log('OK: ' + ok.length + ' | NEEDS_WORK: ' + problems.length);
console.log('\nUnhandled mechanic counts:');
Object.keys(wc).sort(function(a, b) { return wc[b] - wc[a]; }).forEach(function(k) {
  console.log('  ' + wc[k] + 'x ' + k);
});
