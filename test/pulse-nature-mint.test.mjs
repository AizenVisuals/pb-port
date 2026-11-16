import{test}from'node:test';import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
import{NATURES,NATURE_KEYS,MINTS,displayStats,natureMultiplier,natureLabel,effectiveNature,xpAt}from'../public/pulse/growth.js';
import{createProgression,SAVE_KEY}from'../public/pulse/progression.js';
import{isSummonable}from'../public/pulse/banners.js';
const BULBASAUR={hp:45,atk:49,def:49,spa:65,spd:65,spe:45};
const roster=JSON.parse(await readFile(new URL('../public/roster.json',import.meta.url),'utf8'));
const storage=()=>{const values=new Map;return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};};
function fixture(options={}){const p=createProgression({storage:storage(),now:()=>Date.UTC(2026,10,15),...options});assert.equal(p.setCatalog(roster).ok,true);if(!p.getSave().starterTicketsClaimed)assert.equal(p.claimStarterTickets().ok,true);return p;}
function journeyFixture(disk,rng=()=>0){const p=createProgression({storage:disk||storage(),profileMode:'journey',rng,now:()=>Date.UTC(2026,10,15)});assert.equal(p.setCatalog(roster).ok,true);return p;}
function setXP(p,key,level){const save=JSON.parse(p.exportSave());save.growth.pokemon[key].xp=xpAt(level);assert(p.importSave(JSON.stringify(save)).ok);}
test('tabela de natures: 25 natures, 5 neutras, 20 com +10%/−10% sem repetição',()=>{
 assert.equal(NATURE_KEYS.length,25);
 assert.deepEqual(NATURE_KEYS.filter(k=>!NATURES[k].up),['hardy','docile','serious','bashful','quirky']);
 const ups=NATURE_KEYS.filter(k=>NATURES[k].up).map(k=>NATURES[k].up);
 const downs=NATURE_KEYS.filter(k=>NATURES[k].down).map(k=>NATURES[k].down);
 for(const stat of ['atk','def','spa','spd','spe']){assert.equal(ups.filter(s=>s===stat).length,4,stat);assert.equal(downs.filter(s=>s===stat).length,4,stat);}
 for(const key of NATURE_KEYS){const n=NATURES[key];if(n.up){assert.notEqual(n.up,n.down,key);assert(!['hp'].includes(n.up));}}
 assert.equal(natureMultiplier('adamant','atk'),1.1);
 assert.equal(natureMultiplier('adamant','spa'),0.9);
 assert.equal(natureMultiplier('adamant','def'),1);
 assert.equal(natureMultiplier('adamant','hp'),1);
 assert.equal(natureMultiplier('hardy','atk'),1);
 assert.equal(natureMultiplier('timid','spe'),1.1);
 assert.equal(natureMultiplier('timid','atk'),0.9);
 assert.equal(natureMultiplier('inexistente','atk'),1);
 assert.equal(natureLabel('adamant'),'Adamant · Atq. ↑ · Atq. Esp. ↓');
 assert.equal(natureLabel('hardy'),'Hardy · Neutra');
 assert.equal(effectiveNature({nature:'hardy',mintNature:'timid'}),'timid');
 assert.equal(effectiveNature({nature:'adamant'}),'adamant');
 assert.equal(effectiveNature({}),'hardy');
});
test('displayStats com nature: Adamant e Timid no Bulbasaur Nv. 40',()=>{
 assert.deepEqual(displayStats(BULBASAUR,40,{nature:'adamant'}),{hp:132,atk:61,def:56,spa:62,spd:69,spe:53});
 assert.deepEqual(displayStats(BULBASAUR,40,{nature:'timid'}),{hp:132,atk:50,def:56,spa:69,spd:69,spe:58});
 // HP nunca muda com nature; neutra é idêntica ao default.
 assert.equal(displayStats(BULBASAUR,40,{nature:'adamant'}).hp,displayStats(BULBASAUR,40).hp);
 assert.deepEqual(displayStats(BULBASAUR,40,{nature:'hardy'}),displayStats(BULBASAUR,40));
});
test('catálogo de mints: 21 mints, uma por nature com efeito + Serious, 500 moedas',()=>{
 assert.equal(Object.keys(MINTS).length,21);
 for(const [id,mint]of Object.entries(MINTS)){
  assert.equal(id,mint.nature+'-mint',id);
  assert.equal(mint.price,500,id);
  assert.equal(mint.name[0],mint.nature[0].toUpperCase(),id);
  assert.match(mint.description,/nature original é preservada/);
 }
 assert.equal(MINTS['adamant-mint'].nature,'adamant');
 assert.equal(MINTS['serious-mint'].nature,'serious');
 assert.equal(MINTS['hardy-mint'],undefined);
 assert.equal(MINTS['docile-mint'],undefined);
 assert.equal(MINTS['bashful-mint'],undefined);
 assert.equal(MINTS['quirky-mint'],undefined);
});
test('inicial sorteia nature e IVs; catálogo expõe os traits',()=>{
 const values=[0.15,0.5,0.5,0.5,0.5,0.5,0.5];
 const p=journeyFixture(storage(),()=>values.shift());
 assert(p.chooseStarter('bulbasaur').ok);
 const record=p.getSave().growth.pokemon.bulbasaur;
 assert.equal(record.nature,'adamant');
 assert.deepEqual(record.ivs,{hp:16,atk:16,def:16,spa:16,spd:16,spe:16});
 const entry=p.getCatalog().find(m=>m.key==='bulbasaur');
 assert.equal(entry.nature,'adamant');
 assert.deepEqual(entry.ivs,{hp:16,atk:16,def:16,spa:16,spd:16,spe:16});
 assert.equal(entry.effectiveNature,'adamant');
 assert.equal(entry.mintNature,null);
 assert.deepEqual(p.getSave().growth.mintInventory,{});
 // Perfil legado não tem progressão: nada de nature/IV lá (e nada quebra).
 const q=fixture();
 assert.equal(q.getSave().growth,undefined);
});
test('invocação nova sorteia traits; duplicata mantém os traits que já tinha',()=>{
 let values=[0.15,0.5,0.5,0.5,0.5,0.5,0.5];
 const p=journeyFixture(storage(),()=>values.shift());
 assert(p.chooseStarter('bulbasaur').ok);
 assert(p.claimStarterTickets().ok);
 values=[0,0,0.15,0.5,0.5,0.5,0.5,0.5,0.5,0,0];
 const first=p.summon();assert(first.ok);assert.equal(first.pulls.length,1);
 const key=first.pulls[0].key,record=p.getSave().growth.pokemon[key];
 assert.equal(record.nature,'adamant',key);
 assert.deepEqual(record.ivs,{hp:16,atk:16,def:16,spa:16,spd:16,spe:16},key);
 const second=p.summon();assert(second.ok);assert.equal(second.pulls[0].duplicate,true);
 assert.equal(second.pulls[0].key,key);
 assert.equal(p.getSave().growth.pokemon[key].nature,'adamant');
 assert.deepEqual(p.getSave().growth.pokemon[key].ivs,{hp:16,atk:16,def:16,spa:16,spd:16,spe:16});
});
test('compra direta sorteia traits',()=>{
 let values=[0.15,0.5,0.5,0.5,0.5,0.5,0.5];
 const p=journeyFixture(storage(),()=>values.shift());
 assert(p.chooseStarter('bulbasaur').ok);
 values=[0.15,0.5,0.5,0.5,0.5,0.5,0.5];
 const mon=p.getCatalog().find(m=>!m.owned&&m.rarity==='C'&&isSummonable(m.key));
 const rich=JSON.parse(p.exportSave());rich.diamonds=1000;assert(p.importSave(JSON.stringify(rich)).ok);
 assert(p.buyPokemon(mon.key).ok);
 assert.equal(p.getSave().growth.pokemon[mon.key].nature,'adamant');
 assert.deepEqual(p.getSave().growth.pokemon[mon.key].ivs,{hp:16,atk:16,def:16,spa:16,spd:16,spe:16});
});
test('comprar e usar mint: cobra 500, muda o efeito e preserva a nature original',()=>{
 const p=journeyFixture();
 assert(p.chooseStarter('bulbasaur').ok);
 assert.equal(p.getSave().coins,600);
 assert(p.buyMint('adamant-mint').ok);
 assert.equal(p.getSave().coins,100);
 assert.equal(p.getSave().growth.mintInventory['adamant-mint'],1);
 assert(!p.buyMint('adamant-mint').ok);
 assert(!p.buyMint('unknown-mint').ok);
 const locked=p.getCatalog().find(m=>!m.owned).key;
 assert(!p.useMint(locked,'adamant-mint').ok);
 const before=p.getCatalog().find(m=>m.key==='bulbasaur');
 assert.equal(before.nature,'hardy');
 assert(p.useMint('bulbasaur','adamant-mint').ok);
 assert.equal(p.getSave().growth.mintInventory['adamant-mint'],0);
 const record=p.getSave().growth.pokemon.bulbasaur;
 assert.equal(record.nature,'hardy');
 assert.equal(record.mintNature,'adamant');
 assert.equal(p.getCatalog().find(m=>m.key==='bulbasaur').effectiveNature,'adamant');
 const stats=roster.find(m=>m.key==='bulbasaur').stats;
 assert(displayStats(stats,5,{nature:'adamant'}).atk>displayStats(stats,5).atk);
 assert(displayStats(stats,5,{nature:'adamant'}).spa<displayStats(stats,5).spa);
 // Outra mint substitui o efeito; a mesma mint em efeito é recusada.
 const rich=JSON.parse(p.exportSave());rich.coins=1000;assert(p.importSave(JSON.stringify(rich)).ok);
 assert(p.buyMint('timid-mint').ok);
 assert(p.useMint('bulbasaur','timid-mint').ok);
 assert.equal(p.getSave().growth.pokemon.bulbasaur.nature,'hardy');
 assert.equal(p.getSave().growth.pokemon.bulbasaur.mintNature,'timid');
 assert(p.buyMint('timid-mint').ok);
 assert(!p.useMint('bulbasaur','timid-mint').ok);
 // Serious Mint zera o efeito e volta ao neutro.
 const rich2=JSON.parse(p.exportSave());rich2.coins=1000;assert(p.importSave(JSON.stringify(rich2)).ok);
 assert(p.buyMint('serious-mint').ok);
 assert(p.useMint('bulbasaur','serious-mint').ok);
 assert.equal(p.getCatalog().find(m=>m.key==='bulbasaur').effectiveNature,'serious');
 assert.deepEqual(displayStats(stats,5,{nature:'serious'}),displayStats(stats,5));
});
test('evolução transfere nature, IVs e mint (Bulbasaur → Ivysaur)',()=>{
 const values=[0.15,0.5,0.5,0.5,0.5,0.5,0.5];
 const p=journeyFixture(storage(),()=>values.shift());
 assert(p.chooseStarter('bulbasaur').ok);
 assert(p.buyMint('timid-mint').ok);
 assert(p.useMint('bulbasaur','timid-mint').ok);
 setXP(p,'bulbasaur',16);
 assert(p.evolvePokemon('bulbasaur','ivysaur').ok);
 const record=p.getSave().growth.pokemon.ivysaur;
 assert.equal(record.nature,'adamant');
 assert.deepEqual(record.ivs,{hp:16,atk:16,def:16,spa:16,spd:16,spe:16});
 assert.equal(record.mintNature,'timid');
 assert.equal(p.getSave().growth.pokemon.bulbasaur,undefined);
 assert.equal(p.getCatalog().find(m=>m.key==='ivysaur').effectiveNature,'timid');
});
test('fiação da UI: loja vende mint, mochila usa mint, parceiro mostra nature/IV',async()=>{
 const app=await readFile(new URL('../public/pulse/app.js',import.meta.url),'utf8');
 assert.ok(app.includes('MINTS'),'app.js importa MINTS');
 assert.ok(app.includes('data-buy-${kind}'),'loja monta o botão de compra por tipo (item/pedra/mint)');
 assert.ok(app.includes('b.dataset.buyMint'),'loja trata a compra da mint');
 assert.ok(app.includes('traits'),'battleGrowth passa traits para a batalha');
 assert.ok(app.includes("displayStats(m.stats, m.level, {ivs:m.ivs,nature:m.effectiveNature})"),'detalhe usa displayStats com traits');
 const ui=await readFile(new URL('../public/pulse/management-ui.js',import.meta.url),'utf8');
 assert.ok(ui.includes('MINTS'),'management-ui importa MINTS');
 assert.ok(ui.includes("bagItem.startsWith('mint:')"),'mochila tem detalhe da mint');
 assert.ok(ui.includes('p.useMint'),'mochila chama useMint');
 assert.ok(ui.includes('natureLabel'),'parceiro exibe a nature');
 assert.ok(ui.includes('displayStats(m.stats, m.level, {ivs:m.ivs,nature:m.effectiveNature})'),'parceiro usa displayStats com traits');
 const battle=await readFile(new URL('../public/pulse/growth-battle.js',import.meta.url),'utf8');
 assert.ok(battle.includes('traits={}'),'configureGrowthBattle aceita traits');
 assert.ok(battle.includes('ivs:trait.ivs'),'spec do ator recebe IVs');
 assert.ok(battle.includes('mintNature:trait.mintNature'),'spec do ator recebe a mint');
});
