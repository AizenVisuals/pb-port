import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildDamageReport, damageGraphHTML } from '../public/pulse/damage-graph.js';
import { configureGrowthBattle, evolutionAssets } from '../public/pulse/growth-battle.js';
import { engine, createSimulation } from '../server/engine.mjs';
import { createProgression } from '../public/pulse/progression.js';
import { displayStats, displayMaxHp } from '../public/pulse/growth.js';

// O acúmulo de dano é testado com uma batalha falsa (duck-typed), no mesmo
// padrão do teste de XP de dano de pulse-growth-battle.test.mjs (rápido e
// determinístico), e com uma simulação real do engine no fim do arquivo.
// (Durante este trabalho a importação do engine chegou a quebrar por um
// dado do fan-pack em andamento do Codex — 'kyogre:Hydro Pump' — e foi
// resolvida por ele antes da suíte final; nada disso é deste escopo.)

const roster = JSON.parse(await readFile(new URL('../public/roster.json', import.meta.url), 'utf8'));
const storage = () => { const values = new Map; return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; };
function journeyFixture(disk, options = {}) { const p = createProgression({ storage: disk || storage(), profileMode: 'journey', rng: () => 0, now: () => Date.UTC(2026, 10, 15), ...options }); assert.equal(p.setCatalog(roster).ok, true); return p; }
const row = (p, id) => p.getMissions().find(m => m.id === id);

const NAMES = { charizard: 'Charizard', blastoise: 'Blastoise', pidgey: 'Pidgey', bulbasaur: 'Bulbasaur', rattata: 'Rattata' };
const TYPES = { charizard: ['fire'], blastoise: ['water'], pidgey: ['normal'], bulbasaur: ['grass', 'poison'], rattata: ['normal'] };
const names = key => NAMES[key] || key;
const types = key => TYPES[key] || [];

function sampleReport() {
  return buildDamageReport({
    entries: [
      { key: 'charizard', side: 0, dealt: 312, taken: 48, hits: 3 },
      { key: 'blastoise', side: 0, dealt: 120, taken: 90, hits: 1 },
      { key: 'pidgey', side: 1, dealt: 55, taken: 400, hits: 1 },
    ],
    damagingMoves: ['Flamethrower', 'Tackle'],
    moveUses: [
      { by: 'charizard', side: 0, name: 'Flamethrower' },
      { by: 'charizard', side: 0, name: 'Flamethrower' },
      { by: 'charizard', side: 0, name: 'Flamethrower' },
      { by: 'blastoise', side: 0, name: 'Tackle' },
      { by: 'blastoise', side: 0, name: 'Growl' },
      { by: 'pidgey', side: 1, name: 'Tackle' },
    ],
    kos: [{ by: 'charizard', side: 0 }],
    playerKeys: ['charizard', 'blastoise'],
    opponentKeys: ['pidgey'],
    names, types,
  });
}

test('damage report junta dano, tentativas e nocautes por Pokémon', () => {
  const report = sampleReport();
  assert.deepEqual(report.player.map(r => r.key), ['charizard', 'blastoise']);
  assert.equal(report.player[0].accuracy, 100);
  assert.equal(report.player[0].kos, 1);
  assert.equal(report.player[0].attempts, 3);
  assert.equal(report.player[1].accuracy, 100);
  assert.equal(report.player[1].attempts, 1);
  assert.equal(report.opponent[0].name, 'Pidgey');
  assert.deepEqual(report.opponent[0].types, ['normal']);
  assert.equal(report.opponent[0].dealt, 55);
  assert.equal(report.opponent[0].taken, 400);
});

test('precisão é limitada a 100% (multi-hit) e chaves fora do time entram no lado certo', () => {
  const report = buildDamageReport({
    entries: [{ key: 'mewtwo', side: 1, dealt: 500, taken: 0, hits: 3 }],
    damagingMoves: ['Psystrike'],
    moveUses: [{ by: 'mewtwo', side: 1, name: 'Psystrike' }],
    kos: [],
    playerKeys: ['charizard'],
    opponentKeys: [],
    names, types,
  });
  assert.equal(report.player[0].dealt, 0);
  assert.equal(report.player[0].accuracy, null);
  assert.equal(report.opponent[0].key, 'mewtwo');
  assert.equal(report.opponent[0].accuracy, 100);
  assert.deepEqual(buildDamageReport({}), { player: [], opponent: [] });
  const swapped = buildDamageReport({
    entries: [{ key: 'bulbasaur', side: 1, dealt: 7, taken: 0, hits: 1 }],
    playerKeys: [], opponentKeys: [], playerSide: 1, names, types,
  });
  assert.equal(swapped.player[0].key, 'bulbasaur');
  assert.deepEqual(swapped.opponent, []);
});

