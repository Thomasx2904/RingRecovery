const CACHE='draft-the-devil-v4.0.2';
const CORE=[
  './draft-the-devil-app.html',
  './draft-the-devil.webmanifest',
  './draft-the-devil-icon.svg',
  './cloister-v4.css',
  './cloister-v4-data.js',
  './cloister-v4-combat.js',
  './cloister-v4-art.js',
  './cloister-v4-input.js',
  './cloister-v4-ui.js'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k.startsWith('draft-the-devil-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(res=>{
    const copy=res.clone();
    if(new URL(event.request.url).origin===self.location.origin)caches.open(CACHE).then(c=>c.put(event.request,copy));
    return res;
  }).catch(()=>caches.match('./draft-the-devil-app.html'))));
});
