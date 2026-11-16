import {mountArena} from './arena-ui.js';
import {bindGamepad} from './gamepad.js';
import {createManagementUI} from './management-ui.js';
import {ITEMS,STONES,MINTS,EVOLUTIONS,levelOf,xpAt,moveRequirement,specialPool,displayMaxHp,displayStats} from './growth.js';
import {mountAccount, accountError} from './account.js';
import {bindBattleControls} from './controls.js';
import {installAudioControls,setMenuAmbient,rewardSound,playPulseSound} from './ui-audio.js';
import {animatePartner} from './sprites.js';
import {SUMMON_BANNERS,isSummonable} from './banners.js';
import {ALL_STAGES, stageOpponentLevel} from './campaign.js';
import { BattleNarrator } from "./battle-log.js";
import { createProgression, ECONOMY, TRAINERS, resolveTrainerKey, trainerFace, trainerLabel } from "./progression.js";
import { createOnlineClient, needsLogin, GO_TEAMS, goTeamName, onlineErrorMessage, friendRequestErrorMessage, rankedProgress, localizeTier } from "./online.js";
import { icon } from "./icons.js";
import {damageGraphHTML} from './damage-graph.js';
import {TRAINING_FORMATS, mountTrainingFormatSelector} from './battle.js';
const $ = (id) => document.getElementById(id),
  all = (sel) => [...document.querySelectorAll(sel)];
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const types = {
  normal: "Normal",
  fire: "Fogo",
  water: "Água",
  electric: "Elétrico",
  grass: "Planta",
  ice: "Gelo",
  fighting: "Lutador",
  poison: "Veneno",
  ground: "Terra",
  flying: "Voador",
  psychic: "Psíquico",
  bug: "Inseto",
  rock: "Pedra",
  ghost: "Fantasma",
  dragon: "Dragão",
  dark: "Sombrio",
  steel: "Aço",
  fairy: "Fada",
};
const TYPE_COLORS = {
  normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C",
  grass: "#7AC74C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1",
  ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
  rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", dark: "#705746",
  steel: "#B7B7CE", fairy: "#D685AD",
};
const STATUS_META = {
  brn: { label: "QUEIMADO", cls: "st-brn" },
  par: { label: "PARALISADO", cls: "st-par" },
  psn: { label: "ENVENENADO", cls: "st-psn" },
  slp: { label: "DORMINDO", cls: "st-slp" },
  frz: { label: "CONGELADO", cls: "st-frz" },
  toxic: { label: "ENVENENADO", cls: "st-tox" },
  confused: { label: "CONFUSO", cls: "st-cnf" },
};
const STAGE_LABELS = { atk: "ATQ", def: "DEF", spa: "ATQ ESP", spd: "DEF ESP", spe: "VEL" };
// Índice do tipo na folha de glifos 686 (ordem = chaves de `types`).
const TYPE_INDEX = Object.fromEntries(Object.keys(types).map((t, i) => [t, i]));
// Ícone de tipo (glifo branco da folha 686 sobre a cor oficial do tipo).
// px = tamanho do ícone; a folha tem 18 células de 28px (504×28).
const typeIcon = (t, px = 24) => {
  const i = TYPE_INDEX[t] ?? 0;
  return `<span class="type-ico" style="--type:${TYPE_COLORS[t] || "#8fa8b3"};background-position:${-i * px}px 0;width:${px}px;height:${px}px;background-size:${(504 * px) / 28}px ${px}px" aria-hidden="true"></span>`;
};
// Pedra de Mega Evolução clássica (PokéSprite, variante outline) por espécie.
// Espécies sem pedra clássica (dragoniteL, froslassAP, greninja, floette,
// golisopodJJ, marshadow) usam o botão MEGA só com texto.
const MEGA_STONES = {
  venusaur: "venusaurite.png", charizard: "charizardite-x.png",
  blastoise: "blastoisinite.png", gengar: "gengarite.png",
  steelixD: "steelixite.png", sceptile: "sceptilite.png",
  blazikenNM: "blazikenite.png", swampertNM: "swampertite.png",
  gardevoir: "gardevoirite.png", aggron: "aggronite.png",
  sharpedoH: "sharpedonite.png", cameruptH: "cameruptite.png",
  absolNM: "absolite.png", metagross: "metagrossite.png",
  garchomp: "garchompite.png",
};
// Narrador do log de batalha (battle-log.js) + fila de mensagens do HUD.
// A mensagem fica visível ~3,8 s; a última permanece até a próxima chegar.
let narrator = null, battleLogQueue = [], battleLogTimer = 0;
function pushBattleMessages(list) {
  if (!list?.length) return;
  battleLogQueue.push(...list);
  if (!battleLogTimer) showNextBattleMessage();
}
function showNextBattleMessage() {
  const msg = battleLogQueue.shift();
  if (!msg) { battleLogTimer = 0; return; }
  const el = $("battle-log");
  if (el) {
    el.textContent = msg;
    el.classList.remove("battle-log-show");
    void el.offsetWidth; // reinicia a animação de entrada
    el.classList.add("battle-log-show");
  }
  battleLogTimer = setTimeout(showNextBattleMessage, 3800);
}
function clearBattleLog() {
  battleLogQueue = [];
  if (battleLogTimer) { clearTimeout(battleLogTimer); battleLogTimer = 0; }
  const el = $("battle-log");
  if (el) { el.textContent = ""; el.classList.remove("battle-log-show"); }
}
const TIER_META = {
  C: { code: "C", label: "Comum", cls: "tier-c" },
  R: { code: "R", label: "Raro", cls: "tier-r" },
  SR: { code: "SR", label: "Super Raro", cls: "tier-sr" },
  SSS: { code: "SSS", label: "Mítico", cls: "tier-sss" },
  UR: { code: "UR", label: "Lendário", cls: "tier-ur" },
};
const UR_KEYS = new Set(["articuno", "zapdos", "moltres", "mewtwo"]);
const SSS_KEYS = new Set(["mew", "marshadow"]);
const rarityTier = (m) => {
  const r = m?.rarity;
  if (TIER_META[r]) return TIER_META[r];
  if (SSS_KEYS.has(m?.key)) return TIER_META.SSS;
  if (UR_KEYS.has(m?.key)) return TIER_META.UR;
  if (r === "epic") return TIER_META.SR;
  if (r === "rare") return TIER_META.R;
  return TIER_META.C;
};
const tierOf = (m) =>
  typeof m === "string" ? TIER_META[m] || TIER_META.C : rarityTier(m);
const tierBadge = (m) => {
  const t = tierOf(m);
  return `<span class="tier-badge ${t.cls}">${t.code}</span>`;
};
const effectLabel = (eff, power, cat) =>
  cat === "status" || cat === "stat" || (!power && cat !== "phys" && cat !== "spec")
    ? "STATUS"
    : eff === null || eff === undefined
      ? "SEM ALVO"
      : eff === 0
        ? "SEM EFEITO"
        : eff === 1
          ? "NORMAL"
          : eff > 1
            ? "SUPER EFETIVO"
            : "POUCO EFETIVO";
const effectClass = (eff, power, cat) =>
  cat === "status" || cat === "stat" || (!power && cat !== "phys" && cat !== "spec")
    ? "eff-status"
    : eff === null || eff === undefined
      ? "eff-unknown"
      : eff === 0
        ? "eff-none"
        : eff === 1
          ? "eff-neutral"
          : eff > 1
            ? "eff-super"
            : "eff-weak";
const p = createProgression({profileMode:"journey"});
// Cliente do servidor online (pulse-online). Sessão em localStorage, fora do save.
const online = createOnlineClient({});
let account = null,
  loginScreenActive = false,
  pendingTeam = null;
let management,routeHistory=[];
let trainingFormatSelector = null;
let catalog = [],
  shiny = {},
  route = "home",
  ownedFilter = "all",
  shopFilter = "pokemon",
  battle = null,
  snapshot = null,
  toastTimer,
  heroToken = 0,
  teamPick = null,
  summonBusy = false,
  revealTimer,
  activeStage=null,
  wildBattle=false,
  selectedBanner="route",
  stopBannerSprite=null,
  // Online fase 2b: caches das telas de Amigos/Ranking (o servidor é a fonte;
  // o save guarda só o último standing e os resultados pendentes).
  friendsCache=null,friendsError=null,friendsLoading=false,
  rankingCache=null,ladderCache=null,rankingHistory=null,rankingError=null,rankingLoading=false,rankingStale=false,
  pendingRanked=null,pendingFriendBattle=null,
  battleOpponentLabel=null,
  heartbeatTimer=0,flushingMatches=false;
const reducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;
function currencyPulse(id, value) {
  const el = $(id),
    before = el.dataset.value;
  el.dataset.value = String(value);
  if(before!==undefined&&Number(before)<value)rewardSound();
  if (before !== undefined && Number(before) < value && !reducedMotion())
    el.closest("button").animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.09)" },
        { transform: "scale(1)" },
      ],
      { duration: 320, easing: "cubic-bezier(.16,1,.3,1)" },
    );
}
const save = () => p.getSave(),
  mon = (key) => catalog.find((m) => m.key === key),
  isShiny = (key) => save().shinyEquipped.includes(key);
const face = (m, forceShiny = false) =>
  `/${(forceShiny || isShiny(m.key)) && shiny[m.key] ? shiny[m.key].portrait : `assets/portraits/${m.dex}_Normal.png`}`;
const portrait = (m, extra = "") =>
  `<img src="${esc(face(m))}" alt="${esc(m.name)}" ${extra}>`;
const tags = (m) =>
  m.types
    .map(
      (t) =>
        `<span class="type-tag" style="--type:${TYPE_COLORS[t] || "#8fa8b3"}">${types[t] || esc(t)}</span>`,
    )
    .join("");
