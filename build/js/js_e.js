
/* ---------- Saison-Verlauf ---------- */
function groupBy(list,key){var by={};list.forEach(function(x){(by[x[key]]=by[x[key]]||[]).push(x)});return Object.keys(by).map(function(k){return by[k]})}
function vSeason(V,L){
  var gs=kinds(L),ss=seasons(L),mk=MET[S.seasonM],LR=of(L,'R');
  var races=groupBy(LR,'race').sort(function(a,b){return a[0].t-b[0].t});
  V.append(fold('season','Saison-Verlauf','Rennen: Mittel der Läufe, verbunden. Training: ein Punkt pro Tag und Ort. Strich = kleinster bis grösster Kurs. Klick öffnet das Kurs-Detail.',
    [pair('seasonSel','Kennzahl',metSel('seasonSel','seasonM',MET_ALL))],true,function(c){
    c.append(legendGen(gs));
    var all=vals(L,S.seasonM),yd=pad(Math.min.apply(null,all),Math.max.apply(null,all),.08);
    var P=el('div',{style:'display:flex;flex-direction:column;gap:14px'});
    ss.forEach(function(s){
      var y0=2000+ +s.slice(0,2),t0=Date.UTC(y0,7,15),t1=Date.UTC(y0+1,3,25),mt=[];
      ['Sep','Okt','Nov','Dez','Jan','Feb','Mär','Apr'].forEach(function(l,i){mt.push({v:Date.UTC(y0,8+i,1),l:l})});
      var series=gs.map(function(g){
        var pts=groupBy(of(L,g,s),g==='R'?'race':'day').map(function(cs){var v=vals(cs,S.seasonM);return {x:cs[0].t,y:mean(v),lo:Math.min.apply(null,v),hi:Math.max.apply(null,v),cs:cs}}).sort(function(a,b){return a.x-b.x});
        return {name:KIND[g],color:GCOL[g],pts:pts,line:g==='R'};
      });
      var bands=s==='25/26'?[{x0:Date.UTC(2026,1,6),x1:Date.UTC(2026,1,22),l:'Olympia',c:'var(--fig-l-soft)',lc:'var(--fig-l)'}]:s==='24/25'?[{x0:Date.UTC(2025,1,4),x1:Date.UTC(2025,1,16),l:'WM',c:'var(--fig-l-soft)',lc:'var(--fig-l)'}]:[];
      var box=chartBox(function(bx,w){lineChart(bx,w,{h:212,series:series,xDomain:[t0,t1],xTicks:mt,yDomain:yd.slice(),yLabel:mk.l+unit(mk),yn:4,bands:bands,
        tip:function(xv){var rows=[],title='';series.forEach(function(sr){sr.pts.forEach(function(p){if(p.x===xv){title=fDate(p.cs[0].date);
            rows.push({head:p.cs[0].venue+(p.cs[0].tc?' (Team-Kombi)':'')+' · '+sr.name});
            p.cs.slice().sort(function(a,b){return a.run-b.run||a.id-b.id}).forEach(function(x){rows.push({c:sr.color,k:runLab(x),v:fmtU(x.m[S.seasonM],mk)})})}})});
          return tipNode(title,mk.l,rows)},
        onClick:function(xv){var hitc=null;series.forEach(function(sr){sr.pts.forEach(function(p){if(p.x===xv&&!hitc)hitc=p.cs[0]})});if(hitc)goCourse(hitc)}})});
      P.append(el('div',{class:'panel'},el('div',{class:'ptitle'},el('b',{text:s}),'Saison 20'+s.slice(0,2)+'/'+s.slice(3)),box));
    });
    c.append(P);
  }));

  // preparation: trainings in the two weeks before a race
  var pk=MET[S.prepM],WIN=14;
  V.append(fold('prep','Vorbereitung und Rennen','Trainingskurse der '+WIN+' Tage vor jedem Rennen (alle Orte) neben dem Rennen selbst. Klick öffnet Rennen (A) und letztes Training davor (B).',
    [pair('prepSel','Kennzahl',metSel('prepSel','prepM',['d','o','a','dsd','pitch','fig']))],true,function(cp){
    var prows=races.map(function(cs){var r=cs[0],tr=COURSES.filter(function(x){return x.kind==='T'&&x.t<r.t&&r.t-x.t<=WIN*DAY});
      return {r:r,cs:cs,tr:tr,rv:avg(cs,S.prepM),tv:tr.length?avg(tr,S.prepM):null}});
    var withT=prows.filter(function(p){return p.tv!=null});
    if(!withT.length){cp.append(el('div',{class:'empty',text:'Für diese Auswahl gibt es kein Rennen mit Trainingskursen in den '+WIN+' Tagen davor.'}));return}
    var tp=el('table',{class:'tbl'});
    tp.append(el('thead',null,el('tr',null,[['Datum','l'],['Rennen','l'],[pk.l+' · Rennen'],['Training davor','l'],[pk.l+' · Training'],['Training − Rennen']].map(function(h){return el('th',{class:h[1]||null,text:h[0]})}))));
    tp.append(el('tbody',null,withT.map(function(p){
      var places=Array.from(new Set(p.tr.map(function(x){return x.vs})));
      return el('tr',{class:'click',onclick:function(){goCourse(p.cs.slice().sort(function(a,b){return a.run-b.run})[0],p.tr[p.tr.length-1].id)}},
        el('td',{class:'l',text:fDate(p.r.date)}),el('td',{class:'l'},el('i',{class:'gd',style:'background:'+GCOL.R}),p.r.venue+(p.r.tc?' (Team-Kombi)':'')),
        el('td',{text:fmtU(p.rv,pk)}),
        el('td',{class:'l'},el('i',{class:'gd',style:'background:'+GCOL.T}),p.tr.length+' Kurs'+(p.tr.length>1?'e':'')+' · '+places.join(', ')),
        el('td',{text:fmtU(p.tv,pk)}),el('td',{text:sgn(p.tv-p.rv,pk.dec)}))})));
    cp.append(el('div',{class:'tw tall',style:'max-height:420px'},tp));
    var dl=withT.map(function(p){return p.tv-p.rv});
    cp.append(el('p',{class:'note',text:withT.length+' Rennen mit Training davor: Training gegenüber Rennen im Mittel '+sgn(mean(dl),pk.dec)+(pk.u?' '+pk.u:'')+' ('+pk.l+'), in '+dl.filter(function(x){return x>0}).length+' von '+withT.length+' Fällen höher.'+(prows.length>withT.length?' '+(prows.length-withT.length)+' Rennen ohne Trainingskurs davor sind nicht aufgeführt.':'')}));
  }));

  // tables (folded: the database tab holds the same rows)
  var g2=el('div',{class:'grid2'});
  g2.append(fold('tblR','Rennen der Auswahl',mk.l+' pro Lauf.',[pair('seasonSel2','Kennzahl',metSel('seasonSel2','seasonM',MET_ALL))],false,function(c2){
    if(!races.length){c2.append(el('div',{class:'empty',text:'Keine Rennen in dieser Auswahl.'}));return}
    var t=el('table',{class:'tbl'});
    t.append(el('thead',null,el('tr',null,[['Datum','l'],['Ort','l'],['1. Lauf'],['2. Lauf'],['2. − 1.']].map(function(h){return el('th',{class:h[1]||null,text:h[0]})}))));
    t.append(el('tbody',null,races.map(function(cs){var by={};cs.forEach(function(x){by[x.run]=x});var x=by[1]||by[2],a=by[1]?by[1].m[S.seasonM]:null,b=by[2]?by[2].m[S.seasonM]:null;
      return el('tr',{class:'click',onclick:function(){goCourse(x)}},el('td',{class:'l',text:fDate(x.date)}),el('td',{class:'l'},el('i',{class:'gd',style:'background:'+GCOL.R}),x.venue+(x.tc?' (Team-Kombi)':'')),
        el('td',{text:a==null?'–':fmtU(a,mk)}),el('td',{text:b==null?'–':fmtU(b,mk)}),el('td',{text:a!=null&&b!=null?sgn(b-a,mk.dec):'–'}))})));
    c2.append(el('div',{class:'tw tall'},t));
  }));
  g2.append(fold('tblT','Trainings der Auswahl',mk.l+' pro Kurs und Differenz zum Ø der Rennen derselben Saison.',null,false,function(c3){
    var LT=of(L,'T').slice().sort(function(a,b){return a.t-b.t||a.id-b.id});
    if(!LT.length){c3.append(el('div',{class:'empty',text:'Keine Trainingskurse in dieser Auswahl.'}));return}
    var rs={};SEASONS.forEach(function(s){var l=of(COURSES,'R',s);rs[s]=l.length?avg(l,S.seasonM):null});
    var t3=el('table',{class:'tbl'});
    t3.append(el('thead',null,el('tr',null,[['Datum','l'],['Ort','l'],['Teil','l'],[mk.l],['zu Ø Rennen']].map(function(h){return el('th',{class:h[1]||null,text:h[0]})}))));
    t3.append(el('tbody',null,LT.map(function(x){var v=x.m[S.seasonM],r=rs[x.season];
      return el('tr',{class:'click',onclick:function(){goCourse(x)}},el('td',{class:'l',text:fDate(x.date)}),el('td',{class:'l'},el('i',{class:'gd',style:'background:'+GCOL.T}),x.venue+(x.piste?' · '+x.piste:'')),
        el('td',{class:'l',text:x.label||'–'}),el('td',{text:fmtU(v,mk)}),el('td',{text:r==null?'–':sgn(v-r,mk.dec)}))})));
    c3.append(el('div',{class:'tw tall'},t3));
  }));
  V.append(g2);
}

