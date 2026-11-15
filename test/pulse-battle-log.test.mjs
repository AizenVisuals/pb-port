import assert from 'node:assert';
import { BattleNarrator, stageMessage, statusMessage } from '../public/pulse/battle-log.js';

const nameOf = (k) => ({ bulbasaur: 'Bulbasaur', rattata: 'Rattata', pikachu: 'Pikachu' }[k] || k);
const base = (over = {}) => ({
  frame: 100,
  player: { key: 'bulbasaur', stages: {}, status: null, confused: false, guarding: false },
  opponent: { key: 'rattata', stages: {}, status: null, confused: false, guarding: false },
  newActions: [],
  newStatuses: [],
  ...over,
});

// Formatação direta
assert.equal(stageMessage('Growl', 'Rattata', 'atk', -1), 'Growl! O Ataque do Rattata caiu!');
assert.equal(stageMessage('Swords Dance', 'Scizor', 'atk', 2), 'Swords Dance! O Ataque do Scizor subiu muito!');
assert.equal(stageMessage(null, 'Rattata', 'def', -1), 'O Defesa do Rattata caiu!');
assert.equal(statusMessage('Thunder Wave', 'Rattata', 'par'), 'Thunder Wave! O Rattata ficou paralisado!');
assert.equal(statusMessage(null, 'Rattata', 'slp'), 'O Rattata adormeceu!');

// 1. Primeiro snapshot: baseline, nenhuma mensagem.
let n = new BattleNarrator(nameOf);
assert.deepEqual(n.feed(base()), []);

// 2. Growl do jogador baixa o ATQ do oponente (atribuição via newActions).
let msgs = n.feed(base({
  frame: 200,
  newActions: [{ name: 'Growl', side: 0, tick: 113, cat: 'status' }],
  opponent: { key: 'rattata', stages: { atk: -1 }, status: null, confused: false, guarding: false },
}));
assert.deepEqual(msgs, ['Growl! O Ataque do Rattata caiu!']);

// 3. Nada muda -> nenhuma mensagem.
assert.deepEqual(n.feed(base({ frame: 300, opponent: { key: 'rattata', stages: { atk: -1 }, status: null, confused: false, guarding: false } })), []);

// 4. Swords Dance do jogador (+2 ATQ em si mesmo).
msgs = n.feed(base({
  frame: 400,
  newActions: [{ name: 'Swords Dance', side: 0, tick: 350, cat: 'stat' }],
  player: { key: 'bulbasaur', stages: { atk: 2 }, status: null, confused: false, guarding: false },
  opponent: { key: 'rattata', stages: { atk: -1 }, status: null, confused: false, guarding: false },
}));
assert.deepEqual(msgs, ['Swords Dance! O Ataque do Bulbasaur subiu muito!']);

// 5. Thunder Wave via statusLog (fonte autoritativa) + diff — sem duplicar.
msgs = n.feed(base({
  frame: 500,
  newActions: [{ name: 'Thunder Wave', side: 0, tick: 450, cat: 'status' }],
  newStatuses: [{ side: 1, status: 'par', tick: 470 }],
  player: { key: 'bulbasaur', stages: { atk: 2 }, status: null, confused: false, guarding: false },
  opponent: { key: 'rattata', stages: { atk: -1 }, status: 'par', confused: false, guarding: false },
}));
assert.deepEqual(msgs, ['Thunder Wave! O Rattata ficou paralisado!']);

// 6. Sono via diff (sem entrada no log) + acordar — o sono vem do Sleep
// Powder do jogador (lado 0, mais recente), não do Thunder Wave antigo.
msgs = n.feed(base({
  frame: 600,
  newActions: [{ name: 'Sleep Powder', side: 0, tick: 560, cat: 'status' }],
  player: { key: 'bulbasaur', stages: { atk: 2 }, status: null, confused: false, guarding: false },
  opponent: { key: 'rattata', stages: { atk: -1 }, status: 'slp', confused: false, guarding: false },
}));
assert.deepEqual(msgs, ['Sleep Powder! O Rattata adormeceu!']);
msgs = n.feed(base({
  frame: 700,
  player: { key: 'bulbasaur', stages: { atk: 2 }, status: null, confused: false, guarding: false },
  opponent: { key: 'rattata', stages: { atk: -1 }, status: null, confused: false, guarding: false },
}));
assert.deepEqual(msgs, ['O Rattata acordou!']);