function notify(message) {
  clearTimeout(toastTimer);
  $("toast").textContent = message;
  $("toast").hidden = false;
  toastTimer = setTimeout(() => ($("toast").hidden = true), 3500);
}
function apply(result) {
  if (!result.ok) {
    notify(result.error);
    return false;
  }
  refresh();
  return true;
}
function showDialog(id) {
  $(id).showModal();
}
function closeDialogs() {
  all("dialog[open]").forEach((d) => d.close());
}
function goBack(){navigate(routeHistory.pop()||"home",true);}
function navigate(next,fromBack=false) {
  if (battle && !["ended", "error", "destroyed"].includes(battle.state)) return;
  if(next==="home")routeHistory=[];else if(!fromBack&&next!==route)routeHistory.push(route);
  if(next!==route)management?.stopSprites();
  $("app").dataset.route=next;
  route = next;
  all("#screens>.screen").forEach(
    (s) => (s.hidden = s.id !== `screen-${next}`),
  );
  all("[data-route]").forEach((b) => {
    if (b.dataset.route === next) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  $("screens").scrollTop = 0;
  refresh();
  if(next!=="summon"){stopBannerSprite?.();stopBannerSprite=null;}
  if(next==="summon")drawBanner();
  if(next==="campaign")renderCampaign();
  if (next === "home") drawHero();
  if(next==="friends")loadFriends();
  if(next==="rankings")loadRankings();
}
function renderMissions(){
  const missions=p.getMissions(),state=save(),ready=missions.filter(m=>m.complete&&!m.claimed).length,claimed=missions.filter(m=>m.claimed).length;
  const pokemonSpins=state.tickets||0,tmSpins=state.growth?.inventory.moveTicket||0;
  const missionButton=$('home-missions'),missionBadge=$('mission-ready-badge');
  if(missionButton)missionButton.setAttribute('aria-label',ready?`Abrir missões, ${ready} prontas para resgatar`:'Abrir missões');
  if(missionBadge){missionBadge.hidden=ready===0;missionBadge.textContent=ready>9?'9+':String(ready);}
  $('mission-summary').textContent=`${ready} prontas para resgatar · ${claimed}/50 resgatadas · ${pokemonSpins} ${pokemonSpins===1?'giro':'giros'} Pokémon · ${tmSpins} ${tmSpins===1?'giro':'giros'} TM`;
  $('mission-list').innerHTML=missions.map(mission=>{
    const rewardName=mission.reward==='tm'?'TM':'Pokémon';
    const action=mission.claimed?'Resgatada':mission.complete?'Resgatar':'Em progresso';
    return `<article class="mission-row ${mission.complete?'is-complete':''} ${mission.claimed?'is-claimed':''}"><div class="mission-copy"><h3>${esc(mission.title)}</h3><span>${esc(mission.category)}</span></div><div class="mission-progress"><progress max="${mission.target}" value="${mission.current}" aria-label="${esc(mission.title)}: ${mission.current} de ${mission.target}"></progress><small>${mission.current} / ${mission.target}</small></div><span class="mission-reward">${icon('ticket')} ${mission.rewardCount} giro ${rewardName}</span><button type="button" class="mission-claim secondary-button" data-claim-mission="${mission.id}" ${mission.complete&&!mission.claimed?'':'disabled'}>${action}</button></article>`;
  }).join('');
}
function refresh() {
  catalog = p.getCatalog();
  const s = save();
  const bannerMeter=selectedBanner==="route"?s.gacha:(s.gacha.banners?.[selectedBanner]||{pity:0});
  const summonBanner=SUMMON_BANNERS.find(b=>b.id===selectedBanner);
  $("banner-description").textContent=SUMMON_BANNERS.find(b=>b.id===selectedBanner).description;
  $("trainer-name").textContent = s.trainerName;
  const trainerFaceEl = $("trainer-face");
  if (trainerFaceEl) {
    const facePath = trainerFace(s.trainerKey);
    if (trainerFaceEl.getAttribute("src") !== facePath) trainerFaceEl.src = facePath;
    trainerFaceEl.alt = `Treinador ${trainerLabel(s.trainerKey)}`;
  }
  const onlineState = s.online;
  $("account-summary").textContent = onlineState?.provider === "google" ? "Conta Google conectada" : onlineState?.provider === "guest" ? "Conta de convidado · online" : onlineState?.provider === "local" ? "Conta local · sincroniza depois" : s.trainer?`Treinador Nv. ${levelOf(s.trainer.xp||0)} · no aparelho`:`Seu progresso, no aparelho`;
  $("coin-balance").textContent = s.coins.toLocaleString("pt-BR");
  $("diamond-balance").textContent = s.diamonds.toLocaleString("pt-BR");
  currencyPulse("coin-balance", s.coins);
  currencyPulse("diamond-balance", s.diamonds);
  // Selects de formato/dificuldade ficam ocultos na Home nova, mas seguem
  // no DOM: refresh(), wire() e startBattle() leem deles sem mudança.
  const fmtSel = $("format-select");
  if (fmtSel) {
    fmtSel.innerHTML = Array.from({length: Math.min(6, s.unlocked.length)}, (_, i) => `<option value="${i+1}v${i+1}">Equipe ${i+1} × ${i+1}</option>`).join("");
    fmtSel.value = `${s.team.mons.length}v${s.team.mons.length}`;
  }
  const railBattle = $("rail-battle");
  if (railBattle) {
    railBattle.disabled = s.team.mons.length < 1;
    railBattle.title = "Treino contra uma equipe do mesmo tamanho e nível.";
  }
  // Seletor de formato do treino: segue o formato salvo (tamanho da equipe).
  trainingFormatSelector?.sync({current: fmtSel?.value, unlocked: s.unlocked.length});
  // Home nova: carteira, avatar e progresso da jornada (valores do save).
  const setHomeText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  setHomeText("home-coins-value", s.coins.toLocaleString("pt-BR"));
  setHomeText("home-diamonds-value", s.diamonds.toLocaleString("pt-BR"));
  setHomeText("home-tickets-value", (s.tickets || 0).toLocaleString("pt-BR"));
  setHomeText("home-trainer-name", s.trainerName);
  const homeFaceEl = $("home-trainer-face");
  if (homeFaceEl) {
    const facePath = trainerFace(s.trainerKey);
    if (homeFaceEl.getAttribute("src") !== facePath) homeFaceEl.src = facePath;
    homeFaceEl.alt = `Treinador ${trainerLabel(s.trainerKey)}`;
  }
  setHomeText("home-journey-progress", `Jornada de Kanto · ${s.journey?.cleared.length || 0} / ${ALL_STAGES.length} fases`);
  for (const [id, value] of Object.entries({
    "record-battles": s.records.battles,
    "record-wins": s.records.wins,
    "record-collection": s.unlocked.length,
    "rewards-owned": `${s.unlocked.length} descobertos`,
    "rewards-roster": `${catalog.length} Pokémon`,
    "pity-count": `${bannerMeter.pity} / 10`,
  }))
    $(id).textContent = value;
  $("collection-progress").value = s.unlocked.length;
  $("collection-progress").max = catalog.length;
  $("pity-progress").value = bannerMeter.pity;
  const pityText=document.querySelector(".pity-box p");
  if(pityText)pityText.textContent=summonBanner?.premium?"Após 9 invocações sem SSS seguidas, a próxima invocação garante um Pokémon SSS.":"Após 9 resultados comuns seguidos, a próxima invocação garante R, SR, SSS ou UR.";
  const oddsGuarantee=$("odds-guarantee"),oddsRates=$("odds-rates"),oddsDuplicates=$("odds-duplicates");
  if(oddsGuarantee)oddsGuarantee.textContent=summonBanner?.premium?"Banner premium: sem tier comum. A garantia é separada para cada banner. Após nove invocações sem SSS naquele banner, a próxima garante um SSS.":"A garantia é separada para cada banner. Após nove comuns consecutivos naquele banner, a próxima invocação garante R, SR, SSS ou UR.";
  if(oddsRates)oddsRates.textContent=summonBanner?.premium?"SR: 85% · SSS: 15%.":"C: 70% · R: 21% · SR: 7,8% · SSS: 0,7% · UR: 0,5%.";
  if(oddsDuplicates)oddsDuplicates.textContent=summonBanner?.premium?"Pokémon repetidos viram diamantes: SR 60 · SSS 150. Use na loja para escolher um Pokémon ou adquirir uma versão shiny. Na invocação garantida, a chance é SSS 100%. Você também pode desbloquear Pokémon diretamente pela coleção.":"Pokémon repetidos viram diamantes: C 10 · R 30 · SR 60 · SSS 150 · UR 300. Use na loja para escolher um Pokémon ou adquirir uma versão shiny. Na invocação garantida, as chances são R 70% · SR 26% · SSS 2,33% · UR 1,67%. Você também pode desbloquear Pokémon diretamente pela coleção.";
  const daily =
    s.dailyClaimedAt &&
    s.dailyClaimedAt >= new Date().toISOString().slice(0, 10);
  $("daily-claim").disabled = !!daily;
  $("daily-claim").textContent = daily
    ? "Resgatado hoje"
    : `Resgatar 150 moedas${s.growth?" + 2 tickets":""}`;
  renderMissions();
  const summonTicketCost = summonBanner?.premium ? (summonBanner.ticketCost || 2) : 1;
  const summonDiamondCost = summonBanner?.premium ? (summonBanner.diamondCost || 400) : ECONOMY.summonDiamondCost;
  const summonCostFor = (count) => {
    const ticketPulls = Math.min(count, Math.floor((s.tickets || 0) / summonTicketCost));
    const diamonds = (count - ticketPulls) * summonDiamondCost;
    return { tickets: ticketPulls * summonTicketCost, diamonds, affordable: s.diamonds >= diamonds };
  };
  const summonCostLabel = (count) => {
    const cost = summonCostFor(count);
    const parts = [];
    if (cost.tickets) parts.push(`${cost.tickets} ticket${cost.tickets > 1 ? "s" : ""}`);
    if (cost.diamonds) parts.push(`${cost.diamonds.toLocaleString("pt-BR")} diamantes`);
    return parts.join(" + ");
  };
  $("summon-one").disabled = summonBusy || !summonCostFor(1).affordable;
  $("summon-ten").disabled = summonBusy || !summonCostFor(10).affordable;
  $("summon-one").querySelector("span").textContent = summonCostLabel(1);
  $("summon-ten").querySelector("span").textContent = summonCostLabel(10);
  $("summon-budget").textContent =
    `${s.tickets || 0} ticket${(s.tickets || 0) === 1 ? "" : "s"} de invocação · ${s.diamonds.toLocaleString("pt-BR")} diamantes`;
  const starterBtn = $("starter-tickets-claim");
  if (starterBtn) {
    starterBtn.disabled = !!s.starterTicketsClaimed;
    starterBtn.textContent = s.starterTicketsClaimed
      ? "Recompensa inicial resgatada"
      : "Resgatar 10 tickets de invocação";
  }
  const status = p.status();
  $("save-status").hidden = !status.message;
  $("save-status").textContent = status.message;
  if (route === "team") renderTeam();
  if (route === "collection") renderCollection();
  if (route === "shop") renderShop();
  if(route==="partner")management?.renderPartner();
  if(route==="summon")management?.renderTechniques();
  if(route==="bag")renderBag();
  if(route==="friends")renderFriends();
  if(route==="rankings")renderRankings();
}
function renderTeam(){management?.renderTeam();}
function renderCollection() {
  all("[data-owned]").forEach((x) =>
    x.setAttribute("aria-pressed", String(x.dataset.owned === ownedFilter)),
  );
  const s = save(),
    q = $("collection-search").value.trim().toLocaleLowerCase("pt-BR"),
    type = $("type-filter").value;
  const matches = catalog.filter(
    (m) =>
      (ownedFilter === "all" || m.owned === (ownedFilter === "owned")) &&
      (!type || m.types.includes(type)) &&
      (!q ||
        `${m.name} ${m.types.map((t) => types[t]).join(" ")}`
          .toLocaleLowerCase("pt-BR")
          .includes(q)),
  );
  $("collection-total").textContent =
    teamPick !== null
      ? "Escolha quem entra nesta posição da equipe."
      : `${s.unlocked.length} de ${catalog.length} Pokémon descobertos`;
  $("collection-empty").hidden = !!matches.length;
  $("collection-grid").innerHTML = matches
    .map(
      (m) =>
        `<button data-detail="${m.key}" class="pokemon-card rarity-${rarityTier(m).code} ${m.owned ? "" : "is-locked"}" aria-label="${esc(m.name)}, ${m.owned ? "na coleção" : "não desbloqueado"}">${portrait(m)}<span class="card-main"><span class="card-name">${esc(m.name)}${save().shinies.includes(m.key) ? `<span class="card-shiny">Shiny</span>` : ""}${tierBadge(m)}</span><span class="card-types">${m.types.map((t) => typeIcon(t, 20)).join("")}</span></span><span class="card-level">${m.owned ? `Nv. ${m.level}` : "A descobrir"}</span></button>`,
    )
    .join("");
}
function renderShop() {
  const s = save();
  $("buy-pokeballs").hidden=shopFilter!=="items";
  $("shop-balance").textContent=shopFilter==="items"?`${s.coins} moedas`:`${s.diamonds} diamantes`;
  if(shopFilter==="items"){
    $("shop-grid").innerHTML=[...Object.entries(ITEMS).map(([id,item])=>[id,item,'item']),...Object.entries(STONES).map(([id,item])=>[id,item,'stone']),...Object.entries(MINTS).map(([id,item])=>[id,item,'mint'])].map(([id,item,kind])=>`<article class="shop-consumable">${kind==='mint'?'<span class="shop-mint-symbol" aria-hidden="true">🌿</span>':`<img src="${item.asset||`/pulse/assets/items/${id}.png`}" alt="">`}<div><h2>${item.name}</h2><p>${item.description}</p></div><button data-buy-${kind}="${id}" class="primary-button" ${s.coins<item.price?'disabled':''}>${item.price} moedas</button></article>`).join('');return;
  }
  const list =
    shopFilter === "shiny"
      ? catalog.filter((m) => shiny[m.key])
      : catalog.filter((m) => !m.owned);
  $("shop-grid").innerHTML =
    list
      .map((m) => {
        const cosmetic = shopFilter === "shiny",
          bought = cosmetic && s.shinies.includes(m.key),
          price = cosmetic ? ECONOMY.shinyPrice : m.price;
        return `<button class="shop-item rarity-${rarityTier(m).code}" data-shop-detail="${m.key}" data-cosmetic="${cosmetic}"><img src="${esc(face(m, cosmetic))}" alt=""><span class="shop-main"><span class="shop-name">${esc(m.name)}${cosmetic ? " Shiny" : ""}${tierBadge(m)}</span><span class="shop-types">${m.types.map((t) => typeIcon(t, 20)).join("")}${bought ? `<span class="shop-note">Na sua coleção</span>` : cosmetic ? `<span class="shop-note">Visual alternativo</span>` : ""}</span></span><strong>${bought ? icon("check") : (cosmetic || isSummonable(m.key)) ? `${icon("diamond")} ${price}` : "Evolução"}</strong></button>`;
      })
      .join("") ||
    '<p class="empty-state">Você já desbloqueou todos os Pokémon desta edição.</p>';
}
function detail(key, cosmetic = false) {
  const m = mon(key),
    s = save();
  if (!m) return;
  if (teamPick !== null && m.owned) {
    const t = structuredClone(s.team);
    const prior = t.mons.indexOf(key);
    if(teamPick>=t.mons.length&&prior>=0){notify("Esse parceiro já está na equipe.");return;}
    if (prior >= 0) [t.mons[prior], t.mons[teamPick]] = [t.mons[teamPick], key];
    else t.mons[teamPick] = key;
    t.gimmick = null;
    if (apply(p.setTeam(t))) {
      teamPick = null;
      navigate("team");
    }
    return;
  }
  if(m.owned&&!cosmetic){management.openPartner(key);return;}
  $("detail-content").innerHTML =
    `<div class="dialog-heading"><h2>${cosmetic ? "Versão shiny" : "Conheça seu parceiro"}</h2><button data-close class="icon-button" aria-label="Fechar">${icon("close")}</button></div><div class="detail-hero"><img src="${esc(face(m, cosmetic))}" alt="${esc(m.name)}"><div><h2>${esc(m.name)}${cosmetic ? " Shiny" : ""}</h2><span class="type-list">${tags(m)}</span><p>${tierBadge(m)} ${rarityTier(m).label} · ${m.owned ? "Desbloqueado" : "A descobrir"}</p></div></div><div class="detail-stats">${Object.entries(displayStats(m.stats, m.level, {ivs:m.ivs,nature:m.effectiveNature}))
      .map(
        ([k, v]) =>
          `<div><small>${{ hp: "HP", atk: "Ataque", def: "Defesa", spa: "Atq. especial", spd: "Def. especial", spe: "Velocidade" }[k]}</small><b>${v}</b></div>`,
      )
      .join(
        "",
      )}</div><p class="support-copy">${cosmetic ? "Uma nova cor para o mesmo parceiro. Não altera atributos ou golpes." : m.owned ? "Disponível para a jornada e suas equipes de batalha." : isSummonable(key) ? "Desbloqueie na loja ou encontre este Pokémon nas invocações." : "Evolua este Pokémon a partir de sua forma base."}</p><div class="detail-actions">${cosmetic ? (s.shinies.includes(key) ? `<button data-shiny-toggle="${key}" class="primary-button">${isShiny(key) ? "Usar visual original" : "Equipar shiny"}</button>` : `<button data-buy-shiny="${key}" class="primary-button" ${!m.owned || s.diamonds < 300 ? "disabled" : ""}>${!m.owned ? "Desbloqueie o Pokémon primeiro" : `Comprar por ${300} diamantes`}</button>`) : m.owned ? `<button data-favorite="${key}" class="primary-button">${s.favorite === key ? "Seu favorito" : "Destacar no lobby"}</button><button data-moves="${key}" class="secondary-button">Escolher golpes</button>${shiny[key] ? `<button data-view-shiny="${key}" class="secondary-button">Ver shiny</button>` : ""}` : isSummonable(key) ? `<button data-buy="${key}" class="primary-button" ${s.diamonds < m.price ? "disabled" : ""}>Desbloquear · ${m.price} diamantes</button><button data-go-summon class="secondary-button">Ir às invocações</button>` : ``}</div>`;
  if (!$("detail-dialog").open) showDialog("detail-dialog");
}
function movePicker(key){management.openPartner(key,'moves');}
async function drawHero() {
  const token = ++heroToken,
    m = mon(save().favorite);
  if (!m) return;
  // Card do parceiro (texto — não depende da imagem, atualiza antes do await).
  const tier = tierOf(m);
  const setHomeText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  setHomeText("home-partner-name", m.name);
  const tierEl = $("home-partner-tier");
  if (tierEl) { tierEl.className = `tier-badge ${tier.cls}`; tierEl.textContent = tier.code; }
  setHomeText("home-partner-level", `Nv. ${m.level}`);
  const typesEl = $("home-partner-types");
  if (typesEl) typesEl.innerHTML = tags(m);
  const shinyEl = $("home-partner-shiny");
  if (shinyEl) shinyEl.hidden = !isShiny(m.key);
  // HP cheio: o HP não persiste entre batalhas; o máximo é a fórmula
  // clássica no nível (ver displayMaxHp em growth.js), com o IV do parceiro.
  const maxHp = displayMaxHp(m.stats.hp, m.level, m.ivs?.hp ?? 31);
  setHomeText("home-partner-hp", `${maxHp} / ${maxHp}`);
  const hpBar = $("home-partner-hp-bar");
  if (hpBar) hpBar.style.width = "100%";
  const image = new Image();
  image.src = `/${isShiny(m.key) && shiny[m.key] ? shiny[m.key].idle : m.icon.file}`;
  try {
    await image.decode();
  } catch {
    return;
  }
  if (token !== heroToken) return;
  const canvas = $("hero-canvas");
  if (!canvas) return;
  const bounds = canvas.parentElement.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(bounds.width * 2));
  canvas.height = Math.max(1, Math.round(bounds.height * 2));
  const ctx = canvas.getContext("2d"),
    w = isShiny(m.key) && shiny[m.key] ? shiny[m.key].w : m.icon.w,
    h = isShiny(m.key) && shiny[m.key] ? shiny[m.key].h : m.icon.h,
    cols = Math.floor(image.width / w);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sample = document.createElement("canvas");
  sample.width = image.width;
  sample.height = h;
  const sampleCtx = sample.getContext("2d", { willReadFrequently: true });
  sampleCtx.drawImage(image, 0, 0);
  const pixels = sampleCtx.getImageData(0, 0, image.width, h).data;
  let minX = w,
    minY = h,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < image.width; x++)
      if (pixels[(y * image.width + x) * 4 + 3] > 20) {
        minX = Math.min(minX, x % w);
        maxX = Math.max(maxX, x % w);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
  const bw = Math.max(1, maxX - minX + 1),
    bh = Math.max(1, maxY - minY + 1);
  const loop = (t) => {
    if (token !== heroToken) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    // Home nova: sem rótulo sob o sprite — centraliza no palco do parceiro.
    const scale = Math.max(
        1,
        Math.min(16, (canvas.height - 16) / bh, (canvas.width - 16) / bw),
      ),
      frame = reduced ? 0 : Math.floor(t / 110) % cols;
    ctx.drawImage(
      image,
      frame * w + minX,
      minY,
      bw,
      bh,
      (canvas.width - bw * scale) / 2,
      (canvas.height - bh * scale) / 2,
      bw * scale,
      bh * scale,
    );
    if (!reduced && route === "home" && !document.hidden)
      requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
function summonSpentLabel(result) {
  const parts = [];
  if (result.spentTickets) parts.push(`${result.spentTickets} ticket${result.spentTickets > 1 ? "s" : ""}`);
  if (result.spentDiamonds) parts.push(`${result.spentDiamonds.toLocaleString("pt-BR")} diamantes`);
  return parts.length ? `${parts.join(" + ")} usados` : "Nenhum custo";
}
function startPulls(count) {
  if (summonBusy) return;
  const result = p.summon(count,selectedBanner);
  if (!result.ok) {
    notify(result.error);
    return;
  }
  summonBusy = true;
  refresh();
  let index = 0,
    revealed = false,
    skipped = false;
  const render = () => {
    clearTimeout(revealTimer);
    const pull = result.pulls[index],
      m = mon(pull.key);
    $("pull-content").innerHTML =
      `<div class="pull-top"><span>Invocação ${index + 1} de ${result.pulls.length}</span><button id="skip-reveal" class="text-button">Pular revelação</button></div><div class="pull-scene rarity-${pull.rarity} ${revealed ? "revealed" : "charging"}">${!revealed && !matchMedia("(prefers-reduced-motion:reduce)").matches ? '<video class="portal-film" src="/pulse/assets/motion/portal.mp4" autoplay muted playsinline preload="auto" aria-hidden="true"></video>' : ""}<div class="reveal-orbit"></div><img class="reveal-pokemon" src="${esc(face(m))}" alt="${revealed ? esc(m.name) : "Revelando Pokémon"}"><div class="reveal-caption" ${revealed ? "" : "hidden"}><span class="rarity-label">${tierBadge(pull.rarity)} ${tierOf(pull.rarity).label}${pull.guaranteed ? " · Garantido" : ""}</span><h2>${esc(m.name)}</h2><p>${pull.duplicate ? `Repetido convertido em <b>${pull.diamonds} diamantes</b>` : "Novo parceiro na sua coleção!"}</p></div></div><button id="next-reveal" class="primary-button" ${revealed ? "" : "disabled"}>${index + 1 === result.pulls.length ? "Ver resultados" : "Próximo Pokémon"}</button>`;
    $("skip-reveal").onclick = () => {
      skipped = true;
      summary();
    };
    $("next-reveal").onclick = () => {
      index++;
      if (index === result.pulls.length) summary();
      else {
        revealed = false;
        render();
      }
    };
    if (!revealed) {
      const video = $("pull-content").querySelector("video");
      if (video) video.play().catch(() => {});
      revealTimer = setTimeout(
        () => {
          revealed = true;
          render();
        },
        matchMedia("(prefers-reduced-motion:reduce)").matches ? 0 : 1250,
      );
    }
  };
  const summary = () => {
    clearTimeout(revealTimer);
    $("pull-content").innerHTML =
      `<div class="dialog-heading"><h2>Suas novas conexões</h2></div><div class="pull-results">${result.pulls.map((x) => `<div class="pull-result rarity-${x.rarity} ${x.duplicate ? "" : "is-new"}">${portrait(mon(x.key))}<b>${esc(x.name)}</b><span class="rarity-label">${tierBadge(x.rarity)} ${tierOf(x.rarity).label}</span><small>${x.duplicate ? `+${x.diamonds} diamantes` : "Novo Pokémon"}</small></div>`).join("")}</div><p class="pull-receipt">${summonSpentLabel(result)}${result.diamonds ? ` · +${result.diamonds} diamantes por repetidos` : ""}</p><button class="primary-button" id="close-pulls">Continuar</button>`;
    $("close-pulls").onclick = () => {
      $("pull-dialog").close();
    };
  };
  $("pull-dialog").oncancel = (e) => {
    e.preventDefault();
    if (!skipped) {
      skipped = true;
      summary();
    } else $("pull-dialog").close();
  };
  $("pull-dialog").onclose = () => {
    clearTimeout(revealTimer);
    summonBusy = false;
    refresh();
  };
  showDialog("pull-dialog");
  render();
}
let itemIconsPromise;
async function battleGrowth(opponentLevel){
 const state=save();if(!state.growth)return undefined;
 itemIconsPromise||=Promise.all(Object.keys(ITEMS).map(async id=>{const image=new Image();image.src=`/pulse/assets/items/${id}.png`;try{await image.decode();return [id,image];}catch{return [id,null];}})).then(Object.fromEntries);
 const levels=Object.fromEntries(Object.entries(state.growth.pokemon).map(([key,pokemon])=>[key,levelOf(pokemon.xp)]));
 // Nature/IVs por Pokémon: entram no spec do ator em growth-battle.js e o
 // engine calcula os stats de batalha com eles (display == batalha).
 const traits=Object.fromEntries(Object.entries(state.growth.pokemon).map(([key,pokemon])=>[key,{ivs:pokemon.ivs,nature:pokemon.nature,mintNature:pokemon.mintNature}]));
 return {levels,traits,opponentLevel:opponentLevel||Math.max(...state.team.mons.map(k=>levels[k]||5)),selected:p.getTeam().moves,held:state.growth.held,icons:await itemIconsPromise,preview:key=>p.previewEvolution(key),onConsume:event=>p.consumeHeld({...event,battleId:battle.id}).ok,onEvolve:(from,to)=>{const result=p.evolvePokemon(from,to);refresh();if(!result.ok)notify(result.error);},onEvent:event=>playPulseSound(event.kind),onKnockout:event=>p.awardKnockoutXP(event),onDamageXP:event=>p.awardDamageXP(event)};
}
function renderBag(){management?.renderBag();}
function drawTechnique(){
 const key=$('technique-mon').value,result=p.summonMove(key);if(!apply(result))return;
 rewardSound();$('pull-content').innerHTML=`<div class="dialog-heading"><h2>TM obtida!</h2></div><div class="technique-reveal"><img class="tm-disc-inline" src="/pulse/assets/ui-tm-disc.svg" alt="Disco de TM">${portrait(mon(key))}<h2>${esc(result.move.name)}</h2><p>${esc(mon(key).name)} é compatível com esta TM. Use o item na mochila para ensinar o golpe.</p><span class="type-list">${types[result.move.type]}</span></div><button id="technique-equip" class="primary-button">Abrir mochila</button><button id="technique-close" class="text-button">Fechar</button>`;
 $('pull-dialog').onclose=()=>refresh();$('technique-equip').onclick=()=>{$('pull-dialog').close();navigate('bag');};$('technique-close').onclick=()=>$('pull-dialog').close();showDialog('pull-dialog');
}
let arenaUI, arenaSocket=null, activeArena=null;
async function startArenaMatch(match){
  activeArena=match;activeStage=null;wildBattle=false;pendingRanked=null;pendingFriendBattle=null;
  closeDialogs();battle?.destroy();setMenuAmbient(false);narrator=new BattleNarrator(key=>mon(key)?.name||key);clearBattleLog();
  battleOpponentLabel=match.opponent.nick;
  $("app").hidden=true;$("battle-screen").hidden=false;$("battle-loading").hidden=false;
  await window.PulseNative?.setBattleMode(true);
  try{
    const {ArenaBattle}=await import('./arena-battle.js');
    const runtime=battle=new ArenaBattle({canvas:$("battle-canvas"),onUpdate:updateBattle,onEnd:endBattle,
      send:msg=>{if(arenaSocket?.readyState===1)arenaSocket.send(JSON.stringify(msg));},
      onError:error=>{exitBattle();notify(error.message);}});
    arenaSocket=await online.openArenaSocket({onMessage:msg=>runtime.receive(msg),onClose:()=>runtime.disconnected()});
    const loaded=await runtime.connectMatch(match,save().trainerName,save().trainerKey);
    if(!loaded)return;
    arenaSocket.send(JSON.stringify({t:'ready',match_id:match.match_id}));
  }catch(error){exitBattle();notify(error.message);}
}
function endArenaBattle(result){
  const server=battle?.serverResult;
  $("pause-dialog").close();
  $("result-content").innerHTML=`<div class="result-symbol">${icon(result.won?'star':'shield')}</div><h2>${result.won?'Vitória na Arena!':'Batalha encerrada'}</h2><p>${result.reason==='forfeit'?'Partida decidida por desistência ou desconexão.':'Resultado confirmado pelo servidor.'}</p><div class="result-coins">${server?.delta>0?'+':''}${server?.delta??0} pontos de Arena</div><p>${server?.points_after??0} pontos na temporada · a campanha e seus itens foram preservados.</p><button id="arena-result-back" class="primary-button">Voltar à Arena</button>`;
  showDialog('result-dialog');$('arena-result-back').onclick=()=>{exitBattle();arenaUI.open();};
}
async function startBattle(options={}) {
  setMenuAmbient(false);
  narrator = new BattleNarrator((key) => mon(key)?.name || key);
  clearBattleLog();
  if(options?.type)options={};
  // Nome do adversário na placa da batalha (desafio de amigo / ranqueado).
  // Treino comum e fases não passam nome: a placa fica sem a linha.
  battleOpponentLabel=typeof options?.opponentName==="string"&&options.opponentName.trim()?options.opponentName.trim().slice(0,16):null;
  closeDialogs();
  battle?.destroy();
  $("app").hidden = true;
  $("battle-screen").hidden = false;
  $("battle-loading").hidden = false;
  await window.PulseNative?.setBattleMode(true);
  try {
    const { OfflineBattle } = await import("./battle.js");
    battle = new OfflineBattle({
      canvas: $("battle-canvas"),
      onUpdate: updateBattle,
      onEnd: endBattle,
      onError: (error) => {
        exitBattle();
        notify(`Não foi possível abrir a arena: ${error.message}`);
      },
    });
    await battle.start({
      team: p.getTeam(),
      difficulty: Number($("difficulty-select").value),
      format: $("format-select").value,
      shinies: save().shinyEquipped,
      shinyCatalog: shiny,
      growth: await battleGrowth(options.opponentLevel),
      ...options,
      trainer: save().trainerKey,
    });
  } catch (error) {
    exitBattle();
    notify(error.message);
  }
}
function updateBattle(s) {
  snapshot = s;
  document.querySelector('.battle-side-label').textContent = s.networked ? `VOCÊ · lado ${s.playerSide===1?'direito':'esquerdo'}${s.state==='waiting'?' · aguardando oponente':s.state==='confirming'?' · confirmando resultado':''}` : 'VOCÊ · lado esquerdo';
  $('pause-dialog').querySelector('h2').textContent = s.networked ? 'Partida online em andamento' : 'Batalha pausada';
  $('pause-dialog').querySelector('p').textContent = s.networked ? 'O adversário continua jogando. Volte ao combate ou desista.' : 'Seu tempo também está pausado.';
  if(s.onlineMenu&&!$('pause-dialog').open)showDialog('pause-dialog');
  $("battle-loading").hidden = s.state !== "loading";
  const trainerEl=$("opponent-trainer");
  if(trainerEl){
    trainerEl.hidden=!battleOpponentLabel;
    if(battleOpponentLabel)trainerEl.textContent=battleOpponentLabel;
  }
  if (!s.player) return;
  $("player-trainer").textContent = save().trainerName;
  for (const action of s.newActions || []) {
    const el = $(action.side === 0 ? "player-last-move" : "opponent-last-move");
    if (el) { el.textContent = action.name; el.dataset.frame = String(s.frame); }
  }
  for (const side of ["player", "opponent"]) {
    const el = $(side + "-last-move");
    if (el && s.frame - Number(el.dataset.frame || 0) > 180) el.textContent = "";
  }
  // Narra o que acabou de acontecer (stage, status, Protect) no log do HUD.
  if (narrator) pushBattleMessages(narrator.feed(s));
  $("battle-clock").textContent =
    `${Math.floor(s.secondsLeft / 60)}:${String(Math.floor(s.secondsLeft % 60)).padStart(2, "0")}`;
  const statusOf = (a) => {
    if (a.status) return STATUS_META[a.status];
    if (a.frozen) return STATUS_META.frz;
    if (a.toxic) return STATUS_META.toxic;
    if (a.confused) return STATUS_META.confused;
    return null;
  };
  const ballsKey = (bench) =>
    (bench || []).map((m) => `${m.key}:${m.fainted ? 0 : 1}`).join("|");
  const renderBalls = (el, bench) => {
    el.innerHTML = (bench || [])
      .map(
        (m) =>
          `<span class="pokeball${m.fainted ? " fainted" : ""}" title="${esc(m.name)}"></span>`,
      )
      .join("");
  };
  for (const side of ["player", "opponent"]) {
    const a = s[side], scale = a.hpScale || 1;
    $(side + "-name").textContent = a.name;
    $(side + "-level").textContent = `Nv. ${a.level}`;
    $(side + "-percent").textContent = `${Math.ceil(a.hpRatio * 100)}%`;
    const typesEl = $(side + "-types");
    const typeKey = (a.types || []).join("|");
    if (typesEl.dataset.key !== typeKey) {
      typesEl.dataset.key = typeKey;
      typesEl.innerHTML = (a.types || []).map(t => `<span style="--type-color:${TYPE_COLORS[t] || '#72858c'}">${typeIcon(t, 12)}${esc(types[t] || t)}</span>`).join("");
    }
    $(side + "-hp").textContent =
      `${Math.ceil(a.hp / scale)} / ${Math.ceil(a.maxHp / scale)}`;
    const bar = $(side + "-hp-bar");
    bar.style.width = `${a.hpRatio * 100}%`;
    bar.className =
      a.hpRatio > 0.5 ? "hp-high" : a.hpRatio > 0.25 ? "hp-mid" : "hp-low";
    const chip = $(side + "-status");
    const st = statusOf(a);
    chip.hidden = !st;
    if (st) {
      chip.textContent = st.label;
      chip.className = `status-chip ${st.cls}`;
    }
    const stagesEl = $(side + "-stages");
    const stageEntries = Object.entries(a.stages || {}).filter(([, v]) => v);
    const stageKey = stageEntries.map(([k, v]) => `${k}:${v}`).join("|");
    if (stagesEl.dataset.key !== stageKey) {
      stagesEl.dataset.key = stageKey;
      stagesEl.innerHTML = stageEntries
        .map(
          ([k, v]) =>
            `<span class="stage-chip ${v > 0 ? "st-up" : "st-down"}">${STAGE_LABELS[k] || k.toUpperCase()} ${v > 0 ? "+" : ""}${v}</span>`,
        )
        .join("");
    }
    stagesEl.hidden = !stageEntries.length;
    const ballsEl = $(side + "-balls");
    const bench = side === "player" ? s.bench : s.opponentBench;
    if (ballsEl.dataset.key !== ballsKey(bench)) {
      ballsEl.dataset.key = ballsKey(bench);
      renderBalls(ballsEl, bench);
    }
    const m = mon(a.key);
    if (m) {
      const path =
        side === "player" ? face(m) : `/assets/portraits/${m.dex}_Normal.png`;
      if ($(side + "-face").getAttribute("src") !== path)
        $(side + "-face").src = path;
    }
  }
  $("battle-auto").textContent = s.manual ? "MANUAL" : "AUTO";
  $("battle-auto").setAttribute("aria-pressed", String(!s.manual));
  $("joystick").classList.toggle("disabled", !s.manual);
  $("steer-hint").textContent = s.manual
    ? "Mova para desviar"
    : "Movimento automático";
  $("battle-choose").hidden = !s.choosing;
  // Ação especial (MEGA / CAPTURAR): vai para o 4º slot do grid
  // quando há espaço (menos de 4 golpes); com 4 golpes, fica no botão
  // redondo da área de especiais. CAPTURAR e MEGA são ações
  // independentes — uma pode estar no grid e a outra na área de especiais.
  // A evolução é automática ao cruzar o nível: sem botão EVOLUIR nem
  // prompt — o quadro #battle-evolve fica sempre oculto.
  const gridSpecial = null;
  $("battle-capture").hidden = !wildBattle;
  $("battle-mega").hidden = !s.canMega;
  $("battle-mega").textContent = "MEGA";
  $("battle-evolve").hidden = true;
  $("battle-guard").disabled = !s.guardReady;
  $("battle-dodge").disabled = !s.dodgeReady;
  // Grid 2×2, sempre 4 slots: golpes aprendidos + a ação especial no 4º
  // slot (quando há espaço) + placeholders desabilitados nos demais.
  const moveKey = s.moves.map((m) => m.name).join("|") + "|" + (gridSpecial || "");
  if ($("battle-moves").dataset.key !== moveKey) {
    $("battle-moves").dataset.key = moveKey;
    const slots = [...s.moves];
    while (slots.length < 4) slots.push(null);
    $("battle-moves").innerHTML = slots
      .map((m, i) => {
        if (m)
          return `<button data-move="${i}" class="move-button"><span class="move-line1"><span class="move-ico">${typeIcon(m.type, 24)}</span><b>${esc(m.name)}</b></span><span class="move-line2"><span class="move-power"></span><span class="move-eff"></span></span><small></small></button>`;
        if (i === 3 && gridSpecial === "capture")
          return `<button data-capture-slot class="move-button move-special"><span class="move-line1"><span class="move-ico">${icon("pokeball")}</span><b>CAPTURAR</b></span><span class="move-line2"><span class="move-power">Poké Ball</span></span><small></small></button>`;
        if (i === 3 && (gridSpecial === "mega" || gridSpecial === "evolve")) {
          const stone = MEGA_STONES[s.player.key];
          const label = gridSpecial === "evolve" ? "EVOLUIR" : "MEGA";
          return `<button data-special="mega" class="move-button move-special"><span class="move-line1">${stone ? `<img class="mega-stone" src="/pulse/assets/mega-stones/${stone}" alt="">` : `<span class="move-ico">${icon("star")}</span>`}<b>${label}</b></span><span class="move-line2"><span class="move-power">${gridSpecial === "evolve" ? "Evolução" : "Mega Evolução"}</span></span><small></small></button>`;
        }
        return `<button class="move-button move-empty" disabled aria-hidden="true"><span class="move-line1"><b>—</b></span><span class="move-line2"></span><small></small></button>`;
      })
      .join("");
    // CAPTURAR no grid: o controls.js ignora (sem data-move/data-special),
    // então o clique chega aqui.
    $("battle-moves").querySelector("[data-capture-slot]")?.addEventListener("click", captureEncounter);
  }
  all("#battle-moves button").forEach((button, i) => {
    const m = s.moves[i];
    if (!m) return; // slot especial ou vazio: sem estado por frame
    button.style.setProperty("--charge", m.charge);
    button.style.setProperty("--move-color", TYPE_COLORS[m.type] || "#8fe1de");
    button.classList.toggle("is-ready", m.charge >= 1 && !m.locked);
    button.classList.toggle("is-called", m.called);
    // Fora de alcance = estado visual (esmaecido), botão segue clicável —
    // o motor aproxima o Pokémon. Sem a linha "Ao alcance".
    button.classList.toggle("is-out-of-range", !m.inRange && !m.locked);
    button.disabled = m.locked;
    button.querySelector(".move-power").textContent = m.power ? m.power : "—";
    const effEl = button.querySelector(".move-eff");
    // Golpes de dano fixo (ex.: Seismic Toss, poder 0) não recebem
    // efetividade do engine — calcula aqui a partir dos tipos do oponente.
    let eff = m.eff;
    if ((eff === null || eff === undefined) && !m.power && (m.cat === "phys" || m.cat === "spec")) {
      const typeEff = battle?.debug?.battle?.typeEff;
      if (typeof typeEff === "function" && s.opponent?.types?.length) {
        try { eff = typeEff(m.type, s.opponent.types); } catch { eff = null; }
      }
    }
    effEl.textContent = effectLabel(eff, m.power, m.cat);
    effEl.className = `move-eff ${effectClass(eff, m.power, m.cat)}`;
    // Só o essencial no <small>: % de recarga, ou "Indisponível".
    button.querySelector("small").textContent = m.locked
      ? "Indisponível"
      : m.charge < 1
        ? `${Math.round(m.charge * 100)}%`
        : "";
  });
  const benchKey = s.bench.map((m) => m.key).join("|");
  if ($("battle-bench").dataset.key !== benchKey) {
    $("battle-bench").dataset.key = benchKey;
    $("battle-bench").innerHTML = s.bench
      .map(
        (m) =>
          `<button class="bench-button" data-switch="${m.index}" aria-label="Trocar para ${esc(m.name)}">${portrait(mon(m.key))}<div class="hp-track"><i></i></div></button>`,
      )
      .join("");
  }
  all("#battle-bench button").forEach((button, i) => {
    const m = s.bench[i];
    button.disabled = m.fainted || m.active;
    button.classList.toggle("active", m.active);
    const bar = button.querySelector("i");
    bar.style.width = `${m.hpRatio * 100}%`;
    bar.className =
      m.hpRatio > 0.5 ? "hp-high" : m.hpRatio > 0.25 ? "hp-mid" : "hp-low";
  });
  if (s.state === "paused" && !$("pause-dialog").open && !s.result)
    showDialog("pause-dialog");
}
function endBattle(result) {
  if(activeArena){endArenaBattle(result);return;}
  if(wildBattle&&result.won){wildBattle=false;p.recordMissionBattle(result);p.resolveEncounter('defeated');const active=save().journey.active;runTrainerStage(ALL_STAGES.find(s=>s.id===active.stage),active.id);return;}
  if(wildBattle&&!result.won&&save().journey?.active?.encounter?.state==='pending'){p.resolveEncounter('fled');}
  wildBattle=false;
  // Batalha ranqueada ou desafio de amigo: consome o contexto aqui — a
  // tela de resultado mostra o delta de pontos e o "Jogar novamente"
  // repete o MESMO modo, não um treino comum.
  const rankedBattle=pendingRanked;pendingRanked=null;
  const friendBattle=pendingFriendBattle;pendingFriendBattle=null;
  $("pause-dialog").close();
  const reward = activeStage ? (result.reason==="surrender" ? p.abandonStage() : p.completeStage(result)) : p.recordBattle(result);
  refresh();
  const rankedLine=rankedBattle?`<p id="ranked-result-line" class="ranked-result-line">Registrando resultado ranqueado…</p>`:"";
  const friendLine=friendBattle?`<p class="support-copy">Treino contra o bot com o nome de ${esc(friendBattle.friend.nick)} — o time real dele ainda não é sincronizado.</p>`:"";
  const surrenderRanked=rankedBattle&&result.reason==="surrender"?`<p class="support-copy">Desistência conta como derrota no ranqueado.</p>`:"";
  $("result-content").innerHTML =
    `<div class="result-symbol">${icon(result.won ? "star" : "shield")}</div><h2>${result.won ? "Vitória na arena!" : result.reason === "surrender" ? "Batalha encerrada" : "O próximo duelo é seu"}</h2><p>${result.reason === "surrender" ? "Desistências não concedem moedas." : "Sua equipe volta pronta para uma nova estratégia."}</p><div class="result-coins">${icon("coin")} +${reward.coins || 0}</div>${reward.trainerXp?`<p>+${reward.trainerXp.xp} XP de treinador${reward.trainerXp.to>reward.trainerXp.from?` · Você subiu para o nível ${reward.trainerXp.to}!`:""}</p>`:""}${result.hitXp?`<p>+${result.hitXp.toLocaleString("pt-BR")} XP ganhos por golpes durante a batalha</p>`:""}${result.koXp?`<p>+${result.koXp} XP ganhos por nocautes durante a batalha</p>`:""}${damageGraphHTML(result.damage)}${reward.tickets?`<p>+${reward.tickets} ticket${reward.tickets>1?"s":""} de técnica</p>`:""}${reward.gachaTickets?`<p>+${reward.gachaTickets} ticket de invocação</p>`:""}${rankedLine}${friendLine}${surrenderRanked}<button id="result-lobby" class="primary-button">Voltar ao lobby</button><button id="result-retry" class="secondary-button">Jogar novamente</button>`;
  showDialog("result-dialog");
  $("result-dialog").scrollTop=0;
  $("result-lobby").onclick = exitBattle;
  const retryStage=activeStage;
  $("result-retry").onclick = ()=>retryStage?launchStage(retryStage):rankedBattle?startRankedBattle():friendBattle?challengeFriend(friendBattle.friend):startBattle();
  if(rankedBattle)submitRankedResult(rankedBattle,result);
}
function exitBattle() {
  if(arenaSocket){const socket=arenaSocket;arenaSocket=null;socket.onclose=null;socket.close();}
  activeArena=null;
  if(activeStage&&save().journey?.active)p.abandonStage();
  activeStage=null;
  wildBattle=false;
  pendingRanked=null;
  pendingFriendBattle=null;
  battleOpponentLabel=null;
  const trainerEl=$("opponent-trainer");
  if(trainerEl){trainerEl.hidden=true;trainerEl.textContent="";}
  narrator = null;
  clearBattleLog();
  closeDialogs();
  battle?.destroy();
  battle = null;
  snapshot = null;
  $("battle-screen").hidden = true;
  $("app").hidden = false;
  window.PulseNative?.setBattleMode(false);
  setMenuAmbient(true);
  navigate("home");
}
function back() {
  if ($("pull-dialog").open) {
    $("skip-reveal")?.click();
    if (!$("skip-reveal")) $("pull-dialog").close();
    return;
  }
  const dialog = all("dialog[open]").at(-1);
  if (dialog) {
    if (dialog.id === "pause-dialog") {
      dialog.close();
      battle?.resume();
    } else dialog.close();
    return;
  }
  if (battle) {
    battle.pause();
    return;
  }
  teamPick = null;
  if (route === "home" && window.PulseNative?.isNative) window.PulseNative.exitApp();
  else goBack();
}
function changeFormat(n) {
  if(save().unlocked.length<n){notify(`Você precisa de ${n} Pokémon para esse formato.`);return;}
  const s = save(),
    mons = s.team.mons.slice(0, n);
  for (const k of s.unlocked)
    if (mons.length < n && !mons.includes(k)) mons.push(k);
  if (apply(p.setTeam({ ...s.team, mons, gimmick: null }))) refresh();
}
function renderCampaign(){management?.renderCampaign();}
async function runTrainerStage(stage,battleId){
 wildBattle=false;activeStage=stage.id;
 await startBattle({battleId,team:p.getTeam(),botTeam:{mons:[...stage.opponents],moves:{},gimmick:null},format:`${save().team.mons.length}v${stage.opponents.length}`,difficulty:stage.difficulty,opponentLevel:stageOpponentLevel(stage)});
}
async function captureEncounter(){
 const active=save().journey?.active;if(!active)return;
 if(battle&&wildBattle){battle.pause();$('pause-dialog').close();}
 const result=p.captureWild({id:active.id,hpRatio:wildBattle?snapshot?.opponent.hpRatio:1,status:wildBattle?!!snapshot?.opponent.status:false});
 if(!result.ok){notify(result.error);if(wildBattle)battle.resume();return;}
 refresh();notify(result.captured?`${mon(result.key).name} entrou na sua coleção!`:'O Pokémon escapou da Poké Ball.');
 if(result.captured){wildBattle=false;await runTrainerStage(ALL_STAGES.find(s=>s.id===active.stage),active.id);}else if(wildBattle)battle.resume();else showWildEncounter(ALL_STAGES.find(s=>s.id===active.stage),active.id);
}
function showWildEncounter(stage,battleId){
 const m=mon(stage.wild);$('detail-content').innerHTML=`<div class="dialog-heading"><h2>Um ${esc(m.name)} selvagem apareceu!</h2></div><div class="detail-hero">${portrait(m)}<div><span class="type-list">${tags(m)}</span><p>${save().journey.inventory.pokeball} Poké Balls na mochila</p></div></div><p>Enfraqueça o Pokémon em batalha para aumentar sua chance de captura. Derrotá-lo encerra a oportunidade.</p><div class="detail-actions"><button id="wild-fight" class="primary-button">Ficar e lutar</button><button id="wild-capture" class="secondary-button">Tentar capturar</button><button id="wild-flee" class="text-button">Fugir e seguir a rota</button></div>`;
 if(!$('detail-dialog').open)showDialog('detail-dialog');
 $('wild-fight').onclick=()=>{wildBattle=true;activeStage=stage.id;startBattle({battleId,team:p.getTeam(),botTeam:{mons:[stage.wild],moves:{},gimmick:null},format:`${save().team.mons.length}v1`,difficulty:1,opponentLevel:7+ALL_STAGES.indexOf(stage)});};
 $('wild-capture').onclick=captureEncounter;$('wild-flee').onclick=()=>{p.resolveEncounter('fled');runTrainerStage(stage,battleId);};
}
async function launchStage(id){
 const stage=ALL_STAGES.find(s=>s.id===id);if(!stage)return;
 const current=save().journey?.active;
 if(current&&current.stage!==id){notify(`Você tem uma tentativa em ${current.stage}. Retome essa fase primeiro.`);return;}
 const battleId=current?.id||crypto.randomUUID();if(!current&&!apply(p.beginStage(id,battleId)))return;
 activeStage=id;
 if(save().journey.active.encounter?.state==='pending')showWildEncounter(stage,battleId);else await runTrainerStage(stage,battleId);
}
async function drawBanner(){
 stopBannerSprite?.();const token=selectedBanner;
 $('summon-display').dataset.banner=selectedBanner;
 all('[data-select-banner]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.selectBanner===selectedBanner)));
 $('summon-banner-title').textContent=SUMMON_BANNERS.find(b=>b.id===selectedBanner).name;
 const key={national:'bulbasaur',route:'bulbasaur',battle:'lucario',night:'marshadow'}[selectedBanner]||'bulbasaur';
 const stop=await animatePartner($('summon-partner'),mon(key),{reduced:reducedMotion()});
 if(token!==selectedBanner||route!=='summon')stop();else stopBannerSprite=stop;
}
// ---- Login online (fase 2a) ----
function buildTrainerPicker(box, selected, onSelect) {
  if (!box) return;
  box.replaceChildren(
    ...TRAINERS.map((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "trainer-option";
      b.setAttribute("aria-pressed", String(t.key === selected));
      b.dataset.trainerKey = t.key;
      b.innerHTML = `<img src="/faces/${t.key}.png" alt=""><span>${esc(t.name)}</span>`;
      b.onclick = () => {
        box.querySelectorAll(".trainer-option").forEach((el) => el.setAttribute("aria-pressed", String(el === b)));
        onSelect(t.key);
      };
      return b;
    }),
  );
}
function renderTeamPicker(box, selected, {allowNone=false, onSelect}={}) {
  if (!box) return;
  const options = [...GO_TEAMS.map((t) => ({id:t.id, name:t.name, desc:t.short, color:t.color})), ...(allowNone ? [{id:null, name:"Sem time", desc:"Sem time por enquanto", color:"#8fa8b3", none:true}] : [])];
  box.replaceChildren(
    ...options.map((opt) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "team-option" + (opt.none ? " team-none" : "");
      b.style.setProperty("--team", opt.color);
      b.setAttribute("aria-pressed", String(opt.id === selected));
      b.dataset.team = opt.id ?? "";
      b.innerHTML = `<b>${esc(opt.name)}</b><small>${esc(opt.desc)}</small>`;
      b.onclick = () => {
        box.querySelectorAll(".team-option").forEach((el) => el.setAttribute("aria-pressed", String(el === b)));
        onSelect(opt.id);
      };
      return b;
    }),
  );
}
// Sincronização do perfil em segundo plano. Nunca trava o jogo: sem sessão
// ou sem servidor, só marca pendente e tenta na próxima abertura.
async function syncOnlineProfile({force=false}={}) {
  const s = save();
  const state = s.online;
  if (!state) return;
  if (!online.hasSession()) {
    if (state.provider !== "local") return;
    const result = await online.guestSignIn({trainer_key: s.trainerKey, nick: s.trainerName, team: state.team});
    if (result.ok) p.setOnlineAccount({provider:"guest", userId:result.session.userId, syncedAt:Date.now(), pendingSync:false});
    return;
  }
  if (!force && !state.pendingSync) return;
  const result = await online.updateProfile({trainer_key: s.trainerKey, nick: s.trainerName, team: state.team});
  if (result.ok) p.setOnlineAccount({syncedAt: Date.now(), pendingSync:false});
  else if (result.status === 401) p.setOnlineAccount({provider:"local", userId:null, pendingSync:true});
  else if (result.offline) p.setOnlineAccount({pendingSync:true});
}
// ---- Amigos + Ranking (fase 2b) ----
// Telas de Amigos e Ranking leem do servidor quando há sessão; sem servidor
// mostram o último dado salvo e nunca travam o jogo. Batalha ranqueada e
// desafio de amigo reaproveitam o motor local: o adversário é um bot —
// no desafio, só o NOME é o do amigo (o time real dele não é sincronizado).
function lastSeenText(value){
  if(value===undefined||value===null)return "";
  const ms=typeof value==="number"?value:Date.parse(value);
  if(!Number.isFinite(ms))return "";
  return new Date(ms).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
}
function currentStanding(){return rankingCache||save().online?.ranking||null;}
function friendRow(f,mode){
  const team=GO_TEAMS.find(t=>t.id===f.team);
  const teamLabel=team?team.name:"Sem time";
  const teamColor=team?team.color:"#8fa8b3";
  const seen=f.online?"Online agora":(f.last_seen_at?`Offline · ${lastSeenText(f.last_seen_at)}`:"Offline");
  const actions=mode==="incoming"
    ?`<button type="button" class="secondary-button friend-action" data-friend-accept="${esc(f.user_id)}">Aceitar</button><button type="button" class="text-button friend-action" data-friend-decline="${esc(f.user_id)}">Recusar</button>`
    :mode==="outgoing"
    ?`<span class="friend-pending">Aguardando…</span>`
    :`<button type="button" class="secondary-button friend-action" data-friend-challenge="${esc(f.user_id)}">Desafiar</button><button type="button" class="text-button friend-action" data-friend-remove="${esc(f.user_id)}">Remover</button>`;
  return `<div class="friend-row"><img src="${esc(trainerFace(f.trainer_key))}" alt=""><span class="online-dot${f.online?" on":""}" aria-hidden="true"></span><div class="friend-main"><b>${esc(f.nick||"Treinador")}</b><small><span class="team-chip" style="--team:${teamColor}">${esc(teamLabel)}</span> · ${esc(trainerLabel(f.trainer_key))}</small></div><span class="friend-status">${esc(seen)}</span><div class="friend-actions">${actions}</div></div>`;
}
function renderFriends(){
  const listEl=$("friends-list"),inEl=$("friends-incoming"),outEl=$("friends-outgoing"),statusEl=$("friends-status");
  if(!listEl||!inEl||!outEl)return;
  if(statusEl){
    statusEl.textContent=!online.hasSession()?"Entre com uma conta (Google ou convidado) para ver seus amigos."
      :friendsLoading?"Carregando amigos…"
      :friendsError==="not_implemented"?"Amizades ainda não estão ativas no servidor. O jogo continua offline."
      :friendsError==="offline"?"Sem conexão com o servidor — tente atualizar depois."
      :friendsError==="error"?"Não foi possível carregar os amigos."
      :"";
  }
  const empty=(msg)=>`<p class="support-copy">${msg}</p>`;
  if(!friendsCache){
    const msg=!online.hasSession()?"Faça login para ver seus amigos.":friendsLoading?"Carregando amigos…":"Nenhum dado carregado ainda.";
    inEl.innerHTML=outEl.innerHTML=listEl.innerHTML=empty(msg);
    return;
  }
  const incoming=friendsCache.incoming||[],outgoing=friendsCache.outgoing||[],friends=friendsCache.friends||[];
  inEl.innerHTML=incoming.length?incoming.map(f=>friendRow(f,"incoming")).join(""):empty("Nenhum convite recebido.");
  outEl.innerHTML=outgoing.length?outgoing.map(f=>friendRow(f,"outgoing")).join(""):empty("Nenhum convite enviado.");
  listEl.innerHTML=friends.length?friends.map(f=>friendRow(f,"friend")).join(""):empty("Você ainda não tem amigos. Adicione alguém pelo apelido.");
}
async function loadFriends({force=false}={}){
  if(!online.hasSession()){friendsCache=null;friendsError="login";if(route==="friends")renderFriends();return;}
  if(friendsLoading)return;
  if(!force&&friendsCache)return;
  friendsLoading=true;friendsError=null;
  if(route==="friends")renderFriends();
  online.sendHeartbeat().catch(()=>{});
  const result=await online.getFriends();
  friendsLoading=false;
  if(result.ok){friendsCache=result.data;friendsError=null;}
  else if(result.status===501||result.error==="not_implemented"){friendsError="not_implemented";}
  else if(result.offline){friendsError="offline";}
  else if(result.status===401||result.error==="no_session"){friendsCache=null;friendsError="login";}
  else{friendsError="error";}
  if(route==="friends")renderFriends();
}
async function sendFriendRequestFromForm(){
  const input=$("friends-add-nick");
  const nick=input?.value.trim()||"";
  if(!nick){notify("Digite o apelido do treinador.");return;}
  const res=await online.sendFriendRequest(nick);
  if(res.ok){notify(`Convite enviado para ${nick}.`);if(input)input.value="";loadFriends({force:true});}
  else notify(friendRequestErrorMessage(res));
}
async function respondFriend(userId,accept){
  const res=await online.respondFriendRequest(userId,accept);
  if(res.ok){notify(accept?"Convite aceito.":"Convite recusado.");loadFriends({force:true});}
  else notify(onlineErrorMessage(res));
}
async function removeFriend(userId){
  const res=await online.removeFriend(userId);
  if(res.ok){notify("Amigo removido.");loadFriends({force:true});}
  else notify(onlineErrorMessage(res));
}
function renderRankings(){
  const meEl=$("ranking-me"),ladderEl=$("ranking-ladder"),historyEl=$("ranking-history"),statusEl=$("rankings-status"),pendingEl=$("ranked-pending-note");
  if(!meEl||!ladderEl||!historyEl)return;
  const pending=save().online?.pendingMatches?.length||0;
  if(pendingEl){pendingEl.hidden=pending===0;if(pending)pendingEl.textContent=`${pending} resultado${pending>1?"s":""} ranqueado${pending>1?"s":""} aguardando o servidor — sincroniza${pending>1?"m":""} sozinho quando a conexão voltar.`;}
  if(statusEl){
    statusEl.textContent=!online.hasSession()?"Entre com uma conta (Google ou convidado) para ver seu ranking."
      :rankingLoading?"Carregando ranking…"
      :rankingError==="not_implemented"?"Ranking ainda não está ativo no servidor. As batalhas ranqueadas valem localmente e sincronizam depois."
      :rankingError==="offline"?(rankingStale?"Sem conexão — mostrando seu último ranking salvo.":"Sem conexão com o servidor — tente atualizar depois.")
      :rankingError==="error"?"Não foi possível carregar o ranking."
      :rankingStale?"Mostrando seu último ranking salvo.":"";
  }
  const standing=currentStanding();
  if(!standing){
    meEl.innerHTML=`<p class="support-copy">${rankingLoading?"Carregando seu ranking…":"Seu ranking aparece aqui depois da primeira batalha ranqueada."}</p>`;
  }else{
    const prog=rankedProgress(standing);
    const wins=standing.wins??0,losses=standing.losses??0,games=standing.games??(wins+losses);
    const streak=standing.streak??0;
    meEl.innerHTML=`<div class="ranking-tier"><span class="ranking-tier-name">${esc(prog.tierName)}</span><span class="ranking-points">${prog.points} pts</span></div>
    <div class="rank-bar" role="progressbar" aria-valuenow="${prog.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso para o próximo tier"><i style="width:${prog.pct}%"></i></div>
    <p class="ranking-next">${prog.isTop?"Topo do ranqueado — Campeão é o top 10% dos 600+.":`Faltam ${prog.hi-prog.points} pts para ${esc(prog.nextName)} (${prog.lo}–${prog.hi} pts).`}</p>
    <p class="ranking-record">${wins}V · ${losses}D · ${games} batalhas${streak>1?` · sequência de ${streak} vitórias`:""}${standing.ladder_rank?` · #${standing.ladder_rank} no ladder`:""}${standing.season?` · ${esc(standing.season)}`:""}</p>`;
  }
  const rows=ladderCache?.rows||[];
  if(!rows.length){
    ladderEl.innerHTML=`<p class="support-copy">${rankingLoading?"Carregando classificação…":"Classificação indisponível no momento."}</p>`;
  }else{
    const myId=save().online?.userId;
    ladderEl.innerHTML=rows.map(r=>`<div class="ladder-row${r.user_id===myId?" is-me":""}"><span class="ladder-rank">#${r.rank??"–"}</span><img src="${esc(trainerFace(r.trainer_key))}" alt=""><span class="ladder-nick">${esc(r.nick||"Treinador")}</span><span class="ladder-tier">${esc(localizeTier(r.tier_name||r.tier||""))}</span><b class="ladder-points">${r.points??0} pts</b></div>`).join("");
  }
  const matches=rankingHistory?.matches||[];
  if(!matches.length){
    historyEl.innerHTML=`<p class="support-copy">${rankingLoading?"Carregando histórico…":"Nenhuma batalha ranqueada registrada ainda."}</p>`;
  }else{
    historyEl.innerHTML=matches.map(m=>{
      const won=m.result==="win";
      const delta=Number.isFinite(m.delta)?`${m.delta>0?"+":""}${m.delta} pts`:"";
      const when=m.created_at?lastSeenText(m.created_at):"";
      return `<div class="history-row"><span class="history-result ${won?"win":"loss"}">${won?"Vitória":"Derrota"}</span><span class="history-opp">vs ${esc(m.opponent_nick||(m.vs_bot?"Bot":"—"))}</span><b class="history-delta">${esc(delta)}</b><span class="history-when">${esc(when)}</span></div>`;
    }).join("");
  }
}
async function loadRankings({force=false}={}){
  if(!online.hasSession()){rankingCache=null;ladderCache=null;rankingHistory=null;rankingError="login";rankingStale=!!save().online?.ranking;if(route==="rankings")renderRankings();return;}
  if(rankingLoading)return;
  if(!force&&rankingCache&&ladderCache)return;
  rankingLoading=true;rankingError=null;
  if(route==="rankings")renderRankings();
  const [me,ladder,history]=await Promise.all([online.getRanking(),online.getLadder(50),online.getRankingHistory(20)]);
  rankingLoading=false;
  if(me.ok){rankingCache=me.data;rankingError=null;rankingStale=false;p.setCachedRanking(me.data);}
  else if(me.status===501||me.error==="not_implemented"){rankingError="not_implemented";rankingStale=!!save().online?.ranking;}
  else if(me.offline){rankingError="offline";rankingStale=!!save().online?.ranking;}
  else if(me.status===401||me.error==="no_session"){rankingError="login";rankingStale=!!save().online?.ranking;}
  else{rankingError="error";rankingStale=!!save().online?.ranking;}
  if(ladder.ok)ladderCache=ladder.data;
  if(history.ok)rankingHistory=history.data;
  if(route==="rankings")renderRankings();
}
async function startRankedBattle(){
  if(battle)return;
  if(save().team.mons.length<1){notify("Monte sua equipe antes de batalhar.");return;}
  pendingRanked={battleId:globalThis.crypto?.randomUUID?.()||`ranked-${Date.now()}`,opponentId:null,vsBot:true};
  await startBattle({battleId:pendingRanked.battleId,opponentName:"Bot Ranqueado"});
}
function challengeFriend(friend){
  if(!friend||battle)return;
  if(save().team.mons.length<1){notify("Monte sua equipe antes de batalhar.");return;}
  pendingFriendBattle={battleId:globalThis.crypto?.randomUUID?.()||`friend-${Date.now()}`,friend:{user_id:friend.user_id,nick:friend.nick}};
  startBattle({battleId:pendingFriendBattle.battleId,opponentName:friend.nick});
}
function challengeFriendById(userId){
  const friend=(friendsCache?.friends||[]).find(f=>f.user_id===userId);
  if(!friend){notify("Esse amigo não está na lista.");return;}
  challengeFriend(friend);
}
// Registra o resultado ranqueado no servidor; offline (ou 501, ou sessão
// expirada) ele fica na fila do save e o flush tenta de novo depois.
async function submitRankedResult(rankedBattle,result){
  const line=()=>$("ranked-result-line");
  const outcome=result.won?"win":"loss";
  const pending={battleId:rankedBattle.battleId,result:outcome,opponent_id:rankedBattle.opponentId||null,vs_bot:true,createdAt:Date.now()};
  if(!online.hasSession()){
    p.queuePendingMatch(pending);
    if(line())line().textContent="Sem sessão online — resultado salvo no aparelho e sincroniza depois.";
    return;
  }
  const res=await online.submitRankedMatch({result:outcome,opponent_id:rankedBattle.opponentId,vs_bot:true});
  if(res.ok){
    const standing=res.data?.standing||res.data;
    if(standing?.tier){p.setCachedRanking(standing);rankingCache=standing;}
    // O standing, o ladder e o histórico mudaram: invalida o cache para a
    // tela de Ranking buscar os dados novos (sem isso ela reexibia o vazio).
    rankingHistory=null;ladderCache=null;
    if(route==="rankings")loadRankings({force:true});
    const match=res.data?.match;
    const delta=Number.isFinite(match?.delta)?match.delta:null;
    const after=Number.isFinite(match?.points_after)?match.points_after:(Number.isFinite(standing?.points)?standing.points:null);
    const tierAfter=match?.tier_after||standing?.tier_name||standing?.tier;
    if(line()){
      const parts=[];
      if(delta!==null)parts.push(`${delta>0?"+":""}${delta} pontos`);
      if(after!==null)parts.push(`${after} pontos`);
      if(tierAfter)parts.push(String(tierAfter));
      line().textContent=parts.length?`Ranqueado: ${parts.join(" · ")}.`:"Resultado ranqueado registrado.";
    }
    return;
  }
  p.queuePendingMatch(pending);
  if(line())line().textContent=res.status===401?"Sessão expirada — resultado salvo no aparelho; entre novamente para sincronizar.":res.status===501||res.error==="not_implemented"?"Ranking ainda não ativo no servidor — resultado salvo no aparelho.":"Sem conexão — resultado salvo no aparelho e sincroniza depois.";
}
async function flushPendingMatches(){
  if(flushingMatches||!online.hasSession())return;
  const pending=save().online?.pendingMatches||[];
  if(!pending.length)return;
  flushingMatches=true;
  try{
    const done=[];
    for(const m of pending){
      const res=await online.submitRankedMatch({result:m.result,opponent_id:m.opponent_id,vs_bot:m.vs_bot});
      if(res.ok){done.push(m.battleId);const standing=res.data?.standing;if(standing?.tier)p.setCachedRanking(standing);}
      else break; // offline/401/501: tenta na próxima abertura
    }
    if(done.length){p.clearPendingMatches(done);rankingCache=null;ladderCache=null;rankingHistory=null;}
  }finally{flushingMatches=false;}
}
// Heartbeat de presença: a cada 60s, só com o jogo aberto e logado.
// Silencioso — falhar não mostra nada nem trava nada.
function startOnlineHeartbeat(){
  if(heartbeatTimer)return;
  heartbeatTimer=setInterval(()=>{
    if(document.hidden||!online.hasSession())return;
    online.sendHeartbeat().catch(()=>{});
  },60000);
}
function beatOnlineOnce(){
  if(online.hasSession())online.sendHeartbeat().catch(()=>{});
}

// Entrada Google feita no diálogo de perfil (jogador antigo): vincula a conta
// no servidor em segundo plano, só quando ainda não há sessão online.
async function handleFirebaseAuth(user) {
  if (!user || loginScreenActive || online.hasSession()) return;
  try {
    const idToken = await account.getIdToken();
    if (!idToken) return;
    const result = await online.googleSignIn(idToken);
    if (result.ok) {
      p.setOnlineAccount({provider:"google", userId:result.session.userId, syncedAt:Date.now(), pendingSync:false});
      await syncOnlineProfile({force:true});
      refresh();
    }
  } catch { /* offline ou erro: segue local, tenta na próxima abertura */ }
}
// Tela de login antes do lobby. Resolve com um aviso para exibir (ou null).
// Offline-first: sem servidor, entra como convidado local e sincroniza depois.
function runLoginScreen() {
  return new Promise((resolve) => {
    const screen = $("login-screen");
    const statusEl = $("login-status");
    const setStatus = (msg) => { statusEl.textContent = msg || ""; };
    let method = null, busy = false, googleUser = null;
    let loginTrainerKey = resolveTrainerKey(save().trainerKey);
    let loginTeam = save().online?.team || null;
    $("boot").hidden = true;
    screen.hidden = false;
    const showStep = (profile) => {
      $("login-step-method").hidden = !!profile;
      $("login-step-profile").hidden = !profile;
      setStatus("");
    };
    const finish = (note) => {
      screen.hidden = true;
      setStatus("");
      resolve(note || null);
    };
    const openProfileStep = () => {
      const nameInput = $("login-nick");
      if (!nameInput.value) {
        const current = save().trainerName;
        nameInput.value = current && current !== "Treinador" ? current : (googleUser?.name || "");
      }
      buildTrainerPicker($("login-trainer-picker"), loginTrainerKey, (key) => { loginTrainerKey = key; });
      renderTeamPicker($("login-team-picker"), loginTeam, {onSelect: (team) => { loginTeam = team; }});
      showStep(true);
    };
    $("login-google").onclick = async () => {
      if (busy) return;
      busy = true;
      setStatus("Abrindo a entrada do Google…");
      try {
        await account.signIn();
        const idToken = await account.getIdToken();
        if (!idToken) { setStatus("Não foi possível conectar ao Google. Verifique a conexão ou continue como convidado."); return; }
        googleUser = account.getUser();
        method = "google";
        setStatus("Conectando ao servidor…");
        const result = await online.googleSignIn(idToken);
        if (result.ok) {
          p.setOnlineAccount({provider:"google", userId:result.session.userId, syncedAt:Date.now(), pendingSync:false});
        } else if (result.offline) {
          p.setOnlineAccount({provider:"google", pendingSync:true});
        } else {
          setStatus(onlineErrorMessage(result));
          return;
        }
        openProfileStep();
      } catch (error) {
        setStatus(error?.code ? accountError(error) : (error?.message || "Não foi possível conectar sua conta Google."));
      } finally {
        busy = false;
      }
    };
    $("login-guest").onclick = () => {
      method = "guest";
      openProfileStep();
    };
    $("login-offline").onclick = () => {
      p.setOnlineAccount({provider:"local", pendingSync:true});
      finish("Jogando offline. O perfil sincroniza quando a conexão voltar.");
    };
    $("login-back").onclick = () => {
      method = null;
      showStep(false);
    };
    $("login-confirm").onclick = async () => {
      if (busy) return;
      if (!loginTeam) { setStatus("Escolha um time para continuar."); return; }
      const nameResult = p.setTrainerName($("login-nick").value.trim());
      if (!nameResult.ok) { setStatus(nameResult.error); return; }
      const keyResult = p.setTrainerKey(loginTrainerKey);
      if (!keyResult.ok) { setStatus(keyResult.error); return; }
      p.setGoTeam(loginTeam);
      busy = true;
      setStatus(method === "google" ? "Sincronizando perfil…" : "Criando sua conta…");
      const profile = {trainer_key: loginTrainerKey, nick: save().trainerName, team: loginTeam};
      if (method === "google") {
        const result = await online.updateProfile(profile);
        if (result.ok) {
          p.setOnlineAccount({syncedAt: Date.now(), pendingSync:false});
        } else if (result.offline) {
          p.setOnlineAccount({pendingSync:true});
          busy = false;
          finish("Sem conexão com o servidor — jogando offline. O perfil sincroniza depois.");
          return;
        } else {
          setStatus(onlineErrorMessage(result));
          busy = false;
          return;
        }
      } else {
        const result = await online.guestSignIn(profile);
        if (result.ok) {
          p.setOnlineAccount({provider:"guest", userId:result.session.userId, syncedAt:Date.now(), pendingSync:false});
        } else if (result.offline) {
          p.setOnlineAccount({provider:"local", pendingSync:true});
          busy = false;
          finish("Sem conexão com o servidor — jogando offline. O perfil sincroniza depois.");
          return;
        } else {
          setStatus(onlineErrorMessage(result));
          busy = false;
          return;
        }
      }
      busy = false;
      finish();
    };
    showStep(false);
  });
}
function wire() {
  arenaUI=mountArena({online,catalog:()=>catalog,esc,portrait,types,onMatch:startArenaMatch,notify});
  $('rail-arena').onclick=()=>arenaUI.open();
  $('home-menu').onclick=()=>showDialog('lobby-menu-dialog');
  $('lobby-menu-close').onclick=()=>$('lobby-menu-dialog').close();
  $('lobby-menu-dialog').addEventListener('click',event=>{if(event.target.closest('[data-route]'))$('lobby-menu-dialog').close();});
  $('lobby-settings').onclick=()=>{$('lobby-menu-dialog').close();$('home-profile').click();};
  const fullscreen=$('lobby-fullscreen');
  fullscreen.hidden=!!window.PulseNative?.isNative||!document.fullscreenEnabled;
  fullscreen.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();$('lobby-menu-dialog').close();}catch{notify('Use o APK para abrir o jogo em tela cheia neste aparelho.');}};
  document.addEventListener('fullscreenchange',()=>{fullscreen.textContent=document.fullscreenElement?'Sair da tela cheia':'Tela cheia';});
  management=createManagementUI({p,save,mon,portrait,tags,types,esc,navigate,notify,apply,movePicker,launchStage,drawTechnique,goBack});
  for(const title of all('#screens>.screen:not(#screen-home) .screen-title')){const back=document.createElement('button');back.className='section-back';back.type='button';back.dataset.menuBack='true';back.setAttribute('aria-label','Voltar');back.innerHTML=icon('back');title.prepend(back);}

  $("technique-mon").onchange=()=>management.renderTechniques();
  $("technique-spin").onclick=drawTechnique;
  installAudioControls();
  $("banner-select").innerHTML=SUMMON_BANNERS.map(b=>`<option value="${b.id}">${b.name}</option>`).join('');
  $("banner-select").onchange=e=>{selectedBanner=e.target.value;refresh();drawBanner();};
  $("battle-capture").onclick=captureEncounter;
  $("buy-pokeballs").onclick=()=>{if(apply(p.buyPokeballs(5)))notify("Cinco Poké Balls adicionadas à mochila.");};
  $("home-journey").onclick=()=>navigate("campaign");
  $("chapter-list").onclick=e=>{const b=e.target.closest('[data-stage]');if(b&&!b.disabled)launchStage(b.dataset.stage);};

  for (const [id, name] of Object.entries({
    "coin-icon": "coin",
    "diamond-icon": "diamond",
    "search-icon": "search",
    "daily-icon": "gift",
    "summon-core": "bolt",
    "summon-back": "back",
    "battle-pause": "pause",
  }))
    $(id).innerHTML = icon(name);
  all("[data-icon]").forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
  $("battle-guard").querySelector("span").innerHTML = icon("shield");
  $("battle-dodge").querySelector("span").innerHTML = icon("dash");
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if(b.dataset.selectBanner){$("banner-select").value=b.dataset.selectBanner;$("banner-select").dispatchEvent(new Event('change'));}

    if(b.dataset.buyItem&&apply(p.buyItem(b.dataset.buyItem)))notify("Item comprado.");
    if(b.dataset.buyStone&&apply(p.buyStone(b.dataset.buyStone)))notify("Pedra comprada.");
    if(b.dataset.buyMint&&apply(p.buyMint(b.dataset.buyMint)))notify("Mint comprada. Use na mochila.");
    if(b.dataset.useStone){const [stone,key]=b.dataset.useStone.split(':');const r=p.useStone(key,stone);if(apply(r)){notify(`${mon(r.target).name}!`);management?.openPartner?.(r.target,'evolution');}}
    if(b.dataset.equipItem&&apply(p.equipItem($("bag-owner-"+b.dataset.equipItem).value,b.dataset.equipItem)))notify("Item equipado.");
    if(b.dataset.unequip&&apply(p.equipItem(b.dataset.unequip,null)))notify("Item devolvido à mochila.");
    if (b.dataset.route) {
      teamPick = null;
      navigate(b.dataset.route);
    }
    if (b.dataset.friendAccept) respondFriend(b.dataset.friendAccept, true);
    if (b.dataset.friendDecline) respondFriend(b.dataset.friendDecline, false);
    if (b.dataset.friendRemove) removeFriend(b.dataset.friendRemove);
    if (b.dataset.friendChallenge) challengeFriendById(b.dataset.friendChallenge);
    if (b.hasAttribute("data-close")) b.closest("dialog").close();
    if (b.dataset.detail) detail(b.dataset.detail);
    if (b.dataset.shopDetail)
      detail(b.dataset.shopDetail, b.dataset.cosmetic === "true");
    if (b.dataset.viewShiny) detail(b.dataset.viewShiny, true);
    if (b.dataset.favorite && apply(p.setFavorite(b.dataset.favorite))) {
      closeDialogs();
      navigate("home");
    }
    if (b.dataset.moves) movePicker(b.dataset.moves);
    if (b.dataset.buy && apply(p.buyPokemon(b.dataset.buy))) {
      detail(b.dataset.buy);
      notify("Pokémon desbloqueado!");
    }
    if (b.dataset.buyShiny && apply(p.buyShiny(b.dataset.buyShiny))) {
      detail(b.dataset.buyShiny, true);
      notify("Versão shiny adquirida e equipada!");
    }
    if (
      b.dataset.shinyToggle &&
      apply(
        p.equipShiny(b.dataset.shinyToggle, !isShiny(b.dataset.shinyToggle)),
      )
    )
      detail(b.dataset.shinyToggle, true);
    if (b.dataset.replace !== undefined) {
      teamPick = Number(b.dataset.replace);
      ownedFilter = "owned";
      navigate("collection");
    }
    if (b.dataset.leader) {
      const t = structuredClone(save().team),
        i = Number(b.dataset.leader);
      [t.mons[0], t.mons[i]] = [t.mons[i], t.mons[0]];
      if (t.gimmick)
        t.gimmick.mon =
          t.gimmick.mon === i ? 0 : t.gimmick.mon === 0 ? i : t.gimmick.mon;
      apply(p.setTeam(t));
    }
    if (b.dataset.size) changeFormat(Number(b.dataset.size));
    if (b.dataset.owned) {
      ownedFilter = b.dataset.owned;
      all("[data-owned]").forEach((x) =>
        x.setAttribute("aria-pressed", String(x === b)),
      );
      renderCollection();
    }
    if (b.dataset.shopFilter) {
      shopFilter = b.dataset.shopFilter;
      all("[data-shop-filter]").forEach((x) =>
        x.setAttribute("aria-pressed", String(x === b)),
      );
      renderShop();
    }
    if (b.hasAttribute("data-go-summon")) {
      closeDialogs();
      navigate("summon");
    }
  });
  document.addEventListener("change", (e) => {
    if (e.target.dataset.mega !== undefined)
      apply(p.setMega(e.target.checked ? Number(e.target.dataset.mega) : null));
  });
  document.addEventListener("submit", (e) => {
    if (e.target.id === "moves-form") {
      e.preventDefault();
      if (
        apply(
          p.setMoves(e.target.dataset.mon, [
            ...new FormData(e.target).getAll("move"),
          ]),
        )
      ) {
        closeDialogs();
        notify("Golpes salvos.");
      }
    }
  });