/* ---------- Kurs-Detail ---------- */
function smooth(a,G){return a.map(function(v,i){if(!G[i].reg)return v;var s=0,n=0;for(var j=i-1;j<=i+1;j++)if(j>=0&&j<a.length&&G[j].reg){s+=a[j];n++}return s/n})}
function vCourse(V,L){
  var pool=L.length?L:COURSES;
  var A=COURSES[S.a];if(!A||pool.indexOf(A)<0){A=pool.filter(function(c){return c.kind==='R'}).slice(-1)[0]||pool[pool.length-1];S.a=A.id}
  var other=A.kind==='R'?COURSES.filter(function(c){return c.race===A.race&&c.run!==A.run})[0]||null:null;
  var B=null;
  if(S.b==='auto')B=other;
  else if(S.b!=='none'){B=COURSES[+S.b]||null;if(B===A)B=null}
  function grp(list){var g={},o=[];list.slice().sort(function(a,b){return b.t-a.t||a.run-b.run||a.id-b.id}).forEach(function(c){var k=KIND[c.kind]+' '+c.season;if(!g[k]){g[k]=[];o.push(k)}g[k].push([String(c.id),cOpt(c)])});
    return o.sort(function(a,b){return b.slice(-5).localeCompare(a.slice(-5))||a.localeCompare(b)}).map(function(k){return {group:k,items:g[k]}})}
  var selA=select('selA','a',grp(pool));selA.value=String(A.id);
  var autoL=A.kind==='R'?'Lauf '+(A.run===1?2:1)+' des gleichen Rennens'+(other?'':' (nicht vorhanden)'):'Kein Vergleich (Training)';
  var selB=select('selB','b',[['auto',autoL]].concat(A.kind==='R'?[['none','Kein Vergleich']]:[]).concat(grp(COURSES.filter(function(c){return c!==A}))));
  selB.value=(A.kind==='T'&&S.b==='none')?'auto':String(S.b);
  V.append(el('section',{class:'card filters'},
    el('div',{class:'fg grow',style:'flex-basis:300px'},el('label',{for:'selA'},el('i',{class:'gd',style:'background:var(--ca)'}),'Kurs A'),selA),
    el('div',{class:'fg grow',style:'flex-basis:300px'},el('label',{for:'selB'},el('i',{class:'gd',style:'background:var(--cb)'}),'Vergleich B'),selB)));

  var K=el('div',{class:'kpis'}),ma=A.m,mb=B?B.m:null;
  var sub=A.kind==='R'||A.label?[runLab(A)]:[];if(A.piste)sub.push(A.piste);sub.push(A.nat);if(A.setter)sub.push('Setzer '+A.setter);
  K.append(kpi((A.kind==='R'?serName(A):'Training')+' · '+fDate(A.date),A.venue,null,sub.join(' · '),'gold'));
  K.lastChild.querySelector('.v').classList.add('name');
  function kd(label,key,sb){var mk=MET[key],s=sb||'';if(mb)s=(s?s+' · ':'')+'B: '+fmtU(mb[key],mk)+' ('+sgn(ma[key]-mb[key],mk.dec)+')';K.append(kpi(label,fmt(ma[key],mk.dec),mk.u,s||null))}
  kd('Tore','n',T.gates(ma));
  kd('Höhendifferenz','vd','Länge '+fmt(ma.len,0)+' m · Ø '+fmt(ma.pitch,1)+'%');
  kd('Ø Torabstand','d',ma.nreg+' von '+ma.n+' Toren gewertet');
  kd('Ø Offset','o','max '+fmt(ma.omax,2));
  kd('Ø Richtungswinkel','a');
  V.append(K);
  function tag(c){return c.vs+' '+(c.kind==='R'?runN(c.run):fD2(c.date)+(c.label?' '+c.label:''))}

  var RR=of(COURSES,'R'),RT=of(COURSES,'T');
  var cmp=[{name:'A · '+tag(A),short:'A',c:A,color:'var(--ca)'}];
  if(B)cmp.push({name:'B · '+tag(B),short:'B',c:B,color:'var(--cb)'});
  var refs=[{name:'Ø Rennen',color:'var(--s1)',list:RR},{name:'Ø Training',color:'var(--s2)',list:RT}];
  function legendCmp(band){var lk=el('div',{class:'legend'});
    cmp.concat(refs).forEach(function(x){lk.append(el('span',null,el('i',{class:'ln',style:'background:'+x.color}),x.name))});
    if(band)lk.append(el('span',{class:'lt'},el('i',{class:'bd'}),'Min–Max Rennen'));return lk}

  // course against races and trainings (the coach's «Distance-Offset» and «Metrics» charts)
  V.append(fold('ccmp','Kurs im Vergleich','Kurs A'+(B?' und B':'')+' neben dem Ø aller '+RR.length+' Rennläufe und '+RT.length+' Trainingskurse. Graues Band = kleinster bis grösster Rennlauf.',null,true,function(ck){
    ck.append(legendCmp(true));
    var cols=cmp.concat(refs),t=el('table',{class:'tbl cmpt'});
    t.append(el('thead',null,el('tr',null,[el('th',{class:'l',text:'Kennzahl'})].concat(cols.map(function(x,i){return el('th',null,el('i',{class:'gd',style:'background:'+x.color}),i<cmp.length?x.short:x.name)})).concat([el('th',{class:'l strip',text:'Einordnung'})]))));
    var tb=el('tbody');
    ['d','o','a','dsd','pitch','fig'].forEach(function(key){
      var mk=MET[key],rv=vals(RR,key),lo=Math.min.apply(null,rv),hi=Math.max.apply(null,rv);
      var v=cmp.map(function(x){return x.c.m[key]}).concat(refs.map(function(r){return avg(r.list,key)}));
      var tr=el('tr',null,el('td',{class:'l',text:mk.l+unit(mk)}));
      v.forEach(function(x,i){tr.append(el('td',{class:i<cmp.length?'strong':null,text:fmt(x,mk.dec)}))});
      tr.append(el('td',{class:'strip'},chartBox(function(box,w){stripChart(box,w,{lo:lo,hi:hi,
        marks:cols.map(function(x,i){return {v:v[i],color:x.color,kind:i>=cmp.length?'tick':i?'ring':'dot'}}),
        tip:function(){return tipNode(mk.l,mk.h||null,cols.map(function(x,i){return {c:x.color,k:x.name,v:fmtU(v[i],mk)}}).concat([{k:'Min Rennen',v:fmtU(lo,mk)},{k:'Max Rennen',v:fmtU(hi,mk)}]))}})})));
      tb.append(tr);
    });
    t.append(tb);ck.append(el('div',{class:'tw cq'},t));
  }));

  // profile
  var sw=el('label',{class:'sw'},el('input',{type:'checkbox',id:'smoothChk',checked:S.smooth,onchange:function(e){set('smooth',e.target.checked)}}),el('i'),'Kurve glätten');
  V.append(fold('profile','Profil pro Tor',T.profSub,sw,true,function(c1){
    var L1=el('div',{class:'legend'},el('span',null,el('i',{class:'ln',style:'background:var(--ca)'}),'A · '+cName(A)));
    if(B)L1.append(el('span',null,el('i',{class:'ln',style:'background:var(--cb)'}),'B · '+cName(B)));
    if(A.m.nDel)L1.append(el('span',{class:'lt'},el('i',{class:'dot',style:'border-radius:3px;background:var(--fig-b)'}),T.leg[0]));
    if(A.m.nHp)L1.append(el('span',{class:'lt'},el('i',{class:'dot',style:'border-radius:3px;background:var(--fig-h)'}),T.leg[1]));
    if(A.m.nVc)L1.append(el('span',{class:'lt'},el('i',{class:'dot',style:'border-radius:3px;background:var(--fig-f)'}),T.leg[2]));
    c1.append(L1);
    var bands=[],i=0,G=A.gates;
    while(i<G.length){if(G[i].t>0){var j=i;while(j+1<G.length&&G[j+1].t===G[i].t&&G[i].t!==1&&(G[i].t===3||j-i<1))j++;
        bands.push({x0:G[i].n-.5,x1:G[j].n+.5,l:TY_K[G[i].t],c:FIGS[G[i].t],lc:FIGC[G[i].t]});i=j+1}else i++}
    var defs=[['d','Torabstand [m]',2],['o','Offset [m]',2],['p','Neigung [%]',0],['a','Richtungswinkel [°]',0]];
    var nmax=Math.max(A.m.n,B?B.m.n:0);
    defs.forEach(function(df,idx){
      function ser(c,col){var v=c.gates.map(GM[df[0]].f);if(S.smooth)v=smooth(v,c.gates);return {name:c===A?'A':'B',color:col,marker:false,pts:v.map(function(y,k){return {x:k+1,y:y}})}}
      var series=[ser(A,'var(--ca)')];if(B)series.push(ser(B,'var(--cb)'));
      c1.append(el('div',{class:'ptitle',style:'margin-top:'+(idx?6:2)+'px',text:df[1]}));
      c1.append(chartBox(function(box,w){lineChart(box,w,{h:idx===3?160:132,mt:idx===0?24:10,series:series,xDomain:[0.5,nmax+.5],yLabel:null,yn:3,
        bands:bands.map(function(b){return {x0:b.x0,x1:b.x1,c:b.c,lc:b.lc,l:idx===0?b.l:null}}),xLabel:idx===3?'Tor-Nr.':null,
        xTicks:(function(){var st=[2,5,10,20].filter(function(q){return nmax/q<=Math.max(4,Math.floor(w/56))})[0]||20,t=[];for(var v=st;v<=nmax;v+=st)t.push({v:v,l:String(v)});return t})(),
        tip:function(n){var ga=A.gates[n-1],gb=B?B.gates[n-1]:null,rows=[];
          defs.forEach(function(q){var f=GM[q[0]].f,u=GM[q[0]].u;rows.push({head:GM[q[0]].l});if(ga)rows.push({c:'var(--ca)',k:'A',v:fmt(f(ga),q[2])+(u==='m'?' m':u)});if(gb)rows.push({c:'var(--cb)',k:'B',v:fmt(f(gb),q[2])+(u==='m'?' m':u)})});
          return tipNode('Tor '+n,(ga?'A: '+TY_DE[ga.t]:'')+(gb?(ga?' · ':'')+'B: '+TY_DE[gb.t]:''),rows)}})}));
    });
    if(A.src==='G'||(B&&B.src==='G'))c1.append(el('p',{class:'note',text:'GPS-Auswertung'+(A.src==='G'&&B&&B.src!=='G'?' (Kurs A)':A.src!=='G'?' (Kurs B)':'')+T.gpsNote}));
  }));

  // zones for the selected courses
  V.append(fold('czones','Zonen','Anteil der Tore von Kurs A'+(B?' und B':'')+' pro Bereich, daneben Ø Rennen und Ø Training.',zoneToggle(),false,function(cz){
    cz.append(legendCmp(false));
    cz.append(zoneCharts(cmp.map(function(x){return {name:x.name,color:x.color,list:[x.c]}}).concat(refs),S.zoneAll));
  }));

  // plan + table
  var g2=el('div',{class:'grid2'});
  var list=B?[A,B]:[A],pl=list.filter(function(c){return c.plan&&c.fin});
  if(pl.length)g2.append(fold('plan','Kursbild',T.planSub,null,true,function(c2){
    var ext=pl.map(function(c){var xs=[0,c.fin.x].concat(c.gates.map(function(g){return g.x}));return {c:c,xmin:Math.min.apply(null,xs),xmax:Math.max.apply(null,xs),yr:Math.max(c.fin.y,Math.max.apply(null,c.gates.map(function(g){return g.y})))}});
    var yr=Math.max.apply(null,ext.map(function(e){return e.yr})),xr=Math.max.apply(null,ext.map(function(e){return e.xmax-e.xmin}));
    var plans=el('div',{class:'plans',style:'--cols:'+list.length});
    list.forEach(function(c,idx){
      var e=ext.filter(function(q){return q.c===c})[0];
      plans.append(el('div',{class:'panel'},el('div',{class:'ptitle'},el('i',{class:'gd',style:'background:'+(idx?'var(--cb)':'var(--ca)')}),(idx?'B · ':'A · ')+tag(c)),
        e?chartBox(function(box,w){var s=Math.min(640/yr,(w-70)/Math.max(xr,40));planChart(box,w,{c:e.c,scale:s,yr:yr,xmin:e.xmin,xmax:e.xmax})})
         :el('div',{class:'empty',text:'Kein Kursbild: Die GPS-Auswertung enthält keine Koordinaten und keine Seite des Richtungswechsels.'})));
    });
    c2.append(plans);
    if(pl.some(function(c){return c.recon}))c2.append(el('p',{class:'note',text:'Kursbild aus Abständen, Neigung und Winkeln rekonstruiert (Excel ohne Koordinaten). Die Lage kann einige Meter abweichen.'}));
  }));

  var TC=(S.gl==='B'&&B)?B:A,isB=TC===B&&!!B,gps=TC.src==='G';
  var pick3=B?el('div',{class:'seg',role:'group','aria-label':'Kurs für die Torliste'},
    el('button',{type:'button','aria-pressed':String(!isB),onclick:function(){set('gl','A')}},el('i',{class:'gd',style:'background:var(--ca)'}),'A · '+tag(A)),
    el('button',{type:'button','aria-pressed':String(isB),onclick:function(){set('gl','B')}},el('i',{class:'gd',style:'background:var(--cb)'}),'B · '+tag(B))):null;
  g2.append(fold('gates','Torliste Kurs '+(isB?'B':'A'),'Quelle: '+TC.file+(gps?' (GPS)':'')+' · Normalbereich Abstand '+fmt(TC.m.dlo,1)+'–'+fmt(TC.m.dhi,1)+' m (Median '+fmt(TC.m.dmed,2)+' m ±20%).',pick3,true,function(c3){
    var segs=TC.fin?TC.gates.concat([TC.fin]):TC.gates;
    var mx={d:Math.max.apply(null,segs.map(function(g){return g.d})),o:Math.max.apply(null,TC.gates.map(function(g){return g.o}))||1,p:Math.max(1,TC.m.pmax),a:Math.max.apply(null,TC.gates.map(function(g){return Math.abs(g.a)}))||1};
    var hasW=!gps&&TC.gates.some(function(g){return g.w}),hasC=!gps&&TC.gates.some(function(g){return g.cd});
    var t=el('table',{class:'tbl gl'});
    t.append(el('thead',null,el('tr',null,[['Nr','l'],['Typ','l'],['Wertung','l xs-hide'],['Abst. m'],['Offset m'],['Neig. %'],['Winkel °']].concat(hasW?[['Breite m','w-hide']]:[]).concat(hasC?[['Kombi m','w-hide']]:[]).map(function(h){return el('th',{class:h[1]||null,text:h[0]})}))));
    var tb=el('tbody'),star=false;
    function bar(v,max,col,txt){return el('td',{class:'bar',style:'--a:0%;--b:'+Math.max(0,100*v/max).toFixed(1)+'%;--c:var('+col+')',text:txt})}
    TC.gates.forEach(function(g){
      var w=50*Math.abs(g.a)/mx.a;if(g.ar||g.pi)star=true;
      var tr=el('tr',{class:g.reg?null:'nc'},el('td',{class:'l'},el('i',{class:'gd',style:'background:'+(gps?'var(--line)':g.c===1?'var(--gate-r)':'var(--gate-b)')}),String(g.n)),
        el('td',{class:'l'},el('span',{class:'pill',text:TY_DE[g.t]+(g.ti&&g.t>0?' ≈':'')})),
        el('td',{class:'l xs-hide st'+(g.reg?' ok':''),title:g.reg?'Zählt in Ø Torabstand, Ø Offset und Ø Winkel':'Nicht gewertet: '+g.why,text:g.reg?'gewertet':g.ws}),
        bar(g.d,mx.d,'--pdf-d',fmt(g.d,2)),bar(g.o,mx.o,'--pdf-o',fmt(g.o,2)),bar(g.p,mx.p,'--pdf-p',fmt(g.p,0)+(g.pi?'*':'')),
        gps?bar(g.a,mx.a,'--pdf-a',fmt(g.a,0)+(g.ar?'*':'')):el('td',{class:'bar',style:'--a:'+(g.a<0?50-w:50).toFixed(1)+'%;--b:'+(g.a<0?50:50+w).toFixed(1)+'%;--c:var(--pdf-a)',text:(g.a>0?'+':'')+fmt(g.a,0)}));
      if(hasW)tr.append(el('td',{class:'w-hide',text:g.w?fmt(g.w,2):''}));if(hasC)tr.append(el('td',{class:'w-hide',text:g.cd?fmt(g.cd,2):''}))
      tb.append(tr);
    });
    if(TC.fin){if(TC.fin.pi)star=true;tb.append(el('tr',{class:'nc'},el('td',{class:'l',text:''}),el('td',{class:'l'},el('span',{class:'pill',text:gps?'Ende':'Ziel'})),el('td',{class:'xs-hide'}),bar(TC.fin.d,mx.d,'--pdf-d',fmt(TC.fin.d,2)),el('td',{text:''}),bar(TC.fin.p,mx.p,'--pdf-p',fmt(TC.fin.p,0)+(TC.fin.pi?'*':'')),el('td',{text:''}),hasW?el('td',{class:'w-hide'}):null,hasC?el('td',{class:'w-hide'}):null))}
    t.append(tb);c3.append(el('div',{class:'tw tall grow cq',style:'flex-basis:'+Math.min(640,44+33*(segs.length))+'px'},t));
    var nt=['Gestrichelter Typ = zählt nicht in Ø Torabstand, Ø Offset und Ø Winkel.'];
    if(gps)nt.push(T.glNote);
    if(star)nt.push('* = aus Nachbarwerten bzw. Offset berechnet.');
    c3.append(el('p',{class:'note',text:nt.join(' ')}));
  }));
  if(pl.length)V.append(g2);else V.append(g2.lastChild);
}

