/** battle-log.js — narração pura dos eventos de batalha para o log do HUD.
 * Consome snapshots de OfflineBattle (ver battle.js) e devolve as mensagens
 * novas a exibir. Sem DOM, sem imports do engine — testável em node.
 *
 * Cobertura: mudança de stage (ATQ/DEF/VEL...), status aplicado/removido
 * (incl. acordar do sono), Protect (guarda sobe/cai). A atribuição do golpe
 * vem do actionLog do engine (newActions no snapshot); quando nenhum golpe
 * é recente o bastante, a mensagem fica genérica — nunca inventa um nome.
 */
export const STAGE_NAMES = {
  atk: 'Ataque', def: 'Defesa', spa: 'Atq. especial',
  spd: 'Def. especial', spe: 'Velocidade',
};

const STATUS_VERBS = {
  par: 'ficou paralisado',
  slp: 'adormeceu',
  psn: 'foi envenenado',
  brn: 'ficou queimado',
  frz: 'ficou congelado',
  confused: 'ficou confuso',
};

// ~3 s a 60 ticks/s: o efeito de um golpe cai em até ~2 s do uso, então um
// golpe fora dessa janela não pode ser a causa — a mensagem fica genérica.
const RECENT_TICKS = 180;

function stageKey(a) {
  return a && a.stages ? a.stages : {};
}

function statusKey(a) {
  if (!a) return null;
  if (a.status) return a.status; // brn / par / psn / slp / frz
  if (a.frozen) return 'frz';
  if (a.toxic) return 'psn';
  return null;
}

function sideState(a) {
  return {
    key: a.key,
    stages: { ...stageKey(a) },
    status: statusKey(a),
    confused: !!a.confused,
    guarding: !!a.guarding,
  };
}

export function stageMessage(moveName, targetName, stat, delta) {
  const dir = delta > 0 ? (delta >= 2 ? 'subiu muito' : 'subiu')
    : (delta <= -2 ? 'caiu muito' : 'caiu');
  const move = moveName ? `${moveName}! ` : '';
  return `${move}O ${STAGE_NAMES[stat] || stat} do ${targetName} ${dir}!`;
}

export function statusMessage(moveName, targetName, status) {
  const verb = STATUS_VERBS[status] || 'sofreu um efeito';
  const move = moveName ? `${moveName}! ` : '';
  return `${move}O ${targetName} ${verb}!`;
}

export class BattleNarrator {
  /** nameOf: (key) => nome de exibição do Pokémon (ex.: "Bulbasaur"). */
  constructor(nameOf = (key) => key) {
    this.nameOf = nameOf;
    this.prev = null;
    // Últimas ações (ordem cronológica): {name, tick, cat, side}.
    this.recent = [];
  }

  reset() {
    this.prev = null;
    this.recent = [];
  }

  /** Golpe mais recente (dentro da janela) cuja categoria está em `cats`.
   * `preferSide` é o lado cuja jogada mais provavelmente causou o evento
   * (debuff no alvo -> lado atacante; buff -> próprio lado; condição
   * aplicada -> lado atacante, com auto-infligido como fallback, ex. Rest).
   * Sem candidato na categoria, devolve null (mensagem genérica — nunca
   * atribui a um golpe de dano, que não pode causar o efeito). */
  moveFor(frame, tick, cats, preferSide) {
    const t = tick ?? frame;
    let fallback = null;
    // Do mais recente para o mais antigo; os ticks são crescentes no
    // histórico, então o primeiro fora da janela encerra a busca.
    for (let i = this.recent.length - 1; i >= 0; i--) {
      const m = this.recent[i];
      if (m.tick > t) continue; // golpe posterior ao evento não pode ser a causa
      if (t - m.tick > RECENT_TICKS) break;
      if (!cats.includes(m.cat)) continue;
      if (m.side === preferSide) return m.name;
      if (!fallback) fallback = m;
    }
    return fallback?.name || null;
  }

