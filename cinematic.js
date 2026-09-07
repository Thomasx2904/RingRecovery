/* Ring Recovery 2.0. No dependencies, trackers, scroll interception or automatic submissions. */
(() => {
'use strict';
const $ = id => document.getElementById(id), root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let manualPause = false;
const paused = () => reduced.matches || manualPause;
const animations = new Set();
function animate(el, frames, options) {
  if (!el || paused() || !el.animate) return null;
  const a = el.animate(frames, options); animations.add(a);
  a.onfinish = a.oncancel = () => animations.delete(a); return a;
}
// All functional behaviour is initialised before visual enhancements.
const returnAt = Date.parse('2026-09-25T00:00:00+09:30');
function availability() {
  document.querySelectorAll('[data-away]').forEach(el => { el.hidden = Date.now() >= returnAt; });
  $('year').textContent = new Date().getFullYear();
}
availability();
window.addEventListener('pageshow', availability);
if (returnAt > Date.now() && returnAt - Date.now() < 2147483647) setTimeout(availability, returnAt - Date.now() + 1000);
const header = $('header'), menu = $('mobile-menu'), menuButton = $('menu-toggle');
const desktop = matchMedia('(min-width: 781px)');
function closeMenu(focus = false) {
  const wasOpen = !menu.hidden;
  menu.hidden = true; menuButton.setAttribute('aria-expanded','false'); $('menu-label').textContent = 'Menu';
  if (focus && wasOpen) menuButton.focus();
}
menuButton.hidden = false;
menuButton.addEventListener('click', () => {
  const opening = menu.hidden; menu.hidden = !opening;
  menuButton.setAttribute('aria-expanded',String(opening)); $('menu-label').textContent = opening ? 'Close' : 'Menu';
  if (opening) {
    animate(menu,[{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0 0)'}],{duration:470,easing:'cubic-bezier(.22,.75,.18,1)'});
    menu.querySelectorAll('a').forEach((el,i) => animate(el,[{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'none'}],{duration:520,delay:60+i*55,fill:'backwards',easing:'ease-out'}));
  }
});
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  closeMenu(); const target = document.querySelector(a.getAttribute('href'));
  const heading = target && target.querySelector('h2');
  if (heading) { heading.setAttribute('tabindex','-1'); requestAnimationFrame(() => heading.focus({preventScroll:true})); }
}));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(true); });
document.addEventListener('click', e => { if (!header.contains(e.target)) closeMenu(); });
if (desktop.addEventListener) desktop.addEventListener('change', () => { if (desktop.matches) closeMenu(); });
function headerSize() { root.style.setProperty('--header-h',header.offsetHeight+'px'); }
headerSize();
if ('ResizeObserver' in window) new ResizeObserver(headerSize).observe(header);
else window.addEventListener('resize',headerSize,{passive:true});

// A real email/SMS hand-off, with validation and a manual clipboard fallback.
const form=$('lost-form'), error=$('form-error'), result=$('enquiry-result'), messageField=$('enquiry-message'), phone=$('phone'), email=$('email');
function clearError() { error.hidden=true; phone.setCustomValidity(''); email.setCustomValidity(''); }
form.addEventListener('input', () => { clearError(); result.hidden=true; });
form.addEventListener('submit', event => {
  event.preventDefault(); clearError();
  const name=$('name').value.trim(), phoneValue=phone.value.trim(), emailValue=email.value.trim(), item=$('item').value.trim(), where=$('where').value.trim();
  $('name').value=name; $('item').value=item; $('where').value=where; phone.value=phoneValue; email.value=emailValue;
  if (!phoneValue && !emailValue) phone.setCustomValidity('Please include a phone number or email address so I can reply.');
  else if (phoneValue && phoneValue.replace(/\D/g,'').length<6) phone.setCustomValidity('Please check your phone number, or leave it blank and include your email.');
  if (!form.checkValidity()) {
    error.textContent='Please include your name, a way to reply, what you lost, and where and when. Check any highlighted fields.';
    error.hidden=false; form.reportValidity(); return;
  }
  const lines=['Hi Thomas,', '', "I'd like to enquire about a lost-item search.", '', 'Name: '+name];
  if (phoneValue) lines.push('Phone: '+phoneValue);
  if (emailValue) lines.push('Email: '+emailValue);
  lines.push('Lost item: '+item,'Where and when: '+where);
  const message=lines.join('\n'); messageField.value=message;
  $('send-email').href='mailto:thomas.scherrer1@outlook.com?subject='+encodeURIComponent('Ring Recovery enquiry — '+item)+'&body='+encodeURIComponent(message);
  const apple=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  $('send-sms').href='sms:+61431196875'+(apple?'&':'?')+'body='+encodeURIComponent(message);
  $('copy-status').textContent=''; result.hidden=false;
  $('enquiry-result-title').focus({preventScroll:true}); result.scrollIntoView({behavior:paused()?'auto':'smooth',block:'nearest'});
});
$('copy-message').addEventListener('click', async () => {
  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(messageField.value);
    $('copy-status').textContent='Copied. Paste it into your preferred email or messaging app.';
  } catch (_) {
    messageField.focus(); messageField.select();
    $('copy-status').textContent='Message selected. Use your device’s Copy command and paste it into email or text.';
  }
});
form.hidden=false;