/* ---------- Datenbank ---------- */
function dbCols(){return [['date','Datum','l'],['season','Saison','l'],['kindT','Typ','l'],['venue','Ort','l'],['what','Lauf / Teil','l'],['srcT','Quelle','l'],['setter','Setzer','l'],['n','Tore',0],['nreg','Gewertet',0],['len','Länge m',0],['vd','Höhendiff. m',0],['pitch','Ø Neig. %',1],['pmax','Max %',0],['d','Ø Abst. m',2],['dsd','SD',2],['o','Ø Offset m',2],['omax','Max',2],['a','Ø Winkel °',1],].concat(T.dbFig)}
function dbView(){var C=dbCols();return ['date','kindT','venue','what','n','len','vd','pitch','d','dsd','o','a',T.dbView,'setter'].map(function(k){return C.filter(function(c){return c[0]===k})[0]})}
function dbVal(c,k){return k==='kindT'?KIND1[c.kind]:k==='what'?(c.kind==='R'?runLab(c):c.label):k==='srcT'?(c.src==='M'?'Vermessung':'GPS'):k in c.m?c.m[k]:c[k]}
function dbText(c,col){var k=col[0],v=dbVal(c,k);
  if(k==='date')return fDate(v);if(k==='venue')return v+(c.piste?' · '+c.piste:'');if(col[2]==='l')return v||'–';return fmt(v,col[2])}
