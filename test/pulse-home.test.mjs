import { test } from 'node:test';
import assert from 'node:assert/strict';
import { displayMaxHp, engineBaseHp } from '../public/pulse/growth.js';

/**
 * HP exibido no card do parceiro da Home nova. Valores sondados no engine
 * real (createSimulation + megaEvolve, o mesmo caminho de growth-battle.js):
 * HP base do roster -> base transformada do engine -> HP exibido (engine/9).
 * Ex.: Bulbasaur base 45 -> engine 87 -> Nv. 5 mostra 25 / 25.
 */
test('engineBaseHp reproduz a transformação do engine (uq0/F9a)', () => {
  assert.equal(engineBaseHp(45), 87); // Bulbasaur
  assert.equal(engineBaseHp(39), 78); // Charmander
  assert.equal(engineBaseHp(44), 85); // Squirtle
  assert.equal(engineBaseHp(35), 73); // Pikachu
  assert.equal(engineBaseHp(30), 66); // Rattata
  assert.equal(engineBaseHp(60), 107); // Gengar
});

test('displayMaxHp é o HP clássico no nível (HP do engine / 9)', () => {
  assert.equal(displayMaxHp(45, 5), 25);
  assert.equal(displayMaxHp(45, 16), 58);
  assert.equal(displayMaxHp(45, 36), 119);
  assert.equal(displayMaxHp(45, 50), 162);
  assert.equal(displayMaxHp(45, 100), 315);
  assert.equal(displayMaxHp(39, 5), 24);
  assert.equal(displayMaxHp(39, 50), 153);
  assert.equal(displayMaxHp(44, 5), 25);
  assert.equal(displayMaxHp(44, 50), 160);
  assert.equal(displayMaxHp(35, 5), 23);
  assert.equal(displayMaxHp(35, 50), 148);
  assert.equal(displayMaxHp(30, 5), 23);
  assert.equal(displayMaxHp(30, 50), 141);
  assert.equal(displayMaxHp(60, 5), 27);
  assert.equal(displayMaxHp(60, 50), 182);
});
