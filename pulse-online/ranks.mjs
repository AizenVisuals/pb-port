// Ranking ranqueado do PULSE ARENA — port legível de `public/ranks.js` (PB).
// Mesmos números e mesmo comportamento do PB; só os nomes e a estrutura mudaram.
// O PB também tem `royaleScore`/`placement` (modo arena/royale) — não portados
// aqui de propósito: chegam na fase da arena, não nesta.
// Temporada atual = `YYYY-MM` (UTC), primeira temporada "2026-11".
export const TIERS = ['Beginner', 'Poké Ball', 'Great Ball', 'Ultra Ball', 'Master Ball', 'Champion'];
export const MASTER = 600; // pontos a partir dos quais é Master Ball
export const FIRST_SEASON = '2026-11';
export const CHAMPION_SHARE = 0.1; // top 10% dos jogadores com 600+ pts
export const WIN = 10; // pontos base por vitória
export const BOT_WIN = 5; // pontos por vitória contra bot (0 se já for Master+)

// Piso de cada divisão: [tier][divisão 0..3] — divisão 0 é a "4", 3 é a "1".
// Ex.: 0–14 = Beginner 4, 15–34 = Beginner 3, 60–89 = Beginner 1, 90–119 = Poké Ball 4.
const DIVISION_FLOORS = [
  [0, 15, 35, 60],
  [90, 120, 150, 185],
  [220, 260, 300, 345],
  [390, 440, 490, 545],
];
// Bônus por sequência de vitórias: índice = nº da vitória seguida (cap 5).
// 1ª seguida +0, 2ª +3, 3ª +6, 4ª +9, 5ª+ +12.
const STREAK_BONUS = [0, 0, 3, 6, 9, 12];
// Taxa de entrada por tier, descontada na derrota (índice = tier 0..4; Champion usa 10).
const ENTRY_FEE = [0, 5, 5, 7, 10, 10];

// Índice do tier (0 Beginner .. 4 Master+) a partir dos pontos.
export function tierIndex(pts = 0) {
  if (pts >= MASTER) return 4;
  for (let i = DIVISION_FLOORS.length - 1; i >= 0; i--) {
    if (pts >= DIVISION_FLOORS[i][0]) return i;
  }
  return 0;
}

// Quantos jogadores com 600+ pts viram Champion (top 10%, mínimo 1).
export function championCount(eligible) {
  return eligible > 0 ? Math.max(1, Math.ceil(eligible * CHAMPION_SHARE)) : 0;
}

// Posição de um jogador: tier, divisão (rank 4..1, null em Master/Champion),
// nome da divisão ("Poké Ball 4"), piso do tier, limites da divisão (lo/hi),
// próxima divisão (next) e piso de proteção contra queda (floor).
// `isChampion` = está no top 10% dos 600+ pts (calculado no ladder).
export function rankOf(pts = 0, isChampion = false) {
  if (pts >= MASTER) {
    return {
      tier: isChampion ? 'Champion' : 'Master Ball',
      rank: null,
      name: isChampion ? 'Champion' : 'Master Ball',
      floor: MASTER,
      lo: MASTER,
      hi: null,
      next: isChampion ? null : 'Champion',
    };
  }
  const t = tierIndex(pts);
  const divisions = DIVISION_FLOORS[t];
  let d = 0;
  for (let i = divisions.length - 1; i >= 0; i--) {
    if (pts >= divisions[i]) { d = i; break; }
  }
  const hi = d < 3 ? divisions[d + 1] : (DIVISION_FLOORS[t + 1]?.[0] ?? MASTER);
  const next = d < 3 ? `${TIERS[t]} ${3 - d}` : (t < 3 ? `${TIERS[t + 1]} 4` : 'Master Ball');
  return {
    tier: TIERS[t],
    rank: 4 - d,
    name: `${TIERS[t]} ${4 - d}`,
    floor: divisions[0],
    lo: divisions[d],
    hi,
    next,
  };
}

// Aplica o resultado de uma partida ranqueada e retorna o novo estado.
// - Vitória: +10 + bônus de sequência (1ª +0, 2ª +3, 3ª +6, 4ª +9, 5ª+ +12).
// - Vitória contra bot: +5 (0 se já for Master+); NÃO mexe na sequência.
// - Derrota: -taxa de entrada do tier (Beginner 0, Poké Ball 5, Great 5,
//   Ultra 7, Master/Champion 10), sem cair abaixo do piso do tier; zera a sequência.
export function score({ pts = 0, streak = 0 } = {}, won, vsBot) {
  const t = tierIndex(pts);
  if (won && vsBot) {
    const delta = t >= 4 ? 0 : BOT_WIN;
    return { pts: pts + delta, streak, delta, bonus: 0 };
  }
  if (won) {
    const nextStreak = streak + 1;
    const bonus = STREAK_BONUS[Math.min(nextStreak, 5)];
    return { pts: pts + WIN + bonus, streak: nextStreak, delta: WIN + bonus, bonus };
  }
  const floor = t >= 4 ? MASTER : DIVISION_FLOORS[t][0];
  const nextPts = Math.max(floor, pts - ENTRY_FEE[t]);
  return { pts: nextPts, streak: 0, delta: nextPts - pts, bonus: 0 };
}

// Temporada de uma data (UTC, "YYYY-MM"); nunca anterior à primeira ("2026-11").
export function seasonOf(now = Date.now()) {
  const d = new Date(now);
  const s = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  return s < FIRST_SEASON ? FIRST_SEASON : s;
}

// Fim da temporada em ms (epoch UTC): 1º dia do mês seguinte, 00:00 UTC.
export function seasonEnds(season) {
  const [y, m] = season.split('-').map(Number);
  return Date.UTC(y, m, 1);
}

// Nome legível da temporada ("November 2026"), como no PB.
export function seasonName(season) {
  return new Date(`${season}-01T00:00:00Z`)
    .toLocaleDateString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