function vData(V,L){
  var DBCOLS=dbCols(),DBVIEW=dbView();
  var sorted=L.slice().sort(function(a,b){var x=dbVal(a,S.sortK),y=dbVal(b,S.sortK);return (typeof x==='string'?x.localeCompare(y,'de'):x-y)*S.sortDir||a.t-b.t||a.id-b.id});
  var ta=el('textarea',{class:'csv',hidden:true,readonly:true,'aria-label':'CSV der Auswahl',id:'csvOut'});
  var btn=el('button',{class:'btn',type:'button',text:'Tabelle als CSV kopieren',onclick:function(){
    var rows=[DBCOLS.map(function(x){return x[1]}).concat(['Datei']).join(';')].concat(sorted.map(function(x){return DBCOLS.map(function(col){return dbText(x,col)}).concat([x.file]).join(';')})),txt=rows.join('\n');
    function fb(){ta.value=txt;ta.hidden=false;ta.focus();ta.select();btn.textContent='CSV unten markiert – mit Cmd/Ctrl+C kopieren'}
    try{navigator.clipboard.writeText(txt).then(function(){btn.textContent='Kopiert ('+sorted.length+' Zeilen)'},fb)}catch(e){fb()}
  }});
  V.append(fold('db','Alle Kurssetzungen',L.length+T.dbSub,btn,true,function(c){
    var t=el('table',{class:'tbl dense'});
    t.append(el('thead',null,el('tr',null,DBVIEW.map(function(col){
      return el('th',{class:col[2]==='l'?'l':null,'aria-sort':S.sortK===col[0]?(S.sortDir>0?'ascending':'descending'):null},el('button',{type:'button',text:col[1],onclick:function(){if(S.sortK===col[0])S.sortDir=-S.sortDir;else{S.sortK=col[0];S.sortDir=col[2]==='l'?1:-1}save();render()}}))}))));
    t.append(el('tbody',null,sorted.map(function(x){return el('tr',{class:'click',onclick:function(){goCourse(x)}},DBVIEW.map(function(col,i){
      return el('td',{class:col[2]==='l'?'l':null},i===1?el('i',{class:'gd',style:'background:'+GCOL[x.kind]}):null,dbText(x,col))}))})));
    c.append(el('div',{class:'tw tall',style:'max-height:640px'},t),ta);
  }));

  V.append(fold('method','Methodik und Datenqualität',null,null,false,function(n){
    var p=el('div',{class:'prose'});
    function blk(t,items){return el('div',null,el('h3',{text:t}),el('ul',null,items.map(function(x){return el('li',{text:x})})))}
    var nR=of(COURSES,'R').length,nT=of(COURSES,'T').length,nG=sum(vals(COURSES,'n'));
    (DK==='SL'?methodSL:methodGS)(p,blk,nR,nT,nG);
    n.append(p);
  }));
}

