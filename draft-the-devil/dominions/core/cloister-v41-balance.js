'use strict';
/* Explicit revision of the 4.0 combat contract. No dynamic code loading/eval. */
(function(D){
const Base=D.Game,TAU=Math.PI*2,clamp=D.clamp,dist=D.distance;
class CovenantGame extends Base{
 reset(){super.reset();this.offerTiers={};this.lastDeal=null;this._damageDepth=0;this._killDepth=0;this.player.afflictions={};}
 calcStats(){
  const stats=super.calcStats();
  if(this.has('leech')&&!this.has('leech',3))stats.damage*=1+(this.has('leech',2)?.12:.08)*clamp((this.blood||0)/(this.has('leech',2)?32:18),0,1);
  return stats;
 }
 eligible(id){
  if(!D.R[id])return false;
  const owned=this.levels[id]||0,next=owned+1;
  // Borrowed tiers are already active; skip their permanent upgrades until the echo expires.
  if(owned<0||owned>=5||this.L(id)>=5||this.echo===id)return false;
  const req=D.requirements(id,next);
  return !req||req.any.some(([source,n])=>(this.levels[source]||0)>=n);
 }
 draft(){
  this.state='draft';this.paused=true;this.input.x=this.input.y=0;
  this.player.vx=this.player.vy=0;this.enemies=[];this.shots=[];this.zones=[];this.tasks=[];
  const pool=D.RELICS.filter(r=>this.eligible(r.id)),opts=[];
  while(opts.length<3&&pool.length){
   let x=this.rand()*pool.reduce((s,r)=>s+(this.levels[r.id]>0?1.2:1),0),j=0;
   for(;j<pool.length-1;j++){x-=this.levels[pool[j].id]>0?1.2:1;if(x<0)break;}
   opts.push(pool.splice(j,1)[0].id);
  }
  this.choices=opts;this.offerTiers=Object.fromEntries(opts.map(id=>[id,(this.levels[id]||0)+1]));
  this.event('draft',{choices:opts});
 }
 take(id){
  if(this.state!=='draft'||!this.choices.includes(id)||!this.eligible(id)||this.offerTiers[id]!==(this.levels[id]||0)+1)return false;
  const rejected=this.choices.filter(x=>x!==id);
  if(!this.gain(id))return false;
  const inherited=rejected.map(key=>{const before=this.devil[key]||0;this.devil[key]=Math.min(5,before+1);return {id:key,before,after:this.devil[key]};});
  this.lastDeal={id,tier:this.levels[id],inherited};this.choices=[];this.offerTiers={};
  this.stats=this.calcStats();this.state='deal';this.paused=true;
  this.event('deal',this.lastDeal);return true;
 }
 give(){return false;} // Both rejected relics are inherited atomically by take().
 afterDraft(){
  if(this.state!=='deal'&&!(this.state==='draft'&&this.choices.length===0))return false;
  this.flags.heart=false;this.waveBuff=0;
  if(this.wave===10){this.state='preboss';this.paused=true;this.event('preboss');}
  else{this.wave++;this.waveTime=0;this.state='wave';this.paused=false;this.event('resume');this.event('toast',{title:'WAVE '+this.wave,text:'BOTH REJECTIONS BECAME HIS'});}
  return true;
 }
 bossStats(){
  const combined={},families={},specs=[];let tiers=0;
  for(const [id,raw] of Object.entries(this.devil)){
   const n=clamp(raw|0,0,5);if(!n||!D.R[id])continue;
   const spec=D.devilSpec(id,n);if(!spec)throw new Error('Missing Devil adaptation: '+id);
   specs.push(spec);tiers+=n;families[D.R[id].element]=(families[D.R[id].element]||0)+n;
   for(const [key,val] of Object.entries(spec.stats))combined[key]=(combined[key]||0)+val;
  }
  const v=id=>(this.devil[id]||0)>=5;
  const life=clamp(1+(combined.hp||0)+(combined.covenantHp||0)*Math.min(10,this.cycle)+(v('seal')?.1:0),.4,3);
  const hp=Math.round(1050*Math.pow(1.58,Math.min(34,this.cycle-1))*(1+.2*Math.max(0,this.cycle-35))*(1+.016*Math.min(150,tiers))*life);
  return {hp,families,specs,combined,tiers,
   damage:(14+Math.min(26,this.cycle*1.2))*(1+(combined.damage||0)+(combined.contractDamage||0)*Math.min(40,tiers)+(v('coin')?.1:0)),
   speed:(94+Math.min(20,this.cycle*2))*(1+Math.min(.6,combined.speed||0)),
   reach:88+Math.min(58,combined.reach||0),recovery:Math.max(.95,1.8*(1-Math.min(.45,combined.recovery||0)))};
 }
 spawnBoss(){
  this.enemies=[];this.shots=[];this.zones=[];this.tasks=[];
  for(const key of Object.keys(this.clocks))if(key.startsWith('boss')||key.startsWith('voidPulse'))delete this.clocks[key];
  const c=this.bossStats(),p=this.player;
  this.boss={id:++this.id,boss:true,type:'devil',x:p.x+Math.min(230,this.view.w*.25),y:p.y-35,r:31,
   hp:c.hp,maxHp:c.hp,speed:c.speed,damage:c.damage,status:{},families:c.families,config:c,
   attack:'walk',clock:1,recovery:c.recovery,face:Math.PI,reach:c.reach,dead:false,ward:0,wardReduction:.3,
   revived:false,visibleTime:0,spellClock:1.8,summonClock:12,healClock:8,wardClock:9,omenClock:10,
   spellIndex:0,attackCount:0,cooldowns:{},healing:0,focusHits:0,lastHit:-99,empowered:false};
  this.state='boss';this.paused=false;this.trophyUsed=false;this.lastDeal=null;
  this.player.afflictions={};this.flags.heart=false;this.input.x=this.input.y=0;
  this.event('resume');this.event('toast',{title:'THE DEVIL · COVENANT '+this.cycle,text:c.tiers+' INHERITED TIERS · '+c.hp.toLocaleString()+' HEALTH'});
 }
 delay(t,fn){super.delay(t,()=>{if(!this.paused&&['wave','boss','lab'].includes(this.state))fn();});}
 shot(...args){if(this.paused)return null;return super.shot(...args);}
 zone(...args){if(this.paused)return null;return super.zone(...args);}
 bossLive(b=this.boss){return Boolean(b&&b===this.boss&&!b.dead&&this.state==='boss'&&!this.paused&&b.hp>0);}
 bossHeal(amount){const b=this.boss;if(!this.bossLive(b)||!Number.isFinite(amount))return 0;const heal=Math.max(0,Math.min(amount,b.maxHp*.08-b.healing,b.maxHp-b.hp));if(!heal)return 0;b.hp+=heal;b.healing+=heal;this.count('bossHealed',heal);this.fx('ward',b.x,b.y,{life:.45});if(this.devil.leech>=5)b.empowered=true;if(this.devil.sacrament>=5)this.bossZone('solar',{x:b.x,y:b.y},54,b.damage*.4);return heal;}
 bossZone(kind,p,r,damage,more={}){
  const b=this.boss;if(!this.bossLive(b)||this.zones.filter(z=>z.enemy).length>=7)return null;
  return this.zone(kind,p,r,damage,3,{enemy:true,warning:.85,source:b,oneHit:!['fire','infection','gravity','ice'].includes(kind),...more});
 }
 summonAttendants(count=2,scale=1){
  const b=this.boss;if(!this.bossLive(b))return;
  for(let i=0;i<count&&this.enemies.filter(e=>!e.dead).length<8;i++){
   const a=i*TAU/Math.max(1,count)+this.rand(),e=this.enemy('penitent',b.x+Math.cos(a)*70,b.y+Math.sin(a)*70,false);
   e.hp=e.maxHp=Math.min(e.maxHp*.55,85*Math.pow(this.cycle,1.1))*scale;e.clock=1.1;this.count('bossAttendant');
  }
 }
 enemyShot(src,a,damage,speed=210,more={}){
  if(!src||src.dead||!this.visible(src,12)||this.shots.length>=480||this.shots.filter(s=>s.owner==='e').length>=64)return null;
  const s={id:++this.id,x:src.x,y:src.y,px:src.x,py:src.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,
   r:5,life:1.9,age:0,damage,owner:'e',kind:'hostile',source:src,...more};this.shots.push(s);this.count('hostileShot');return s;
 }
 bossPattern(spec){
  const b=this.boss;if(!this.bossLive(b)||!this.visible(b,20))return;
  const A=spec.ability;if(!A)return;
  const {kind,radius,power,count,tier,id}=A,p={x:this.player.x,y:this.player.y},origin={x:b.x,y:b.y};
  b.activeName=D.R[id].name;b.activeUntil=this.time+1.8;b.castingUntil=this.time+.85;
  this.count('bossRelic:'+id);this.fx('ward',b.x,b.y,{life:.75});
  const ranged=['mirror','fan','feather','bone','crescent','echo','return','needle','prism','thorns'];
  if(ranged.includes(kind)){
   const a=Math.atan2(p.y-origin.y,p.x-origin.x),n=count;
   this.fx('swipe',origin.x,origin.y,{a,r:72,life:.85});
   for(let i=0;i<n;i++)this.delay(.85+(kind==='echo'?i*.25:0),()=>{
    if(!this.bossLive(b)||!this.visible(b,24))return;
    const offset=(i-(n-1)/2)*.19,sp=205*(1+Math.min(.25,b.config.combined.projectileSpeed||0));
    this.enemyShot(b,a+offset,b.damage*power,sp,{returning:kind==='return',kind:kind==='crescent'?'crescent':'hostile',r:id==='trinity'?7:4.5});
   });
   if(tier===5&&kind==='bone')this.delay(1.4,()=>{if(this.bossLive(b))this.bossZone('blast',origin,85,b.damage*.4);});
   if(tier===5&&kind==='thorns')this.delay(1.2,()=>{if(this.bossLive(b))this.bossZone('thorn',origin,65,b.damage*.4);});
  }else if(kind==='summon'){
   this.delay(.85,()=>{if(this.bossLive(b))this.summonAttendants(count,tier===5?1.2:1);});
  }else{
   const close=['blades','scythe','nova','solar'].includes(kind),centre=close?origin:p;
   for(let i=0;i<count;i++)this.delay(i*.38,()=>{
    if(!this.bossLive(b))return;
    const at={x:centre.x+(close?0:(i-(count-1)/2)*48),y:centre.y+(close?0:Math.sin(i*1.8)*28)};
    const shape=['blades','scythe'].includes(kind)?'arc':'circle',angle=Math.atan2(p.y-origin.y,p.x-origin.x)+i*.8;
    this.bossZone(kind,at,radius,b.damage*power,{shape,a:angle,oneHit:!['fire','infection','gravity','ice'].includes(kind),life:kind==='infection'?3.85:3});
   });
  }
 }
 updateBoss(dt){
  const b=this.boss;if(!b||b.dead||this.state!=='boss')return;
  if(b.hp<=0){this.defeatBoss();return;}
  this.tickStatus(b,dt);if(!this.bossLive(b))return;if(this.hasStatus(b,'freeze'))return;
  const p=this.player,C=b.config.combined,v=id=>(this.devil[id]||0)>=5;
  const a=Math.atan2(p.y-b.y,p.x-b.x),d=dist(b,p);b.face=a;b.visibleTime=this.visible(b,20)?b.visibleTime+dt:0;
  b.clock-=dt;b.ward=Math.max(0,b.ward-dt);b.spellClock-=dt;
  if(this.time-b.lastHit>4)b.focusHits=0;
  const recovering=Math.max(.85,b.recovery*(b.hp/b.maxHp<.5?1-Math.min(.3,C.enrage||0):1));
  const finish=()=>{b.attack='recover';b.clock=recovering;b.attackCount++;b.castingUntil=0;};
  const sweep=()=>{
   const delta=Math.atan2(Math.sin(a-b.aim),Math.cos(a-b.aim));
   if(d<b.reach+p.r&&Math.abs(delta)<1.3)this.hurt(b.damage,b);
   this.fx('swipe',b.x,b.y,{a:b.aim,r:b.reach,life:.35});
   if(v('pierce'))this.bossZone('lance',{x:b.x+Math.cos(b.aim)*105,y:b.y+Math.sin(b.aim)*105},25,b.damage*.55);
   if(v('overdrive')&&b.hp/b.maxHp<.5)this.bossZone('fire',{x:b.x,y:b.y},45,b.damage*.25);
   if(v('rapid')&&(b.attackCount+1)%3===0)this.bossZone('scythe',{x:b.x,y:b.y},b.reach,b.damage*.6,{shape:'arc',a:b.aim});
   if(v('hunter')&&p.hp/this.stats.maxHp<.3)this.bossZone('scythe',{x:p.x,y:p.y},42,b.damage*.4);
  };
  if(b.attack==='windup'){
   if(b.clock<=0){if(b.move==='lunge'){b.attack='lunge';b.clock=.33;b.lungeStart={x:b.x,y:b.y};}else{sweep();finish();}}
  }else if(b.attack==='lunge'){
   const speed=400*(1+Math.min(.45,C.lunge||0));b.x+=Math.cos(b.aim)*speed*dt;b.y+=Math.sin(b.aim)*speed*dt;
   if(dist(b,p)<b.r+p.r+5)this.hurt(b.damage,b);
   if(b.clock<=0){if(v('swift')||v('mantle'))this.bossZone('scythe',b.lungeStart,58,b.damage*.4,{shape:'arc',a:b.aim});finish();}
  }else if(b.attack==='recover'){
   if(b.clock<=0){b.attack='walk';b.clock=.4;}
  }else{
   const slow=this.hasStatus(b,'freeze')?.3:1-(b.status.chill?.left>0?Math.min(.25,b.status.chill.power):0);
   const casting=this.time<(b.castingUntil||0),lowSpeed=v('marrow')&&b.hp/b.maxHp<.3?1.15:1;
   if(d>70&&!casting){b.x+=Math.cos(a)*b.speed*dt*slow*lowSpeed;b.y+=Math.sin(a)*b.speed*dt*slow*lowSpeed;}
   if(b.clock<=0&&b.visibleTime>.5&&!casting){b.move=d>135?'lunge':'swipe';b.attack='windup';b.clock=.72;b.aim=a;b.reach=b.config.reach;
    if(v('fortify'))this.bossZone('blast',{x:b.x,y:b.y},70,b.damage*.4);
    if(v('bellows')&&(b.attackCount+1)%4===0)this.bossPattern(D.devilSpec('raven',2));
   }
  }
  // Per-ability cooldowns + one shared budget: a huge relic collection cannot create 56 simultaneous warnings.
  for(const spec of b.config.specs)if(spec.ability)b.cooldowns[spec.id]=(b.cooldowns[spec.id]??spec.ability.cooldown)-dt;
  b.silence=Math.max(0,(b.silence||0)-dt);
  const list=b.config.specs.filter(s=>s.ability);
  if(b.spellClock<=0&&b.visibleTime>.7&&!b.silence&&b.attack!=='lunge'&&list.length){
   for(let n=0;n<list.length;n++){const i=(b.spellIndex+n)%list.length,spec=list[i];if(b.cooldowns[spec.id]<=0){this.bossPattern(spec);b.cooldowns[spec.id]=spec.ability.cooldown;b.spellIndex=(i+1)%list.length;b.spellClock=1.6;break;}}
  }
  b.summonClock-=dt;if(b.summonClock<=0){b.summonClock=14;this.summonAttendants(2);}
  if(C.regen){b.healClock-=dt;if(b.healClock<=0){b.healClock=8;this.bossHeal(b.maxHp*Math.min(.025,C.regen));}}
  if(C.wardDuration){b.wardClock-=dt;if(b.wardClock<=0){b.wardClock=9;b.ward=C.wardDuration;b.wardReduction=C.wardReduction;if(v('ward'))this.bossZone('nova',{x:b.x,y:b.y},95,b.damage*.35);}}
  if(C.lowWard&&b.hp/b.maxHp<.35){b.omenClock-=dt;if(b.omenClock<=0){b.omenClock=10;b.ward=Math.max(b.ward,C.lowWard);b.wardReduction=Math.max(.25,b.wardReduction);if(v('omen'))this.summonAttendants(1);}}
 }
 damage(e,value,m={}){
  if(!e||e.dead||this.paused||!['wave','boss','lab'].includes(this.state)||!Number.isFinite(value))return 0;
  if(e.hp<=0){if(e.boss)this.defeatBoss();else this.kill(e,m.depth||0);return 0;}
  if(e.boss){
   const C=e.config?.combined||{};
   // Base engine applies 30% ward reduction; compensate to the actual relic's reduction.
   if(e.ward>0)value*=(1-clamp(e.wardReduction||.3,0,.65))/.7;
   if(e.attack==='windup'&&C.fortify)value*=1-Math.min(.3,C.fortify);
   if(e.attack==='recover')value*=1.2; // An opening, not artificial invulnerability or damage caps.
  }
  this._damageDepth++;
  let dealt=0;
  try{dealt=super.damage(e,value,m);
   // Lightning on an isolated Devil has a small direct arc rather than vanishing for lack of a second target.
   if(e.boss&&e.hp>0&&!m.depth&&this.has('fork')&&!this.near(e,this.has('fork',3)?240:150,[e.id])){
    const arc=this.stats.damage*(this.has('fork',2)?.25:.2)*(this.has('fork',5)&&this.seq%5===0?2:1);
    super.damage(e,arc,{kind:'lightning',depth:1,status:false,crit:false});this.fx('lightning',this.player.x,this.player.y,{x2:e.x,y2:e.y,life:.2});
   }
  }finally{this._damageDepth--;}
  if(this._damageDepth===0&&this.boss&&!this.boss.dead&&this.boss.hp<=0&&this.state==='boss')this.defeatBoss();
  return dealt;
 }
 chain(from,damage,jumps,depth=1,kind='lightning'){
  if(kind==='resonance'&&from.boss&&!this.near(from,this.has('fork',3)?240:150,[from.id])){
   this.damage(from,damage,{kind,depth:2,status:false,crit:false});
   if(this.has('tuning',4))this.status(from,'chill',2,.45);
   this.count('isolatedResonance');return;
  }
  return super.chain(from,damage,jumps,depth,kind);
 }
 collect(pickup){if(!this.paused)return super.collect(pickup);}
 kill(e,depth=0,meta={}){
  if(!e||e.dead)return;
  if(e.boss){if(this._damageDepth===0)this.defeatBoss();return;}
  // DoT kills must still award on-kill relics. Bound recursive chain-reaction depth, not the first DoT kill.
  this._killDepth++;
  try{super.kill(e,this._killDepth<=4?Math.min(1,depth):2,meta);}
  finally{this._killDepth--;}
 }
 tickStatus(e,dt){
  if(!e||e.dead)return;
  const revived=e.revived;
  for(const [kind,s] of Object.entries(e.status||{})){
   if(s.left<=0)continue;const elapsed=Math.min(s.left,dt);s.left-=elapsed;
   if(['burn','bleed','infection'].includes(kind))this.damage(e,s.power*elapsed*(kind==='infection'&&this.syn('plague','void')&&this.hasStatus(e,'void')?1.3:1),{kind,depth:2,status:false,crit:false});
   if(e.dead||this.paused||e.revived!==revived)return;
   if(kind==='bleed'&&s.left<=0){e.bleed=0;s.power=0;}
  }
  if(e.brand&&e.brand.at<=this.time)this.detonateBrand(e);
  if(!e.dead&&!this.paused&&this.has('void',4)&&(e.elite||e.boss)&&this.hasStatus(e,'void')&&this.ready('voidPulse'+e.id,2.4,dt))this.blast(e,85,this.stats.damage*.65,'voidPulse',2);
 }
 hurt(value,source){
  if(this.paused||this.player.ifr>0||this.player.ward>0)return false;
  const b=source?.boss?source:null,C=b?.config?.combined||{},p=this.player,aff=p.afflictions||(p.afflictions={});
  if(aff.voidUntil>this.time)value*=1+aff.voidPower;
  if(b){
   if(p.hp/this.stats.maxHp<((this.devil.execute||0)>=5?.4:.3))value*=1+(C.execute||0);
   value*=1+(C.missingDamage||0)*(1-b.hp/b.maxHp)+(C.focus||0)*(b.focusHits||0);
   if(this.devil.glass>=5&&b.hp/b.maxHp<.4)value*=1.25;
   const chance=(C.crit||0)+(this.devil.crit>=5?(b.critPity||0)*.02:0);
   if(chance&&this.rand()<chance){value*=C.critMult||1.5;b.critPity=0;this.count('bossCritical');}else b.critPity=(b.critPity||0)+1;
   if(b.empowered){value*=1.15;b.empowered=false;}
  }
  const before=p.hp,hit=super.hurt(value,source);
  if(hit&&b&&this.bossLive(b)){
   const actual=Math.max(0,before-p.hp);b.focusHits=Math.min(3,(b.focusHits||0)+1);b.lastHit=this.time;
   if(C.lifesteal)this.bossHeal(actual*Math.min(1.5,C.lifesteal));
   if(this.devil.blood>=5)b.empowered=true;
   if(C.slow){p.slow=Math.max(p.slow||0,C.slow);if(this.devil.frost>=5)this.bossZone('ice',{x:p.x,y:p.y},45,b.damage*.2);}
   if(C.bleed){aff.bleedUntil=this.time+(this.devil.bleed>=5?3:2);aff.bleedPower=C.bleed;aff.nextBleed=this.time+.65;}
   if(C.vulnerability){if(aff.voidUntil>this.time&&this.devil.void>=5)this.bossZone('gravity',{x:p.x,y:p.y},55,b.damage*.2);aff.voidUntil=this.time+2;aff.voidPower=C.vulnerability;}
   if(this.devil.quarry>=5&&b.focusHits===3)this.bossZone('lance',{x:p.x,y:p.y},35,b.damage*.35);
  }
  return hit;
 }
 updateShots(dt){
  for(const s of this.shots)if(s.owner==='e'){
   s.age=(s.age||0)+dt;
   if(s.returning&&s.age>.55&&!s.returned&&this.bossLive(s.source)){
    const a=Math.atan2(s.source.y-s.y,s.source.x-s.x),speed=Math.hypot(s.vx,s.vy);s.vx=Math.cos(a)*speed;s.vy=Math.sin(a)*speed;s.returned=true;
   }
   // Returning shots cannot disappear off-screen and later surprise the player.
   if(s.returning&&!this.visible(s,0))s.life=0;
  }
  super.updateShots(dt);
 }
 updateZones(dt){
  for(const z of [...this.zones]){
   if(this.paused)break;z.t+=dt;z.life-=dt;z.tick-=dt;
   if(z.enemy){
    if(z.source?.boss&&!this.bossLive(z.source)){z.life=0;continue;}
    if(z.t<z.warning||z.harmless)continue;
    const d=dist(z,this.player),a=Math.atan2(this.player.y-z.y,this.player.x-z.x),delta=Math.atan2(Math.sin(a-(z.a||0)),Math.cos(a-(z.a||0)));
    const inside=d<z.r+this.player.r&&(z.shape!=='arc'||Math.abs(delta)<1.25);
    if(z.kind==='gravity'&&inside&&this.player.ifr<=0&&d>8){const step=Math.min(45*dt,d-8);this.player.x-=Math.cos(a)*step;this.player.y-=Math.sin(a)*step;}
    if(z.tick<=0){z.tick=.65;if(inside){const hit=this.hurt(z.damage,z.source);if(hit&&z.kind==='ice')this.player.slow=Math.max(this.player.slow||0,.8);}if(z.oneHit){z.life=0;this.fx(z.kind==='hand'?'hand':z.kind==='lance'?'lance':'ring',z.x,z.y,{r:z.r,life:.4,color:'#ff9674'});}}
    continue;
   }
   if(z.pull)this.push(z,z.r,-z.pull*dt);
   if(z.kind==='mine'){
    if(this.area(z,z.r*.5).length){z.life=0;this.blast(z,z.r,z.damage,'mine',2);if(this.has('grave',4))for(const e of this.area(z,z.r)){this.applyBleed(e,2,2);this.status(e,'void',4,.12);}if(this.syn('grave','plague'))this.zone('infection',z,z.r,this.stats.damage*.2,3);}
    continue;
   }
   if(z.tick<=0){z.tick=.25;for(const e of this.area(z,z.r))this.damage(e,z.damage*.25,{kind:z.kind,depth:2,status:false});if(z.kind==='candle'&&this.has('candle',4)&&dist(z,this.player)<z.r)this.heal(.25);}
   if(z.kind==='candle'&&z.life<=0&&this.has('candle',5)){this.blast(z,z.r*1.25,this.stats.damage,'fire',2);for(const e of this.area(z,z.r*1.25))this.damage(e,.1,{kind:'candleFinal',depth:2,status:true});}
  }
  this.zones=this.zones.filter(z=>z.life>0);
 }
 defeatBoss(){
  const b=this.boss;if(!b||b.dead||this.state!=='boss'||b.hp>0)return;
  const life=b.config?.combined?.secondLife||0;
  if(life&&!b.revived){
   b.revived=true;b.hp=b.maxHp*Math.min(.25,life);b.status={};b.brand=null;b.needles=0;b.bleed=0;b.attack='recover';b.clock=1.2;
   this.shots=[];this.zones=[];this.tasks=[];this.player.ifr=Math.max(this.player.ifr,1);this.count('bossRevival');
   this.event('toast',{title:'LAST STAND',text:'ONE REVIVAL · '+Math.ceil(b.hp)+' HEALTH'});
   if(this.devil.phoenix>=5)this.bossZone('fire',{x:b.x,y:b.y},75,b.damage*.3);return;
  }
  // Suppress the older Phoenix check; all last stands are handled exactly once above.
  b.revived=true;super.defeatBoss();
  // Base cleanup already ran. Filter trophy cards by current prerequisites as well.
 }
 claim(id){
  if(this.state!=='trophy'||this.trophyUsed||!this.choices.includes(id)||!this.eligible(id))return false;
  return super.claim(id);
 }
 event(type,data={}){
  if(type==='trophy'){
   const valid=Object.keys(this.devil||{}).filter(id=>this.devil[id]>0&&this.eligible(id));
   for(let i=valid.length-1;i>0;i--){const j=Math.floor(this.rand()*(i+1));[valid[i],valid[j]]=[valid[j],valid[i]];}
   this.choices=valid.slice(0,3);data={choices:this.choices};
  }
  super.event(type,data);
 }
 passives(dt){if(this.paused)return;super.passives(dt);}
 update(dt){
  if(this.paused)return;
  super.update(dt);if(this.paused)return;
  const a=this.player.afflictions||{};
  if(a.bleedUntil>this.time&&a.nextBleed<=this.time){a.nextBleed=this.time+.65;this.hurt(a.bleedPower*.65);}
 }
}
D.Game=CovenantGame;
// The fallback arc is explicitly described, not a hidden boss-only damage bonus.
D.R.leech.tiers[0]='Store up to 18 overheal as blood charge. Full charge grants 8% damage.';
D.R.leech.tiers[1]='Blood capacity increases to 32; full charge grants 12% damage.';
D.R.fork.tiers[0]='Bolts chain to one nearby target for 35% damage. Against an isolated Devil, the arc deals 20% weapon damage instead.';
D.R.fork.tiers[1]='Chains jump to 2 targets. An isolated Devil takes 25% weapon damage from the fallback arc.';
})(window.DTD);
