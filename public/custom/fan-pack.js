import{FAN_PACK}from'./fan-pack-data.js';
/** PB-only pack. Every move keeps its canonical name, type, power and original behavior. */
export function installFanPack({species,catalog,ranked,roster,entries,faces,getMove,wrapMove}){
 const abilities=new Map(Object.values(species).filter(s=>s.ability?.name).map(s=>[s.ability.name,s.ability]));
 for(const entry of FAN_PACK){
  if(species[entry.key])continue;
  const moves=entry.pool.map(def=>{const original=getMove(def.source);if(!original)throw Error('Missing fan-pack move '+def.source);const move={...original,cooldown:def.cd,run:original.rkOrig||original.run};delete move.rkSafe;delete move.rkOrig;wrapMove(move);return move;});
  species[entry.key]={dex:entry.dex,name:entry.name.toUpperCase(),types:entry.types,base:entry.stats,weight:entry.weight,color:entry.types[0]==='fire'?'#c33132':entry.types[0]==='grass'?'#39866a':entry.types[0]==='water'?'#468ac4':'#e8d9ec',abilityName:entry.ability.toUpperCase(),rkAbility:entry.ability,ability:abilities.get(entry.ability.toUpperCase()),flies:entry.types.includes('flying'),levitate:entry.ability==='Levitate',radius:12,bodyH:28,scale:.9,moves};
  catalog[entry.key]=entry;ranked[entry.key]=entry;roster.push(entry.key);entries.push(entry);faces[entry.dex]=['Normal'];
 }
 const absol=species.absolNM;if(absol){
  absol.mega='absolMegaZ';species.absolMegaZ={...absol,dex:'fan_absolmegaz',name:'MEGA ABSOL Z',types:['dark','ghost'],base:{hp:65,atk:154,def:60,spa:75,spd:60,spe:151},abilityName:'SHARPNESS',rkAbility:'Sharpness',mega:undefined,megaForm:true,weight:49,scale:1,radius:13,bodyH:30};
  for(const table of[catalog,ranked])if(table.absolNM)table.absolNM={...table.absolNM,mega:'absolMegaZ',megaAbility:'Sharpness',megaWeight:49,megaIdleH:64,megaIdleVis:56};
  const entry=entries.find(x=>x.key==='absolNM');if(entry)Object.assign(entry,{mega:'absolMegaZ',megaAbility:'Sharpness',megaWeight:49,megaIdleH:64,megaIdleVis:56});faces.fan_absolmegaz=['Normal'];
 }
}
