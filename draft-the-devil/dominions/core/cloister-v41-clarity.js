'use strict';
(function(D){
const Base=D.Renderer,TAU=Math.PI*2;
class ClarityRenderer extends Base{
 sprite(type,frame=0,action=false){
  if(type!=='player')return super.sprite(type,frame,action);
  const key='pilgrim41:'+frame+':'+action;if(this.sprites.has(key))return this.sprites.get(key);
  const cn=document.createElement('canvas');cn.width=160;cn.height=200;
  const c=cn.getContext('2d');c.scale(2,2);c.translate(40,77);
  const bob=Math.sin(frame*TAU/6),gold='#f6d782',ink='#08202e';c.lineJoin='round';c.lineCap='round';
  const poly=(points,fill,stroke=ink,width=1.5)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=width;c.stroke();};
  const line=(x,y,x2,y2,color,width=1)=>{c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();};
  // Long, saturated blue mantle and white armour: deliberately not a mob palette.
  poly([[-8,-42],[-20,-34],[-23+bob*2,-17],[-31+bob*3,-1],[-14,-5],[-6,-21],[10,-30]],'#145da0','#83e2fb',1.1);
  line(-17,-28,-24+bob*3,-7,'#5fa4dc',1.5);
  for(const k of [-1,1]){const step=Math.sin(frame*TAU/6+(k>0?Math.PI:0))*2;poly([[k*2,-13],[k*8,-13],[k*9,step],[k*2,step+1]],'#edf2ed');line(k*3,step+1,k*11,step+1,gold,2);}
  const ivory=c.createLinearGradient(-12,-35,12,-5);ivory.addColorStop(0,'#ffffff');ivory.addColorStop(.45,'#e8f4ee');ivory.addColorStop(1,'#9cc5d3');
  poly([[-8,-41],[-15,-28],[-15,-7],[-9,0],[0,-5],[9,0],[16,-7],[14,-29],[8,-41]],ivory);
  poly([[-8,-36],[0,-41],[9,-35],[7,-20],[0,-15],[-7,-20]],'#e8f5f4',gold,1.3);
  line(-7,-25,0,-20,'#75b4c7',1);line(0,-20,7,-25,'#75b4c7',1);
  poly([[-15,-32],[-9,-39],[-6,-30],[-11,-25],[-18,-28]],'#e9f6f6',gold,1.4);
  poly([[10,-39],[17,-33],[19,-27],[12,-24],[7,-29]],'#fff6d7',gold,1.4);
  line(-10,-15,11,-17,'#a87e38',4);line(-10,-16,11,-18,gold,1.2);
  poly([[-2,-16],[5,-18],[8,-3],[3,5],[-2,0]],'#247fc0','#88dffd',.8);
  // Angular ivory visor with blue eyes and a small gold diadem, not horns.
  poly([[-8,-49],[-6,-56],[0,-61],[7,-55],[9,-46],[5,-37],[0,-34],[-6,-39]],'#fbfff2',gold,1.2);
  line(-6,-49,-2,-47,ink,3);line(2,-47,6,-49,ink,3);
  line(-5,-48,-2,-47,'#62efff',1.3);line(2,-47,5,-48,'#62efff',1.3);
  line(0,-52,0,-39,'#9eb6be',.9);poly([[-6,-57],[0,-67],[6,-57],[0,-59]],gold,ink,1);
  // Wide emissive blade points in the same direction as the real shot.
  c.save();c.translate(15,-16);c.rotate(action?-.95:-.12+bob*.1);
  poly([[-2,-7],[0,-37],[4,-8],[1,-3]],'#f4ffff','#69eaff',1.2);
  line(-6,-5,6,-5,gold,2);line(1,-3,1,7,'#ccaa61',3);c.restore();
  // Small armoured left gauntlet and unique cyan lamp.
  poly([[-15,-26],[-19,-22],[-16,-12],[-10,-14]],'#cde9ea',gold,1);
  c.fillStyle='#7ffff5';c.beginPath();c.arc(-20,-10,3,0,TAU);c.fill();
  this.sprites.set(key,cn);return cn;
 }
 actor(e){
  if(e===this.g.player){
   const p=this.point(e),c=this.ctx;c.save();
   c.beginPath();c.ellipse(p.x,p.y+3,26,10,0,0,TAU);c.strokeStyle='#051019';c.lineWidth=6;c.stroke();
   c.strokeStyle='#66e9ff';c.lineWidth=2;c.stroke();c.restore();
  }
  super.actor(e);
 }
 draw(dt=.016){
  super.draw(dt);
  const g=this.g,p=this.point(g.player),c=this.ctx;
  if(!['wave','boss','lab'].includes(g.state))return;
  const crowded=g.enemies.some(e=>!e.dead&&Math.hypot(e.x-g.player.x,e.y-g.player.y)<58);
  const covered=(this.backgroundCache?.props||[]).some(e=>Math.abs(e.x-g.player.x)<45&&e.y>=g.player.y&&e.y-g.player.y<95);
  // Preserve the hero silhouette through nearby crowds/foreground props; the hitbox is unchanged.
  if(crowded||covered){c.save();c.globalAlpha=.96;this.actor(g.player);c.restore();}
  c.save();c.font='700 9px -apple-system, sans-serif';c.textAlign='center';
  const y=p.y-83;c.fillStyle='#061620e8';c.fillRect(p.x-15,y-11,30,15);
  c.fillStyle='#b6f5ff';c.fillText('YOU',p.x,y);
  c.beginPath();c.moveTo(p.x-4,y+5);c.lineTo(p.x+4,y+5);c.lineTo(p.x,y+10);c.closePath();c.fillStyle='#70eaff';c.fill();
  c.restore();
 }
}
D.Renderer=ClarityRenderer;
})(window.DTD);
