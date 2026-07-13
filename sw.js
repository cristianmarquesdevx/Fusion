/**
 * Fusion ERP - Service Worker
 * Estrategia: cache-first para assets, network-first para API, fila offline
 */

'use strict';

var CACHE_STATIC = 'fusion-static-v1';
var CACHE_DYNAMIC = 'fusion-dynamic-v1';

var API_DOMAINS = ['supabase.com','supabase.co','njbkbhqioieqfzfaczqs.supabase.com'];

self.addEventListener('install',function(e){e.waitUntil(self.skipWaiting());});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k!==CACHE_STATIC&&k!==CACHE_DYNAMIC) return caches.delete(k);
      }));
    }).then(function(){return self.clients.claim();})
  );
});

self.addEventListener('fetch',function(e){
  var u=new URL(e.request.url);
  if(!u.protocol.startsWith('http'))return;
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'||u.href.includes('supabase-js')){
    e.respondWith(cacheFirst(e.request));return;
  }
  if(isApi(u)){
    if(e.request.method==='GET') e.respondWith(netFirst(e.request));
    else e.respondWith(netQueue(e.request));
    return;
  }
  if(e.request.mode==='navigate'){e.respondWith(netFirst(e.request));return;}
  if(isAsset(u)){e.respondWith(cacheFirst(e.request));return;}
  e.respondWith(fetch(e.request).catch(function(){return caches.match(e.request);}));
});

function cacheFirst(r){
  return caches.match(r).then(function(c){
    if(c){fetch(r).then(function(res){if(res&&res.ok){caches.open(CACHE_STATIC).then(function(ca){ca.put(r,res);});}}).catch(function(){});return c;}
    return fetch(r).then(function(res){if(res&&res.ok){var cl=res.clone();caches.open(CACHE_STATIC).then(function(ca){ca.put(r,cl);});}return res;}).catch(function(){return caches.match(r);});
  });
}

function netFirst(r){
  return fetch(r).then(function(res){
    if(res&&res.ok){var cl=res.clone();caches.open(CACHE_DYNAMIC).then(function(ca){ca.put(r,cl);});}
    return res;
  }).catch(function(){
    return caches.match(r).then(function(c){
      if(c)return c;
      if(r.mode==='navigate'){
        return new Response('<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Fusion - Offline</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0f0f12;color:#e0e0e0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center}.card{background:#1a1a20;border:1px solid #2a2a35;border-radius:16px;padding:40px;max-width:400px}h1{font-size:22px;margin:0 0 8px}p{color:#888;margin:0 0 24px;font-size:14px;line-height:1.5}.glyph{width:48px;height:48px;background:#9C7A3E;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;margin-bottom:16px}.btn{background:#9C7A3E;color:#fff;border:none;padding:10px 24px;border-radius:10px;font-size:14px;cursor:pointer}.btn:hover{background:#b08f4e}</style></head><body><div class="card"><div class="glyph">F</div><h1>Voce esta offline</h1><p>Operando em modo offline. Dados serao sincronizados automaticamente.</p><button class="btn" onclick="window.location.reload()">Tentar novamente</button></div></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
      }
      return new Response(JSON.stringify({offline:true,error:'Sem conexao'}),{status:503,headers:{'Content-Type':'application/json'}});
    });
  });
}

function netQueue(r){
  return fetch(r).catch(function(){
    return addToQueue(r).then(function(){
      return new Response(JSON.stringify({queued:true,message:'Operacao enfileirada'}),{status:202,headers:{'Content-Type':'application/json'}});
    });
  });
}

var DB_NAME='fusion-sync-queue',DB_V=1,STORE='mutations';

function getDB(){
  return new Promise(function(res,rej){
    var req=indexedDB.open(DB_NAME,DB_V);
    req.onupgradeneeded=function(e){var db=e.target.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id',autoIncrement:true});};
    req.onsuccess=function(e){res(e.target.result);};
    req.onerror=function(e){rej(e.target.error);};
  });
}

function addToQueue(r){
  return getDB().then(function(db){
    return new Promise(function(res,rej){
      var tx=db.transaction(STORE,'readwrite');
      var s=tx.objectStore(STORE);
      s.add({url:r.url,method:r.method,timestamp:Date.now(),retries:0,maxRetries:5});
      tx.oncomplete=function(){res();self.clients.matchAll().then(function(cls){cls.forEach(function(c){c.postMessage({type:'QUEUE_SIZE'});});});};
      tx.onerror=function(){rej(tx.error);};
    });
  });
}

function processQueue(){
  return getDB().then(function(db){
    return new Promise(function(res){
      var tx=db.transaction(STORE,'readonly');
      var getAll=tx.objectStore(STORE).getAll();
      getAll.onsuccess=function(){
        var entries=getAll.result||[];
        if(!entries.length){res(0);return;}
        var done=0,left=entries.length;
        entries.forEach(function(e){
          fetch(e.url,{method:e.method||'POST'}).then(function(resp){
            if(resp.ok){done++;removeEntry(e.id);}else incRetry(e.id);
          }).catch(function(){incRetry(e.id);}).then(function(){left--;if(!left)res(done);});
        });
        if(!left)res(done);
      };
      getAll.onerror=function(){res(0);};
    });
  });
}

function removeEntry(id){
  getDB().then(function(db){var tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);});
}

function incRetry(id){
  getDB().then(function(db){
    var tx=db.transaction(STORE,'readwrite');
    var get=tx.objectStore(STORE).get(id);
    get.onsuccess=function(){
      var e=get.result;if(!e)return;e.retries++;
      if(e.retries>=e.maxRetries) tx.objectStore(STORE).delete(id);
      else tx.objectStore(STORE).put(e);
    };
  });
}

function getQueueSize(){
  return getDB().then(function(db){return new Promise(function(res){var c=db.transaction(STORE,'readonly').objectStore(STORE).count();c.onsuccess=function(){res(c.result);};c.onerror=function(){res(0);};});});
}

function isApi(u){return API_DOMAINS.some(function(d){return u.hostname.indexOf(d)>=0||u.hostname===d;});}

function isAsset(u){if(u.origin!==location.origin)return false;var p=u.pathname;return p.indexOf('/assets/')>=0||p.endsWith('.js')||p.endsWith('.css')||p.endsWith('.svg')||p.endsWith('.png')||p.endsWith('.ico')||p.endsWith('.woff')||p.endsWith('.woff2');}

self.addEventListener('message',function(e){
  var d=e.data||{};
  if(d.type==='SYNC_NOW'){processQueue().then(function(c){e.source.postMessage({type:'SYNC_COMPLETE',count:c});});}
  if(d.type==='GET_QUEUE_SIZE'){getQueueSize().then(function(s){e.source.postMessage({type:'QUEUE_SIZE',size:s});});}
  if(d.type==='ADD_MUTATION'&&d.mutation){
    getDB().then(function(db){var tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).add({url:d.mutation.url,method:d.mutation.method||'POST',timestamp:Date.now(),retries:0,maxRetries:5});});
  }
});
