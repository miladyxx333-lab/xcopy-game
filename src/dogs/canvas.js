// ════════════════════════════════════════════════════════
// CANINOS PIXEL v2.0 — full-body sitting dog renderer
// 32×40 grid · P=8px · each "pixel" = 8×8 on screen
// ════════════════════════════════════════════════════════

const PALETTES = {
  'Game Boy':['#0f380f','#306230','#8bac0f','#9bbc0f'],
  'NES Classic':['#FF0000','#0000FF','#FFFF00','#00FF00','#FF8800','#8800FF','#FFFFFF','#000000'],
  'CGA Cyan-Magenta':['#00AAAA','#AA00AA','#FFFFFF','#000000'],
  'Monochrome Amber':['#FF9900','#CC7700','#884400','#000000'],
  'Monochrome Green':['#00FF41','#00CC33','#008822','#000000'],
  'PICO-8':['#000000','#1D2B53','#7E2553','#008751','#AB5236','#5F574F','#C2C3C7','#FFF1E8','#FF004D','#FFA300','#FFEC27','#00E436','#29ADFF','#83769C','#FF77A8','#FFCCAA'],
  'Commodore 64':['#000000','#FFFFFF','#880000','#AAFFEE','#CC44CC','#00CC55','#0000AA','#EEEE77','#DD8855','#664400','#FF7777','#333333','#777777','#AAFF66','#0088FF','#BBBBBB'],
  'Pastel Soft':['#FFB3BA','#BAFFC9','#BAE1FF','#FFFFBA','#E8BAFF','#FFD9BA'],
  'High Contrast':['#000000','#FFFFFF','#FF0000'],
  'Vaporwave':['#FF2D7B','#00E5FF','#B026FF','#CCCCCC'],
  'Sepia Vintage':['#704214','#A0522D','#D2B48C','#F5DEB3'],
  'Blood Moon':['#1a0000','#660000','#CC0000','#FF3333','#FFFFFF']
};
function getColors(p){for(const k of Object.keys(PALETTES)){if(p.startsWith(k))return PALETTES[k];}return PALETTES['PICO-8'];}
function hashStr(s){let h=0;for(let i=0;i<s.length;i++)h=((h<<5)-h)+s.charCodeAt(i)|0;return Math.abs(h);}
function lightenHex(hex,a){const r=Math.min(255,parseInt(hex.slice(1,3),16)+a),g=Math.min(255,parseInt(hex.slice(3,5),16)+a),b=Math.min(255,parseInt(hex.slice(5,7),16)+a);return'#'+r.toString(16).padStart(2,'0')+g.toString(16).padStart(2,'0')+b.toString(16).padStart(2,'0');}
function darkenHex(hex,a){const r=Math.max(0,parseInt(hex.slice(1,3),16)-a),g=Math.max(0,parseInt(hex.slice(3,5),16)-a),b=Math.max(0,parseInt(hex.slice(5,7),16)-a);return'#'+r.toString(16).padStart(2,'0')+g.toString(16).padStart(2,'0')+b.toString(16).padStart(2,'0');}

// ── Geometry ────────────────────────────────────────────
// Fixed layout so everything fits cleanly:
//   y 0-1  : frame
//   y 2-5  : hat / upright ear space
//   y 6-16 : HEAD  (hCY=11, hHH=5)
//   y 17-18: neck
//   y 19-28: BODY  (bCY=23, bHH=5)
//   y 21-31: haunches (sides)
//   y 26-34: front legs
//   y 30-31: back paws
//   y 34-35: front paws
//   y 36   : ground shadow
//   y 37-39: frame
const G = {
  cx:16,
  // head
  hCY:11, hHW:7, hHH:5,   // head oval center / half-widths
  eyeY:9,                  // eye row
  lexOff:4,                // lex = cx - lexOff
  rexOff:3,                // rex = cx + rexOff
  // snout
  snoutTop:11, snoutW:8, snoutH:5,  // muzzle block: y=11..15, x=cx-4..cx+3
  noseY:11,   // big dark nose
  mouthY:14,
  // neck
  neckY:17,
  // body
  bCY:23, bHW:8, bHH:5,
  // front legs
  legLX:11, legRX:18, legW:3, legTopY:26, legBotY:34,
  pawW:5,
  // haunches
  haunchCY:26, haunchHW:5, haunchHH:5, haunchLX:7, haunchRX:25,
  backPawY:30,
  // tail
  tailX:24, tailY:18
};

function getGeo(faceShape){
  const s=faceShape||'';
  const g=Object.assign({},G);
  if(s.includes('Wide')||s.includes('Brachycephalic')){g.hHW=9;g.hHH=4;g.snoutW=10;}
  else if(s.includes('Long')||s.includes('Narrow')){g.hHW=5;g.hHH=7;g.snoutH=6;}
  else if(s.includes('Tiny')){g.hHW=5;g.hHH=5;}
  else if(s.includes('Wolf')){g.hHW=7;g.hHH=6;}
  else if(s.includes('Fluffy')){g.hHW=9;g.hHH=5;}
  else if(s.includes('Fox')||s.includes('shiba')){g.hHW=6;g.hHH=6;}
  return g;
}

function getMuzzleColor(furHex){
  const r=parseInt(furHex.slice(1,3),16),g=parseInt(furHex.slice(3,5),16),b=parseInt(furHex.slice(5,7),16);
  const bright=(r+g+b)/3;
  if(bright<60) return '#cc9966';      // dark fur → warm beige snout
  if(bright>200) return '#ccccbb';     // white fur → slightly gray snout
  return lightenHex(furHex,65);
}

// ══════════════════════════════════════════════════════
// BACKGROUND
// ══════════════════════════════════════════════════════
function drawBg(ctx,px,bg,pick,seed){
  const W=256,H=320,COLS=32,ROWS=40;
  const bgSeed=hashStr(bg);
  ctx.fillStyle=pick(bgSeed); ctx.fillRect(0,0,W,H);
  if(bg.includes('Dog Park')){
    ctx.fillStyle='#44aa22';ctx.fillRect(0,H*.65,W,H*.35);
    for(let i=0;i<14;i++) px((seed*i*5+3)%COLS,26+((seed*i*7)%10),['#ff6699','#ffff00','#ff9900','#ffffff'][i%4]);
  } else if(bg.includes('Beach')){
    ctx.fillStyle='#3377cc';ctx.fillRect(0,0,W,H*.5);
    ctx.fillStyle='#ddcc88';ctx.fillRect(0,H*.5,W,H*.5);
    for(let i=0;i<6;i++) for(let x=i*5;x<i*5+4;x++) px(x,18+i%2,'#ffffff66');
  } else if(bg.includes('Sky')||bg.includes('Cloud')){
    ctx.fillStyle='#5599ff';ctx.fillRect(0,0,W,H);
    for(let i=0;i<5;i++){const cc=(seed*i*7+5)%28,cy=(seed*i*11)%14;for(let dx=-2;dx<=2;dx++) for(let dy=-1;dy<=1;dy++) px(cc+dx,cy+dy,'#ffffff');}
  } else if(bg.includes('Star')||bg.includes('Space')){
    for(let i=0;i<40;i++) px((seed*i*7+i*3)%COLS,(seed*i*11+i*5)%ROWS,'#ffffff');
  } else if(bg.includes('Rain')||bg.includes('Matrix')){
    for(let i=0;i<50;i++) px((seed*i*3)%COLS,(seed*i*7+i)%ROWS,pick(1)+'88');
  } else if(bg.includes('Sunset')){
    const sc=['#ff6600','#ff4400','#cc2266','#880088','#440066'];
    for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) px(x,y,sc[Math.floor(y*sc.length/ROWS)]);
  } else if(bg.includes('Rainbow')){
    const rc=['#ff0000','#ff8800','#ffff00','#00ee00','#0088ff','#8800ff','#ff00aa'];
    for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) px(x,y,rc[Math.floor(y*rc.length/ROWS)]);
  } else if(bg.includes('Forest')){
    const gc=['#1a5a1a','#2a6a2a','#3a7a3a'];
    for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) px(x,y,gc[(x*3+y*5)%3]);
  } else if(bg.includes('Lava')){
    for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) px(x,y,['#FF4400','#FF6600','#FF8800','#CC2200','#FF3300'][(x*7+y*11+seed)%5]);
  } else if(bg.includes('Brick')){
    for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){if(y%3===0)px(x,y,'#333');else if((x+(y%6<3?0:2))%5===0)px(x,y,'#333');}
  } else if(bg.includes('Neon City')){
    for(let i=0;i<20;i++){const wx=(seed*i*7)%COLS,wy=10+(seed*i*11)%24;px(wx,wy,pick(bgSeed+i)+'aa');px(wx,wy+1,pick(bgSeed+i+1)+'88');}
  } else if(bg.includes('Algorist')){
    for(let i=0;i<12;i++){const bY=2+i*3;for(let x=2;x<30;x++){const yy=bY+Math.round(Math.sin(x*.55+i*1.1)*1.5);if(yy>=1&&yy<ROWS-1)px(x,yy,i%2===0?pick(bgSeed+i)+'cc':'#ffffff33');}}
  } else if(bg.includes('Grid')||bg.includes('Checker')){
    for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) if((x+y)%2) px(x,y,pick(bgSeed+1)+'44');
  } else if(bg.includes('Static')){
    for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) px(x,y,((x*13+y*17+seed)%3===0)?'#888':'#222');
  } else if(bg.includes('Graffiti Wall')){
    ctx.fillStyle='#888888';ctx.fillRect(0,0,W,H);
    // pixel tag blocks
    const gc2=['#ff2d7b','#00e5ff','#ffe600','#b026ff','#ff9100','#00ff41'];
    for(let i=0;i<8;i++){
      const tx=(seed*(i+3)*7)%26, ty=(seed*(i+5)*11)%34;
      const tw=3+((seed*(i+2))%5), th=2+((seed*(i+4))%3);
      for(let dy2=0;dy2<th;dy2++) for(let dx2=0;dx2<tw;dx2++) px(tx+dx2,ty+dy2,gc2[i%gc2.length]+'cc');
    }
    // brick base
    for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) if(y%4===0||(x+(y%8<4?0:2))%6===0) px(x,y,'#66666644');
  } else if(bg.includes('Cyber Grid')){
    for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) {
      if(x%4===0||y%4===0) px(x,y,'#00e5ff22');
    }
    for(let y=0;y<ROWS;y+=8) for(let x=0;x<COLS;x++) px(x,y,'#00e5ff44');
    for(let x=0;x<COLS;x+=8) for(let y=0;y<ROWS;y++) px(x,y,'#00e5ff44');
    // intersection nodes
    for(let y=0;y<ROWS;y+=8) for(let x=0;x<COLS;x+=8){px(x,y,'#00e5ff');px(x+1,y,'#00e5ff');px(x,y+1,'#00e5ff');}
  } else if(bg.includes('Pixel Castle')){
    ctx.fillStyle='#334455';ctx.fillRect(0,0,W,H);
    // battlements
    for(let x=0;x<COLS;x+=4){px(x,2,'#556677');px(x+1,2,'#556677');px(x+2,2,'#334455');px(x+3,2,'#334455');}
    for(let x=0;x<COLS;x+=4){px(x,3,'#556677');px(x+1,3,'#556677');px(x+2,3,'#556677');px(x+3,3,'#556677');}
    // stone wall texture
    for(let y=4;y<ROWS;y++) for(let x=0;x<COLS;x++) if((x+(y%6<3?0:3))%6===0&&y%3===0) px(x,y,'#223344');
    // torch lights
    px(8,8,'#ff8800');px(9,8,'#ffcc00');px(8,9,'#ff6600aa');
    px(22,8,'#ff8800');px(23,8,'#ffcc00');px(22,9,'#ff6600aa');
  } else if(bg.includes('Tie-Dye')){
    for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){
      const dist=Math.round(Math.sqrt((x-16)*(x-16)+(y-20)*(y-20)));
      const hue=['#ff0000','#ff8800','#ffff00','#00ee00','#0088ff','#8800ff','#ff00aa'][dist%7];
      px(x,y,hue);
    }
  }
}

// ══════════════════════════════════════════════════════
// FRAME
// ══════════════════════════════════════════════════════
function drawFrame(px,frame,pick,fSeed){
  if(frame.includes('No Frame')) return;
  const COLS=32,ROWS=40;
  const t=frame.includes('Double')?1:2;
  const fc=pick(fSeed+2);
  for(let i=0;i<COLS;i++){for(let j=0;j<t;j++){px(i,j,fc);px(i,ROWS-1-j,fc);}}
  for(let i=0;i<ROWS;i++){for(let j=0;j<t;j++){px(j,i,fc);px(COLS-1-j,i,fc);}}
  const fc2=pick(fSeed+3);
  if(frame.includes('Gilded')||frame.includes('Diamond')||frame.includes('Baroque'))
    [[0,0],[1,0],[0,1],[31,0],[30,0],[31,1],[0,39],[1,39],[0,38],[31,39],[30,39],[31,38]].forEach(([x,y])=>px(x,y,fc2));
  if(frame.includes('Neon')||frame.includes('Holo'))
    for(let i=2;i<30;i++){px(i,2,'#ffaa0033');px(i,ROWS-3,'#ffaa0033');px(2,i,'#ffaa0033');px(29,i,'#ffaa0033');}
  if(frame.includes('Bone')||frame.includes('Paw'))
    [3,8,14,20,26].forEach(x=>{px(x,2,'#ccbbaa');px(x,ROWS-3,'#ccbbaa');});
}

