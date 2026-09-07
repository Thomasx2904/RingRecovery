'use strict';

const $=s=>document.querySelector(s),c=$('#game'),ctx=c.getContext('2d',{alpha:false}),mini=$('#mini'),mctx=mini.getContext('2d');
const ui={overlay:$('#overlay'),panel:$('#panel'),wave:$('#waveText'),hp:$('#hpbar'),hptext:$('#hptext'),timer:$('#timer'),kills:$('#kills'),devil:$('#devilPower'),rail:$('#relicrail'),boss:$('#bossHud'),bossFill:$('#bossFill'),bossName:$('#bossName'),toast:$('#toast'),joy:$('#joy'),stick:$('#stick'),dash:$('#dash'),dashText:$('#dashText')};
let DPR=1,W=0,H=0,last=0,paused=true,state='title',cycle=1,wave=1,waveTime=0,totalTime=0,kills=0,spawnClock=0,shotClock=0,boss=null;
let camera={x:0,y:0},shots=[],enemies=[],particles=[],pickups=[],hazards=[],landmarks=new Map(),draftChoices=[],draftTaken=null;
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),rnd=(a=1,b=0)=>b+Math.random()*(a-b);
function hash(x,y,s=0){let n=Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453;return n-Math.floor(n)}
function roman(n){const r=[['M',1000],['CM',900],['D',500],['CD',400],['C',100],['XC',90],['L',50],['XL',40],['X',10],['IX',9],['V',5],['IV',4],['I',1]];let o='';for(const [s,v] of r)while(n>=v){o+=s;n-=v}return o}
function resize(){DPR=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;c.width=W*DPR;c.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0)}addEventListener('resize',resize);resize();

