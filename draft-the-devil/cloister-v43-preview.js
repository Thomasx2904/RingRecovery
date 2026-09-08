'use strict';
/* Gilded Nocturne 4.3 preview. Preserves the tested 4.1 covenant/relic rules. */
(function(D){
const TAU=Math.PI*2,dist=D.distance,clamp=D.clamp;
D.VERSION='4.3.0';
const newcomers={
 skulk:{name:'Vesper Skulk',hp:22,r:11,speed:138,damage:8,windup:.42,recovery:1.05,ranged:false,unlock:2,color:'#78b8be'},
 lancer:{name:'Pale Lancer',hp:42,r:14,speed:88,damage:11,windup:.58,recovery:1.3,ranged:false,unlock:4,color:'#bbc0d4'},
 censer:{name:'Censer Bearer',hp:54,r:16,speed:82,damage:10,windup:.65,recovery:1.5,ranged:false,unlock:6,color:'#a1b97c'},
 idol:{name:'Hollow Idol',hp:118,r:24,speed:49,damage:19,windup:.9,recovery:1.8,ranged:false,unlock:8,color:'#c2ac7d'},
 gaoler:{name:'Chain Gaoler',hp:66,r:18,speed:76,damage:12,windup:.75,recovery:1.55,ranged:false,unlock:11,color:'#c2a0ce'},
 reaver:{name:'Twin Reaver',hp:58,r:15,speed:96,damage:10,windup:.52,recovery:1.45,ranged:false,unlock:13,color:'#d5a09a'},
 torturer:{name:'Briar Torturer',hp:72,r:17,speed:84,damage:13,windup:.65,recovery:1.4,ranged:false,unlock:15,color:'#cea58c'},
 hexer:{name:'Moon Hexer',hp:38,r:14,speed:66,damage:9,windup:.9,recovery:3.5,ranged:true,unlock:7,color:'#a5b2ef'},
 shrike:{name:'Ashen Shrike',hp:34,r:12,speed:90,damage:8,windup:.8,recovery:3.0,ranged:true,unlock:12,color:'#d7bdcb'},
 sentinel:{name:'Reliquary Sentinel',hp:92,r:19,speed:56,damage:13,windup:.95,recovery:3.8,ranged:true,unlock:17,color:'#9cbcc2'}
};
Object.assign(D.ENEMIES,newcomers);
D.PREVIEW_ENEMIES=newcomers;
const G=D.Game.prototype,spawnOld=G.spawn,updateOld=G.updateEnemies,damageOld=G.damage;
G.spawn=function(){
 const e=spawnOld.call(this),role=D.ENEMIES[e.type].ranged,n=(this.cycle-1)*10+this.wave;
 const pool=Object.keys(D.ENEMIES).filter(k=>D.ENEMIES[k].ranged===role&&(D.ENEMIES[k].unlock||1)<=n);
 const type=pool[Math.floor(this.rand()*pool.length)],def=D.ENEMIES[type];
 if(type!==e.type){const original=D.ENEMIES[e.type];e.hp*=def.hp/original.hp;e.maxHp=e.hp;e.speed*=def.speed/original.speed;e.damage*=def.damage/original.damage;e.r=def.r;e.type=type;}
 return e;
};
G.damage=function(e,value,meta){return damageOld.call(this,e,value*(e&&!e.boss&&e.ward>0?.65:1),meta);};
function slash(g,e,angle,reach,damage){
 const p=g.player,a=Math.atan2(p.y-e.y,p.x-e.x),da=Math.atan2(Math.sin(a-angle),Math.cos(a-angle));
 const hit=dist(e,p)<reach+p.r&&Math.abs(da)<1.1;
 g.fx('swipe',e.x,e.y,{a:angle,r:reach,life:.32,color:'#efba84'});
 g.count('enemyAttack:'+e.type);
 return hit&&g.hurt(damage,e);
}
function meleeReach(e){return e.r+({lancer:64,gaoler:62,idol:48,reaver:37,torturer:36,censer:30,skulk:28}[e.type]||30);}
G.updateEnemies=function(dt){
 if(this.paused)return;
 /* Existing and new enemies remain in the same collection for relic chains. */
 for(const e of this.enemies){
  if(e.dead)continue;
  this.tickStatus(e,dt);if(e.dead||this.paused)continue;
  e.silence=Math.max(0,(e.silence||0)-dt);e.ward=Math.max(0,(e.ward||0)-dt);
  if(this.hasStatus(e,'freeze'))continue;
  const p=this.player,def=D.ENEMIES[e.type],special=!!newcomers[e.type];
  const a=Math.atan2(p.y-e.y,p.x-e.x),d=dist(e,p),speed=e.speed*(1-(e.status.chill?.left>0?e.status.chill.power:0));
  e.face=a;e.visible=this.visible(e)?e.visible+dt:0;e.clock-=dt;
  if(e.attack==='windup'){
   if(e.clock>0)continue;
   if(def.ranged){
    if(this.visible(e)&&e.visible>.5&&!e.silence){
     if(e.type==='hexer'){
      const kind=['ice','gravity','infection'][Math.floor(this.rand()*3)];
      this.zone(kind,{x:p.x+p.vx*.15,y:p.y+p.vy*.15},52,e.damage*.65,2.8,{enemy:true,warning:.95,source:e});
      this.count('enemyAttack:hexer');
     }else{
      const count=e.type==='herald'?3:e.type==='moth'?2:e.type==='shrike'?5:e.type==='sentinel'?2:1;
      const spread=e.type==='shrike'?.24:e.type==='sentinel'?.09:.18;
      for(let i=0;i<count;i++)this.enemyShot(e,e.aim+(i-(count-1)/2)*spread,e.damage*(e.type==='shrike'?.8:1),e.type==='sentinel'?265:e.type==='wisp'?220:195);
      if(e.type==='sentinel'){e.ward=1.2;this.fx('ward',e.x,e.y,{life:1.2});}
      this.count('enemyAttack:'+e.type);
     }
    }
   }else{
    const hit=slash(this,e,e.aim,e.reach,e.damage);
    if(e.type==='censer')this.zone('infection',{x:e.x+Math.cos(e.aim)*32,y:e.y+Math.sin(e.aim)*32},52,e.damage*.45,2.4,{enemy:true,warning:.75,source:e});
    if(e.type==='idol')this.zone('stone',{x:e.x,y:e.y},82,e.damage*.65,1.3,{enemy:true,warning:.85,source:e});
    if(e.type==='gaoler'&&hit){const pull=Math.min(34,Math.max(0,dist(e,p)-38));p.x-=Math.cos(a)*pull;p.y-=Math.sin(a)*pull;this.fx('hook',e.x,e.y,{x2:p.x,y2:p.y,life:.35});}
    if(e.type==='torturer'&&hit)p.slow=Math.max(p.slow||0,.9);
    if(e.type==='reaver'&&!e.dead){e.attack='followup';e.clock=.58;e.aim=a+.28;continue;}
    if(e.type==='skulk'){e.x-=Math.cos(e.aim)*27;e.y-=Math.sin(e.aim)*27;}
   }
   e.attack='recover';e.clock=def.recovery;continue;
  }
  if(e.attack==='followup'){
   if(e.clock<=0){slash(this,e,e.aim,e.reach+10,e.damage*.7);e.attack='recover';e.clock=def.recovery;}
   continue;
  }
  if(e.attack==='recover'){if(e.clock<=0)e.attack='walk';continue;}
  if(def.ranged){
   const ideal=Math.min(e.type==='sentinel'?245:e.type==='shrike'?165:210,this.view.h*.37),dir=d>ideal?1:d<ideal*.7?-1:0;
   e.x+=Math.cos(a)*speed*dir*dt;e.y+=Math.sin(a)*speed*dir*dt;
   if(e.type==='shrike'&&dir===0){e.x+=Math.cos(a+Math.PI/2)*speed*.3*dt;e.y+=Math.sin(a+Math.PI/2)*speed*.3*dt;}
   if(e.clock<=0&&e.visible>.7&&d<370&&!e.silence){e.attack='windup';e.clock=def.windup||.65;e.aim=a;}
  }else{
   const reach=special?meleeReach(e):e.r+(e.type==='brute'?40:e.type==='bell'?38:24);
   if(d<reach+8&&e.clock<=0){e.attack='windup';e.clock=def.windup;e.aim=a;e.reach=reach;}
   else if(d>e.r+p.r){const sidestep=e.type==='skulk'?.25*Math.sin(this.time*3+e.id):0;e.x+=Math.cos(a+sidestep)*speed*dt;e.y+=Math.sin(a+sidestep)*speed*dt;}
  }
 }
 this.enemies=this.enemies.filter(e=>!e.dead&&dist(e,this.player)<1600);
};
const Render=D.Renderer;
function poly(c,pts,fill,stroke='#101b23',w=1.3){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function line(c,x,y,x2,y2,col,w=1){c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=col;c.lineWidth=w;c.stroke();}
function oval(c,x,y,rx,ry,fill,stroke){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
class NocturneRenderer extends Render{
 sprite(type,frame=0,action=false){
  if(!newcomers[type])return super.sprite(type,frame,action);
  const key='nocturne:'+type+':'+frame+':'+action;if(this.sprites.has(key))return this.sprites.get(key);
  const cn=document.createElement('canvas');cn.width=192;cn.height=240;const c=cn.getContext('2d');c.scale(2.4,2.4);c.translate(40,77);c.lineJoin='round';c.lineCap='round';
  const b=Math.sin(frame*TAU/6),col=newcomers[type].color,large=type==='idol'||type==='sentinel';
  if(type==='skulk'){c.translate(0,8);c.scale(1.1,.82);}if(large)c.scale(1.15,1.1);
  for(const k of [-1,1]){const step=Math.sin(frame*TAU/6+(k>0?Math.PI:0))*2.5;poly(c,[[k*3,-16],[k*9,-15],[k*10,step],[k*3,step+2]],'#313b40');line(c,k*2,step+1,k*12,step+1,col,1.3);}
  const cloth=c.createLinearGradient(-15,-30,17,-8);cloth.addColorStop(0,col);cloth.addColorStop(.22,'#4c5556');cloth.addColorStop(1,'#17212b');
  poly(c,[[-8,-40],[-17,-28],[-15,-10],[-20+b*2,1],[-8,-3],[0,2],[8,-2],[17,1],[12,-20],[15,-32],[7,-40]],cloth,col,1);
  for(const x of [-8,-2,5])line(c,x,-27,x+b,-5,col+'77',.8);
  poly(c,[[-9,-34],[0,-40],[10,-34],[8,-21],[0,-17],[-8,-22]],large?'#778079':'#3d494a',col);
  line(c,-10,-16,11,-16,'#aa9066',3);oval(c,0,-16,2,2,'#ebce99');
  for(const k of [-1,1]){oval(c,k*13,-29,large?7:5,5,'#465255',col);line(c,k*14,-25,k*16,-12,'#626965',4);oval(c,k*16,-11,3,3,'#aca48b');}
  if(type==='idol'){
   poly(c,[[-14,-38],[-14,-58],[0,-64],[14,-58],[14,-38],[7,-32],[-7,-32]],'#817864',col,1.5);
   for(const x of [-7,0,7])line(c,x,-57,x,-37,'#242e31',1.2);oval(c,0,-45,3,3,'#efc580');
   poly(c,[[16,-22],[29,-24],[33,-8],[19,-5]],'#757263',col);line(c,23,-24,23,-5,'#303b3d',1);
  }else{
   poly(c,[[-11,-33],[-11,-46],[0,-55],[11,-46],[11,-33],[0,-30]],type==='hexer'?'#303952':'#26343d',col,1.2);
   poly(c,[[-7,-45],[0,-49],[7,-45],[5,-36],[0,-31],[-5,-36]],'#c7c5ac');
   line(c,-5,-42,-1,-40,'#16212a',2);line(c,1,-40,5,-42,'#16212a',2);
   if(type==='hexer'){oval(c,0,-60,8,8,null,col);oval(c,0,-60,3,3,col);}
   if(type==='gaoler')for(const x of [-6,0,6])line(c,x,-46,x,-33,'#25313b',1);
   if(type==='sentinel')poly(c,[[-10,-47],[-8,-56],[8,-56],[10,-47]],'#7b9298',col);
   if(type==='shrike')for(const k of [-1,1])for(let j=0;j<4;j++)poly(c,[[k*9,-31+j*4],[k*(27-j*2),-43+j*9],[k*15,-22+j*4]],'#635c69',col,.7);
  }
  c.save();c.translate(16,-13);c.rotate(action?-.9:b*.12);
  if(type==='lancer'){line(c,0,10,0,-47,'#8c7c63',2.4);poly(c,[[0,-61],[-4,-45],[0,-38],[4,-45]],'#e7e3cb',col);}
  else if(type==='censer'){for(let j=0;j<7;j++)oval(c,3+j*.6,-6-j*3,1.5,2,null,col);oval(c,8,-33,8,10,'#667349',col);for(const x of [4,8,12])line(c,x,-39,x,-27,'#b5c88a',1);oval(c,8,-33,3,4,'#dceaaa');}
  else if(type==='gaoler'){for(let j=0;j<9;j++)oval(c,j*2-1,j*.8-3,2.5,1.4,null,col);c.beginPath();c.arc(21,4,6,-1.6,2.2);c.strokeStyle=col;c.lineWidth=2;c.stroke();}
  else if(type==='torturer'){line(c,0,6,0,-30,'#9f927a',2);for(let i=0;i<5;i++)poly(c,[[0,-28+i*5],[7,-27+i*5],[1,-23+i*5]],col);}
  else if(type==='hexer'){line(c,0,9,0,-37,'#9b977b',2);oval(c,0,-43,8,10,null,col);oval(c,0,-43,3,4,col);}
  else if(type==='sentinel'){poly(c,[[-5,-22],[10,-28],[16,-18],[10,-4],[-5,-7]],'#5a757b',col);oval(c,9,-17,4,4,'#d6ede0');line(c,2,-28,10,-40,col,2);}
  else{poly(c,[[-2,-6],[0,-33],[6,-25],[3,-4]],'#d1c4a7',col);line(c,-5,-3,7,-3,'#aa8d5f',2);}
  c.restore();
  if(type==='reaver'){line(c,-16,-11,-27,-31,col,3);poly(c,[[-27,-31],[-31,-37],[-27,-46],[-24,-30]],'#d9beb1',col);}
  this.sprites.set(key,cn);return cn;
 }
 actor(e){
  super.actor(e);if(e===this.g.player)return;
  const p=this.point(e),c=this.ctx,def=newcomers[e.type];if(p.x<-80||p.x>this.w+80||p.y<-50||p.y>this.h+100)return;
  c.save();
  if(!e.elite&&!e.boss&&e.hp<e.maxHp){c.fillStyle='#07121bd9';c.fillRect(p.x-14,p.y-56,28,3);c.fillStyle=def?.color||'#91b2aa';c.fillRect(p.x-14,p.y-56,28*clamp(e.hp/e.maxHp,0,1),3);}
  if(def){c.translate(p.x,p.y-69);const index=Object.keys(newcomers).indexOf(e.type);oval(c,0,0,6,6,'#0b1723dd',def.color);for(let i=0;i<2+index%4;i++){const a=i*TAU/(2+index%4);line(c,0,0,Math.cos(a)*4,Math.sin(a)*4,def.color,1);}}
  c.restore();
  if(e.ward>0&&!e.boss){c.save();oval(c,p.x,p.y-24,23,30,null,'#c7d9eb');c.restore();}
  if(e.attack==='followup'){c.save();c.translate(p.x,p.y);c.beginPath();c.moveTo(0,0);c.arc(0,0,e.reach+10,e.aim-1.1,e.aim+1.1);c.closePath();c.fillStyle='#f0a58122';c.fill();c.strokeStyle='#f4b37a';c.lineWidth=1.5;c.stroke();c.restore();}
 }
 effect(f){
  if(f.kind==='hook'){const p=this.point(f),q=this.point({x:f.x2,y:f.y2}),c=this.ctx;c.save();c.globalAlpha=Math.max(0,1-f.t/f.life);line(c,p.x,p.y-12,q.x,q.y-12,'#cdb0d9',2);c.restore();return;}
  super.effect(f);const t=f.t/f.life;if(t<0||t>1)return;
  const c=this.ctx,p=this.point(f);c.save();c.globalAlpha=(1-t)*.2;
  if(['ring','fire','clock','anchor'].includes(f.kind)){
   const r=(f.r||85)*(.35+t*.65),col=f.kind==='fire'?'#f29d63':f.kind==='anchor'?'#aa90d6':'#d3c093';
   const glow=c.createRadialGradient(p.x,p.y,r*.1,p.x,p.y,r);glow.addColorStop(0,col);glow.addColorStop(1,'#0000');oval(c,p.x,p.y,r*.75,r*.75,glow);
  }
  c.restore();
 }
 draw(dt=.016){
  super.draw(dt);const c=this.ctx,g=this.g;c.save();
  for(const s of g.shots.slice(0,240)){
   const p=this.point(s);if(p.x<-24||p.x>this.w+24||p.y<-24||p.y>this.h+24)continue;
   const sp=Math.hypot(s.vx,s.vy)||1,col=s.owner==='e'?'#e2856950':'#a9e0d346';
   line(c,p.x-s.vx/sp*22,p.y-12-s.vy/sp*22,p.x-s.vx/sp*4,p.y-12-s.vy/sp*4,col,2.5);
  }
  const haze=c.createLinearGradient(0,0,0,this.h);haze.addColorStop(0,'#d5c49708');haze.addColorStop(.45,'#0000');haze.addColorStop(1,'#06111c22');c.fillStyle=haze;c.fillRect(0,0,this.w,this.h);
  if(!this.reduced){for(let i=0;i<5;i++){
   const x=((i*263-g.camera.x*.03+this.ambient*2)%(this.w+300)+this.w+300)%(this.w+300)-150,y=40+i*57+Math.sin(this.ambient*.25+i)*9;
   const fog=c.createRadialGradient(x,y,0,x,y,160);fog.addColorStop(0,'#b0c9b30a');fog.addColorStop(1,'#0000');oval(c,x,y,145,19,fog);
  }}c.restore();
 }
}
D.Renderer=NocturneRenderer;
})(window.DTD);
