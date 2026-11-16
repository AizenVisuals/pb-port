import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {EXPANSION_SPECIES} from '../public/custom/expansion-data.js';
import {EXPANSION_LEARNSETS} from '../public/pulse/expansion-learnsets.js';
import {NATIONAL_BASE_KEYS,NATIONAL_LEVEL_EVOLUTIONS} from '../public/pulse/expansion-rules.js';
import {bannerPool,isSummonable} from '../public/pulse/banners.js';
import {createProgression} from '../public/pulse/progression.js';
const roster=JSON.parse(await readFile(new URL('../public/roster.json',import.meta.url)));
const anims=JSON.parse(await readFile(new URL('../public/assets/sprites/anims.json',import.meta.url)));
test('National expansion has real assets, eight directions and canonical legal moves for every added species',async()=>{
 assert.ok(EXPANSION_SPECIES.length>500);
 for(const m of EXPANSION_SPECIES){
  assert.ok(roster.some(r=>r.key===m.key),m.key);
  const rules=EXPANSION_LEARNSETS[m.key];assert.ok(rules,m.key);
  assert.ok(m.pool.length&&m.defaults.length,m.key);
  for(const move of m.pool)assert.ok(rules.levelMoves[move.id]!==undefined||rules.specialMoves.includes(move.id),`${m.key}: ${move.id}`);
  for(const name of ['Idle','Walk','Attack','Hurt']){
   const a=anims[m.dex].anims[name];assert.ok(a,m.key+name);
   const bytes=await readFile(new URL('../public/assets/sprites/'+m.dex+'/'+a.file,import.meta.url));
   assert.equal(bytes.readUInt32BE(16)%a.w,0,m.key);
   assert.ok(bytes.readUInt32BE(20)/a.h>=8,m.key);
   assert.equal(bytes.readUInt32BE(16)/a.w,a.durations.length,m.key);
  }
  await access(new URL('../public/assets/portraits/'+m.dex+'_Normal.png',import.meta.url));
  await access(new URL('../public/assets/sprites/'+m.dex+'/credits.txt',import.meta.url));
 }
});
test('National banner preserves base-only acquisition and canonical unconditional evolution rules',()=>{
 const pool=bannerPool(roster,'national');assert.ok(pool.length>100);
 for(const m of pool)assert.ok(NATIONAL_BASE_KEYS.has(m.key)&&isSummonable(m.key),m.key);
 for(const [from,[to,level]] of Object.entries(NATIONAL_LEVEL_EVOLUTIONS)){
  assert.ok(roster.some(m=>m.key===from));assert.ok(roster.some(m=>m.key===to));assert.ok(level>=2&&level<=100);
 }
 const p=createProgression({storage:null});assert.equal(p.setCatalog(roster).ok,true);
 const catalog=p.getCatalog();
 for(const m of EXPANSION_SPECIES)assert.ok(catalog.some(c=>c.key===m.key));
 assert.equal(catalog.find(m=>m.key==='celebi')?.rarity,'SSS');
});
