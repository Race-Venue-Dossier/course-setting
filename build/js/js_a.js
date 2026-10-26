(function(){
'use strict';
var RAWS = /*__DATA__*/null;     // {SL:[...],GS:[...]}
var METAS = /*__META__*/null;    // {SL:{...},GS:{...}}
var ZONESB = /*__ZONES__*/null;  // {SL:{d,o,a},GS:{d,o,a}}

/* ---------- constants ---------- */
var TY_DE, TY_K, SHORT, SEASONS, META, ZONES, T, COURSES, MET_ALL, DK;
var RANGE = 0.20;
var FIGC = ['','var(--fig-b)','var(--fig-h)','var(--fig-f)'];
var FIGS = ['','var(--fig-b-soft)','var(--fig-h-soft)','var(--fig-f-soft)'];
var KIND = {R:'Rennen',T:'Training'};
var KIND1 = {R:'Rennen',T:'Training'};
var KINDS = ['R','T'];
var GCOL = {R:'var(--s1)',T:'var(--s2)'};
var GSOFT = {R:'var(--s1-soft)',T:'var(--s2-soft)'};
var DAY = 86400000;
var MET = {
  d:{l:'Ø Torabstand',u:'m',dec:2,h:'normale offene Tore'},
  o:{l:'Ø Offset',u:'m',dec:2,h:'seitlicher Versatz, normale offene Tore'},
  a:{l:'Ø Richtungswinkel',u:'°',dec:1,h:'Betrag, normale offene Tore'},
  dsd:{l:'Streuung Torabstand (SD)',u:'m',dec:2,h:'normale offene Tore'},
  omax:{l:'Max. Offset',u:'m',dec:2},
  pitch:{l:'Ø Neigung',u:'%',dec:1},
  pmax:{l:'Max. Neigung',u:'%',dec:0},
  fig:{l:'Figuren-Anteil',u:'%',dec:0,h:'Anteil der Tore in Bananen, Haarnadeln und Vertikalen'},
  n:{l:'Tore',u:'',dec:0},
  len:{l:'Kurslänge',u:'m',dec:0},
  vd:{l:'Höhendifferenz',u:'m',dec:0},
  nDel:{l:'Bananen',u:'',dec:0},
  nHp:{l:'Haarnadeln',u:'',dec:0},
  nVc:{l:'Vertikalen',u:'',dec:0}
};
var MET_MAIN = ['d','o','a','dsd','omax','pitch','pmax','fig','n','len','vd'];
var GM = { // gate-level metrics
  d:{l:'Torabstand',u:'m',dec:2,f:function(g){return g.d}},
  o:{l:'Offset',u:'m',dec:2,f:function(g){return g.o}},
  a:{l:'Richtungswinkel',u:'°',dec:1,f:function(g){return Math.abs(g.a)}},
  p:{l:'Neigung',u:'%',dec:0,f:function(g){return g.p}}
};

/* ---------- disciplines: everything that differs between SL and GS ---------- */
var CFG = {
  SL:{name:'Slalom',years:'2023/24–2025/26',
    ty:['Offen','Banane','Haarnadel','Vertikale'],tk:['','B','H','V'],
    short:{'Madonna di Campiglio':'Madonna','Palisades Tahoe':'Palisades'},seasons:['23/24','24/25','25/26'],
    metAll:['nDel','nHp','nVc'],
    t:{fig:'Figur',figWhy:'Tor einer Figur',after:'nach Figur',before:'vor Figur',
      figL:'Figuren-Anteil',figH:'Anteil der Tore in Bananen, Haarnadeln und Vertikalen',figDec:0,nDel:'Bananen',
      statSub:'Abstand, Offset und Winkel zählen nur normale offene Tore. Figuren pro 60 Tore.',per:60,
      statCols:[['Fig. %','fig',0],['Ban./60','nDel','k'],['Haarn./60','nHp','k'],['Vert./60','nVc','k']],
      gates:function(m){return fmt(m.fig,0)+'% in Figuren'},
      leg:['B Banane','H Haarnadel','V Vertikale'],
      profSub:'Jedes Tor inklusive Figuren (markiert für Kurs A). Die Glättung mittelt nur normale offene Tore.',
      gpsNote:': Der Tortyp ist nicht erfasst, die Figuren sind aus den kurzen Torabständen abgeleitet.',
      planSub:'Draufsicht in Metern, Start oben. Ringe: Bananen (grau), Haarnadeln (violett), Vertikalen (türkis).',
      glNote:'«≈» = Figur aus den Abständen abgeleitet; Winkel ohne Vorzeichen.',
      dbFig:[['fig','Figuren %',0],['nDel','Ban.',0],['nHp','Haarn.',0],['nVc','Vert.',0]],dbView:'fig',
      dbSub:' Einträge. Spaltenkopf sortiert, Zeile öffnet das Kurs-Detail. Die CSV enthält zusätzlich Quelle, gewertete Tore, Maxima und Figuren.'}},
  GS:{name:'Riesenslalom',years:'2024/25–2025/26',
    ty:['Offen','Verzögerung','',''],tk:['','V','',''],
    short:{'Copper Mountain':'Copper'},seasons:['24/25','25/26'],
    metAll:['nDel'],
    t:{fig:'Verzögerung',figWhy:'verzögertes Tor',after:'nach Verzögerung',before:'vor Verzögerung',
      figL:'Anteil Verzögerungen',figH:'Anteil der verzögerten Tore an allen Toren',figDec:1,nDel:'Verzögerungen',
      statSub:'Abstand, Offset und Winkel zählen nur normale offene Tore. Verzögerungen pro 50 Tore.',per:50,
      statCols:[['Verz. %','fig',1],['Verz./50','nDel','k']],
      gates:function(m){return m.nDel+(m.nDel===1?' Verzögerung':' Verzögerungen')},
      leg:['V Verzögerung','',''],
      profSub:'Jedes Tor inklusive Verzögerungen (markiert für Kurs A). Die Glättung mittelt nur normale offene Tore.',
      gpsNote:': Der Tortyp ist nicht erfasst, Verzögerungen sind aus den kurzen Torabständen abgeleitet.',
      planSub:'Draufsicht in Metern, Start oben. Ringe: Verzögerungen.',
      glNote:'«≈» = Verzögerung aus den Abständen abgeleitet; Winkel ohne Vorzeichen.',
      dbFig:[['fig','Verz. %',1],['nDel','Verzögerungen',0]],dbView:'nDel',
      dbSub:' Einträge. Spaltenkopf sortiert, Zeile öffnet das Kurs-Detail. Die CSV enthält zusätzlich Quelle, gewertete Tore, Maxima und Anteil Verzögerungen.'}}
};
var DISCS = ['SL','GS'];
function applyDisc(d){
  var c=CFG[d];DK=d;
  TY_DE=c.ty;TY_K=c.tk;SHORT=c.short;SEASONS=c.seasons;META=METAS[d];ZONES=ZONESB[d];T=c.t;
  MET.fig.l=T.figL;MET.fig.h=T.figH;MET.fig.dec=T.figDec;MET.nDel.l=T.nDel;
  MET_ALL=MET_MAIN.concat(c.metAll);
}
