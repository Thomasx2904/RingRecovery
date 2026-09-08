'use strict';
(function(D){
/** Pointer capture owns the entire drag, not just the visible joystick circle.
 * Document listeners are a fallback when an embed/browser releases capture.
 * A visible iframe losing focus is NOT a request to pause gameplay.
 */
D.bindControls=function({game,joystick,stick,dashButton,onEscape}){
  if(!game||!joystick||!stick||!dashButton)throw new Error('Missing game controls');
  const doc=joystick.ownerDocument,win=doc.defaultView,keys=new Set(),listeners=[];
  const moveKeys=new Set(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright']);
  let activeId=null,dashId=null,axisX=0,axisY=0;
  joystick.style.touchAction='none';
  joystick.style.userSelect='none';
  dashButton.style.touchAction='none';
  stick.style.pointerEvents='none';
  function listen(target,type,fn,options){
    target.addEventListener(type,fn,options);
    listeners.push(()=>target.removeEventListener(type,fn,options));
  }
  function prevent(e){if(e.cancelable)e.preventDefault();}
  function capture(el,id){try{el.setPointerCapture(id);}catch(_){/* Document fallback stays active. */}}
  function release(el,id){
    if(id===null)return;
    try{if(el.hasPointerCapture(id))el.releasePointerCapture(id);}catch(_){}
  }
  function sync(){
    if(game.paused){game.input.x=game.input.y=0;return;}
    game.input.x=activeId!==null?axisX:
      (keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
    game.input.y=activeId!==null?axisY:
      (keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
    if(game.input.x===0&&game.input.y===0){game.player.vx=game.player.vy=0;}
  }
  function move(e){
    const r=joystick.getBoundingClientRect(),radius=Math.max(1,r.width*.37);
    const dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;
    const length=Math.hypot(dx,dy),scale=length>radius?radius/length:1;
    axisX=dx*scale/radius;axisY=dy*scale/radius;
    stick.style.transform=`translate(${dx*scale}px,${dy*scale}px)`;
    sync();
  }
  function stopJoystick(){
    const id=activeId;activeId=null;axisX=axisY=0;
    stick.style.transform='';release(joystick,id);sync();
  }
  function stopDash(){const id=dashId;dashId=null;release(dashButton,id);}
  function reset(){
    keys.clear();stopJoystick();stopDash();
    game.input.x=game.input.y=0;game.player.vx=game.player.vy=0;
  }
  listen(joystick,'pointerdown',e=>{
    if(game.paused||activeId!==null||(e.pointerType!=='touch'&&e.button!==0))return;
    prevent(e);activeId=e.pointerId;capture(joystick,activeId);move(e);
  },{passive:false});
  // Track the owning pointer anywhere in the document, including outside the
  // stick, over another control, or after an unexpected lostpointercapture.
  listen(doc,'pointermove',e=>{
    if(e.pointerId!==activeId)return;
    if(game.paused){stopJoystick();return;}
    if((e.pointerType==='mouse'||e.pointerType==='pen')&&(e.buttons&1)===0){
      stopJoystick();return; // Recover a release that happened outside the page.
    }
    prevent(e);move(e);
  },{capture:true,passive:false});
  function end(e){
    if(e.pointerId===activeId){prevent(e);stopJoystick();}
    if(e.pointerId===dashId){prevent(e);stopDash();}
  }
  listen(doc,'pointerup',end,{capture:true,passive:false});
  listen(doc,'pointercancel',end,{capture:true,passive:false});
  listen(dashButton,'pointerdown',e=>{
    if(game.paused||dashId!==null||(e.pointerType!=='touch'&&e.button!==0))return;
    prevent(e);dashId=e.pointerId;capture(dashButton,dashId);game.dash();
  },{passive:false});
  // Do not reset on pointerleave, pointerout or lostpointercapture. None of
  // these means that the player released their mouse button or finger.
  for(const el of [joystick,dashButton]){
    listen(el,'dragstart',prevent);
    listen(el,'contextmenu',prevent);
  }
  function editing(target){
    return target instanceof win.Element&&Boolean(target.closest('input,select,textarea,[contenteditable="true"]'));
  }
  listen(win,'keydown',e=>{
    if(editing(e.target))return;
    const k=e.key.toLowerCase();
    if(k==='escape'){
      prevent(e);if(!e.repeat&&onEscape)onEscape();return;
    }
    if(game.paused)return;
    if(k===' '){prevent(e);if(!e.repeat)game.dash();return;}
    if(!moveKeys.has(k))return;
    prevent(e);keys.add(k);sync();
  });
  listen(win,'keyup',e=>{
    const k=e.key.toLowerCase();if(!moveKeys.has(k))return;
    keys.delete(k);sync();
  });
  listen(win,'blur',()=>{
    // Embedded previews may blur while a drag is still active. Clear keyboard
    // keys to prevent stuck WASD, but preserve the pointer-owned drag and never
    // open the pause menu here. The UI pauses on actual page visibility loss.
    keys.clear();if(doc.hidden)reset();else sync();
  });
  listen(doc,'visibilitychange',()=>{if(doc.hidden)reset();});
  listen(win,'pagehide',reset);
  return {
    reset,
    state:()=>({pointerId:activeId,dashPointerId:dashId,x:game.input.x,y:game.input.y}),
    dispose:()=>{reset();for(const off of listeners)off();}
  };
};
})(window.DTD=window.DTD||{});
