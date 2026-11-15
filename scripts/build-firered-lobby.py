#!/usr/bin/env python3
"""Build the authored lobby plaza from pinned FireRed metatiles.
Requires Pillow (isolated venv recommended). No network access during build.
Original game graphics are sourced, not authored by PULSE.
"""
from PIL import Image,ImageDraw
from pathlib import Path
import struct,json,hashlib
ROOT=Path(__file__).resolve().parents[1]
r=ROOT/'research/next-pass/firered';a=r/'data/tilesets/primary/general';b=r/'data/tilesets/secondary/pallet_town';
manifest=json.loads((r/'sources.json').read_text())
for record in manifest['files']:
 assert hashlib.sha256((r/record['path']).read_bytes()).hexdigest()==record['sha256'], 'Source hash mismatch: '+record['path']
primary=Image.open(a/'tiles.png');secondary=Image.open(b/'tiles.png');pal=[]
for i in range(16):
 p=(a if i<7 else b)/f'palettes/{i:02}.pal';lines=p.read_text().splitlines()[3:19];pal.append([tuple(map(int,x.split())) for x in lines])
words=list(struct.iter_unpack('<8H',(a/'metatiles.bin').read_bytes()))+list(struct.iter_unpack('<8H',(b/'metatiles.bin').read_bytes()))
def tile(word,top):
 id=word&1023;im=primary if id<640 else secondary;id=id if id<640 else id-640;x=(id%16)*8;y=(id//16)*8;piece=im.crop((x,y,x+8,y+8));out=Image.new('RGBA',(8,8));out.putdata([pal[word>>12][v%16]+((0 if top and v%16==0 else 255),)for v in piece.get_flattened_data()]);
 if word&1024:out=out.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
 if word&2048:out=out.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
 return out
metas=[]
for w in words:
 out=Image.new('RGBA',(16,16))
 for k,word in enumerate(w):out.alpha_composite(tile(word,k>=4),((k%2)*8,((k%4)//2)*8))
 metas.append(out)


# Authored lobby composition: back town strip, framed training plaza, open foreground.
W,H=40,23
board=[[1 for x in range(W)]for y in range(H)]
def put(x,y,t):
 if 0<=x<W and 0<=y<H:board[y][x]=t
for y in range(0,2,2):
 for x in range(0,W,2):
  for dy,row in enumerate([[28,29],[20,21]]):
   for dx,t in enumerate(row):put(x+dx,y+dy,t)
# Tree framing belongs to the town edge, not an overlay over the player's partner.
for y in range(2,23,2):
 for x in [0,38]:
  for dy,row in enumerate([[28,29],[20,21]]):
   for dx,t in enumerate(row):put(x+dx,y+dy,t)
vals=struct.unpack('<480H',(r/'data/layouts/PalletTown/map.bin').read_bytes())
pallet=[[v&1023 for v in vals[y*24:(y+1)*24]]for y in range(20)]
def patch(sx,sy,ww,hh,dx,dy):
 for yy in range(hh):
  for xx in range(ww):put(dx+xx,dy+yy,pallet[sy+yy][sx+xx])
# Existing canonical house and research-building assets, rearranged for a lobby.
patch(4,3,7,6,5,2)
patch(13,9,7,6,28,2)
gym=[[312,313,314,314,314,315,316],[320,321,322,322,322,323,324],[328,329,330,330,330,331,332],[336,337,338,339,340,341,342],[344,345,346,347,348,349,350]]
for y,row in enumerate(gym):
 for x,t in enumerate(row):put(16+x,2+y,t)
put(15,7,360)
# Town walkway; no sign lettering is added by PULSE.
for y in range(8,10):
 for x in range(3,38):put(x,y,662)
for y in range(7,11):
 for x in range(18,21):put(x,y,662)
for x in range(3,38):
 if not 17<=x<=21:put(x,10,214)
# Plaza is composed from the game's real stone-floor edge and diamond metatiles.
x0,x1,y0,y1=3,37,11,21
for y in range(y0,y1+1):
 for x in range(x0,x1+1):
  if y==y0:t=440 if x==x0 else 442 if x==x1 else 441
  elif y==y1:t=456 if x==x0 else 458 if x==x1 else 457
  elif x==x0:t=448
  elif x==x1:t=450
  else:t=449
  put(x,y,t)
# The north gate leads directly onto the training floor.
for x in range(18,21):put(x,10,662)
for x in range(18,21):put(x,11,449)
# Flowers at the outside verge keep the central/right action areas quiet.
for y in range(12,21,3):
 for x in [2,38]:put(x,y,4 if y%2 else 5)
for x in range(4,37):put(x,22,4 if x%4==0 else 5 if x%4==1 else 1)
# Short lawn patches behind the buildings avoid a blank scenic strip.
for yy in [2,6]:
 for xx in [3,13,25,36]:put(xx,yy,9)
out=Image.new('RGBA',(W*16,H*16))
for y,row in enumerate(board):
 for x,t in enumerate(row):out.alpha_composite(metas[t],(x*16,y*16))
out=out.crop((0,0,640,360)).resize((1280,720),Image.Resampling.NEAREST)
dest=ROOT/'public/pulse/assets/lobby-tiles.webp';out.convert('RGB').save(dest,lossless=True,method=6)
out.save(r/'lobby-tiles-preview.png')
source=json.loads((r/'sources.json').read_text())
report={'asset':str(dest.relative_to(ROOT)),'width':1280,'height':720,'format':'lossless WebP','source':source['upstream']+'/tree/'+source['revision']+'/data/tilesets','upstream':source['upstream'],'revision':source['revision'],'sourceManifest':'research/next-pass/firered/sources.json','script':'scripts/build-firered-lobby.py','composition':'Original PULSE arrangement of authentic FireRed tiles: town back strip, training hall, stone training courtyard, quiet center and right reserved for animated favorite and campaign controls. No UI or creatures baked into art.','ownership':'Original Pokémon FireRed graphics belong to their respective rights holders. This is sourced game art, not AI-generated or original PULSE pixel art.','sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'limitations':['Static backdrop; collision/exploration is not implied.','No animated water, NPCs, UI or fake creature illustrations.']}
report['prompt']='Sourced FireRed game graphics from '+report['source']+'; original PULSE tile arrangement by '+report['script']+'. Source hashes: '+report['sourceManifest']+'. Not AI-generated art.'
Path(str(dest)+'.json').write_text(json.dumps(report,indent=2)+'\n')
(r/'lobby-composition.json').write_text(json.dumps({'width':W,'height':H,'metatileRows':board},indent=2)+'\n')
print(json.dumps(report,indent=2))
