import{localizePBText}from'./status-text.js';
import {LEARNSETS} from './learnsets.js';
import {configureGrowthBattle,evolutionAssets} from './growth-battle.js';
import {applyEarnedLevel} from './growth-battle.js';
import {resolveTrainerKey} from './progression.js';
import {buildDamageReport} from './damage-graph.js';
/** Formatos de treino expostos na Home. `teamSize` = Pokémon por lado;
 * `active` = ativos simultâneos por lado (regras singles = 1). Doubles
 * (2 ativos) EXISTE no engine — createBattle com `slots` ([0,1]) cria a
 * batalha dupla — mas o runtime PULSE (snapshot, comandos e HUD) é
 * singles-only: um único lutador ativo por lado. Por isso 2v2 fica visível
 * como "em breve" até existir HUD de dois ativos; nunca como singles
 * disfarçado de Doubles. */
export const TRAINING_FORMATS = [
  {id: '1v1', label: 'Singles', teamSize: 1, active: 1},
  {id: '2v2', label: 'Doubles', teamSize: 2, active: 2, comingSoon: true},
  {id: '3v3', label: '3v3', teamSize: 3, active: 1},
  {id: '6v6', label: '6v6', teamSize: 6, active: 1},
];
export const TRAINING_FORMAT_DEFAULT = '3v3';
export function resolveTrainingFormat(value, unlockedCount = 6) {
  const found = TRAINING_FORMATS.find(f => f.id === value);
  const format = found || TRAINING_FORMATS.find(f => f.id === TRAINING_FORMAT_DEFAULT);
  const unlocked = Math.max(0, Math.floor(Number(unlockedCount) || 0));
  return {...format, matched: !!found, available: !format.comingSoon && unlocked >= format.teamSize, unlocked};
}
export function mountTrainingFormatSelector(parent, beforeEl, {onSelect, onComingSoon} = {}) {
  const doc = parent.ownerDocument;
  const root = doc.createElement('div');
  root.className = 'training-format';
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', 'Formato do treino');
  const label = doc.createElement('p');
  label.className = 'training-format-label';
  label.textContent = 'Formato do treino';
  root.appendChild(label);
  const row = doc.createElement('div');
  row.className = 'training-format-row';
  root.appendChild(row);
  const buttons = new Map();
  for (const format of TRAINING_FORMATS) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'training-format-option';
    button.dataset.format = format.id;
    button.setAttribute('aria-pressed', 'false');
    const name = doc.createElement('b');
    name.textContent = format.label;
    const sub = doc.createElement('small');
    sub.textContent = format.comingSoon ? 'em breve' : `${format.teamSize} × ${format.teamSize}`;
    button.appendChild(name);
    button.appendChild(sub);
    button.addEventListener('click', () => {
      if (button.disabled) return;
      if (format.comingSoon) { onComingSoon?.(format); return; }
      onSelect?.(format.id);
    });
    row.appendChild(button);
    buttons.set(format.id, button);
  }
  parent.insertBefore(root, beforeEl || null);
  return {
    root,
    sync({current, unlocked} = {}) {
      const resolved = resolveTrainingFormat(current, unlocked);
      for (const format of TRAINING_FORMATS) {
        const button = buttons.get(format.id);
        const available = !format.comingSoon && (unlocked ?? 6) >= format.teamSize;
        const active = resolved.matched && resolved.id === format.id && available;
        // Doubles fica clicável (não disabled) para explicar que chega em
        // breve; só formatos travados por coleção são desabilitados.
        button.disabled = format.comingSoon ? false : !available;
        button.classList.toggle('is-active', active);
        button.classList.toggle('is-coming-soon', !!format.comingSoon);
        button.setAttribute('aria-pressed', String(active));
      }
      return resolved;
    },
  };
}
/** PULSE ARENA local battle runtime. One simulation, no transport or backend. */
const STEP_MS = 1000 / 60;
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
let enginePromise;
const getEngine = () => enginePromise ||= import('../engine.bundle.js');
const keyOf = actor => actor?.rkKey || null;

