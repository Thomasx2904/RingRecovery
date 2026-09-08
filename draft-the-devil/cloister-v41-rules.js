'use strict';
/* Covenant rules 4.1: one selected relic, two inherited relics.
   A separate, explicit boss adaptation is shown for EVERY relic. */
(function(D){
D.VERSION='4.1.0';
const roman=n=>['','I','II','III','IV','V'][n];
D.requirements=function(id,next){
  const healing=[['blood',1],['heart',4],['magnet',2],['sun',4],['hunter',3],['execute',3],['sacrament',2],['candle',4]];
  const status=[['ember',1],['frost',1],['bleed',1],['void',1]];
  if(id==='tuning')return {any:[['fork',1],['storm',1]],label:'Requires Forked Oath I or Storm Reliquary I'};
  if(id==='leech')return {any:healing,label:'Requires an owned healing relic'};
  if(id==='halo'&&next===4)return {any:status,label:'Requires an owned on-hit status relic'};
  if(id==='bleed'&&next===5)return {any:[['ember',1],['plague',1],['void',1],['brand',3],['sun',3],['blast',3]],label:'Requires a burn, infection or Void source to spread'};
  if(id==='candle'&&next===5)return {any:status,label:'Requires an owned on-hit status relic'};
  return null;
};
D.useNote={
  tuning:'Triggered by lightning from Forked Oath or Storm Reliquary.',
  leech:'Stores healing beyond full health. Requires an owned healing source.',
  halo:'Close-range orbit. Tier IV needs a status relic to copy.',
  scythe:'Triggers on kills, including damage-over-time kills.',
  seraph:'Triggers on kills. Boss attendants also count.',
  soul:'12% chance per kill; souls hurt nearby targets at Tier I.',
  hunter:'An anti-elite relic. Ordinary elite bonuses do not apply to the Devil.',
  ricochet:'Needs another nearby enemy to bounce to; it cannot hit the same enemy repeatedly.',
  chains:'Links need at least two enemies, including boss attendants.',
  overdrive:'Kill-based fire-rate stacks fade after their duration.',
  fortify:'Activates after standing still for 0.7 seconds.',
  omen:'Only triggers while below 35% health.',
  blood:'Lifesteal comes from direct hits, not damage over time.'
};
// The old catalogue made elemental categories sound like individual powers.
// Each recipe below now has its own actual implementation, not a label-only handler.
const B={};
function passive(id,build,describe){B[id]=n=>({id,tier:n,stats:build(n),description:describe(n)});}
function active(id,kind,cooldown,radius,power,note,extra={}){
 B[id]=n=>({id,tier:n,stats:extra.stats?extra.stats(n):{},
  ability:{id,kind,tier:n,cooldown:Math.max(2.7,cooldown-(n-1)*.4),radius:radius*(1+(n-1)*.09),power:power*(1+(n-1)*.14),count:Math.min(5,(extra.count||1)+(n===5?(extra.ascendCount||1):0)),...extra.ability},
  description:note+' '+(n===5?(extra.ascend||'ASCENSION: a second, staggered strike.'):'Tier '+roman(n)+': stronger effect and a shorter cooldown.')});
}
active('fork','storm',7,37,.65,'Calls clearly marked lightning strikes.',{count:1,ascendCount:2,ascend:'ASCENSION: three staggered lightning strikes.'});
active('ember','fire',7,47,.38,'Creates a burning pool at your last position.');
passive('glass',n=>({damage:.12+n*.09,hp:-.04*n}),n=>'Deals '+Math.round((.12+n*.09)*100)+'% more attack damage, but has '+n*4+'% less health.'+(n===5?' ASCENSION: +25% attack damage below 40% health.':''));
passive('blood',n=>({lifesteal:.2+n*.14}),n=>'Restores '+Math.round((.2+n*.14)*100)+'% of health damage he deals. Total boss healing is limited to 8% of his maximum health.'+(n===5?' ASCENSION: successful hits also empower his next attack.':''));
active('halo','blades',6.5,68,.6,'Sweeps orbiting blades around himself after a warning.',{count:1,ascendCount:2,ascend:'ASCENSION: three rotating blade sweeps.'});
passive('frost',n=>({slow:.35+n*.12}),n=>'Successful hits slow you for '+(.35+n*.12).toFixed(2)+' seconds. Higher tiers prolong the slow.'+(n===5?' ASCENSION: a hit also leaves a warned ice rune.':''));
active('thorn','thorns',8,70,.55,'Releases a short, telegraphed thorn fan.',{count:3,ascendCount:2,ascend:'ASCENSION: five thorns and a thorn patch.'});
passive('heart',n=>({hp:n*.07,regen:n>=4?.005*n:0,secondLife:n===5?.12:0}),n=>'Gains '+n*7+'% maximum health.'+(n>=4?' Regenerates limited health every 8 seconds.':'')+(n===5?' ASCENSION: one 12%-health last stand; cannot stack with Phoenix revival.':''));
passive('swift',n=>({speed:.04*n,lunge:.035*n}),n=>'Movement is '+n*4+'% faster; lunges are '+Math.round(n*3.5)+'% faster, retaining their warning.'+(n===5?' ASCENSION: lunges leave a delayed cutting trail.':''));
passive('rapid',n=>({recovery:.05*n,projectileSpeed:.03*n}),n=>'Recovery is '+n*5+'% shorter; projectiles are '+n*3+'% faster.'+(n===5?' ASCENSION: every third swipe is followed by a warned second swipe.':''));
passive('pierce',n=>({reach:7*n,damage:.02*n}),n=>'Melee reach increases by '+7*n+' and attack damage by '+n*2+'%.'+(n===5?' ASCENSION: swipes project a narrow, warned ground lance.':''));
active('mirror','mirror',8,60,.5,'Fires mirrored, on-screen bolts from two sides.',{count:2,ascendCount:2,ascend:'ASCENSION: four mirrored bolts.'});
active('blast','blast',8,68,.65,'Marks a blast zone around your last position.');
passive('ward',n=>({wardDuration:.45+.18*n,wardReduction:.15+.035*n}),n=>'Every 9 seconds, reduces incoming damage by '+Math.round((.15+.035*n)*100)+'% for '+(.45+.18*n).toFixed(2)+'s. He is still damageable.'+(n===5?' ASCENSION: the ward opens with a warned repulsion ring.':''));
passive('crit',n=>({crit:.035*n,critMult:1.25+.08*n}),n=>'Has '+Math.round(n*3.5)+'% critical chance with a '+(1.25+.08*n).toFixed(2)+'× damage multiplier.'+(n===5?' ASCENSION: missed criticals increase his next critical chance.':''));
passive('bleed',n=>({bleed:.7+n*.35}),n=>'Successful hits apply a brief bleed dealing '+(.7+n*.35).toFixed(2)+' health per second. Bleed respects invulnerability.'+(n===5?' ASCENSION: the bleed lasts 3 seconds rather than 2.':''));
active('magnet','gravity',8,72,.24,'Warns of a soul well that gently pulls you inward.');
active('split','fan',8,55,.48,'Fires a small aimed fan, only while visible.',{count:3,ascendCount:2,ascend:'ASCENSION: a five-shot fan.'});
passive('void',n=>({vulnerability:.035*n}),n=>'His hits mark you for 2s, increasing subsequent health damage by '+Math.round(n*3.5)+'%.'+(n===5?' ASCENSION: marked hits open a warned gravity well.':''));
active('storm','storm',6.5,43,.7,'Calls a delayed storm rune on your previous position.',{count:1,ascendCount:2,ascend:'ASCENSION: a three-rune thunder sequence.'});
active('soul','summon',12,60,.4,'Summons melee attendants; their kills fuel your relics.',{count:1,ascendCount:1,ascend:'ASCENSION: summons two tougher attendants.'});
active('ricochet','return',8,60,.5,'Launches a visible returning bolt; it expires at the screen edge.',{count:1,ascendCount:1,ascend:'ASCENSION: two returning bolts.'});
passive('execute',n=>({execute:.08*n}),n=>'Deals '+n*8+'% extra damage while you are below 30% health. Never instantly executes you.'+(n===5?' ASCENSION: the threshold rises to 40%.':''));
passive('fortify',n=>({fortify:.025*n}),n=>'Reduces damage by '+(n*2.5).toFixed(1)+'% during his wind-up, never during recovery.'+(n===5?' ASCENSION: heavy wind-ups create a delayed close-range shockwave.':''));
passive('overdrive',n=>({enrage:.045*n}),n=>'Below half health, recovery becomes '+(n*4.5).toFixed(1)+'% shorter.'+(n===5?' ASCENSION: enraged swipes ignite a warned patch.':''));
passive('phoenix',n=>({secondLife:.1+.025*n}),n=>'Returns once at '+Math.round((.1+.025*n)*100)+'% health. Cannot stack with Second Heart.'+(n===5?' ASCENSION: his last stand begins with warned flames.':''));
active('trinity','fan',8.5,50,.65,'Fires a telegraphed heavy-bolt fan.',{count:3,ascendCount:2,ascend:'ASCENSION: five heavy bolts.'});
active('curse','nova',7.5,78,.48,'Warns of a close-range damaging curse around himself.');
active('seraph','lance',9,42,.7,'Drops a clearly marked cursed lance.',{count:1,ascendCount:2,ascend:'ASCENSION: three staggered falling lances.'});
passive('coin',n=>({covenantHp:.01*n}),n=>'Gains '+n+'% maximum health per covenant, capped at ten covenants.'+(n===5?' ASCENSION: also gains 10% attack damage.':''));
active('scythe','scythe',8,65,.65,'Sweeps a large, warned crescent in your direction.',{count:1,ascendCount:1,ascend:'ASCENSION: a second crescent follows.'});
passive('marrow',n=>({hp:.045*n,missingDamage:.04*n}),n=>'Gains '+(n*4.5).toFixed(1)+'% health and up to '+n*4+'% damage as his health falls.'+(n===5?' ASCENSION: movement rises 15% below 30% health.':''));
active('eclipse','crescent',9,60,.52,'Launches a pair of visible lunar crescents.',{count:2,ascendCount:2,ascend:'ASCENSION: four crescents.'});
active('plague','infection',8,52,.32,'Creates a warned infection pool that persists for 3s.');
active('hourglass','ice',9,58,.28,'Places a warned slowing rune at your last position.');
active('raven','feather',8.5,60,.42,'Releases a small, visible feather fan.',{count:3,ascendCount:2,ascend:'ASCENSION: a five-feather echo.'});
passive('seal',n=>({contractDamage:.003*n}),n=>'Gains '+(.3*n).toFixed(1)+'% attack damage per inherited tier, capped at 40 inherited tiers.'+(n===5?' ASCENSION: gains 10% maximum health.':''));
passive('hunter',n=>({execute:.05*n,reach:2*n}),n=>'Swipes reach '+n*2+' farther and deal '+n*5+'% extra damage while you are below 30% health.'+(n===5?' ASCENSION: low-health players trigger an additional warned swipe.':''));
active('choirbone','bone',9,60,.42,'Releases a telegraphed bone fan.',{count:3,ascendCount:2,ascend:'ASCENSION: five bones, followed by a delayed close-range ring.'});
passive('sacrament',n=>({regen:.0015*n}),n=>'Restores '+(.15*n).toFixed(2)+'% maximum health every 8s, within the shared 8% healing budget.'+(n===5?' ASCENSION: healing leaves a warned sacrament rune.':''));
active('brand','brand',8,48,.7,'Brands your last position, then detonates the warning.');
active('needle','needle',7.5,50,.42,'Fires a short, warned needle spread.',{count:3,ascendCount:2,ascend:'ASCENSION: five needles.'});
passive('mantle',n=>({speed:.025*n,recovery:.025*n}),n=>'Movement rises '+(n*2.5).toFixed(1)+'%; recovery shortens by '+(n*2.5).toFixed(1)+'%.'+(n===5?' ASCENSION: lunges leave a delayed wind cut.':''));
active('sun','solar',9,94,.6,'Charges a visible close-range solar nova.');
passive('quarry',n=>({focus:.035*n}),n=>'Each consecutive hit raises attack damage by '+(n*3.5).toFixed(1)+'%, up to three stacks; avoiding damage for 4s clears it.'+(n===5?' ASCENSION: a third hit calls a warned lunar lance.':''));
passive('bellows',n=>({recovery:.025*n,damage:.02*n}),n=>'Attack recovery shortens '+(n*2.5).toFixed(1)+'% and damage rises '+n*2+'%.'+(n===5?' ASCENSION: every fourth attack releases warned wind blades.':''));
active('grave','mine',9,53,.6,'Plants a warned bone mine where you stood.',{count:1,ascendCount:2,ascend:'ASCENSION: three staggered mines.'});
passive('leech',n=>({lifesteal:.12*n,hp:.015*n}),n=>'Hits restore '+n*12+'% of health damage dealt, within the shared healing budget. Gains '+(n*1.5).toFixed(1)+'% maximum health.'+(n===5?' ASCENSION: healing empowers his next swipe.':''));
active('twin','echo',8.5,55,.48,'Fires one bolt, then a delayed echo.',{count:2,ascendCount:1,ascend:'ASCENSION: a third echo.'});
active('chains','gravity',8.5,82,.3,'Creates a warned chain snare that pulls gently inward.');
passive('omen',n=>({lowWard:.4+.2*n}),n=>'Below 35% health, gains a brief ward every 10s for '+(.4+.2*n).toFixed(1)+'s.'+(n===5?' ASCENSION: the ward also summons one melee guardian.':''));
active('hands','hand',9,64,.7,'A spectral hand marks and strikes your last position.',{count:1,ascendCount:2,ascend:'ASCENSION: three sequential hand slams.'});
active('prism','prism',8,55,.48,'Sends a warned elemental fan across the screen.',{count:3,ascendCount:2,ascend:'ASCENSION: five elemental bolts.'});
active('anchor','gravity',9,90,.32,'A visible anchor pulls you toward a marked location.');
active('candle','fire',8,49,.3,'Plants a cursed candle that burns after a warning.');
active('tuning','storm',8,40,.58,'Creates a resonance rune; no other Devil relic is required.');
D.BOSS_RULES=B;
D.devilSpec=(id,n)=>B[id]?B[id](Math.max(1,Math.min(5,n|0))):null;
D.devilEffect=(id,n)=>{const spec=D.devilSpec(id,n);return spec?'DEVIL ADAPTATION · '+roman(spec.tier)+' — '+spec.description:'Unknown relic';};
D.difficulty=(cycle,wave)=>{
 const n=Math.max(0,(cycle-1)*10+wave-1);
 // Continuous across covenant boundaries; no reset from a hard wave 10 to an easy wave 1.
 return {hp:(1+.205*n)*Math.pow(1.018,Math.min(n,250)),
 population:Math.min(112,42+Math.floor(n*2.1)),interval:Math.max(.24,.86-.022*n),
 pack:Math.min(5,1+Math.floor(n/12)),elite:Math.min(.34,.035+n*.008),speed:1+Math.min(.24,n*.006)};
};
})(window.DTD);