let pendingTrainerKey = "red";
function renderTrainerPicker() {
  pendingTrainerKey = resolveTrainerKey(save().trainerKey);
  buildTrainerPicker($("trainer-picker"), pendingTrainerKey, (key) => { pendingTrainerKey = key; });
}
  const openProfile = () => {
    account.prepare();
    $("profile-name").value = save().trainerName;
    renderTrainerPicker();
    pendingTeam = save().online?.team ?? null;
    renderTeamPicker($("profile-team-picker"), pendingTeam, {allowNone:true, onSelect:(team)=>{ pendingTeam = team; }});
    showDialog("profile-dialog");
  };
  $("profile-button").onclick = openProfile;
  $("home-profile").onclick = openProfile;
  $("profile-form").onsubmit = (e) => {
    e.preventDefault();
    if (!apply(p.setTrainerKey(pendingTrainerKey))) return;
    if (!apply(p.setTrainerName($("profile-name").value))) return;
    if (!apply(p.setGoTeam(pendingTeam))) return;
    syncOnlineProfile({force:true}).catch(()=>{});
    $("profile-dialog").close();
  };
  $("wallet-button").onclick = () => navigate("rewards");
  $("diamond-wallet").onclick = () => navigate("shop");
  // Pílulas da topbar da Home nova: mesmas rotas da carteira do header.
  $("home-coins").onclick = () => navigate("rewards");
  $("home-diamonds").onclick = () => navigate("shop");
  $("home-tickets").onclick = () => navigate("summon");
  $("home-missions").onclick = () => navigate("rewards");
  $("daily-claim").onclick = () => {
    if (apply(p.claimDaily())) notify("Bônus diário: +150 moedas.");
  };
  $("mission-list").addEventListener("click",event=>{
    const button=event.target.closest("[data-claim-mission]");if(!button||button.disabled)return;
    const result=p.claimMission(button.dataset.claimMission);
    if(apply(result))notify(result.reward==='tm'?`+${result.count} giro de TM adicionado à mochila.`:`+${result.count} ticket de Pokémon adicionado.`);
  });
  const starterClaimBtn = $("starter-tickets-claim");
  if (starterClaimBtn)
    starterClaimBtn.onclick = () => {
      if (apply(p.claimStarterTickets()))
        notify("Recompensa inicial: +10 tickets de invocação.");
    };
  for (const id of ["collection-summon", "rewards-summon"])
    $(id).onclick = () => navigate("summon");
  $("summon-back").onclick = () => navigate("home");
  $("team-add").onclick=()=>management.addSlot();
  $("collection-search").oninput = renderCollection;
  $("type-filter").onchange = renderCollection;
  $("format-select").onchange = (e) =>
    changeFormat(Number(e.target.value[0]));
  $("summon-one").onclick = () => startPulls(1);
  $("summon-ten").onclick = () => startPulls(10);
  $("rail-battle").onclick = startBattle;
  // Seletor visível de formato do treino (Home): Singles, Doubles, 3v3, 6v6.
  // O select oculto #format-select continua sendo a fonte de verdade que
  // startBattle() lê; o seletor só chama changeFormat(), que redimensiona
  // a equipe para o tamanho do formato escolhido.
  const lobbyPlay = document.querySelector("#screen-home .lobby-play"),
    recruitButton = document.querySelector("#screen-home .lobby-recruit");
  if (lobbyPlay) trainingFormatSelector = mountTrainingFormatSelector(lobbyPlay, recruitButton, {
    onSelect: (id) => changeFormat(TRAINING_FORMATS.find((f) => f.id === id).teamSize),
    onComingSoon: () => notify("Doubles (2 × 2) chega em breve: dois ativos por lado ainda precisam de HUD própria."),
  });
  // Amigos + Ranking (fase 2b): os botões vivem nas telas novas; o
  // heartbeat de presença começa aqui e roda enquanto o jogo estiver aberto.
  $("friends-add-btn").onclick = sendFriendRequestFromForm;
  $("friends-refresh").onclick = () => loadFriends({force:true});
  $("rankings-refresh").onclick = () => loadRankings({force:true});
  $("ranked-battle-btn").onclick = startRankedBattle;
  startOnlineHeartbeat();
  $("battle-pause").onclick = () => battle?.pause();
  $("battle-resume").onclick = () => {
    $("pause-dialog").close();
    battle?.resume();
  };
  $("pause-dialog").oncancel = (e) => {
    e.preventDefault();
    $("battle-resume").click();
  };
  $("battle-surrender").onclick = () => battle?.surrender();
  $("result-dialog").oncancel = (e) => {
    e.preventDefault();
    exitBattle();
  };
  $("rotate-dismiss").onclick = () => ($("rotate-hint").hidden = true);
  $("export-save").onclick = async () => {
    if (window.PulseNative?.isNative) {
      try {
        await window.PulseNative.exportSave(p.exportSave());
      } catch (error) {
        notify(
          "Não foi possível abrir a cópia do progresso. Tente exportar novamente.",
        );
      }
      return;
    }
    const blob = new Blob([p.exportSave()], { type: "application/json" }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "pulse-arena-progresso.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $("import-save").onclick = () => $("import-file").click();
  $("import-file").onchange = async (e) => {
    const file = e.target.files[0];
    if (file && apply(p.importSave(await file.text()))) {
      notify("Progresso importado.");
      drawHero();
    }
    e.target.value = "";
  };
  bindGamepad({getSnapshot:()=>snapshot,command:input=>battle?.command(input),pause:()=>{battle?.pause();showDialog("pause-dialog");}});
  bindBattleControls({
    surface: $("battle-screen"), stick: $("joystick"), knob: $("joystick-knob"),
    getSnapshot: () => snapshot,
    command: input => battle?.command(input),
  });
  window.addEventListener("resize", () => {
    if (route === "home") drawHero();
  });
  window.addEventListener("pulse-native-back", back);
  window.addEventListener("pulse-native-pause", () => battle?.pause());
  window.addEventListener("pulse-native-resume", () => {
    if (battle?.state === "paused" && !$("pause-dialog").open)
      showDialog("pause-dialog");
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && route === "home") drawHero();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !all("dialog[open]").length) {
      e.preventDefault();
      back();
    }
  });
}
async function boot() {
  try {
    const [response, shinyResponse] = await Promise.all([
      fetch("/roster.json"),
      fetch("/pulse/shiny-catalog.json"),
    ]);
    if (!response.ok) throw Error("Catálogo não disponível");
    const result = p.setCatalog(await response.json());
    if (!result.ok) throw Error(result.error);
    shiny = shinyResponse.ok ? await shinyResponse.json() : {};
    p.setShinyCatalog(Object.keys(shiny));
    catalog = p.getCatalog();
    $("type-filter").insertAdjacentHTML(
      "beforeend",
      Object.entries(types)
        .map(([key, name]) => `<option value="${key}">${name}</option>`)
        .join(""),
    );
    $("boot").hidden = true;
    // Conta Google (Firebase) montada antes do login: a tela usa o mesmo
    // sign-in do diálogo de perfil; quem já tem perfil salvo entra direto.
    account ??= mountAccount({onAuth: handleFirebaseAuth});
    let loginNote = null;
    if (needsLogin(save())) {
      loginScreenActive = true;
      loginNote = await runLoginScreen();
      loginScreenActive = false;
    }
    const {chooseInitialPartner}=await import("./onboarding.js");
    await chooseInitialPartner(p);
    wire();
    $("app").hidden = false;
    navigate("home");
    if (loginNote) notify(loginNote);
    syncOnlineProfile().catch(()=>{});
    flushPendingMatches().catch(()=>{});
    beatOnlineOnce();
  } catch (error) {
    $("boot").innerHTML =
      `<div class="wordmark">PULSE ARENA</div><p>Não foi possível carregar o jogo.</p><p>${esc(error.message)}</p><button class="primary-button" onclick="location.reload()">Tentar novamente</button>`;
  }
}
boot();