export class OfflineBattle {
  constructor({canvas, onUpdate = () => {}, onEnd = () => {}, onError = () => {}} = {}) {
    if (!canvas?.getContext) throw new TypeError('A battle canvas is required.');
    Object.assign(this, {canvas, onUpdate, onEnd, onError});
    this.state = 'idle';
    this.pendingInputs = [];
    this.generation = 0;
    this._visibility = () => {
      if (!this.networked && document.hidden && this.state === 'running') { this.autoPaused = true; this.pause(); }
      // Returning to the app leaves the pause sheet in control; never resume behind it.
    };
    document.addEventListener('visibilitychange', this._visibility);
  }

  async start({team, difficulty = 3, format = '3v3', arena = 'stadium', seed, botTeam, shinies = [], shinyCatalog = {}, battleId,growth, trainer = 'red', opponentName, networkMatch} = {}) {
    this.playerSide = networkMatch?.side === 1 ? 1 : 0;
    this.networked = !!networkMatch;
    this._seenAction = this._seenStatus = 0;
    this._stopLoop();
    this.audio?.stop?.();
    const generation = ++this.generation;
    this.state = 'loading';
    this.result = null;
    this.battle = null;
    this.pendingInputs = [];
    this.autoPaused = false;
    // Formato = tamanho das equipes (regras singles, 1 ativo por lado).
    // '2v2' aqui seria só um time de 2 (banco), não Doubles de verdade:
    // Doubles (2 ativos) precisa de `slots` no engine + HUD própria.
    this.format = /^[1-6]v[1-6]$/.test(format) ? format : '3v3';
    this.difficulty = clamp(Math.round(Number(difficulty) || 3), 1, 5);
    this.id = battleId || globalThis.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      this.onUpdate({id: this.id, state: 'loading', format: this.format, difficulty: this.difficulty});
      const engine = this.engine = await getEngine();
      const count = Number(this.format[0]);
      this.team = normalizeTeam(engine, team, count);
      const cpu = botTeam ? normalizeTeam(engine, botTeam, Number(this.format[2])) : buildBotTeam(engine, this.team, count, seed, growth);
      // A bot does not get a Mega unless the player selected one too.
      if (!networkMatch && !this.team.gimmick) cpu.gimmick = null;
      if (!networkMatch && this.team.gimmick && !cpu.gimmick) {
        const mon = cpu.mons.findIndex(key => engine.canMega(key));
        if (mon >= 0) cpu.gimmick = {kind: 'mega', mon};
      }
      this.arena = engine.ARENAS.some(a => a.key === arena) ? arena : 'stadium';
      const trainerKey = resolveTrainerKey(trainer);
      // Nome do adversário: o padrão é o título por dificuldade; desafios
      // (amigo) e ranqueado passam o nome a exibir na placa do oponente.
      // O time do bot continua sendo um time de bot — o nome não inventa
      // um time do outro jogador (o time real dele não é sincronizado).
      const cpuName = typeof opponentName === 'string' && opponentName.trim()
        ? opponentName.trim().slice(0, 16)
        : ['Iniciante','Aprendiz','Rival','Veterano','Elite'][this.difficulty - 1];
      let teams = [
        {...this.team, name: 'Você', trainer: trainerKey, bot: false},
        {...cpu, name: cpuName, trainer: 'blue', bot: true, level: this.difficulty},
      ];
      if (networkMatch) {
        const mine = {...this.team, name: networkMatch.playerName || 'Você', trainer: trainerKey, bot:false};
        const other = {...cpu, name:cpuName, trainer:networkMatch.opponent?.trainer_key || 'blue', bot:!!networkMatch.vs_bot, level:this.difficulty};
        teams = this.playerSide === 0 ? [mine,other] : [other,mine];
      }
      await Promise.all([
        engine.loadRankedAssets(growth?evolutionAssets(teams.flatMap(t=>t.mons)):teams.flatMap(t=>t.mons)),
        engine.loadTrainers(teams.map(t=>t.trainer)),
        engine.loadArena(this.arena),
      ]);
      if (generation !== this.generation) return null;
      let assets = await engine.loadRankedAssets([]);
      if (shinies.length) {
        const {applyShinyAssets} = await import('./shiny.js');
        assets = applyShinyAssets(assets, shinies.filter(k => this.team.mons.includes(k)), engine.INFO, shinyCatalog);
      }
      if (generation !== this.generation) return null;
      this.seed = Number.isInteger(seed) ? seed >>> 0 : randomSeed();
      this.battle = engine.createBattle(assets, this.seed, teams, this.arena);
      const nativeText=this.battle.text.bind(this.battle);this.battle.text=(x,y,message,options)=>nativeText(x,y,localizePBText(message),options);
      if (networkMatch) for (const team of this.battle.teams) for (const actor of team.mons) applyEarnedLevel(actor,100);
      this.growth=growth?configureGrowthBattle(this.battle,engine,growth):null;
      this.render = engine.makeView(this.canvas, this.battle, {scale: 0.65, hud: true, plates: () => false});
      this._bindKeyboard();
      try {
        const audio = await import('../audio.js');
        audio.unlockAudio();
        this.audio = audio.battleAudio(this.battle);
        this.audio.startMusic();
      } catch { /* Sound is optional; a blocked AudioContext must not block battle. */ }
      if (generation !== this.generation) { this.audio?.stop?.(); return null; }
      this.state = !networkMatch && document.hidden ? 'paused' : 'running';
      this.autoPaused = document.hidden;
      this.accumulator = 0;
      this.lastTime = 0;
      this.lastSnapshotAt = 0;
      this.startedAt = Date.now();
      this.render();
      this._emit();
      this._startLoop();
      return this.snapshot();
    } catch (error) {
      if (generation !== this.generation) return null;
      this.state = 'error';
      this._stopLoop();
      this.audio?.stop?.();
      this.onError(error);
      return null;
    }
  }

  command(input = {}) {
    if (!this.battle || this.state !== 'running' || this.result) return false;
    if(input.kind==='evolve')return this.growth?.requestEvolution()||false;
    if(input.kind==='cancel-evolution')return this.growth?.cancelAutoEvolution()||false;
    const allowed = new Set(['move','manual','steer','dodge','guard','switch','mega','autoatk','autoguard']);
    if (!allowed.has(input.kind)) return false;
    const command = {...input, side: this.playerSide || 0};
    if (command.kind === 'move') {
      if (Number.isInteger(command.index)) command.name = this.battle.fighters[this.playerSide || 0]?.moves[command.index]?.name;
      if (typeof command.name !== 'string' || !this.battle.fighters[this.playerSide || 0]?.moves.some(m => m.name === command.name)) return false;
      delete command.index;
    }
    if (command.kind === 'steer') command.dir = Number.isInteger(command.dir) ? clamp(command.dir, 0, 8) : 0;
    if (command.kind === 'manual' && typeof command.on !== 'boolean') command.on = !this.battle.rk.sides[this.playerSide || 0].manual;
    if (command.kind === 'switch' && (!Number.isInteger(command.to) || !this.battle.teams[this.playerSide || 0].mons[command.to] || this.battle.teams[this.playerSide || 0].mons[command.to].fainted)) return false;
    this.pendingInputs.push(command);
    return true;
  }

  pause() {
    if (this.state !== 'running') return;
    this._resetSteering();
    this.state = 'paused';
    this.lastTime = 0;
    this.accumulator = 0;
    this.audio?.update?.(true);
    this._emit();
  }

  resume() {
    if (this.state !== 'paused' || this.result) return;
    this.autoPaused = false;
    this.state = 'running';
    this.lastTime = 0;
    this.accumulator = 0;
    this._emit();
    this._startLoop();
  }

  surrender() {
    if (!this.battle || this.result || !['running','paused'].includes(this.state)) return;
    this._finish(1, 'surrender');
  }

  destroy() {
    ++this.generation;
    this._stopLoop();
    this._resetSteering();
    this.audio?.stop?.();
    this.audio = null;
    this._unbindKeyboard();
    document.removeEventListener('visibilitychange', this._visibility);
    this.battle = null;
    this.render = null;
    this.state = 'destroyed';
    this.pendingInputs = [];
  }

  snapshot() {
    const b = this.battle, e = this.engine;
    if (!b) return {id: this.id, state: this.state, format: this.format, difficulty: this.difficulty, doubles: false};
    const own = this.playerSide || 0, enemy = 1-own;
    const side = b.rk.sides[own];
    const active = b.fighters[own];
    const summary = (actor, index, activeActor) => {
      const key = keyOf(actor), info = e.INFO[key];
      const level = actor?.level || 50;
      const baseHp = actor?.spec?.base?.hp || info?.stats?.hp || 50;
      const fallbackStHp = Math.floor((2 * baseHp + 31) * level / 100) + level + 10;
      const stHp = actor?.st?.hp > 0 ? actor.st.hp : fallbackStHp;
      const maxHp = Math.max(1, actor?.maxHp || stHp * 9 || 1), hp = Math.max(0, actor?.hp ?? maxHp);
      return {key, dex: actor?.spec?.dex || info?.dex, name: actor?.name || info?.name || key || '', index,
        level, hpScale: stHp > 0 ? maxHp / stHp : 9, hp, maxHp, hpRatio: hp / maxHp, types: [...(actor?.types || info?.types || [])], status: actor?.status || null,
        frozen: (actor?.frozen || 0) > 0, confused: (actor?.confusedT || 0) > 0, toxic: !!actor?.toxic,
        guarding: !!actor?.guarding,
        stages: Object.fromEntries(Object.entries(actor?.stages || {}).filter(([, v]) => v)),
        fainted: !!actor?.fainted, hidden: !!actor?.hidden, active: actor === activeActor,
        mega: !!actor?.spec?.megaForm || /^MEGA /i.test(actor?.name || ''),
        portrait: info?.dex ? `assets/portraits/${info.dex}_Normal.png` : null};
    };
    const playerIndex = b.teams[own].mons.indexOf(active);
    const opponent = b.fighters[enemy];
    const opponentIndex = b.teams[enemy].mons.indexOf(opponent);
    // Eventos novos do engine desde o último snapshot: golpes usados
    // (actionLog, só kind "move") e status aplicados (statusLog). O HUD
    // narra esses eventos no log de batalha; o rastreio é por comprimento
    // do log (o array do engine é mutado in place).
    let newActions = [], newStatuses = [];
    try {
      const actionLog = Array.isArray(b.actionLog) ? b.actionLog : [];
      newActions = actionLog.slice(this._seenAction || 0)
        .filter((x) => x && x.kind === 'move')
        .map((x) => {
          // Categoria do golpe (para o narrador: só 'status'/'stat' mudam
          // stages; só 'status' aplica condição). Busca no lutador, que
          // guarda os mesmos objetos de golpe que o engine usa.
          const fighter = b.fighters?.[x.side];
          const mv = fighter?.moves?.find((m) => m.name === x.name);
          return {name: x.name, side: x.side === own ? 0 : 1, tick: x.t, cat: mv?.cat || null};
        });
      this._seenAction = actionLog.length;
      const statusLog = Array.isArray(b.statusLog) ? b.statusLog : [];
      newStatuses = statusLog.slice(this._seenStatus || 0)
        .map((x) => ({side: x.side, status: x.s, tick: x.t}));
      this._seenStatus = statusLog.length;
    } catch { /* logs indisponíveis: snapshot segue sem eventos */ }
    const snapshot = {
      newActions, newStatuses,
      canEvolve:this.growth?.canEvolve()||false,evolutionPrompt:this.growth?.evolutionPrompt?.()||null,
      id: this.id, state: this.state, networked:this.networked, playerSide:own, frame: b.frame, phase: b.phase, secondsLeft: e.timeLeft(b),
      manual: !!side.manual, choosing: !!side.choosing, canMega: !!side.gimmick && !side.megaDone && !b.teams[own].mons[side.gimmick.mon]?.fainted,
      megaDone: !!side.megaDone, switchCharge: e.switchReady(b, own), dodgeReady: e.dodgeReadyIn(b, own) <= 0,
      guardReady: e.guardReadyIn(b, own) <= 0, dodgeReadyIn: e.dodgeReadyIn(b,own) / 60, guardReadyIn: e.guardReadyIn(b,own) / 60,
      moves: e.moveStatus(b, own), player: summary(active, playerIndex, active), opponent: summary(opponent, opponentIndex, opponent),
      bench: b.teams[own].mons.map((m,i) => summary(m,i,active)),
      opponentBench: b.teams[enemy].mons.map((m,i) => summary(m,i,opponent)),
      format: this.format, difficulty: this.difficulty, arena: this.arena, doubles: !!b.rk?.doubles,
      cinematic: !!b.cinematic, result: this.result || null,
    };
    return snapshot;
  }

  /** Deterministic QA hook. Uses exactly the same step routine as real time. */
  advanceFrames(count, {autoChoose = false, render = false} = {}) {
    if (!this.battle || this.result) return this.snapshot();
    const amount = clamp(Math.floor(count), 0, 100000);
    for (let i = 0; i < amount && !this.result; i++) {
      if (autoChoose && this.battle.rk.sides[this.playerSide || 0].choosing) {
        const to = this.battle.teams[this.playerSide || 0].mons.findIndex(m => !m.fainted && m !== this.battle.fighters[this.playerSide || 0]);
        if (to >= 0) this.pendingInputs.push({kind:'switch',side:0,to});
      }
      this._step();
    }
    if (render) this.render?.();
    this._emit();
    return this.snapshot();
  }

  get debug() { return {battle: this.battle, engine: this.engine, seed: this.seed}; }

  _step() {
    if (!this.battle || this.result) return;
    const inputs = this.pendingInputs.splice(0);
    this.growth?.before();
    this.engine.stepRanked(this.battle, inputs);
    this.growth?.after();
    if (this.battle.done) this._finish(this.engine.winnerSide(this.battle), this.engine.winnerSide(this.battle) === (this.playerSide || 0) ? 'win' : 'loss');
  }

  _startLoop() {
    if (this.raf || this.state !== 'running') return;
    const tick = now => {
      this.raf = 0;
      if (!this.battle || this.state !== 'running' || this.result) return;
      try {
        if (!this.lastTime) this.lastTime = now;
        this.accumulator += Math.min(100, Math.max(0, now - this.lastTime));
        this.lastTime = now;
        let steps = 0;
        while (this.accumulator >= STEP_MS && steps++ < 6 && !this.result) { this._step(); this.accumulator -= STEP_MS; }
        if (this.result) return;
        this.render?.();
        this.audio?.update?.(false);
        if (now - this.lastSnapshotAt >= 70) { this.lastSnapshotAt = now; this._emit(); }
        this.raf = requestAnimationFrame(tick);
      } catch (error) { this.state = 'error'; this._stopLoop(); this.audio?.stop?.(); this.onError(error); }
    };
    this.raf = requestAnimationFrame(tick);
  }

  _stopLoop() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; }
  _resetSteering() {
    this.pendingInputs = this.pendingInputs.filter(i => i.kind !== 'steer' && i.kind !== 'dodge');
    if (this.battle && this.engine) this.engine.applyInput(this.battle, {kind:'steer',dir:0,side:0});
    this.keys?.clear();
  }
  _emit() { this.onUpdate(this.snapshot()); }
  _finish(winner, reason) {
    if (this.result) return;
    this._stopLoop();
    this._resetSteering();
    this.state = 'ended';
    const damageReport=this.growth?.damageReport?.()||{entries:[],damagingMoves:[]};
    const damagingMoves=new Set(damageReport.damagingMoves);
    for(const team of this.battle?.teams||[])for(const actor of team.mons||[])for(const mv of actor.moves||[])if(mv?.power>0&&mv?.name)damagingMoves.add(mv.name);
    const damage=buildDamageReport({entries:damageReport.entries,damagingMoves:[...damagingMoves],moveUses:this.battle?.rkMoveUse||[],kos:this.battle?.rkKOs||[],playerKeys:[...(this.team?.mons||[])],opponentKeys:(this.battle?.teams?.[1-(this.playerSide||0)]?.mons||[]).map(actor=>actor.rkKey),playerSide:this.playerSide||0,names:key=>this.engine.INFO[key]?.name||key,types:key=>[...(this.engine.INFO[key]?.types||[])]});
    this.result = {id: this.id, won: winner === (this.playerSide || 0), winner, format: this.format, difficulty: this.difficulty,
      frames: this.battle?.frame || 0, duration: (this.battle?.frame || 0) / 60,
      team: structuredClone(this.team), reason, knockouts:this.battle?.rkKOs?.filter(event=>event.side===(this.playerSide||0)).length||0,koXp:this.growth?.koXpTotal?.()||0,hitXp:this.growth?.hitXpTotal?.()||0,damage};
    this.audio?.stop?.();
    this.render?.();
    this._emit();
    this.onEnd(this.result);
  }
  _bindKeyboard() {
    this._unbindKeyboard();
    this.keys = new Set();
    this._keyDown = event => {
      if (event.target?.closest?.('input,textarea,[contenteditable]') || this.state !== 'running') return;
      const key = event.key.toLowerCase();
      if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(key)) {
        event.preventDefault(); this.keys.add(key); this._keySteer();
      } else if (!event.repeat && /^[1-4]$/.test(key)) this.command({kind:'move',index:Number(key)-1});
      else if (!event.repeat && key === ' ') { event.preventDefault(); this.command({kind:'dodge'}); }
      else if (!event.repeat && key === 'g') this.command({kind:'guard'});
      else if (!event.repeat && key === 'm') this.command({kind:'manual'});
    };
    this._keyUp = event => { this.keys.delete(event.key.toLowerCase()); this._keySteer(); };
    this._blur = () => this._resetSteering();
    window.addEventListener('keydown', this._keyDown); window.addEventListener('keyup', this._keyUp); window.addEventListener('blur', this._blur);
  }
  _keySteer() {
    const k = this.keys;
    const x = Number(k.has('arrowright') || k.has('d')) - Number(k.has('arrowleft') || k.has('a'));
    const y = Number(k.has('arrowdown') || k.has('s')) - Number(k.has('arrowup') || k.has('w'));
    const dir = x || y ? 1 + (Math.round(Math.atan2(y,x) / (Math.PI / 4)) + 8) % 8 : 0;
    this.command({kind:'steer',dir});
  }
  _unbindKeyboard() {
    if (!this._keyDown) return;
    window.removeEventListener('keydown', this._keyDown); window.removeEventListener('keyup', this._keyUp); window.removeEventListener('blur', this._blur);
    this._keyDown = this._keyUp = this._blur = null;
  }
}