const baseP={x:0,y:0,vx:0,vy:0,r:11,hp:100,maxHp:100,speed:315,damage:12,fireRate:.42,shotSpeed:640,shots:1,pierce:0,crit:.08,critMult:2,regen:0,lifesteal:0,magnet:150,dashCd:1.0,dashLeft:0,ifr:0,armor:0,chain:0,chainDamage:0,burn:0,burnDps:0,freeze:0,orbit:0,orbitDamage:0,blast:0,blastDamage:0,bleed:0,bleedDps:0,thorns:0,echo:0,split:0,holy:0,voidMark:0,storm:0,soul:0,ricochet:0,execute:0,fortify:0,overdrive:0,phoenix:0,phoenixReady:0};
let P={...baseP},playerLv={},devilLv={};
const RELICS=[
['fork','↯','Forked Oath',['Bolts chain to 1 nearby foe.','+1 chain and +30% chain damage.','Chains jump farther and prioritize fresh targets.','Chain hits can crit.','ASCENSION: every 5th hit calls a 6-target lightning storm.']],
['ember','✹','Cinder Gospel',['Hits ignite foes.','Burn damage +70%.','Burn spreads on death.','Burning enemies take +18% crit chance.','ASCENSION: killing a burning foe erupts a fire nova.']],
['glass','◇','Glass Testament',['+35% damage, -10 max HP.','+25% damage.','Crit multiplier +0.75.','Shots grow as damage rises.','ASCENSION: below 40% HP, damage doubles and shots pierce +2.']],
['blood','♥','Blood Tithe',['2.5% lifesteal.','+2% lifesteal.','Overhealing becomes a 20 HP blood shield.','Crits heal twice.','ASCENSION: healing at full HP releases blood blades.']],
['halo','✦','Martyr Halo',['1 orbiting blade.','+1 blade.','Blades deal +65% damage.','Blades inherit bleed and burn.','ASCENSION: blades become a rotating cathedral saw that blocks enemy shots.']],
['frost','❄','Winter Heresy',['Hits slow foes.','Slow is stronger.','Every 8th hit briefly freezes.','Frozen foes take +35% damage.','ASCENSION: shattered frozen foes send ice lances outward.']],
['thorn','♰','Thorn Vow',['Return 20% contact damage.','Return 45%.','Taking damage fires 4 thorns.','Thorns can crit.','ASCENSION: dashing leaves a thorn labyrinth for 3s.']],
['heart','✚','Second Heart',['+24 max HP, heal 24.','+24 max HP.','+1 armor.','Regenerate 1.5 HP/s.','ASCENSION: once per wave, lethal damage instead heals 50% HP.']],
['swift','➶','Pilgrim Spurs',['+14% move speed.','+10% move speed.','Dash cooldown -18%.','Dash gains a second charge-like reset on kill streaks.','ASCENSION: dash becomes a damaging blink slash.']],
['rapid','✣','Choir of Teeth',['Fire 18% faster.','Fire 18% faster.','Every 9th volley is doubled.','Projectile speed +35%.','ASCENSION: sustained firing enters Overdrive, doubling fire rate for 3s.']],
['pierce','⇥','Nail of Saint Vey',['Shots pierce +1.','Piercing hits gain +12% damage each target.','Pierce +1.','Pierced targets bleed.','ASCENSION: shots never disappear from piercing; they fade after 7 hits.']],
['mirror','◈','Mirror Gospel',['Every 6th shot fires backward too.','Echo every 4th shot.','Echo shots deal full damage.','Echo shots home toward enemies.','ASCENSION: every volley is mirrored in 4 directions.']],
['blast','✺','Ashen Bell',['Every 7th hit explodes.','Explosion radius +45%.','Explosions burn.','Explosions can chain-trigger once.','ASCENSION: elite/boss hits ring a huge shockwave.']],
['ward','⬡','Ivory Ward',['Gain 1 armor.','Gain 1 armor.','Every 12s gain 2s invulnerability.','Ward pulses knock foes away.','ASCENSION: ward reflects enemy projectiles.']],
['crit','✧','Saint’s Eye',['+12% crit chance.','+10% crit chance.','Crit damage +0.75.','Crits create seeking needles.','ASCENSION: every non-crit adds 8% crit chance until you crit.']],
['bleed','☷','Red Scripture',['Hits inflict bleed.','Bleed stacks twice.','Bleeding foes move 12% slower.','Bleed bursts when target reaches 5 stacks.','ASCENSION: bleed burst copies all other damage-over-time effects nearby.']],
['magnet','⌁','Grave Magnet',['Pickup radius +80.','Pickups heal 1 HP.','Nearby pickups orbit you and damage foes.','Pickup collection grants short haste.','ASCENSION: every 20 pickups summons a soul comet.']],
['split','⋔','Schism',['Every 8th shot splits into 3.','Every 6th shot splits.','Split shots deal 85% damage.','Splits can split once more on crit.','ASCENSION: all kills launch 5 splinters at nearby enemies.']],
['void','●','Black Psalm',['Hits mark foes with Void.','Marked foes take +12% all damage.','Mark spreads on death.','Marked elites periodically implode.','ASCENSION: 5 marked deaths summon a temporary black hole.']],
['storm','ϟ','Storm Reliquary',['Moving charges storm energy.','At full charge zap nearest foe.','Zap chains 3 times.','Dashing instantly adds 40% charge.','ASCENSION: full charge summons a roaming thunder saint for 5s.']],
['soul','☉','Soul Lantern',['Kills have 12% chance to spawn a soul.','Souls orbit and fire at foes.','Max souls +2.','Souls explode when they expire.','ASCENSION: 6 souls fuse into a giant familiar.']],
['ricochet','⤴','Crooked Nail',['Shots ricochet once off screen edge logic.','Ricochet damage +35%.','Ricochets seek nearest target.','Ricochet can trigger blast.','ASCENSION: shots bounce between enemies up to 4 times.']],
['execute','†','Mercy’s End',['Deal +35% damage to foes under 20% HP.','Threshold becomes 27%.','Executions heal 2 HP.','Executions trigger a fear pulse.','ASCENSION: elites under 15% HP are instantly executed.']],
['fortify','▣','Stone Litany',['Standing still 0.7s grants 25% damage reduction.','Fortify grants +20% damage.','Fortify persists 0.8s after moving.','Fortify adds knockback immunity.','ASCENSION: while fortified, fire a radial volley every second.']],
['overdrive','✢','Red Engine',['Kills add a short stacking fire-rate buff.','Stacks last longer.','Max stacks +5.','At max stacks gain move speed.','ASCENSION: at max stacks, shots become fiery scythes.']],
['phoenix','♨','Phoenix Clause',['Once per covenant, survive lethal damage at 1 HP.','Revive heals 35 HP.','Revive releases a fire ring.','Phoenix refreshes after defeating the Devil.','ASCENSION: revive grants 6s of invulnerability and double damage.']],
['trinity','△','Threefold Lie',['Every 10th volley fires 3 heavy bolts.','Every 8th volley.','Heavy bolts pierce +2.','Heavy bolts explode.','ASCENSION: every 5th volley becomes a 7-bolt fan.']],
['curse','☾','Moonless Curse',['Enemies near you take passive damage.','Aura radius +35%.','Aura applies Void mark.','Aura damage scales with missing HP.','ASCENSION: aura occasionally silences enemy special attacks.']],
['seraph','⚜','Broken Seraph',['Every 18 kills summon a falling lance.','Every 14 kills.','Lance leaves burning ground.','Lance splits into 4 shards.','ASCENSION: every elite kill calls a barrage of 7 lances.']],
['coin','¤','Devil’s Interest',['Each wave cleared grants +4% damage.','Wave bonus becomes +7%.','Boss kill grants +12 max HP.','Covenant start grants 10s haste.','ASCENSION: every new covenant duplicates one random Tier I-IV relic effect for the covenant.']]
].map(([id,icon,name,tiers])=>({id,icon,name,tiers}));
const R=Object.fromEntries(RELICS.map(r=>[r.id,r]));
const SYNERGIES=[
['fork','ember','HELLSTORM','Chain lightning spreads Cinder Gospel; burning chained enemies burst into sparks.'],
['halo','bleed','RED ROSARY','Orbiting blades inherit bleed and accelerate bleed bursts.'],
['frost','blast','SHATTERBELL','Explosions instantly shatter frozen enemies into ice fragments.'],
['void','storm','BLACK TEMPEST','Storm strikes pull Void-marked enemies toward the impact.'],
['crit','split','GLASS RAIN','Critical split shots split again and seek fresh targets.'],
['blood','thorn','PENITENT ENGINE','Reflected damage heals you at 50% lifesteal efficiency.'],
['magnet','soul','GRAVE CHOIR','Collected pickups charge every soul familiar to fire a synchronized volley.'],
['ember','bleed','SCARLET PYRE','Bleed bursts copy burn stacks to nearby enemies.'],
['fortify','rapid','CITADEL CHOIR','While fortified, rapid-fire bonus ramps twice as fast.'],
['execute','void','FINAL PSALM','Executing a marked enemy detonates its mark in a wide area.']
];
function tier(id,who=playerLv){return who[id]||0} function has(id,n=1){return tier(id)>=n}
function synergyActive(a,b){return has(a)&&has(b)} function synergyList(){return SYNERGIES.filter(s=>synergyActive(s[0],s[1]))}

