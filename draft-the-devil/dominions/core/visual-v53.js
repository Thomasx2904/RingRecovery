'use strict';
(()=>{
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function line(c,x,y,X,Y,col,w=1){c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.strokeStyle=col;c.lineWidth=w;c.stroke();}
function ell(c,x,y,rx,ry,fill,stroke,w=1){c.beginPath();c.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function poly(c,pts,fill,stroke,w=1){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function glow(c,x,y,r,col,a=.12){c.save();c.globalAlpha*=a;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,col+'00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
function hash(i,j,k){let h=Math.imul((i|0)^Math.imul(j|0,374761393)^Math.imul(k|0,668265263),1274126177);h=(h^(h>>>13))>>>0;return ((Math.imul(h,1274126177)^(h>>>16))>>>0)/4294967296;}
function install(){
 const root=window.__DTD__,D=window.DTD;if(!root||!root.renderer||!D||root.__visual53)return false;
 root.__visual53=true;root.version='5.3.0';D.VERSION='5.3.0';
 const r=root.renderer,p=Object.getPrototypeOf(r),oldActor=p.actor,oldScenery=p.scenery,oldAtmo=p.atmosphere,oldEffect=p.effect;
 p.scenery=function(){
   const c=this.ctx,g=this.g,realm=D.realmFor(g.cycle),t=this.ambient;
   c.save();
   const haze=c.createLinearGradient(0,0,0,this.h);haze.addColorStop(0,realm.void);haze.addColorStop(.5,realm.floor+'cc');haze.addColorStop(1,realm.void);c.fillStyle=haze;c.fillRect(0,0,this.w,this.h);
   for(let layer=0;layer<3;layer++){
     c.beginPath();c.moveTo(0,this.h);const y=this.h*(.12+layer*.11),amp=18+layer*13,spd=.012+layer*.012;
     for(let x=-80;x<=this.w+80;x+=55){const u=(x+g.camera.x*spd)/125;c.lineTo(x,y+Math.sin(u+realm.seed*.1+layer)*amp+Math.sin(u*.41+layer)*amp*.45);}
     c.lineTo(this.w,this.h);c.closePath();c.fillStyle=layer===0?realm.fog+'20':layer===1?realm.rock+'1f':'#05070b42';c.fill();
   }
   c.globalCompositeOperation='screen';
   for(let i=0;i<4;i++){const x=(hash(i,7,realm.seed)*1.25-.12)*this.w+Math.sin(t*.08+i)*30;const grd=c.createLinearGradient(x,0,x+130,this.h);grd.addColorStop(0,realm.light+'52');grd.addColorStop(.55,realm.glow+'16');grd.addColorStop(1,'#00000000');c.fillStyle=grd;poly(c,[[x-50,0],[x+20,0],[x+165,this.h],[x+20,this.h]],grd);}
   c.restore();
   return oldScenery.call(this);
 };
 p.actor=function(e){
   if(e.dead)return;const g=this.g,c=this.ctx,q=this.point(e),hero=e===g.player,boss=e.boss,type=hero?'player':e.type,realm=D.realmFor(g.cycle);if(q.x<-160||q.x>this.w+160||q.y<-40||q.y>this.h+180)return;
   const ht=boss?162:hero?70:e.type==='hound'?61:(e.elite?90:74),moving=hero?Math.hypot(e.vx||0,e.vy||0)>6:e.attack==='walk',wind=e.attack==='windup'||e.attack==='followup';
   c.save();c.translate(q.x+3,q.y+5);c.scale(1,.3);glow(c,0,0,boss?58:hero?31:25,'#000107',.78);c.globalAlpha=.42;ell(c,0,0,boss?41:hero?22:18,boss?16:10,'#010206');c.restore();
   if(hero){glow(c,q.x,q.y-20,38,realm.glow,.06);ell(c,q.x,q.y+2,26,8,realm.glow+'14',realm.light+'88',1);}
   oldActor.call(this,e);
   c.save();c.lineCap='round';c.lineJoin='round';
   const accent=boss?'#f0b56f':e.elite?'#dfc47f':hero?'#dff2d2':'#9a7b61';
   c.globalCompositeOperation='screen';c.globalAlpha=hero?.72:boss?.82:e.elite?.52:.28;
   line(c,q.x-7,q.y-ht*.66,q.x+5,q.y-ht*.72,hero?'#f0ffe4':boss?'#ffd08c':'#e1b779',1.2);
   c.globalCompositeOperation='source-over';c.globalAlpha=1;
   if(boss){poly(c,[[q.x-21,q.y-145],[q.x-10,q.y-171],[q.x-3,q.y-145]],'#281318',accent,1.4);poly(c,[[q.x+21,q.y-145],[q.x+10,q.y-171],[q.x+3,q.y-145]],'#281318',accent,1.4);line(c,q.x-29,q.y-94,q.x-46,q.y-62,'#d7a15f',3);line(c,q.x+29,q.y-94,q.x+46,q.y-62,'#d7a15f',3);glow(c,q.x,q.y-86,86,'#ef4930',wind?.24:.11);}
   else if(type==='hound'){line(c,q.x-20,q.y-34,q.x-31,q.y-16,accent,3);line(c,q.x+20,q.y-34,q.x+31,q.y-16,accent,3);poly(c,[[q.x-8,q.y-54],[q.x-2,q.y-66],[q.x+3,q.y-54]],'#2d2020',accent);}
   else if(['lancer','sentinel','gaoler'].includes(type)){line(c,q.x+22,q.y-52,q.x+37,q.y-106,accent,3);poly(c,[[q.x+35,q.y-108],[q.x+40,q.y-121],[q.x+42,q.y-106]],'#dbc89d','#4c392f');}
   else if(['cantor','hexer','herald'].includes(type)){c.globalAlpha=.62;ell(c,q.x,q.y-ht*.58,22,29,null,accent,1.1);c.globalAlpha=1;}
   else if(hero){line(c,q.x+14,q.y-35,q.x+28,q.y-57,'#ddd0b1',2.6);poly(c,[[q.x+26,q.y-59],[q.x+32,q.y-65],[q.x+30,q.y-54]],'#f1f4d7','#48554d');if(moving){for(let i=0;i<3;i++){const k=(i+1)/4;line(c,q.x-(e.vx||0)*.035*k,q.y-8-(e.vy||0)*.018*k,q.x-(e.vx||0)*.065*k,q.y-8-(e.vy||0)*.035*k,'#d7ead055',1.2);}}}
   if(e.elite&&!hero){for(let i=0;i<3;i++){const a=this.ambient*1.7+i*TAU/3;ell(c,q.x+Math.cos(a)*25,q.y-ht*.52+Math.sin(a)*9,1.5,1.5,'#f5d990');}}
   c.restore();
 };
 p.effect=function(f){oldEffect.call(this,f);const c=this.ctx,q=this.point(f),t=clamp(f.t/f.life,0,1),a=1-t;if(!a)return;
   c.save();c.globalCompositeOperation='screen';c.globalAlpha=a*.8;
   if(f.kind==='hit'||f.kind==='death'){const n=f.kind==='death'?12:6,rad=f.kind==='death'?42:18;for(let i=0;i<n;i++){const ang=hash(i,Math.floor(f.x),Math.floor(f.y))*TAU,rr=rad*t*(.35+hash(i,8,4));line(c,q.x+Math.cos(ang)*rr,q.y-22+Math.sin(ang)*rr,q.x+Math.cos(ang)*(rr+7),q.y-22+Math.sin(ang)*(rr+7),f.critical?'#fff0a6':'#e9c28d',i%4===0?2:1);}if(t<.24)glow(c,q.x,q.y-24,24,f.critical?'#ffd96d':'#f1d8aa',.24*(1-t/.24));}
   if(f.kind==='swipe'){const ang=f.a||0,rr=(f.r||60)*(1+t*.1);c.translate(q.x,q.y);c.rotate(ang);c.beginPath();c.arc(0,0,rr,-.95+t*.6,.95+t*.6);c.strokeStyle='#fff2c788';c.lineWidth=1.4;c.stroke();}
   c.restore();
 };
 p.atmosphere=function(realm){oldAtmo.call(this,realm);const c=this.ctx,t=this.ambient;c.save();c.globalCompositeOperation='screen';for(let i=0;i<14;i++){const x=((hash(i,21,realm.seed)*this.w+t*(3+i%4))%(this.w+90))-45,y=hash(i,22,realm.seed)*this.h,rr=16+hash(i,23,realm.seed)*44;glow(c,x,y,rr,realm.glow,.015+hash(i,24,realm.seed)*.025);}c.restore();
   const fg=c.createLinearGradient(0,this.h*.72,0,this.h);fg.addColorStop(0,'#00000000');fg.addColorStop(1,realm.void+'52');c.fillStyle=fg;c.fillRect(0,this.h*.72,this.w,this.h*.28);
 };
 const oldResize=p.resize;p.resize=function(){oldResize.call(this);this.quality=Math.max(this.quality||1.5,1.5);};
 const mark=document.querySelector('.buildmark');if(mark)mark.textContent='5.3.0 · VISUAL OVERHAUL';
 document.documentElement.dataset.visual='5.3';
 return true;
}
let tries=0;const timer=setInterval(()=>{if(install()||++tries>300)clearInterval(timer);},50);
})();
