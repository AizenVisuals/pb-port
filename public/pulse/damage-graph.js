/** Gráfico de dano do fim de batalha (PULSE ARENA).
 * Módulo puro: sem DOM e sem imports — pode ser testado em Node e
 * importado por battle.js (dados) e app.js (HTML).
 *
 * Fonte dos dados: o wrapper de `b.hit` em growth-battle.js acumula o HP
 * realmente perdido por `rkKey` (dano causado/sofrido, sem contar dano de
 * status como veneno/queimadura, que não passa por `b.hit` com atacante).
 * As tentativas vêm de `battle.rkMoveUse` (o engine registra cada golpe
 * usado antes da resolução de precisão/esquiva) e os nocautes de
 * `battle.rkKOs` (`by` = rkKey de quem nocauteou). `teamDmg()` do engine
 * NÃO é dano por Pokémon — é um multiplicador de dano do time.
 * Precisão = golpes que causaram dano / golpes de dano usados; multi-hit
 * pode dar mais acertos que usos, então o valor é limitado a 100%.
 * Um Pokémon que evolui no meio da batalha aparece com a chave que tinha
 * quando causou o dano (o acúmulo é por rkKey no momento do golpe).
 */
const TYPE_COLORS = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
  grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
  ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
  rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746',
  steel: '#B7B7CE', fairy: '#D685AD',
};
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = value => Number(value || 0).toLocaleString('pt-BR');

/** Junta dano, tentativas e nocautes em linhas por Pokémon.
 * `entries`: [{key, side, dealt, taken, hits}] do growth (`damageReport()`).
 * `damagingMoves`: nomes de golpes de dano (só eles contam como tentativa).
 * `moveUses`: `battle.rkMoveUse` ({by, side, name}); `kos`: `battle.rkKOs`
 * ({by, side}). `playerKeys`/`opponentKeys`: times na ordem de exibição;
 * chaves que só aparecem nos dados (ex.: forma pré-evolução) entram no fim
 * do lado correspondente. `names`/`types` resolvem exibição por chave.
 * Retorna {player: [...linhas], opponent: [...linhas]}, cada linha com
 * {key, name, types, side, dealt, taken, hits, attempts, kos, accuracy}
 * (accuracy null quando não houve tentativa de golpe de dano), ordenada
 * por dano causado (maior primeiro). */
export function buildDamageReport({ entries = [], damagingMoves = [], moveUses = [], kos = [], playerKeys = [], opponentKeys = [], playerSide = 0, names = key => key, types = () => [] } = {}) {
  const damaging = new Set((damagingMoves || []).filter(Boolean));
  const rows = new Map();
  const order = { player: [], opponent: [] };
  const ensure = (key, side) => {
    if (!key || !order[side]) return null;
    let row = rows.get(key);
    if (!row) {
      row = { key, name: names(key), types: types(key) || [], side, dealt: 0, taken: 0, hits: 0, attempts: 0, kos: 0, accuracy: null };
      rows.set(key, row);
      order[side].push(row);
    }
    return row;
  };
  const sideOf = side => (side === playerSide ? 'player' : 'opponent');
  for (const key of playerKeys || []) ensure(key, 'player');
  for (const key of opponentKeys || []) ensure(key, 'opponent');
  for (const entry of entries || []) {
    if (!entry?.key) continue;
    const row = ensure(entry.key, sideOf(entry.side));
    if (!row) continue;
    row.dealt += Math.max(0, Number(entry.dealt) || 0);
    row.taken += Math.max(0, Number(entry.taken) || 0);
    row.hits += Math.max(0, Number(entry.hits) || 0);
  }
  for (const use of moveUses || []) {
    if (!use?.by || !damaging.has(use.name)) continue;
    const row = ensure(use.by, sideOf(use.side));
    if (row) row.attempts += 1;
  }
  for (const ko of kos || []) {
    if (!ko?.by) continue;
    const row = ensure(ko.by, sideOf(ko.side));
    if (row) row.kos += 1;
  }
  const finish = list => list
    .map(row => ({ ...row, accuracy: row.attempts > 0 ? Math.min(100, Math.round((row.hits / row.attempts) * 100)) : null }))
    .sort((a, b) => b.dealt - a.dealt);
  return { player: finish(order.player), opponent: finish(order.opponent) };
}

/** HTML do gráfico a partir do relatório de `buildDamageReport`.
 * Devolve '' quando não há dado nenhum (ex.: desistência antes de qualquer
 * golpe) — nesse caso a tela de resultado segue sem a seção. Barras na cor
 * oficial do primeiro tipo do Pokémon (vermelho #e60012 sem tipo). */
export function damageGraphHTML(report) {
  if (!report) return '';
  const sections = [['player', 'Seu time'], ['opponent', 'Oponente']]
    .filter(([side]) => Array.isArray(report[side]) && report[side].length);
  if (!sections.length) return '';
  const hasData = sections.some(([side]) => report[side].some(row => row.dealt > 0 || row.taken > 0 || row.attempts > 0 || row.kos > 0));
  if (!hasData) return '';
  const sectionHTML = ([side, title]) => {
    const rows = report[side];
    const max = Math.max(0, ...rows.map(row => row.dealt));
    const totalDealt = rows.reduce((sum, row) => sum + row.dealt, 0);
    const totalTaken = rows.reduce((sum, row) => sum + row.taken, 0);
    const rowHTML = row => {
      const color = TYPE_COLORS[row.types?.[0]] || '#e60012';
      const pct = max > 0 && row.dealt > 0 ? Math.max(3, Math.round((row.dealt / max) * 100)) : 0;
      const bench = row.dealt === 0 && row.taken === 0 && row.attempts === 0 && row.kos === 0;
      const extra = [
        row.kos > 0 ? `${row.kos} KO${row.kos > 1 ? 's' : ''}` : null,
        row.accuracy !== null && row.accuracy !== undefined ? `${row.accuracy}% prec.` : null,
      ].filter(Boolean).join(' · ');
      return `<div class="dmg-row${bench ? ' dmg-row--bench' : ''}"><div class="dmg-row-head"><span class="dmg-name"><i class="dmg-dot" style="--type:${color}"></i>${esc(row.name)}</span><span class="dmg-nums"><b>${num(row.dealt)}</b> causado · ${num(row.taken)} sofrido${extra ? ` · ${extra}` : ''}</span></div><div class="dmg-bar" role="img" aria-label="${esc(row.name)}: ${num(row.dealt)} de dano causado"><i style="width:${pct}%;--type:${color}"></i></div></div>`;
    };
    return `<div class="dmg-team"><h3>${title}</h3>${rows.map(rowHTML).join('')}<p class="dmg-total">Total do time: <b>${num(totalDealt)}</b> causado · <b>${num(totalTaken)}</b> sofrido</p></div>`;
  };
  return `<section class="dmg-graph" aria-label="Dano da batalha">${sections.map(sectionHTML).join('')}</section>`;
}
