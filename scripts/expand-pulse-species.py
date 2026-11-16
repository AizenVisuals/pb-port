"""Additive PULSE-only National Dex import; never replaces existing species/art.
Pinned PMDCollab artwork + PrismaDex canonical facts/learnsets + implemented PB moves.
"""
from pathlib import Path
import json,re,urllib.request,concurrent.futures,time,xml.etree.ElementTree as ET,hashlib,struct
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'research/expansion';OUT.mkdir(exist_ok=True)
PRISMA=Path('/home/bloody/Documents/Pokémon/android/app/src/main/assets')
REV='12c53e6a1b84378a3545fce42e6a9b27c64fd189'
BASE=f'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/{REV}/'
def fetch(src,dst):
 p=ROOT/dst
 if p.exists():return p.read_bytes()
 local=Path('/home/bloody/Projetos/SpriteCollab')/src
 if local.exists():
  import shutil
  p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(local,p);return p.read_bytes()
 for attempt in range(4):
  try:
   data=urllib.request.urlopen(BASE+src,timeout=35).read();p.parent.mkdir(parents=True,exist_ok=True)
   temp=p.with_suffix(p.suffix+'.download');temp.write_bytes(data);temp.replace(p);return data
  except Exception:
   if attempt==3:raise
   time.sleep(attempt+1)
tracker=json.loads(fetch('tracker.json','research/expansion/pinned-tracker.json'))
fetch('LICENSE.md','public/pulse/expansion/LICENSE.md');fetch('credit_names.txt','public/pulse/expansion/credit_names.txt')
roster=json.loads((ROOT/'public/roster.json').read_text())
prior_path=ROOT/'research/expansion/import-report.json'
prior=set(json.loads(prior_path.read_text()).get('species',[])) if prior_path.exists() else set()
have={m['num'] for m in roster if m['key'] not in prior}
templates=[m for m in roster if m['key'] in ['venusaur','charizard','blastoise','gengar','lucario','pikachu','salamence']]
facts=json.loads((PRISMA/'data.json').read_text());move_names=json.loads((PRISMA/'moves.json').read_text())
source=(ROOT/'research/campaign/growth-stats-source.ts').read_text()
norm=lambda s:re.sub('[^a-z0-9]','',s.lower())
# Preserve all current implementations, with the dedicated basic moves preferred.
pool={norm(m['name']):m for entry in roster for m in entry['pool']}
import subprocess
basics=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {BASIC_MOVES} from './public/custom/growth-data.js';console.log(JSON.stringify(BASIC_MOVES))"],cwd=ROOT))
for m in basics:pool[norm(m['name'])]=m
blocks={k:b for k,b in re.findall(r'\n\t([a-z0-9]+): \{(.*?)\n\t\},',source,re.S)}
entries=[];rules={};animdata={};skipped=[];credits=[]
def prepare(fact):
 num=fact['id'];dex=str(num).zfill(4);key=norm(fact['name']);track=tracker.get(dex,{})
 if num in have:return None
 if track.get('sprite_complete',0)<1 or 'Normal' not in track.get('portrait_files',{}):return {'skip':key,'reason':'No canonical sprite/portrait'}
 path=PRISMA/f'learnsets/{num}.json'
 if not path.exists():return {'skip':key,'reason':'No canonical learnset'}
 data=json.loads(path.read_text());games=[23,20,16,10,7,24,18,17,15,14,11,9,8,6,5,4,3,2,1]
 game=next((g for g in games if any(v['game']==g and str(v['method']) in ['1','level-up'] for m in data for v in m['versions'])),None)
 levels={};tms=set();legal={}
 for m in data:
  definition=pool.get(norm(move_names.get(str(m['id']),{}).get('name','')))
  if not definition:continue
  vs=[v for v in m['versions'] if v['game']==game]
  lv=[v['level'] for v in vs if str(v['method']) in ['1','level-up']]
  machine=any(str(v['method']) in ['4','machine'] for v in vs)
  if lv:levels[definition['id']]=max(1,min(lv))
  if machine:tms.add(definition['id'])
  if lv or machine:legal[definition['id']]=definition
 if not levels:return {'skip':key,'reason':'No implemented level-up move in selected game'}
 try:
  xml=fetch(f'sprite/{dex}/AnimData.xml',f'public/pulse/expansion/sprites/{dex}/AnimData.xml')
  tree=ET.fromstring(xml);nodes={n.findtext('Name'):n for n in tree.findall('.//Anim')}
  if not all(n in nodes for n in ['Idle','Walk','Attack','Hurt']):return {'skip':key,'reason':'Missing actual Idle/Walk/Attack/Hurt animation'}
  def resolve(name,visited=()):
   if name in visited:raise ValueError('Cyclic animation alias')
   n=nodes[name];return resolve(n.findtext('CopyOf'),(*visited,name)) if n.findtext('CopyOf') else n
  out={};jobs=set()
  # Full canonical action set, including all original offsets and shadows.
  for name in nodes:
   n=resolve(name);real=n.findtext('Name');w=int(n.findtext('FrameWidth'));h=int(n.findtext('FrameHeight'))
   durations=[int(d.text) for d in n.findall('./Durations/Duration')]
   out[name]=dict(w=w,h=h,durations=durations,file=real+'-Anim.png',rush=int(n.findtext('RushFrame')) if n.findtext('RushFrame') else None,hit=int(n.findtext('HitFrame')) if n.findtext('HitFrame') else None,ret=int(n.findtext('ReturnFrame')) if n.findtext('ReturnFrame') else None)
   for kind in ['Anim','Offsets','Shadow']:jobs.add((f'sprite/{dex}/{real}-{kind}.png',f'public/assets/sprites/{dex}/{real}-{kind}.png'))
  for a,t in [('Shoot','Attack'),('SpAttack','Shoot'),('QuickStrike','Attack'),('RearUp','Charge'),('Roar','Rotate')]:out.setdefault(a,out.get(t,out['Attack']))
  jobs.add((f'sprite/{dex}/credits.txt',f'public/assets/sprites/{dex}/credits.txt'))
  jobs.add((f'portrait/{dex}/Normal.png',f'public/assets/portraits/{dex}_Normal.png'))
  jobs.add((f'portrait/{dex}/credits.txt',f'public/assets/portraits/{dex}_credits.txt'))
  return dict(fact=fact,key=key,dex=dex,out=out,jobs=list(jobs),shadowSize=int(tree.findtext('ShadowSize')),levels=levels,tms=sorted(tms),legal=list(legal.values()),game=game,xml=xml.decode())
 except Exception as e:return {'skip':key,'reason':str(e)}
