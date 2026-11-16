"""Apply narrow additive module hooks without regenerating Muse's UI/progression files."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def patch(path,old,new):
 p=root/path;s=p.read_text()
 if new in s:return
 if s.count(old)!=1:raise RuntimeError('Concurrent edit changed integration anchor: '+path)
 p.write_text(s.replace(old,new,1))
patch('public/custom/growth.js',"import {BASIC_MOVES,GROWTH_SPECIES} from './growth-data.js';","import {BASIC_MOVES,GROWTH_SPECIES} from './growth-data.js';\nimport {EXPANSION_SPECIES} from './expansion-data.js';")
patch('public/custom/growth.js','for(const entry of GROWTH_SPECIES){','for(const entry of [...GROWTH_SPECIES,...EXPANSION_SPECIES]){')
patch('public/custom/growth.js','base:entry.stats,moves:[],mega:undefined','base:entry.stats,moves:species[entry.key]?.moves||[],mega:undefined')
# Expanded entries carry the complete legal pool; don't depend on the old engine's sourceEntries.
patch('public/custom/growth.js','const expanded=[...spec.moves];','const expanded=[...spec.moves];')
patch('public/pulse/learnsets.js','export const LEARNSETS=',"import {EXPANSION_LEARNSETS} from './expansion-learnsets.js';\nexport const LEARNSETS=")
p=root/'public/pulse/learnsets.js';s=p.read_text()
if 'Object.assign(LEARNSETS,EXPANSION_LEARNSETS)' not in s:p.write_text(s+'\nObject.assign(LEARNSETS,EXPANSION_LEARNSETS);\n')
patch('public/pulse/growth.js',"import {KANTO_LEVEL_EVOLUTIONS} from './kanto.js';","import {KANTO_LEVEL_EVOLUTIONS} from './kanto.js';\nimport {NATIONAL_LEVEL_EVOLUTIONS,NATIONAL_STONE_EVOLUTIONS} from './expansion-rules.js';")
patch('public/pulse/growth.js','Object.freeze({...KANTO_LEVEL_EVOLUTIONS,','Object.freeze({...NATIONAL_LEVEL_EVOLUTIONS,...KANTO_LEVEL_EVOLUTIONS,')
patch('public/pulse/growth.js',"export const STONE_EVOLUTIONS=Object.freeze({vulpix:","export const STONE_EVOLUTIONS=Object.freeze({...NATIONAL_STONE_EVOLUTIONS,vulpix:")
patch('public/pulse/banners.js',"import {KANTO_KEYS} from './kanto.js';","import {KANTO_KEYS} from './kanto.js';\nimport {NATIONAL_BASE_KEYS} from './expansion-rules.js';")
patch('public/pulse/banners.js','export const isSummonable=key=>BASE_FORM_KEYS.has(key)','export const isSummonable=key=>NATIONAL_BASE_KEYS.has(key)||BASE_FORM_KEYS.has(key)')
patch('public/pulse/banners.js',"export const SUMMON_BANNERS=Object.freeze([","export const SUMMON_BANNERS=Object.freeze([\n {id:'national',name:'Horizontes Pokémon',description:'Parceiros de todas as regiões disponíveis. Somente formas base e espécies de estágio único.',types:null,national:true},")
patch('public/pulse/banners.js',"&&(!banner.kanto||KANTO_KEYS.includes(m.key))","&&(!banner.national||NATIONAL_BASE_KEYS.has(m.key))&&(!banner.kanto||KANTO_KEYS.includes(m.key))")
patch('public/pulse/progression.js',"import {LEARNSETS} from './learnsets.js';","import {LEARNSETS} from './learnsets.js';\nimport {NATIONAL_RARITIES} from './expansion-rules.js';")
patch('public/pulse/progression.js',"function acquisitionRarity(mon){","function acquisitionRarity(mon){\n if(NATIONAL_RARITIES[mon.key])return NATIONAL_RARITIES[mon.key];")
patch('public/pulse/progression.js',"!['battle','night'].includes(k)","!SUMMON_BANNERS.some(b=>b.id===k&&k!=='route')")
# Existing banner selectors are data-driven, so use a fallback hero without changing UI layout.
patch('public/pulse/app.js',"const key={route:'bulbasaur',battle:'lucario',night:'marshadow'}[selectedBanner];","const key={national:'bulbasaur',route:'bulbasaur',battle:'lucario',night:'marshadow'}[selectedBanner]||'bulbasaur';")
print('Additive expansion hooks installed')

patch('public/engine.bundle.js','sourceEntries:N7a,hit:Ng,applyInput:fxe});','sourceEntries:N7a,hit:Ng,applyInput:fxe,applyAbility:yq0});')
patch('public/custom/growth.js','sourceEntries,hit,applyInput})','sourceEntries,hit,applyInput,applyAbility})')