// ══════════════════════════════════════════════════════
// EARS — upright types (drawn BEFORE head so head base covers root)
// ══════════════════════════════════════════════════════
function drawUprightEars(px,earType,g,furHex){
  const {cx,hCY,hHW,hHH}=g;
  const hTop=hCY-hHH; // =6
  const e=earType||'';
  const inner='#ffccbb';

  if(e.startsWith('Pointy')||e.startsWith('Wolf Ears')){
    // Triangle above head: tip at y=1, base y=6
    for(let i=0;i<6;i++){
      const y=hTop-5+i; if(y<0) continue;
      const w=i+1;
      for(let d=0;d<w;d++){
        px(cx-hHW+2+d,y,furHex);
        px(cx+hHW-3-d,y,furHex);
      }
    }
    // inner ear
    for(let i=1;i<5;i++){
      const y=hTop-4+i; if(y<0) continue;
      px(cx-hHW+3,y,inner+'cc'); px(cx+hHW-4,y,inner+'cc');
    }
  } else if(e.startsWith('Bat Ears')){
    // wide rounded ears — French Bulldog
    for(let i=0;i<8;i++){
      const y=hTop-5+i; if(y<0) continue;
      const w=i<2?4:7;
      for(let d=0;d<w;d++){px(cx-hHW+d,y,furHex); px(cx+hHW-1-d,y,furHex);}
    }
    for(let i=1;i<7;i++){
      const y=hTop-4+i; if(y<0) continue;
      for(let d=0;d<3;d++){px(cx-hHW+2+d,y,inner+'dd'); px(cx+hHW-3-d,y,inner+'dd');}
    }
  } else if(e.startsWith('Corgi Large')){
    // very large upright
    for(let i=0;i<10;i++){
      const y=hTop-8+i; if(y<0) continue;
      const w=i<2?3:i<8?8:6;
      for(let d=0;d<w;d++){px(cx-hHW+d,y,furHex); px(cx+hHW-1-d,y,furHex);}
    }
    for(let i=1;i<8;i++){
      const y=hTop-7+i; if(y<0) continue;
      for(let d=0;d<5;d++){px(cx-hHW+2+d,y,inner+'cc'); px(cx+hHW-3-d,y,inner+'cc');}
    }
  } else if(e.startsWith('Folded Forward')){
    for(let i=0;i<5;i++){
      const y=hTop-3+i; if(y<0) continue;
      const w=i<2?3:4;
      for(let d=0;d<w;d++){px(cx-hHW+d,y,furHex); px(cx+hHW-1-d,y,furHex);}
    }
    // fold tip
    for(let i=0;i<4;i++){px(cx-hHW,hTop+i,darkenHex(furHex,25)); px(cx+hHW-1,hTop+i,darkenHex(furHex,25));}
  }
}

// ══════════════════════════════════════════════════════
// EARS — floppy types (drawn AFTER head so they drape from sides)
// ══════════════════════════════════════════════════════
function drawFloppyEars(px,earType,g,furHex){
  const {cx,hCY,hHW}=g;
  const e=earType||'';
  const earCol=darkenHex(furHex,22);  // slightly darker = clearly visible against head

  if(e.startsWith('Floppy Long')){
    // big hanging ear panels: 7 wide, 13 tall
    const ey0=hCY-3, ey1=hCY+9;
    for(let y=ey0;y<=ey1;y++){
      const fade=y>ey1-3?darkenHex(earCol,15):earCol;
      for(let x=cx-hHW-7;x<=cx-hHW-1;x++) px(x,y,fade);
      for(let x=cx+hHW;x<=cx+hHW+6;x++) px(x,y,fade);
    }
  } else if(e.startsWith('Floppy Short')){
    const ey0=hCY-2, ey1=hCY+6;
    for(let y=ey0;y<=ey1;y++){
      for(let x=cx-hHW-6;x<=cx-hHW-1;x++) px(x,y,earCol);
      for(let x=cx+hHW;x<=cx+hHW+5;x++) px(x,y,earCol);
    }
  } else if(e.startsWith('Feathered Floppy')){
    const ey0=hCY-2, ey1=hCY+8;
    for(let y=ey0;y<=ey1;y++){
      const w=y<ey0+2?5:y>ey1-2?4:6;
      for(let i=1;i<=w;i++){
        px(cx-hHW-i,y,(cx+y+i)%3===0?darkenHex(earCol,20):earCol);
        px(cx+hHW+i-1,y,(cx+y+i)%3===0?darkenHex(earCol,20):earCol);
      }
    }
  } else if(e.startsWith('Double Fold')){
    const ey0=hCY-1, ey1=hCY+7;
    for(let y=ey0;y<=ey1;y++){
      const alt=(y+cx)%2===0?earCol:darkenHex(earCol,15);
      for(let i=1;i<=5;i++){px(cx-hHW-i,y,alt); px(cx+hHW+i-1,y,alt);}
    }
  } else if(e.startsWith('Rose Ear')){
    // tiny folded back ears — just a small nub
    px(cx-hHW-1,hCY-1,earCol);px(cx-hHW-2,hCY,earCol);px(cx-hHW-1,hCY+1,darkenHex(earCol,15));
    px(cx+hHW,hCY-1,earCol);px(cx+hHW+1,hCY,earCol);px(cx+hHW,hCY+1,darkenHex(earCol,15));
  }
  // default: floppy short
  else {
    const ey0=hCY-1, ey1=hCY+5;
    for(let y=ey0;y<=ey1;y++){
      for(let x=cx-hHW-5;x<=cx-hHW-1;x++) px(x,y,earCol);
      for(let x=cx+hHW;x<=cx+hHW+4;x++) px(x,y,earCol);
    }
  }
}

// ══════════════════════════════════════════════════════
// BODY SHAPE
// ══════════════════════════════════════════════════════
function drawBodyOval(px,g,furHex){
  const {cx,bCY,bHW,bHH}=g;
  for(let y=bCY-bHH;y<=bCY+bHH;y++){
    const dy=(y-bCY)/bHH, w=Math.round(bHW*Math.sqrt(Math.max(0,1-dy*dy)));
    if(w<=0) continue;
    for(let x=cx-w;x<cx+w;x++) px(x,y, y<bCY-bHH+2?darkenHex(furHex,15):furHex);
  }
}

// ══════════════════════════════════════════════════════
// OUTFIT
// ══════════════════════════════════════════════════════
function drawOutfit(px,g,outfit,furHex,pick,seed){
  const {cx,bCY,bHW,bHH}=g;
  if(!outfit||outfit.startsWith('Natural Fur')){
    // subtle chest highlight
    for(let y=bCY-2;y<=bCY+2;y++) for(let x=cx-3;x<=cx+3;x++){
      const ddx=(x-cx)/3,ddy=(y-bCY)/3;
      if(ddx*ddx+ddy*ddy<1) px(x,y,lightenHex(furHex,25));
    }
    return;
  }
  // colour map
  const oc={
    'Bandana':  {m:'#cc2222',d:'#aa1111',a:'#ffffff'},
    'Hoodie':   {m:'#3d5166',d:'#2a3d50',a:'#6688aa'},
    'Sailor':   {m:'#1a3a6a',d:'#0a2a5a',a:'#ffffff'},
    'Superhero':{m:'#cc2222',d:'#aa1111',a:'#ffe600'},
    'Denim':    {m:'#3a5a8a',d:'#2a4a7a',a:'#5577aa'},
    'Wizard':   {m:'#4a2a6a',d:'#3a1a5a',a:'#ffe600'},
    'Punk':     {m:'#223355',d:'#1a2a45',a:'#888899'},
    'Raincoat': {m:'#ddcc00',d:'#bbaa00',a:'#ffffff'},
    'Pajamas':  {m:'#bb7799',d:'#994477',a:'#ffddee'},
    'Police':   {m:'#1a2a5a',d:'#0a1a4a',a:'#ffe600'},
    'Tuxedo':   {m:'#1a1a2a',d:'#111118',a:'#ffffff'},
    'Jersey':   {m:'#cc2222',d:'#aa1111',a:'#ffffff'}
  };
  let bc={m:furHex,d:darkenHex(furHex,20),a:'#ffffff'};
  for(const[k,v] of Object.entries(oc)) if(outfit.includes(k)){bc=v;break;}

  // fill torso oval with outfit colour
  for(let y=bCY-bHH+1;y<=bCY+bHH;y++){
    const dy=(y-bCY)/bHH, w=Math.round(bHW*Math.sqrt(Math.max(0,1-dy*dy)));
    if(w<=0) continue;
    for(let x=cx-w+1;x<cx+w-1;x++) px(x,y,bc.m);
  }

  // outfit detail
  if(outfit.includes('Bandana')){
    for(let y=bCY-bHH+1;y<=bCY-bHH+4;y++) for(let x=cx-7;x<=cx+7;x++) px(x,y,'#cc2222');
    for(let d=0;d<5;d++) for(let x=cx-d;x<=cx+d;x++) px(x,bCY-bHH+4+d,'#cc2222');
  } else if(outfit.includes('Hoodie')){
    px(cx-1,bCY-bHH+1,bc.a);px(cx+1,bCY-bHH+1,bc.a);
    for(let y=bCY+1;y<=bCY+3;y++) for(let x=cx-2;x<=cx+2;x++) px(x,y,bc.d);
  } else if(outfit.includes('Sailor')){
    px(cx-1,bCY-bHH+2,'#fff');px(cx,bCY-bHH+2,'#fff');px(cx+1,bCY-bHH+2,'#fff');
    for(let y=bCY-bHH+3;y<=bCY-bHH+5;y++){px(cx-3,y,'#fff');px(cx+3,y,'#fff');}
    for(let x=cx-5;x<=cx+5;x++) px(x,bCY+2,'#ffffff44');
  } else if(outfit.includes('Superhero')){
    // cape on back
    for(let y=bCY-bHH;y<=bCY+bHH;y++){px(cx+bHW+1,y,bc.a);px(cx+bHW+2,y,bc.a);px(cx+bHW+3,y,bc.m);}
    px(cx-1,bCY,bc.a);px(cx,bCY-1,bc.a);px(cx,bCY,bc.a);px(cx+1,bCY,bc.a);px(cx,bCY+1,bc.a);
  } else if(outfit.includes('Denim')){
    px(cx-1,bCY-bHH+1,bc.a);px(cx,bCY-bHH+1,bc.a);px(cx+1,bCY-bHH+1,bc.a);
    for(let i=0;i<4;i++) px(cx,bCY-bHH+2+i*2,'#ffe600');
  } else if(outfit.includes('Wizard')){
    px(cx,bCY-1,'#ffe600');px(cx-1,bCY,'#ffe600');px(cx+1,bCY,'#ffe600');
    px(cx-2,bCY-1,'#ffe600');px(cx+2,bCY-1,'#ffe600');px(cx,bCY+1,'#ffe600');
  } else if(outfit.includes('Punk')){
    for(let i=0;i<3;i++){px(cx-bHW-2+i,bCY-bHH,'#ccc');px(cx+bHW+2-i,bCY-bHH,'#ccc');}
    ['#ff2d7b','#ffe600','#00e5ff','#b026ff'].forEach((c,i)=>px(cx-2+i,bCY,c));
  } else if(outfit.includes('Raincoat')){
    for(let y=bCY-bHH+1;y<=bCY+bHH-1;y++){px(cx-bHW+2,y,'#ffffff44');px(cx+bHW-3,y,'#ffffff44');}
  } else if(outfit.includes('Tuxedo')){
    for(let y=bCY-bHH+1;y<=bCY+2;y++){const lw=Math.max(0,3-(y-bCY+bHH-1));px(cx-1-lw,y,bc.d);px(cx+lw,y,bc.d);}
    for(let y=bCY-bHH+2;y<=bCY+4;y++) px(cx,y,'#cc1111');
  } else if(outfit.includes('Police')){
    px(cx-1,bCY-1,bc.a);px(cx,bCY-1,bc.a);px(cx+1,bCY-1,bc.a);
    px(cx-1,bCY,bc.a);px(cx+1,bCY,bc.a);
  } else if(outfit.includes('Pajamas')){
    for(let y=bCY-bHH+1;y<=bCY+bHH;y++) for(let x=cx-bHW+1;x<cx+bHW-1;x++) if((x+y)%4===0) px(x,y,bc.a+'66');
  }
}

