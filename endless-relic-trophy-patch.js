'use strict';
(()=>{
const extra=[
['scythe','☽','Scythe Psalter',['Kills fling a seeking scythe at a nearby foe.','Every kill flings 2 scythes.','Scythes deal +55% damage.','Scythes pierce one target.','ASCENSION: scythes chain to three fresh targets.']],
['marrow','♢','Marrow Covenant',['+18 max HP.','+18 max HP and +6% damage.','Missing health grants up to +25% damage.','Healing below 35% HP is doubled.','ASCENSION: below 30% HP, gain +60% damage and +20% move speed.']],
['eclipse','◒','Eclipse Canticle',['Every 8th volley fires a crescent side-shot.','Every 6th volley.','Crescents deal +70% damage.','Crescents pierce +2.','ASCENSION: each trigger releases a full lunar ring of 8 crescents.']],
['plague','☣','Pestilent Testament',['Kills infect nearby enemies.','Infection radius +40%.','Infected enemies take damage over time.','Infection spreads again on death.','ASCENSION: elite deaths create a plague field that melts crowds.']],
['hourglass','⌛','Apostate Hourglass',['Every 12s, nearby enemies are slowed briefly.','Triggers every 10s.','Slow becomes much stronger.','The pulse also damages enemies.','ASCENSION: the pulse freezes normal enemies and heavily slows elites.']],
['raven','✥','Raven Vestment',['Dashing fires 4 black feathers.','Dashing fires 6 feathers.','Feathers deal +65% damage.','Feathers seek nearby enemies.','ASCENSION: dash leaves a raven echo that repeats the feather burst.']],
['seal','⛧','Covenant Seal',['Gain +2% damage per relic tier currently owned by the Devil.','Bonus becomes +3% per Devil tier.','Gain +1 armor while the Devil owns 8+ tiers.','Boss damage +20%.','ASCENSION: stealing a Devil relic grants a permanent +8% damage for the run.']],
['hunter','⚔','Heretic Hunter',['Deal +20% damage to elites.','Elite damage +20% more.','Elite kills heal 5 HP.','Elite kills fire a radial volley.','ASCENSION: elites under 20% HP are executed and explode.']],
['choirbone','☍','Bone Choir',['Every 12 kills releases a radial bone volley.','Triggers every 10 kills.','Volley gains 4 more bones.','Bones pierce +1.','ASCENSION: the volley becomes a spiralling bone storm.']],
['sacrament','✚','Black Sacrament',['Pickups from elites are doubled.','Elite pickups heal 3 HP.','Every 15 pickups grants +5% damage for the wave.','Pickup magnet range +70.','ASCENSION: collecting 20 pickups summons a damaging sacrament nova.']]
].map(([id,icon,name,tiers])=>({id,icon,name,tiers}));
for(const r of extra){if(!R[r.id]){RELICS.push(r);R[r.id]=r}}
SYNERGIES.push(
 ['scythe','bleed','RED HARVEST','Seeking scythes inherit bleed and burst five-stack targets.'],
 ['raven','ember','ASHEN MURDER','Dash feathers ignite enemies and leave sparks behind.'],
 ['hourglass','frost','STILL WINTER','Hourglass pulses freeze enemies already slowed by Winter Heresy.'],
 ['plague','void','BLACK FEVER','Infected enemies gain Void and drag nearby marked enemies into the plague.'],
 ['hunter','execute','NO MERCY','Elite executions erupt into a wide execution shockwave.'],
 ['eclipse','mirror','FALSE MOON','Lunar crescents echo from the opposite side of the player.']
);
const oldApply=applyStats;
applyStats=function(){oldApply();
 let L=playerLv;
 if(L.marrow){P.maxHp+=18*L.marrow;P.hp=Math.min(P.hp,P.maxHp);P.damage*=1+.06*Math.max(0,L.marrow-1)}
 if(L.seal){let dt=Object.values(devilLv).reduce((a,b)=>a+b,0);P.damage*=1+dt*(L.seal>=2?.03:.02);if(L.seal>=3&&dt>=8)P.armor+=1}
 if(L.sacrament&&L.sacrament>=4)P.magnet+=70;
};
let lunarN=0,boneKills=0,hourClock=12,wavePickupBuff=0;
const oldFire=firePlayer;
firePlayer=function(){oldFire();
 if(!has('eclipse'))return;lunarN++;let req=has('eclipse',2)?6:8;if(lunarN%req)return;
 let n=has('eclipse',5)?8:2,base=Math.random()*TAU;for(let i=0;i<n;i++){let a=has('eclipse',5)?base+i*TAU/n:base+(i?Math.PI:0);makeShot(P.x,P.y,a,P.damage*(has('eclipse',3)?1.7:1),.95,has('eclipse',4)?2:0,0)}
 if(synergyActive('eclipse','mirror'))for(let i=0;i<2;i++)makeShot(P.x,P.y,base+Math.PI/2+i*Math.PI,P.damage*.9,.8,1,0);
};
const oldKill=killEnemy;
killEnemy=function(e){if(!e||e.dead)return;let ex=e.x,ey=e.y,elite=e.elite,burn=e.burn||0,bleed=e.bleedStacks||0;oldKill(e);
 if(has('scythe')){let count=has('scythe',2)?2:1;for(let i=0;i<count;i++){let t=nearestEnemy(ex,ey);if(t){let a=Math.atan2(t.y-ey,t.x-ex)+rnd(.14,-.14);makeShot(ex,ey,a,P.damage*(has('scythe',3)?1.55:1),1.2,has('scythe',4)?1:0,0)}}}
 if(has('plague')){let rad=has('plague',2)?155:110;for(const q of enemies)if(!q.dead&&Math.hypot(q.x-ex,q.y-ey)<rad){q.void=Math.max(q.void||0,has('plague',3)?4:2);if(has('plague',3)){q.burn=Math.max(q.burn||0,2.4);q.hp-=P.damage*.16}}if(elite&&has('plague',5))hazards.push({x:ex,y:ey,r:32,max:145,life:2.6,dmg:P.damage*.55,type:'playerLance',enemy:false})}
 if(has('hunter')&&elite){if(has('hunter',3))heal(5);if(has('hunter',4))for(let i=0;i<8;i++)makeShot(ex,ey,i*TAU/8,P.damage*.65,.75,1,0)}
 if(has('choirbone')){boneKills++;let req=has('choirbone',2)?10:12;if(boneKills>=req){boneKills=0;let n=has('choirbone',3)?12:8;for(let i=0;i<n;i++)makeShot(P.x,P.y,i*TAU/n+(has('choirbone',5)?totalTime*.8:0),P.damage*(has('choirbone',5)?.9:.6),.75,has('choirbone',4)?1:0,0)}}
};
const oldHit=hitEnemy;
hitEnemy=function(e,s){if(has('hunter')&&e.elite){s={...s,damage:s.damage*(1+.2*Math.min(2,tier('hunter')))};if(has('hunter',5)&&e.hp/e.maxHp<.2){e.hp=0;explode(e.x,e.y,P.damage*2.2,110)}}oldHit(e,s)};
const oldDash=dash;
dash=function(){let ready=P.dashLeft<=0,px=P.x,py=P.y;oldDash();if(!ready||!has('raven'))return;let n=has('raven',2)?6:4;for(let i=0;i<n;i++){let a=i*TAU/n;makeShot(px,py,a,P.damage*(has('raven',3)?1.65:.9),.72,0,0)}if(has('raven',5))setTimeout(()=>{for(let i=0;i<n;i++)makeShot(P.x,P.y,i*TAU/n+.25,P.damage*.9,.7,0,0)},180)};
const oldUpdate=update;
update=function(dt){oldUpdate(dt);if(paused)return;
 if(has('marrow')){let miss=1-P.hp/P.maxHp;if(has('marrow',3)&&miss>0)P.damage*=1+Math.min(.0025,miss*.0007);if(has('marrow',5)&&P.hp/P.maxHp<.3){P.vx*=1.003;P.vy*=1.003}}
 if(has('hourglass')){hourClock-=dt;if(hourClock<=0){hourClock=has('hourglass',2)?10:12;for(const e of enemies){if(e.dead||dist(P,e)>430)continue;e.slow=Math.max(e.slow||0,has('hourglass',5)?2.1:has('hourglass',3)?1.25:.7);if(has('hourglass',4)){e.hp-=P.damage*.55;if(e.hp<=0)killEnemy(e)}}toast('THE HOUR TURNS',has('hourglass',5)?'TIME BREAKS':'ENEMIES SLOW')}}}
};
const oldPickup=updatePickups;
updatePickups=function(dt){let before=pickups.length,prehp=P.hp;oldPickup(dt);let got=Math.max(0,before-pickups.length);if(got&&has('sacrament')){if(has('sacrament',2))heal(got*1.5);if(has('sacrament',3)){wavePickupBuff+=got;if(wavePickupBuff>=15){wavePickupBuff-=15;P.damage*=1.05;toast('BLACK SACRAMENT','DAMAGE RISES')}}if(has('sacrament',5)&&Math.random()<Math.min(1,got/20)){explode(P.x,P.y,P.damage*2.2,135)}}};
const oldSpawnBoss=spawnBoss;
spawnBoss=function(){oldSpawnBoss();if(!boss)return;let lv=id=>devilLv[id]||0;let extraPower=lv('scythe')+lv('marrow')+lv('eclipse')+lv('plague')+lv('hourglass')+lv('raven')+lv('seal')+lv('hunter')+lv('choirbone')+lv('sacrament');boss.damage*=1+extraPower*.018;boss.speed*=1+lv('raven')*.025;boss.maxHp*=1+lv('marrow')*.035;boss.hp=boss.maxHp;};
function trophyCandidates(){let arr=Object.entries(devilLv).filter(([id,n])=>n>0&&R[id]&&(playerLv[id]||0)<5);for(let i=arr.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr.slice(0,3)}
function showCovenantSummary(){paused=true;state='between';ui.overlay.classList.remove('hidden');let syn=synergyList();ui.panel.innerHTML=`<div class="sigil">✦</div><h1>Covenant <b>${roman(cycle)}</b> broken.</h1><div class="lead">Your stolen power survives. The Devil returns with whatever remains.</div><div class="result"><div><b>${kills}</b><span>KILLS</span></div><div><b>${Object.values(playerLv).reduce((a,b)=>a+b,0)}</b><span>RELIC TIERS</span></div><div><b>${syn.length}</b><span>SYNERGIES</span></div><div><b>${fmt(totalTime)}</b><span>TIME</span></div></div><button class="primary" id="continue">DESCEND TO COVENANT ${roman(cycle+1)}</button><button class="secondary" id="quit">END RUN</button>`;$('#continue').onclick=nextCycle;$('#quit').onclick=()=>endRun(true)}
covenantCleared=function(){paused=true;state='trophy';ui.overlay.classList.remove('hidden');let opts=trophyCandidates();if(!opts.length){showCovenantSummary();return}ui.panel.innerHTML=`<div class="sigil">♆</div><div class="draftTitle">Claim what you gave away.</div><div class="draftSub">Steal one tier from the Devil. You gain it; he permanently loses it.</div><div class="cards">${opts.map(([id,n])=>{let r=R[id],next=(playerLv[id]||0)+1;return `<button class="card" data-id="${id}"><div class="icon">${r.icon}</div><div class="tier">STEAL DEVIL TIER ${roman(n)}</div><h3>${r.name}</h3><div class="desc">You gain ${next>=5?'its ASCENSION':`Tier ${roman(next)}`}. The Devil loses one tier.</div><div class="take">CLAIM THIS RELIC</div></button>`}).join('')}</div>`;document.querySelectorAll('.card[data-id]').forEach(el=>el.onclick=()=>{let id=el.dataset.id;devilLv[id]=Math.max(0,(devilLv[id]||0)-1);playerLv[id]=Math.min(5,(playerLv[id]||0)+1);if(has('seal',5)){P.damage*=1.08}applyStats();updateRelicRail();toast('RELIC STOLEN',R[id].name.toUpperCase());showCovenantSummary()})};
})();
