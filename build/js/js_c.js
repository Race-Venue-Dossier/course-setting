
/* zones per discipline (SL: as in the coach's sheet; GS: set around the race distribution). Shares instead of counts: training courses are often shorter */
function zoneLabels(e){var L=['<'+e[0]];for(var i=0;i<e.length-1;i++)L.push(e[i]+'–'+e[i+1]);L.push('>'+e[e.length-1]);return L}
function zoneCounts(c,key,all){
  var e=ZONES[key],n=[];for(var i=0;i<=e.length;i++)n.push(0);
  c.gates.forEach(function(g){if(!all&&!g.reg)return;var v=GM[key].f(g),k=0;while(k<e.length&&v>=e[k])k++;n[k]++});
  return n;
}
function zoneStat(list,key,all){
  if(!list.length)return null;
  var nb=ZONES[key].length+1,pct=[],cnt=[],i;for(i=0;i<nb;i++){pct.push(0);cnt.push(0)}
  list.forEach(function(c){var z=zoneCounts(c,key,all),tot=sum(z)||1;z.forEach(function(v,j){pct[j]+=100*v/tot;cnt[j]+=v})});
  return {pct:pct.map(function(v){return v/list.length}),cnt:cnt.map(function(v){return v/list.length})};
}
/*@OLD 586-621@*/
/* three zone charts (Abstand, Winkel, Offset) */
function zoneCharts(series,all){
  var Z=el('div',{class:'zones'});
  [['d','Abstand-Zonen','m'],['a','Winkel-Zonen','°'],['o','Offset-Zonen','m']].forEach(function(q){
    var labs=zoneLabels(ZONES[q[0]]);
    var ser=series.map(function(s){var st=zoneStat(s.list,q[0],all);return {name:s.name,color:s.color,one:s.list.length===1,vals:st?st.pct:labs.map(function(){return null}),cnt:st?st.cnt:null}});
    Z.append(el('div',{class:'panel'},el('div',{class:'ptitle',text:q[1]+' ['+q[2]+']'}),chartBox(function(box,w){
      groupBars(box,w,{cats:labs,series:ser,yLabel:'Anteil %',tip:function(i){
        return tipNode(GM[q[0]].l+' '+labs[i]+(q[2]==='m'?' m':'°'),all?'Anteil an allen Toren des Kurses':'Anteil an den normalen offenen Toren',
          ser.filter(function(x){return x.vals[i]!=null}).map(function(x){return {c:x.color,k:x.name,v:fmt(x.vals[i],0)+' %  ('+(x.one?String(x.cnt[i]):'Ø '+fmt(x.cnt[i],1))+' Tore)'}}))}});
    })));
  });
  return Z;
}
function zoneToggle(){
  return el('div',{class:'seg',role:'group','aria-label':'Welche Tore zählen'},
    el('button',{type:'button','aria-pressed':String(!!S.zoneAll),text:'Alle Tore',onclick:function(){set('zoneAll',true)}}),
    el('button',{type:'button','aria-pressed':String(!S.zoneAll),text:'Nur normale offene Tore',onclick:function(){set('zoneAll',false)}}));
}

/* one-line scale: band = range of the races, ticks = averages, dot/ring = the selected courses */
function stripChart(box,w,o){
  var h=28,svg=frame(box,w,h),vs=[o.lo,o.hi].concat(o.marks.map(function(m){return m.v}));
  var xd=pad(Math.min.apply(null,vs),Math.max.apply(null,vs),.07),X=lin(xd[0],xd[1],10,w-10),cy=h/2;
  sv('line',{x1:2,x2:w-2,y1:cy,y2:cy,stroke:'var(--grid)','stroke-width':1},svg);
  sv('rect',{x:X(o.lo),y:cy-8,width:Math.max(1,X(o.hi)-X(o.lo)),height:16,rx:3,fill:'var(--band)'},svg);
  o.marks.forEach(function(m){if(m.kind==='tick')sv('line',{x1:X(m.v),x2:X(m.v),y1:cy-11,y2:cy+11,stroke:m.color,'stroke-width':3,'stroke-linecap':'round'},svg)});
  o.marks.forEach(function(m){if(m.kind==='dot')sv('circle',{cx:X(m.v),cy:cy,r:6,fill:m.color,stroke:'var(--halo)','stroke-width':1.5},svg)});
  o.marks.forEach(function(m){if(m.kind==='ring')sv('circle',{cx:X(m.v),cy:cy,r:5,fill:'var(--halo)',stroke:m.color,'stroke-width':2.6},svg)});
  var hit=sv('rect',{x:0,y:0,width:w,height:h,fill:'transparent'},svg);
  function move(ev){showTip(ev,o.tip())}
  hit.addEventListener('pointermove',move);hit.addEventListener('pointerdown',move);hit.addEventListener('pointerleave',hideTip);
}