// ══════════════════════════════════════════════════════
// LEGS + HAUNCHES
// ══════════════════════════════════════════════════════
function drawLegs(px,g,furHex){
  const {cx,legLX,legRX,legW,legTopY,legBotY,pawW,haunchCY,haunchHW,haunchHH,haunchLX,haunchRX,backPawY}=g;
  // haunches
  for(let y=haunchCY-haunchHH;y<=haunchCY+haunchHH;y++){
    const dy=(y-haunchCY)/haunchHH, w=Math.round(haunchHW*Math.sqrt(Math.max(0,1-dy*dy)));
    if(w<=0) continue;
    for(let x=haunchLX-w;x<haunchLX+w;x++) px(x,y,furHex);
    for(let x=haunchRX-w;x<haunchRX+w;x++) px(x,y,furHex);
  }
  // back paws
  for(let x=haunchLX-haunchHW;x<=haunchLX+haunchHW-1;x++){px(x,backPawY,furHex);px(x,backPawY+1,furHex);}
  for(let x=haunchRX-haunchHW;x<=haunchRX+haunchHW-1;x++){px(x,backPawY,furHex);px(x,backPawY+1,furHex);}
  // toe marks on back paws
  for(let i=0;i<3;i++){px(haunchLX-haunchHW+1+i,backPawY+1,'#00000033');px(haunchRX-haunchHW+1+i,backPawY+1,'#00000033');}
  // front legs
  const legShade=darkenHex(furHex,10);
  for(let y=legTopY;y<legBotY;y++){
    for(let x=legLX;x<legLX+legW;x++) px(x,y,x===legLX?legShade:furHex);
    for(let x=legRX;x<legRX+legW;x++) px(x,y,x===legRX+legW-1?legShade:furHex);
  }
  // front paws
  for(let y=legBotY;y<=legBotY+1;y++){
    for(let x=legLX-1;x<legLX+pawW;x++) px(x,y,furHex);
    for(let x=legRX-1;x<legRX+pawW;x++) px(x,y,furHex);
  }
  // toe marks
  for(let i=0;i<3;i++){px(legLX+i,legBotY+1,'#00000033');px(legRX+i,legBotY+1,'#00000033');}
}

// ══════════════════════════════════════════════════════
// TAIL
// ══════════════════════════════════════════════════════
function drawTail(px,breed,g,furHex,seed){
  const {cx,tailX,tailY,bHW}=g;
  const tx=tailX, ty=tailY;
  const thick=lightenHex(furHex,18);
  const b=breed||'';
  if(b==='French Bulldog'||b==='Boxer'){px(tx,ty,furHex);px(tx,ty-1,furHex);px(tx+1,ty,darkenHex(furHex,15));return;}
  if(b==='Corgi'){px(tx,ty,furHex);px(tx+1,ty,furHex);return;}
  if(b==='Husky'||b==='Samoyed'||b==='Chow Chow'){
    // curled over back
    const pts=[[tx,ty],[tx+1,ty-1],[tx+2,ty-2],[tx+2,ty-3],[tx+1,ty-4],[tx,ty-4],[tx-1,ty-3]];
    for(const[x,y] of pts){px(x,y,furHex);if(y+1<40)px(x,y+1,thick);}
    return;
  }
  if(b==='Poodle'){
    for(let y=ty-3;y<=ty;y++) px(tx,y,furHex);
    for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++) px(tx+dx,ty-4+dy,lightenHex(furHex,30));
    return;
  }
  if(b==='Dachshund'){
    for(let y=ty-2;y<=ty;y++){px(tx,y,furHex);px(tx+1,y,thick);}
    return;
  }
  if(b==='Beagle'){
    for(let y=ty-3;y<=ty;y++){px(tx,y,furHex);px(tx+1,y,furHex);}
    px(tx,ty-4,'#eeeeee');px(tx+1,ty-4,'#eeeeee');px(tx,ty-5,'#eeeeee');
    return;
  }
  // default wagging tail
  const pts=[[tx,ty],[tx,ty-1],[tx+1,ty-2],[tx+1,ty-3],[tx+2,ty-4],[tx+1,ty-5]];
  for(const[x,y] of pts){px(x,y,furHex);if(x+1<32)px(x+1,y,thick);}
}

// ══════════════════════════════════════════════════════
// HEAD OVAL + SNOUT BLOCK
// ══════════════════════════════════════════════════════
function drawHead(px,g,furHex,muzzleHex){
  const {cx,hCY,hHW,hHH}=g;
  // head
  for(let y=hCY-hHH;y<=hCY+hHH;y++){
    const dy=(y-hCY)/hHH, w=Math.round(hHW*Math.sqrt(Math.max(0,1-dy*dy)));
    if(w<=0) continue;
    for(let x=cx-w;x<cx+w;x++) px(x,y, y<hCY-hHH+2?darkenHex(furHex,15):furHex);
  }
  // snout — clear rectangular block, much lighter
  const {snoutTop,snoutW,snoutH}=g;
  const sw=Math.floor(snoutW/2);
  for(let y=snoutTop;y<snoutTop+snoutH;y++)
    for(let x=cx-sw;x<cx+sw;x++) px(x,y,muzzleHex);
}

// ══════════════════════════════════════════════════════
// HEAD MARKINGS
// ══════════════════════════════════════════════════════
function drawMarkings(px,markings,g,furHex,seed){
  if(!markings||markings.startsWith('None')) return;
  const {cx,hCY,hHW,hHH}=g;
  const dark=darkenHex(furHex,55), light=lightenHex(furHex,65);
  const hTop=hCY-hHH;
  if(markings.includes('Head Spot')){
    for(let y=hCY-3;y<=hCY;y++) for(let x=cx+1;x<=cx+5;x++){const dx=(x-cx-3)/2,dy=(y-hCY+1)/2;if(dx*dx+dy*dy<1)px(x,y,dark+'cc');}
  } else if(markings.includes('Blaze')){
    for(let y=hTop;y<=hCY-2;y++){px(cx-1,y,light);px(cx,y,light);}
  } else if(markings.includes('Cap Pattern')){
    for(let y=hTop;y<=hCY-2;y++){const dy=(y-hCY)/hHH,w=Math.round(hHW*Math.sqrt(Math.max(0,1-dy*dy)));for(let x=cx-w;x<cx+w;x++)px(x,y,dark+'cc');}
  } else if(markings.includes('Merle')){
    for(let i=0;i<7;i++){const mx=cx-3+((seed*(i+7)*3)%(hHW*2-2)),my=hTop+1+((seed*(i+3)*5)%(hHH-1));px(mx,my,dark+'99');px(mx+1,my,dark+'88');px(mx,my+1,dark+'77');}
  } else if(markings.includes('Star')){
    const sy=hTop+2;px(cx,sy-1,light);px(cx-1,sy,light);px(cx,sy,light);px(cx+1,sy,light);px(cx,sy+1,light);
  } else if(markings.includes('Heart')){
    const hy=hTop+2;px(cx-1,hy,light);px(cx,hy,light);px(cx-2,hy+1,light);px(cx+1,hy+1,light);px(cx-1,hy+2,light);px(cx,hy+2,light);px(cx-1,hy+3,light);
  } else if(markings.includes('Eye Patch Marking')){
    for(let dx=-2;dx<=3;dx++) for(let dy=-1;dy<=2;dy++) px(cx-Math.floor(hHW*.55)+dx,g.eyeY+dy,dark+'bb');
  } else if(markings.includes('Full Mask')){
    for(let y=hCY-1;y<=hCY+hHH-1;y++){const dy=(y-hCY)/hHH,w=Math.round(hHW*Math.sqrt(Math.max(0,1-dy*dy)));for(let x=cx-w;x<cx+w;x++)px(x,y,dark+'77');}
  } else if(markings.includes('Tuxedo Top')){
    for(let y=hCY+1;y<=hCY+hHH-1;y++){const dy=(y-(hCY+hHH*.5+1))/(hHH*.5),w=Math.round(hHW*.55*Math.sqrt(Math.max(0,1-dy*dy)));for(let x=cx-w;x<cx+w;x++)px(x,y,'#ffffff88');}
  } else if(markings.includes('Mohawk Fur')){
    for(let y=hTop;y<=hCY-2;y++){px(cx-1,y,'#111');px(cx,y,'#111');}
    for(let i=1;i<=3;i++){px(cx-1,hTop-i,darkenHex(furHex,70));px(cx,hTop-i,darkenHex(furHex,70));}
  } else if(markings.includes('Flame')){
    ['#ff4400','#ff8800','#ffcc00','#ff6600'].forEach((c,i)=>{const fx=cx-3+i*2;px(fx,hTop-2,c);px(fx,hTop-1,c);px(fx,hTop,c);});
  }
}

