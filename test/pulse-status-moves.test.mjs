import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { engine, createSimulation } from '../server/engine.mjs';

/**
 * Status moves (Growl, Sleep Powder, Thunder Wave, ...) were reported as
 * "not working" in v0.6.0. The engine applies them; the HUD never showed
 * the stat changes, so they only looked broken. These tests pin the effects
 * through the real engine and through the OfflineBattle snapshot the HUD
 * reads (snapshot().player/opponent.stages).
 */

const RATTATA = ['gibleAT:Tackle', 'pidgeot:Quick Attack', 'blastoiseAG:Bite', 'weavile:Protect'];

async function sim(seed, mon0, moves0, mon1, moves1) {
  return createSimulation(seed, [
    { name: 'Red', trainer: 'red', mons: [mon0], moves: [moves0], bot: false },
    { name: 'Blue', trainer: 'blue', mons: [mon1], moves: [moves1], bot: false },
  ], 'stadium');
}

function force(b, name, frames) {
  for (let i = 0; i < frames && !b.done; i++) engine.stepRanked(b, [{ kind: 'move', name, side: 0 }]);
}

function untilUsed(b, name, frames = 2400) {
  for (let i = 0; i < frames && !b.done; i++) {
    engine.stepRanked(b, [{ kind: 'move', name, side: 0 }]);
    if ((b.useLog[name] || 0) > 0) return i;
  }
  return -1;
}

test('Growl lowers the foe Attack stage and the stage persists (no decay in PULSE battles)', async () => {
  const b = await sim(42, 'bulbasaur', ['gibleAT:Tackle', 'bayleefAG:Vine Whip', 'pulseBasics:Growl', 'venusaur:Razor Leaf'], 'rattata', RATTATA);
  const foe = b.fighters[1];
  assert.notEqual(untilUsed(b, 'Growl'), -1, 'Growl was never used');
  force(b, 'Growl', 120);
  assert.ok((foe.stages?.atk || 0) <= -1, `expected foe atk <= -1, got ${foe.stages?.atk}`);
  const afterGrowl = foe.stages.atk;
  force(b, 'Tackle', 900);
  assert.equal(foe.stages?.atk, afterGrowl, 'stat stage decayed or changed without a stat move');
});

test('Tail Whip and Leer lower foe Defense; Withdraw and Harden raise own Defense', async () => {
  const tail = await sim(21, 'pikachu', ['pulseBasics:Tail Whip', 'sceptile:Quick Attack', 'pikachu:Iron Tail', 'pikachu:Volt Tackle'], 'rattata', RATTATA);
  force(tail, 'Tail Whip', 900);
  assert.ok((tail.fighters[1].stages?.def || 0) <= -1, 'Tail Whip did not lower foe Defense');

  const leer = await sim(33, 'nidoking', ['pulseBasics:Leer', 'nidoking:Earthquake', 'nidoking:Poison Jab', 'nidoking:Aqua Tail'], 'rattata', RATTATA);
  force(leer, 'Leer', 900);
  assert.ok((leer.fighters[1].stages?.def || 0) <= -1, 'Leer did not lower foe Defense');

  const withdraw = await sim(22, 'squirtle', ['pulseBasics:Withdraw', 'buizelAP:Water Gun', 'blastoiseB:Water Pulse', 'blastoiseAG:Bite'], 'rattata', RATTATA);
  force(withdraw, 'Withdraw', 900);
  assert.ok((withdraw.fighters[0].stages?.def || 0) >= 1, 'Withdraw did not raise own Defense');

  const harden = await sim(34, 'metapod', ['pulseBasics:Harden'], 'rattata', RATTATA);
  force(harden, 'Harden', 900);
  assert.ok((harden.fighters[0].stages?.def || 0) >= 1, 'Harden did not raise own Defense');
});

test('Swords Dance raises own Attack by 2 and Agility raises own Speed by 2', async () => {
  const sd = await sim(31, 'scizorJJ', ['lycanrocM:Swords Dance', 'scizorJJ:Bullet Punch', 'scizorJJ:X-Scissor', 'scizorJJ:Brick Break'], 'rattata', RATTATA);
  force(sd, 'Swords Dance', 900);
  assert.ok((sd.fighters[0].stages?.atk || 0) >= 2, 'Swords Dance did not raise own Attack');

  const ag = await sim(32, 'jolteon', ['metagrossA:Agility', 'jolteon:Thunderbolt', 'jolteon:Pin Missile', 'jolteon:Shadow Ball'], 'rattata', RATTATA);
  force(ag, 'Agility', 900);
  assert.ok((ag.fighters[0].stages?.spe || 0) >= 2, 'Agility did not raise own Speed');
});

