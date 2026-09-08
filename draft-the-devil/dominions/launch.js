'use strict';
(async()=>{
  const boot=document.getElementById('boot');
  const fail=error=>{console.error(error);boot.style.display='grid';boot.replaceChildren();const wrap=document.createElement('div'),title=document.createElement('strong'),text=document.createElement('small'),retry=document.createElement('button');title.textContent='The seal did not open.';text.textContent=error.message||'A game file could not load. Please reopen while online.';retry.textContent='RELOAD';retry.style.cssText='margin-top:20px;padding:12px 28px;background:#64251e;color:#ead6b9;border:1px solid #aa794d';retry.onclick=()=>location.reload();wrap.append(title,text,retry);boot.append(wrap);};
  try{
    boot.querySelector('small').textContent='Unsealing the dominions…';
    const load=async path=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),25000);try{const r=await fetch(path,{signal:c.signal,cache:'no-cache'});if(!r.ok)throw new Error('Missing game file: '+path);return await r.text();}finally{clearTimeout(t);}};
    const pieces=await Promise.all(Array.from({length:12},(_,i)=>load('./parts/'+String(i).padStart(2,'0')+'.txt')));
    const repairs=JSON.parse(await load('./repairs.json'));
    for(const [i,edits] of Object.entries(repairs))for(const [at,remove,insert] of edits.sort((a,b)=>b[0]-a[0]))pieces[+i]=pieces[+i].slice(0,at)+insert+pieces[+i].slice(at+remove);
    const raw=Uint8Array.from(atob(pieces.join('')),c=>c.charCodeAt(0));
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),b=>b.toString(16).padStart(2,'0')).join('');
    if(digest!=='4fb57651dc768f90728762bca7faf538b843d5eda19c1bd70e57bceaf8d3d629')throw new Error('The game download was incomplete. Please reload.');
    if(typeof DecompressionStream==='undefined')throw new Error('Open this build in an up-to-date Safari or Chrome.');
    const pack=JSON.parse(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).text());
    window.INFERNO_ASSETS=pack.assets;
    const style=document.createElement('style');style.textContent=pack.css.replace(/url\(['"]?\.\/assets\/([^)'"\s]+)['"]?\)/g,(_,name)=>'url("'+pack.assets[name]+'")');document.head.appendChild(style);
    (0,eval)(pack.code[0]);(0,eval)(pack.code[1]);
    if(!await DTD.artReady)throw new Error('The illustrated assets could not be decoded.');
    (0,eval)(pack.code[2]);
    if(!window.__DTD__||!__DTD__.controls)throw new Error('Game input did not initialise.');
    DTD.VERSION='5.0.1';__DTD__.version='5.0.1';
    boot.style.display='none';
    document.documentElement.classList.toggle('standalone',matchMedia('(display-mode: standalone)').matches||navigator.standalone===true);
    if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(e=>console.warn('Offline cache unavailable',e));
  }catch(e){fail(e);}
})();