// ══════════════════════════════════════════════════════
// BREED-SPECIFIC OVERLAYS
// ══════════════════════════════════════════════════════
function drawBreed(px,breed,g,furHex,seed){
  const {cx,hCY,hHW,hHH,eyeY,bCY,bHW,bHH,legLX,legRX,legW,legTopY,legBotY,tailX,tailY}=g;
  if(!breed) return;

  // ── REAL BREEDS ──────────────────────────────────────
  if(breed==='Dalmatian'){
    [[cx-3,hCY-3],[cx+3,hCY-2],[cx-2,hCY+1],[cx+4,hCY+2],[cx-1,hCY-5]].forEach(([sx,sy])=>{px(sx,sy,'#111111cc');px(sx+1,sy,'#111111bb');px(sx,sy+1,'#111111aa');});
    [[cx-4,bCY-2],[cx+3,bCY],[cx-2,bCY+2],[cx+4,bCY-3]].forEach(([sx,sy])=>{px(sx,sy,'#111111cc');px(sx+1,sy,'#111111bb');});
  } else if(breed==='Husky'){
    for(let y=hCY-2;y<=hCY+1;y++){const dy=(y-hCY)/hHH,w=Math.round(hHW*Math.sqrt(Math.max(0,1-dy*dy)));for(let d=0;d<2;d++){px(cx-w+d,y,'#333344aa');px(cx+w-1-d,y,'#333344aa');}}
    for(let y=hCY-1;y<=hCY+2;y++) for(let x=cx-3;x<=cx+3;x++) px(x,y,'#ffffff22');
  } else if(breed==='Poodle'){
    for(let i=0;i<7;i++){const ppx=cx-hHW+2+((seed*(i+2)*3)%(hHW*2-4)),ppy=hCY-hHH+2+((seed*(i+5)*7)%(hHH-2));px(ppx,ppy,lightenHex(furHex,30)+'bb');}
    for(let dx=-2;dx<=2;dx++) for(let dy=-2;dy<=0;dy++) if(dx*dx+dy*dy<=4) px(cx+dx,hCY-hHH-2+dy,lightenHex(furHex,40));
  } else if(breed==='Shiba Inu'){
    const ura='#FFFAEE';
    for(let dx=-2;dx<=0;dx++) for(let dy=0;dy<=2;dy++) px(cx-hHW+2+dx,eyeY+dy+1,ura+'dd');
    for(let dx=0;dx<=2;dx++) for(let dy=0;dy<=2;dy++) px(cx+hHW-3+dx,eyeY+dy+1,ura+'dd');
    for(let y=g.snoutTop+1;y<g.snoutTop+g.snoutH;y++){px(cx-Math.floor(g.snoutW/2)-1,y,ura+'bb');px(cx+Math.floor(g.snoutW/2),y,ura+'bb');}
    px(cx-2,eyeY-2,darkenHex(furHex,35));px(cx-1,eyeY-2,darkenHex(furHex,35));px(cx+1,eyeY-2,darkenHex(furHex,35));px(cx+2,eyeY-2,darkenHex(furHex,35));
    px(cx-1,eyeY-1,darkenHex(furHex,25));px(cx+1,eyeY-1,darkenHex(furHex,25));
    px(cx-1,hCY+hHH-1,ura+'99');px(cx,hCY+hHH-1,ura+'99');
  } else if(breed==='Chow Chow'){
    for(let y=hCY-1;y<=hCY+hHH-1;y++){px(cx-hHW-1,y,furHex);px(cx+hHW,y,furHex);}
    px(cx,g.mouthY+1,'#4444aa');px(cx-1,g.mouthY+1,'#4444aa');
  } else if(breed==='Rottweiler'||breed==='Dobermann'){
    const tan='#cc8833';
    px(cx-Math.floor(hHW*.55),eyeY-1,tan);px(cx-Math.floor(hHW*.55)+1,eyeY-1,tan);
    px(cx+Math.floor(hHW*.55)-1,eyeY-1,tan);px(cx+Math.floor(hHW*.55),eyeY-1,tan);
    px(cx-hHW+2,eyeY+1,tan+'88');px(cx+hHW-3,eyeY+1,tan+'88');
  } else if(breed==='Samoyed'){
    for(let y=hCY-hHH+1;y<=hCY+hHH-1;y++){px(cx-hHW-1,y,'#eeeeee');px(cx+hHW,y,'#eeeeee');}
  } else if(breed==='Border Collie'){
    for(let y=hCY-hHH;y<=hCY-2;y++){px(cx-1,y,'#ffffff');px(cx,y,'#ffffff');}
    for(let y=hCY-hHH;y<=hCY-2;y++){const dy=(y-hCY)/hHH,w=Math.round(hHW*Math.sqrt(Math.max(0,1-dy*dy)));for(let d=0;d<2;d++){px(cx-w+d,y,'#111111cc');px(cx+w-1-d,y,'#111111cc');}}
  } else if(breed==='Corgi'){
    for(let y=hCY+1;y<=hCY+hHH-1;y++){px(cx-hHW,y,furHex);px(cx+hHW-1,y,furHex);}

  // ── CUSTOM ARCHETYPES ─────────────────────────────────
  } else if(breed==='Zombie Doggo'){
    // stitches on body
    [[cx-3,bCY-2],[cx+2,bCY+1],[cx-1,bCY+3],[cx+4,bCY-1]].forEach(([x,y])=>{
      px(x,y,'#111111');px(x+1,y-1,'#111111');px(x-1,y+1,'#2a4a10');
    });
    // exposed bone right leg
    for(let y=legTopY+2;y<legBotY-1;y++){px(legRX+1,y,'#eeeeee');if(y%2===0)px(legRX+1,y,'#ccccaa');}
    // green drool from mouth
    px(cx,g.mouthY+1,'#44aa22');px(cx,g.mouthY+2,'#33881a');px(cx+1,g.mouthY+3,'#226610');
    // bandage on head
    for(let x=cx-hHW+1;x<cx+hHW-1;x++) px(x,hCY-2,'#e8d8b0bb');
    // decay patches on body
    [[cx-5,bCY-1,'#2a4a1088'],[cx+4,bCY+2,'#2a4a1077'],[cx-2,bCY+3,'#3a5a2066']].forEach(([x,y,c])=>{px(x,y,c);px(x+1,y,c);});

  } else if(breed==='RoboDog 3000'){
    // panel seam lines
    for(let y=bCY-bHH+1;y<=bCY+bHH-1;y++) px(cx,y,'#334455');
    for(let x=cx-bHW+1;x<cx+bHW-1;x++) px(x,bCY,'#334455');
    // rivets
    [[cx-bHW+1,bCY-bHH+1],[cx+bHW-2,bCY-bHH+1],[cx-bHW+1,bCY+bHH-1],[cx+bHW-2,bCY+bHH-1]].forEach(([x,y])=>{px(x,y,'#ccddee');px(x+1,y,'#aabbcc');});
    // antenna
    px(cx+1,hCY-hHH-1,'#aabbcc');px(cx+1,hCY-hHH-2,'#8899aa');px(cx+1,hCY-hHH-3,'#00e5ff');
    // LED indicator
    px(cx+hHW-1,hCY,'#00ff41');px(cx+hHW-2,hCY,'#00ff4166');
    // warning stripes on right leg
    for(let y=legTopY;y<legBotY;y+=2){px(legRX,y,'#ffcc00');px(legRX+1,y,'#111111');}
    // circuit traces
    px(cx-3,bCY-2,'#336699');px(cx-3,bCY-1,'#336699');px(cx-2,bCY-1,'#336699');
    px(cx+2,bCY+1,'#336699');px(cx+3,bCY+1,'#336699');px(cx+3,bCY+2,'#336699');

  } else if(breed==='Ghost Pupper'){
    // aura glow around head
    for(let y=hCY-hHH-1;y<=hCY+hHH;y++){px(cx-hHW-1,y,'#8899dd44');px(cx+hHW,y,'#8899dd44');}
    // ghostly wisps replacing leg bottoms
    for(let i=-3;i<=3;i++) px(cx+i*3,legBotY,'#aabbdd77');
    for(let i=-2;i<=2;i++) px(cx+i*4,legBotY+1,'#8899cc55');
    px(cx,legBotY+2,'#6677aa33');
    // ectoplasm drip
    px(cx-1,g.mouthY+1,'#aabbdd');px(cx,g.mouthY+2,'#8899bb');px(cx,g.mouthY+3,'#6677aa88');
    // floating motion dots
    px(cx-hHW-2,hCY-2,'#8899ddaa');px(cx+hHW+2,hCY+1,'#8899ddaa');
    px(cx-hHW-3,hCY+2,'#8899dd66');

  } else if(breed==='Skeleton Rex'){
    // rib cage
    for(let i=0;i<3;i++){
      const ry=bCY-2+i*2;
      for(let x=cx-4;x<=cx-2;x++) px(x,ry,i%2===0?'#ccbbaa':'#eeeeee');
      for(let x=cx+2;x<=cx+4;x++) px(x,ry,i%2===0?'#ccbbaa':'#eeeeee');
    }
    // spine
    for(let y=bCY-bHH+1;y<=bCY+bHH-1;y+=2) px(cx,y,'#ccbbaa');
    // leg bone segments
    for(let y=legTopY+1;y<legBotY;y+=3){px(legLX,y,'#eeeeee');px(legLX+1,y,'#ccbbaa');px(legRX,y,'#eeeeee');px(legRX+1,y,'#ccbbaa');}
    // eye socket shadows
    for(let dx=0;dx<=1;dx++) for(let dy=0;dy<=1;dy++){px(g.lex+dx-1,eyeY+dy-1,'#33222244');px(g.rex+dx-1,eyeY+dy-1,'#33222244');}
    // jaw bone
    for(let x=cx-3;x<=cx+3;x++) px(x,hCY+hHH-1,'#ccbbaaaa');

  } else if(breed==='Demon Shibe'){
    // devil horns
    const hornY=hCY-hHH-1;
    px(cx-hHW+2,hornY,'#880000');px(cx-hHW+2,hornY-1,'#990000');px(cx-hHW+3,hornY-2,'#aa0000');
    px(cx+hHW-3,hornY,'#880000');px(cx+hHW-3,hornY-1,'#990000');px(cx+hHW-4,hornY-2,'#aa0000');
    // hellfire at feet
    const fY=legBotY;const fC=['#ff4400','#ff8800','#ffcc00'];
    for(let i=-2;i<=2;i++) px(cx+i*4,fY,fC[Math.abs(i)%3]);
    for(let i=-1;i<=1;i++) px(cx+i*4,fY-1,fC[Math.abs(i)%3]);
    px(cx,fY-2,'#ffcc00');
    // dark aura
    for(let i=0;i<4;i++){const ay=hCY-hHH-1+i*5;px(cx-hHW-2,ay,'#44000033');px(cx+hHW+1,ay,'#44000033');}
    // forked tail tip
    px(tailX,tailY-5,'#880000');px(tailX+1,tailY-6,'#aa0000');px(tailX-1,tailY-6,'#aa0000');

  } else if(breed==='Angel Paw'){
    // halo
    for(let x=cx-3;x<=cx+3;x++) px(x,hCY-hHH-2,'#ffe600');
    px(cx-4,hCY-hHH-1,'#ffe600');px(cx+4,hCY-hHH-1,'#ffe600');
    px(cx-3,hCY-hHH-3,'#ffe600');px(cx+3,hCY-hHH-3,'#ffe600');
    // wing shapes on body sides
    for(let y=bCY-bHH+1;y<=bCY+1;y++){px(cx-bHW-2,y,'#fffff0');px(cx-bHW-3,y,'#ffffd8');px(cx+bHW+1,y,'#fffff0');px(cx+bHW+2,y,'#ffffd8');}
    // feather tips
    px(cx-bHW-4,bCY-2,'#fffff0');px(cx-bHW-4,bCY,'#fffff0');px(cx+bHW+3,bCY-2,'#fffff0');px(cx+bHW+3,bCY,'#fffff0');
    // golden sparkles
    [[cx-6,hCY-3],[cx+5,hCY-1],[cx-4,bCY+2],[cx+6,bCY-1]].forEach(([x,y])=>{px(x,y,'#ffe60088');px(x,y-1,'#ffe60055');px(x-1,y,'#ffe60055');});

  } else if(breed==='Alien Woof'){
    // antenna
    for(let i=1;i<=4;i++) px(cx,hCY-hHH-i,'#88cc88');
    px(cx-1,hCY-hHH-4,'#00ff8855');px(cx+1,hCY-hHH-4,'#00ff8855');px(cx,hCY-hHH-5,'#00ff88');
    // brain pulse on top of head
    for(let x=cx-hHW+2;x<cx+hHW-2;x++) if((x+hCY)%3===0) px(x,hCY-hHH,'#66aa6644');
    // tiny fingers on paws
    px(legLX-1,legBotY,'#44aa44');px(legRX+legW,legBotY,'#44aa44');
    // vein glow on body
    px(cx-2,bCY,'#44aa4455');px(cx+1,bCY-1,'#44aa4455');px(cx-1,bCY+1,'#44aa4444');

  } else if(breed==='Pixel Dragon'){
    // diamond scale pattern on body
    for(let y=bCY-bHH+1;y<=bCY+bHH-1;y++)
      for(let x=cx-bHW+1;x<cx+bHW-1;x++)
        if((x+y)%2===0) px(x,y,lightenHex(furHex,12));
        else if((x+y)%4===0) px(x,y,darkenHex(furHex,18));
    // back spikes
    for(let i=0;i<5;i++){const sx=cx-4+i*2,sy=bCY-bHH-1-i%2;px(sx,sy,'#88aaaa');px(sx,sy-1,'#aacccc');}
    // wing hints
    for(let d=0;d<4;d++){px(cx-bHW-2-d,bCY-2-d,'#2a6644');px(cx+bHW+1+d,bCY-2-d,'#2a6644');}
    // claw toes
    px(legLX-1,legBotY+1,'#334433');px(legRX+legW,legBotY+1,'#334433');

  } else if(breed==='Cosmic Bork'){
    // stars on body
    [[cx-3,bCY-3],[cx+4,bCY-2],[cx-5,bCY+1],[cx+2,bCY+3],[cx-1,bCY-4],[cx+5,bCY+2]].forEach(([x,y])=>{px(x,y,'#ffffff');px(x-1,y,'#ffffff44');px(x+1,y,'#ffffff44');});
    // nebula patches
    [[cx-4,bCY,'#4455ff44'],[cx+3,bCY-1,'#ff44aa33'],[cx-2,bCY+2,'#44ffaa33']].forEach(([x,y,c])=>{for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++) px(x+dx,y+dy,c);});
    // stars on head
    [[cx-2,hCY-3],[cx+3,hCY-2],[cx-4,hCY+1]].forEach(([x,y])=>px(x,y,'#ffffff'));
    // constellation line
    for(let x=g.lex+2;x<g.rex;x++) px(x,eyeY,'#ffffff22');
    // milky way
    for(let i=0;i<6;i++) px(cx-3+i,bCY-1,'#ffffff11');

  } else if(breed==='Glitch Doggo'){
    // RGB color shift on body
    const gY1=bCY-2,gY2=hCY+1;
    for(let x=cx-3;x<=cx+3;x++){px(x-2,gY1,'#ff000066');px(x+2,gY1,'#0000ff66');}
    for(let x=cx-2;x<=cx+2;x++){px(x-1,gY2,'#ff000055');px(x+1,gY2,'#00ffff55');}
    // corrupted blocks
    px(cx-6,bCY,'#ff2d7b');px(cx-5,bCY,'#ff2d7b');
    px(cx+5,bCY-1,'#00e5ff');px(cx+6,bCY-1,'#00e5ff');
    px(cx-4,hCY-2,'#ffe600');px(cx+3,hCY+2,'#ff2d7b');
    // scanline artifacts
    for(let x=2;x<30;x++) px(x,bCY-3,'#00000022');
    for(let x=2;x<30;x++) px(x,bCY+2,'#ffffff11');
    // missing pixel holes
    px(cx,bCY,'#000000');px(cx-3,hCY,'#000000');

  } else if(breed==='Golden Statue'){
    // gleam highlight
    px(cx-hHW+1,hCY-hHH+1,'#ffffaa');px(cx-hHW+2,hCY-hHH+2,'#ffffaa');
    px(cx-hHW+1,hCY,'#ffffff88');
    // gold sheen on body
    for(let y=bCY-bHH+1;y<=bCY+bHH-1;y++){const dy=(y-bCY)/bHH,w=Math.round(bHW*Math.sqrt(Math.max(0,1-dy*dy)));if(w>0)px(cx-w+1,y,'#ffffaa88');}
    // plinth / base
    for(let x=cx-7;x<=cx+7;x++){px(x,legBotY+2,'#cc9900');px(x,legBotY+3,'#aa7700');}
    for(let x=cx-6;x<=cx+6;x++) px(x,legBotY+4,'#886600');
    // plaque dots
    for(let x=cx-3;x<=cx+3;x+=2) px(x,legBotY+3,'#ffe60088');

  } else if(breed==='Mummy Pup'){
    // bandage stripes on body
    for(let y=bCY-bHH+1;y<=bCY+bHH-1;y+=2){
      const dy=(y-bCY)/bHH,w=Math.round(bHW*Math.sqrt(Math.max(0,1-dy*dy)));
      for(let x=cx-w+1;x<cx+w-1;x++) px(x,y,'#d4c898aa');
    }
    // wrapped legs
    for(let y=legTopY;y<legBotY;y+=3){
      for(let x=legLX;x<legLX+legW;x++) px(x,y,'#d4c898');
      for(let x=legRX;x<legRX+legW;x++) px(x,y,'#d4c898');
    }
    // head wrappings
    for(let x=cx-hHW+1;x<cx+hHW-1;x++){px(x,hCY-2,'#d4c89888');px(x,hCY+1,'#d4c89866');}
    // scarab on chest
    px(cx,bCY-1,'#8855aa');px(cx-1,bCY-1,'#8855aa');px(cx+1,bCY-1,'#8855aa');px(cx,bCY-2,'#aa77cc');

  } else if(breed==='Vampire Hound'){
    // cape sides
    for(let y=bCY-bHH+1;y<=bCY+bHH;y++){
      px(cx-bHW-1,y,'#330033');px(cx-bHW-2,y,'#220022');
      px(cx+bHW,y,'#330033');px(cx+bHW+1,y,'#220022');
    }
    px(cx-bHW-3,bCY,'#110011');px(cx+bHW+2,bCY,'#110011');
    // cape collar
    for(let x=cx-bHW;x<=cx+bHW-1;x++) px(x,bCY-bHH,'#440022');
    // red eye glow halos
    px(g.lex-1,eyeY,'#ff000033');px(g.lex+2,eyeY,'#ff000033');
    px(g.rex-1,eyeY,'#ff000033');px(g.rex+2,eyeY,'#ff000033');
    // neck bite marks
    px(cx-hHW+2,hCY+hHH-2,'#aa0000');px(cx-hHW+3,hCY+hHH-2,'#aa0000');

  } else if(breed==='Cyber Mutt'){
    // circuit traces on body
    px(cx-4,bCY-2,'#00e5ff');px(cx-3,bCY-2,'#00e5ff');px(cx-3,bCY,'#00e5ff');
    px(cx+2,bCY+1,'#ff2d7b');px(cx+3,bCY+1,'#ff2d7b');px(cx+3,bCY-1,'#ff2d7b');
    px(cx-1,bCY,'#ffe600');px(cx,bCY,'#ffe600');px(cx,bCY+2,'#ffe600');
    // neon joints
    px(legLX,legTopY,'#00e5ff');px(legLX+2,legTopY,'#00e5ff');
    px(legRX,legTopY,'#00e5ff');px(legRX+2,legTopY,'#00e5ff');
    // HUD corners
    px(2,4,'#00e5ff');px(3,4,'#00e5ff');px(2,5,'#00e5ff');
    px(28,4,'#ff2d7b');px(29,4,'#ff2d7b');px(29,5,'#ff2d7b');
    // implant mark on head
    px(cx+hHW-2,hCY,'#00e5ff');px(cx+hHW-1,hCY,'#00e5ff88');
    // data stream on left leg
    for(let y=legTopY+1;y<legBotY;y+=3) px(legLX+1,y,'#00e5ff88');
  }
}

