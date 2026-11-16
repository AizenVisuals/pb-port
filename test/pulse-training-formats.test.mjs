import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TRAINING_FORMATS, resolveTrainingFormat, mountTrainingFormatSelector } from '../public/pulse/battle.js';
import { engine, createSimulation } from '../server/engine.mjs';

/** DOM mínimo para montar o seletor de formato sem navegador. */
function stubElement(tag, doc) {
  const listeners = new Map();
  const el = {
    tagName: tag.toUpperCase(), children: [], parentNode: null, nextSibling: null,
    className: '', dataset: {}, disabled: false, textContent: '',
    ownerDocument: doc, attributes: new Map(),
    classList: { _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      toggle(c, force) { if (force === undefined) force = !this._set.has(c); if (force) this._set.add(c); else this._set.delete(c); },
      contains(c) { return this._set.has(c); } },
    setAttribute(k, v) { this.attributes.set(k, String(v)); },
    getAttribute(k) { return this.attributes.get(k) ?? null; },
    appendChild(child) { child.parentNode = this; const last = this.children[this.children.length - 1]; if (last) last.nextSibling = child; this.children.push(child); return child; },
    insertBefore(child, ref) { child.parentNode = this; const i = ref ? this.children.indexOf(ref) : -1; if (i < 0) return this.appendChild(child); this.children.splice(i, 0, child); return child; },
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
    click() { for (const fn of listeners.get('click') || []) fn(); },
  };
  return el;
}
function stubDocument() {
  const doc = { createElement(tag) { return stubElement(tag, doc); } };
  return doc;
}
function mountStub({ unlocked = 6, current = '3v3' } = {}) {
  const doc = stubDocument();
  const parent = stubElement('div', doc);
  const before = stubElement('button', doc);
  parent.appendChild(before);
  const calls = { selected: [], comingSoon: [] };
  const mounted = mountTrainingFormatSelector(parent, before, {
    onSelect: (id) => calls.selected.push(id),
    onComingSoon: (f) => calls.comingSoon.push(f.id),
  });
  mounted.sync({ current, unlocked });
  const options = mounted.root.children[1].children;
  return { mounted, options, calls, parent };
}

test('treino expõe 4 formatos: Singles 1v1, Doubles 2v2, 3v3 e 6v6', () => {
  assert.deepEqual(TRAINING_FORMATS.map((f) => f.id), ['1v1', '2v2', '3v3', '6v6']);
  assert.deepEqual(TRAINING_FORMATS.map((f) => f.label), ['Singles', 'Doubles', '3v3', '6v6']);
  assert.deepEqual(TRAINING_FORMATS.map((f) => f.teamSize), [1, 2, 3, 6]);
  // Só Doubles usa 2 ativos por lado — e é o único marcado como "em breve":
  // o engine suporta (slots), mas o runtime PULSE (snapshot/comandos/HUD)
  // é singles-only, então 2v2 não pode ser vendido como Doubles jogável.
  assert.deepEqual(TRAINING_FORMATS.map((f) => f.active), [1, 2, 1, 1]);
  assert.equal(TRAINING_FORMATS.filter((f) => f.comingSoon).length, 1);
  assert.equal(TRAINING_FORMATS.find((f) => f.id === '2v2').comingSoon, true);
});

test('resolveTrainingFormat normaliza, trava por desbloqueados e nunca libera Doubles', () => {
  assert.equal(resolveTrainingFormat('1v1', 6).teamSize, 1);
  assert.equal(resolveTrainingFormat('1v1', 6).available, true);
  assert.equal(resolveTrainingFormat('6v6', 6).available, true);
  assert.equal(resolveTrainingFormat('6v6', 3).available, false);
  assert.equal(resolveTrainingFormat('3v3', 2).available, false);
  // Doubles: indisponível mesmo com coleção completa (falta HUD de 2 ativos).
  assert.equal(resolveTrainingFormat('2v2', 6).available, false);
  assert.equal(resolveTrainingFormat('2v2', 6).comingSoon, true);
  // Valor inválido ou tamanho fora dos 4 formatos cai para o padrão 3v3,
  // sem marcar como seleção válida (nenhum botão fica ativo).
  assert.equal(resolveTrainingFormat('9v9', 6).id, '3v3');
  assert.equal(resolveTrainingFormat('9v9', 6).matched, false);
  assert.equal(resolveTrainingFormat('4v4', 6).matched, false);
  assert.equal(resolveTrainingFormat(undefined, 6).id, '3v3');
  assert.equal(resolveTrainingFormat('3v3', 6).matched, true);
});

