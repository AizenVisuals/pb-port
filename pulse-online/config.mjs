// Constantes do pulse-online — espelho das regras do jogo (public/pulse/).
export const VERSION = '0.2.0';
export const FIREBASE_PROJECT = 'pulse-arena-pb';

// Os 35 treinadores do elenco (public/trainers.json) — mesma lista do jogo.
export const TRAINERS = [
  'alain', 'archie', 'ash', 'ashjohto', 'az', 'blue', 'brendan', 'cynthia',
  'cyrus', 'dawn', 'diantha', 'gold', 'gary', 'ghetsis', 'giovanni', 'gladion',
  'iris', 'jaiden', 'joey', 'jonathan', 'lance', 'leon', 'lillie', 'lillie_dress',
  'lucas', 'maxie', 'may', 'mustard', 'n', 'paul', 'oak', 'red', 'silver',
  'steven', 'wolfe',
];

// Times (escolha do jogador no login/perfil).
export const TEAMS = ['valor', 'instinct', 'mystic'];

// Nick: mesma regra do servidor PB (server/index.mjs) — 2 a 16 caracteres.
export const NICK_RE = /^[\p{L}\p{N} ._'-]{2,16}$/u;

// Sessão (token do jogador): 90 dias. Convidado sem vínculo perde a conta se perder o token.
export const SESSION_TTL_SECONDS = 90 * 24 * 3600;

// Tamanho máximo do corpo JSON (igual ao maxPayload 64 KiB do servidor PB).
export const MAX_BODY_BYTES = 64 * 1024;
