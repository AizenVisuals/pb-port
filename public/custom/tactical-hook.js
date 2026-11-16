import{scoreMoves}from'./tactical-ai.js';
// Runs inside the engine's stepRanked wrapper (see scripts/package-pb-fan.mjs):
// pbStepRanked calls adviseBots BEFORE the native step, so a plan set here is
// what the native fighter loop sees first. Every decision reads only live
// battle state, so battles stay deterministic for a given seed.
// - Bot plan: overwritten every tick, acting or not. The native loop refills
//   an empty plan with Zh0 while the fighter is acting, so a plan set only
//   when idle (or only every 36 ticks) never survives to execution.
// - The bot flag lives on the ranked side (rk.sides[].bot), NOT on the battle
//   team object (teams[].bot is undefined in real battles). Reading it from
//   the team made this hook a no-op in every real battle; the fallback to
//   teams[].bot only keeps older test shapes working.
// - Bot move choice scales with difficulty (BEST_MOVE_RATE): the hook used to
//   take the best move at every level, which made a difficulty-1 campaign bot
//   play like a perfect player. The native engine scales the same way (no
//   auto-best-move call at L1-3, a call every 45 ticks at L4, every 20 at
//   L5). The roll is a pure hash of (battle seed, fighter, nextAttack tick),
//   so it is stable within one attack cycle and re-drawn per attack, and the
//   same seed always produces the same battle. The AUTO-player is NOT scaled:
//   it always takes the best move.
// - Local player in AUTO mode (not manual, auto-attack on) gets the same
//   planning, plus auto-mega, auto-switch off a terrible matchup, and a forced
//   guard at low HP under a real incoming attack. Never touches a remote
//   human: the player side is advised only when the other side is a bot.
// - Singles only for the player-side features (doubles use rk.seats, not sides).
const GUARD_HP=.35;
const foeOf=(b,actor)=>b.fighters.find(x=>x&&x.side!==actor.side&&!x.fainted&&!x.hidden);
function isBotSide(b,side,actor){
 if(b.rk?.doubles)return b.rk.seats?.[actor?.dblFi]?.bot ?? b.teams[side]?.bot;
 return b.rk?.sides?.[side]?.bot ?? b.teams[side]?.bot;
}
function sideState(b,side){return b.rk&&!b.rk.doubles?b.rk.sides?.[side]||null:null;}
function isAuto(b,side){const s=sideState(b,side);return !!s&&!s.manual&&!s.holdFire;}
function botLevel(b,side,actor){
 if(b.rk?.doubles)return b.rk.seats?.[actor?.dblFi]?.level??3;
 return b.rk?.sides?.[side]?.level??3;
}
// Deterministic roll in [0,1) from (battle seed, fighter key, attack epoch).
// Pure integer hash: same seed -> same rolls -> same battles.
export function hash01(seed,key,epoch){
 let h=(Math.trunc(seed)||0)^0x9e3779b9;
 const s=String(key??'');
 for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),0x85ebca6b);h^=h>>>13;}
 h=Math.imul(h^(Math.trunc(epoch)||0),0xc2b2ae35);h^=h>>>16;
 h=Math.imul(h,0x27d4eb2f);h^=h>>>15;
 return (h>>>0)/4294967296;
}
// How often the bot takes its best move, by difficulty level (1-5).
const BEST_MOVE_RATE={1:.45,2:.6,3:.75,4:.9,5:1};
export function pickBotMove(ranked,level,roll){
 if(!ranked?.length)return null;
 const rate=BEST_MOVE_RATE[level]??BEST_MOVE_RATE[3];
 if(roll<rate||ranked.length===1)return ranked[0].name;
 const n=Math.min(3,ranked.length);
 const idx=1+Math.floor((roll-rate)/(1-rate)*(n-1));
 return ranked[Math.min(idx,n-1)].name;
}
function incomingAttack(b,actor,foe){
 if(!foe)return false;
 if(foe.actionIsMove&&foe.lastMove?.power>0&&Math.hypot(actor.x-foe.x,actor.y-foe.y)<160)return true;
 if(Array.isArray(b.beams)&&b.beams.some(beam=>beam?.alive&&beam.owner===foe))return true;
 if(Array.isArray(b.threats))for(const t of b.threats){if(t?.target===actor&&t.owner===foe&&t.obj&&Number.isFinite(t.obj.x)&&Math.hypot(t.obj.x-actor.x,t.obj.y-actor.y)<70)return true;}
 return false;
}
function bestReadyEff(rows){let best=0;for(const r of rows)if(r.power&&(r.eff??1)>best&&(r.charge??1)>=1&&!r.locked&&r.left!==0)best=r.eff??1;return best;}
function bestEffVs(b,mon,foeTypes){let best=0;for(const mv of mon.moves||[]){if(!mv.power||mv.cat==='status')continue;let eff=1;try{eff=b.typeEff(mv.type,foeTypes);}catch{eff=1;}if(eff>best)best=eff;}return best;}
function maybeGuard(b,actor,rows){
 const state=sideState(b,actor.side);
 if(!state||state.wantGuard!=null)return;
 if(actor.hp/actor.maxHp>=GUARD_HP)return;
 if(state.guardReady!=null&&state.guardReady>b.tick)return;
 const foe=foeOf(b,actor);
 if(foe&&foe.hp/foe.maxHp<.25&&rows.some(r=>r.power&&(r.eff??1)>=1&&r.charge>=1&&!r.locked&&r.left!==0))return;
 if(incomingAttack(b,actor,foe))state.wantGuard=b.tick;
}
function maybeAutoMega(b,actor,rows){
 const state=sideState(b,actor.side);
 if(!state||state.wantMega||state.megaDone)return;
 const gimmick=state.gimmick;
 if(!gimmick||gimmick.kind!=='mega')return;
 const mon=b.teams[actor.side]?.mons?.[gimmick.mon];
 if(!mon||mon.fainted||b.fighters[actor.side]!==mon)return;
 if(actor.status==='slp')return;
 const enteredAt=b.teams[actor.side]?.enteredAt||0;
 if(typeof b.tick==='number'&&b.tick-enteredAt<60)return;
 const foe=foeOf(b,actor);if(!foe)return;
 const hpRatio=actor.hp/actor.maxHp,foeHpRatio=foe.hp/foe.maxHp;
 if(foeHpRatio<.25&&hpRatio>.7)return;
 if(hpRatio<.6||bestReadyEff(rows)>=2)state.wantMega=true;
}
function maybeAutoSwitch(b,actor,rows){
 const state=sideState(b,actor.side);
 if(!state||state.wantSwitch!=null)return;
 const team=b.teams[actor.side];
 if(!team||!Array.isArray(team.mons))return;
 const foe=foeOf(b,actor);if(!foe||foe.hp/foe.maxHp<=.2)return;
 if(bestReadyEff(rows)>.5)return;
 const foeTypes=foe.showTypes||foe.types||[];
 let pick=null,pickEff=0;
 for(const mon of team.mons){
  if(mon===actor||mon.fainted||mon.hidden)continue;
  if(mon.hp/mon.maxHp<=.4)continue;
  const eff=bestEffVs(b,mon,foeTypes);
  if(eff>=2&&eff>pickEff){pickEff=eff;pick=mon;}
 }
 if(pick)state.wantSwitch=team.mons.indexOf(pick);
}
export function adviseBots(b,moveStatus){
 if(b.phase!=='fight'||b.cinematic||b.done)return;
 for(const actor of b.fighters){
  if(!actor||!actor.ai||actor.fainted||actor.hidden)continue;
  const side=actor.side,team=b.teams[side];
  if(!team)continue;
  const isBot=!!isBotSide(b,side,actor);
  const isAutoPlayer=!isBot&&!b.rk?.doubles&&!!isBotSide(b,1-side)&&isAuto(b,side);
  if(!isBot&&!isAutoPlayer)continue;
  const target=foeOf(b,actor);if(!target)continue;
  let rows;
  const getRows=()=>rows??=moveStatus(b,side);
  // Overwrite the plan every tick, acting or not: the native loop refills an
  // empty plan with Zh0 while the fighter is acting, so a plan set only when
  // idle never survives to execution (verified: a no-op hook and the old
  // 36-tick hook produce byte-identical battles). The hook runs before the
  // native step, so this is the plan the fighter actually uses; punish-mode
  // plans still win because TZ0 sets and fires them in the same call.
  // Bots pick by difficulty (pickBotMove); the AUTO-player always takes the
  // best move. The roll is stable within one attack cycle (nextAttack epoch).
  const ranked=scoreMoves(actor,target,getRows(),team.mons);
  const move=isBot?pickBotMove(ranked,botLevel(b,side,actor),hash01(b.seed,actor.rkKey,actor.ai.nextAttack??0)):ranked[0]?.name??null;
  if(move)actor.ai.plan=actor.moves.find(x=>x.name===move);
  if(!actor.action&&!b.rk?.doubles){
   maybeGuard(b,actor,getRows());
   if(isAutoPlayer){maybeAutoMega(b,actor,getRows());maybeAutoSwitch(b,actor,getRows());}
  }
 }
}