function normalizeTeam(engine, team, count) {
  if (!team || !Array.isArray(team.mons) || team.mons.length !== count || new Set(team.mons).size !== count || team.mons.some(k => !engine.INFO[k])) {
    throw new Error(`Escolha ${count} Pokémon diferentes para sua equipe.`);
  }
  const moves = team.mons.map((key,index) => engine.legalMoves(key, Array.isArray(team.moves) ? team.moves[index] : team.moves?.[key]));
  const gimmick = team.gimmick?.kind === 'mega' && Number.isInteger(team.gimmick.mon) && team.gimmick.mon >= 0 && team.gimmick.mon < count && engine.canMega(team.mons[team.gimmick.mon]) ? {kind:'mega',mon:team.gimmick.mon} : null;
  return {mons:[...team.mons],moves,gimmick};
}
const total = info => Object.values(info.stats || {}).reduce((sum,n) => sum + (Number(n) || 0), 0);
export const levelLegalMoveIds=(info,rules,level)=>(info?.pool||[])
  .filter(move=>Number.isInteger(rules?.levelMoves?.[move.id])&&rules.levelMoves[move.id]<=level)
  .map(move=>move.id).slice(-4);
function buildBotTeam(engine, player, count, seed, growth) {
  const budget = player.mons.reduce((sum,key) => sum + total(engine.INFO[key]), 0) / count;
  const random = seeded(Number.isInteger(seed) ? seed ^ 0x8d12aa13 : randomSeed());
  const level=growth?.opponentLevel||Math.max(5,...Object.values(growth?.levels||{}));
  const candidates = [...engine.ROSTER].filter(key => !player.mons.includes(key)&&(!growth||engine.INFO[key]?.pool.some(m=>m.power>0&&LEARNSETS[key]?.levelMoves[m.id]<=level)));
  const ranked = candidates.map(key => ({key,score:Math.abs(total(engine.INFO[key]) - budget) + random() * 170})).sort((a,b) => a.score-b.score);
  const mons = ranked.slice(0,count).map(x => x.key);
  // O bot obedece ao mesmo learnset por nível do jogador. Antes, o filtro
  // só decidia quais espécies podiam entrar, mas `legalMoves(key)` ainda
  // devolvia os defaults completos — inclusive golpes acima do nível.
  const moves=mons.map(key=>{
    const learned=levelLegalMoveIds(engine.INFO[key],LEARNSETS[key],level);
    return engine.legalMoves(key,learned);
  });
  return {mons,moves,gimmick:null};
}
function randomSeed() { if (globalThis.crypto?.getRandomValues) return crypto.getRandomValues(new Uint32Array(1))[0]; return Math.floor(Math.random() * 0x100000000); }
function seeded(value) { let n = value >>> 0 || 1; return () => { n ^= n << 13; n ^= n >>> 17; n ^= n << 5; return (n >>> 0) / 4294967296; }; }