// ══════════════════════════════════════════════════════
// EYEWEAR
// ══════════════════════════════════════════════════════
function drawGlasses(px,glasses,lex,rex,eyeY){
  if(!glasses||glasses.startsWith('None')) return;
  if(glasses.includes('Nerd')){
    for(let dx=-1;dx<=2;dx++){px(lex+dx,eyeY-1,'#111');px(lex+dx,eyeY+2,'#111');px(rex+dx,eyeY-1,'#111');px(rex+dx,eyeY+2,'#111');}
    px(lex-1,eyeY,'#111');px(lex+3,eyeY,'#111');px(lex-1,eyeY+1,'#111');px(lex+3,eyeY+1,'#111');
    px(rex-1,eyeY,'#111');px(rex+3,eyeY,'#111');px(rex-1,eyeY+1,'#111');px(rex+3,eyeY+1,'#111');
    for(let x=lex+3;x<=rex-1;x++) px(x,eyeY,'#777');
  } else if(glasses.includes('Aviator')||glasses.includes('Gold Aviator')){
    const gc=glasses.includes('Gold')?'#cc9900':'#886633', t='#88ccff22';
    for(let dx=0;dx<=1;dx++){px(lex+dx,eyeY-1,gc);px(lex+dx,eyeY+2,gc);px(rex+dx,eyeY-1,gc);px(rex+dx,eyeY+2,gc);}
    px(lex-1,eyeY,gc);px(lex,eyeY,t);px(lex+1,eyeY,t);px(lex+2,eyeY,gc);
    px(rex-1,eyeY,gc);px(rex,eyeY,t);px(rex+1,eyeY,t);px(rex+2,eyeY,gc);
    for(let x=lex+2;x<=rex-1;x++) px(x,eyeY,gc);
  } else if(glasses.includes('VR Visor')){
    for(let x=lex-2;x<=rex+3;x++){px(x,eyeY-1,'#1a1a44');px(x,eyeY,'#00ccff33');px(x,eyeY+1,'#1a1a44');}
    for(let x=lex-1;x<=rex+2;x++) px(x,eyeY,'#00ccff55');
  } else if(glasses.includes('Black Wayfarer')){
    for(let dx=-1;dx<=2;dx++) for(let dy=-1;dy<=2;dy++){px(lex+dx,eyeY+dy,'#111');px(rex+dx,eyeY+dy,'#111');}
    for(let x=lex+2;x<rex-1;x++) px(x,eyeY,'#111');
  } else if(glasses.includes('Round Lennon')){
    const w='#aaaaaa';
    px(lex-1,eyeY,w);px(lex+2,eyeY,w);px(lex,eyeY-1,w);px(lex+1,eyeY-1,w);px(lex,eyeY+1,w);px(lex+1,eyeY+1,w);
    px(rex-1,eyeY,w);px(rex+2,eyeY,w);px(rex,eyeY-1,w);px(rex+1,eyeY-1,w);px(rex,eyeY+1,w);px(rex+1,eyeY+1,w);
    for(let x=lex+2;x<rex-1;x++) px(x,eyeY,w+'44');
  } else if(glasses.includes('3D Cinema')){
    const f='#333';
    for(let dx=-1;dx<=2;dx++){px(lex+dx,eyeY-1,f);px(lex+dx,eyeY+2,f);px(rex+dx,eyeY-1,f);px(rex+dx,eyeY+2,f);}
    px(lex,eyeY,'#ff000099');px(lex+1,eyeY,'#ff000099');px(rex,eyeY,'#00ccff99');px(rex+1,eyeY,'#00ccff99');
    for(let x=lex+2;x<rex;x++) px(x,eyeY,f);
  }
}

// ══════════════════════════════════════════════════════
// COLLAR
// ══════════════════════════════════════════════════════
function drawCollar(px,collar,cx,y){
  if(!collar||collar.startsWith('None')) return;
  const c=collar;
  if(c.includes('Simple Red')){for(let x=cx-7;x<=cx+7;x++){px(x,y,'#cc2222');px(x,y+1,'#991111');}px(cx,y,'#ffaa00');px(cx+1,y,'#ffaa00');}
  else if(c.includes('Spiked Punk')){for(let x=cx-7;x<=cx+7;x++) px(x,y,'#444');for(let i=-6;i<=6;i+=2) px(cx+i,y-1,'#aaa');px(cx-4,y,'#00e5ff');px(cx+4,y,'#00e5ff');}
  else if(c.includes('Golden Fancy')){for(let x=cx-7;x<=cx+7;x++) px(x,y,x%2===0?'#ffe600':'#cc9900');for(let x=cx-6;x<=cx+6;x++) px(x,y+1,x%2===0?'#cc9900':'#aa7700');px(cx,y+2,'#ffe600');}
  else if(c.includes('Flower')){for(let x=cx-7;x<=cx+7;x++) px(x,y,'#33aa33');px(cx-3,y-1,'#ff6699');px(cx-2,y-1,'#ff6699');px(cx+2,y-1,'#ff6699');px(cx+3,y-1,'#ff6699');px(cx,y-1,'#ffff00');}
  else if(c.includes('Pearl')){for(let x=cx-7;x<=cx+7;x++) px(x,y,x%2===0?'#fff':'#ddd');}
  else if(c.includes('LED')){for(let x=cx-7;x<=cx+7;x++) px(x,y,'#111');['#f00','#0f0','#00f','#f0f','#ff0','#0ff'].forEach((cc,i)=>px(cx-5+i*2,y,cc));}
  else if(c.includes('Bandana')){for(let x=cx-7;x<=cx+7;x++) px(x,y,'#cc2222');for(let x=cx-5;x<=cx+5;x++) px(x,y+1,'#aa1111');for(let x=cx-3;x<=cx+3;x++) px(x,y+2,'#881111');}
  else if(c.includes('Bowtie')){for(let x=cx-5;x<=cx+5;x++) px(x,y,'#1a1a2a');px(cx-3,y-1,'#cc2222');px(cx-2,y-1,'#cc2222');px(cx-3,y+1,'#cc2222');px(cx-2,y+1,'#cc2222');px(cx+2,y-1,'#cc2222');px(cx+3,y-1,'#cc2222');px(cx+2,y+1,'#cc2222');px(cx+3,y+1,'#cc2222');px(cx-1,y,'#cc2222');px(cx+1,y,'#cc2222');}
  else{for(let x=cx-6;x<=cx+6;x++) px(x,y,'#cc2222');}
}

