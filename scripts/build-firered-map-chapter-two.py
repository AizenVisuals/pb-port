#!/usr/bin/env python3
"""Build the authored campaign scene from pinned FireRed metatiles.
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

# Contact sheet is research evidence, not UI decoration.
atlas=Image.new('RGB',(16*32,((len(metas)+15)//16)*40),'#fff');d=ImageDraw.Draw(atlas)
for i,m in enumerate(metas):
 x=i%16*32;y=i//16*40;atlas.paste(m.resize((32,32),Image.Resampling.NEAREST),(x,y));d.text((x,y+30),str(i),fill='#111')
atlas.save(r/'metatile-atlas.png')
vals=struct.unpack('<480H',(r/'data/layouts/PalletTown/map.bin').read_bytes())
pallet=[[v&1023 for v in vals[y*24:(y+1)*24]]for y in range(20)]
W,H=80,45
board=[[1 for x in range(W)]for y in range(H)]
def put(x,y,t):
 if 0<=x<W and 0<=y<H:board[y][x]=t
# Clear functional route, distinct authored locations, integer metatile composition.
nodes=[(8,38),(16,34),(24,30),(32,26),(40,22),(48,24),(56,20),(62,15),(68,10),(72,6)]
route=set()
for (ax,ay),(bx,by) in zip(nodes,nodes[1:]):
 for x in range(min(ax,bx),max(ax,bx)+1):route.add((x,ay))
 for y in range(min(ay,by),max(ay,by)+1):route.add((bx,y))
path_cells=set()
for x,y in list(route):
 for dy in range(-1,2):
  for dx in range(-1,2):path_cells.add((x+dx,y+dy))
for x,y in path_cells:put(x,y,662)
# Forest grows around the road rather than covering controls. Deterministic spacing.
import random
rng=random.Random(151)
def tree(x,y):
 for dy,row in enumerate([[28,29],[20,21]]):
  for dx,t in enumerate(row):put(x+dx,y+dy,t)
def near_route(x,y,margin=3):return any(abs(x-a)<=margin and abs(y-b)<=margin for a,b in route)
for y in range(0,H,2):
 for x in range(0,W,2):
  forest=(x<3 or y<2 or x>76 or y>42 or (22<x<61 and 5<y<23) or (x>62 and y>26) or (7<x<19 and 5<y<20 and ((x-13)**2+(y-12)**2<65)))
  if forest and not near_route(x,y) and rng.random()<.87:tree(x,y)
# Separate grass encounter patches use the actual short grass metatiles.
for x0,y0,ww,hh in [(10,32,6,3),(20,26,6,3),(36,18,6,3),(52,16,6,3)]:
 for y in range(y0,y0+hh):
  for x in range(x0,x0+ww):
   if not near_route(x,y,1):put(x,y,13 if (x+y)%2 else 8)
# A vertical stream and an authentic wooden crossing connect the two halves.
for y in range(H):
 center=28
 for dx,t in enumerate([298,299,299,300]):put(center+dx,y,t)
for y in range(28,32):
 for x in range(28,34):put(x,y,355 if y in (29,30) else 354 if y==28 else 356)
# Village: two real FireRed houses, original graphics, rearranged into a new place.
def patch(srcx,srcy,ww,hh,dx,dy):
 for y in range(hh):
  for x in range(ww):put(dx+x,dy+y,pallet[srcy+y][srcx+x])
for x0,y0 in [(56,2),(58,12)]:
 for y in range(y0-1,y0+7):
  for x in range(x0-1,x0+8):put(x,y,662)
 patch(4,3,7,6,x0,y0)
# Authentic flowers and hedges, deliberately sparse, keeping silhouettes readable.
for x in range(54,63):put(x,10,4 if x%2 else 5)
for x in range(54,63):put(x,9,308 if x==54 else 309 if x==62 else 214)
# Disused research outpost is the Rocket encounter site; no invented insignia.
for y in range(13,22):
 for x in range(43,52):put(x,y,662)
patch(13,9,7,6,44,14)
# The gym uses the genuine primary tileset building, assembled without repainting.
gym=[[312,313,314,314,314,315,316],[320,321,322,322,322,323,324],[328,329,330,330,330,331,332],[336,337,338,339,340,341,342],[344,345,346,347,348,349,350]]
for y in range(1,11):
 for x in range(66,78):put(x,y,662)
for y,row in enumerate(gym):
 for x,t in enumerate(row):put(69+x,1+y,t)
put(68,6,360)
# Signposts use FireRed objects, never text rendered into the map.
for x,y in [(10,36),(26,28),(42,20),(60,18)]:put(x,y,3)
# Small independent pond and rocky training clearing in the lower right.
for y in range(39,44):
 for x in range(2,12):put(x,y,299 if x not in (2,11) else 298 if x==2 else 300)
for y in range(30,34):
 for x in range(60,67):put(x,y,299 if x not in (60,66) else 298 if x==60 else 300)
for x,y in [(34,24),(38,19),(44,18),(48,26),(52,22)]:
 for dy,row in enumerate([[104,105],[112,113]]):
  for dx,t in enumerate(row):put(x+dx,y+dy,t)
# Ground/path boundaries use true FireRed corner/edge metatiles.
plain={(x,y)for y in range(H)for x in range(W)if board[y][x]==662}
for x,y in plain:
 u=(x,y-1)in plain;d=(x,y+1)in plain;l=(x-1,y)in plain;rr=(x+1,y)in plain
 t=653 if not u and not l else 655 if not u and not rr else 669 if not d and not l else 671 if not d and not rr else 654 if not u else 670 if not d else 661 if not l else 663 if not rr else 662
 put(x,y,t)
out=Image.new('RGBA',(W*16,H*16))
for y,row in enumerate(board):
 for x,t in enumerate(row):out.alpha_composite(metas[t],(x*16,y*16))
dest=ROOT/'public/pulse/assets/chapter-two-tiles.webp';out.convert('RGB').save(dest,lossless=True,method=6)
out.resize((1280,720),Image.Resampling.NEAREST).save(r/'chapter-two-preview.png')
import hashlib
source=json.loads((r/'sources.json').read_text())
report={'asset':str(dest.relative_to(ROOT)),'width':W*16,'height':H*16,'format':'lossless WebP','tiles':'FireRed original 8px tiles / 16px metatiles, nearest neighbor','composition':'Original PULSE campaign arrangement; not a screenshot of Cerulean City. River, lake, Mt. Moon cave approach, Cerulean City and gym.','source':source['upstream']+'/tree/'+source['revision']+'/data/tilesets','upstream':source['upstream'],'revision':source['revision'],'ownership':'Original Pokémon FireRed graphics belong to their respective rights holders. pret is a decompilation source, not evidence of asset ownership transfer.','sourceManifest':'research/next-pass/firered/sources.json','script':'scripts/build-firered-map-chapter-two.py','sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'nodesPercent':[[round(x/W*100,2),round(y/H*100,2)]for x,y in nodes],'limitations':['Static campaign scene only; no exploration/collision engine implied.','Original tiles are not original PULSE artwork.','No NPC or story labels baked in; actual stage controls stay in UI.']}
report['prompt']='Sourced FireRed game graphics from '+report['source']+'; original PULSE tile arrangement by '+report['script']+'. Source hashes: '+report['sourceManifest']+'. Not AI-generated art.'
Path(str(dest)+'.json').write_text(json.dumps(report,indent=2)+'\n')
(r/'composition-chapter-two.json').write_text(json.dumps({'metatileRows':board,'nodes':nodes,'width':W,'height':H},indent=2)+'\n')
print(json.dumps(report,indent=2))
