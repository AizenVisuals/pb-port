import {CAMPAIGN_SPECIES} from './starters-data.js';
/** Extend the PB registry, preserving its existing move implementations. */
export function installCampaignStarters({species,catalog,ranked,roster,entries,faces,getMove,wrapMove}){
 for(const entry of CAMPAIGN_SPECIES){
  if(species[entry.key])continue;
  const template=species[entry.template];if(!template)throw Error(`Missing PB template: ${entry.template}`);
  const moves=entry.defaults.map(id=>{const definition=entry.pool.find(m=>m.id===id);const move=getMove(definition.source||id);if(!move)throw Error(`Missing PB move: ${id}`);if(!definition.adapted)return move;const adapted={...move,name:definition.name,power:definition.power,type:definition.type,cooldown:definition.cd,run:move.rkOrig||move.run};delete adapted.rkSafe;delete adapted.rkOrig;wrapMove(adapted);return adapted;});
  species[entry.key]={...template,dex:entry.dex,name:entry.name.toUpperCase(),types:[...entry.types],base:{...entry.stats},abilityName:entry.ability.toUpperCase(),mega:undefined,megaForm:false,bond:undefined,radius:10,bodyH:20,scale:1,moves};
  catalog[entry.key]=entry;ranked[entry.key]=entry;roster.push(entry.key);entries.push(entry);faces[entry.dex]=['Normal'];
 }
}
