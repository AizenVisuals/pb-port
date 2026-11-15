import{test}from'node:test';import assert from'node:assert/strict';import{readFile,access}from'node:fs/promises';import{KANTO_KEYS}from'../public/pulse/kanto.js';import{bannerPool}from'../public/pulse/banners.js';import{createProgression}from'../public/pulse/progression.js';
const roster=JSON.parse(await readFile(new URL('../public/roster.json',import.meta.url)));
test('Kanto banner only summons base forms and every Kanto species has usable legal acquisition moves and assets',async()=>{
 const pool=bannerPool(roster,'route');assert.equal(pool.length,59);assert.equal(new Set(pool.map(m=>m.num)).size,59);assert.equal(KANTO_KEYS.length,151);
 for(const m of roster.filter(m=>KANTO_KEYS.includes(m.key))){await access(new URL('../public/'+m.icon.file,import.meta.url));await access(new URL('../public/assets/portraits/'+m.dex+'_Normal.png',import.meta.url));
  const p=createProgression({profileMode:'journey',storage:{getItem:()=>null,setItem(){}}});assert(p.setCatalog(roster).ok);const s=JSON.parse(p.exportSave());s.journey.starter='bulbasaur';s.unlocked=[m.key];s.favorite=m.key;s.team={mons:[m.key],moves:{},gimmick:null};s.growth.pokemon={[m.key]:{xp:125}};assert(p.importSave(JSON.stringify(s)).ok,m.key);assert(p.setCatalog(roster).ok);assert(p.getTeam().moves[m.key].length,m.key);
 }
});