// Smooth, reversible native <details>. Keyboard activation remains native.
const accordionStates = [];
document.querySelectorAll('.faq-list details').forEach(details => {
  const summary=details.querySelector('summary');
  const state={details,animation:null,desired:details.open}; accordionStates.push(state);
  details.addEventListener('toggle',()=>{if(!state.animation)state.desired=details.open;});
  summary.addEventListener('click', event => {
    if (paused() || !details.animate) return;
    event.preventDefault();
    const start=details.getBoundingClientRect().height;
    if (state.animation) state.animation.cancel();
    state.desired=!state.desired;
    details.open=true; details.style.height='auto';
    const end=state.desired ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height;
    const a=animate(details,[{height:start+'px'},{height:end+'px'}],{duration:440,easing:'cubic-bezier(.22,.75,.18,1)'});
    state.animation=a;
    if (a) {
      a.onfinish=() => { animations.delete(a); details.open=state.desired; details.style.height=''; state.animation=null; };
      a.oncancel=() => { animations.delete(a); state.animation=null; };
    } else details.open=state.desired;
  });
});

let renderer=null, scrollFrame=0;
function updateMotion() {
  root.classList.toggle('motion-off',paused());
  const btn=$('motion-toggle');
  btn.setAttribute('aria-pressed',String(paused())); btn.disabled=reduced.matches;
  const label=reduced.matches?'Reduced motion enabled on your device':manualPause?'Resume animations':'Pause animations';
  btn.setAttribute('aria-label',label); btn.title=label; $('motion-label').textContent=label;
  btn.querySelector('.pause-icon').textContent=paused()?'▷':'Ⅱ';
  if (paused()) {
    for (const a of Array.from(animations)) a.cancel(); animations.clear();
    accordionStates.forEach(s => { s.details.open=s.desired; s.details.style.height=''; s.animation=null; });
    document.querySelectorAll('[data-words] .word').forEach(el => {el.style.opacity='1';});
  }
  if (renderer) renderer.setPaused(paused());
  scheduleScroll();
}
$('motion-toggle').hidden=false;
$('motion-toggle').addEventListener('click', () => { manualPause=!manualPause; updateMotion(); });
if (reduced.addEventListener) reduced.addEventListener('change',updateMotion);
root.classList.add('motion-ready'); updateMotion();

