
/* ---------- Übersicht ---------- */
function unit(mk){return mk.u?' ['+mk.u+']':''}
function vOverview(V,L){
  var gs=kinds(L),ss=seasons(L),LR=of(L,'R'),LT=of(L,'T');
  var K=el('div',{class:'kpis'});
  K.append(kpi('Kurssetzungen',String(L.length),null,LR.length+' Rennläufe · '+LT.length+' Trainings · '+sum(vals(L,'n'))+' Tore','gold'));
  function rows(key,dec){return gs.map(function(g){return {tag:KIND[g],v:fmt(avg(of(L,g),key),dec==null?MET[key].dec:dec),u:MET[key].u}})}
  function dsub(key,dec){if(gs.length<2)return MET[key].h||null;return 'Training − Rennen: '+sgn(avg(LT,key)-avg(LR,key),dec==null?MET[key].dec:dec)+(MET[key].u==='m'?' m':MET[key].u)}
  K.append(kpiMulti('Ø Torabstand',rows('d'),dsub('d')));
  K.append(kpiMulti('Ø Offset',rows('o'),dsub('o')));
  K.append(kpiMulti('Ø Richtungswinkel',rows('a'),dsub('a')));
  K.append(kpiMulti('Ø Neigung',rows('pitch'),dsub('pitch')));
  K.append(kpiMulti('Ø Tore pro Kurs',rows('n',0),gs.length<2?'Ø Länge '+fmt(avg(L,'len'),0)+' m':'Ø Länge '+fmt(avg(LR,'len'),0)+' m / '+fmt(avg(LT,'len'),0)+' m'));
  V.append(K);

  // training vs race per season
  V.append(fold('cmp','Training und Rennen im Vergleich','Mittel pro Saison. Strich = mittlere 50% der Kurse.',null,true,function(c0){
    c0.append(legendGen(gs));
    var mm=el('div',{class:'minis4'});
    ['d','o','a','pitch'].forEach(function(key){
      var mk=MET[key];
      var series=gs.map(function(g){
        return {g:g,name:KIND[g],color:GCOL[g],pts:ss.map(function(s,i){var l=of(L,g,s);if(!l.length)return null;var v=vals(l,key).sort(function(a,b){return a-b});
          return {x:i,y:mean(v),lo:quant(v,.25),hi:quant(v,.75),n:l.length}}).filter(Boolean)};
      });
      mm.append(el('div',{class:'panel'},el('div',{class:'ptitle',text:mk.l+unit(mk)}),chartBox(function(box,w){
        lineChart(box,w,{h:176,mt:12,series:series,xDomain:[-.5,ss.length-.5],xTicks:ss.map(function(s,i){return {v:i,l:s}}),yn:3,
          tip:function(xv){var rows=[],p={};series.forEach(function(s){s.pts.forEach(function(q){if(q.x===xv){p[s.g]=q;rows.push({c:s.color,k:s.name+' ('+q.n+')',v:fmtU(q.y,mk)})}})});
            if(p.R&&p.T)rows.push({k:'Training − Rennen',v:sgn(p.T.y-p.R.y,mk.dec)});
            return tipNode('Saison '+ss[xv],mk.l+(mk.h?' · '+mk.h:''),rows)}});
      })));
    });
    c0.append(mm);
  }));

  // stats table by group
  V.append(fold('stats','Statistik nach Gruppe',T.statSub,null,true,function(c5){
    var cols=[['Kurse',null],['Tore','n',0],['Länge m','len',0],['Höhe m','vd',0],['Neig. %','pitch',1],['Ø Abst. m','d',2],['Min–Max','d','r'],['SD','dsd',2],['Ø Offset m','o',2],['Min–Max','o','r'],['Ø Winkel °','a',1]].concat(T.statCols);
    var t5=el('table',{class:'tbl dense'});
    t5.append(el('thead',null,el('tr',null,[el('th',{class:'l',text:'Gruppe'})].concat(cols.map(function(c){return el('th',{text:c[0]})})))));
    var tb=el('tbody');
    function grow(name,g,l,strong){
      if(!l.length)return;
      var tr=el('tr',{class:strong?'sum':null},el('td',{class:'l'},el('i',{class:'gd',style:'background:'+GCOL[g]}),name));
      cols.forEach(function(c){var v=l.map(function(x){return c[2]==='k'?x.m[c[1]]*T.per/x.m.n:x.m[c[1]]});
        tr.append(el('td',{text:c[1]==null?String(l.length):c[2]==='r'?fmt(Math.min.apply(null,v),2)+' – '+fmt(Math.max.apply(null,v),2):fmt(mean(v),c[2]==='k'?1:c[2])}))});
      tb.append(tr);
    }
    gs.forEach(function(g){
      ss.forEach(function(s){grow(KIND[g]+' '+s,g,of(L,g,s))});
      if(seasons(of(L,g)).length>1)grow(KIND[g]+' gesamt',g,of(L,g),true);
    });
    t5.append(tb);c5.append(el('div',{class:'tw'},t5));
  }));

  // scatter | venues and races
  var gA=el('div',{class:'grid2'}),mk=MET[S.rank];
  gA.append(fold('scatter','Kurs-Charakter','Ein Punkt pro Kurssetzung, graue Linien = Durchschnitt. Klick öffnet das Kurs-Detail.',
    [pair('scX','X',metSel('scX','scX',MET_MAIN)),pair('scY','Y',metSel('scY','scY',MET_MAIN))],true,function(c1){
    c1.append(legendGen(gs,runKeys()));
    c1.append(chartBox(function(box,w,h){
      scatterChart(box,w,{h:Math.max(360,h||400),pts:L.map(function(c){return {x:c.m[S.scX],y:c.m[S.scY],color:GCOL[c.kind],hollow:c.run===2,label:cShort(c),c:c}}),
        xLabel:MET[S.scX].l+unit(MET[S.scX]),yLabel:MET[S.scY].l+unit(MET[S.scY]),xDec:MET[S.scX].dec,yDec:MET[S.scY].dec,
        tip:function(p){return tipNode(cName(p.c),KIND1[p.c.kind]+' '+p.c.season+' · '+p.c.m.n+' Tore',[{k:MET[S.scX].l,v:fmtU(p.x,MET[S.scX])},{k:MET[S.scY].l,v:fmtU(p.y,MET[S.scY])}])},
        onClick:function(p){goCourse(p.c)}});
    },true));
  }));
  var rv=(S.rankView==='R'&&LR.length)||!LT.length?'R':'T';
  var tog=el('div',{class:'seg',role:'group','aria-label':'Ansicht'},
    el('button',{type:'button','aria-pressed':String(rv==='T'),text:'Trainingsorte',onclick:function(){set('rankView','T')}}),
    el('button',{type:'button','aria-pressed':String(rv==='R'),text:'Rennen',onclick:function(){set('rankView','R')}}));
  gA.append(fold('rank','Orte und Rennen im Vergleich',rv==='T'?'Punkt = Ø der Trainingskurse am Ort, Strich = kleinster bis grösster Kurs. Blau = Ø Rennen mit den mittleren 50%. Klick zeigt die Kurse des Orts.':'Eine Zeile pro Rennen. Punkt = 1. Lauf, Ring = 2. Lauf. Klick öffnet das Rennen.',
    [tog,pair('rankSel','Kennzahl',metSel('rankSel','rank',MET_ALL))],true,function(c2){
    if(rv==='R'){
      var byRace={};LR.forEach(function(c){(byRace[c.race]=byRace[c.race]||{cs:{}}).cs[c.run]=c});
      var rrows=Object.keys(byRace).map(function(k){var r=byRace[k],c=r.cs[1]||r.cs[2],v=[r.cs[1]?r.cs[1].m[S.rank]:null,r.cs[2]?r.cs[2].m[S.rank]:null];
        return {label:c.vs+' '+fD2(c.date)+(c.tc?' TK':''),color:GCOL.R,v:v,mean:mean(v.filter(function(x){return x!=null})),cs:r.cs,c:c}});
      rrows.sort(function(a,b){return b.mean-a.mean});
      if(!rrows.length){c2.append(el('div',{class:'empty',text:'Keine Rennen in dieser Auswahl.'}));return}
      c2.append(el('div',{class:'scrolly'},chartBox(function(bx,w){dumbbell(bx,w,{rows:rrows,dec:mk.dec,xLabel:mk.l+unit(mk),
        tip:function(r){var t=[];if(r.v[0]!=null)t.push({k:'1. Lauf',v:fmtU(r.v[0],mk)});if(r.v[1]!=null)t.push({k:'2. Lauf',v:fmtU(r.v[1],mk)});
          if(r.v[0]!=null&&r.v[1]!=null)t.push({k:'Differenz 2. − 1.',v:sgn(r.v[1]-r.v[0],mk.dec)});
          return tipNode(r.c.venue+(r.c.tc?' (Team-Kombi)':''),fDate(r.c.date)+' · '+serName(r.c),t)},
        onClick:function(r){goCourse(r.cs[1]||r.cs[2])}})})));
      var both=rrows.filter(function(r){return r.v[0]!=null&&r.v[1]!=null}),dl=both.map(function(r){return r.v[1]-r.v[0]});
      if(both.length)c2.append(el('p',{class:'note',text:'2. Lauf gegenüber 1. Lauf: im Mittel '+sgn(mean(dl),mk.dec)+(mk.u?' '+mk.u:'')+' · in '+dl.filter(function(x){return x>0}).length+' von '+both.length+' Rennen höher.'}));
    }else{
      var refL=LR.length?LR:of(COURSES,'R'),rf=vals(refL,S.rank).sort(function(a,b){return a-b});
      var byV={};LT.forEach(function(c){(byV[c.venue]=byV[c.venue]||[]).push(c)});
      var vrows=Object.keys(byV).map(function(v){var l=byV[v],x=vals(l,S.rank);return {label:(SHORT[v]||v)+' ('+l.length+')',color:GCOL.T,v:mean(x),lo:Math.min.apply(null,x),hi:Math.max.apply(null,x),l:l,venue:v}});
      vrows.sort(function(a,b){return b.v-a.v});
      c2.append(el('div',{class:'scrolly'},chartBox(function(bx,w){rangeRows(bx,w,{rows:vrows,dec:mk.dec,xLabel:mk.l+unit(mk),
        ref:{v:mean(rf),lo:quant(rf,.25),hi:quant(rf,.75),label:'Ø Rennen',color:'var(--s1)',soft:'var(--s1-soft)'},
        tip:function(r){return tipNode(r.venue,r.l.length+' Trainingskurs'+(r.l.length>1?'e':'')+' · '+mk.l,[{c:GCOL.T,k:'Ø Training',v:fmtU(r.v,mk)},{k:'Min – Max',v:fmt(r.lo,mk.dec)+' – '+fmt(r.hi,mk.dec)},{c:GCOL.R,k:'Ø Rennen',v:fmtU(mean(rf),mk)},{k:'Differenz',v:sgn(r.v-mean(rf),mk.dec)}])},
        onClick:function(r){S.venue=r.venue;S.kind='T';S.tab='daten';save();render();window.scrollTo(0,0)}})})));
    }
  }));
  V.append(gA);

  // distribution + binned means (folded by default)
  var g2=el('div',{class:'grid2'}),gm=GM[S.hist];
  g2.append(fold('hist','Verteilung pro Tor',S.hist==='p'?'Alle Abschnitte. Gestrichelt: Median.':'Nur normale offene Tore. Gestrichelt: Median.',
    [pair('histSel','Grösse',select('histSel','hist',Object.keys(GM).map(function(k){return [k,GM[k].l]})))],false,function(c3){
    c3.append(legendGen(gs));
    var statRows=[];
    var hser=gs.map(function(g){
      var vs=[];of(L,g).forEach(function(c){
        (S.hist==='p'?(c.fin?c.gates.concat([c.fin]):c.gates):c.gates.filter(function(x){return x.reg})).forEach(function(x){vs.push(S.hist==='p'?x.p:gm.f(x))})});
      if(vs.length){var s=vs.slice().sort(function(a,b){return a-b});statRows.push([KIND[g],vs.length,mean(vs),quant(s,.5),sdev(vs),quant(s,.1),quant(s,.9)])}
      return {name:KIND[g],color:GCOL[g],soft:GSOFT[g],vals:vs};
    });
    c3.append(chartBox(function(box,w){histChart(box,w,{series:hser,xLabel:gm.l+' ['+gm.u+']',unit:gm.u})}));
    var st=el('table',{class:'tbl dense'}),dc=Math.max(1,gm.dec);
    st.append(el('thead',null,el('tr',null,['Gruppe','Tore','Mittel','Median','SD','P10','P90'].map(function(h,i){return el('th',{class:i?null:'l',text:h})}))));
    st.append(el('tbody',null,statRows.map(function(r){return el('tr',null,r.map(function(v,i){return el('td',{class:i?null:'l',text:i===0?v:i===1?String(v):fmt(v,dc)})}))})));
    c3.append(el('div',{class:'tw',style:'margin-top:12px'},st));
  }));

  if(S.binBy==='pitch'&&S.binM==='p')S.binM='o';
  var bm=GM[S.binM];
  g2.append(fold('bins','Wo wird gedreht?',S.binBy==='pitch'?'Ø der normalen offenen Tore nach Neigung des Abschnitts. Klassen unter 30 Toren sind ausgeblendet.':'Ø der normalen offenen Tore nach Position im Kurs (Zehntel der Torfolge).',
    [select('binBySel','binBy',[['pitch','nach Neigung'],['pos','nach Kursabschnitt']]),select('binMSel','binM',[['o','Offset'],['d','Torabstand'],['a','Richtungswinkel']].concat(S.binBy==='pos'?[['p','Neigung']]:[]))],false,function(c4){
    c4.append(legendGen(gs));
    var nb=S.binBy==='pitch'?6:10;
    var bser=gs.map(function(g){
      var B=[];for(var i=0;i<nb;i++)B.push([]);
      of(L,g).forEach(function(c){c.gates.forEach(function(x){
        if(!x.reg&&!(S.binBy==='pos'&&S.binM==='p'))return;
        var i=S.binBy==='pitch'?Math.max(0,Math.min(5,Math.floor(x.p/10))):Math.min(9,Math.floor((x.n-1)/c.m.n*10));B[i].push(bm.f(x))})});
      return {name:KIND[g],color:GCOL[g],pts:B.map(function(b,i){return {x:i,y:mean(b),n:b.length}}).filter(function(p){return p.n>=(S.binBy==='pitch'?30:1)})};
    });
    var xl=S.binBy==='pitch'?['0–10','10–20','20–30','30–40','40–50','50+']:['1','2','3','4','5','6','7','8','9','10'];
    c4.append(chartBox(function(box,w,h){lineChart(box,w,{h:Math.max(250,h||250),series:bser,xDomain:[-.4,nb-.6],xTicks:xl.map(function(l,i){return {v:i,l:l}}),
      xLabel:S.binBy==='pitch'?'Neigung des Abschnitts [%]':'Kursabschnitt (Zehntel der Torfolge)',yLabel:bm.l+' ['+bm.u+']',
      tip:function(xv){return tipNode(S.binBy==='pitch'?'Neigung '+xl[xv]+'%':'Kursabschnitt '+xl[xv]+' von 10','Ø '+bm.l,bser.map(function(s){var p=s.pts.filter(function(q){return q.x===xv})[0];return p?{c:s.color,k:s.name,v:fmt(p.y,Math.max(1,bm.dec))+' '+bm.u+'  (n='+p.n+')'}:null}).filter(Boolean))}})},250));
  }));
  V.append(g2);

  // zones (rebuilt from the coach's sheet)
  V.append(fold('zones','Zonen','Anteil der Tore eines Kurses pro Bereich, im Mittel der Auswahl.',zoneToggle(),false,function(cz){
    cz.append(legendGen(gs));
    cz.append(zoneCharts(gs.map(function(g){return {name:KIND[g],color:GCOL[g],list:of(L,g)}}),S.zoneAll));
  }));
}