test('damageGraphHTML mostra barras, totais e escapa nomes', () => {
  const html = damageGraphHTML(sampleReport());
  assert.ok(html.includes('Seu time'));
  assert.ok(html.includes('Oponente'));
  assert.ok(html.includes('Charizard'));
  assert.ok(html.includes('312'));
  assert.ok(html.includes('1 KO'));
  assert.ok(html.includes('100% prec.'));
  assert.ok(html.includes('width:100%'));
  assert.ok(html.includes('Total do time:'));
  assert.ok(html.includes('--type:#EE8130'));
  const xss = damageGraphHTML(buildDamageReport({
    entries: [{ key: 'x', side: 0, dealt: 10, taken: 0, hits: 1 }],
    playerKeys: ['x'], names: () => '<img src=x onerror=alert(1)>', types: () => ['fire'],
  }));
  assert.ok(xss.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.equal(xss.includes('<img src=x'), false);
  assert.equal(damageGraphHTML(null), '');
  assert.equal(damageGraphHTML({ player: [], opponent: [] }), '');
  assert.equal(damageGraphHTML(buildDamageReport({ playerKeys: ['charizard'], names, types })), '');
});

function fakeActor(key, side, hp = 100) {
  return { rkKey: key, side, hp, maxHp: hp, hpShown: hp, hpChip: hp, level: 16, x: 100, y: 100, bodyH: 50, spec: { base: { hp: 45, atk: 49, def: 49, spa: 65, spd: 65, spe: 45 } }, moves: [], megaEvolve() {}, fainted: false, hidden: false };
}

test('growth acumula dano causado/sofrido por Pokémon no wrapper de b.hit', () => {
  const player = fakeActor('bulbasaur', 0);
  const foe = fakeActor('rattata', 1, 60);
  const b = {
    speciesTable: {}, tick: 0, phase: 'fight', done: false, cinematic: false,
    teams: [{ side: 0, mons: [player] }, { side: 1, mons: [foe] }],
    fighters: [player, foe],
    sfx() {}, text() {}, typeEff: () => 1,
    hit(attacker, target) { target.hp = Math.max(0, target.hp - 1); return 'hit'; },
  };
  const fakeEngine = {
    moveObj: () => ({ name: 'Tackle', type: 'normal', power: 40, cat: 'phys' }),
    INFO: { bulbasaur: { key: 'bulbasaur', pool: [], defaults: [] }, rattata: { key: 'rattata', pool: [], defaults: [] } },
    pulseEvolve: () => false,
  };
  const growth = configureGrowthBattle(b, fakeEngine, {
    levels: { bulbasaur: 15 }, opponentLevel: 5, selected: { bulbasaur: ['tackle'] },
    preview: () => null, onDamageXP: () => ({ ok: true, total: 0, changes: [] }),
  });
  b.hit(player, foe, { name: 'Tackle', type: 'normal' });
  b.hit(player, foe, { name: 'Tackle', type: 'normal' });
  b.hit(foe, player, { name: 'Tackle', type: 'normal' });
  foe.hp = 0; b.hit(player, foe, { name: 'Tackle', type: 'normal' });
  b.hit(player, player, { name: 'Tackle', type: 'normal' });
  const report = growth.damageReport();
  const byKey = Object.fromEntries(report.entries.map(e => [e.key, e]));
  assert.deepEqual(byKey.bulbasaur, { key: 'bulbasaur', side: 0, dealt: 2, taken: 1, hits: 2 });
  assert.deepEqual(byKey.rattata, { key: 'rattata', side: 1, dealt: 1, taken: 2, hits: 1 });
  assert.deepEqual(report.damagingMoves, ['Tackle']);
  assert.equal(growth.hitXpTotal(), 4.5);
});

test('derrota selvagem: endBattle conta batalha e nocautes uma única vez', () => {
  const p = journeyFixture();
  assert.equal(p.chooseStarter('charmander').ok, true);
  assert.equal(p.beginStage('1-1', 'wild-loss-1-1').ok, true);
  assert.equal(p.completeStage({ id: 'wild-loss-1-1', won: true, frames: 600 }).ok, true);
  assert.equal(p.beginStage('1-2', 'wild-loss-1-2').ok, true);
  assert.equal(p.completeStage({ id: 'wild-loss-1-2', won: true, frames: 600 }).ok, true);
  assert.equal(p.beginStage('1-3', 'wild-loss-1-3').ok, true);
  assert.equal(p.resolveEncounter('fled').ok, true);
  assert.equal(p.completeStage({ id: 'wild-loss-1-3', won: false, frames: 600, knockouts: 2 }).ok, true);
  assert.equal(row(p, 'battle-5').current, 3);
  assert.equal(row(p, 'win-1').current, 1);
  assert.equal(row(p, 'win-1').complete, true);
  assert.equal(p.getSave().records.wins, 2);
  assert.equal(row(p, 'knockout-10').current, 2);
  assert.equal(p.getSave().records.battles, 3);
  assert.equal(p.getSave().records.losses, 1);
});

test('a sequência antiga (recordMissionBattle + completeStage) contava 2x', () => {
  const p = journeyFixture();
  assert.equal(p.chooseStarter('charmander').ok, true);
  assert.equal(p.beginStage('1-1', 'wild-old-1-1').ok, true);
  assert.equal(p.completeStage({ id: 'wild-old-1-1', won: true, frames: 600 }).ok, true);
  assert.equal(p.beginStage('1-2', 'wild-old-1-2').ok, true);
  assert.equal(p.completeStage({ id: 'wild-old-1-2', won: true, frames: 600 }).ok, true);
  assert.equal(p.beginStage('1-3', 'wild-old-1-3').ok, true);
  assert.equal(p.recordMissionBattle({ id: 'wild-old-1-3', won: false, knockouts: 2 }).ok, true);
  assert.equal(p.resolveEncounter('fled').ok, true);
  assert.equal(p.completeStage({ id: 'wild-old-1-3', won: false, frames: 600, knockouts: 2 }).ok, true);
  assert.equal(row(p, 'battle-5').current, 4);
  assert.equal(row(p, 'knockout-10').current, 4);
  assert.equal(p.getSave().records.battles, 3);
});

test('app.js: o ramo de derrota selvagem não chama recordMissionBattle', async () => {
  const app = await readFile(new URL('../public/pulse/app.js', import.meta.url), 'utf8');
  const loss = app.match(/if\(wildBattle&&!result\.won[^\n]*/)?.[0];
  assert.ok(loss, 'ramo de derrota selvagem existe');
  assert.equal(loss.includes('recordMissionBattle'), false);
  assert.ok(loss.includes("resolveEncounter('fled')"));
  const win = app.match(/if\(wildBattle&&result\.won[^\n]*/)?.[0];
  assert.ok(win?.includes('recordMissionBattle'), 'vitória selvagem mantém a contagem única');
  assert.ok(app.includes("damageGraphHTML(result.damage)"), 'tela de resultado renderiza o gráfico');
});

test('rpg.css: bônus usa centralização segura e não é espremido em paisagem curta', async () => {
  const css = await readFile(new URL('../public/pulse/rpg.css', import.meta.url), 'utf8');
  const side = css.match(/\.bonus-side\{[^}]*\}/)?.[0];
  assert.ok(side?.includes('justify-content:safe center'), 'bonus-side com safe center');
  const daily = css.match(/\.bonus-screen \.daily-reward\{[^}]*\}/)?.[0];
  assert.ok(daily?.includes('justify-content:safe center'), 'daily-reward com safe center');
  assert.ok(css.includes('.bonus-layout{gap:20px;flex:none}'), 'layout do bônus com altura natural em paisagem curta');
  assert.ok(css.includes('.result-dialog{max-width:min(94vw,660px)}'), 'diálogo de resultado mais largo em paisagem curta');
  assert.ok(css.includes('.dmg-graph{grid-template-columns:1fr 1fr}'), 'gráfico em duas colunas em paisagem curta');
});

test('simulação real acumula dano, tentativas e KO no relatório', async () => {
  await engine.loadRankedAssets(evolutionAssets(['bulbasaur', 'rattata']));
  const b = await createSimulation(31, [{ name: 'QA', trainer: 'red', mons: ['bulbasaur'], bot: true }, { name: 'CPU', trainer: 'blue', mons: ['rattata'], bot: true }], 'stadium');
  const growth = configureGrowthBattle(b, engine, {
    levels: { bulbasaur: 16 }, opponentLevel: 5, selected: { bulbasaur: ['gibleAT:Tackle'] },
    preview: () => null, onDamageXP: () => ({ ok: true, total: 0, changes: [] }), onKnockout: () => ({ ok: true, total: 0, changes: [] }),
  });
  for (let i = 0; i < 6000 && !b.done; i++) { growth.before(); engine.stepRanked(b); growth.after(); }
  assert.equal(b.done, true);
  const dmg = growth.damageReport();
  const damaging = new Set(dmg.damagingMoves);
  for (const team of b.teams) for (const actor of team.mons) for (const mv of actor.moves || []) if (mv?.power > 0 && mv?.name) damaging.add(mv.name);
  const report = buildDamageReport({
    entries: dmg.entries, damagingMoves: [...damaging], moveUses: b.rkMoveUse || [], kos: b.rkKOs || [],
    playerKeys: ['bulbasaur'], opponentKeys: ['rattata'],
    names: key => engine.INFO[key]?.name || key, types: key => [...(engine.INFO[key]?.types || [])],
  });
  assert.equal(report.player[0].key, 'bulbasaur');
  assert.ok(report.player[0].dealt > 0);
  assert.ok(report.player[0].taken > 0);
  assert.equal(report.player[0].kos, 1);
  assert.ok(report.player[0].attempts > 0);
  assert.ok(report.player[0].accuracy !== null && report.player[0].accuracy > 0 && report.player[0].accuracy <= 100);
  assert.equal(report.opponent[0].key, 'rattata');
  assert.ok(report.opponent[0].dealt > 0);
  const html = damageGraphHTML(report);
  assert.ok(html.includes('Bulbasaur'));
  assert.ok(html.includes('Seu time'));
  assert.ok(html.includes('Oponente'));
});

test('displayStats: detalhe do parceiro mostra stats no nível, não base stats', async () => {
  const charmander = { hp: 39, atk: 52, def: 43, spa: 60, spd: 50, spe: 65 };
  assert.deepEqual(displayStats(charmander, 5), { hp: 24, atk: 11, def: 10, spa: 12, spd: 11, spe: 13 });
  assert.equal(displayStats(charmander, 5).hp, displayMaxHp(39, 5));
  assert.notDeepEqual(displayStats(charmander, 5), charmander);
  const app = await readFile(new URL('../public/pulse/app.js', import.meta.url), 'utf8');
  assert.ok(app.includes("displayStats} from './growth.js'"), 'app.js importa displayStats');
  assert.ok(app.includes('Object.entries(displayStats(m.stats, m.level, {ivs:m.ivs,nature:m.effectiveNature}))'), 'detalhe do parceiro usa displayStats');
  const ui = await readFile(new URL('../public/pulse/management-ui.js', import.meta.url), 'utf8');
  assert.ok(ui.includes("displayStats,natureLabel,natureName} from './growth.js'"), 'management-ui.js importa displayStats');
  assert.ok(ui.includes('Atributos base'), 'seção de base mantida');
  assert.ok(ui.includes('<h2>No nível ${m.level}</h2>'), 'seção "No nível" existe');
  assert.ok(ui.includes('Object.entries(displayStats(m.stats, m.level, {ivs:m.ivs,nature:m.effectiveNature}))'), 'seção "No nível" usa displayStats');
});

test('gráfico cabe na largura do diálogo e o resultado abre no topo', async () => {
  const css = await readFile(new URL('../public/pulse/style.css', import.meta.url), 'utf8');
  assert.ok(css.includes('.dmg-team{min-width:0}'), 'coluna do gráfico pode encolher');
  assert.ok(css.includes('.dmg-row-head{display:flex;flex-wrap:wrap'), 'cabeçalho da linha quebra quando apertado');
  assert.ok(!css.includes('.dmg-nums{color:var(--muted);font-size:12px;white-space:nowrap}'), 'números podem quebrar linha');
  const app = await readFile(new URL('../public/pulse/app.js', import.meta.url), 'utf8');
  assert.ok(app.includes('showDialog("result-dialog");\n  $("result-dialog").scrollTop=0;'), 'diálogo abre no topo');
});