// Reveal animations never depend on hiding content in stylesheets.
const revealed=new WeakSet();
function reveal(el,index=0) {
  if (revealed.has(el)) return; revealed.add(el);
  const photo=el.hasAttribute('data-photo');
  const frames=photo?[{clipPath:'inset(12% 7% 12% 7% round 80px)',opacity:.45},{clipPath:'inset(0 0 0 0 round 5px)',opacity:1}]:[{opacity:0,transform:'translateY(40px)'},{opacity:1,transform:'none'}];
  animate(el,frames,{duration:photo?1250:920,delay:Math.min(index*75,220),easing:'cubic-bezier(.22,.75,.18,1)',fill:'backwards'});
}
if ('IntersectionObserver' in window) {
  const revealObserver=new IntersectionObserver(entries => {
    let i=0; entries.forEach(e => { if(e.isIntersecting){revealObserver.unobserve(e.target);reveal(e.target,i++);} });
  },{threshold:.07,rootMargin:'0px 0px -18px 0px'});
  document.querySelectorAll('[data-reveal],[data-photo]').forEach(el=>revealObserver.observe(el));
  const offscreenObserver=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('offscreen',!e.isIntersecting)));
  [ $('hero'), $('how') ].forEach(el=>offscreenObserver.observe(el));
}
// Masked typography: a visible, unblocked first impression on desktop AND mobile.
document.querySelectorAll('.title-line>span').forEach((el,i)=>animate(el,[{transform:'translateY(112%) rotate(3deg)',opacity:.15},{transform:'none',opacity:1}],{duration:1350,delay:140+i*180,easing:'cubic-bezier(.18,.8,.2,1)',fill:'backwards'}));
animate($('ring-stage'),[{opacity:0,transform:'translateY(45px) scale(.72) rotate(-12deg)'},{opacity:1,transform:'none'}],{duration:1800,delay:130,easing:'cubic-bezier(.18,.8,.2,1)',fill:'backwards'});
// Split one editorial sentence, preserving its readable/semantic full text.
const statement=document.querySelector('[data-words]');
if (statement) {
  statement.setAttribute('aria-label',statement.textContent);
  const textNodes=[]; const walker=document.createTreeWalker(statement,NodeFilter.SHOW_TEXT);
  while(walker.nextNode())textNodes.push(walker.currentNode);
  textNodes.forEach(node=>{
    const fragment=document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(word=>{
      if(!word.trim())fragment.appendChild(document.createTextNode(word));
      else{const span=document.createElement('span');span.className='word';span.setAttribute('aria-hidden','true');span.textContent=word;fragment.appendChild(span);}
    }); node.replaceWith(fragment);
  });
}
const words=statement?Array.from(statement.querySelectorAll('.word')):[];
const navLinks=Array.from(document.querySelectorAll('.desktop-nav a'));
const navSections=navLinks.map(a=>document.querySelector(a.getAttribute('href')));
const journey=$('how'), scanner=$('scanner'), stageLabels=['NARROWING THE SEARCH','LISTENING FOR A SIGNAL','BACK WHERE IT BELONGS'];
let lastStage=-1;
const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
function paintScroll() {
  scrollFrame=0;
  const y=scrollY,vh=innerHeight;
  header.classList.toggle('scrolled',y>15);
  $('page-progress').style.transform='scaleX('+clamp(y/Math.max(1,root.scrollHeight-vh))+')';
  let current=-1;
  navSections.forEach((s,i)=>{if(s.getBoundingClientRect().top<header.offsetHeight+130)current=i;});
  navLinks.forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  const rect=journey.getBoundingClientRect();
  const pinned=getComputedStyle(journey.firstElementChild).position==='sticky';
  let p=pinned?clamp((header.offsetHeight-rect.top)/Math.max(1,rect.height-(vh-header.offsetHeight))):clamp((vh*.72-rect.top)/Math.max(1,rect.height*.7));
  if (paused()) p=1;
  if(rect.bottom>0&&rect.top<vh) {
    scanner.style.setProperty('--sweep-angle',(p*650-60)+'deg');
    scanner.style.setProperty('--beam-y',(p*scanner.offsetHeight*.56)+'px');
    scanner.style.setProperty('--target-y',(20-p*40)+'px');
    scanner.style.setProperty('--target-rot',(-28+p*40)+'deg');
    scanner.style.setProperty('--target-scale',(.6+p*.65).toFixed(3));
    scanner.style.setProperty('--target-opacity',(.16+p*.84).toFixed(3));
    const stage=p<.3?0:p<.68?1:2;
    if(stage!==lastStage){
      lastStage=stage;
      document.querySelectorAll('[data-step]').forEach((el,i)=>el.classList.toggle('is-active',i===stage));
      $('scanner-status').textContent=stageLabels[stage];
      $('scan-counter').textContent=['01 — LOCATE','02 — SEARCH','03 — RECOVER'][stage];
      animate($('scanner-status'),[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:350});
    }
  }
  if (!paused()) {
    if(statement){const r=statement.getBoundingClientRect(); if(r.bottom>0&&r.top<vh){const wp=clamp((vh*.88-r.top)/(vh*.48));words.forEach((w,i)=>{w.style.opacity=(.23+.77*clamp(wp*1.5-i/Math.max(1,words.length))).toFixed(3);});}}
    const area=$('area'),ar=area.getBoundingClientRect();
    if(ar.bottom>0&&ar.top<vh)area.querySelector('.area-image').style.transform='translateY('+clamp((vh/2-ar.top-ar.height/2)*.11,-40,40)+'px) scale('+ (1.04+.035*clamp((vh-ar.top)/(vh+ar.height))) +')';
    const heroRect=$('hero').getBoundingClientRect();
    if(heroRect.bottom>0) {
      const hp=clamp(-heroRect.top/heroRect.height);
      $('hero').querySelector('.hero-curve').style.transform='scaleY('+(1+hp*2.5)+')';
      if(renderer)renderer.scroll=hp;
    }
  }
}
function scheduleScroll(){if(!scrollFrame)scrollFrame=requestAnimationFrame(paintScroll);}
window.addEventListener('scroll',scheduleScroll,{passive:true});
window.addEventListener('resize',scheduleScroll,{passive:true});

