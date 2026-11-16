import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planCPU, scoreMoves } from '../public/pulse/tactical-ai.js';
import { adviseBots, hash01, pickBotMove } from '../public/custom/tactical-hook.js';
import { engine, createSimulation } from '../server/engine.mjs';

// ---- planCPU / scoreMoves units (fixture style mirrors pulse-tactical-ai.test.mjs) ----
const actorBase = (over = {}) => ({
  x: 0, y: 0, st: { atk: 50, spa: 50, def: 50, spd: 50 }, types: ['fire'],
  hp: 100, maxHp: 100, stages: {}, moves: [], ...over,
});
const targetBase = (over = {}) => ({
  x: 30, y: 0, st: { def: 50, spd: 50 }, stages: {}, types: ['grass'], ...over,
});
const row = (name, over = {}) => ({
  name, type: 'normal', cat: 'phys', power: 40, eff: 1, charge: 1,
  locked: false, left: 99, inRange: true, ...over,
});

test('scoreMoves ranks best first and planCPU is its head', () => {
  const actor = actorBase({ moves: [{ name: 'Ember', range: [0, 100] }, { name: 'Tackle', range: [0, 40] }, { name: 'Harden', range: [0, 500] }] });
  const target = targetBase();
  const rows = [
    row('Ember', { type: 'fire', cat: 'spec', power: 40, eff: 2 }),
    row('Tackle'),
    row('Harden', { power: 0 }),
  ];
  const ranked = scoreMoves(actor, target, rows);
  assert.deepEqual(ranked.map(r => r.name), ['Ember', 'Tackle', 'Harden']);
  assert.ok(ranked[0].score > ranked[1].score && ranked[1].score > ranked[2].score);
  assert.equal(planCPU(actor, target, rows), 'Ember');
});

test('immune moves are skipped outright', () => {
  const actor = actorBase({ moves: [{ name: 'Thunderbolt', range: [0, 100] }, { name: 'Tackle', range: [0, 40] }] });
  const target = targetBase();
  const rows = [row('Thunderbolt', { type: 'electric', cat: 'spec', power: 90, eff: 0 }), row('Tackle')];
  assert.equal(planCPU(actor, target, rows), 'Tackle');
  assert.deepEqual(scoreMoves(actor, target, rows).map(r => r.name), ['Tackle']);
  assert.equal(planCPU(actor, target, rows.slice(0, 1)), null);
});

test('Recover utility only fires when hurt', () => {
  const recover = { name: 'Recover', range: [0, 500], utility: e => (e.hp / e.maxHp > .55 ? 0 : 100) };
  const actor = actorBase({ moves: [recover, { name: 'Tackle', range: [0, 40] }] });
  const target = targetBase();
  const rows = [row('Recover', { power: 0, heal: true }), row('Tackle')];
  assert.equal(planCPU(actor, target, rows), 'Tackle');
  actor.hp = 30;
  assert.equal(planCPU(actor, target, rows), 'Recover');
});

test('Eruption powerFor weakens at low HP', () => {
  const eruption = { name: 'Eruption', range: [0, 100], powerFor: a => Math.round(150 * a.hp / a.maxHp) };
  const actor = actorBase({ moves: [eruption, { name: 'Tackle', range: [0, 40] }] });
  const target = targetBase();
  const rows = [row('Eruption', { type: 'fire', cat: 'spec', power: 150 }), row('Tackle')];
  assert.equal(planCPU(actor, target, rows), 'Eruption');
  actor.hp = 10;
  assert.equal(planCPU(actor, target, rows), 'Tackle');
  eruption.powerFor = () => { throw Error('boom'); };
  actor.hp = 100;
  assert.equal(planCPU(actor, target, rows), 'Eruption');
});

test('Sucker Punch only fires while the foe is mid-damaging-move', () => {
  const actor = actorBase({ moves: [{ name: 'Sucker Punch', range: [0, 40] }, { name: 'Tackle', range: [0, 40] }] });
  const rows = [row('Sucker Punch', { type: 'dark', power: 70 }), row('Tackle')];
  assert.equal(planCPU(actor, targetBase(), rows), 'Tackle');
  const attacking = targetBase({ action: { name: 'Slash' }, actionIsMove: true, lastMove: { cat: 'phys', power: 70 } });
  assert.equal(planCPU(actor, attacking, rows), 'Sucker Punch');
  const statusFoe = targetBase({ action: { name: 'Growl' }, actionIsMove: true, lastMove: { cat: 'status', power: 0 } });
  assert.equal(planCPU(actor, statusFoe, rows), 'Tackle');
});

test('status fallbacks: Transform refused when transformed, Teleport only when hurt with a bench', () => {
  const actor = actorBase({ hp: 30, moves: [{ name: 'Transform', range: [0, 500] }, { name: 'Teleport', range: [0, 500] }, { name: 'Tackle', range: [0, 40] }] });
  const target = targetBase();
  const bench = [{ ...actorBase(), hp: 100 }];
  assert.equal(planCPU(actor, target, [row('Transform', { power: 0 }), row('Tackle')], bench), 'Transform');
  actor.pulseTransform = true;
  assert.equal(planCPU(actor, target, [row('Transform', { power: 0 }), row('Teleport', { power: 0 }), row('Tackle')], bench), 'Teleport');
  assert.equal(planCPU(actor, target, [row('Teleport', { power: 0 }), row('Tackle')], []), 'Tackle');
});

