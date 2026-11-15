"""Build PULSE learnsets from PrismaDex's pinned PokeAPI data and PB move implementations."""
from pathlib import Path
import json,re,hashlib,xml.etree.ElementTree as ET,shutil
root=Path(__file__).resolve().parents[1];prisma=Path('/home/bloody/Documents/Pokémon/android/app/src/main/assets')
roster=json.loads((root/'public/roster.json').read_text());source=(root/'research/campaign/growth-stats-source.ts').read_text();moves=json.loads((prisma/'moves.json').read_text())
normalize=lambda s:re.sub('[^a-z0-9]','',s.lower())
basic=[dict(id='pulseBasics:Scratch',name='Scratch',type='normal',cat='phys',power=40,cd=150,reach='close',source='gibleAT:Tackle',adapted=True,desc='Arranha o adversário. Sem efeito adicional.'),dict(id='pulseBasics:Ember',name='Ember',type='fire',cat='spec',power=40,cd=150,reach='mid',source='typhlosion:Flamethrower',adapted=True,desc='Pequeno projétil de fogo. 10% de chance de queimadura após causar dano.'),*[dict(id='pulseBasics:'+name,name=name,type='normal' if name!='Withdraw' else 'water',cat='status',power=0,cd=420,reach='mid',stat=stat,amount=amount,self=own,desc=desc)for name,stat,amount,own,desc in [('Growl','atk',-1,False,'Reduz o Ataque do adversário em um estágio.'),('Leer','def',-1,False,'Reduz a Defesa do adversário em um estágio.'),('Tail Whip','def',-1,False,'Reduz a Defesa do adversário em um estágio.'),('Withdraw','def',1,True,'Aumenta a Defesa do usuário em um estágio.')]]]
basic.extend([
 dict(id='pulseBasics:Harden',name='Harden',type='normal',cat='status',power=0,cd=420,reach='self',stat='def',amount=1,self=True,desc='Aumenta a Defesa em um estágio.'),
 dict(id='pulseBasics:Teleport',name='Teleport',type='psychic',cat='status',power=0,cd=600,reach='self',desc='Recua para um parceiro disponível. Sem parceiro, falha.'),
 dict(id='pulseBasics:Transform',name='Transform',type='normal',cat='status',power=0,cd=600,reach='mid',desc='Copia a forma, tipos, atributos e golpes do alvo, preservando HP e nível. Reverte ao sair de campo.')
])
global_moves={}
for m in roster:
 for x in m['pool']:global_moves.setdefault(normalize(x['name']),x)
for x in basic:global_moves[normalize(x['name'])]=x
expansion={'ivysaur':('0002','venusaur'),'charmeleon':('0005','charizard'),'wartortle':('0008','blastoise'),'chikorita':('0152','venusaur'),'bayleef':('0153','venusaur'),'meganium':('0154','venusaur'),'cyndaquil':('0155','typhlosion'),'quilava':('0156','typhlosion'),'totodile':('0158','feraligatrD'),'croconaw':('0159','feraligatrD'),'feraligatr':('0160','feraligatrD')}
# Canonical Kanto roster expansion, enabled only after its full animation import succeeds.
kanto_report=root/'research/campaign/kanto-sprite-import.json'
if kanto_report.exists() and not json.loads(kanto_report.read_text())['failures']:
 expansion.update({k:tuple(v)for k,v in json.loads((root/'research/next-pass/kanto-expansion-plan.json').read_text()).items()})
anims=json.loads((root/'public/assets/sprites/anims.json').read_text());new=[]
for key,(dex,template)in expansion.items():
 block=source.split('\n\t'+key+': {',1)[1].split('\n\t},',1)[0];stats={k:int(v)for k,v in re.findall(r'(hp|atk|def|spa|spd|spe): (\d+)',block)};types=[s.lower()for s in re.findall(r'"([A-Za-z]+)"',re.search(r'types: \[(.*?)\]',block)[1])]
 xml=root/f'public/assets/sprites/{dex}/AnimData.xml'
 if xml.exists():
  tree=ET.parse(xml);nodes={x.findtext('Name'):x for x in tree.findall('.//Anim')}
  def resolve(name):
   n=nodes[name];return resolve(n.findtext('CopyOf'))if n.findtext('CopyOf')else n
  out={}
  for name in nodes:
   n=resolve(name);out[name]=dict(w=int(n.findtext('FrameWidth')),h=int(n.findtext('FrameHeight')),durations=[int(x.text)for x in n.findall('./Durations/Duration')],file=n.findtext('Name')+'-Anim.png',**{k:int(n.findtext(t))if n.findtext(t)else None for k,t in [('rush','RushFrame'),('hit','HitFrame'),('ret','ReturnFrame')]})
  for a,t in [('Shoot','Attack'),('SpAttack','Shoot'),('QuickStrike','Attack'),('RearUp','Charge'),('Roar','Rotate')]:out.setdefault(a,out.get(t,out['Idle']))
  anims[dex]={'shadowSize':int(tree.findtext('ShadowSize')),'anims':out}
 idle=anims[dex]['anims']['Idle']
 entry=dict(key=key,name=key.capitalize(),num=int(dex),gen=1 if int(dex)<152 else 2,dex=dex,types=types,mega=None,defaults=[],stats=stats,idleH=idle['h'],idleVis=26,weight=float(re.search(r'weightkg: ([\d.]+)',block)[1]),faces=['Normal'],ability=re.search(r'abilities: \{ 0: "(.*?)"',block)[1],abilityDesc='',icon={'file':f'assets/sprites/{dex}/'+idle['file'],'w':idle['w'],'h':idle['h']},pool=[],template=template)
 roster=[m for m in roster if m['key']!=key]+[entry];new.append(key)
