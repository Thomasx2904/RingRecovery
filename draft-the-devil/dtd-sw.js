'use strict';
const CACHE='draft-the-devil-v4.1.0';
const ROOT=new URL('./',self.location.href);
const CORE=[
 './','./index.html','./draft-the-devil-app.html','./draft-the-devil.webmanifest','./draft-the-devil-icon.svg',
 './cloister-v4-data.js','./cloister-v4-combat.js','./cloister-v4-art.js','./cloister-v4-input.js',
 './cloister-v4-ui.js?v=4.1.0','./cloister-v4.css','./cloister-v41.css?v=4.1.0',
 './cloister-v41-rules.js?v=4.1.0','./cloister-v41-balance.js?v=4.1.0','./cloister-v41-clarity.js?v=4.1.0'
];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE.map(url=>new Request(new URL(url,ROOT),{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k.startsWith('draft-the-devil-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(request.mode==='navigate'){
   try{const response=await fetch(new Request(request,{cache:'no-cache'}));if(response.ok){await cache.put(request,response.clone());return response;}}catch(_){}
   return await cache.match(request)||await cache.match(new URL('index.html',ROOT).href)||Response.error();
  }
  const hit=await cache.match(request);if(hit)return hit;
  try{const response=await fetch(request);if(response.ok&&response.type==='basic')await cache.put(request,response.clone());return response;}
  catch(_){return new Response('This game asset is unavailable offline.',{status:504,headers:{'Content-Type':'text/plain'}});}
 })());
});