// ---- difficulty scaling units ----
test('hash01 is deterministic, in [0,1), and roughly uniform', () => {
  assert.equal(hash01(101, 'venusaur', 127), hash01(101, 'venusaur', 127));
  assert.notEqual(hash01(101, 'venusaur', 127), hash01(101, 'venusaur', 209));
  const rolls = [];
  for (let e = 0; e < 14000; e += 7) rolls.push(hash01(101, 'starmie', e));
  assert.ok(rolls.every(r => r >= 0 && r < 1));
  const frac = rolls.filter(r => r < .75).length / rolls.length;
  assert.ok(frac > .65 && frac < .85, `fraction below .75 was ${frac}`);
});

test('pickBotMove: level 5 always takes the best move, lower levels sometimes do not', () => {
  const ranked = [{ name: 'Best', score: 100 }, { name: 'Second', score: 60 }, { name: 'Third', score: 20 }];
  for (const roll of [0, .5, .99]) assert.equal(pickBotMove(ranked, 5, roll), 'Best');
  assert.equal(pickBotMove(ranked, 1, .2), 'Best');
  assert.equal(pickBotMove(ranked, 1, .5), 'Second');
  assert.equal(pickBotMove(ranked, 1, .9), 'Third');
  assert.equal(pickBotMove(ranked, 3, .7), 'Best');
  assert.equal(pickBotMove(ranked, 3, .8), 'Second');
  assert.equal(pickBotMove([], 3, .1), null);
  assert.equal(pickBotMove([{ name: 'Only', score: 5 }], 1, .99), 'Only');
  // Over many deterministic rolls, level 1 takes the best move ~45% of the time.
  let best = 0; const n = 400;
  for (let i = 0; i < n; i++) if (pickBotMove(ranked, 1, hash01(7, 'm', i * 13)) === 'Best') best++;
  assert.ok(best / n > .35 && best / n < .55, `level-1 best rate was ${best / n}`);
});

// ---- adviseBots units (fake battle shapes) ----
function fighter(side, over = {}) {
  return {
    side, rkKey: over.key || `mon${side}`, x: side ? 100 : 0, y: 0,
    hp: 100, maxHp: 100, st: { atk: 50, spa: 50, def: 50, spd: 50 }, types: ['normal'],
    stages: {}, moves: [{ name: 'Tackle', range: [0, 40] }], status: null,
    ai: { plan: null, nextAttack: 0, mode: 'normal' },
    fainted: false, hidden: false, action: null, actionIsMove: false, lastMove: null, ...over,
  };
}
function fakeBattle({ bot0 = false, bot1 = true, manual0 = false, holdFire0 = false, seed = 101, rk = true } = {}) {
  const f0 = fighter(0, { key: 'a' });
  const f1 = fighter(1, { key: 'b' });
  const b = {
    seed, phase: 'fight', cinematic: false, done: false, tick: 100,
    fighters: [f0, f1],
    teams: [{ mons: [f0], enteredAt: 0 }, { mons: [f1], enteredAt: 0 }],
    typeEff: (t, types) => (t === 'grass' && types.includes('water') ? 2 : 1),
  };
  if (rk) b.rk = { doubles: false, sides: [{ bot: bot0, manual: manual0, holdFire: holdFire0 }, { bot: bot1 }] };
  return { b, f0, f1 };
}
const tackleRows = () => [row('Tackle')];
const moveStatus = () => tackleRows();

test('adviseBots fills an empty bot plan (real rk.sides[].bot shape)', () => {
  const { b, f1 } = fakeBattle();
  adviseBots(b, moveStatus);
  assert.equal(f1.ai.plan?.name, 'Tackle');
});

test('adviseBots still works with the legacy teams[].bot shape (no rk)', () => {
  const { b, f1 } = fakeBattle({ rk: false });
  b.teams[1].bot = true;
  adviseBots(b, moveStatus);
  assert.equal(f1.ai.plan?.name, 'Tackle');
});

test('adviseBots leaves a manual player alone but still advises the bot', () => {
  const { b, f0, f1 } = fakeBattle({ manual0: true });
  adviseBots(b, moveStatus);
  assert.equal(f0.ai.plan, null);
  assert.equal(f1.ai.plan?.name, 'Tackle');
});

test('adviseBots advises an AUTO player, never a human facing another human', () => {
  const auto = fakeBattle();
  adviseBots(auto.b, moveStatus);
  assert.equal(auto.f0.ai.plan?.name, 'Tackle');
  const human = fakeBattle({ bot1: false });
  adviseBots(human.b, moveStatus);
  assert.equal(human.f0.ai.plan, null);
  assert.equal(human.f1.ai.plan, null);
});

