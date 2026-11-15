import {bindGamepad} from './gamepad.js';
import {createManagementUI} from './management-ui.js';
import {ITEMS,STONES,EVOLUTIONS,levelOf,xpAt,moveRequirement,specialPool} from './growth.js';
import {mountAccount} from './account.js';
import {bindBattleControls} from './controls.js';
import {installAudioControls,setMenuAmbient,rewardSound,playPulseSound} from './ui-audio.js';
import {animatePartner} from './sprites.js';
import {SUMMON_BANNERS,isSummonable} from './banners.js';
import {ALL_STAGES} from './campaign.js';
import { createProgression, ECONOMY } from "./progression.js";
import { icon } from "./icons.js";
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
const effectLabel = (eff) =>
  eff === null || eff === undefined || eff === 1
    ? ""
    : eff === 0
      ? "SEM EFEITO"
      : eff >= 2
        ? "SUPER EFETIVO"
        : "POUCO EFETIVO";
const effectClass = (eff) =>
  eff === null || eff === undefined || eff === 1
    ? ""
    : eff === 0
      ? "eff-none"
      : eff >= 2
        ? "eff-super"
        : "eff-weak";
const p = createProgression({profileMode:"journey"});
let management,routeHistory=[];
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
  stopBannerSprite=null;
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
}
function refresh() {
  catalog = p.getCatalog();
  const s = save();
  const bannerMeter=selectedBanner==="route"?s.gacha:(s.gacha.banners?.[selectedBanner]||{pity:0});
  $("banner-description").textContent=SUMMON_BANNERS.find(b=>b.id===selectedBanner).description;
  $("trainer-name").textContent = s.trainerName;
  $("account-summary").textContent = s.trainer?`Treinador Nv. ${levelOf(s.trainer.xp||0)} · no aparelho`:`Seu progresso, no aparelho`;
  $("coin-balance").textContent = s.coins.toLocaleString("pt-BR");
  $("diamond-balance").textContent = s.diamonds.toLocaleString("pt-BR");
  currencyPulse("coin-balance", s.coins);
  currencyPulse("diamond-balance", s.diamonds);
  $("home-wins").textContent = s.records.wins;
  $("home-owned").textContent = s.unlocked.length;
  $("home-team-preview").innerHTML = s.team.mons
    .map((k) => portrait(mon(k)))
    .join("");
  $('format-select').innerHTML=Array.from({length:Math.min(6,s.unlocked.length)},(_,i)=>`<option value="${i+1}v${i+1}">Equipe ${i+1} × ${i+1}</option>`).join('');
  $('format-select').value=`${s.team.mons.length}v${s.team.mons.length}`;
  $("battle-start").disabled=s.team.mons.length<1;
  $("battle-start").title="Treino contra uma equipe do mesmo tamanho e nível.";
  if($("training-reason"))$("training-reason").textContent=`Treino ${s.team.mons.length} × ${s.team.mons.length} disponível`;
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
  const daily =
    s.dailyClaimedAt &&
    s.dailyClaimedAt >= new Date().toISOString().slice(0, 10);
  $("daily-claim").disabled = !!daily;
  $("daily-claim").textContent = daily
    ? "Resgatado hoje"
    : `Resgatar 150 moedas${s.growth?" + 2 tickets":""}`;
  $("home-daily").textContent = daily
    ? "Bônus resgatado"
    : "Resgatar bônus diário";
  const summonCostFor = (count) => {
    const tickets = Math.min(count, s.tickets || 0);
    const diamonds = (count - tickets) * ECONOMY.summonDiamondCost;
    return { tickets, diamonds, affordable: s.diamonds >= diamonds };
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
        `<button data-detail="${m.key}" class="pokemon-card rarity-${rarityTier(m).code} ${m.owned ? "" : "is-locked"}" aria-label="${esc(m.name)}, ${m.owned ? "na coleção" : "não desbloqueado"}">${m.owned ? `<span class="owned-mark">${icon("check")}</span>` : ""}${portrait(m)}<span class="card-level">${m.owned?`Nv. ${m.level}`:"A descobrir"}</span><h3>${esc(m.name)}</h3><small>${tierBadge(m)} ${rarityTier(m).label}${save().shinies.includes(m.key) ? " · Shiny" : ""}</small></button>`,
    )
    .join("");
}
function renderShop() {
  const s = save();
  $("buy-pokeballs").hidden=shopFilter!=="items";
  $("shop-balance").textContent=shopFilter==="items"?`${s.coins} moedas`:`${s.diamonds} diamantes`;
  if(shopFilter==="items"){
    $("shop-grid").innerHTML=[...Object.entries(ITEMS).map(([id,item])=>[id,item,'item']),...Object.entries(STONES).map(([id,item])=>[id,item,'stone'])].map(([id,item,kind])=>`<article class="shop-consumable"><img src="/pulse/assets/items/${id}.png" alt=""><div><h2>${item.name}</h2><p>${item.description}</p></div><button data-buy-${kind}="${id}" class="primary-button" ${s.coins<item.price?'disabled':''}>${item.price} moedas</button></article>`).join('');return;
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
        return `<button class="shop-item rarity-${rarityTier(m).code}" data-shop-detail="${m.key}" data-cosmetic="${cosmetic}"><img src="${esc(face(m, cosmetic))}" alt=""><span><b>${esc(m.name)}${cosmetic ? " Shiny" : ""}</b><small>${bought ? "Na sua coleção" : cosmetic ? "Visual alternativo · mesmos atributos" : `${tierBadge(m)} ${rarityTier(m).label}`}</small></span><strong>${bought ? icon("check") : (cosmetic || isSummonable(m.key)) ? `${icon("diamond")} ${price}` : "Evolução"}</strong></button>`;
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
    `<div class="dialog-heading"><h2>${cosmetic ? "Versão shiny" : "Conheça seu parceiro"}</h2><button data-close class="icon-button" aria-label="Fechar">${icon("close")}</button></div><div class="detail-hero"><img src="${esc(face(m, cosmetic))}" alt="${esc(m.name)}"><div><h2>${esc(m.name)}${cosmetic ? " Shiny" : ""}</h2><span class="type-list">${tags(m)}</span><p>${tierBadge(m)} ${rarityTier(m).label} · ${m.owned ? "Desbloqueado" : "A descobrir"}</p></div></div><div class="detail-stats">${Object.entries(
      m.stats,
    )
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
  $("hero-name").textContent = `${m.name} · Nv. ${m.level}`;
  $("hero-types").innerHTML = tags(m);
  $("hero-subtitle").textContent = isShiny(m.key)
    ? "Versão shiny · Seu parceiro de arena"
    : "Seu parceiro de arena";
  const image = new Image();
  image.src = `/${isShiny(m.key) && shiny[m.key] ? shiny[m.key].idle : m.icon.file}`;
  try {
    await image.decode();
  } catch {
    return;
  }
  if (token !== heroToken) return;
  const canvas = $("hero-canvas");
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
    const labelSpace =
      Math.ceil(
        canvas.parentElement.querySelector(".hero-name").getBoundingClientRect()
          .height * 2,
      ) + 12;
    const scale = Math.max(
        1,
        Math.min(16, (canvas.height - labelSpace - 12) / bh),
      ),
      frame = reduced ? 0 : Math.floor(t / 110) % cols;
    ctx.drawImage(
      image,
      frame * w + minX,
      minY,
      bw,
      bh,
      (canvas.width - bw * scale) / 2,
      canvas.height - labelSpace - bh * scale,
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
 return {levels,opponentLevel:opponentLevel||Math.max(...state.team.mons.map(k=>levels[k]||5)),selected:p.getTeam().moves,held:state.growth.held,icons:await itemIconsPromise,preview:key=>p.previewEvolution(key),onConsume:event=>p.consumeHeld({...event,battleId:battle.id}).ok,onEvolve:(from,to)=>{const result=p.evolvePokemon(from,to);refresh();if(!result.ok)notify(result.error);},onEvent:event=>playPulseSound(event.kind),onKnockout:event=>p.awardKnockoutXP(event),onSuppress:(mon,level)=>p.suppressAutoEvolution(mon,level),onPendingResolved:()=>p.clearPendingAuto(),pendingAuto:state.growth.pendingAuto||null,suppressedAuto:state.growth.suppressedAuto||{}};
}
function renderBag(){management?.renderBag();}
function drawTechnique(){
 const key=$('technique-mon').value,result=p.summonMove(key);if(!apply(result))return;
 rewardSound();$('pull-content').innerHTML=`<div class="dialog-heading"><h2>TM obtida!</h2></div><div class="technique-reveal">${portrait(mon(key))}<h2>${esc(result.move.name)}</h2><p>${esc(mon(key).name)} é compatível com esta TM. Use o item na mochila para ensinar o golpe.</p><span class="type-list">${types[result.move.type]}</span></div><button id="technique-equip" class="primary-button">Abrir mochila</button><button id="technique-close" class="text-button">Fechar</button>`;
 $('pull-dialog').onclose=()=>refresh();$('technique-equip').onclick=()=>{$('pull-dialog').close();navigate('bag');};$('technique-close').onclick=()=>$('pull-dialog').close();showDialog('pull-dialog');
}
async function startBattle(options={}) {
  setMenuAmbient(false);
  if(options?.type)options={};
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
    });
  } catch (error) {
    exitBattle();
    notify(error.message);
  }
}
function updateBattle(s) {
  snapshot = s;
  $("battle-capture").hidden = !wildBattle;
  $("battle-loading").hidden = s.state !== "loading";
  if (!s.player) return;
  $("battle-clock").textContent =
    `${Math.floor(s.secondsLeft / 60)}:${String(Math.floor(s.secondsLeft % 60)).padStart(2, "0")}`;
  const scale = save().growth ? 9 : 1;
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
    const a = s[side];
    $(side + "-name").textContent = a.name;
    $(side + "-level").textContent = `Nv. ${a.level}`;
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
  $("battle-mega").hidden = !s.canMega && !s.canEvolve;
  $("battle-mega").textContent = s.canEvolve ? "EVOLUIR" : "MEGA";
  const prompt = s.evolutionPrompt;
  $("battle-evolve").hidden = !prompt;
  if (prompt) {
    const from = mon(prompt.from), to = mon(prompt.target);
    $("battle-evolve-text").textContent = `${from ? from.name : prompt.from} vai evoluir para ${to ? to.name : prompt.target}!`;
    $("battle-evolve-count").textContent = `${prompt.secondsLeft}s`;
  }
  $("battle-guard").disabled = !s.guardReady;
  $("battle-dodge").disabled = !s.dodgeReady;
  const moveKey = s.moves.map((m) => m.name).join("|");
  if ($("battle-moves").dataset.key !== moveKey) {
    $("battle-moves").dataset.key = moveKey;
    $("battle-moves").innerHTML = s.moves
      .map(
        (m, i) =>
          `<button data-move="${i}" class="move-button"><span class="move-type"></span><b>${esc(m.name)}</b><span class="move-power"></span><span class="move-eff"></span><small></small></button>`,
      )
      .join("");
  }
  all("#battle-moves button").forEach((button, i) => {
    const m = s.moves[i];
    button.style.setProperty("--charge", m.charge);
    button.style.setProperty("--move-color", TYPE_COLORS[m.type] || "#8fe1de");
    button.classList.toggle("is-ready", m.charge >= 1 && !m.locked);
    button.classList.toggle("is-called", m.called);
    button.disabled = m.locked;
    button.querySelector(".move-type").textContent = types[m.type] || m.type;
    button.querySelector(".move-power").textContent = m.power ? m.power : "—";
    const effEl = button.querySelector(".move-eff");
    effEl.textContent = effectLabel(m.eff);
    effEl.className = `move-eff ${effectClass(m.eff)}`;
    button.querySelector("small").textContent = m.locked
      ? "Indisponível"
      : m.charge < 1
        ? `${Math.round(m.charge * 100)}%`
        : m.inRange
          ? "Ao alcance"
          : "Fora de alcance";
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
  if(wildBattle&&result.won){wildBattle=false;p.resolveEncounter('defeated');const active=save().journey.active;runTrainerStage(ALL_STAGES.find(s=>s.id===active.stage),active.id);return;}
  if(wildBattle&&!result.won&&save().journey?.active?.encounter?.state==='pending')p.resolveEncounter('fled');
  wildBattle=false;
  $("pause-dialog").close();
  const reward = activeStage ? (result.reason==="surrender" ? p.abandonStage() : p.completeStage(result)) : p.recordBattle(result);
  if(snapshot?.evolutionPrompt)p.deferAutoEvolution(snapshot.evolutionPrompt.from,snapshot.evolutionPrompt.level);
  refresh();
  $("result-content").innerHTML =
    `<div class="result-symbol">${icon(result.won ? "star" : "shield")}</div><h2>${result.won ? "Vitória na arena!" : result.reason === "surrender" ? "Batalha encerrada" : "O próximo duelo é seu"}</h2><p>${result.reason === "surrender" ? "Desistências não concedem moedas." : "Sua equipe volta pronta para uma nova estratégia."}</p><div class="result-coins">${icon("coin")} +${reward.coins || 0}</div>${reward.trainerXp?`<p>+${reward.trainerXp.xp} XP de treinador${reward.trainerXp.to>reward.trainerXp.from?` · Você subiu para o nível ${reward.trainerXp.to}!`:""}</p>`:""}${result.koXp?`<p>+${result.koXp} XP de nocaute na batalha</p>`:""}${reward.tickets?`<p>+${reward.tickets} ticket${reward.tickets>1?"s":""} de técnica</p>`:""}${reward.gachaTickets?`<p>+${reward.gachaTickets} ticket de invocação</p>`:""}<button id="result-lobby" class="primary-button">Voltar ao lobby</button><button id="result-retry" class="secondary-button">Jogar novamente</button>`;
  showDialog("result-dialog");
  $("result-lobby").onclick = exitBattle;
  const retryStage=activeStage;
  $("result-retry").onclick = ()=>retryStage?launchStage(retryStage):startBattle();
}
function exitBattle() {
  if(activeStage&&save().journey?.active)p.abandonStage();
  activeStage=null;
  wildBattle=false;
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
 await startBattle({battleId,team:p.getTeam(),botTeam:{mons:[...stage.opponents],moves:{},gimmick:null},format:`${save().team.mons.length}v${stage.opponents.length}`,difficulty:stage.difficulty,opponentLevel:5+ALL_STAGES.indexOf(stage)*2});
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
 const key={route:'bulbasaur',battle:'lucario',night:'marshadow'}[selectedBanner];
 const stop=await animatePartner($('summon-partner'),mon(key),{reduced:reducedMotion()});
 if(token!==selectedBanner||route!=='summon')stop();else stopBannerSprite=stop;
}
function wire() {
  management=createManagementUI({p,save,mon,portrait,tags,esc,navigate,notify,apply,movePicker,launchStage,drawTechnique,goBack});
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
    "favorite-button": "heart",
    "hero-info": "info",
    "battle-start-icon": "bolt",
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
    if(b.dataset.useStone){const [stone,key]=b.dataset.useStone.split(':');const r=p.useStone(key,stone);if(apply(r)){notify(`${mon(r.target).name}!`);management?.openPartner?.(r.target,'evolution');}}
    if(b.dataset.equipItem&&apply(p.equipItem($("bag-owner-"+b.dataset.equipItem).value,b.dataset.equipItem)))notify("Item equipado.");
    if(b.dataset.unequip&&apply(p.equipItem(b.dataset.unequip,null)))notify("Item devolvido à mochila.");
    if (b.dataset.route) {
      teamPick = null;
      navigate(b.dataset.route);
    }
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
  const account=mountAccount();
  $("profile-button").onclick = () => {
    account.prepare();
    $("profile-name").value = save().trainerName;
    showDialog("profile-dialog");
  };
  $("profile-form").onsubmit = (e) => {
    e.preventDefault();
    if (apply(p.setTrainerName($("profile-name").value)))
      $("profile-dialog").close();
  };
  $("wallet-button").onclick = () => navigate("rewards");
  $("diamond-wallet").onclick = () => navigate("shop");
  $("home-team-link").onclick = () => navigate("team");
  $("favorite-button").onclick = () => {
    ownedFilter = "owned";
    navigate("collection");
  };
  $("hero-info").onclick = () => detail(save().favorite);
  $("home-daily").onclick = () => {
    if (apply(p.claimDaily())) notify("Bônus diário: +150 moedas.");
  };
  $("daily-claim").onclick = $("home-daily").onclick;
  const starterClaimBtn = $("starter-tickets-claim");
  if (starterClaimBtn)
    starterClaimBtn.onclick = () => {
      if (apply(p.claimStarterTickets()))
        notify("Recompensa inicial: +10 tickets de invocação.");
    };
  for (const id of ["collection-summon", "rewards-summon", "home-summon"])
    $(id).onclick = () => navigate("summon");
  $("summon-back").onclick = () => navigate("home");
  $("team-add").onclick=()=>management.addSlot();
  $("collection-search").oninput = renderCollection;
  $("type-filter").onchange = renderCollection;
  $("format-select").onchange = (e) =>
    changeFormat(Number(e.target.value[0]));
  $("summon-one").onclick = () => startPulls(1);
  $("summon-ten").onclick = () => startPulls(10);
  $("battle-start").onclick = startBattle;
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
  bindGamepad({getSnapshot:()=>snapshot,command:input=>battle?.command(input.kind==="mega"&&snapshot?.canEvolve?{kind:"evolve"}:input),pause:()=>{battle?.pause();showDialog("pause-dialog");}});
  bindBattleControls({
    surface: $("battle-screen"), stick: $("joystick"), knob: $("joystick-knob"),
    getSnapshot: () => snapshot,
    command: input => battle?.command(input.kind==="mega"&&snapshot?.canEvolve?{kind:"evolve"}:input),
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
    const {chooseInitialPartner}=await import("./onboarding.js");
    await chooseInitialPartner(p);
    wire();
    $("app").hidden = false;
    navigate("home");
  } catch (error) {
    $("boot").innerHTML =
      `<div class="wordmark">PULSE ARENA</div><p>Não foi possível carregar o jogo.</p><p>${esc(error.message)}</p><button class="primary-button" onclick="location.reload()">Tentar novamente</button>`;
  }
}
boot();

