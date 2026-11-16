import {planCPU} from './tactical-ai.js';
import {EVOLUTIONS,ITEMS,selectedMoves,xpAt,effectiveNature,natureMultiplier} from './growth.js';
/** Apply earned levels without replaying Mega transitions, healing, or resetting commands. */
export function applyEarnedLevel(actor,level){
 if(!actor||!Number.isInteger(level)||level<=actor.level||level>100)return false;
 const hpScale=actor.maxHp/actor.st.hp,oldMax=actor.maxHp,wasAlive=actor.hp>0&&!actor.fainted;
 // Mesma fórmula do engine (e7a + nature): IV do spec (default 31) e nature
 // efetiva (mint, se houver) — sem isso o level-up apagaria nature/IVs.
 const ivs=actor.spec?.ivs||{},nature=effectiveNature(actor.spec);
 const stat=(base,key)=>key==='hp'?Math.floor((2*base+(ivs.hp??31))*level/100)+level+10:Math.floor((Math.floor((2*base+(ivs[key]??31))*level/100)+5)*natureMultiplier(nature,key));
 const stats=Object.fromEntries(Object.entries(actor.spec.base).map(([key,base])=>[key,stat(base,key)]));
 actor.level=level;actor.spec={...actor.spec,level};actor.st=stats;actor.maxHp=stats.hp*hpScale;
 actor.hp=wasAlive?Math.min(actor.maxHp,actor.hp+actor.maxHp-oldMax):0;
 actor.hpShown=actor.hp;actor.hpChip=actor.hp;return true;
}
export function evolutionAssets(keys){const result=new Set(keys);for(const key of result){const next=EVOLUTIONS[key]?.[0];if(next)result.add(next);}return [...result];}
export function configureGrowthBattle(b,engine,{levels={},traits={},opponentLevel=5,selected={},held={},onConsume=()=>true,onEvolve=()=>true,preview=()=>null,onEvent=()=>{},icons={},onKnockout=()=>null,onDamageXP=()=>null}={}){
  b.speciesTable={...b.speciesTable};
  let wanted=false,pending=null;
  const participants=new Set(),countedKO=new Set();
  let koXpTotal=0,hitXpTotal=0;
  // Dano por Pokémon (gráfico de fim de batalha): acumulado de forma
  // aditiva no wrapper de b.hit — não interfere no XP nem no determinismo.
  const damageByKey=new Map(),damagingMoveNames=new Set();
  const damageEntry=(key,side)=>{let entry=damageByKey.get(key);if(!entry){entry={side,dealt:0,taken:0,hits:0};damageByKey.set(key,entry);}return entry;};
  const items=new Map(),lastHeal=new Map();
  const pendingDamageChanges=[];
  for(const team of b.teams)for(const actor of team.mons){
    const key=actor.rkKey,level=team.side===0?levels[key]||5:opponentLevel;
    const cpuSave={growth:{pokemon:{[key]:{xp:xpAt(level)}},specialMoves:{},inherited:{}},team:{moves:{}}};
    const moves=team.side===0?selected[key]?.map(engine.moveObj).filter(Boolean):selectedMoves(cpuSave,engine.INFO[key]).map(engine.moveObj).filter(Boolean);
    if(team.side===0&&!moves?.length)throw Error(`Nenhum golpe aprendido para ${key}.`);
    // IV/nature entram no spec do ator: o megaEvolve recalcula `st` via e7a
    // com os traits (o engine preserva traits sem eles — default IV 31 e
    // nature neutra — então o lado 1 e saves sem traits não mudam nada).
    // O gate `side===0` evita que um oponente da mesma espécie herde os
    // traits do jogador (o mapa é por chave de espécie, não por indivíduo).
    const trait=team.side===0?traits[key]:null;
    actor.megaEvolve({...actor.spec,level,moves:moves||actor.moves,item:undefined,rkItem:undefined,...(trait?{ivs:trait.ivs,nature:trait.nature,mintNature:trait.mintNature}:{})});actor.mega=false;
    if(team.side===0&&held[key])items.set(actor,held[key]);
  }
  const sfx=b.sfx.bind(b);b.sfx=(id,...args)=>{if(b.pulseEvolving&&typeof id==='string'&&id.startsWith('mega_'))return;return sfx(id,...args);};
  const text=b.text.bind(b);b.text=(x,y,message,options)=>{
    if(b.pulseEvolving&&typeof message==='string')message=message.replace(/^WHAT\? (.+) IS EVOLVING!$/,'$1 ESTÁ EVOLUINDO!').replace(/^(.+) EVOLVED INTO (.+)!$/,'$1 EVOLUIU PARA $2!');
    return text(x,y,message,options);
  };
  const hit=b.hit;
  if(typeof hit==='function')b.hit=(attacker,target,move,...args)=>{
    const oldHp=target?.hp,battleText=b.text;let critical=false,result;
    b.text=(x,y,message,options)=>{
      if(typeof message==='string'&&/^CRITICAL!?$/i.test(message))critical=true;
      return battleText(x,y,message,options);
    };
    try{result=hit(attacker,target,move,...args);}finally{b.text=battleText;}
    const lostHp=Number.isFinite(oldHp)&&Number.isFinite(target?.hp)?Math.max(0,oldHp-target.hp):0;
    if(lostHp>0&&attacker?.side!==target?.side){
      if(attacker?.rkKey){const dealt=damageEntry(attacker.rkKey,attacker.side);dealt.dealt+=lostHp;dealt.hits++;if(move?.name)damagingMoveNames.add(move.name);}
      if(target?.rkKey)damageEntry(target.rkKey,target.side).taken+=lostHp;
      const effectiveness=move?.type?b.typeEff(move.type,target.showTypes||target.types||[]):1;
      const attackAmount=critical||effectiveness>1?4:effectiveness===0?0:effectiveness<1?1:2;
      const rewards=[];
      if(attacker?.side===0)rewards.push({actor:attacker,role:'dealt',amount:attackAmount});
      if(target?.side===0)rewards.push({actor:target,role:'taken',amount:.5});
      for(const {actor,role,amount} of rewards){
        if(!amount)continue;
        const reward=onDamageXP({key:actor.rkKey,amount,role,damage:lostHp,move:move?.name,critical,effectiveness});
        if(!reward?.ok)continue;
        hitXpTotal+=amount;pendingDamageChanges.push(...(reward.changes||[]));
        const shown=String(amount).replace('.',',');
        b.text(actor.x,actor.y-actor.bodyH-35,`+${shown} XP ${role==='dealt'?'GOLPE':'DANO'}`,{kind:'status',color:'#a5ede0',life:55});
        onEvent({kind:'hit-xp',total:amount,key:actor.rkKey,role,critical,effectiveness});
      }
    }
    return result;
  };
  const canEvolve=()=>{const actor=b.fighters[0];return !!(actor&&!actor.hidden&&!actor.fainted&&!b.cinematic&&preview(actor.rkKey));};
  // Auto-evolução imediata, sem prompt e sem botão: ao cruzar o nível de
  // evolução com XP de golpe ou de nocaute, a evolução entra na fila e a
  // cinemática do engine dispara na próxima oportunidade com o Pokémon
  // ativo em campo. Banco/desmaiado: a cinemática espera ele entrar em
  // campo; se a batalha acabar antes, a evolução é aplicada direto no
  // save (sem cinemática) para o Pokémon não ficar travado pré-evoluído.
  const evolutionQueue=[];
  const queueEvolution=(key,level)=>{
    const edge=EVOLUTIONS[key];if(!edge||level<edge[1])return false;
    if(evolutionQueue.some(entry=>entry.key===key))return false;
    if(!preview(key))return false;
    evolutionQueue.push({key,level});return true;
  };
  const applyGrowthChanges=changes=>{
    for(const change of changes||[]){
      for(const actor of b.teams[0].mons)if(actor.rkKey===change.key)applyEarnedLevel(actor,change.to);
      const edge=EVOLUTIONS[change.key];
      if(edge&&change.from<edge[1]&&change.to>=edge[1]&&b.teams[0].mons.some(actor=>actor.rkKey===change.key))queueEvolution(change.key,edge[1]);
    }
  };
  const tryQueuedEvolutions=()=>{
    if(b.phase!=='fight'||b.cinematic||b.done)return;
    const actor=b.fighters[0];if(!actor||actor.fainted)return;
    const index=evolutionQueue.findIndex(entry=>entry.key===actor.rkKey);
    if(index<0)return;
    if(tryEvolve()!=='retry')evolutionQueue.splice(index,1);
  };
  const flushEvolutions=()=>{
    for(const entry of evolutionQueue.splice(0)){
      if(pending&&pending.oldKey===entry.key)continue;
      const plan=preview(entry.key);if(!plan)continue;
      onEvolve(entry.key,plan.target);onEvent({kind:'evolved',from:entry.key,target:plan.target});
    }
  };
  const tryEvolve=()=>{
    const actor=b.fighters[0];if(!actor||actor.fainted)return 'abort';
    const plan=preview(actor.rkKey);if(!plan)return 'abort';
    if(actor.action||b.teams[0].ctl)return 'retry';
    const oldKey=actor.rkKey,cooldowns={...actor.lastUsed};
    if(!engine.pulseEvolve(b,actor,plan.target,plan.moves))return 'retry';
    // Reuse the engine cinematic and HP ratio, with learned moves and no cooldown reset.
    const target=actor.spec.evolveTo;b.speciesTable[target]={...b.speciesTable[target],level:actor.level,moves:plan.moves.map(engine.moveObj).filter(Boolean)};
    pending={actor,plan,oldKey,cooldowns,startedTick:b.tick};onEvent({kind:'evolution',from:oldKey,target:plan.target});
    return 'done';
  };
  const iconEffect=(actor,item)=>{
    const image=icons[item];
    b.text(actor.x,actor.y-actor.bodyH-35,ITEMS[item].name,{kind:'status',color:'#a5ede0',life:70});
    if(image)b.visual({owner:actor,layer:'top',life:80,draw(ctx,_time,age){
      ctx.save();ctx.globalAlpha=Math.min(1,age/7,(80-age)/18);const y=actor.y-actor.bodyH-55-age*.12;
      ctx.fillStyle='#132d3a';ctx.beginPath();ctx.arc(actor.x,y,14,0,Math.PI*2);ctx.fill();ctx.imageSmoothingEnabled=false;ctx.drawImage(image,actor.x-11,y-11,22,22);ctx.restore();
    }});
    onEvent({kind:'item',item,key:actor.rkKey});
  };
  return {
    canEvolve,
    requestEvolution(){if(!canEvolve())return false;wanted=true;return true;},
    // Compatibilidade: battle.js ainda consulta estes dois; não há mais
    // prompt nem cancelamento — a evolução é automática e imediata.
    cancelAutoEvolution(){return false;},
    evolutionPrompt(){return null;},
    queuedEvolutions(){return evolutionQueue.map(entry=>({...entry}));},
    koXpTotal(){return koXpTotal;},
    hitXpTotal(){return hitXpTotal;},
    damageReport(){return {entries:[...damageByKey.entries()].map(([key,stats])=>({key,...stats})),damagingMoves:[...damagingMoveNames]};},
    before(){
      for(const team of b.teams)for(const actor of team.mons){
        if(actor.pulseTeleport!==undefined&&!actor.action){const to=actor.pulseTeleport;if(engine.pulseSwitch(b,actor,to))delete actor.pulseTeleport;}
        if(actor.ai){if(actor.moves.every(m=>!m.power)){actor.ai.jabReady=Infinity;actor.ai.pulseNoJab=true;}else if(actor.ai.pulseNoJab){actor.ai.jabReady=b.tick+60;delete actor.ai.pulseNoJab;}}
      }
      if(b.phase==='fight'&&!b.cinematic&&!b.done){const actor=b.fighters[1],opponent=b.fighters[0];if(actor?.ai&&!actor.action&&!actor.fainted&&!actor.hidden&&b.tick%36===0){const move=planCPU(actor,opponent,engine.moveStatus(b,1),b.teams[1].mons);if(move)actor.ai.plan=actor.moves.find(m=>m.name===move);}}

      tryQueuedEvolutions();
      if(!wanted||b.phase!=='fight'||b.cinematic)return;
      if(tryEvolve()!=='retry')wanted=false;
    },
    after(){
      if(pendingDamageChanges.length)applyGrowthChanges(pendingDamageChanges.splice(0));

      for(const team of b.teams)for(const actor of team.mons)if(actor.pulseTransform&&b.fighters[actor.side]!==actor){
        const original=actor.pulseTransform,hp=actor.hp;delete actor.pulseTransform;actor.megaEvolve(original.spec);actor.maxHp=original.maxHp;actor.hp=hp;actor.hpShown=hp;actor.hpChip=hp;actor.mega=false;actor.stages=original.stages;
      }

      if(pending&&!b.pulseEvolving){
        const {actor,plan,oldKey,cooldowns,startedTick}=pending;pending=null;
        if(actor.rkKey===plan.target&&!actor.fainted){actor.lastUsed=Object.fromEntries(Object.entries(cooldowns).map(([name,at])=>[name,at<0?at:at+b.tick-startedTick]));onEvolve(oldKey,plan.target);onEvent({kind:'evolved',from:oldKey,target:plan.target});}
      }
      if(b.fighters[0]?.rkKey)participants.add(b.fighters[0].rkKey);
      for(const foe of b.teams[1].mons){
        if(!foe||countedKO.has(foe)||(!foe.fainted&&foe.hp>0))continue;
        countedKO.add(foe);
        const result=onKnockout({foeKey:foe.rkKey,foeLevel:foe.level||opponentLevel,participants:[...participants],killer:b.fighters[0]?.rkKey||null});
        if(!result?.ok)continue;
        koXpTotal+=result.total||0;
        const actor=b.fighters[0];
        if(actor&&!actor.fainted)b.text(actor.x,actor.y-actor.bodyH-35,`+${result.total} XP`,{kind:'status',color:'#f9e0a1',life:70});
        onEvent({kind:'ko-xp',total:result.total,changes:result.changes});
        applyGrowthChanges(result.changes);
      }
      if(b.done)flushEvolutions();
      if(b.phase!=='fight'||b.cinematic||b.done)return;
      for(const actor of b.fighters){
        const item=items.get(actor);if(!item||actor.hidden||actor.fainted)continue;
        const ratio=actor.hp/actor.maxHp;
        const heal=item==='oranberry'&&ratio<=.5?90:item==='sitrusberry'&&ratio<=.5?Math.floor(actor.maxHp/4):item==='leftovers'&&actor.hp<actor.maxHp&&b.tick-(lastHeal.get(actor)||0)>=360?Math.max(1,Math.floor(actor.maxHp/16)):0;
        const cure=item==='lumberry'&&(actor.status||actor.frozen>0||actor.confusedT>0)||item==='cheriberry'&&actor.status==='par'||item==='pechaberry'&&actor.status==='psn'||item==='chestoberry'&&actor.status==='slp';
        if(!heal&&!cure)continue;
        if(item!=='leftovers'){
          items.delete(actor);
          if(!onConsume({mon:actor.rkKey,item}))continue;
        }else lastHeal.set(actor,b.tick);
        if(heal){actor.hp=Math.min(actor.maxHp,actor.hp+heal);actor.hpShown=actor.hp;actor.hpChip=actor.hp;}
        if(cure){actor.status=null;actor.statusT=0;actor.frozen=0;actor.toxic=false;actor.toxicN=0;actor.sleepT=0;actor.rkStDmg=0;if(item==='lumberry')actor.confusedT=0;}
        iconEffect(actor,item);
      }
    },
  };
}
