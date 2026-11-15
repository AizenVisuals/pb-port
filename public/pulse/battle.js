import {LEARNSETS} from './learnsets.js';
import {configureGrowthBattle,evolutionAssets} from './growth-battle.js';
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
      if (document.hidden && this.state === 'running') { this.autoPaused = true; this.pause(); }
      // Returning to the app leaves the pause sheet in control; never resume behind it.
    };
    document.addEventListener('visibilitychange', this._visibility);
  }

  async start({team, difficulty = 3, format = '3v3', arena = 'stadium', seed, botTeam, shinies = [], shinyCatalog = {}, battleId,growth} = {}) {
    this._stopLoop();
    this.audio?.stop?.();
    const generation = ++this.generation;
    this.state = 'loading';
    this.result = null;
    this.battle = null;
    this.pendingInputs = [];
    this.autoPaused = false;
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
      if (!this.team.gimmick) cpu.gimmick = null;
      if (this.team.gimmick && !cpu.gimmick) {
        const mon = cpu.mons.findIndex(key => engine.canMega(key));
        if (mon >= 0) cpu.gimmick = {kind: 'mega', mon};
      }
      this.arena = engine.ARENAS.some(a => a.key === arena) ? arena : 'stadium';
      const teams = [
        {...this.team, name: 'Você', trainer: 'red', bot: false},
        {...cpu, name: ['Iniciante','Aprendiz','Rival','Veterano','Elite'][this.difficulty - 1], trainer: 'blue', bot: true, level: this.difficulty},
      ];
      await Promise.all([
        engine.loadRankedAssets(growth?evolutionAssets(teams.flatMap(t=>t.mons)):teams.flatMap(t=>t.mons)),
        engine.loadTrainers(['red','blue']),
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
      this.growth=growth?configureGrowthBattle(this.battle,engine,growth):null;
      this.render = engine.makeView(this.canvas, this.battle, {scale: 0.65, hud: false});
      this._bindKeyboard();
      try {
        const audio = await import('../audio.js');
        audio.unlockAudio();
        this.audio = audio.battleAudio(this.battle);
        this.audio.startMusic();
      } catch { /* Sound is optional; a blocked AudioContext must not block battle. */ }
      if (generation !== this.generation) { this.audio?.stop?.(); return null; }
      this.state = document.hidden ? 'paused' : 'running';
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
    const allowed = new Set(['move','manual','steer','dodge','guard','switch','mega','autoatk','autoguard']);
    if (!allowed.has(input.kind)) return false;
    const command = {...input, side: 0};
    if (command.kind === 'move') {
      if (Number.isInteger(command.index)) command.name = this.battle.fighters[0]?.moves[command.index]?.name;
      if (typeof command.name !== 'string' || !this.battle.fighters[0]?.moves.some(m => m.name === command.name)) return false;
      delete command.index;
    }
    if (command.kind === 'steer') command.dir = Number.isInteger(command.dir) ? clamp(command.dir, 0, 8) : 0;
    if (command.kind === 'manual' && typeof command.on !== 'boolean') command.on = !this.battle.rk.sides[0].manual;
    if (command.kind === 'switch' && (!Number.isInteger(command.to) || !this.battle.teams[0].mons[command.to] || this.battle.teams[0].mons[command.to].fainted)) return false;
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
    if (!b) return {id: this.id, state: this.state, format: this.format, difficulty: this.difficulty};
    const side = b.rk.sides[0];
    const active = b.fighters[0];
    const summary = (actor, index, activeActor) => {
      const key = keyOf(actor), info = e.INFO[key];
      const maxHp = Math.max(1, actor?.maxHp || 1), hp = Math.max(0, actor?.hp || 0);
      return {key, dex: actor?.spec?.dex || info?.dex, name: actor?.name || info?.name || key || '', index,
        level:actor?.level||50,hp, maxHp, hpRatio: hp / maxHp, types: [...(actor?.types || info?.types || [])], status: actor?.status || null,
        fainted: !!actor?.fainted, hidden: !!actor?.hidden, active: actor === activeActor,
        mega: !!actor?.spec?.megaForm || /^MEGA /i.test(actor?.name || ''),
        portrait: info?.dex ? `assets/portraits/${info.dex}_Normal.png` : null};
    };
    const playerIndex = b.teams[0].mons.indexOf(active);
    const opponent = b.fighters[1];
    const opponentIndex = b.teams[1].mons.indexOf(opponent);
    const snapshot = {
      canEvolve:this.growth?.canEvolve()||false,
      id: this.id, state: this.state, frame: b.frame, phase: b.phase, secondsLeft: e.timeLeft(b),
      manual: !!side.manual, choosing: !!side.choosing, canMega: !!side.gimmick && !side.megaDone && !b.teams[0].mons[side.gimmick.mon]?.fainted,
      megaDone: !!side.megaDone, switchCharge: e.switchReady(b, 0), dodgeReady: e.dodgeReadyIn(b, 0) <= 0,
      guardReady: e.guardReadyIn(b, 0) <= 0, dodgeReadyIn: e.dodgeReadyIn(b,0) / 60, guardReadyIn: e.guardReadyIn(b,0) / 60,
      moves: e.moveStatus(b, 0), player: summary(active, playerIndex, active), opponent: summary(opponent, opponentIndex, opponent),
      bench: b.teams[0].mons.map((m,i) => summary(m,i,active)),
      opponentBench: b.teams[1].mons.map((m,i) => summary(m,i,opponent)),
      format: this.format, difficulty: this.difficulty, arena: this.arena,
      cinematic: !!b.cinematic, result: this.result || null,
    };
    return snapshot;
  }

  /** Deterministic QA hook. Uses exactly the same step routine as real time. */
  advanceFrames(count, {autoChoose = false, render = false} = {}) {
    if (!this.battle || this.result) return this.snapshot();
    const amount = clamp(Math.floor(count), 0, 100000);
    for (let i = 0; i < amount && !this.result; i++) {
      if (autoChoose && this.battle.rk.sides[0].choosing) {
        const to = this.battle.teams[0].mons.findIndex(m => !m.fainted && m !== this.battle.fighters[0]);
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
    if (this.battle.done) this._finish(this.engine.winnerSide(this.battle), this.engine.winnerSide(this.battle) === 0 ? 'win' : 'loss');
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
    this.result = {id: this.id, won: winner === 0, winner, format: this.format, difficulty: this.difficulty,
      frames: this.battle?.frame || 0, duration: (this.battle?.frame || 0) / 60,
      team: structuredClone(this.team), reason};
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
function buildBotTeam(engine, player, count, seed, growth) {
  const budget = player.mons.reduce((sum,key) => sum + total(engine.INFO[key]), 0) / count;
  const random = seeded(Number.isInteger(seed) ? seed ^ 0x8d12aa13 : randomSeed());
  const level=growth?.opponentLevel||Math.max(5,...Object.values(growth?.levels||{}));
  const candidates = [...engine.ROSTER].filter(key => !player.mons.includes(key)&&(!growth||engine.INFO[key]?.pool.some(m=>m.power>0&&LEARNSETS[key]?.levelMoves[m.id]<=level)));
  const ranked = candidates.map(key => ({key,score:Math.abs(total(engine.INFO[key]) - budget) + random() * 170})).sort((a,b) => a.score-b.score);
  const mons = ranked.slice(0,count).map(x => x.key);
  return {mons,moves:mons.map(key => engine.legalMoves(key)),gimmick:null};
}
function randomSeed() { if (globalThis.crypto?.getRandomValues) return crypto.getRandomValues(new Uint32Array(1))[0]; return Math.floor(Math.random() * 0x100000000); }
function seeded(value) { let n = value >>> 0 || 1; return () => { n ^= n << 13; n ^= n >>> 17; n ^= n << 5; return (n >>> 0) / 4294967296; }; }