// ══════════════════════════════════════════════════════
// HAT
// ══════════════════════════════════════════════════════
function drawHat(px,hat,g,pick,fSeed){
  if(!hat||hat==='None') return;
  const {cx,hCY,hHW,hHH}=g;
  const ox=cx-hHW, faceW=hHW*2, hb=hCY-hHH-1;
  if(hat==='Top Hat'){
    for(let x=ox-2;x<=ox+faceW+1;x++){px(x,hb,'#2a2a2a');px(x,hb-1,'#2a2a2a');}
    for(let y=hb-6;y<hb-1;y++) for(let x=cx-2;x<=cx+2;x++) px(x,y,'#111');
    for(let x=cx-2;x<=cx+2;x++) px(x,hb-3,'#553300');
  } else if(hat==='Snapback Cap'){
    const hc=pick(fSeed+10);
    for(let x=ox-1;x<=ox+faceW+2;x++) px(x,hb,'#222');
    for(let y=hb-4;y<hb;y++) for(let x=ox;x<ox+faceW;x++) px(x,y,hc);
    px(cx,hb-4,'#fff');
  } else if(hat==='Backwards Cap'){
    const hc=pick(fSeed+11);
    for(let x=ox-3;x<=ox+1;x++) px(x,hb,'#222');
    for(let y=hb-4;y<hb;y++) for(let x=ox;x<ox+faceW;x++) px(x,y,hc);
  } else if(hat==='Cowboy Hat'){
    const hc=pick(fSeed+12),br=pick(fSeed+13);
    for(let x=ox-5;x<=ox+faceW+4;x++){px(x,hb,br);if(x<ox-1||x>ox+faceW)px(x,hb-1,br);}
    for(let y=hb-5;y<hb;y++) for(let x=cx-3;x<=cx+3;x++) if(!(y===hb-5&&(x===cx-3||x===cx+3))) px(x,y,hc);
    for(let x=cx-3;x<=cx+3;x++) px(x,hb-2,'#774400');
  } else if(hat==='Fedora'){
    const hc=pick(fSeed+14);
    for(let x=ox-2;x<=ox+faceW+1;x++) px(x,hb,hc);
    for(let y=hb-4;y<hb;y++){const w=y<hb-3?3:4;for(let x=cx-w;x<=cx+w;x++) px(x,y,hc);}
    for(let x=cx-4;x<=cx+4;x++) px(x,hb-2,'#222');
  } else if(hat==='Viking Helmet'){
    const hornC='#e0c070';
    for(let y=hb-4;y<hb;y++) for(let x=ox+1;x<ox+faceW-1;x++) px(x,y,'#999');
    px(ox-1,hb-2,hornC);px(ox-2,hb-3,hornC);px(ox-3,hb-4,hornC);px(ox-3,hb-5,hornC);
    px(ox+faceW,hb-2,hornC);px(ox+faceW+1,hb-3,hornC);px(ox+faceW+2,hb-4,hornC);px(ox+faceW+2,hb-5,hornC);
  } else if(hat==='Flower Crown'){
    for(let x=ox;x<ox+faceW;x++) px(x,hb,'#33aa33');
    ['#ff6699','#ff9900','#ffff00','#66ff66','#66aaff','#cc66ff'].forEach((c,i)=>{const fx=ox+1+i*Math.floor((faceW-2)/6);px(fx,hb-1,c);px(fx,hb-2,c);});
  } else if(hat==='Party Hat'){
    const hc=pick(fSeed+20);
    for(let y=hb-6;y<hb;y++){const w=Math.max(0,Math.round((hb-y)*2/6));for(let x=cx-w;x<=cx+w;x++) px(x,y,hc);}
    for(let x=ox;x<ox+faceW;x++) px(x,hb,'#333');
    px(cx,hb-7,'#ffff00');px(cx-1,hb-7,'#ffff00');px(cx+1,hb-7,'#ffff00');
  } else if(hat==='Beret'){
    const hc=pick(fSeed+21);
    for(let x=ox+1;x<ox+faceW+3;x++){px(x,hb,hc);px(x,hb-1,hc);px(x,hb-2,hc);}
    for(let x=ox+2;x<ox+faceW+1;x++) px(x,hb-3,hc);
    px(cx+2,hb-3,'#fff');
  } else if(hat==='Military Cap'){
    for(let y=hb-4;y<hb;y++) for(let x=ox;x<ox+faceW;x++) px(x,y,'#4a6a3a');
    for(let x=ox-2;x<=ox+faceW+1;x++) px(x,hb,'#3a5a2a');
    px(cx-1,hb-2,'#ffe600');px(cx,hb-2,'#ffe600');px(cx+1,hb-2,'#ffe600');
  } else if(hat==='Knit Beanie'){
    const hc=pick(fSeed+18),st=pick(fSeed+19);
    for(let y=hb-4;y<=hb;y++) for(let x=ox-1;x<=ox+faceW;x++) px(x,y,hc);
    for(let x=ox-1;x<=ox+faceW;x++) px(x,hb-1,x%2===0?st:hc);
    px(cx,hb-5,'#fff');
  } else if(hat==='Pixel Crown'){
    const cc='#ffe600',gem='#ff2d7b';
    for(let x=ox;x<ox+faceW;x++){px(x,hb,cc);px(x,hb-1,cc);}
    px(cx-1,hb-3,cc);px(cx,hb-4,cc);px(cx+1,hb-3,cc);px(cx,hb-1,'#00e5ff');px(cx-2,hb-1,gem);px(cx+2,hb-1,gem);
  } else if(hat==='Sombrero'){
    const hc=pick(fSeed+16),br=pick(fSeed+17);
    for(let x=ox-6;x<=ox+faceW+5;x++){px(x,hb,br);if(x<ox-1||x>ox+faceW)px(x,hb-1,br);}
    for(let y=hb-4;y<hb;y++) for(let x=cx-3;x<=cx+3;x++) px(x,y,hc);
    for(let x=cx-3;x<=cx+3;x++) px(x,hb-2,'#ff4422');
  } else if(hat==='Chef Hat'){
    for(let y=hb-5;y<hb;y++) for(let x=ox;x<ox+faceW;x++) px(x,y,'#fff');
    for(let x=ox-1;x<=ox+faceW;x++) px(x,hb,'#ddd');
  } else if(hat==='Pirate Hat'){
    for(let y=hb-4;y<hb;y++) for(let x=ox;x<ox+faceW;x++) px(x,y,'#111');
    px(ox-2,hb,'#111');px(ox+faceW+1,hb,'#111');
    px(cx-2,hb-2,'#fff');px(cx-1,hb-2,'#fff');px(cx,hb-3,'#fff');px(cx+1,hb-2,'#fff');px(cx+2,hb-2,'#fff');px(cx,hb-2,'#000');
  } else if(hat==='Space Helmet'){
    for(let y=hb-5;y<hb;y++) for(let x=ox-1;x<ox+faceW+1;x++) px(x,y,'#334455');
    for(let y=hb-4;y<hb-1;y++) for(let x=ox+1;x<ox+faceW-1;x++) px(x,y,'#88ccff22');
  } else if(hat==='Ninja Headband'){
    for(let x=ox-1;x<=ox+faceW;x++){px(x,hb,'#222');px(x,hb-1,'#222');}
    for(let x=cx-3;x<=cx+3;x++) px(x,hb-1,'#aaa');
    px(ox+faceW+1,hb,'#222');px(ox+faceW+2,hb+1,'#222');
  } else if(hat==='Propeller Hat'){
    const hc=pick(fSeed+24);
    for(let y=hb-3;y<hb;y++) for(let x=ox+1;x<ox+faceW-1;x++) px(x,y,hc);
    px(cx,hb-3,'#777');px(cx,hb-4,'#777');
    px(cx-3,hb-4,pick(fSeed+25));px(cx+2,hb-4,pick(fSeed+26));
  } else if(hat==='Jester Hat'){
    const a=pick(fSeed+27),b2=pick(fSeed+28);
    for(let x=ox-1;x<=ox+faceW;x++){px(x,hb,a);px(x,hb-1,a);}
    for(let y=hb-5;y<=hb-2;y++) for(let x=ox-1;x<=ox+1;x++) px(x,y,a);
    px(ox,hb-6,b2);
    for(let y=hb-5;y<=hb-2;y++) for(let x=ox+faceW-1;x<=ox+faceW+1;x++) px(x,y,b2);
    px(ox+faceW,hb-6,a);
    for(let y=hb-5;y<=hb-2;y++) for(let x=cx-1;x<=cx+1;x++) px(x,y,(y+x)%2===0?a:b2);
    px(cx,hb-6,'#ffe600');
  } else if(hat==='Devil Horns'){
    // two curved devil horns above head
    px(ox+1,hb-1,'#880000');px(ox+1,hb-2,'#aa0000');px(ox+2,hb-3,'#cc0000');px(ox+1,hb-4,'#aa0000');
    px(ox+faceW-2,hb-1,'#880000');px(ox+faceW-2,hb-2,'#aa0000');px(ox+faceW-3,hb-3,'#cc0000');px(ox+faceW-2,hb-4,'#aa0000');
    // tip glow
    px(ox+2,hb-3,'#ff2200');px(ox+faceW-3,hb-3,'#ff2200');
  } else if(hat==='Wizard Hat'){
    // tall pointed wizard hat with stars
    for(let y=hb-8;y<hb;y++){const w=Math.max(0,Math.round((hb-y)*faceW*0.15/8));for(let x=cx-w;x<=cx+w;x++) px(x,y,'#1a1155');}
    for(let x=ox-3;x<=ox+faceW+2;x++){px(x,hb,'#220066');px(x,hb-1,'#220066');}
    px(cx-1,hb-5,'#ffe600');px(cx+1,hb-3,'#00e5ff');px(cx-2,hb-2,'#ff2d7b'); // stars
    px(cx,hb-7,'#ffe60088');
  } else if(hat==='Tiara'){
    // elegant tiara band with gems
    for(let x=ox+1;x<ox+faceW-1;x++) px(x,hb,'#cc9900');
    for(let x=ox+2;x<ox+faceW-2;x++) px(x,hb-1,'#aa7700');
    // center gem
    px(cx-1,hb-2,'#00e5ff');px(cx,hb-3,'#00e5ff');px(cx+1,hb-2,'#00e5ff');px(cx,hb-2,'#ffffff');
    // side gems
    px(cx-3,hb-1,'#ff2d7b');px(cx+3,hb-1,'#ff2d7b');
    px(cx-5,hb,'#ffe600');px(cx+5,hb,'#ffe600');
  } else if(hat==='Crown of Thorns'){
    for(let x=ox;x<ox+faceW;x++) px(x,hb,'#553311');
    for(let i=0;i<5;i++){const tx=ox+2+i*Math.floor((faceW-4)/4);px(tx,hb-1,'#553311');px(tx,hb-2,'#442200');if(i%2===0)px(tx,hb-3,'#442200');}
    // blood drops
    px(cx-2,hb+1,'#aa000077');px(cx+2,hb+1,'#aa000077');
  } else if(hat==='Graduation Cap'){
    for(let x=ox-2;x<=ox+faceW+1;x++) px(x,hb,'#111');
    for(let y=hb-3;y<hb;y++) for(let x=ox;x<ox+faceW;x++) px(x,y,'#111');
    px(cx+Math.floor(faceW*.3),hb-3,'#ffe600'); // tassel
    for(let i=0;i<3;i++) px(cx+Math.floor(faceW*.3),hb-2-i,'#ffe600');
  } else if(hat==='Dunce Cap'){
    const hc='#dddddd';
    for(let y=hb-8;y<hb;y++){const w=Math.max(0,Math.round((hb-y)*faceW*0.15/8));for(let x=cx-w;x<=cx+w;x++) px(x,y,hc);}
    // D on the cap
    px(cx-1,hb-5,'#cc2222');px(cx,hb-6,'#cc2222');px(cx,hb-5,'#cc2222');px(cx,hb-4,'#cc2222');px(cx-1,hb-4,'#cc2222');
    px(cx+1,hb-5,'#cc2222');
  } else if(hat==='Fez Hat'){
    const hc='#cc2222';
    for(let y=hb-5;y<hb;y++) for(let x=cx-3;x<=cx+3;x++) px(x,y,hc);
    for(let x=cx-3;x<=cx+3;x++) px(x,hb,'#aa1111');
    // tassel
    px(cx+1,hb-5,'#111');for(let i=0;i<3;i++) px(cx+1,hb-5-i,'#cc9900');
    px(cx,hb-8,'#cc9900');px(cx+2,hb-8,'#cc9900');
  } else if(hat==='Baseball Helmet'){
    for(let y=hb-4;y<hb;y++) for(let x=ox;x<ox+faceW;x++) px(x,y,'#221122');
    for(let x=ox-1;x<=ox+faceW+2;x++) px(x,hb,'#221122');
    for(let x=ox;x<ox+faceW;x++) px(x,hb-4,'#33223355');
    px(cx,hb-2,'#cc2222'); // logo mark
  } else if(hat==='Hard Hat'){
    for(let y=hb-4;y<hb;y++) for(let x=ox;x<ox+faceW;x++) px(x,y,'#ffcc00');
    for(let x=ox-2;x<=ox+faceW+1;x++) px(x,hb,'#cc9900');
    px(cx-1,hb-2,'#000');px(cx,hb-2,'#000');px(cx+1,hb-2,'#000'); // safety ridge
  } else if(hat==='Bicycle Helmet'){
    for(let y=hb-4;y<hb;y++) for(let x=ox+1;x<ox+faceW-1;x++) px(x,y,pick(fSeed+30));
    for(let x=ox-1;x<=ox+faceW;x++) px(x,hb,'#222');
    for(let i=0;i<3;i++){const vx=ox+3+i*(Math.floor(faceW/3));px(vx,hb-1,'#ffffff55');px(vx,hb-2,'#ffffff33');}
  }
}

