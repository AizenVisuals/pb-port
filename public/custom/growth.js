import {BASIC_MOVES,GROWTH_SPECIES} from './growth-data.js';
export function installGrowth({species,catalog,ranked,roster,entries,faces,getMove,wrapMove,sourceEntries}) {
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
    wrapMove(move);return move;
  });
  species.pulseBasics={moves:basics};
  for(const entry of GROWTH_SPECIES){
    const template=species[entry.template];if(!template)throw Error('Missing growth template '+entry.template);
    species[entry.key]={...template,dex:entry.dex,name:entry.name.toUpperCase(),types:entry.types,base:entry.stats,moves:[],mega:undefined,megaForm:false,bond:undefined,evolveTo:undefined,flies:false,glide:false,levitate:false,hover:0,radius:10,bodyH:24,scale:1};
    catalog[entry.key]=entry;ranked[entry.key]=entry;
    if(!roster.includes(entry.key))roster.push(entry.key);
    if(!entries.some(x=>x.key===entry.key))entries.push(entry);
    faces[entry.dex]=['Normal'];
  }
  for(const entry of sourceEntries)if(species[entry.key]){catalog[entry.key]=entry;ranked[entry.key]=entry;}
  for(const key of ['bulbasaur','charmander','squirtle'])if(species[key])Object.assign(species[key],{flies:false,glide:false,levitate:false,hover:0});
  // The downloaded catalog already contains the legal PB implementations shared across species.
  for(const entry of Object.values(catalog)){
    const spec=species[entry.key];if(!spec)continue;
    const expanded=[...spec.moves];
    for(const def of entry.pool){const move=getMove(def.id);if(move&&!expanded.some(m=>m.name===move.name))expanded.push(move);}
    spec.moves=expanded;
  }
}