test('seletor monta 4 botões, Doubles desabilitado com "em breve" e marca o atual', () => {
  const { options } = mountStub({ unlocked: 6, current: '3v3' });
  assert.equal(options.length, 4);
  assert.deepEqual(options.map((b) => b.dataset.format), ['1v1', '2v2', '3v3', '6v6']);
  assert.deepEqual(options.map((b) => b.children[0].textContent), ['Singles', 'Doubles', '3v3', '6v6']);
  // Doubles fica clicável (não disabled) para explicar o "em breve" ao toque.
  assert.equal(options[1].disabled, false);
  assert.match(options[1].children[1].textContent, /em breve/);
  assert.equal(options[2].classList.contains('is-active'), true);
  assert.equal(options[2].getAttribute('aria-pressed'), 'true');
  assert.equal(options[0].getAttribute('aria-pressed'), 'false');
  assert.equal(options[3].disabled, false);
});

test('clique escolhe o formato; Doubles avisa e não seleciona; travado não clica', () => {
  const { options, calls } = mountStub({ unlocked: 6, current: '3v3' });
  options[3].click(); // 6v6
  assert.deepEqual(calls.selected, ['6v6']);
  assert.deepEqual(calls.comingSoon, []);
  options[1].click(); // Doubles
  assert.deepEqual(calls.selected, ['6v6']);
  assert.deepEqual(calls.comingSoon, ['2v2']);
  const locked = mountStub({ unlocked: 2, current: '1v1' });
  assert.equal(locked.options[2].disabled, true); // 3v3 travado com 2 desbloqueados
  assert.equal(locked.options[3].disabled, true); // 6v6 travado
  locked.options[2].click();
  assert.deepEqual(locked.calls.selected, []);
});

test('seleção persiste no sync (refresh): trocar e voltar mantém o ativo certo', () => {
  const { mounted, options } = mountStub({ unlocked: 6, current: '1v1' });
  assert.equal(options[0].classList.contains('is-active'), true);
  mounted.sync({ current: '1v1', unlocked: 6 }); // segundo refresh, mesma seleção
  assert.equal(options[0].classList.contains('is-active'), true);
  mounted.sync({ current: '6v6', unlocked: 6 });
  assert.equal(options[3].classList.contains('is-active'), true);
  assert.equal(options[0].classList.contains('is-active'), false);
  assert.equal(options[3].getAttribute('aria-pressed'), 'true');
  // Desbloquear mais Pokémon reabilita os formatos sem perder a seleção.
  mounted.sync({ current: '6v6', unlocked: 6 });
  assert.equal(options[3].disabled, false);
});

const teams = (mons) => [
  { name: 'Red', trainer: 'red', mons, bot: true, level: 2 },
  { name: 'Blue', trainer: 'blue', mons, bot: true, level: 2 },
];
for (const [format, mons] of [
  ['1v1', ['pikachu']],
  ['3v3', ['venusaur', 'charizard', 'blastoise']],
  ['6v6', ['venusaur', 'charizard', 'blastoise', 'pikachu', 'alakazam', 'gengar']],
]) {
  test(`batalha ${format} completa: times com ${mons.length} dos dois lados e vencedor válido`, async () => {
    const b = await createSimulation(4321, teams(mons), 'stadium');
    assert.equal(b.teams[0].mons.length, mons.length);
    assert.equal(b.teams[1].mons.length, mons.length);
    for (let i = 0; i < 30000 && !b.done; i++) engine.stepRanked(b);
    assert.equal(b.done, true, format);
    assert.ok([0, 1].includes(engine.winnerSide(b)), format);
    for (const t of b.teams) for (const mon of t.mons) assert.ok(Number.isFinite(mon.hp));
  });
}