/* ---------- method text per discipline ---------- */
function methodSL(p,blk,nR,nT,nG){
  p.append(blk('Quelle',[
    nR+' Rennläufe (Weltcup, WM, Olympia) 2023/24 bis 2025/26 und '+nT+' Trainingskurse 2024/25 und 2025/26, zusammen '+nG+' Tore.',
    'Rennen: Vermessung (PDF, Excel) mit Tortyp, Torfarbe und Kursbild. Vier Läufe 2023/24 nur als GPS-Auswertung (Gurgl 1. und 2., Madonna 2., Adelboden 2. Lauf).',
    'Training: GPS-Kurssetzungsanalyse, '+META.tshots+' Tabellen als Bild und 2 als Excel. Bilder zweifach ausgelesen und über die Geometrie der Tabelle geprüft. Gegen die Excel-Originale: 370 von 372 Werten identisch. Zusätzlich jede Zeile aller Bilder von Auge gegen die Auslesung geprüft (rund 3600 Zeilen): 42 Werte und eine fehlende Zeile korrigiert, meist von einer Achslinie verdeckte letzte Ziffern (Levi 07.11.24) und fehlende Vorzeichen.',
    'Ordner 2020/21 bis 2023/24: zum Training nur Zeitmessungen, keine Kurssetzungen.']));
  p.append(blk('Kennzahlen',[
    'Torabstand: Schrägdistanz vom vorherigen Tor.',
    'Offset: seitlicher Versatz zur Linie vom vorherigen zum nächsten Tor, in der Draufsicht.',
    'Winkel: Richtungsänderung am Tor in der Draufsicht, als Betrag.',
    'Neigung: Höhendifferenz pro Schrägdistanz.',
    'Figuren-Anteil: Tore in Bananen, Haarnadeln und Vertikalen im Verhältnis zu allen Toren.']));
  p.append(blk('Normale offene Tore',[
    'Ø Abstand, Ø Offset, Ø Winkel, Streuung, Min/Max und Verteilungen zählen nur normale offene Tore.',
    'Normal heisst: Tor offen, Tor davor und danach offen, Abstand bei allen dreien höchstens 20% vom Kurs-Median.',
    'Nicht gewertet: Figuren, die Tore direkt davor und danach, erstes und letztes Tor, Tore mit stark abweichendem Abstand samt Nachbarn. Der Grund steht in der Torliste.',
    'GPS-Kurse kennen keinen Tortyp: Figuren sind aus den kurzen Abständen abgeleitet. Test an den vermessenen Rennen: 95% der Tore gleich eingestuft, Ø Abstand, Offset und Winkel weichen im Mittel um 0.01 m, 0.02 m und 0.2° ab.']));
  p.append(blk('Training und Rennen vergleichen',[
    'GPS misst Winkel und Offset im Hang, die Vermessung in der Draufsicht. Die GPS-Werte sind auf Draufsicht umgerechnet: Ø Winkel der Trainingskurse dadurch '+sgn(META.convA,1)+'°, Ø Offset '+sgn(META.convO,2)+' m. Ohne das wirkte das Training um diesen Betrag gerader, als es ist.',
    'GPS-Neigung (Grad oder Prozent) auf Höhendifferenz pro Schrägdistanz umgerechnet.',
    'Trainingskurse sind oft Teilstrecken (Ø '+fmt(avg(of(COURSES,'T'),'n'),0)+' Tore, Rennen Ø '+fmt(avg(of(COURSES,'R'),'n'),0)+'). Zonen und Figuren stehen darum als Anteil.',
    'GPS: kein Kursbild, keine Torbreite, Winkel ohne Seite. Der letzte Abschnitt gilt als Ende.',
    'GPS-Ausreisser bereinigt: '+META.merged+' doppelt gemessene Punkte (unter 2.5 m) zusammengelegt, '+META.ang+' Winkel über 90° aus dem Offset neu berechnet, '+META.pitch+' unplausible Neigungen durch Nachbarwerte ersetzt.']));
  p.append(blk('Lücken und Sonderfälle',[
    'Nicht in den Ordnern: Schladming 2024/25, Gurgl 2024/25 2. Lauf, Aspen 2023/24 1. Lauf, Chamonix und Kranjska Gora 2023/24.',
    'Zwei Kabdalis-Trainings (08. und 09.11.25) liegen nur als abgeschnittener Web-Ausdruck vor und fehlen.',
    'Wengen 2025 1. Lauf: vollständige Fassung mit 68 Toren. Aspen 2024 2. Lauf: spätere von zwei Messungen.',
    'Datum laut Tabellenkopf (Thyon 10.12.25, Livigno 15.04.26). Hinterreit 06.03.26 und Trysil 22.03.26 laut Dateiname, der Kopf trägt dort das Datum des Vortags.',
    'Einzelne Zeilen der Trainingstabellen sind in sich nicht stimmig (Offset passt nicht zu Abstand und Winkel). Sie sind so übernommen, wie sie abgebildet sind.']));
}
function methodGS(p,blk,nR,nT,nG){
  p.append(blk('Quelle',[
    nR+' Rennläufe (Weltcup, WM, Olympia) 2024/25 und 2025/26 und '+nT+' Trainingskurse 2024/25 und 2025/26, zusammen '+nG+' Tore.',
    'Rennen: Vermessung (PDF) mit Tortyp, Torfarbe und Kursbild.',
    'Training: GPS-Kurssetzungsanalyse, '+META.tshots+' Tabellen als Bild. Zweifach ausgelesen und über die Geometrie der Tabelle geprüft (Offset aus Abstand und Winkel, Neigungsänderung). Jede der 818 Zeilen von Auge gegen das Bild geprüft: ein Wert korrigiert.',
    'Ordner 2020/21 bis 2023/24: zum Riesenslalom-Training nur Zeitmessungen, keine Kurssetzungen. Für die Rennen 2023/24 liegt keine Vermessung vor.']));
  p.append(blk('Kennzahlen',[
    'Torabstand: Schrägdistanz vom vorherigen Tor.',
    'Offset: seitlicher Versatz zur Linie vom vorherigen zum nächsten Tor, in der Draufsicht.',
    'Winkel: Richtungsänderung am Tor in der Draufsicht, als Betrag.',
    'Neigung: Höhendifferenz pro Schrägdistanz.',
    'Anteil Verzögerungen: verzögerte Tore im Verhältnis zu allen Toren.']));
  p.append(blk('Normale offene Tore',[
    'Ø Abstand, Ø Offset, Ø Winkel, Streuung, Min/Max und Verteilungen zählen nur normale offene Tore.',
    'Normal heisst: Tor offen, Tor davor und danach offen, Abstand bei allen dreien höchstens 20% vom Kurs-Median.',
    'Nicht gewertet: Verzögerungen, die Tore direkt davor und danach, erstes und letztes Tor, Tore mit stark abweichendem Abstand samt Nachbarn. Der Grund steht in der Torliste.',
    'GPS-Kurse kennen keinen Tortyp: Ein Tor gilt als Verzögerung, wenn sein Abstand unter 62% des Kurs-Medians liegt. Test an den vermessenen Rennen: alle '+META.tt+' Tore gleich eingestuft wie in der Vermessung.']));
  p.append(blk('Training und Rennen vergleichen',[
    'GPS misst Winkel und Offset im Hang, die Vermessung in der Draufsicht. Die GPS-Werte sind auf Draufsicht umgerechnet: Ø Winkel der Trainingskurse dadurch '+sgn(META.convA,1)+'°, Ø Offset '+sgn(META.convO,2)+' m. Ohne das wirkte das Training um diesen Betrag gerader, als es ist.',
    'GPS-Neigung (Grad oder Prozent) auf Höhendifferenz pro Schrägdistanz umgerechnet.',
    'Trainingskurse sind oft Teilstrecken (Ø '+fmt(avg(of(COURSES,'T'),'n'),0)+' Tore, Rennen Ø '+fmt(avg(of(COURSES,'R'),'n'),0)+'). Zonen und Verzögerungen stehen darum als Anteil.',
    'GPS: kein Kursbild, keine Torbreite, Winkel ohne Seite. Der letzte Abschnitt gilt als Ende.',
    'GPS-Ausreisser bereinigt: '+META.merged+' doppelt gemessener Punkt (unter 2.5 m) zusammengelegt, '+META.pitch+' unplausible Neigungen durch Nachbarwerte ersetzt.',
    'Zonen für den Riesenslalom um die Verteilung der Rennen gelegt (Abstand 22–30 m, Offset 2–12 m, Winkel 15–50°).']));
  p.append(blk('Lücken und Sonderfälle',[
    'Sun Valley 2025 1. Lauf lag im Slalom-Ordner und ist enthalten. Schladming 2025: laut Vermessung beide Läufe mit 35 Toren. Saalbach 2025 1. Lauf, Tor 13: Neigung in der Vermessung leer, aus den Nachbarabschnitten ergänzt.',
    'Bormio 12.02.26: Abstand der Tore 17 und 18 fehlt in der Tabelle, darum nur Tor 1 bis 16. Val d\'Isère 03.12.25: Zeile 3 fehlt, Tor 4 ohne Offset und Winkel, darum ab Tor 4. Thyon 09.12.25: Tore 18 und 19 ohne Offset, Winkel und Neigung.',
    'Datum laut Dateiname. Abweichender Tabellenkopf: Pozza 19.12.24 (Kopf 18.12.), Hinterreit 03.03.26 (Kopf 01.03.). Hinterreit 07.02.25 trägt im Kopf «SL», ist aber ein Riesenslalom (Abstände um 26 m).',
    'Zwei Bilder sind Zeitmessungen statt Kurssetzungen und fehlen (Hinterreit 06.02.25, Thyon 11.12.25).',
    'Einzelne Zeilen der Trainingstabellen sind in sich nicht stimmig (Offset passt nicht zu Abstand und Winkel). Sie sind so übernommen, wie sie abgebildet sind.']));
}

