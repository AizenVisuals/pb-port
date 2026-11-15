import {test} from 'node:test';import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import{createProgression}from'../public/pulse/progression.js';import{SUMMON_BANNERS,bannerPool,isSummonable}from'../public/pulse/banners.js';import{EVOLUTIONS,STONE_EVOLUTIONS}from'../public/pulse/growth.js';
const roster=JSON.parse(await readFile(new URL('../public/roster.json',import.meta.url)));const fixture=()=>{const p=createProgression({storage:null,rng:()=>0});p.setCatalog(roster);const s=JSON.parse(p.exportSave());s.coins=5000;s.tickets=100;p.importSave(JSON.stringify(s));return p};
test('three banners have distinct real pools; premium night has SR/SSS and no common tier',()=>{
  const p=fixture(),c=p.getCatalog();
  assert.equal(SUMMON_BANNERS.length,3);
  const count=(pool,t)=>pool.filter(m=>m.rarity===t).length;
  for(const b of SUMMON_BANNERS){
    const pool=bannerPool(c,b.id);
    assert.ok(pool.length>0,b.id+' needs a pool');
    if(b.premium){
      assert.ok(!pool.some(m=>m.rarity==='C'),b.id+' premium has no common tier');
      assert.ok(!pool.some(m=>m.rarity==='R'),b.id+' premium has no rare tier');
      assert.ok(pool.some(m=>m.rarity==='SR'),b.id+' premium needs SR');
      assert.ok(pool.some(m=>m.rarity==='SSS'),b.id+' premium needs SSS');
    }else{
      assert.ok(pool.some(m=>m.rarity==='C'),b.id+' needs a common tier');
      assert.ok(pool.some(m=>m.rarity==='R'),b.id+' needs a rare tier');
      assert.ok(pool.some(m=>['R','SR','UR','SSS'].includes(m.rarity)),b.id+' needs a pity tier');
    }
    if(b.types)assert.ok(pool.every(m=>m.types.some(t=>b.types.includes(t))));
  }
  const route=bannerPool(c,'route'),battle=bannerPool(c,'battle'),night=bannerPool(c,'night');
  assert.deepEqual({C:count(route,'C'),R:count(route,'R'),SR:count(route,'SR'),UR:count(route,'UR'),SSS:count(route,'SSS')},{C:20,R:18,SR:16,UR:4,SSS:1});
  assert.equal(route.length,59);
  assert.deepEqual({C:count(battle,'C'),R:count(battle,'R'),SR:count(battle,'SR'),UR:count(battle,'UR'),SSS:count(battle,'SSS')},{C:2,R:8,SR:4,UR:0,SSS:1});
  assert.equal(battle.length,15);
  assert.deepEqual([...battle.filter(m=>m.rarity==='C').map(m=>m.key)].sort(),['geodude','onix']);
  assert.deepEqual({C:count(night,'C'),R:count(night,'R'),SR:count(night,'SR'),UR:count(night,'UR'),SSS:count(night,'SSS')},{C:0,R:0,SR:4,UR:0,SSS:1});
  assert.equal(night.length,5);
});
test('banner pity is independent and invalid banners never charge',()=>{const p=fixture();p.summon(2,'route');p.summon(3,'night');assert.equal(p.getSave().gacha.pity,2);assert.equal(p.getSave().gacha.banners.night.pity,3);assert.equal(p.getSave().gacha.banners.battle,undefined);const before=p.exportSave();assert.equal(p.summon(1,'missing').ok,false);assert.equal(p.exportSave(),before);const bad=JSON.parse(before);bad.gacha.banners.night.pity=10;assert.equal(p.importSave(JSON.stringify(bad)).ok,false);assert.equal(p.exportSave(),before)});

test('no banner pool contains an evolved form',()=>{const p=fixture(),c=p.getCatalog();const targets=new Set([...Object.values(EVOLUTIONS).map(([t])=>t),...Object.values(STONE_EVOLUTIONS).flatMap(o=>Object.values(o))]);for(const b of SUMMON_BANNERS){const pool=bannerPool(c,b.id);assert.ok(pool.length>0,b.id);for(const m of pool){assert.ok(!targets.has(m.key),`${b.id} contains evolved ${m.key}`);assert.ok(isSummonable(m.key)||(b.singleStage||[]).includes(m.key),`${b.id} contains non-summonable ${m.key}`);}}});
test('diamond shop only sells base forms',()=>{const p=createProgression({profileMode:'journey',storage:null,rng:()=>0});p.setCatalog(roster);const s=JSON.parse(p.exportSave());s.diamonds=10000;p.importSave(JSON.stringify(s));for(const key of ['venusaur','charizard','blastoise','gengar','dragonite','tyranitar','alakazam','gyarados','raichu'])assert.equal(p.buyPokemon(key).ok,false,key);for(const key of ['bulbasaur','charmander','gastly','spiritomb','marshadow'])assert.equal(p.buyPokemon(key).ok,true,key);});

test('tiers assign legendaries to UR, mythicals to SSS and pseudo-legendary bases to SR',()=>{const p=fixture(),c=p.getCatalog();const byKey=k=>c.find(m=>m.key===k);assert.equal(byKey('mew').rarity,'SSS');assert.equal(byKey('marshadow').rarity,'SSS');assert.equal(byKey('mewtwo').rarity,'UR');assert.equal(byKey('articuno').rarity,'UR');assert.equal(byKey('dratini').rarity,'SR');assert.equal(byKey('eevee').rarity,'SR');assert.equal(byKey('omanyte').rarity,'SR');assert.equal(byKey('kabuto').rarity,'SR');assert.equal(byKey('rhyhorn').rarity,'SR');assert.equal(byKey('spiritomb').rarity,'SR');assert.equal(byKey('absolNM').rarity,'SR');assert.equal(byKey('shedinjaNM').rarity,'SR');assert.equal(byKey('bulbasaur').rarity,'SR');assert.equal(byKey('charmander').rarity,'SR');assert.equal(byKey('squirtle').rarity,'SR');assert.equal(byKey('magikarp').rarity,'R');assert.equal(byKey('pikachu').rarity,'R');assert.equal(byKey('slowpoke').rarity,'R');assert.equal(byKey('onix').rarity,'C');assert.equal(byKey('hitmonlee').rarity,'R');assert.equal(byKey('hitmonchan').rarity,'R');assert.equal(byKey('aerodactyl').rarity,'SR');assert.equal(byKey('weedle').rarity,'C');assert.equal(byKey('meowth').rarity,'C');});

test('premium night pity guarantees SSS after nine pulls without one',()=>{
  const p=fixture();
  const s=JSON.parse(p.exportSave());s.gacha.banners={night:{pulls:9,pity:9}};assert.equal(p.importSave(JSON.stringify(s)).ok,true);
  const r=p.summon(1,'night');
  assert.equal(r.ok,true);assert.equal(r.pulls[0].guaranteed,true);assert.equal(r.pulls[0].rarity,'SSS');assert.equal(r.pulls[0].key,'marshadow');
  assert.equal(p.getSave().gacha.banners.night.pity,0);
});
