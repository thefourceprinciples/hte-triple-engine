const $=id=>document.getElementById(id);
const cv=$('cv'),ctx=cv.getContext('2d');
let defects=true,voids=true,anim=false,raf=null;
let last={hits:0,rec:0,boundary:0,closure:0,stability:0,gate:0,poa:{}};
const gates=[
 ['G0','Visual Pattern Only','Geometry only; no measurement yet. Compost / inspiration.'],
 ['G1','Carrier Response','System responds to sound, vibration, light, voltage, heat, pressure, or flow.'],
 ['G2','Boundary Dependence','Response changes with lattice geometry, fold angle, boundary shape, or constraint.'],
 ['G3','Repeatable State Reorganization','Repeated trials show the same measurable state shift.'],
 ['G4','Material Memory / Directionality','Hysteresis, memory, asymmetry, routing, or lasting state difference is measured against controls.'],
 ['G5','Hard-Evidence Investigation','Only external isotope or nuclear evidence can justify transmutation investigation.']
];
function v(id){return parseFloat($(id).value)||0}
function mat(){return $('material').value==='Custom material'?($('custom').value||'Custom material'):$('material').value}
function html(s){return String(s).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}
function pts(dOffset=0,pOffset=0){
 let R=v('R'),r=Math.max(1,v('r')),d=v('d')+dOffset,ph=(v('phase')+pOffset)*Math.PI/180,h=v('harmonic'),n=v('samples'),a=[];
 for(let i=0;i<=n;i++){let t=Math.PI*2*h*i/n+ph;a.push([(R-r)*Math.cos(t)+d*Math.cos(((R-r)/r)*t),(R-r)*Math.sin(t)-d*Math.sin(((R-r)/r)*t)])}
 return a;
}
function kg(){
 let s=v('spacing'),h=s*Math.sqrt(3)/2,verts=[],lines=[],holes=[],seen=new Map();
 function key(x,y){return Math.round(x*10)+'_'+Math.round(y*10)}
 function add(x,y){let k=key(x,y);if(!seen.has(k)){let o={x,y,hits:0};seen.set(k,o);verts.push(o)}return seen.get(k)}
 for(let j=-15;j<=15;j++)for(let i=-15;i<=15;i++){
  let x=i*s+(j%2)*s/2,y=j*h,a=add(x,y),b=add(x+s/2,y+h),d=add(x+s,y),e=add(x+s/2,y-h);
  if((i+j)%2===0)lines.push([a,b],[b,d],[d,a]);else lines.push([a,e],[e,d],[d,a]);
  if((i+j)%4===0)holes.push({x:x+s/2,y,r:s*.32});
 }
 return{verts,lines,holes};
}
function stats(p,grid){
 let max=Math.max(10,v('spacing')*.28);grid.verts.forEach(x=>x.hits=0);
 for(const q of p){let best=null,bd=1e9;for(const n of grid.verts){let dx=q[0]-n.x,dy=q[1]-n.y,dd=dx*dx+dy*dy;if(dd<bd){bd=dd;best=n}}if(best&&Math.sqrt(bd)<max)best.hits++}
 let active=grid.verts.filter(n=>n.hits>1&&Math.hypot(n.x,n.y)<405).sort((a,b)=>b.hits-a.hits).slice(0,90);
 let hits=active.reduce((a,b)=>a+b.hits,0),closure=Math.hypot(p[0][0]-p[p.length-1][0],p[0][1]-p[p.length-1][1]);
 let rec=Math.max(0,Math.min(100,Math.round((1-closure/260)*42+Math.min(58,hits/9))));
 return{active,hits,closure,rec};
}
function loops(p){let r=p.map(x=>Math.hypot(x[0],x[1])),m=r.reduce((a,b)=>a+b,0)/r.length,c=0;for(let i=1;i<r.length-1;i++)if(r[i]>r[i-1]&&r[i]>=r[i+1]&&r[i]>m*.78)c++;return Math.max(1,Math.min(99,c))}
function flips(p){let f=0,prev=0;for(let i=1;i<p.length-1;i++){let ax=p[i][0]-p[i-1][0],ay=p[i][1]-p[i-1][1],bx=p[i+1][0]-p[i][0],by=p[i+1][1]-p[i][1],cr=ax*by-ay*bx,s=Math.abs(cr)<1e-2?0:(cr>0?1:-1);if(s){if(prev&&s!==prev)f++;prev=s}}return f}
function wind(p){let t=0;for(let i=1;i<p.length;i++){let a=Math.atan2(p[i-1][1],p[i-1][0]),b=Math.atan2(p[i][1],p[i][0]),d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;t+=d}return +(t/(Math.PI*2)).toFixed(2)}
function htag(rec,b,st){if(st>78&&rec>72)return'locked return';if(b>68&&rec>55)return'boundary-held orbit';if(rec>52)return'candidate return';if(b>55)return'boundary-selected drift';return'exploratory drift'}
function draw(){
 let W=cv.width,H=cv.height,cx=W/2,cy=H/2,grid=kg(),p=pts(),fold=v('fold'),tension=v('tension');
 ctx.clearRect(0,0,W,H);ctx.save();ctx.translate(cx,cy);ctx.lineCap='round';
 ctx.strokeStyle='rgba(181,140,255,.28)';ctx.lineWidth=1.1;
 for(const [a,b] of grid.lines){let wa=Math.sin((a.x+a.y)*.006+fold*.06)*fold*.11,wb=Math.sin((b.x+b.y)*.006+fold*.06)*fold*.11;ctx.beginPath();ctx.moveTo(a.x,a.y+wa);ctx.lineTo(b.x,b.y+wb);ctx.stroke()}
 if(voids){ctx.strokeStyle='rgba(114,224,164,.2)';for(const o of grid.holes){if(Math.hypot(o.x,o.y)<390){ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,7);ctx.stroke()}}}
 ctx.strokeStyle='#79e7ff';ctx.lineWidth=2.2;ctx.shadowColor='#79e7ff';ctx.shadowBlur=10;ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();ctx.shadowBlur=0;
 let st=stats(p,grid),active=st.active;
 for(const n of active){let r=Math.min(16,3+Math.sqrt(n.hits)*1.8),g=ctx.createRadialGradient(n.x,n.y,1,n.x,n.y,r);g.addColorStop(0,'#fff');g.addColorStop(.4,'#f8c76f');g.addColorStop(1,'rgba(121,231,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(n.x,n.y,r,0,7);ctx.fill()}
 if(defects){ctx.strokeStyle='#ff7f90';ctx.lineWidth=1.7;active.filter((_,i)=>i%7===0).slice(0,12).forEach(n=>{ctx.beginPath();ctx.moveTo(n.x-9,n.y);ctx.lineTo(n.x+9,n.y);ctx.moveTo(n.x,n.y-9);ctx.lineTo(n.x,n.y+9);ctx.stroke()})}
 ctx.restore();
 let boundary=Math.max(0,Math.min(100,Math.round((active.length/90)*35+(tension/100)*28+(fold/72)*21+(voids?8:0)+(defects?8:0))));
 let l=loops(p),f=flips(p),w=wind(p),period=Math.max(1,Math.round(l/Math.max(1,Math.abs(w)||1))),sym=Math.max(1,Math.round(l/Math.max(1,period)));
 let pert=stats(pts(2,3),grid),delta=Math.abs(pert.rec-st.rec)+Math.abs(pert.hits-st.hits)/6+Math.abs(pert.closure-st.closure)/5;
 let stab=Math.max(0,Math.min(100,Math.round(100-Math.min(42,st.closure/3)-Math.min(28,delta)+st.rec*.22+boundary*.18)));
 let klass=st.closure<8&&stab>70?'true periodic':st.closure<28&&stab>46?'near-periodic':'open / drift-prone',harm=Math.round(v('harmonic'));
 let poa={orbitId:`POA-${mat().replace(/[^A-Za-z0-9]+/g,'').slice(0,8).toUpperCase()||'MAT'}-${Math.round(v('R'))}-${Math.round(v('r'))}-${Math.round(v('d'))}-H${harm}-P${Math.round(v('phase'))}`,orbitClass:klass,period,closure:+st.closure.toFixed(2),loops:l,flips:f,winding:w,symmetry:`${sym}-fold candidate`,stability:stab,perturbation:delta<8?'stable under small perturbation':delta<18?'moderately sensitive':'fragile / drift-prone',tag:`${htag(st.rec,boundary,stab)} · H${harm}`,translation:klass==='true periodic'?'Use as a primary kagome node-lock template; compare against folded-boundary controls.':klass==='near-periodic'?'Candidate routing pattern; refine spacing, fold, or phase to reduce closure error before material testing.':'Exploratory drift; do not promote beyond design inspiration until closure or material response improves.'};
 let gate=0;if(st.hits>20)gate=1;if(boundary>45&&st.rec>35)gate=2;if(boundary>62&&st.rec>58)gate=3;if(boundary>78&&st.rec>74&&tension>55)gate=4;if($('claim').value==='Nuclear evidence required')gate=5;
 last={hits:st.hits,rec:st.rec,boundary,closure:poa.closure,stability:stab,gate,poa};render();
}
function render(){let p=last.poa;$('mHits').textContent=last.hits;$('mRec').textContent=last.rec+'%';$('mBoundary').textContent=last.boundary;$('mClosure').textContent=last.closure;$('mStability').textContent=last.stability;$('mGate').textContent='G'+last.gate;$('readout').textContent=`${mat()} · ${$('carrier').value} · ${v('spacing')}u lattice · ${v('phase')}° phase`;$('oId').textContent=p.orbitId;$('oClass').textContent=p.orbitClass;$('oPeriod').textContent=p.period+' return unit'+(p.period===1?'':'s');$('oClosure').textContent=p.closure;$('oLoops').textContent=p.loops;$('oFlips').textContent=p.flips;$('oWinding').textContent=p.winding;$('oSym').textContent=p.symmetry;$('oStab').textContent=p.stability;$('oPert').textContent=p.perturbation;$('oTag').textContent=p.tag;$('oTrans').textContent=p.translation;renderGates(last.gate);renderClaim(last.gate);vals()}
function renderGates(g){let w=$('gateList');w.innerHTML='';gates.forEach((x,i)=>{let d=document.createElement('div');d.className='gatebox'+(i===g?' active':'');d.innerHTML=`<strong>${x[0]} · ${x[1]}</strong><p>${x[2]}</p>`;w.appendChild(d)})}
function renderClaim(g){let msg=g<2?'design / carrier-stage only. Do not call this transdutation yet.':g===2?'weak transdutation candidate. Measurement still decides.':g===3?'strong transdutation candidate if repeated external measurements confirm the state shift.':g===4?'confirmed macroscopic transdutation only if memory, hysteresis, routing, or lasting state difference is measured against controls.':'<span class="q">Gate 5 quarantine.</span> External isotope or nuclear evidence is required.';$('claimText').innerHTML='<b>Current reading:</b> '+msg+'<br><br><b>Selected claim ladder:</b> '+$('claim').value+'.'}
function measuredGate(){let b=parseFloat($('before').value),a=parseFloat($('after').value),c=parseFloat($('control').value),r=Math.max(0,Math.min(100,parseFloat($('repeat').value)||0));if(Number.isNaN(b)||Number.isNaN(a))return last.gate;let shift=Math.abs(a-b),ctrl=Number.isNaN(c)?0:Math.abs(c),g=1;if(shift>ctrl*1.5&&last.boundary>40)g=2;if(shift>ctrl*2&&r>=60&&last.stability>=45)g=3;if(shift>ctrl*2.5&&r>=75&&last.stability>=62&&/memory|hysteresis|lasting|direction|routing/i.test($('notes').value))g=4;if($('claim').value==='Nuclear evidence required')g=5;return g}
function entry(){return{timestamp:new Date().toISOString(),material:mat(),carrier:$('carrier').value,claimLevel:$('claim').value,spirograph:{R:v('R'),r:v('r'),d:v('d'),phase_deg:v('phase'),harmonic:v('harmonic'),samples:v('samples')},kagome:{spacing:v('spacing'),fold_deg:v('fold'),tension:v('tension'),defects,voids},metrics:last,poa:last.poa,measurement:{type:$('measure').value,before:$('before').value,after:$('after').value,control_shift:$('control').value,repeatability_percent:$('repeat').value,notes:$('notes').value}}}
function log(){try{return JSON.parse(localStorage.hte_mae_poa_log||'[]')}catch(e){return[]}}
function setLog(x){localStorage.hte_mae_poa_log=JSON.stringify(x);renderLog()}
function renderLog(){let w=$('logList'),l=log();w.innerHTML='';if(!l.length){w.innerHTML='<span class="empty">No ledger entries yet.</span>';return}l.forEach(e=>{let d=document.createElement('div');d.className='logitem';d.innerHTML=`<b>${html(e.material)} · G${e.metrics.gate}</b><small>${new Date(e.timestamp).toLocaleString()} · ${html(e.carrier)}</small><small>${html(e.poa.orbitClass)} · closure ${e.metrics.closure} · stability ${e.metrics.stability}</small><small>Hits ${e.metrics.hits}, recurrence ${e.metrics.rec}%, boundary ${e.metrics.boundary}. ${html(e.measurement.notes||'')}</small>`;w.appendChild(d)})}
function dl(name,text,type){let b=new Blob([text],{type}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),500)}
function vals(){$('vPhase').textContent=v('phase')+'°';$('vH').textContent='×'+v('harmonic');$('vSamples').textContent=v('samples');$('vSpacing').textContent=v('spacing');$('vFold').textContent=v('fold')+'°';$('vTension').textContent=v('tension')+'%';$('customWrap').style.display=$('material').value==='Custom material'?'block':'none'}
function reset(){$('R').value=118;$('r').value=47;$('d').value=82;$('phase').value=22;$('harmonic').value=5;$('samples').value=900;$('spacing').value=52;$('fold').value=18;$('tension').value=62;defects=voids=true;$('defects').textContent='Defects: on';$('voids').textContent='Void routes: on';draw()}
document.querySelectorAll('input,select,textarea').forEach(e=>e.addEventListener('input',draw));
$('redraw').onclick=draw;
$('reset').onclick=reset;
$('animate').onclick=()=>{anim=!anim;$('animate').textContent=anim?'Stop phase':'Animate phase';function loop(){if(!anim)return;$('phase').value=(v('phase')+1)%360;draw();raf=requestAnimationFrame(loop)}if(anim)loop();else cancelAnimationFrame(raf)};
$('defects').onclick=()=>{defects=!defects;$('defects').textContent='Defects: '+(defects?'on':'off');$('defects').classList.toggle('primary',defects);draw()};
$('voids').onclick=()=>{voids=!voids;$('voids').textContent='Void routes: '+(voids?'on':'off');$('voids').classList.toggle('primary',voids);draw()};
$('classify').onclick=()=>{last.gate=measuredGate();render()};
$('addLog').onclick=()=>{last.gate=measuredGate();let l=log();l.unshift(entry());setLog(l.slice(0,80));render()};
$('exportJson').onclick=()=>dl('hte_mae_poa_ledger.json',JSON.stringify(log(),null,2),'application/json');
$('exportMd').onclick=()=>{let md='# HTE / MAE Transdutation POA Ledger\n\n';log().forEach((e,i)=>{md+=`## ${i+1}. ${e.material} · G${e.metrics.gate}\n- Orbit ID: ${e.poa.orbitId}\n- Orbit class: ${e.poa.orbitClass}\n- Closure: ${e.poa.closure}\n- Stability: ${e.poa.stability}\n- Carrier: ${e.carrier}\n- Notes: ${e.measurement.notes||''}\n\n`});dl('hte_mae_poa_ledger.md',md,'text/markdown')};
$('clearLog').onclick=()=>{if(confirm('Clear local ledger?'))setLog([])};
let dragging=false,lx=0;
cv.addEventListener('pointerdown',e=>{dragging=true;lx=e.clientX;cv.setPointerCapture(e.pointerId)});
cv.addEventListener('pointermove',e=>{if(!dragging)return;let dx=e.clientX-lx;lx=e.clientX;$('phase').value=(v('phase')+dx+360)%360;draw()});
cv.addEventListener('pointerup',()=>dragging=false);
cv.addEventListener('pointercancel',()=>dragging=false);
draw();renderLog();