/* ---------- render ---------- */
function renderTabs(){
  var T=document.getElementById('tabs');T.replaceChildren();
  TABS.forEach(function(t){
    var b=el('button',{class:'tab',type:'button',role:'tab','aria-selected':String(S.tab===t.id),onclick:function(){S.tab=t.id;save();try{history.replaceState(null,'','#'+t.id)}catch(e){}render();window.scrollTo(0,0)}});
    b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+t.i+'</svg>';
    b.append(t.l);T.append(b);
  });
}
function renderDisc(){
  var D=document.getElementById('discSw');D.replaceChildren();
  DISCS.forEach(function(d){D.append(el('button',{type:'button','aria-pressed':String(S.disc===d),text:CFG[d].name,onclick:function(){setDisc(d)}}))});
  document.getElementById('seasonMeta').textContent=CFG[S.disc].years+' · '+COURSES.length+' Kurssetzungen';
  document.title=document.title.replace(/·.*$/,'· '+CFG[S.disc].name);
}
function render(){
  var sy=window.scrollY,V=document.getElementById('view');renderDisc();
  V.style.minHeight=V.offsetHeight+'px';   // keeps the page from jumping while the view is rebuilt
  hideTip();charts=[];renderTabs();renderFilters();
  V.replaceChildren();
  var mh=V.style.minHeight;V.style.cssText='display:flex;flex-direction:column;gap:16px';V.style.minHeight=mh;
  var L=filtered();
  if(!L.length&&S.tab!=='kurs'){V.append(el('section',{class:'card'},el('div',{class:'empty',text:'Für diese Filterkombination gibt es keine Kurssetzung. Bitte einen Filter zurücksetzen.'})));V.style.minHeight='';return}
  ({uebersicht:vOverview,saison:vSeason,kurs:vCourse,daten:vData})[S.tab](V,L);
  drawAll();
  V.style.minHeight='';
  if(Math.abs(window.scrollY-sy)>1)window.scrollTo(0,sy);
}

document.getElementById('themeBtn').addEventListener('click',function(){
  S.dark=!S.dark;save();applyTheme();
});
function applyTheme(){if(S.dark)document.documentElement.setAttribute('data-ks','dark');else document.documentElement.removeAttribute('data-ks')}
applyTheme();
window.addEventListener('hashchange',function(){var h=(location.hash||'').replace('#','');if(h!==S.tab&&TABS.some(function(t){return t.id===h})){S.tab=h;save();render()}});
window.__KS={get courses(){return COURSES},state:S,render:render,setDisc:setDisc,all:ALLC};
render();
})();