function applyStats(){
 Object.assign(P,{...baseP,x:P.x||0,y:P.y||0,vx:P.vx||0,vy:P.vy||0,hp:Math.min(P.hp||100,P.maxHp||100)});
 const L=playerLv;
 if(L.heart){P.maxHp+=24*L.heart;P.hp=Math.min(P.maxHp,Math.max(P.hp,100));if(L.heart>=3)P.armor+=1;if(L.heart>=4)P.regen+=1.5;if(L.heart>=5)P.phoenixReady=1}
 if(L.glass){P.maxHp-=10;P.damage*=1.35*Math.pow(1.25,Math.max(0,L.glass-1));if(L.glass>=3)P.critMult+=.75}
 if(L.blood){P.lifesteal=.025+.02*Math.max(0,L.blood-1)}
 if(L.halo){P.orbit=Math.min(5,L.halo);P.orbitDamage=10*(1+(L.halo>=3?.65:0))}
 if(L.frost){P.freeze=.24+(L.frost-1)*.08}
 if(L.thorn){P.thorns=L.thorn>=2?.45:.2}
 if(L.swift){P.speed*=1.14*Math.pow(1.1,Math.max(0,L.swift-1));if(L.swift>=3)P.dashCd*=.82}
 if(L.rapid){P.fireRate/=Math.pow(1.18,L.rapid)}
 if(L.pierce){P.pierce+=L.pierce>=3?2:1}
 if(L.mirror)P.echo=L.mirror;
 if(L.blast){P.blast=L.blast;P.blastDamage=11*(L.blast>=2?1.45:1)}
 if(L.ward)P.armor+=Math.min(2,L.ward);
 if(L.crit){P.crit+=.12+.1*Math.max(0,L.crit-1);if(L.crit>=3)P.critMult+=.75}
 if(L.bleed){P.bleed=L.bleed;P.bleedDps=5+3*L.bleed}
 if(L.magnet){P.magnet+=80;if(L.magnet>=2)P.pickupHeal=1}
 if(L.split)P.split=L.split;
 if(L.void)P.voidMark=L.void;
 if(L.storm)P.storm=L.storm;
 if(L.soul)P.soul=L.soul;
 if(L.ricochet)P.ricochet=L.ricochet;
 if(L.execute)P.execute=L.execute;
 if(L.fortify)P.fortify=L.fortify;
 if(L.overdrive)P.overdrive=L.overdrive;
 if(L.phoenix)P.phoenix=L.phoenix;
 if(L.trinity)P.trinity=L.trinity;
 if(L.curse)P.curse=L.curse;
 if(L.seraph)P.seraph=L.seraph;
 if(L.coin)P.coin=L.coin;
 if(L.fork){P.chain=L.fork>=2?2:1;P.chainDamage=8*(L.fork>=2?1.3:1)}
 if(L.ember){P.burn=L.ember;P.burnDps=6*(L.ember>=2?1.7:1)}
}
function title(){paused=true;state='title';ui.overlay.classList.remove('hidden');ui.panel.innerHTML=`<div class="sigil">♆</div><h1>Draft <b>the Devil</b></h1><div class="lead">Take one relic. Choose which rejected relic empowers the Devil. The third returns to the pool. Defeat him after ten waves, then keep going forever.</div><div class="small">Landscape iPhone demo · 30 relics · 5 tiers each · Tier V ascensions · endless covenants · hidden synergies</div><div style="margin-top:16px"><button class="primary" id="start">ENTER THE COVENANT</button></div>`;$('#start').onclick=startRun}
function startRun(){cycle=1;wave=1;waveTime=0;totalTime=0;kills=0;playerLv={};devilLv={};P={...baseP};shots=[];enemies=[];particles=[];pickups=[];hazards=[];boss=null;camera={x:0,y:0};ui.boss.classList.remove('on');ui.overlay.classList.add('hidden');paused=false;state='wave';toast('COVENANT I','THE ROAD OPENS');updateRelicRail()}
function toast(a,b){ui.toast.querySelector('strong').textContent=a;ui.toast.querySelector('span').textContent=b;ui.toast.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>ui.toast.classList.remove('on'),1100)}
function weightedRelicPick(exclude=[]){let pool=RELICS.filter(r=>!exclude.includes(r.id)&&tier(r.id)<5);let weights=pool.map(r=>tier(r.id)>0?1.2:1);let sum=weights.reduce((a,b)=>a+b,0),x=Math.random()*sum;for(let i=0;i<pool.length;i++){x-=weights[i];if(x<=0)return pool[i]}return pool[0]}
function finishWave(){state='draft';paused=true;enemies=[];shots=[];hazards=[];showDraft()}
function showDraft(){draftChoices=[];for(let i=0;i<3;i++){let r=weightedRelicPick(draftChoices.map(x=>x.id));if(r)draftChoices.push(r)};if(draftChoices.length<3){startBossIntro();return}ui.overlay.classList.remove('hidden');let syn=synergyList();ui.panel.innerHTML=`<div class="draftTitle">Choose your relic.</div><div class="draftSub">Repeats appear 20% more often. Tier V is a major ascension.</div><div class="cards">${draftChoices.map(cardHTML).join('')}</div>${syn.length?`<div class="synergyBox"><b>${syn[syn.length-1][2]}</b> active — ${syn[syn.length-1][3]}</div>`:''}`;document.querySelectorAll('.card').forEach((el,i)=>el.onclick=()=>takeRelic(i))}
function cardHTML(r){let lv=tier(r.id),next=lv+1;return `<button class="card" style="--glow:${next===5?'#d7b459':'#7b4a3d'}"><div class="icon">${r.icon}</div><div class="tier ${next===5?'max':''}">${next===5?'ASCENSION · TIER V':'TIER '+roman(next)+(lv?' · UPGRADE':' · NEW')}</div><h3>${r.name}</h3><div class="desc">${r.tiers[next-1]}</div>${next===5?`<div class="asc">This radically changes the relic.</div>`:''}<div class="take">TAKE THIS RELIC</div></button>`}
function takeRelic(i){draftTaken=draftChoices[i];playerLv[draftTaken.id]=(playerLv[draftTaken.id]||0)+1;applyStats();let rem=draftChoices.filter((_,j)=>j!==i);ui.panel.innerHTML=`<div class="draftTitle">Now choose the Devil’s relic.</div><div class="draftSub">One rejected relic becomes his. The other returns untouched to the pool.</div><div class="cards chooseDevil">${rem.map(r=>`<button class="card"><div class="icon">${r.icon}</div><div class="tier evil">THE DEVIL · TIER ${roman((devilLv[r.id]||0)+1)}</div><h3>${r.name}</h3><div class="desc">${devilDesc(r.id,(devilLv[r.id]||0)+1)}</div><div class="take">GIVE TO THE DEVIL</div></button>`).join('')}</div><div class="returnnote">The relic you do not choose remains in future drafts.</div>`;document.querySelectorAll('.card').forEach((el,j)=>el.onclick=()=>giveDevil(rem[j]))}
function devilDesc(id,n){const map={fork:'Adds additional aimed bolts.',ember:'Leaves cursed flame zones.',glass:'Deals much higher damage.',blood:'Heals from damage dealt.',halo:'Gains orbiting blades.',frost:'Projectiles slow you.',thorn:'Contact retaliates with spikes.',heart:'More health and regeneration.',swift:'Moves and dashes faster.',rapid:'Fires more frequently.',pierce:'Bolts pierce and keep travelling.',mirror:'Echoes attacks from odd angles.',blast:'Attacks create explosions.',ward:'Periodically gains a shield.',crit:'Can land brutal critical hits.',bleed:'Hits inflict stacking bleed.',magnet:'Pulls nearby hazards toward you.',split:'Some bolts split mid-flight.',void:'Marks you to amplify damage.',storm:'Calls lightning near your path.',soul:'Summons hostile soul familiars.',ricochet:'Bolts ricochet toward you.',execute:'Deals extra damage at low HP.',fortify:'Becomes tougher when stationary.',overdrive:'Kills empower attack speed.',phoenix:'Can revive during the boss fight.',trinity:'Periodically fires a heavy fan.',curse:'Damaging aura surrounds him.',seraph:'Calls falling cursed lances.',coin:'Scales harder each covenant.'};return (map[id]||'Empowers the Devil.')+(n===5?' Tier V mutates the ability.':'')}
function giveDevil(r){devilLv[r.id]=Math.min(5,(devilLv[r.id]||0)+1);updateRelicRail();ui.overlay.classList.add('hidden');if(wave>=10)startBossIntro();else{wave++;waveTime=0;state='wave';paused=false;toast('WAVE '+wave,'THE PILGRIMAGE DEEPENS')}}
function startBossIntro(){paused=true;state='preboss';ui.overlay.classList.remove('hidden');let list=Object.entries(devilLv).filter(x=>x[1]).map(([id,n])=>`<span class="pill">${R[id].icon} ${R[id].name} ${roman(n)}</span>`).join('');ui.panel.innerHTML=`<div class="sigil">♆</div><div class="draftTitle">The Devil remembers.</div><div class="draftSub">Covenant ${roman(cycle)} ends with the creature shaped by everything you refused.</div><div class="pills">${list}</div><button class="primary" id="face">FACE THE DEVIL</button>`;$('#face').onclick=()=>{ui.overlay.classList.add('hidden');paused=false;state='boss';spawnBoss();toast('THE DEVIL','COVENANT '+roman(cycle))}}
function spawnBoss(){enemies=[];shots=[];hazards=[];let scale=1+(cycle-1)*.65;boss={x:P.x+420,y:P.y-100,r:38,hp:(1150+Object.values(devilLv).reduce((a,b)=>a+b,0)*110)*scale,maxHp:0,speed:88+cycle*4,damage:12+cycle*2,contact:16+cycle*2,fireClock:.5,dashClock:2.8,novaClock:4,shield:0,dead:false,revived:false};boss.maxHp=boss.hp;ui.boss.classList.add('on');ui.bossName.textContent='THE DEVIL · COVENANT '+roman(cycle)}
function beatBoss(){boss.dead=true;ui.boss.classList.remove('on');for(let i=0;i<80;i++)particle(boss.x,boss.y,i%3?'#d95c4f':'#d7b463',rnd(320,40));if(has('phoenix',4))P.phoenixReady=1;setTimeout(covenantCleared,550)}
function covenantCleared(){paused=true;state='between';ui.overlay.classList.remove('hidden');let syn=synergyList();ui.panel.innerHTML=`<div class="sigil">✦</div><h1>Covenant <b>${roman(cycle)}</b> broken.</h1><div class="lead">Your build survives. The Devil returns stronger, carrying every relic you gave him.</div><div class="result"><div><b>${kills}</b><span>KILLS</span></div><div><b>${Object.values(playerLv).reduce((a,b)=>a+b,0)}</b><span>RELIC TIERS</span></div><div><b>${syn.length}</b><span>SYNERGIES</span></div><div><b>${fmt(totalTime)}</b><span>TIME</span></div></div><button class="primary" id="continue">DESCEND TO COVENANT ${roman(cycle+1)}</button><button class="secondary" id="quit">END RUN</button>`;$('#continue').onclick=nextCycle;$('#quit').onclick=()=>endRun(true)}
function nextCycle(){cycle++;wave=1;waveTime=0;P.hp=P.maxHp;if(has('coin',3)){P.maxHp+=12;P.hp=P.maxHp}shots=[];enemies=[];hazards=[];boss=null;ui.overlay.classList.add('hidden');paused=false;state='wave';toast('COVENANT '+roman(cycle),'THE WORLD TURNS CRUELER')}
function endRun(victory=false){paused=true;state='end';ui.boss.classList.remove('on');ui.overlay.classList.remove('hidden');ui.panel.innerHTML=`<div class="sigil">${victory?'✦':'♆'}</div><h1>${victory?'RUN <b>ENDED</b>':'THE DEVIL <b>COLLECTS</b>'}</h1><div class="lead">${victory?'You chose to seal the contract.':'Your endless covenant finally broke you.'}</div><div class="result"><div><b>${cycle}</b><span>COVENANT</span></div><div><b>${wave}</b><span>WAVE</span></div><div><b>${kills}</b><span>KILLS</span></div><div><b>${fmt(totalTime)}</b><span>TIME</span></div></div><button class="primary" id="again">BEGIN AGAIN</button>`;$('#again').onclick=startRun}
function updateRelicRail(){let arr=Object.entries(playerLv).filter(x=>x[1]);ui.rail.innerHTML=arr.map(([id,n])=>`<span class="relicpip ${n>=5?'max':''}">${R[id].icon}${roman(n)}</span>`).join('')}