// ══════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════
function drawPixelDog(canvas,traits){
  const ctx=canvas.getContext('2d');
  const W=256,H=320,P=8,COLS=32,ROWS=40;
  ctx.imageSmoothingEnabled=false;
  ctx.clearRect(0,0,W,H);

  const pal=getColors(traits.palette||'PICO-8');
  const pick=i=>pal[Math.abs(i)%pal.length];
  const seed=hashStr(JSON.stringify(traits));
  const px=(x,y,c)=>{if(x<0||x>=COLS||y<0||y>=ROWS)return;ctx.fillStyle=c;ctx.fillRect(x*P,y*P,P,P);};

  const g=getGeo(traits.faceShape||'');
  const {cx,hCY,hHW,hHH,eyeY,neckY,bCY,bHW,bHH}=g;
  const lex=cx-g.lexOff, rex=cx+g.rexOff;
  const fSeed=hashStr(traits.frame||'');

  // Archetype skin override — custom types ignore the fur selector
  const breed = traits.type || '';
  let furHex = (traits.skin.match(/#[0-9A-Fa-f]{6}/)||['#CC8833'])[0];
  if (typeof ARCHETYPE_SKINS !== 'undefined' && ARCHETYPE_SKINS[breed]) {
    furHex = ARCHETYPE_SKINS[breed].fur;
  }
  const furDark=darkenHex(furHex,35);
  const muzzleHex = (typeof ARCHETYPE_SKINS!=='undefined'&&ARCHETYPE_SKINS[breed])
    ? ARCHETYPE_SKINS[breed].snout : getMuzzleColor(furHex);

  // ── BG ──
  drawBg(ctx,px,traits.bg||'Void Black #000',pick,seed);

  // ── FRAME ──
  drawFrame(px,traits.frame||'Classic Wood Pixel Frame',pick,fSeed);

  // ── 1. LEGS + HAUNCHES (deepest layer) ──
  drawLegs(px,g,furHex);

  // ── 2. UPRIGHT EARS (behind head) ──
  const earType=traits.beard||'Floppy Short';
  const isUpright=earType.startsWith('Pointy')||earType.startsWith('Wolf')||earType.startsWith('Bat')||earType.startsWith('Corgi')||earType.startsWith('Folded');
  if(isUpright) drawUprightEars(px,earType,g,furHex);

  // ── 3. BODY ──
  drawBodyOval(px,g,furHex);
  drawOutfit(px,g,traits.body||'Natural Fur',furHex,pick,seed);

  // ── 4. TAIL (drawn after body so it's on top at body-top level) ──
  drawTail(px,traits.type||'',g,furHex,seed);

  // ── 5. NECK ──
  for(let y=hCY+hHH;y<=neckY+1;y++) for(let x=cx-3;x<=cx+3;x++) px(x,y,furHex);

  // ── 6. HEAD ──
  drawHead(px,g,furHex,muzzleHex);

  // ── 7. FLOPPY EARS (after head — drape from sides) ──
  if(!isUpright) drawFloppyEars(px,earType,g,furHex);

  // ── 8. MARKINGS ──
  drawMarkings(px,traits.hair||'None',g,furHex,seed);

  // ── 9. EYES (33 types) ──
  const etrait=traits.eye||'Brown Puppy Eyes';
  let ec='#331100';
  if(etrait.includes('Blue'))  ec='#4499ff';
  if(etrait.includes('Green')) ec='#00ff41';
  if(etrait.includes('Red'))   ec='#ff2200';
  if(etrait.includes('Fire'))  ec='#ff6600';
  if(etrait.includes('Ice'))   ec='#88ccff';
  if(etrait.includes('Money')) ec='#44cc44';

  if(etrait.includes('X_X')){
    px(lex,eyeY,'#f00');px(lex+1,eyeY+1,'#f00');px(lex+1,eyeY,'#f00');px(lex,eyeY+1,'#f00');
    px(rex,eyeY,'#f00');px(rex+1,eyeY+1,'#f00');px(rex+1,eyeY,'#f00');px(rex,eyeY+1,'#f00');
  } else if(etrait.includes('Laser Eyes')){
    // 2x2 red eyes + beams shooting out
    px(lex,eyeY,'#ff0000');px(lex+1,eyeY,'#ff4400');px(lex,eyeY+1,'#ff0000');px(lex+1,eyeY+1,'#ff2200');
    px(rex,eyeY,'#ff0000');px(rex+1,eyeY,'#ff4400');px(rex,eyeY+1,'#ff0000');px(rex+1,eyeY+1,'#ff2200');
    for(let i=1;i<=5;i++){px(lex-i,eyeY,'#ff000077');px(rex+2+i,eyeY,'#ff000077');}
    px(lex-5,eyeY-1,'#ff000044');px(rex+6,eyeY-1,'#ff000044');
  } else if(etrait.includes('Heterochromia')){
    px(lex,eyeY,'#553311');px(lex+1,eyeY,'#664422');px(lex,eyeY+1,'#443300');px(lex+1,eyeY+1,'#ffffff55');
    px(rex,eyeY,'#4499ff');px(rex+1,eyeY,'#66aaff');px(rex,eyeY+1,'#3388ee');px(rex+1,eyeY+1,'#ffffff66');
  } else if(etrait.includes('Wide Anime')||etrait.includes('Puppy Shine')){
    for(let dy2=0;dy2<3;dy2++) for(let dx2=0;dx2<3;dx2++){px(lex+dx2,eyeY+dy2,ec);px(rex+dx2,eyeY+dy2,ec);}
    px(lex+2,eyeY,'#fff');px(rex+2,eyeY,'#fff');
    px(lex,eyeY+2,darkenHex(ec,20));px(rex,eyeY+2,darkenHex(ec,20));
  } else if(etrait.includes('Boba Tea')){
    // large dark circle eyes with highlight
    for(let dy2=0;dy2<3;dy2++) for(let dx2=0;dx2<3;dx2++){px(lex+dx2,eyeY+dy2,'#111111');px(rex+dx2,eyeY+dy2,'#111111');}
    px(lex+2,eyeY,'#ffffff');px(lex+2,eyeY+1,'#ffffff88');
    px(rex+2,eyeY,'#ffffff');px(rex+2,eyeY+1,'#ffffff88');
  } else if(etrait.includes('Closed Happy')){
    // ^^ crescent arcs
    px(lex,eyeY,'#222');px(lex+1,eyeY-1,'#222');px(lex+2,eyeY,'#222');
    px(rex,eyeY,'#222');px(rex+1,eyeY-1,'#222');px(rex+2,eyeY,'#222');
  } else if(etrait.includes('Sleepy')){
    px(lex,eyeY,ec);px(lex+1,eyeY,ec);px(rex,eyeY,ec);px(rex+1,eyeY,ec);
    px(lex,eyeY-1,furHex);px(lex+1,eyeY-1,furDark);px(rex,eyeY-1,furHex);px(rex+1,eyeY-1,furDark);
  } else if(etrait.includes('Winking')||etrait.includes('Winking Eye')){
    px(lex,eyeY,ec);px(lex+1,eyeY,ec);px(lex,eyeY+1,ec);px(lex+1,eyeY+1,ec);
    px(lex+1,eyeY,'#ffffff55');
    // winking right eye = single line
    px(rex,eyeY,'#222');px(rex+1,eyeY,'#222');
  } else if(etrait.includes('Side-Eye')){
    // pupils pushed to far outer edge
    px(lex,eyeY,ec);px(lex,eyeY+1,ec);
    px(rex+1,eyeY,ec);px(rex+1,eyeY+1,ec);
    // whites visible
    px(lex+1,eyeY,muzzleHex);px(lex+1,eyeY+1,muzzleHex);
    px(rex,eyeY,muzzleHex);px(rex,eyeY+1,muzzleHex);
  } else if(etrait.includes('Heart Eyes')){
    px(lex,eyeY,'#ff2d7b');px(lex+1,eyeY,'#ff2d7b');px(lex,eyeY+1,'#ff5588');px(lex+1,eyeY-1,'#ff2d7b');
    px(rex,eyeY,'#ff2d7b');px(rex+1,eyeY,'#ff2d7b');px(rex,eyeY+1,'#ff5588');px(rex+1,eyeY-1,'#ff2d7b');
  } else if(etrait.includes('Star Eyes')){
    px(lex+1,eyeY-1,'#ffe600');px(lex,eyeY,'#ffe600');px(lex+1,eyeY,'#fff');px(lex+2,eyeY,'#ffe600');px(lex+1,eyeY+1,'#ffe600');
    px(rex+1,eyeY-1,'#ffe600');px(rex,eyeY,'#ffe600');px(rex+1,eyeY,'#fff');px(rex+2,eyeY,'#ffe600');px(rex+1,eyeY+1,'#ffe600');
  } else if(etrait.includes('Angry Slash')){
    px(lex,eyeY,'#222');px(lex+1,eyeY+1,'#222');px(lex,eyeY+1,ec);px(lex+1,eyeY,ec);
    px(rex+1,eyeY,'#222');px(rex,eyeY+1,'#222');px(rex,eyeY,ec);px(rex+1,eyeY+1,ec);
    px(lex-1,eyeY-1,'#333');px(rex+2,eyeY-1,'#333');
  } else if(etrait.includes('Teardrop')){
    px(lex,eyeY,ec);px(lex+1,eyeY,ec);px(lex,eyeY+1,ec);px(lex+1,eyeY+1,ec);
    px(rex,eyeY,ec);px(rex+1,eyeY,ec);px(rex,eyeY+1,ec);px(rex+1,eyeY+1,ec);
    px(lex+1,eyeY,'#ffffff55');px(rex+1,eyeY,'#ffffff55');
    px(lex,eyeY+2,'#29adff');px(lex,eyeY+3,'#1a8dcc');
  } else if(etrait.includes('Snake Slit')){
    // white/yellow eye + thin vertical slit pupil
    for(let dy2=0;dy2<3;dy2++){px(lex,eyeY+dy2,ec);px(lex+1,eyeY+dy2,ec);px(rex,eyeY+dy2,ec);px(rex+1,eyeY+dy2,ec);}
    px(lex,eyeY,'#111');px(lex,eyeY+1,'#111');px(lex,eyeY+2,'#111');
    px(rex+1,eyeY,'#111');px(rex+1,eyeY+1,'#111');px(rex+1,eyeY+2,'#111');
  } else if(etrait.includes('Diamond Eyes')){
    px(lex+1,eyeY-1,'#00e5ff');px(lex,eyeY,'#00e5ff');px(lex+2,eyeY,'#00e5ff');px(lex+1,eyeY+1,'#00e5ff');px(lex+1,eyeY,'#ffffff');
    px(rex+1,eyeY-1,'#00e5ff');px(rex,eyeY,'#00e5ff');px(rex+2,eyeY,'#00e5ff');px(rex+1,eyeY+1,'#00e5ff');px(rex+1,eyeY,'#ffffff');
  } else if(etrait.includes('Robot Scan')){
    for(let x=lex-1;x<=rex+2;x++) px(x,eyeY,'#ff0000');
    for(let x=lex-1;x<=rex+2;x++) px(x,eyeY,'#ff000088');
    px(lex-1,eyeY,'#ff444488');px(rex+2,eyeY,'#ff444488');
  } else if(etrait.includes('Money Eyes')){
    // $ shape in each eye
    px(lex+1,eyeY-1,'#44cc44');px(lex,eyeY,'#44cc44');px(lex+1,eyeY,'#fff');px(lex+2,eyeY,'#44cc44');px(lex+1,eyeY+1,'#44cc44');
    px(lex+1,eyeY-2,'#44cc44');px(lex+1,eyeY+2,'#44cc44');
    px(rex+1,eyeY-1,'#44cc44');px(rex,eyeY,'#44cc44');px(rex+1,eyeY,'#fff');px(rex+2,eyeY,'#44cc44');px(rex+1,eyeY+1,'#44cc44');
    px(rex+1,eyeY-2,'#44cc44');px(rex+1,eyeY+2,'#44cc44');
  } else if(etrait.includes('Fire Eyes')){
    px(lex,eyeY,'#ffcc00');px(lex+1,eyeY,'#ff8800');px(lex,eyeY+1,'#ff4400');px(lex+1,eyeY+1,'#ff6600');
    px(rex,eyeY,'#ffcc00');px(rex+1,eyeY,'#ff8800');px(rex,eyeY+1,'#ff4400');px(rex+1,eyeY+1,'#ff6600');
    px(lex,eyeY-1,'#ffff0077');px(lex+1,eyeY-1,'#ff880066');px(rex,eyeY-1,'#ffff0077');px(rex+1,eyeY-1,'#ff880066');
  } else if(etrait.includes('Ice Crystal')){
    px(lex+1,eyeY-1,'#88ccff');px(lex,eyeY,'#aaddff');px(lex+1,eyeY,'#ffffff');px(lex+2,eyeY,'#aaddff');px(lex+1,eyeY+1,'#88ccff');
    px(rex+1,eyeY-1,'#88ccff');px(rex,eyeY,'#aaddff');px(rex+1,eyeY,'#ffffff');px(rex+2,eyeY,'#aaddff');px(rex+1,eyeY+1,'#88ccff');
  } else if(etrait.includes('Rainbow Eyes')){
    const rc=['#ff0000','#ff8800','#ffff00','#00ee00','#0088ff','#8800ff'];
    px(lex,eyeY,rc[0]);px(lex+1,eyeY,rc[1]);px(lex,eyeY+1,rc[2]);px(lex+1,eyeY+1,rc[3]);
    px(rex,eyeY,rc[4]);px(rex+1,eyeY,rc[5]);px(rex,eyeY+1,rc[0]);px(rex+1,eyeY+1,rc[2]);
  } else if(etrait.includes('Pixel 8-Ball')){
    for(let dy2=0;dy2<3;dy2++) for(let dx2=0;dx2<3;dx2++){px(lex+dx2,eyeY+dy2,'#111');px(rex+dx2,eyeY+dy2,'#111');}
    px(lex+1,eyeY,'#ffffff');px(rex+1,eyeY,'#ffffff');
    px(lex+1,eyeY+1,'#888');px(rex+1,eyeY+1,'#888');
  } else if(etrait.includes('Matrix Green Rain')){
    px(lex,eyeY,'#00ff41');px(lex+1,eyeY+1,'#00cc33');px(lex+1,eyeY-1,'#00ff4166');
    px(rex,eyeY,'#00ff41');px(rex+1,eyeY+1,'#00cc33');px(rex+1,eyeY-1,'#00ff4166');
    for(let i=0;i<3;i++){px(lex,eyeY+2+i,'#00ff4133');px(rex,eyeY+2+i,'#00ff4133');}
  } else if(etrait.includes('Ghost White')){
    for(let dy2=0;dy2<2;dy2++) for(let dx2=0;dx2<2;dx2++){px(lex+dx2,eyeY+dy2,'#ffffff');px(rex+dx2,eyeY+dy2,'#ffffff');}
    px(lex-1,eyeY,'#ffffff33');px(lex+2,eyeY,'#ffffff33');px(rex-1,eyeY,'#ffffff33');px(rex+2,eyeY,'#ffffff33');
  } else if(etrait.includes('Neon Glow Outline')){
    px(lex,eyeY-1,ec);px(lex+1,eyeY-1,ec);px(lex-1,eyeY,ec);px(lex+2,eyeY,ec);px(lex-1,eyeY+1,ec);px(lex+2,eyeY+1,ec);px(lex,eyeY+2,ec);px(lex+1,eyeY+2,ec);
    px(rex,eyeY-1,ec);px(rex+1,eyeY-1,ec);px(rex-1,eyeY,ec);px(rex+2,eyeY,ec);px(rex-1,eyeY+1,ec);px(rex+2,eyeY+1,ec);px(rex,eyeY+2,ec);px(rex+1,eyeY+2,ec);
  } else if(etrait.includes('Glowing')){
    px(lex,eyeY,ec);px(lex+1,eyeY,ec);px(lex,eyeY+1,ec);px(lex+1,eyeY+1,darkenHex(ec,15));
    px(rex,eyeY,ec);px(rex+1,eyeY,ec);px(rex,eyeY+1,ec);px(rex+1,eyeY+1,darkenHex(ec,15));
    px(lex-1,eyeY,ec+'44');px(lex+2,eyeY,ec+'44');px(rex-1,eyeY,ec+'44');px(rex+2,eyeY,ec+'44');
  } else if(etrait.includes('Spiral')){
    px(lex,eyeY,ec);px(lex+1,eyeY+1,ec);px(lex+1,eyeY,muzzleHex);px(lex,eyeY+1,muzzleHex);
    px(rex,eyeY,ec);px(rex+1,eyeY+1,ec);px(rex+1,eyeY,muzzleHex);px(rex,eyeY+1,muzzleHex);
  } else if(etrait.includes('Excited Wide')){
    for(let dd=-1;dd<=2;dd++) for(let dd2=-1;dd2<=2;dd2++){if(Math.abs(dd)===1||Math.abs(dd2)===1){px(lex+dd,eyeY+dd2,'#111');px(rex+dd,eyeY+dd2,'#111');}}
    px(lex,eyeY,ec);px(lex+1,eyeY,ec);px(lex,eyeY+1,ec);px(lex+1,eyeY+1,ec);
    px(rex,eyeY,ec);px(rex+1,eyeY,ec);px(rex,eyeY+1,ec);px(rex+1,eyeY+1,ec);
    px(lex+1,eyeY,'#ffffff66');px(rex+1,eyeY,'#ffffff66');
  } else {
    // default 2×2 with shine + pupil
    px(lex,eyeY,ec);px(lex+1,eyeY,ec);px(lex,eyeY+1,ec);px(lex+1,eyeY+1,ec);
    px(rex,eyeY,ec);px(rex+1,eyeY,ec);px(rex,eyeY+1,ec);px(rex+1,eyeY+1,ec);
    px(lex+1,eyeY,'#ffffff77');px(rex+1,eyeY,'#ffffff77');
    px(lex,eyeY+1,darkenHex(ec,20));px(rex,eyeY+1,darkenHex(ec,20));
  }
  if(etrait.includes('Blue Husky')){px(lex,eyeY,'#4499ff');px(lex+1,eyeY,'#66bbff');px(rex,eyeY,'#4499ff');px(rex+1,eyeY,'#66bbff');}
  if(etrait.includes('Old Wise')){for(let dx2=0;dx2<=2;dx2++){px(lex+dx2,eyeY-1,furDark);px(rex+dx2,eyeY-1,furDark);}}

  // ── 10. NOSE (prominent dark block) ──
  const noseY=g.noseY;
  const nw=Math.floor(g.snoutW/2)-1;   // ~3 cells half-width
  for(let x=cx-nw;x<cx+nw;x++){px(x,noseY,'#111111');px(x,noseY+1,'#111111');}
  // nostrils
  px(cx-nw+1,noseY+1,'#000000');px(cx+nw-2,noseY+1,'#000000');
  // nose shine
  px(cx-nw+1,noseY,'#444444');

  // ── 11. MOUTH (18 types) ──
  const mouth=traits.mouth||'Happy Pant';
  const my=g.mouthY, mx2=cx-3, mw2=6;
  if(mouth.includes('Happy Pant')){
    for(let i=0;i<mw2;i++) px(mx2+i,my,'#222');
    px(mx2-1,my-1,'#222');px(mx2+mw2,my-1,'#222');
    for(let i=1;i<mw2-2;i++) px(mx2+i,my+1,'#ff6699');
    for(let i=2;i<mw2-2;i++) px(mx2+i,my+2,'#ff6699');
  } else if(mouth.includes('Big Goofy Grin')){
    for(let i=-1;i<=mw2+1;i++) px(mx2+i,my,'#222');
    for(let i=0;i<mw2;i++) px(mx2+i,my+1,'#ffffff');
    for(let i=1;i<mw2-1;i++) px(mx2+i,my+2,'#ff6699');
    px(mx2-1,my-1,'#222');px(mx2+mw2,my-1,'#222');
  } else if(mouth.includes('Vampire Fangs')){
    for(let i=0;i<mw2;i++) px(mx2+i,my,'#222');
    px(mx2-1,my-1,'#222');px(mx2+mw2,my-1,'#222');
    px(mx2+1,my+1,'#fff');px(mx2+1,my+2,'#eee');   // left fang
    px(mx2+mw2-2,my+1,'#fff');px(mx2+mw2-2,my+2,'#eee'); // right fang
    px(mx2+2,my+1,'#cc000066');px(mx2+mw2-3,my+1,'#cc000066');
  } else if(mouth.includes('Braces Smile')){
    for(let i=0;i<mw2;i++) px(mx2+i,my,'#222');
    px(mx2-1,my-1,'#222');px(mx2+mw2,my-1,'#222');
    for(let i=0;i<mw2;i++) px(mx2+i,my+1,'#ffffff');
    for(let i=1;i<mw2-1;i++) px(mx2+i,my+1,'#aaaaaa'); // metal band
    for(let i=0;i<mw2;i+=2) px(mx2+i,my+1,'#888888'); // brackets
  } else if(mouth.includes('Zipper Mouth')){
    // closed mouth with zipper teeth
    for(let i=0;i<mw2;i++) px(mx2+i,my,'#222');
    for(let i=0;i<mw2;i+=2) px(mx2+i,my+1,'#888888');
    for(let i=1;i<mw2;i+=2) px(mx2+i,my,'#aaaaaa');
    px(mx2-1,my,'#666');  // zipper pull
  } else if(mouth.includes('Pipe In Mouth')){
    for(let i=0;i<mw2;i++) px(mx2+i,my,'#222');
    px(mx2-1,my-1,'#222');px(mx2+mw2,my-1,'#222');
    // pipe stem
    for(let x=cx+3;x<=cx+6;x++) px(x,my,'#664422');
    for(let x=cx+3;x<=cx+5;x++) px(x,my-1,'#553311');
    // bowl
    px(cx+6,my,'#553311');px(cx+6,my-1,'#553311');px(cx+7,my,'#553311');
    // smoke puffs
    px(cx+7,my-2,'#aaaaaa66');px(cx+8,my-3,'#88888844');
  } else if(mouth.includes('Pixel Smoke')){
    for(let i=0;i<mw2;i++) px(mx2+i,my,'#222');
    px(mx2-1,my-1,'#222');px(mx2+mw2,my-1,'#222');
    px(cx,my+1,'#999999aa');px(cx+1,my,'#aaaaaaaa');
    px(cx-1,my-1,'#aaaaaa77');px(cx+2,my-2,'#88888855');
    px(cx,my-3,'#88888833');
  } else if(mouth.includes('Puppy Lip Quiver')){
    for(let i=0;i<mw2;i++) px(mx2+i,my,(i%2===0)?'#333':'#222');
    px(mx2-1,my-1,'#222');px(mx2+mw2,my-1,'#222');
    px(cx,my+1,'#ffffff33');  // slight trembling highlight
  } else if(mouth.includes('Long Drool')){
    for(let i=0;i<mw2;i++) px(mx2+i,my,'#222');
    px(mx2-1,my-1,'#222');px(mx2+mw2,my-1,'#222');
    px(mx2+1,my+1,'#ff6699');px(mx2+1,my+2,'#ff6699');
    px(mx2+mw2-1,my+1,'#29adff');px(mx2+mw2-1,my+2,'#29adff');px(mx2+mw2-1,my+3,'#1a8dcc');
  } else if(mouth.includes('Angry Growl')){
    for(let i=0;i<mw2;i++) px(mx2+i,my,'#222');
    px(mx2-1,my+1,'#222');px(mx2+mw2,my+1,'#222');
    for(let i=1;i<mw2-1;i+=2) px(mx2+i,my+1,'#fff');
  } else if(mouth.includes('Howling O')){
    for(let i=0;i<mw2;i++){px(mx2+i,my,'#222');px(mx2+i,my+3,'#222');}
    px(mx2-1,my+1,'#222');px(mx2-1,my+2,'#222');px(mx2+mw2,my+1,'#222');px(mx2+mw2,my+2,'#222');
  } else if(mouth.includes('Underbite')){
    for(let i=0;i<mw2;i++) px(mx2+i,my,'#222');
    for(let i=-1;i<=mw2+1;i++) px(mx2+i,my+1,'#222');
    for(let i=0;i<mw2;i++) px(mx2+i,my+2,'#ffffff55');
  } else if(mouth.includes('Bone In Mouth')){
    for(let i=0;i<mw2;i++) px(mx2+i,my,'#222');
    for(let i=1;i<mw2-2;i++) px(mx2+i,my-1,'#e8d8b0');
    px(mx2,my-1,'#e8d8b0');px(mx2,my-2,'#e8d8b0');px(mx2+mw2-2,my-1,'#e8d8b0');px(mx2+mw2-2,my-2,'#e8d8b0');
  } else if(mouth.includes('Stick In Mouth')){
    for(let i=0;i<mw2;i++) px(mx2+i,my,'#222');
    for(let x=cx-5;x<=cx+5;x++){px(x,my-1,'#664422');px(x,my-2,'#553311');}
  } else if(mouth.includes('Tongue Sideways')){
    for(let i=0;i<mw2;i++) px(mx2+i,my,'#222');
    px(mx2-1,my-1,'#222');px(mx2+mw2,my-1,'#222');
    for(let y=my;y<=my+3;y++){px(mx2+mw2,y,'#ff6699');px(mx2+mw2+1,y,'#ff5588');}
  } else {
    // Closed Smile / Serious / Tiny
    for(let i=0;i<mw2;i++) px(mx2+i,my,'#222');
    if(!mouth.includes('Tiny')&&!mouth.includes('Serious')){px(mx2-1,my-1,'#222');px(mx2+mw2,my-1,'#222');}
  }

  // ── 12. FACE ACCESSORIES ──
  const acc=traits.accessory||'None';
  if(acc.includes('Blush')){px(lex-2,eyeY+2,'#ff669977');px(lex-1,eyeY+2,'#ff669977');px(rex+2,eyeY+2,'#ff669977');px(rex+3,eyeY+2,'#ff669977');}
  if(acc.includes('Pirate Eye Patch')){for(let dx=-1;dx<=2;dx++) for(let dy=-1;dy<=2;dy++) px(lex+dx,eyeY+dy,'#222');px(lex-2,eyeY,'#333');px(lex+3,eyeY,'#333');}
  if(acc.includes('Freckle')){px(cx-2,eyeY+2,'#aa7744');px(cx+1,eyeY+2,'#aa7744');px(cx-3,eyeY+3,'#aa7744');px(cx+3,eyeY+3,'#aa7744');}
  if(acc.includes('War Paint')){for(let x=cx-hHW+1;x<cx+hHW-1;x++){px(x,eyeY+1,pick(fSeed+5)+'88');px(x,eyeY+2,pick(fSeed+5)+'88');}}
  if(acc.includes('Battle Scar')){for(let i=0;i<3;i++) px(rex+1+i,eyeY+1+i,'#884422');}
  if(acc.includes('Flower on Ear')){px(cx-hHW-3,eyeY-1,'#ff6699');px(cx-hHW-2,eyeY-1,'#ff6699');px(cx-hHW-2,eyeY-2,'#ffff00');}
  if(acc.includes('Gem Earring')){px(cx+hHW,eyeY+3,'#00e5ff');px(cx+hHW,eyeY+4,'#29adff');}
  if(acc.includes('Dog Tag')){px(cx+hHW-1,eyeY+3,'#ccc');px(cx+hHW,eyeY+3,'#aaa');}
  if(acc.includes('Sunscreen')){for(let x=cx-nw;x<cx+nw;x++) px(x,noseY,'#eee8');}
  if(acc.includes('Face Tattoo')){px(rex+2,eyeY+2,'#b026ff');px(rex+2,eyeY+3,'#b026ff');px(rex+3,eyeY+2,'#b026ff');}
  if(acc.includes('Head Bandage')){for(let x=cx-hHW;x<cx+hHW;x++) px(x,hCY-hHH+2,'#f5deb3aa');px(cx,hCY-hHH+1,'#cc0000');}

  // ── 13. BREED OVERLAY ──
  drawBreed(px,traits.type||'',g,furHex,seed);

  // ── 14. COLLAR ──
  drawCollar(px,traits.chain||'None',cx,neckY);

  // ── 15. HAT ──
  drawHat(px,traits.hat||'None',g,pick,fSeed);

  // ── 16. EYEWEAR ──
  drawGlasses(px,traits.glasses||'None',lex,rex,eyeY);

  // ── 17. DOGE EASTER EGG ──
  // If it's a Shiba Inu, draw tiny "wow" text pixels above the head
  if((traits.type||'')==='Shiba Inu'){
    // pixel font "wow" — 3 rows tall, top-left corner
    // W
    px(3,3,'#ffe600');px(4,3,'#ffe600');px(5,3,'#ffe600');
    px(3,4,'#ffe600');px(4,5,'#ffe600');px(5,4,'#ffe600');
    // o
    px(7,4,'#ffe600');px(8,3,'#ffe600');px(9,4,'#ffe600');px(8,5,'#ffe600');
    // w
    px(11,3,'#ffe600');px(12,3,'#ffe600');px(13,3,'#ffe600');
    px(11,4,'#ffe600');px(12,5,'#ffe600');px(13,4,'#ffe600');
    // "such" — right side, small dots
    px(19,3,'#ff6699');px(20,3,'#ff6699');px(21,3,'#ff6699');px(22,3,'#ff6699');
    px(24,3,'#ff6699');px(25,3,'#ff6699');
    // very small "such" label — just a few colored dots hinting at it
    px(19,4,'#ff669966');px(22,4,'#ff669966');
  }

  // ── 18. GROUND SHADOW ──
  for(let x=5;x<27;x++) px(x,36,'#00000022');
  for(let x=7;x<25;x++) px(x,37,'#00000011');
}

export { drawPixelDog };
