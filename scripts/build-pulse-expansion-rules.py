"""Canonical acquisition and strictly level-only evolution rules for imported species."""
from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[1];p=Path('/home/bloody/Documents/Pokémon/android/app/src/main/assets')
roster=json.loads((root/'public/roster.json').read_text());byid={m['num']:m for m in roster if m['dex'].isdigit() and len(m['dex'])==4}
profiles=json.loads((p/'species-profiles.json').read_text())['profiles'];families=json.loads((p/'evolution-families.json').read_text())['chains']
base=set();evolutions={};stones={};special={};deferred=[];targets=set();rarities={}
added=set(json.loads((root/'research/expansion/import-report.json').read_text())['species'])
for chain in families:
 for n in chain['nodes']:
  if n['pokemonId'] in byid and n['stage']==0:base.add(byid[n['pokemonId']]['key'])
 for e in chain['edges']:
  targets.add(e['toId'])
  if e['fromId'] not in byid or e['toId'] not in byid:continue
  conditions=e.get('conditions',[])
  # No invented friendship, gender, time, held-item or branching shortcuts.
  if len(conditions)==1 and re.fullmatch(r'Level \d+',conditions[0].get('en','')):
   parent=byid[e['fromId']]['key'];target=byid[e['toId']]['key'];level=int(conditions[0]['en'].split()[-1])
   outgoing=[x for x in chain['edges'] if x['fromId']==e['fromId']]
   if len(outgoing)==1:evolutions[parent]=[target,level]
   else:deferred.append(e)
  else:
   condition=conditions[0].get('en','') if len(conditions)==1 else ''
   match=re.fullmatch(r'Use (Fire|Water|Thunder|Leaf|Moon) Stone',condition)
   if match:stones.setdefault(byid[e['fromId']]['key'],{})[match[1].lower()+'-stone']=byid[e['toId']]['key']
   else:deferred.append(e)
for num,m in byid.items():
 f=profiles.get(str(num),{})
 if f.get('isMythical'):rarities[m['key']]='SSS'
 elif f.get('isLegendary'):rarities[m['key']]='UR'
 elif m['key'] in base:
  bst=sum(m['stats'].values());rarities[m['key']]='SR' if bst>=450 else 'R' if bst>=320 else 'C'
# Species without a chain are stage-one originals, never arbitrary final evolutions.
known={n['pokemonId'] for c in families for n in c['nodes']}
for num,m in byid.items():
 if num not in known and num not in targets:base.add(m['key'])
rarities={key:value for key,value in rarities.items() if key in added}
for edge in deferred:
 if edge['fromId'] not in byid or edge['toId'] not in byid:continue
 parent=byid[edge['fromId']]['key'];target=byid[edge['toId']]['key']
 conditions=edge.get('conditions') or []
 label=' · '.join(c.get('pt') or c.get('en') or 'Condição especial' for c in conditions)
 special.setdefault(parent,[]).append({'target':target,'condition':label})
# Algumas formas regionais intermediárias não existem no pacote de sprites.
# Nesses casos, a espécie presente precisa ter uma obtenção direta em vez de
# ficar inacessível por uma cadeia cujo pai não está no jogo.
reachable=set(base)
while True:
 before=len(reachable)
 for parent,(target,_) in evolutions.items():
  if parent in reachable:reachable.add(target)
 for parent,routes in stones.items():
  if parent in reachable:reachable.update(routes.values())
 for parent,routes in special.items():
  if parent in reachable:reachable.update(route['target'] for route in routes)
 if len(reachable)==before:break
base.update(added-reachable)
(root/'public/pulse/expansion-rules.js').write_text('export const NATIONAL_BASE_KEYS=new Set('+json.dumps(sorted(base))+');\nexport const NATIONAL_LEVEL_EVOLUTIONS='+json.dumps(evolutions)+';\nexport const NATIONAL_STONE_EVOLUTIONS='+json.dumps(stones)+';\nexport const NATIONAL_SPECIAL_EVOLUTIONS='+json.dumps(special,ensure_ascii=False)+';\nexport const NATIONAL_RARITIES='+json.dumps(rarities)+';\n')
(root/'research/expansion/evolution-review.json').write_text(json.dumps(dict(levelOnly=len(evolutions),deferred=deferred,note='Only unconditional non-branching level evolutions imported; other canonical methods explicitly deferred, never replaced by invented level rules.'),indent=2))
print(len(base),'base species;',len(evolutions),'level evolutions')