test('adviseBots forces guard at low HP under a real incoming attack, not otherwise', () => {
  const { b, f1 } = fakeBattle();
  f1.hp = 30;
  const foe = b.fighters[0];
  foe.actionIsMove = true; foe.lastMove = { power: 50 };
  adviseBots(b, moveStatus);
  assert.equal(b.rk.sides[1].wantGuard, 100);
  const healthy = fakeBattle();
  healthy.f1.hp = 90;
  healthy.b.fighters[0].actionIsMove = true; healthy.b.fighters[0].lastMove = { power: 50 };
  adviseBots(healthy.b, moveStatus);
  assert.equal(healthy.b.rk.sides[1].wantGuard, undefined);
  // Finisher exception: foe nearly dead and a finishing move is ready -> no guard.
  const finisher = fakeBattle();
  finisher.f1.hp = 30;
  finisher.b.fighters[0].hp = 20; finisher.b.fighters[0].actionIsMove = true; finisher.b.fighters[0].lastMove = { power: 50 };
  adviseBots(finisher.b, moveStatus);
  assert.equal(finisher.b.rk.sides[1].wantGuard, undefined);
});

test('adviseBots auto-megas an AUTO player when favorable, not when healthy', () => {
  const good = fakeBattle();
  good.b.rk.sides[0].gimmick = { kind: 'mega', mon: 0 };
  good.f0.hp = 50;
  adviseBots(good.b, moveStatus);
  assert.equal(good.b.rk.sides[0].wantMega, true);
  const healthy = fakeBattle();
  healthy.b.rk.sides[0].gimmick = { kind: 'mega', mon: 0 };
  healthy.f0.hp = 90;
  adviseBots(healthy.b, moveStatus);
  assert.equal(healthy.b.rk.sides[0].wantMega, undefined);
});

test('adviseBots auto-switches an AUTO player off a terrible matchup', () => {
  const { b, f0, f1 } = fakeBattle();
  f1.types = ['water'];
  const bench = fighter(0, { key: 'bench', moves: [{ name: 'Vine Whip', type: 'grass', cat: 'phys', power: 45, range: [0, 40] }] });
  b.teams[0].mons = [f0, bench];
  const badRows = () => [row('Tackle', { eff: 0.5 })];
  adviseBots(b, badRows);
  assert.equal(b.rk.sides[0].wantSwitch, 1);
  const good = fakeBattle();
  adviseBots(good.b, moveStatus);
  assert.equal(good.b.rk.sides[0].wantSwitch, undefined);
});

// ---- headless: determinism + quality (2 fixed battles, same shape as the probe) ----
function moveOf(b, side, name) {
  const f = b.fighters[side];
  return f?.moves?.find(m => m.name === name) || engine.moveObj(name);
}
async function runRanked(monsA, monsB, seed, level) {
  const b = await createSimulation(seed, [
    { name: 'A', trainer: 'red', mons: monsA, bot: true, level },
    { name: 'B', trainer: 'blue', mons: monsB, bot: true, level },
  ], 'stadium');
  const m = { se: 0, moves: 0, immune: 0 };
  let seen = 0, steps = 0;
  while (!b.done && steps < 40000) {
    engine.stepRanked(b);
    steps++;
    const log = b.actionLog || [];
    for (; seen < log.length; seen++) {
      const e = log[seen];
      if (!e || e.kind !== 'move') continue;
      const mv = moveOf(b, e.side, e.name);
      if (!mv || !mv.power || mv.cat === 'status') continue;
      const opp = b.fighters[1 - e.side];
      const eff = b.typeEff(mv.type, opp ? (opp.showTypes || opp.types || []) : []);
      m.moves++;
      if (eff >= 2) m.se++;
      if (eff === 0) m.immune++;
    }
  }
  return { done: b.done, winner: b.done ? engine.winnerSide(b) : null, hash: engine.stateHash(b), ...m };
}

test('headless: same seed twice gives the same battle hash', async () => {
  const run = () => runRanked(['venusaur', 'charizard', 'blastoise'], ['pikachu', 'alakazam', 'gengar'], 101, 3);
  const a = await run(), c = await run();
  assert.equal(a.hash, c.hash);
  assert.equal(a.winner, c.winner);
  assert.ok(a.done);
});

test('headless: bot uses super-effective moves more often than the ~13% native baseline, never an immune move', async () => {
  const r1 = await runRanked(['venusaur', 'charizard', 'blastoise'], ['pikachu', 'alakazam', 'gengar'], 101, 3);
  const r2 = await runRanked(['charizard', 'gyarados', 'alakazam'], ['blastoise', 'venusaur', 'gengar'], 101, 3);
  const se = r1.se + r2.se, moves = r1.moves + r2.moves, immune = r1.immune + r2.immune;
  assert.ok(r1.done && r2.done);
  assert.ok([0, 1].includes(r1.winner) && [0, 1].includes(r2.winner));
  assert.ok(se / moves > .15, `combined SE% was ${(100 * se / moves).toFixed(1)}% (${se}/${moves}), expected above the ~13% native baseline`);
  assert.equal(immune, 0);
});
