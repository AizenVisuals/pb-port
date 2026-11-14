#!/usr/bin/env python3
"""Fetch only enumerated public PB Ranked resources, retaining provenance.
Does not execute JavaScript, authenticate, recurse arbitrary URLs, or contact APIs.
"""
import argparse, concurrent.futures, hashlib, json, pathlib, re, threading, urllib.request, urllib.error, urllib.parse, datetime
ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE='https://ranked.pokemonbattlegrounds.com'
lock=threading.Lock(); used=0; records={}
def main():
 global used,records
 p=argparse.ArgumentParser();p.add_argument('--max-mb',type=int,default=150);p.add_argument('--workers',type=int,default=6);args=p.parse_args();limit=args.max_mb*1024*1024
 public=ROOT/'public';manifest=ROOT/'research/assets-manifest.json';public.mkdir(exist_ok=True)
 if manifest.exists():records=json.loads(manifest.read_text()).get('resources',{})
 def fetch(path):
  global used
  path=path.lstrip('/')
  if '..' in pathlib.PurePosixPath(path).parts or '${' in path or not re.fullmatch(r'[A-Za-z0-9_./ ~@+-]+',path):return
  dest=public/path
  if dest.exists():
   data=dest.read_bytes();records[path]={'url':BASE+'/'+path,'status':'cached','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()};return
  with lock:
   if used>=limit:records[path]={'url':BASE+'/'+path,'status':'budget-skipped'};return
  try:
   req=urllib.request.Request(BASE+'/'+urllib.parse.quote(path),headers={'User-Agent':'PB-Port-Asset-Inventory/1.0'})
   with urllib.request.urlopen(req,timeout=25) as res:
    data=res.read(min(limit,16*1024*1024)+1);ctype=res.headers.get('Content-Type','')
   if 'text/html' in ctype and not path.endswith('.html'):raise ValueError('unexpected HTML response')
   with lock:
    if used+len(data)>limit:records[path]={'url':BASE+'/'+path,'status':'budget-skipped'};return
    used+=len(data)
   dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
   records[path]={'url':BASE+'/'+path,'status':200,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'content_type':ctype}
  except Exception as e:records[path]={'url':BASE+'/'+path,'status':getattr(e,'code','error'),'error':str(e)}
 def batch(paths):
  with concurrent.futures.ThreadPoolExecutor(args.workers) as ex:list(ex.map(fetch, sorted(set(paths))))
 def read(path,default):
  try:return json.loads((public/path).read_text())
  except Exception:return default
 batch(['roster.json','trainers.json','roster-history.json','bosses.json','legends.json','vote.json','assets/sprites/anims.json','audio/manifest.json','audio/music/menu.json','assets/arena/meteorfalls_tiles.json'])
 roster=read('roster.json',[])+read('legends.json',[])+read('bosses.json',[]);trainers=read('trainers.json',[]);anims=read('assets/sprites/anims.json',{})
 paths={'branding/logo_160.png','assets/fonts/PressStart2P.ttf','assets/fonts/Rubik.ttf','assets/fx/substitute.png','assets/arena/meteorfalls_tiles.png','audio/music/menu1.mp3','audio/music/battle.mp3','audio/music/fanfare.mp3'}
 paths.update('assets/fx/og11metaB/'+name+'.png' for name in ['hoopa-unbound','dialga','calyrex-shadow','necrozma'])
 paths.update('assets/fx/og11metaA/'+name+'.png' for name in ['jirachi','palkia','arceus'])
 for f in public.glob('*.js'):
  source=f.read_text()
  paths.update(re.findall(r'["\x27`](/?(?:assets|branding|faces)/[^"\x27`$\\ ]+\.(?:png|json|ttf|webp|jpg))',source))
 engine=(public/'engine.bundle.js').read_text()
 for name in ['PM0','__a','CM0','q_a','GM0','XM0']:
  match=re.search(re.escape(name)+r'=\[([^\]]*)\]',engine)
  if match:
   paths.update('assets/npcs/'+value+'.png' for value in re.findall(r'"([^"]+)"',match.group(1)))
 for t in trainers:
  key=t['key'];paths.update([f'faces/{key}.png',f'assets/trainers/{key}.png',f'assets/trainers/{key}_face.png'])
 dexes=set()
 for mon in roster:
  for field in ('dex','megaDex','altMegaDex'):
   dex=mon.get(field)
   if dex:dexes.add(dex)
  dex=mon.get('dex')
  for dex_field,face_field in [('dex','faces'),('megaDex','megaFaces'),('altMegaDex','altMegaFaces')]:
   for face in mon.get(face_field,[]) or ['Normal']:
    if mon.get(dex_field):paths.add(f"assets/portraits/{mon[dex_field]}_{face}.png")
  if mon.get('icon',{}).get('file'):paths.add(mon['icon']['file'])
 audio=read('audio/manifest.json',{})
 # Audio is fetched after gameplay sprites so a bounded pass stays playable.
 batch(paths)
 # Baked metadata is a dependency inventory. Original sprites remain
 # necessary for six special animation transformations in the shipped loader.
 batch(f'baked2/{dex}.json' for dex in dexes)
 paths=set();original={'0277','0018','0227','0373','0149','0149m'}
 for dex in sorted(dexes):
  data=anims.get(dex,{})
  baked=read(f'baked2/{dex}.json',{})
  for animation in data.get('anims',{}).values():
   file=animation.get('file')
   if not file:continue
   stem=file.replace('-Anim.png','')
   if dex in original or not baked:
    paths.update(f'assets/sprites/{dex}/{name}' for name in [file,stem+'-Offsets.png',stem+'-Shadow.png'])
   else:paths.add(f'baked2/{dex}/{stem}.png')
 batch(paths)
 batch(f'audio/sfx/{key}.mp3' for key in audio.get('sfx',[]))
 manifest.parent.mkdir(exist_ok=True);manifest.write_text(json.dumps({'source':BASE,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'new_bytes':used,'budget_bytes':limit,'scope':'Public static data and enumerated assets; no authentication or production mutations.','resources':dict(sorted(records.items()))},indent=2))
 print(json.dumps({'resources':len(records),'downloaded_bytes':used,'status_counts':{str(s):sum(r['status']==s for r in records.values()) for s in set(r['status'] for r in records.values())}}))
if __name__=='__main__':main()
