function fD2(s){return s.slice(8,10)+'.'+s.slice(5,7)+'.'+s.slice(2,4)}

/* ---------- data ---------- */
function buildCourses(RAW){return RAW.map(function(r,i){
  var c={id:i,file:r.f,date:r.dt,venue:r.v,vs:SHORT[r.v]||r.v,nat:r.nat,series:r.ser,kind:r.k,season:r.se,tc:!!r.tc,run:r.r,label:r.lab||'',piste:r.pi||'',setter:r.st||'',src:r.src};
  c.t=Date.parse(r.dt+'T12:00:00Z');
  c.fin=r.fin?{d:r.fin[0],p:r.fin[1],x:r.fin[2]||0,y:r.fin[3]||0,pi:!!r.fin[4]}:null;
  c.gates=r.G.map(function(g,j){var fl=g[10]||0;return {n:j+1,t:g[0],d:g[1],o:g[2],p:g[3],a:g[4],x:g[5]||0,y:g[6]||0,c:g[7]||0,w:g[8]||null,cd:g[9]||null,a0:!!(fl&1),o0:!!(fl&2),ti:!!(fl&4),ar:!!(fl&8),pi:!!(fl&16)}});
  c.plan=c.src==='M';c.recon=!!r.rc;
  c.race=c.kind==='R'?[c.date,c.venue,c.tc?1:0].join('|'):null;
  c.day=[c.kind,c.date,c.venue].join('|');
  c.m=metrics(c);
  return c;
})}
function metrics(c){
  var G=c.gates,segs=c.fin?G.concat([c.fin]):G,m={};
  m.n=G.length;
  m.len=sum(segs.map(function(g){return g.d}));
  m.vd=sum(segs.map(function(g){return g.d*g.p/100}));
  m.pitch=100*m.vd/m.len;
  m.pmax=Math.max.apply(null,segs.map(function(g){return g.p}));
  // Normales offenes Tor: offen, Vorgänger und Nachfolger offen (nicht erstes/letztes Tor), und der eigene Abstand
  // sowie der Abstand des Tors davor und danach liegen innerhalb ±20 % des Kurs-Medians der offenen Tore.
  var base=G.filter(function(g,i){return g.t===0&&i>0&&G[i-1].t===0}).map(function(g){return g.d}).sort(function(a,b){return a-b});
  var med=quant(base,.5),lo=med*(1-RANGE),hi=med*(1+RANGE);
  m.dmed=med;m.dlo=lo;m.dhi=hi;
  G.forEach(function(g,i){
    g.reg=false;g.why='';g.ws='';
    if(g.t!==0){g.ws=T.fig;g.why=T.figWhy;return}
    if(i===0){g.ws=g.why='erstes Tor';return}
    if(i===G.length-1){g.ws=g.why='letztes Tor';return}
    if(G[i-1].t!==0){g.ws=g.why=T.after;return}
    if(G[i+1].t!==0){g.ws=g.why=T.before;return}
    if(g.d<lo||g.d>hi){g.ws='Abstand';g.why='Abstand ausserhalb Normalbereich';return}
    if(G[i+1].d<lo||G[i+1].d>hi){g.ws='Nachbar';g.why='vor Tor mit abweichendem Abstand';return}
    if(i>1&&(G[i-1].d<lo||G[i-1].d>hi)){g.ws='Nachbar';g.why='nach Tor mit abweichendem Abstand';return}
    g.reg=true;
  });
  var reg=G.filter(function(g){return g.reg});
  var ds=reg.map(function(g){return g.d}),os=reg.map(function(g){return g.o});
  m.d=mean(ds);m.dsd=sdev(ds);m.dmin=Math.min.apply(null,ds);m.dmax=Math.max.apply(null,ds);
  m.o=mean(os);m.omax=Math.max.apply(null,os);
  m.a=mean(reg.map(function(g){return Math.abs(g.a)}));
  m.nreg=reg.length;
  m.nDel=G.filter(function(g){return g.t===1}).length;
  m.nHp=G.filter(function(g){return g.t===2}).length/2;
  var runs=[],k=0;
  G.forEach(function(g){if(g.t===3)k++;else{if(k)runs.push(k);k=0}});if(k)runs.push(k);
  m.nVc=runs.length;m.vc=runs;
  m.fig=100*G.filter(function(g){return g.t>0}).length/m.n;
  return m;
}
function runN(n){return n+'. Lauf'}
function runS(n){return 'L'+n}
function runLab(c){return c.kind==='R'?runN(c.run)+(c.tc?' (Team-Kombi)':''):(c.label||'Training')}
function cName(c){return c.vs+' · '+(c.kind==='R'?runN(c.run)+(c.tc?' TK':''):'Training'+(c.label?' '+c.label:''))+' · '+fD2(c.date)}
function cShort(c){return c.vs+' '+fD2(c.date)+(c.kind==='R'?' '+runS(c.run):'')}
function cOpt(c){return fDate(c.date)+' · '+c.venue+' · '+(c.kind==='R'?runN(c.run)+(c.tc?' (Team-Kombi)':''):'Training'+(c.label?' · '+c.label:''))}
function serName(c){return c.series==='OWG'?'Olympia':c.series==='WSC'?'WM':'Weltcup'}
function vals(list,key){return list.map(function(c){return c.m[key]})}
function avg(list,key){return mean(vals(list,key))}