// A small, real 3D wedding band. Procedural studio reflections; no model/library downloads.
// Software-rendered 3D fallback for browsers without WebGL. Stops when offscreen.
function createCanvasRing(canvas, stage) {
  const ctx=canvas.getContext('2d',{alpha:true}); if(!ctx)return null;
  const mesh=[],U=innerWidth<781?112:144,V=innerWidth<781?28:40,R=.86,rad=.115,wide=.23;
  function point(u,v){return [(R+rad*Math.cos(v))*Math.cos(u),(R+rad*Math.cos(v))*Math.sin(u),wide*Math.sin(v)];}
  for(let i=0;i<U;i++)for(let j=0;j<V;j++){
    const u=i/U*Math.PI*2,v=j/V*Math.PI*2,du=2*Math.PI/U,dv=2*Math.PI/V,um=u+du/2,vm=v+dv/2;
    let nx=Math.cos(vm)*Math.cos(um)/rad,ny=Math.cos(vm)*Math.sin(um)/rad,nz=Math.sin(vm)/wide,l=Math.hypot(nx,ny,nz);
    mesh.push({points:[point(u,v),point(u+du,v),point(u+du,v+dv),point(u,v+dv)],n:[nx/l,ny/l,nz/l],mid:point(um,vm)});
  }
  let frame=0,clock=0,last=0,visible=true,isPaused=paused(),px=0,py=0,sx=0,sy=0;
  const controller={scroll:0,setPaused(v){isPaused=v;stop();draw();start();}};
  const norm=a=>{const l=Math.hypot(...a);return a.map(v=>v/l);};
  const L1=norm([-.6,1,.7]),L2=norm([1,.4,.7]),L3=norm([-1,-.25,-.2]);
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  function draw(){
    const b=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);
    const W=Math.max(1,Math.round(b.width*d)),H=Math.max(1,Math.round(b.height*d));
    if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
    ctx.clearRect(0,0,W,H);
    const t=clock; sx+=(px-sx)*.08;sy+=(py-sy)*.08;
    const intro=isPaused?1:clamp(clock/1.7),ease=1-Math.pow(1-intro,3);
    const ax=.5+Math.sin(t*.36)*.23+sy*.1,ay=-.36+Math.sin(t*.24)*.5+sx*.15+controller.scroll*.8,az=-.36+Math.cos(t*.29)*.09-(1-ease)*.9;
    const cx=Math.cos(ax),snx=Math.sin(ax),cy=Math.cos(ay),sny=Math.sin(ay),cz=Math.cos(az),snz=Math.sin(az),lift=Math.sin(t*.85)*.055-(1-ease)*.27;
    function rotate(p){const x1=p[0],y1=p[1]*cx-p[2]*snx,z1=p[1]*snx+p[2]*cx;const x2=x1*cy+z1*sny,y2=y1,z2=-x1*sny+z1*cy;return [x2*cz-y2*snz,x2*snz+y2*cz,z2];}
    const faces=[];
    for(const f of mesh){
      const p=rotate(f.mid);p[1]+=lift;const n=rotate(f.n),view=norm([-p[0],-p[1],3.5-p[2]]),nv=dot(n,view);
      if(nv<=0)continue;
      const r=[-view[0]+2*nv*n[0],-view[1]+2*nv*n[1],-view[2]+2*nv*n[2]];
      const top=Math.pow(Math.max(0,dot(r,L1)),14),strip=Math.pow(Math.max(0,dot(r,L2)),46),rim=Math.pow(Math.max(0,dot(r,L3)),28),broad=clamp((r[1]+.2))*clamp((r[1]+.2))*(3-2*clamp((r[1]+.2)))*.4,seam=Math.pow(Math.max(0,Math.cos(r[0]*5+r[2]*3)),20)*.25;
      const env=[.025+.75*broad+2.6*top+2.1*strip+.95*rim+.5*seam,.03+.8*broad+2.4*top+2.25*strip+.75*rim+.65*seam,.02+.65*broad+2.05*top+2.3*strip+.45*rim+.5*seam];
      const gold=[.98,.62,.19],fr=Math.pow(1-nv,5),light=Math.max(0,dot(n,L1));
      const rgb=env.map((e,k)=>{let c=e*(gold[k]+(1-gold[k])*fr)+gold[k]*(.025+.065*light);return Math.round(Math.pow(c/(c+.62),.4545)*255);});
      const points=f.points.map(v=>{const q=rotate(v);q[1]+=lift;const depth=3.5-q[2];return [W/2+q[0]*2.18/depth*H/2,H/2-q[1]*2.18/depth*H/2];});
      faces.push({z:p[2],points,color:'rgb('+rgb.join(',')+')'});
    }
    faces.sort((a,b)=>a.z-b.z);
    for(const f of faces){ctx.beginPath();ctx.moveTo(...f.points[0]);for(let i=1;i<4;i++)ctx.lineTo(...f.points[i]);ctx.closePath();ctx.fillStyle=f.color;ctx.fill();ctx.strokeStyle=f.color;ctx.lineWidth=.65;ctx.stroke();}
  }
  function tick(now){frame=0;if(isPaused||!visible||document.hidden)return;
    if(!last||now-last>=40){const dt=last?Math.min((now-last)/1000,.1):0;last=now;clock+=dt;draw();}
    frame=requestAnimationFrame(tick);
  }
  function start(){if(!frame&&!isPaused&&visible&&!document.hidden){last=0;frame=requestAnimationFrame(tick);}}
  function stop(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;}
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else stop();},{rootMargin:'80px'}).observe(stage);
  const fine=matchMedia('(hover:hover) and (pointer:fine)');
  stage.addEventListener('pointermove',e=>{if(isPaused||!fine.matches)return;const r=stage.getBoundingClientRect();px=(e.clientX-r.left)/r.width-.5;py=(e.clientY-r.top)/r.height-.5;},{passive:true});
  stage.addEventListener('pointerleave',()=>{px=py=0;});
  window.addEventListener('resize',draw,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
  stage.classList.add('is-webgl');stage.dataset.renderer='canvas-3d';draw();start();return controller;
}

