import {readFile,writeFile} from 'node:fs/promises';
import {LEARNSETS} from '../public/pulse/learnsets.js';

const pokeApiFetch=globalThis.fetch.bind(globalThis);
const {engine}=await import('../server/engine.mjs');

const VERSION_GROUPS={
 16:'omega-ruby-alpha-sapphire',
 20:'sword-shield',
 23:'brilliant-diamond-shining-pearl',
};
const roster=JSON.parse(await readFile(new URL('../public/roster.json',import.meta.url)));
const asSlug=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const baseDex=dex=>Number.parseInt(String(dex).match(/^\d+/)?.[0]||'',10);
const formSlug=pokemon=>{
 const match=pokemon.name.match(/\((Alola|Galar|Hisui|Paldea|Eternal)\)/i);
 if(!match)return null;
 const base=pokemon.name.replace(/\s*\([^)]*\)\s*$/,'');
 const form=match[1].toLowerCase()==='eternal'?'eternal':match[1].toLowerCase();
 return `${asSlug(base)}-${form}`;
};
const apiCache=new Map();
async function getPokemon(slug){
 if(!apiCache.has(slug))apiCache.set(slug,(async()=>{
    const response=await pokeApiFetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(slug)}/`);
  if(response.status===404)return null;
  if(!response.ok)throw Error(`PokeAPI ${response.status} for ${slug}`);
  return response.json();
 })());
 return apiCache.get(slug);
}
const normalizeMove=name=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const poolMovesMissingRuntime=[];
const speciesWithoutReference=[];
const species=[];

for(const pokemon of roster){
 const learnset=LEARNSETS[pokemon.key];
 const pool=pokemon.pool||[];
 const localMoveNames=new Set(pool.map(move=>normalizeMove(move.name)));
 for(const move of pool)if(!engine.moveObj(move.id))poolMovesMissingRuntime.push({pokemon:pokemon.key,move:move.name,moveId:move.id});
 if(!learnset||!VERSION_GROUPS[learnset.game]){
  speciesWithoutReference.push({key:pokemon.key,name:pokemon.name,dex:pokemon.dex,reason:learnset?'unknown-version-group':'no-learnset'});
  species.push({key:pokemon.key,name:pokemon.name,dex:pokemon.dex,status:learnset?'unknown-version-group':'no-learnset',poolMoves:pool.map(move=>move.name)});
  continue;
 }
 const preferredSlug=formSlug(pokemon)||String(baseDex(pokemon.dex));
 let reference=await getPokemon(preferredSlug),referenceSlug=preferredSlug,formMatch=!!formSlug(pokemon);
 if(!reference&&formMatch){reference=await getPokemon(String(baseDex(pokemon.dex)));referenceSlug=String(baseDex(pokemon.dex));formMatch=false;}
 if(!reference){
  speciesWithoutReference.push({key:pokemon.key,name:pokemon.name,dex:pokemon.dex,reason:'pokeapi-species-not-found'});
  species.push({key:pokemon.key,name:pokemon.name,dex:pokemon.dex,status:'pokeapi-species-not-found',game:learnset.game,poolMoves:pool.map(move=>move.name)});
  continue;
 }
 const versionGroup=VERSION_GROUPS[learnset.game];
 const learnable=new Set();
 for(const entry of reference.moves){
  if(entry.version_group_details.some(detail=>detail.version_group.name===versionGroup&&!detail.move_learn_method.name.includes('form-change'))){
   learnable.add(normalizeMove(entry.move.name.replaceAll('-',' ')));
  }
 }
 if(!learnable.size){
  speciesWithoutReference.push({key:pokemon.key,name:pokemon.name,dex:pokemon.dex,reason:'no-pokeapi-moves-for-version-group',reference:reference.name,versionGroup});
  species.push({key:pokemon.key,name:pokemon.name,dex:pokemon.dex,status:'no-pokeapi-moves-for-version-group',game:learnset.game,versionGroup,reference:reference.name,referenceSlug,formMatch,poolMoves:pool.map(move=>move.name)});
  continue;
 }
 const missingFromPool=[...learnable].filter(move=>!localMoveNames.has(move)).sort();
 const poolNotInReference=[...localMoveNames].filter(move=>!learnable.has(move)).sort();
 species.push({key:pokemon.key,name:pokemon.name,dex:pokemon.dex,status:'compared',game:learnset.game,versionGroup,reference:reference.name,referenceSlug,formMatch,referenceMoveCount:learnable.size,poolMoveCount:localMoveNames.size,missingFromPool,poolNotInReference});
}

const compared=species.filter(item=>item.status==='compared');
const report={
 generatedAt:new Date().toISOString(),
 sources:{
  primary:'PokeAPI /pokemon/{slug}/moves filtered to the version-group id already stored in each local learnset.',
  learnsetGroups:VERSION_GROUPS,
  secondary:'The Pokémon Showdown learnsets are a manual review source for discrepancies; this script does not merge generations.',
  localRoster:'public/roster.json',
  localLearnsets:'public/pulse/learnsets.js',
 },
 interpretation:'missingFromPool means a move the PokeAPI species can learn in the selected version group but absent from this PULSE species pool. It is not a claim that every absent move must be added. poolNotInReference can represent custom, fan-made, or cross-generation moves.',
 summary:{rosterSpecies:roster.length,comparedSpecies:compared.length,speciesWithoutReference:speciesWithoutReference.length,missingMovePairs:compared.reduce((sum,item)=>sum+item.missingFromPool.length,0),poolMovePairsOutsideReference:compared.reduce((sum,item)=>sum+item.poolNotInReference.length,0),poolMovesMissingRuntimeDefinition:poolMovesMissingRuntime.length},
 speciesWithoutReference,
 poolMovesMissingRuntime,
 species,
};
const versionLabels={16:'ORAS',20:'Sword/Shield',23:'Brilliant Diamond/Shining Pearl'};
const markdown=[
 '# Auditoria de golpes ausentes do pool PULSE',
 '',
 `Gerada em ${report.generatedAt}.`,
 '',
 '## Resultado',
 '',
 `- Espécies no roster: ${report.summary.rosterSpecies}.`,
 `- Espécies comparadas na versão registrada: ${report.summary.comparedSpecies}.`,
 `- Espécies sem referência comparável: ${report.summary.speciesWithoutReference}.`,
 `- Combinações espécie/golpe aprendíveis na PokeAPI mas ausentes do pool: ${report.summary.missingMovePairs}.`,
 `- Combinações do pool fora do grupo PokeAPI selecionado: ${report.summary.poolMovePairsOutsideReference}.`,
 `- Golpes do roster sem definição de runtime: ${report.summary.poolMovesMissingRuntimeDefinition}.`,
 '',
 '“Ausente do pool” significa que a espécie pode aprender o golpe naquele grupo de versão segundo a PokeAPI, mas o golpe não está no pool local daquela espécie. É uma lista de candidatos para curadoria, não recomendação de adicionar tudo: inclui golpes de status, egg, tutor e máquina. O PULSE usa pools deliberadamente menores.',
 '',
 '## Fontes e método',
 '',
 '- PokeAPI `/pokemon/{slug}/moves`, filtrada pelo grupo já anotado em `public/pulse/learnsets.js`.',
 '- Pokémon Showdown pode ser usado como segunda revisão manual; não foi mesclado automaticamente para evitar misturar versões.',
 '- Mapeamento local: `16` = ORAS; `20` = Sword/Shield; `23` = Brilliant Diamond/Shining Pearl.',
 '- Formas regionais usam a entrada específica quando há slug correspondente. Fallback para forma base é marcado `formMatch: false` no JSON.',
 '- Pokémon fan-made e formas sem lista de golpes no grupo selecionado são reportados sem comparação, nunca como ausências confirmadas.',
 '',
 '## Espécies sem comparação',
 '',
 ...speciesWithoutReference.map(item=>`- **${item.name}** (\`${item.key}\`) — ${item.reason}${item.versionGroup?`; ${item.versionGroup}`:''}`),
 '',
 '## Lista completa por espécie',
 '',
];
for(const item of compared){
 if(!item.missingFromPool.length)continue;
 markdown.push(`### ${item.name} (${item.key})`, '', `Referência: ${versionLabels[item.game]} · ${item.reference}${item.formMatch?' · forma específica':' · forma base usada'}. Pool ${item.poolMoveCount}; PokeAPI ${item.referenceMoveCount}.`, '', item.missingFromPool.map(move=>`- ${move}`).join('\n'), '');
}
markdown.push('## Fora do grupo de versão', '');
for(const item of compared){
 if(!item.poolNotInReference.length)continue;
 markdown.push(`### ${item.name} (${item.key})`, '', item.poolNotInReference.map(move=>`- ${move}`).join('\n'), '');
}
await writeFile(new URL('../research/validation/pulse-move-coverage-2026-11-15.md',import.meta.url),markdown.join('\n'));
console.error(JSON.stringify(report.summary));
console.log(JSON.stringify(report,null,2));