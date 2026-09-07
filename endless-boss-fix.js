'use strict';
// Boss hotfix: guarantee covenant progression and make later Devils harder through mechanics, not HP bloat.
(function(){
  const oldSpawnBoss=spawnBoss;
  const oldUpdateBoss=updateBoss;

  spawnBoss=function(){
    oldSpawnBoss();
    if(!boss)return;
    const relicTiers=Object.values(devilLv).reduce((a,b)=>a+b,0);
    // Previous formula scaled HP extremely aggressively by covenant.
    // New curve keeps fights short while inherited relics provide most of the difficulty.
    const hp=(720 + relicTiers*58) * (1 + (cycle-1)*0.28);
    boss.hp=hp;
    boss.maxHp=hp;
    boss.speed=Math.min(126,84+cycle*5);
    boss.damage=11+cycle*1.5;
    boss.contact=14+cycle*1.5;
    boss._defeatQueued=false;
    boss._defeatAt=0;
    ui.bossFill.style.width='100%';
  };

  function finishDevilNow(){
    if(!boss || boss._defeatQueued)return;
    const lv=id=>devilLv[id]||0;
    // Preserve Phoenix Clause, but only once per boss.
    if(lv('phoenix')>=1 && !boss.revived){
      boss.revived=true;
      boss.hp=Math.max(1,boss.maxHp*(lv('phoenix')>=5?.42:.22));
      toast('THE DEVIL RISES','PHOENIX CLAUSE');
      return;
    }
    boss._defeatQueued=true;
    boss.dead=true;
    boss.hp=0;
    ui.bossFill.style.width='0%';
    ui.boss.classList.remove('on');
    shots=shots.filter(s=>s.owner==='p');
    hazards=hazards.filter(h=>!h.enemy);
    for(let i=0;i<72;i++)particle(boss.x,boss.y,i%3?'#d95c4f':'#d7b463',rnd(300,35));
    if(has('phoenix',4))P.phoenixReady=1;
    boss._defeatAt=performance.now();
    // Use a short explicit transition. A second watchdog below catches any mobile timer edge case.
    setTimeout(()=>{
      if(state==='boss' && boss && boss._defeatQueued)covenantCleared();
    },420);
  }

  updateBoss=function(dt){
    if(state==='boss' && boss && !boss.dead && boss.hp<=0){finishDevilNow();return;}
    oldUpdateBoss(dt);
    if(state==='boss' && boss && !boss.dead && boss.hp<=0)finishDevilNow();
    // If an older boss path marked him dead but failed to transition, recover automatically.
    if(state==='boss' && boss && boss.dead && !boss._defeatQueued){
      boss._defeatQueued=true;
      boss._defeatAt=performance.now();
    }
    if(state==='boss' && boss && boss._defeatQueued && performance.now()-boss._defeatAt>900){
      covenantCleared();
    }
  };

  // Override the legacy completion path too, so all damage sources use the same safe transition.
  beatBoss=function(){finishDevilNow();};
})();
