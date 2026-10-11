function adjForm(m, noun, c){
  const stem = m.slice(0,-2), velar=/[кгхжшщч]$/.test(stem), y = velar?'и':'ы';
  if(noun.g==='m'){ if(c===0) return m; if(c===3) return noun.anim? stem+'ого' : m; return stem+['','ого','ому','',y+'м','ом'][c]; }
  if(noun.g==='f') return stem+['ая','ой','ой','ую','ой','ой'][c];
  if(noun.g==='n') return stem+['ое','ого','ому','ое',y+'м','ом'][c];
  if(c===3) return stem + y + (noun.anim?'х':'е');
  return stem+[y+'е',y+'х',y+'м','',y+'ми',y+'х'][c];
}

const V='аеёиоуыэюя';
function euphony(p, next){
  if(!next) return p;
  const w=next.toLowerCase(), a=w[0], b=w[1]||'';
  const cons = b && !V.includes(b);
  if(p==='о' && 'аоуэиы'.includes(a)) return 'об';
  if(p==='с' && 'сзшжщ'.includes(a) && cons) return 'со';
  if(p==='в' && 'вф'.includes(a) && cons) return 'во';
  return p;
}

// шаблоны: noun/adj/verb/prep/intj/fixed; case — фиксированный падеж, from — индекс предлога, agree — индекс существительного, comma — запятая перед словом
const PATTERNS = [
  [{k:'adj',agree:1,c:0},{k:'noun',c:0},{k:'noun',c:1}],
  [{k:'noun',c:0},{k:'prep'},{k:'noun',from:1}],
  [{k:'noun',c:0},{k:'prep'},{k:'noun',from:1}],
  [{k:'adj',agree:2,c:0},{k:'adj',agree:2,c:0},{k:'noun',c:0}],
  [{k:'noun',c:0},{k:'noun',c:1},{k:'noun',c:1}],
  [{k:'verb'},{k:'adj',agree:2,c:3},{k:'noun',c:3}],
  [{k:'fixed',t:'как'},{k:'verb'},{k:'noun',c:3}],
  [{k:'prep'},{k:'adj',agree:2,from:0},{k:'noun',from:0}],
  [{k:'prep'},{k:'adj',agree:2,from:0},{k:'noun',from:0}],
  [{k:'noun',c:0},{k:'fixed',t:'как'},{k:'noun',c:0}],
  [{k:'noun',c:0},{k:'fixed',t:'и'},{k:'noun',c:0}],
  [{k:'adj',agree:1,c:0},{k:'noun',c:0},{k:'intj',comma:true}],
];
const PATTERNS2 = [
  [{k:'adj',agree:1,c:0},{k:'noun',c:0}],
  [{k:'noun',c:0},{k:'noun',c:1}],
  [{k:'verb'},{k:'noun',c:3}],
  [{k:'prep'},{k:'noun',from:0}],
  [{k:'noun',c:0},{k:'intj',comma:true}],
];
const PATTERNS4 = [
  [{k:'adj',agree:1,c:0},{k:'noun',c:0},{k:'prep'},{k:'noun',from:2}],
  [{k:'noun',c:0},{k:'prep'},{k:'adj',agree:3,from:1},{k:'noun',from:1}],
  [{k:'adj',agree:1,c:0},{k:'noun',c:0},{k:'adj',agree:3,c:1},{k:'noun',c:1}],
  [{k:'fixed',t:'как'},{k:'verb'},{k:'adj',agree:3,c:3},{k:'noun',c:3}],
  [{k:'verb'},{k:'noun',c:3},{k:'prep'},{k:'noun',from:2}],
  [{k:'noun',c:0},{k:'fixed',t:'и'},{k:'adj',agree:3,c:0},{k:'noun',c:0}],
  [{k:'noun',c:0},{k:'noun',c:1},{k:'prep'},{k:'noun',from:2}],
  [{k:'verb'},{k:'adj',agree:2,c:3},{k:'noun',c:3},{k:'intj',comma:true}],
];
const PATTERNS5 = [
  [{k:'adj',agree:1,c:0},{k:'noun',c:0},{k:'prep'},{k:'adj',agree:4,from:2},{k:'noun',from:2}],
  [{k:'verb'},{k:'adj',agree:2,c:3},{k:'noun',c:3},{k:'prep'},{k:'noun',from:3}],
  [{k:'fixed',t:'как'},{k:'verb'},{k:'noun',c:3},{k:'prep'},{k:'noun',from:3}],
  [{k:'noun',c:0},{k:'noun',c:1},{k:'prep'},{k:'adj',agree:4,from:2},{k:'noun',from:2}],
  [{k:'noun',c:0},{k:'fixed',t:'и'},{k:'noun',c:0},{k:'prep'},{k:'noun',from:3}],
  [{k:'fixed',t:'как'},{k:'verb'},{k:'adj',agree:3,c:3},{k:'noun',c:3},{k:'noun',c:1}],
  [{k:'adj',agree:1,c:0},{k:'noun',c:0},{k:'fixed',t:'и'},{k:'adj',agree:4,c:0},{k:'noun',c:0}],
  [{k:'prep'},{k:'adj',agree:2,from:0},{k:'noun',from:0},{k:'adj',agree:4,c:1},{k:'noun',c:1}],
];
// длина названия: 10% — два слова, 75% — три, 10% — четыре, 5% — пять
function pickPattern(){ const r=Math.random(); return rnd(r<.1?PATTERNS2:r<.85?PATTERNS:r<.95?PATTERNS4:PATTERNS5); }

