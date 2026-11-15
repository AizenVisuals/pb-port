import {planCPU} from './tactical-ai.js';
import {EVOLUTIONS,ITEMS,selectedMoves,xpAt} from './growth.js';
export function evolutionAssets(keys){const result=new Set(keys);for(const key of result){const next=EVOLUTIONS[key]?.[0];if(next)result.add(next);}return [...result];}
export function configureGrowthBattle(b,engine,{levels={},opponentLevel=5,selected={},held={},onConsume=()=>true,onEvolve=()=>true,preview=()=>null,onEvent=()=>{},icons={}}={}){
  b.speciesTable={...b.speciesTable};
  let wanted=false,pending=null;
  const items=new Map(),lastHeal=new Map();
  for(const team of b.teams)for(const actor of team.mons){
    const key=actor.rkKey,level=team.side===0?levels[key]||5:opponentLevel;
    const cpuSave={growth:{pokemon:{[key]:{xp:xpAt(level)}},specialMoves:{},inherited:{}},team:{moves:{}}};
    const moves=team.side===0?selected[key]?.map(engine.moveObj).filter(Boolean):selectedMoves(cpuSave,engine.INFO[key]).map(engine.moveObj).filter(Boolean);
    if(team.side===0&&!moves?.length)throw Error(`Nenhum golpe aprendido para ${key}.`);
    actor.megaEvolve({...actor.spec,level,moves:moves||actor.moves,item:undefined,rkItem:undefined});actor.mega=false;
    if(team.side===0&&held[key])items.set(actor,held[key]);
  }
  const sfx=b.sfx.bind(b);b.sfx=(id,...args)=>{if(b.pulseEvolving&&typeof id==='string'&&id.startsWith('mega_'))return;return sfx(id,...args);};
  const text=b.text.bind(b);b.text=(x,y,message,options)=>{
    if(b.pulseEvolving&&typeof message==='string')message=message.replace(/^WHAT\? (.+) IS EVOLVING!$/,'$1 ESTÁ EVOLUINDO!').replace(/^(.+) EVOLVED INTO (.+)!$/,'$1 EVOLUIU PARA $2!');
    return text(x,y,message,options);
  };
  const canEvolve=()=>{const actor=b.fighters[0];return !!(actor&&!actor.hidden&&!actor.fainted&&!b.cinematic&&preview(actor.rkKey));};
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
    before(){
      for(const team of b.teams)for(const actor of team.mons){
        if(actor.pulseTeleport!==undefined&&!actor.action){const to=actor.pulseTeleport;if(engine.pulseSwitch(b,actor,to))delete actor.pulseTeleport;}
        if(actor.ai){if(actor.moves.every(m=>!m.power)){actor.ai.jabReady=Infinity;actor.ai.pulseNoJab=true;}else if(actor.ai.pulseNoJab){actor.ai.jabReady=b.tick+60;delete actor.ai.pulseNoJab;}}
      }
      if(b.phase==='fight'&&!b.cinematic&&!b.done){const actor=b.fighters[1],opponent=b.fighters[0];if(actor?.ai&&!actor.action&&!actor.fainted&&!actor.hidden&&b.tick%36===0){const move=planCPU(actor,opponent,engine.moveStatus(b,1),b.teams[1].mons);if(move)actor.ai.plan=actor.moves.find(m=>m.name===move);}}

      if(!wanted||b.phase!=='fight'||b.cinematic)return;
      const actor=b.fighters[0],plan=preview(actor.rkKey);if(!plan||actor.fainted){wanted=false;return;}
      if(actor.action||b.teams[0].ctl)return;
      const oldKey=actor.rkKey,cooldowns={...actor.lastUsed};
      if(engine.pulseEvolve(b,actor,plan.target,plan.moves)){
        // Reuse the engine cinematic and HP ratio, with learned moves and no cooldown reset.
        const target=actor.spec.evolveTo;b.speciesTable[target]={...b.speciesTable[target],level:actor.level,moves:plan.moves.map(engine.moveObj).filter(Boolean)};
        pending={actor,plan,oldKey,cooldowns,startedTick:b.tick};wanted=false;onEvent({kind:'evolution',from:oldKey,target:plan.target});
      }
    },
    after(){
      for(const team of b.teams)for(const actor of team.mons)if(actor.pulseTransform&&b.fighters[actor.side]!==actor){
        const original=actor.pulseTransform,hp=actor.hp;delete actor.pulseTransform;actor.megaEvolve(original.spec);actor.maxHp=original.maxHp;actor.hp=hp;actor.hpShown=hp;actor.hpChip=hp;actor.mega=false;actor.stages=original.stages;
      }

      if(pending&&!b.pulseEvolving){
        const {actor,plan,oldKey,cooldowns,startedTick}=pending;pending=null;
        if(actor.rkKey===plan.target&&!actor.fainted){actor.lastUsed=Object.fromEntries(Object.entries(cooldowns).map(([name,at])=>[name,at<0?at:at+b.tick-startedTick]));onEvolve(oldKey,plan.target);onEvent({kind:'evolved',from:oldKey,target:plan.target});}
      }
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