function createRing() {
  const canvas=$('ring-canvas'), stage=$('ring-stage');
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power',premultipliedAlpha:false});
  if(!gl)return createCanvasRing(canvas,stage);
  const vertex=`attribute vec3 position;attribute vec3 normal;uniform vec3 rotation;uniform float aspect;uniform float lift;varying mediump vec3 P;varying mediump vec3 N;
  mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
  mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
  mat3 rz(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
  void main(){mat3 M=rz(rotation.z)*ry(rotation.y)*rx(rotation.x);P=M*position;P.y+=lift;N=normalize(M*normal);float d=3.5-P.z;gl_Position=vec4(P.x*2.18/aspect,P.y*2.18,-P.z*.4,d);}`;
  const fragment=`precision mediump float;varying mediump vec3 P;varying mediump vec3 N;uniform float time;
  vec3 environment(vec3 r){
    float top=pow(max(0.,dot(r,normalize(vec3(-.6,1.,.7)))),14.);
    float strip=pow(max(0.,dot(r,normalize(vec3(1.,.4,.7)))),46.);
    float rim=pow(max(0.,dot(r,normalize(vec3(-1.,-.25,-.2)))),28.);
    float broad=smoothstep(-.2,.8,r.y)*.4;
    float seam=pow(max(0.,cos(r.x*5.+r.z*3.)),20.)*.25;
    return vec3(.025,.03,.02)+vec3(.75,.8,.65)*broad+vec3(2.6,2.4,2.05)*top+vec3(2.1,2.25,2.3)*strip+vec3(.95,.75,.45)*rim+vec3(.5,.65,.5)*seam;
  }
  void main(){vec3 n=normalize(N),v=normalize(vec3(0.,0.,3.5)-P);vec3 r=reflect(-v,n);
    float nv=max(dot(n,v),0.);vec3 gold=vec3(.98,.62,.19);vec3 f=gold+(vec3(1.)-gold)*pow(1.-nv,5.);
    vec3 c=environment(r)*f;float l=max(dot(n,normalize(vec3(-.7,1.,1.5))),0.);c+=gold*(.025+.065*l);
    c=c/(c+vec3(.62));c=pow(c,vec3(.4545));gl_FragColor=vec4(c,1.);}`;
  function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw Error('Ring shader compilation failed');}return s;}
  const program=gl.createProgram(),vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Ring shader linking failed');
  gl.useProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
  const vertices=[],normals=[],indices=[],U=128,V=32,R=.86,rad=.115,wide=.23;
  // Elliptical section: the wide, rounded band reads like jewellery, not a flat icon.
  for(let i=0;i<=U;i++){const u=i/U*Math.PI*2;for(let j=0;j<=V;j++){
    const v=j/V*Math.PI*2,cu=Math.cos(u),su=Math.sin(u),cv=Math.cos(v),sv=Math.sin(v);
    vertices.push((R+rad*cv)*cu,(R+rad*cv)*su,wide*sv);
    let nx=cv*cu/rad,ny=cv*su/rad,nz=sv/wide,l=Math.hypot(nx,ny,nz);normals.push(nx/l,ny/l,nz/l);
    if(i<U&&j<V){const a=i*(V+1)+j,b=a+V+1;indices.push(a,b,a+1,b,b+1,a+1);}
  }}
  function buffer(name,values){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,0,0);}
  buffer('position',vertices);buffer('normal',normals);
  const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  const rot=gl.getUniformLocation(program,'rotation'),aspect=gl.getUniformLocation(program,'aspect'),lift=gl.getUniformLocation(program,'lift');
  gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
  let frame=0,last=0,clock=0,visible=true,isPaused=paused(),lost=false,pointerX=0,pointerY=0,smoothX=0,smoothY=0,quality=1;
  const controller={scroll:0,setPaused(value){isPaused=value;stop();draw();start();}};
  function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.6)*quality;const w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);}
  function draw(){if(lost)return;resize();gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
    const t=clock;
    smoothX+=(pointerX-smoothX)*.055;smoothY+=(pointerY-smoothY)*.055;
    const intro=isPaused?1:clamp(clock/1.7),ease=1-Math.pow(1-intro,3);
    gl.uniform3f(rot,.5+Math.sin(t*.36)*.23+smoothY*.1,-.36+Math.sin(t*.24)*.5+smoothX*.15+controller.scroll*.8,-.36+Math.cos(t*.29)*.09-(1-ease)*.9);
    gl.uniform1f(lift,Math.sin(t*.85)*.055-(1-ease)*.27);gl.uniform1f(aspect,canvas.width/canvas.height);
    gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
  }
  function tick(now){frame=0;if(isPaused||!visible||document.hidden||lost)return;
    const dt=last?Math.min((now-last)/1000,.065):0;last=now;clock+=dt;draw();frame=requestAnimationFrame(tick);
  }
  function start(){if(!frame&&!isPaused&&visible&&!document.hidden&&!lost){last=0;frame=requestAnimationFrame(tick);}}
  function stop(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;}
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;stop();stage.classList.remove('is-webgl');});
  // A static CSS gold ring remains available if the GPU context is lost.
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else stop();},{rootMargin:'80px'}).observe(stage);
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  stage.addEventListener('pointermove',e=>{if(isPaused||!fine.matches)return;const r=stage.getBoundingClientRect();pointerX=(e.clientX-r.left)/r.width-.5;pointerY=(e.clientY-r.top)/r.height-.5;},{passive:true});
  stage.addEventListener('pointerleave',()=>{pointerX=pointerY=0;});
  window.addEventListener('resize',()=>{if(!lost)draw();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
  stage.classList.add('is-webgl');draw();start();return controller;
}
try { renderer=createRing(); } catch (_) { $('ring-stage').classList.remove('is-webgl'); }
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden){availability();scheduleScroll();}
  document.querySelectorAll('.water-ripples i,.waveform i').forEach(el=>{el.style.animationPlayState=document.hidden?'paused':'';});
});
scheduleScroll();
})();