const rnd = a => a[Math.floor(Math.random()*a.length)];
const pool = k => k==='noun'?NOUNS:k==='adj'?ADJ:k==='verb'?VERBS:k==='prep'?PREPS:k==='intj'?INTJ:null;
function pickFor(slots, i){
  const s=slots[i], P=pool(s.k); if(!P) return null;
  const used=slots.filter((o,j)=>j!==i && o.k===s.k).map(o=>o.lex);
  let x, n=0; do{ x=rnd(P); n++; }while((used.includes(x)||x===s.lex) && n<50);
  return x;
}

const SKIP_P=1/6; // доля названий с «…»
let slots=[], theme=0;
function build(){
  slots = pickPattern().map(s=>({...s,lex:null,skip:false}));
  slots.forEach((s,i)=>{ s.lex=pickFor(slots,i); });
  if(Math.random()<SKIP_P) rnd(slots).skip=true;
}
function words(){
  const caseOf = s => s.from!=null ? slots[s.from].lex[1] : s.c;
  const out = slots.map(s=>{
    if(s.k==='noun') return s.lex.f[caseOf(s)];
    if(s.k==='adj') return adjForm(s.lex, slots[s.agree].lex, caseOf(s));
    if(s.k==='verb') return s.lex;
    if(s.k==='intj') return s.lex+'!';
    if(s.k==='fixed') return s.t;
    return null;
  });
  slots.forEach((s,i)=>{ if(s.k==='prep'){ const n=slots[i+1]; out[i]=euphony(s.lex[0], n&&!n.skip?out[i+1]:null); } });
  return out.map((w,i)=>slots[i].skip?'…':w).map((w,i)=> i===0 && w!=='…' && w!=='ИИ' ? w[0].toUpperCase()+w.slice(1) : w)
    .map((w,i,a)=> slots[i+1]&&slots[i+1].comma ? w+',' : w);
}
const text = () => words().join(' ');

const $=id=>document.getElementById(id);
const titleEl=$('title'), area=$('area'), slide=$('slide');

function fit(){
  const w=slide.clientWidth; let size=w*0.11;
  titleEl.style.fontSize=size+'px';
  let guard=0;
  while((titleEl.scrollHeight>area.clientHeight || titleEl.scrollWidth>area.clientWidth+1) && guard<40){ size*=0.94; titleEl.style.fontSize=size+'px'; guard++; }
}

function render(){
  titleEl.innerHTML='';
  words().forEach((w,i)=>{
    const sp=document.createElement('span');
    sp.className='w'+(slots[i].skip?' gap':''); sp.textContent=w;
    titleEl.append(sp, document.createTextNode(i<slots.length-1?' ':''));
  });
  fit();
}

function speaker(){
  const f=Math.random()<.5;
  return rnd(f?NAMES_F:NAMES_M)+' '+rnd([...(f?SURNAMES_F:SURNAMES_M),...SURNAMES_N]);
}

