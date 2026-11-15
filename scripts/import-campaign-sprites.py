"""Import canonical full animation sheets from pinned SpriteCollab revision."""
from pathlib import Path
import json,urllib.request,hashlib,xml.etree.ElementTree as ET,concurrent.futures,struct
import argparse
args=argparse.ArgumentParser();args.add_argument("--growth",action="store_true");options=args.parse_args()
ROOT=Path(__file__).resolve().parents[1]
revision=json.loads((ROOT/'research/shiny-assets-manifest.json').read_text())['revision']
base=f'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/{revision}/'
species={'bulbasaur':'0001','charmander':'0004','squirtle':'0007','pidgey':'0016','rattata':'0019','caterpie':'0010','weedle':'0013','zubat':'0041','ekans':'0023','koffing':'0109','geodude':'0074','onix':'0095'}
if options.growth:species=dict(ivysaur='0002',charmeleon='0005',wartortle='0008',chikorita='0152',bayleef='0153',meganium='0154',cyndaquil='0155',quilava='0156',totodile='0158',croconaw='0159')
records=[];metadata={};failures=[]
def fetch(job):
 source,target=job;dest=ROOT/target;dest.parent.mkdir(parents=True,exist_ok=True)
 data=urllib.request.urlopen(base+source,timeout=40).read()
 if dest.exists() and dest.read_bytes()!=data:raise RuntimeError('Refusing to overwrite differing asset: '+target)
 dest.write_bytes(data)
 return {'path':target,'source':base+source,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
jobs=[]
for key,dex in species.items():
 try:
  record=fetch((f'sprite/{dex}/AnimData.xml',f'public/assets/sprites/{dex}/AnimData.xml'));records.append(record)
  tree=ET.parse(ROOT/record['path']);anims=[]
  for anim in tree.findall('.//Anim'):
   name=anim.findtext('Name');copy=anim.findtext('CopyOf')
   if not copy:
    w=int(anim.findtext('FrameWidth'));h=int(anim.findtext('FrameHeight'));dur=[int(e.text) for e in anim.findall('./Durations/Duration')]
    anims.append({'name':name,'w':w,'h':h,'durations':dur})
    for kind in ['Anim','Offsets','Shadow']:jobs.append((f'sprite/{dex}/{name}-{kind}.png',f'public/assets/sprites/{dex}/{name}-{kind}.png'))
  metadata[key]={'dex':dex,'animations':anims}
  jobs.extend([(f'sprite/{dex}/credits.txt',f'public/assets/sprites/{dex}/credits.txt'),(f'portrait/{dex}/Normal.png',f'public/assets/portraits/{dex}_Normal.png'),(f'portrait/{dex}/credits.txt',f'public/assets/portraits/{dex}_credits.txt')])
 except Exception as e:failures.append({'species':key,'error':str(e)})
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
 futures={pool.submit(fetch,j):j for j in jobs}
 for future in concurrent.futures.as_completed(futures):
  try:records.append(future.result())
  except Exception as e:failures.append({'job':futures[future],'error':str(e)})
for key,entry in metadata.items():
 for a in entry['animations']:
  p=ROOT/f"public/assets/sprites/{entry['dex']}/{a['name']}-Anim.png"
  if p.exists():
   w,h=struct.unpack('>II',p.read_bytes()[16:24])
   if w%a['w'] or h%a['h'] or w//a['w']!=len(a['durations']):failures.append({'species':key,'animation':a['name'],'error':'Sheet geometry does not match metadata'})
report={'revision':revision,'origin':'https://github.com/PMDCollab/SpriteCollab','scope':'Canonical animation assets only; combat definitions and runtime tests still required. Original artist credits preserved.','species':metadata,'files':sorted(records,key=lambda r:r['path']),'failures':failures}
(ROOT/('research/campaign/growth-sprite-import.json' if options.growth else 'research/campaign/sprite-import.json')).write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'species':len(metadata),'files':len(records),'failures':failures}))
raise SystemExit(bool(failures))