candidates=[f for f in facts if f['id']==f['species'] and f['id'] not in have]
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:prepared=list(ex.map(prepare,candidates))
prepared=[p for p in prepared if p]
skipped=[p for p in prepared if 'skip' in p];prepared=[p for p in prepared if 'skip' not in p]
print('Prepared',len(prepared),'species;',sum(len(p['jobs']) for p in prepared),'files',flush=True)
failures={};jobs={j for p in prepared for j in p['jobs']};done=0
with concurrent.futures.ThreadPoolExecutor(max_workers=28) as ex:
 fs={ex.submit(fetch,*j):j for j in jobs}
 for future in concurrent.futures.as_completed(fs):
  j=fs[future]
  try:future.result()
  except Exception as e:failures[j[1]]=str(e)
  done+=1
  if done%500==0:print('Assets',done,'/',len(jobs),'failures',len(failures),flush=True)
for p in prepared:
 key=p['key'];dex=p['dex'];fact=p['fact']
 if any(dst in failures for _,dst in p['jobs']):skipped.append({'skip':key,'reason':'Incomplete download'});continue
 try:
  for a in p['out'].values():
   data=(ROOT/f"public/assets/sprites/{dex}/{a['file']}").read_bytes();w,h=struct.unpack('>II',data[16:24])
   if w%a['w'] or h%a['h'] or w//a['w']!=len(a['durations']) or h//a['h'] not in [1,8]:raise ValueError('Invalid animation geometry')
  idle=p['out']['Idle'];block=blocks.get(key,'');ability=re.search(r'abilities: \{ 0: "(.*?)"',block)
  ability=ability[1] if ability else fact['abilities'][0].replace('-',' ').title()
  template=max(templates,key=lambda m:len(set(m['types'])&set(fact['types'])))['key']
  entry=dict(key=key,name=fact['name'],num=fact['id'],gen=next(i+1 for i,n in enumerate([151,251,386,493,649,721,809,905,1025]) if fact['id']<=n),dex=dex,types=fact['types'],mega=None,defaults=[m['id'] for m in sorted(p['legal'],key=lambda m:p['levels'].get(m['id'],999)) if m['id'] in p['levels']][:4],stats=dict(zip(['hp','atk','def','spa','spd','spe'],fact['stats'])),idleH=idle['h'],idleVis=min(idle['h'],32),weight=fact['weight'],faces=['Normal'],ability=ability,abilityDesc='',icon={'file':f"assets/sprites/{dex}/{idle['file']}",'w':idle['w'],'h':idle['h']},pool=p['legal'],template=template)
  entries.append(entry);rules[key]=dict(levelMoves=p['levels'],specialMoves=p['tms'],initialLevel=max(5,min(p['levels'].values())),game=p['game'])
  animdata[dex]={'shadowSize':p['shadowSize'],'anims':p['out']}
  # XML retained alongside original artwork as well.
  target=ROOT/f'public/assets/sprites/{dex}/AnimData.xml'
  if not target.exists():target.write_text(p['xml'])
  credits.append(dict(key=key,name=fact['name'],dex=dex,sprite=(ROOT/f'public/assets/sprites/{dex}/credits.txt').read_text(),portrait=(ROOT/f'public/assets/portraits/{dex}_credits.txt').read_text()))
 except Exception as e:skipped.append({'skip':key,'reason':str(e)})
(ROOT/'public/custom/expansion-data.js').write_text('export const EXPANSION_SPECIES='+json.dumps(entries,ensure_ascii=False)+';\n')
(ROOT/'public/pulse/expansion-learnsets.js').write_text('export const EXPANSION_LEARNSETS='+json.dumps(rules)+';\n')
# Re-read shared manifests at mutation time; additive writes preserve concurrent work.
roster=json.loads((ROOT/'public/roster.json').read_text());keys={m['key'] for m in roster}
(ROOT/'public/roster.json').write_text(json.dumps(roster+[m for m in entries if m['key'] not in keys],ensure_ascii=False))
anims=json.loads((ROOT/'public/assets/sprites/anims.json').read_text())
for dex,data in animdata.items():anims[dex]=data
(ROOT/'public/assets/sprites/anims.json').write_text(json.dumps(anims))
(OUT/'import-report.json').write_text(json.dumps(dict(revision=REV,added=len(entries),total=len(keys|{m['key'] for m in entries}),species=[m['key'] for m in entries],skipped=skipped,failures=failures,source='https://github.com/PMDCollab/SpriteCollab',note='Canonical forms only; all original animation sheets; only PB-implemented canonical level-up/TM moves from one version group. Existing species untouched.'),indent=2))
(ROOT/'public/pulse/expansion/credits.json').write_text(json.dumps(credits,ensure_ascii=False))
print('COMPLETE',len(entries),'added;',len(skipped),'excluded',flush=True)