/* ---------- state ---------- */
var TABS=[
  {id:'uebersicht',l:'Übersicht',i:'<path d="M3 3v18h18"/><path d="M7 15l4-5 4 3 5-7"/>'},
  {id:'saison',l:'Saison-Verlauf',i:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'},
  {id:'kurs',l:'Kurs-Detail',i:'<path d="M6 3v18M6 4h9l-2 3 2 3H6"/><path d="M17 14l2 7"/>'},
  {id:'daten',l:'Datenbank',i:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>'}
];
var S={disc:'SL',tab:'uebersicht',kind:'ALL',season:'ALL',venue:'ALL',
  scX:'d',scY:'o',rank:'o',hist:'d',binBy:'pitch',binM:'o',seasonM:'o',prepM:'o',
  a:null,b:'auto',gl:'A',zoneAll:true,smooth:false,sortK:'date',sortDir:1,dark:false,rankView:'T',open:{}};
try{var saved=JSON.parse(localStorage.getItem('kstech1')||'null');if(saved)for(var k0 in saved)if(k0 in S)S[k0]=saved[k0]}catch(e){}
(function(){var h=(location.hash||'').replace('#','');if(TABS.some(function(t){return t.id===h}))S.tab=h})();
var ALLC={};DISCS.forEach(function(d){applyDisc(d);ALLC[d]=buildCourses(RAWS[d])});
function useDisc(d){if(!CFG[d])d='SL';S.disc=d;applyDisc(d);COURSES=ALLC[d]}
useDisc(S.disc);
if(SEASONS.indexOf(S.season)<0)S.season='ALL';
/* main switch: discipline. Course choices, venue and season filters belong to one discipline and are reset */
function setDisc(d){if(d===S.disc)return;useDisc(d);S.a=null;S.b='auto';S.gl='A';S.venue='ALL';if(SEASONS.indexOf(S.season)<0)S.season='ALL';save();render()}
function save(){try{localStorage.setItem('kstech1',JSON.stringify(S))}catch(e){}}
function set(k,v){S[k]=v;save();render()}

function filtered(){
  return COURSES.filter(function(c){
    return (S.kind==='ALL'||c.kind===S.kind)&&(S.season==='ALL'||c.season===S.season)&&(S.venue==='ALL'||c.venue===S.venue);
  });
}
function kinds(list){return KINDS.filter(function(g){return list.some(function(c){return c.kind===g})})}
function seasons(list){return SEASONS.filter(function(s){return list.some(function(c){return c.season===s})})}
function of(list,kind,season){return list.filter(function(c){return (!kind||c.kind===kind)&&(!season||c.season===season)})}