/* one row per group: dot = mean, line = range, vertical reference with band */
function rangeRows(box,w,o){
  var R=o.rows,rh=23,lw=Math.min(150,Math.max(112,w*.28)),vw=46,m={t:24,b:34},h=m.t+R.length*rh+m.b,svg=frame(box,w,h);
  if(!R.length){svg.remove();box.append(el('div',{class:'empty',text:'Keine Trainingskurse in dieser Auswahl.'}));return}
  var vs=[];R.forEach(function(r){vs.push(r.v,r.lo,r.hi)});
  if(o.ref){vs.push(o.ref.v);if(o.ref.lo!=null)vs.push(o.ref.lo,o.ref.hi)}
  var xd=pad(Math.min.apply(null,vs),Math.max.apply(null,vs),.08),x0=lw,x1=w-vw,y0=m.t+R.length*rh;
  var xt=ticks(xd[0],xd[1],Math.max(2,Math.floor((x1-x0)/80))),X=lin(xd[0],xd[1],x0,x1);
  xt.forEach(function(t){sv('line',{x1:X(t),x2:X(t),y1:m.t,y2:y0,stroke:'var(--grid2)','stroke-width':1},svg);sv('text',{x:X(t),y:y0+15,'text-anchor':'middle'},svg,t.toFixed(tickDec(xt)))});
  sv('text',{x:(x0+x1)/2,y:h-4,'text-anchor':'middle',class:'axt'},svg,o.xLabel);
  sv('text',{x:w,y:11,'text-anchor':'end',class:'axt'},svg,'Ø');
  if(o.ref){
    if(o.ref.lo!=null)sv('rect',{x:X(o.ref.lo),y:m.t,width:Math.max(1,X(o.ref.hi)-X(o.ref.lo)),height:y0-m.t,fill:o.ref.soft},svg);
    sv('line',{x1:X(o.ref.v),x2:X(o.ref.v),y1:m.t-4,y2:y0,stroke:o.ref.color,'stroke-width':1.8},svg);
    var right=X(o.ref.v)<x0+(x1-x0)*.6;
    sv('text',{x:X(o.ref.v)+(right?5:-5),y:m.t-9,'text-anchor':right?'start':'end',class:'lbl'},svg,o.ref.label+' '+fmt(o.ref.v,o.dec));
  }
  R.forEach(function(r,i){
    var cy=m.t+i*rh+rh/2,g=sv('g',{style:'cursor:pointer',tabindex:0,role:'button','aria-label':r.label},svg);
    var bg=sv('rect',{x:0,y:cy-rh/2,width:w,height:rh,fill:'transparent'},g);
    sv('circle',{cx:5,cy:cy,r:3.5,fill:r.color},g);
    sv('text',{x:14,y:cy+4,class:'rowl'},g,r.label);
    if(r.hi>r.lo)sv('line',{x1:X(r.lo),x2:X(r.hi),y1:cy,y2:cy,stroke:r.color,'stroke-width':2,'stroke-opacity':.4,'stroke-linecap':'round'},g);
    sv('circle',{cx:X(r.v),cy:cy,r:5,fill:r.color,stroke:'var(--halo)','stroke-width':2},g);
    sv('text',{x:w,y:cy+4,'text-anchor':'end',class:'val'},g,fmt(r.v,o.dec));
    function on(ev){bg.setAttribute('fill','var(--surface-2)');if(ev.clientX!=null)showTip(ev,o.tip(r))}
    g.addEventListener('pointermove',on);g.addEventListener('pointerdown',on);
    g.addEventListener('pointerleave',function(){bg.setAttribute('fill','transparent');hideTip()});
    g.addEventListener('focus',function(){bg.setAttribute('fill','var(--surface-2)')});g.addEventListener('blur',function(){bg.setAttribute('fill','transparent')});
    g.addEventListener('click',function(){o.onClick(r)});
    g.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();o.onClick(r)}});
  });
}