  /** snapshot -> string[] (mensagens novas, na ordem em que devem aparecer). */
  feed(s) {
    const out = [];
    if (!s || !s.player || !s.opponent) return out;

    // Registra golpes usados (fonte de atribuição), com a categoria.
    for (const a of s.newActions || []) {
      if (a && typeof a.side === 'number' && a.name) {
        this.recent.push({ name: a.name, tick: a.tick ?? s.frame ?? 0, cat: a.cat || null, side: a.side });
      }
    }
    if (this.recent.length > 8) this.recent.splice(0, this.recent.length - 8);

    // Entradas do statusLog do engine são a fonte autoritativa da aplicação
    // de status; o diff abaixo pode perder um status que aplica e some entre
    // snapshots. Registra o que o log já narrou para não duplicar.
    const logged = new Set();
    for (const e of s.newStatuses || []) {
      if (!e || typeof e.side !== 'number') continue;
      const side = e.side === 0 ? 'player' : 'opponent';
      const target = s[side];
      if (!target) continue;
      const verb = STATUS_VERBS[e.status];
      if (!verb) continue;
      logged.add(`${side}:${e.status}`);
      // A condição vem do golpe do outro lado (Rest é a exceção: o
      // fallback do moveFor cobre o auto-infligido).
      out.push(statusMessage(this.moveFor(s.frame, e.tick, ['status'], e.side === 0 ? 1 : 0), this.nameOf(target.key), e.status));
    }

    if (!this.prev) {
      this.prev = { player: sideState(s.player), opponent: sideState(s.opponent) };
      return out;
    }
    const prev = this.prev;

    for (const side of ['player', 'opponent']) {
      const cur = s[side];
      const old = prev[side];
      if (!cur || !old) continue;
      // Troca de lutador: zera a baseline em silêncio (sem narrar).
      if (cur.key !== old.key) {
        prev[side] = sideState(cur);
        continue;
      }
      // Stages. Debuff no alvo -> golpe do outro lado; buff -> próprio
      // lado (auto-buff). Só 'status'/'stat' podem mudar stage.
      const stats = new Set([
        ...Object.keys(stageKey(cur)),
        ...Object.keys(stageKey(old)),
      ]);
      for (const stat of stats) {
        const before = stageKey(old)[stat] || 0;
        const after = stageKey(cur)[stat] || 0;
        if (after !== before) {
          const sideNum = side === 'player' ? 0 : 1;
          const prefer = after < before ? 1 - sideNum : sideNum;
          out.push(stageMessage(this.moveFor(s.frame, null, ['status', 'stat'], prefer), this.nameOf(cur.key), stat, after - before));
        }
      }
      // Status aplicado / removido (só o que o log não cobriu neste feed).
      const beforeStatus = old.status;
      const afterStatus = statusKey(cur);
      if (beforeStatus !== afterStatus) {
        if (afterStatus && !logged.has(`${side}:${afterStatus}`)) {
          const sideNum = side === 'player' ? 0 : 1;
          out.push(statusMessage(this.moveFor(s.frame, null, ['status'], 1 - sideNum), this.nameOf(cur.key), afterStatus));
        } else if (!afterStatus && beforeStatus === 'slp') {
          out.push(`O ${this.nameOf(cur.key)} acordou!`);
        }
      }
      // Confusão (condição volátil, fora do campo status).
      if (cur.confused && !old.confused) {
        out.push(`O ${this.nameOf(cur.key)} ficou confuso!`);
      }
      // Protect (guarda sobe / expira).
      if (cur.guarding && !old.guarding) {
        out.push(`Protect! O ${this.nameOf(cur.key)} se protegeu!`);
      } else if (!cur.guarding && old.guarding) {
        out.push(`A proteção do ${this.nameOf(cur.key)} acabou!`);
      }
      prev[side] = sideState(cur);
    }
    return out;
  }
}