function setDress(){
  let t; do{ t=Math.floor(Math.random()*THEMES.length);}while(t===theme); theme=t;
  const th=THEMES[t]; slide.style.setProperty('--s-bg',th.bg); slide.style.setProperty('--s-fg',th.fg); slide.style.setProperty('--s-dim',th.dim);
  const [hall,sec]=rnd(SECTIONS); $('meta').textContent=hall+' · '+sec;
  const h=12+Math.floor(Math.random()*8), m=Math.random()<.5?'00':'30';
  $('when').textContent=rnd(['9 октября','10 октября'])+' · '+h+':'+m;
  $('who').textContent=speaker();
  $('role').textContent=rnd(ROLES)+', '+rnd(COMPANIES);
  $('lvl').textContent=Math.random()<.5?'■':'■■';
}

const history=[];
function pushHistory(){
  if(!slots.length) return;
  history.unshift({slots:JSON.parse(JSON.stringify(slots)),label:text(),theme});
  if(history.length>10) history.pop();
  const ol=$('hist'); ol.innerHTML='';
  history.forEach((h,i)=>{
    const li=document.createElement('li'), b=document.createElement('button');
    b.innerHTML='<time>'+String(i+1).padStart(2,'0')+'</time>'; b.append(h.label);
    b.onclick=()=>{ slots=JSON.parse(JSON.stringify(h.slots)); // restore lexeme references
      slots.forEach(s=>{ if(s.k==='noun') s.lex=NOUNS.find(n=>n.f[0]===s.lex.f[0]); if(s.k==='prep') s.lex=PREPS.find(p=>p[0]===s.lex[0]); });
      render(); };
    li.append(b); ol.append(li);
  });
}

function generate(){ pushHistory(); build(); setDress(); render(); }

$('gen').onclick=generate;
document.addEventListener('keydown',e=>{
  if(e.code==='Space' && !['INPUT','BUTTON'].includes(document.activeElement.tagName)){e.preventDefault();generate();}
});
$('copy').onclick=async()=>{
  const b=$('copy');
  try{ await navigator.clipboard.writeText(text()); b.textContent='Скопировано'; }
  catch{ const r=document.createRange(); r.selectNodeContents(titleEl); const sel=getSelection(); sel.removeAllRanges(); sel.addRange(r); b.textContent='Выделено, жмите ⌘C'; }
  setTimeout(()=>b.textContent='Скопировать',1600);
};
// PNG 1920×1080: слайд перерисовывается на canvas по координатам текста в вёрстке
async function downloadPng(){
  if(document.fonts) await document.fonts.ready;
  const W=1920, H=1080, k=W/slide.clientWidth;
  const cv=document.createElement('canvas'); cv.width=W; cv.height=H;
  const ctx=cv.getContext('2d'), th=THEMES[theme];
  const R=slide.getBoundingClientRect(), ox=R.left+slide.clientLeft, oy=R.top+slide.clientTop;
  ctx.fillStyle=th.bg; ctx.fillRect(0,0,W,H);
  const draw=(el,color)=>{
    const t=el.textContent; if(!t) return;
    const cs=getComputedStyle(el), rg=document.createRange(); rg.selectNodeContents(el);
    const r=rg.getBoundingClientRect(), size=parseFloat(cs.fontSize)*k;
    ctx.font=cs.fontWeight+' '+size+'px '+cs.fontFamily;
    if('letterSpacing' in ctx) ctx.letterSpacing=(parseFloat(cs.letterSpacing)||0)*k+'px';
    const m=ctx.measureText(t), asc=m.fontBoundingBoxAscent??size*.9, desc=m.fontBoundingBoxDescent??size*.25;
    ctx.fillStyle=color; ctx.textBaseline='alphabetic';
    ctx.fillText(t,(r.left-ox)*k,((r.top+r.bottom)/2-oy)*k+(asc-desc)/2);
  };
  const bar=slide.querySelector('.bar'), b=bar.getBoundingClientRect(), line=W*.0018;
  ctx.fillStyle=th.fg; ctx.fillRect((b.left-ox)*k,(b.bottom-oy)*k-line,b.width*k,line);
  draw(bar.querySelector('b'),th.fg); draw($('meta'),th.fg); draw($('when'),th.fg);
  titleEl.querySelectorAll('.w').forEach(w=>draw(w,w.classList.contains('gap')?th.dim:th.fg));
  draw($('who'),th.dim); draw($('lvl'),th.dim); draw($('role'),th.dim);
  cv.toBlob(blob=>{
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=text()+'.png';
    document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  },'image/png');
}
$('png').onclick=downloadPng;
new ResizeObserver(fit).observe(slide);
document.fonts && document.fonts.ready.then(fit);

theme=-1; build(); setDress(); render();