// 7. Protect sobe e expira.
msgs = n.feed(base({
  frame: 800,
  player: { key: 'bulbasaur', stages: { atk: 2 }, status: null, confused: false, guarding: true },
  opponent: { key: 'rattata', stages: { atk: -1 }, status: null, confused: false, guarding: false },
}));
assert.deepEqual(msgs, ['Protect! O Bulbasaur se protegeu!']);
msgs = n.feed(base({
  frame: 900,
  player: { key: 'bulbasaur', stages: { atk: 2 }, status: null, confused: false, guarding: false },
  opponent: { key: 'rattata', stages: { atk: -1 }, status: null, confused: false, guarding: false },
}));
assert.deepEqual(msgs, ['A proteção do Bulbasaur acabou!']);

// 8. Troca de lutador: baseline silenciosa (sem narrar o estado do novo).
msgs = n.feed(base({
  frame: 1000,
  player: { key: 'bulbasaur', stages: { atk: 2 }, status: null, confused: false, guarding: false },
  opponent: { key: 'pikachu', stages: { atk: -1 }, status: 'par', confused: false, guarding: false },
}));
assert.deepEqual(msgs, []);

// 9. Golpe antigo demais (>180 ticks) -> mensagem genérica, sem inventar nome.
msgs = n.feed(base({
  frame: 2000,
  player: { key: 'bulbasaur', stages: { atk: 2 }, status: null, confused: false, guarding: false },
  opponent: { key: 'pikachu', stages: { atk: -2 }, status: 'par', confused: false, guarding: false },
}));
assert.deepEqual(msgs, ['O Ataque do Pikachu caiu!']);

// 10. Stage volta a 0 (chave some do objeto) -> delta +2.
msgs = n.feed(base({
  frame: 2100,
  player: { key: 'bulbasaur', stages: { atk: 2 }, status: null, confused: false, guarding: false },
  opponent: { key: 'pikachu', stages: {}, status: 'par', confused: false, guarding: false },
}));
assert.deepEqual(msgs, ['O Ataque do Pikachu subiu muito!']);

// 11. Confusão.
msgs = n.feed(base({
  frame: 2200,
  player: { key: 'bulbasaur', stages: { atk: 2 }, status: null, confused: true, guarding: false },
  opponent: { key: 'pikachu', stages: {}, status: 'par', confused: false, guarding: false },
}));
assert.deepEqual(msgs, ['O Bulbasaur ficou confuso!']);

// 12. reset() limpa baseline e atribuição.
n.reset();
assert.deepEqual(n.feed(base({
  frame: 2300,
  opponent: { key: 'pikachu', stages: {}, status: 'par', confused: false, guarding: false },
})), []);
assert.deepEqual(n.feed(base({
  frame: 2400,
  opponent: { key: 'pikachu', stages: { def: -1 }, status: 'par', confused: false, guarding: false },
})), ['O Defesa do Pikachu caiu!']);

// 13. REGRESSÃO (QA ao vivo): Growl + Tackle na mesma janela — o stage
// caiu por causa do Growl ('status'); o Tackle ('phys', mais recente) NÃO
// pode ser a causa e nunca deve aparecer na mensagem.
n.reset();
n.feed(base({ frame: 100 }));
msgs = n.feed(base({
  frame: 200,
  newActions: [
    { name: 'Growl', side: 0, tick: 113, cat: 'status' },
    { name: 'Tackle', side: 0, tick: 150, cat: 'phys' },
  ],
  opponent: { key: 'rattata', stages: { atk: -1 }, status: null, confused: false, guarding: false },
}));
assert.deepEqual(msgs, ['Growl! O Ataque do Rattata caiu!']);

// 14. Só golpe de dano na janela -> genérica (nunca atribui ao dano).
msgs = n.feed(base({
  frame: 300,
  newActions: [{ name: 'Tackle', side: 1, tick: 260, cat: 'phys' }],
  opponent: { key: 'rattata', stages: { atk: -1, def: -1 }, status: null, confused: false, guarding: false },
}));
assert.deepEqual(msgs, ['O Defesa do Rattata caiu!']);

// 16. REGRESSÃO (QA ao vivo): Thunder Wave t=177 aplica 'par' em t=214 e
// a IA usa Growl em t=275 — o Growl é POSTERIOR ao evento e nunca pode
// ser a causa. O narrador escolhe o Thunder Wave.
n.reset();
n.feed(base({ frame: 100 }));
msgs = n.feed(base({
  frame: 300,
  newActions: [
    { name: 'Quick Attack', side: 0, tick: 136, cat: 'phys' },
    { name: 'Thunder Wave', side: 0, tick: 177, cat: 'status' },
    { name: 'Growl', side: 0, tick: 275, cat: 'status' },
  ],
  newStatuses: [{ side: 1, status: 'par', tick: 214 }],
  opponent: { key: 'rattata', stages: {}, status: 'par', confused: false, guarding: false },
}));
assert.deepEqual(msgs, ['Thunder Wave! O Rattata ficou paralisado!']);

console.log('battle-log: 16 grupos de asserções OK');
