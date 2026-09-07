'use strict';
// Combat mix patch: normal waves are ~75% melee. Ranged enemies only fire once on-screen.
const _enemyTypeBase=enemyType;
enemyType=function(){
  const x=Math.random(), w=wave+(cycle-1)*3;
  if(w<2) return 'penitent';
  // 75% melee pool: penitent / hound / brute / bell. 25% ranged support.
  if(x<.40) return 'penitent';
  if(x<.58) return 'hound';
  if(x<.70) return 'brute';
  if(x<.75) return 'bell';
  const r=Math.random();
  if(w<4) return r<.72?'cantor':'wisp';
  if(w<7) return r<.40?'cantor':r<.68?'wisp':r<.86?'herald':'moth';
  return r<.28?'cantor':r<.52?'wisp':r<.76?'herald':'moth';
};

const _enemyShotBase=enemyShot;
enemyShot=function(src,a,sp=280,dmg=8,kind='bolt'){
  // Shorter projectile persistence keeps stray missiles from crossing several screens.
  shots.push({x:src.x,y:src.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:kind==='orb'?7:4.7,life:2.35,damage:dmg,owner:'e',kind});
};

updateEnemies=function(dt){
  const rangedVisibleRange=Math.max(245,Math.min(410,Math.min(W,H)*.92));
  for(const e of enemies){
    if(e.dead)continue;
    let a=Math.atan2(P.y-e.y,P.x-e.x),d=dist(P,e),slow=e.slow>0?(has('frost',2)?.55:.72):1;
    e.slow=Math.max(0,e.slow-dt);
    if(e.burn>0){e.burn-=dt;e.hp-=P.burnDps*dt}
    if(e.bleed>0){e.bleed-=dt;e.hp-=P.bleedDps*e.bleedStacks*dt}
    let sp=e.speed*slow;
    const isRanged=e.t==='cantor'||e.t==='wisp'||e.t==='herald'||e.t==='moth';

    if(isRanged){
      // Ranged units must enter the player's visible combat space before attacking.
      const ideal=e.t==='wisp'?270:e.t==='moth'?250:230;
      let dir=d<ideal*.78?-1:d>ideal?1:0;
      if(dir){e.x+=Math.cos(a)*sp*dir*dt;e.y+=Math.sin(a)*sp*dir*dt}
      else {e.x+=Math.cos(a+Math.PI/2)*sp*.18*dt;e.y+=Math.sin(a+Math.PI/2)*sp*.18*dt}
      e.fire-=dt;
      if(e.fire<=0 && d<rangedVisibleRange){
        if(e.t==='cantor'){
          // One aimed bolt instead of a constant 3-shot wall.
          enemyShot(e,a,245,e.damage);
          e.fire=2.15;
        }else if(e.t==='wisp'){
          enemyShot(e,a,315,e.damage,'orb');
          e.fire=2.35;
        }else if(e.t==='herald'){
          // Small readable fan, used much less frequently.
          for(let i=-1;i<=1;i++)enemyShot(e,a+i*.19,220,e.damage);
          e.fire=3.35;
        }else{
          // Moth fires a narrow pair rather than a full radial burst.
          enemyShot(e,a-.11,205,e.damage*.85);enemyShot(e,a+.11,205,e.damage*.85);
          e.fire=2.85;
        }
      }else if(e.fire<=0){
        // Don't bank an instant shot while off-screen.
        e.fire=.35;
      }
    }else{
      // Melee enemies use a wind-up swipe instead of invisible contact damage.
      e.meleeCd=(e.meleeCd==null?rnd(1.0,.15):e.meleeCd)-dt;
      e.meleeWind=e.meleeWind||0;
      const reach=e.r+P.r+(e.t==='brute'?34:e.t==='bell'?28:e.t==='hound'?20:18);
      if(e.meleeWind>0){
        e.meleeWind-=dt;
        // Slow substantially during telegraph so the player can dodge the swipe.
        e.x+=Math.cos(a)*sp*.10*dt;e.y+=Math.sin(a)*sp*.10*dt;
        if(e.meleeWind<=0){
          const hitReach=reach+(e.t==='brute'?12:4);
          if(dist(P,e)<hitReach)hurtPlayer(e.damage,e);
          e.meleeCd=e.t==='hound'?1.05:e.t==='brute'?1.7:e.t==='bell'?1.45:1.25;
          // Small visual impact ring; non-enemy so it does not deal a second hit.
          hazards.push({x:e.x,y:e.y,r:8,max:Math.max(34,e.r+24),life:.22,dmg:0,type:'ring',enemy:false});
        }
      }else if(d<reach && e.meleeCd<=0){
        e.meleeWind=e.t==='brute'?.42:e.t==='bell'?.38:.26;
      }else{
        if(e.t==='hound'){
          e.special-=dt;
          if(e.special<=0 && d>95){e.vx=Math.cos(a)*340;e.vy=Math.sin(a)*340;e.special=3.1}
          e.vx*=.955;e.vy*=.955;
          e.x+=(Math.cos(a)*sp+e.vx)*dt;e.y+=(Math.sin(a)*sp+e.vy)*dt;
        }else{
          e.x+=Math.cos(a)*sp*dt;e.y+=Math.sin(a)*sp*dt;
        }
      }
    }
    if(e.hp<=0)killEnemy(e);
  }
  enemies=enemies.filter(e=>!e.dead&&dist(e,P)<1800);
};
