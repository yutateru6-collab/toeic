import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const assets = (await readdir("dist/assets"))
  .filter((f) => /\.(js|css)$/.test(f))
  .map((f) => `/assets/${f}`);
const pages = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable.png",
];
const version = createHash("sha256")
  .update(assets.join("") + (await readFile("dist/index.html", "utf8")))
  .digest("hex")
  .slice(0, 12);
const sw = `const CACHE='part5-${version}';const PRECACHE=${JSON.stringify([...pages, ...assets])};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE))));
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('part5-')||k==='vocab-master-v1')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;
if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{if(r.ok&&(u.pathname==='/'||u.pathname==='/index.html')){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put('/index.html',copy)));}return r;}).catch(()=>caches.match('/index.html')));return;}
if(PRECACHE.includes(u.pathname))e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});`;
await writeFile("dist/sw.js", sw);
console.log(`Offline cache: ${version}, ${assets.length} assets`);
