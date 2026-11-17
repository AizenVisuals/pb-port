import {BASIC_MOVES,GROWTH_SPECIES} from './growth-data.js';
import {EXPANSION_SPECIES} from './expansion-data.js';
export function installGrowth({species,catalog,ranked,roster,entries,faces,getMove,wrapMove,sourceEntries,hit,applyInput,applyAbility}) {
  const nativeMoves=new Map(sourceEntries.flatMap(e=>e.pool).map(m=>[m.id,getMove(m.id)]).filter(([,m])=>m));
  const abilityTemplates=new Map(Object.values(species).filter(s=>s.ability?.name).map(s=>[s.ability.name,s.ability]));
  const basics=BASIC_MOVES.map(def=>{
    let move;
    if(def.source){const original=getMove(def.source);move={...original,name:def.name,power:def.power,type:def.type,cooldown:def.cd,run:original.rkOrig||original.run};delete move.rkSafe;delete move.rkOrig;}
    else move={name:def.name,type:def.type,cat:'status',power:0,cooldown:def.cd,range:[0,500],run:function*(b,actor,opponent){
      const target=def.self?actor:opponent;if(!target||target.fainted)return;
      target.stages||={};target.stages[def.stat]=Math.max(-6,Math.min(6,(target.stages[def.stat]||0)+def.amount));
      b.text(target.x,target.y-target.bodyH-18,`${def.stat.toUpperCase()} ${def.amount>0?'+':''}${def.amount}`,{kind:'status',color:'#a5ede0',life:70});
      b.sfx(def.self?'twinkle':'cry_'+actor.rkKey,.45,actor.x,1.1);
      for(let i=0;i<20;i++)yield;
    }};
    if(def.name==='Scratch')move={name:'Scratch',type:'normal',cat:'phys',power:40,cooldown:150,range:[0,35],run:function*(b,actor,target){
      if(!target||target.hidden||target.fainted)return;actor.face(Math.atan2(target.y-actor.y,target.x-actor.x));actor.play('Attack');for(let i=0;i<8;i++)yield;
      if(Math.hypot(actor.x-target.x,actor.y-target.y)>35+target.radius)return;
      hit(b,actor,target,this,{frac:1,kb:1.2,kbAng:actor.ang,hitstop:4,shake:.15,punch:.02,fx:'normal'});
      const x=target.x,y=target.y-target.bodyH*.5;b.visual({owner:actor,layer:'top',life:12,draw(ctx,_time,age){ctx.save();ctx.globalAlpha=1-age/12;ctx.strokeStyle='#fff3cc';ctx.lineWidth=2;for(let n=-1;n<=1;n++){ctx.beginPath();ctx.moveTo(x-9+n*5,y-8);ctx.lineTo(x+2+n*5,y+7);ctx.stroke();}ctx.restore();}});for(let i=0;i<12;i++)yield;
    }};
    if(def.name==='Ember')move={name:'Ember',type:'fire',cat:'spec',power:40,cooldown:150,range:[20,130],run:function*(b,actor,target){
      if(!target||target.fainted)return;
      actor.face(Math.atan2(target.y-actor.y,target.x-actor.x));actor.play('Shoot');
      for(let i=0;i<10;i++)yield;
      const origin={x:actor.x,y:actor.y-actor.bodyH*.5},aim={x:target.x,y:target.y-target.bodyH*.5};
      const angle=Math.atan2(aim.y-origin.y,aim.x-origin.x),speed=4,life=Math.min(50,Math.ceil(Math.hypot(aim.x-origin.x,aim.y-origin.y)/speed)+8);
      let x=origin.x,y=origin.y,alive=true;
      b.visual({owner:actor,layer:'top',life:life+4,draw(ctx,_time,age){if(!alive)return;ctx.save();ctx.translate(x,y);ctx.fillStyle='#b83a21';ctx.fillRect(-4,-4,8,8);ctx.fillStyle='#ff9642';ctx.fillRect(-2,-5,4,7);ctx.fillStyle='#ffe4a0';ctx.fillRect(-1,-2,3,3);ctx.restore();}});
      b.sfx('flame_start',.35,actor.x,1.5);
      for(let t=0;t<life;t++){x+=Math.cos(angle)*speed;y+=Math.sin(angle)*speed;
        if(!target.hidden&&!target.fainted&&Math.hypot(x-target.x,y-(target.y-target.bodyH*.5))<target.radius+7){
          const before=target.hp;hit(b,actor,target,this,{frac:1,kb:1,kbAng:angle,hitstop:3,shake:.1,punch:.02,fx:'fire'});if(target.hp<before&&!target.status&&!target.spec.types.includes('fire')&&b.rng.chance(.1)){target.status='brn';target.statusT=0;b.text(target.x,target.y-target.bodyH-16,'QUEIMADURA',{kind:'status',color:'#ff9642',life:60});}alive=false;break;
        }yield;
      }alive=false;for(let i=0;i<8;i++)yield;
    }};
    if(def.name==='Teleport')move={name:def.name,type:'psychic',cat:'status',power:0,cooldown:600,range:[0,500],run:function*(b,actor){
      const team=b.teams[actor.side],reserve=team.mons.find(m=>m!==actor&&!m.fainted);
      if(!reserve){b.text(actor.x,actor.y-30,'FALHOU',{kind:'status',life:40});return;}
      actor.pulseTeleport=team.mons.indexOf(reserve);for(let i=0;i<20;i++)yield;
    }};
    if(def.name==='Transform')move={name:def.name,type:'normal',cat:'status',power:0,cooldown:600,range:[0,500],run:function*(b,actor,target){
      if(!target||target.fainted||target.hidden||target.pulseTransform||actor.pulseTransform)return;
      actor.pulseTransform={spec:actor.spec,maxHp:actor.maxHp,stages:{...actor.stages}};
      const hp=actor.hp,maxHp=actor.maxHp;actor.megaEvolve({...target.spec,base:{...target.spec.base,hp:actor.spec.base.hp},level:actor.level,moves:target.moves,item:undefined,rkItem:undefined});
      actor.hp=hp;actor.maxHp=maxHp;actor.hpShown=hp;actor.hpChip=hp;actor.mega=false;actor.stages={...target.stages};
      b.sfx('twinkle',.6,actor.x);b.text(actor.x,actor.y-35,'TRANSFORM',{kind:'status',life:60});for(let i=0;i<25;i++)yield;
    }};
    wrapMove(move);return move;
  });
  species.pulseBasics={moves:basics};
  for(const entry of [...GROWTH_SPECIES,...EXPANSION_SPECIES]){
    const template=species[entry.template];if(!template)throw Error('Missing growth template '+entry.template);
    species[entry.key]={color:template.color,weight:entry.weight,abilityName:entry.ability.toUpperCase(),ability:abilityTemplates.get(entry.ability.toUpperCase()),dex:entry.dex,name:entry.name.toUpperCase(),types:entry.types,base:entry.stats,moves:species[entry.key]?.moves||[],mega:undefined,megaForm:false,bond:undefined,evolveTo:undefined,flies:entry.types.includes('flying'),glide:false,levitate:entry.ability==='Levitate',hover:entry.ability==='Levitate'?4:0,radius:Math.max(4,Math.min(13,entry.idleH*.18)),bodyH:Math.max(8,Math.min(30,entry.idleH*.45)),scale:1};
    if(EXPANSION_SPECIES.some(m=>m.key===entry.key))applyAbility?.(species[entry.key],entry.ability);
    catalog[entry.key]=entry;ranked[entry.key]=entry;
    if(!roster.includes(entry.key))roster.push(entry.key);
    if(!entries.some(x=>x.key===entry.key))entries.push(entry);
    faces[entry.dex]=['Normal'];
  }
  for(const entry of sourceEntries)if(species[entry.key]){catalog[entry.key]=entry;ranked[entry.key]=entry;}
  // Ter tipo Voador não significa permanecer no ar durante a batalha.
  // Doduo é explicitamente terrestre na série e deve receber golpes de chão.
  for(const key of ['bulbasaur','charmander','squirtle','doduo'])if(species[key])Object.assign(species[key],{flies:false,glide:false,levitate:false,hover:0});
  // The downloaded catalog already contains the legal PB implementations shared across species.
  for(const entry of Object.values(catalog)){
    const spec=species[entry.key];if(!spec)continue;
    const expanded=[...spec.moves];
    for(const def of entry.pool){const move=nativeMoves.get(def.id)||getMove(def.id);if(move&&!expanded.some(m=>m.name===move.name))expanded.push(move);}
    spec.moves=expanded;
  }
}