rules={};records=[]
for mon in roster:
 path=prisma/f"learnsets/{mon.get('num',int(mon['dex'][:4]))}.json"
 if not path.exists():continue
 data=json.loads(path.read_text());preferred=next((g for g in [23,20,16,10,7,24]if any(v['game']==g and str(v['method'])in['1','level-up'] for x in data for v in x['versions'])),None)
 levels={};special=set()
 for x in data:
  name=normalize(moves.get(str(x['id']),{}).get('name',''));definition=global_moves.get(name)
  if not definition:continue
  lv=[v['level']for v in x['versions']if v['game']==preferred and str(v['method'])in['1','level-up']]
  if lv:levels[definition['id']]=max(1,min(lv))
  if any(v['game']==preferred and str(v['method'])in['4','machine'] for v in x['versions']):special.add(definition['id'])
 pool=list(mon['pool']);ids={x['id']for x in pool};names={normalize(x['name'])for x in pool}
 for definition in global_moves.values():
  if (definition['id']in levels or definition['id']in special)and normalize(definition['name'])not in names:pool.append(dict(definition));names.add(normalize(definition['name']))
 # Relate PB variants by canonical move name, never by a coincident numeric id.
 for move in pool:
  n=normalize(move['name']);canonical=global_moves.get(n)
  if canonical and canonical['id']in levels:levels[move['id']]=levels[canonical['id']]
  if canonical and canonical['id']in special:special.add(move['id'])
 legal=[x for x in pool if x['id']in levels or x['id']in special]
 if not legal:continue
 mon['pool']=pool
 early=[x for x in legal if levels.get(x['id'],999)<=5]
 initial=5 if early else min(levels.values(),default=5)
 rules[mon['key']]={'levelMoves':{x['id']:levels[x['id']]for x in pool if x['id']in levels},'specialMoves':[x['id']for x in legal if x['id']in special],'initialLevel':initial,'game':preferred}
 if mon['key']in new:
  mon['defaults']=[x['id']for x in early][:4]or[x['id']for x in legal][:4]
 records.append({'key':mon['key'],'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'game':preferred})
# Species definitions retain full pools; growth runtime alone restricts selected moves.
expanded=[m for m in roster if m['key']in new]
(root/'public/custom/growth-data.js').write_text('export const BASIC_MOVES='+json.dumps(basic)+';\nexport const GROWTH_SPECIES='+json.dumps(expanded)+';\n')
(root/'public/pulse/learnsets.js').write_text('export const LEARNSETS='+json.dumps(rules)+';\n')
(root/'public/roster.json').write_text(json.dumps(roster));(root/'public/assets/sprites/anims.json').write_text(json.dumps(anims))
items=json.loads((prisma/'items.json').read_text());assets=[]
for slug in ['oranberry','sitrusberry','lumberry','cheriberry','pechaberry','chestoberry','leftovers']:
 item=next(x for x in items.values()if x['slug']==slug);src=prisma/item['icon'];dst=root/f'public/pulse/assets/items/{slug}.png';dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,dst);assets.append({'item':slug,'source':str(src),'sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'upstream':item['source']})
(root/'research/campaign/growth-data-sources.json').write_text(json.dumps({'learnsets':'PrismaDex pinned PokeAPI 2bf639e5572812a67d2b94903fdcb9d095f5aeb2; level-up and TM/machine only, same selected version group; egg/tutor excluded; Scarlet-Violet preferred','records':records,'items':assets,'basicMoves':'PB behavior adaptations explicitly marked in definitions; Growl/Leer/Tail Whip/Withdraw implement canonical stat stages.','statsSource':'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/pokedex.ts','statsSha256':hashlib.sha256(source.encode()).hexdigest()},indent=2)+'\n')
print(json.dumps({'newSpecies':new,'learnsets':len(rules),'itemIcons':len(assets)}))