test('Thunder Wave paralyzes, Toxic poisons, Sleep Powder puts the foe to sleep', async () => {
  const tw = await sim(36, 'pikachu', ['ampharos:Thunder Wave', 'sceptile:Quick Attack', 'pikachu:Iron Tail', 'pikachu:Volt Tackle'], 'rattata', RATTATA);
  force(tw, 'Thunder Wave', 900);
  assert.ok(tw.statusLog.some((e) => e.s === 'par' && e.side === 1), 'Thunder Wave did not paralyze the foe');

  const tx = await sim(43, 'bulbasaur', ['crobat:Toxic', 'gibleAT:Tackle', 'bayleefAG:Vine Whip', 'venusaur:Razor Leaf'], 'rattata', RATTATA);
  force(tx, 'Toxic', 900);
  assert.ok(tx.statusLog.some((e) => e.s === 'psn' && e.side === 1), 'Toxic did not poison the foe');

  const sp = await sim(44, 'bulbasaur', ['venusaur:Sleep Powder', 'gibleAT:Tackle', 'bayleefAG:Vine Whip', 'venusaur:Razor Leaf'], 'rattata', RATTATA);
  force(sp, 'Sleep Powder', 1800);
  assert.ok(sp.statusLog.some((e) => e.s === 'slp' && e.side === 1), 'Sleep Powder never put the foe to sleep');
});

test('Rest puts the user to sleep and restores HP', async () => {
  const b = await sim(35, 'snorlax', ['snorlax:Rest', 'wailord:Body Slam', 'gyarados:Hyper Beam', 'groudon:Earthquake'], 'rattata', RATTATA);
  const me = b.fighters[0];
  me.hp = Math.floor(me.maxHp * 0.4);
  const before = me.hp;
  assert.notEqual(untilUsed(b, 'Rest'), -1, 'Rest was never used');
  force(b, 'Rest', 300);
  assert.ok(b.statusLog.some((e) => e.s === 'slp' && e.side === 0), 'Rest did not put the user to sleep');
  assert.ok(me.hp > before, `Rest did not heal (hp ${before} -> ${me.hp})`);
});

test('Protect blocks incoming damage while active and expires afterwards', async () => {
  const b = await sim(61, 'rattata', ['weavile:Protect', 'gibleAT:Tackle', 'pidgeot:Quick Attack', 'blastoiseAG:Bite'], 'bulbasaur', ['gibleAT:Tackle', 'bayleefAG:Vine Whip', 'venusaur:Razor Leaf', 'venusaur:Sleep Powder']);
  const me = b.fighters[0];
  assert.notEqual(untilUsed(b, 'Protect'), -1, 'Protect was never used');
  const hpAtUse = me.hp;
  force(b, 'Tackle', 120);
  assert.equal(me.hp, hpAtUse, 'took damage while Protect was still active');
  force(b, 'Tackle', 360);
  assert.ok(me.hp < hpAtUse, 'Protect never expired (still invulnerable)');
  assert.ok((b.useLog['Vine Whip'] || 0) + (b.useLog['Razor Leaf'] || 0) + (b.useLog.Tackle || 0) > 0, 'foe never attacked during the window');
});

// --- OfflineBattle snapshot: the HUD reads stages from here ---
const require = createRequire(new URL('../package.json', import.meta.url));
const binding = require('@napi-rs/canvas/js-binding.js');
globalThis.CanvasRenderingContext2D = binding.CanvasRenderingContext2D;
globalThis.document.hidden = false;
globalThis.document.addEventListener = () => {};
globalThis.document.removeEventListener = () => {};
globalThis.window = { addEventListener() {}, removeEventListener() {} };
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
const { createCanvas } = require('@napi-rs/canvas');
const { OfflineBattle } = await import('../public/pulse/battle.js');

test('snapshot exposes stat stages after Growl through the real battle path (growth-selected moves)', async () => {
  const canvas = createCanvas(960, 540);
  const errors = [];
  const ctrl = new OfflineBattle({ canvas, onUpdate() {}, onEnd() {}, onError(e) { errors.push(e.message); } });
  const growth = {
    levels: { bulbasaur: 5 }, opponentLevel: 5,
    selected: { bulbasaur: ['gibleAT:Tackle', 'bayleefAG:Vine Whip', 'pulseBasics:Growl'] },
    held: {}, icons: {}, preview: () => null, onConsume: () => true,
    onEvolve: () => true, onEvent: () => {}, onKnockout: () => ({ ok: true }),
    onSuppress: () => {}, onPendingResolved: () => {}, pendingAuto: null, suppressedAuto: {},
  };
  const snap0 = await ctrl.start({
    team: { mons: ['bulbasaur'], moves: { bulbasaur: ['gibleAT:Tackle', 'bayleefAG:Vine Whip', 'pulseBasics:Growl'] }, gimmick: null },
    botTeam: { mons: ['rattata'], moves: {}, gimmick: null },
    format: '1v1', difficulty: 1, seed: 777, growth, trainer: 'red',
  });
  assert.equal(errors.length, 0, `battle failed to start: ${errors.join('; ')}`);
  assert.equal(snap0?.state, 'running');
  assert.deepEqual(snap0.opponent.stages, {}, 'stages should start empty');
  assert.deepEqual(snap0.player.stages, {}, 'stages should start empty');
  let used = false;
  for (let i = 0; i < 2400 && !ctrl.snapshot().result; i++) {
    ctrl.command({ kind: 'move', name: 'Growl', side: 0 });
    ctrl.advanceFrames(1);
    if ((ctrl.debug.battle.useLog?.Growl || 0) > 0) { used = true; break; }
  }
  assert.ok(used, 'Growl was never used in the live battle');
  ctrl.advanceFrames(120);
  const s = ctrl.snapshot();
  assert.deepEqual(s.opponent.stages, { atk: -1 }, 'snapshot did not expose the Growl stage drop');
  assert.deepEqual(s.player.stages, {}, 'player stages should stay empty');
  ctrl.destroy();
});