/*@OLD 642-667@*/
function gateTip(c,g){
  var rows=[{k:'Abstand',v:fmt(g.d,2)+' m'},{k:'Offset',v:fmt(g.o,2)+' m'},{k:'Neigung',v:fmt(g.p,0)+'%'},{k:'Winkel',v:(g.a>0?'+':'')+fmt(g.a,0)+'°'}];
  if(g.w)rows.push({k:'Torbreite',v:fmt(g.w,2)+' m'});
  if(g.cd)rows.push({k:'Kombi-Abstand',v:fmt(g.cd,2)+' m'});
  return tipNode('Tor '+g.n+' · '+TY_DE[g.t]+(g.c===1?' · rot':' · blau'),cName(c),rows);
}

/* ---------- UI pieces ---------- */
/*@OLD 676-691@*/
function legendGen(gs,extra){
  var L=el('div',{class:'legend'});
  gs.forEach(function(g){L.append(el('span',null,el('i',{class:'ln',style:'background:'+GCOL[g]}),KIND[g]))});
  (extra||[]).forEach(function(x){L.append(x)});
  return L;
}
function runKeys(){return [el('i',{class:'sep'}),el('span',{class:'lt'},el('i',{class:'dot',style:'background:var(--ink-2)'}),'1. Lauf / Training'),el('span',{class:'lt'},el('i',{class:'ring'}),'2. Lauf')]}
/*@OLD 704-711@*/
/* collapsible card: secondary analyses start folded so the page reads at a glance */
function fold(id,title,subt,ctl,defOpen,build){
  var open=(id in S.open)?!!S.open[id]:defOpen;
  var c=el('section',{class:'card fold'+(open?'':' shut')});
  var b=el('button',{class:'fold-b',type:'button','aria-expanded':String(open),onclick:function(){S.open[id]=!open;save();render()}});
  b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  b.append(el('h2',{text:title}));
  c.append(el('div',{class:'ch'},el('div',null,b,open&&subt?el('p',{text:subt}):null),open&&ctl?el('div',{class:'ctl'},ctl):null));
  if(open)build(c);
  return c;
}
function goCourse(c,b){S.a=c.id;S.b=b==null?'auto':b;S.gl='A';S.tab='kurs';save();render();window.scrollTo(0,0)}

/* ---------- filters ---------- */
function renderFilters(){
  var F=document.getElementById('filters');F.replaceChildren();
  F.append(seg('Typ','kind',[['ALL','Alle'],['R','Rennen'],['T','Training']]));
  F.append(seg('Saison','season',[['ALL','Alle']].concat(SEASONS.map(function(s){return [s,s]}))));
  function vlist(k){return Array.from(new Set(COURSES.filter(function(c){return c.kind===k}).map(function(c){return c.venue}))).sort(function(a,b){return a.localeCompare(b,'de')}).map(function(v){return [v,v]})}
  var nv=new Set(COURSES.map(function(c){return c.venue})).size;
  var both=vlist('R').filter(function(v){return vlist('T').some(function(x){return x[0]===v[0]})});
  F.append(el('div',{class:'fg grow'},el('label',{for:'fVenue',text:'Ort'}),select('fVenue','venue',[['ALL','Alle Orte ('+nv+')'],{group:'Rennorte',items:vlist('R')},{group:'Trainingsorte',items:vlist('T').filter(function(v){return !both.some(function(x){return x[0]===v[0]})})}])));
  var L=filtered();
  if(S.kind!=='ALL'||S.season!=='ALL'||S.venue!=='ALL')F.append(el('button',{class:'btn reset',type:'button',text:'Filter zurücksetzen',onclick:function(){S.kind=S.season=S.venue='ALL';save();render()}}));
  F.append(el('div',{class:'count'},el('b',{text:String(L.length)}),' Kurssetzungen · '+of(L,'R').length+' Rennläufe · '+of(L,'T').length+' Trainings'));
}
