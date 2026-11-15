from pathlib import Path
import json,re,xml.etree.ElementTree as ET,hashlib
root=Path(__file__).resolve().parents[1]
source=(root/'research/campaign/starter-source.txt').read_text();roster=json.loads((root/'public/roster.json').read_text());anims=json.loads((root/'public/assets/sprites/anims.json').read_text());entries=[]
sets={'bulbasaur':('0001','venusaur',['Tackle','Vine Whip','Razor Leaf','Sleep Powder']),'charmander':('0004','charizard',['Slash','Dragon Breath','Flamethrower','Protect']),'squirtle':('0007','blastoise',['Water Gun','Water Pulse','Bite','Protect'])}
sets.update({'pidgey':('0016','pidgeot',['Tackle','Quick Attack','Wing Attack','Protect']),'rattata':('0019','persian',['Tackle','Quick Attack','Bite','Protect']),'caterpie':('0010','heracross',['Tackle']),'weedle':('0013','heracross',['Poison Sting']),'zubat':('0041','crobat',['Wing Attack','Bite','Supersonic','Protect']),'ekans':('0023','arbok',['Bite','Poison Fang','Toxic','Protect']),'koffing':('0109','weezingH',['Tackle','Sludge Bomb','Will-O-Wisp','Protect']),'geodude':('0074','golemAG',['Tackle','Rollout','Rock Slide','Protect']),'onix':('0095','steelixD',['Tackle','Rock Slide','Dragon Breath','Protect'])})
sets['ekans']=('0023','persian',sets['ekans'][2])
for key,(dex,template,names) in sets.items():
 block=source.split('\n\t'+key+': {',1)[1].split('\n\t},',1)[0];stats={k:int(v)for k,v in re.findall(r'(hp|atk|def|spa|spd|spe): (\d+)',block)};types=[s.lower() for s in re.findall(r'"([A-Za-z]+)"',re.search(r'types: \[(.*?)\]',block)[1])];ability=re.search(r'abilities: \{ 0: "(.*?)"',block)[1];weight=float(re.search(r'weightkg: ([\d.]+)',block)[1]);pool=[]
 for name in names:
  if name=='Poison Sting':
   move=dict(next(x for m in roster for x in m['pool']if x['name']=='Tackle'));move.update(id='weedle:Poison Sting',name='Poison Sting',type='poison',power=15,desc='Picada de Veneno com 30% de chance de envenenar. Movimento adaptado do Poison Jab do PB.',source='toxicroak:Poison Jab',adapted=True);pool.append(move)
  else:pool.append(dict(next(x for m in roster for x in m['pool']if x['name']==name)))
 tree=ET.parse(root/f'public/assets/sprites/{dex}/AnimData.xml');nodes={x.findtext('Name'):x for x in tree.findall('.//Anim')}
 def resolve(name):
  n=nodes[name];return resolve(n.findtext('CopyOf'))if n.findtext('CopyOf')else n
 out={}
 for name in nodes:
  n=resolve(name);out[name]={'w':int(n.findtext('FrameWidth')),'h':int(n.findtext('FrameHeight')),'durations':[int(x.text)for x in n.findall('./Durations/Duration')],'file':n.findtext('Name')+'-Anim.png',**{k:int(n.findtext(t))if n.findtext(t)else None for k,t in [('rush','RushFrame'),('hit','HitFrame'),('ret','ReturnFrame')]}}
 for alias,target in [('Shoot','Attack'),('SpAttack','Shoot'),('QuickStrike','Attack'),('RearUp','Charge'),('Roar','Rotate')]:
  if alias not in out:out[alias]=out.get(target,out['Idle'])
 anims[dex]={'shadowSize':int(tree.findtext('ShadowSize')),'anims':out}
 entry=dict(key=key,name=key.capitalize(),num=int(dex),gen=1,dex=dex,types=types,mega=None,defaults=[x['id']for x in pool],stats=stats,idleH=out['Idle']['h'],idleVis=26,weight=weight,faces=['Normal'],ability=ability,abilityDesc='',icon={'file':f'assets/sprites/{dex}/Idle-Anim.png','w':out['Idle']['w'],'h':out['Idle']['h']},pool=pool,template=template);entries.append(entry);roster=[m for m in roster if m['key']!=key]+[entry]
(root/'public/custom/starters-data.js').write_text('export const CAMPAIGN_SPECIES='+json.dumps(entries)+';\nexport const CAMPAIGN_STARTERS=CAMPAIGN_SPECIES.filter(m=>[1,4,7].includes(m.num));\n');(root/'public/roster.json').write_text(json.dumps(roster));(root/'public/assets/sprites/anims.json').write_text(json.dumps(anims));(root/'research/campaign/starter-data-sources.json').write_text(json.dumps({'statsSource':'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/pokedex.ts','sourceSha256':hashlib.sha256(source.encode()).hexdigest(),'movesSource':'Existing PB implementations; advanced compatible kits, not level-5 learnsets','note':'PokeAPI endpoint returned 403; no data taken from that endpoint.'},indent=2))
