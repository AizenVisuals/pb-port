#!/usr/bin/env python3
"""Build the authored campaign scenes in WIDE format from pinned FireRed metatiles.
Wide boards: 80x32 metatiles = 1280x512 px (2.5:1), matching the ultra-wide
stage area. Same tile/palette/metatile pipeline as build-firered-map.py and
build-firered-map-chapter-two.py; only the board geometry and the compositions
are adapted (nodes rescaled from 45 rows to 32, elements repositioned).
Requires Pillow (isolated venv recommended). No network access during build.
Original game graphics are sourced, not authored by PULSE.
"""
from PIL import Image
from pathlib import Path
import struct,json,hashlib,random
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
vals=struct.unpack('<480H',(r/'data/layouts/PalletTown/map.bin').read_bytes())
pallet=[[v&1023 for v in vals[y*24:(y+1)*24]]for y in range(20)]
W,H=80,32
gym=[[312,313,314,314,314,315,316],[320,321,322,322,322,323,324],[328,329,330,330,330,331,332],[336,337,338,339,340,341,342],[344,345,346,347,348,349,350]]
# Forest predicate shared by both chapters (same zones as the 80x45 originals,
# compressed to 32 rows): border, north band above the route, lower-right
# corner, and a round grove at the upper left.
def forest(x,y):
 return (x<3 or y<2 or x>76 or y>29 or (22<x<61 and 4<y<15) or (x>62 and y>19) or (7<x<19 and 4<y<14 and ((x-13)**2+(y-9)**2<40)))
def build(cfg):
 board=[[1 for x in range(W)]for y in range(H)]
 def put(x,y,t):
  if 0<=x<W and 0<=y<H:board[y][x]=t
 nodes=cfg['nodes']
 route=set()
 for (ax,ay),(bx,by) in zip(nodes,nodes[1:]):
  for x in range(min(ax,bx),max(ax,bx)+1):route.add((x,ay))
  for y in range(min(ay,by),max(ay,by)+1):route.add((bx,y))
 path_cells=set()
 for x,y in list(route):
  for dy in range(-1,2):
   for dx in range(-1,2):path_cells.add((x+dx,y+dy))
 for x,y in path_cells:put(x,y,662)
 rng=random.Random(151)
 def tree(x,y):
  for dy,row in enumerate([[28,29],[20,21]]):
   for dx,t in enumerate(row):put(x+dx,y+dy,t)
 def near_route(x,y,margin=3):return any(abs(x-a)<=margin and abs(y-b)<=margin for a,b in route)
 for y in range(0,H,2):
  for x in range(0,W,2):
   if forest(x,y) and not near_route(x,y) and rng.random()<.87:tree(x,y)
 for x0,y0,ww,hh in cfg['grass']:
  for y in range(y0,y0+hh):
   for x in range(x0,x0+ww):
    if not near_route(x,y,1):put(x,y,13 if (x+y)%2 else 8)
 center=cfg['stream']
 for y in range(H):
  for dx,t in enumerate([298,299,299,300]):put(center+dx,y,t)
 b0,b1,bmid=cfg['bridge']
 for y in range(b0,b1+1):
  for x in range(center,center+6):put(x,y,355 if y in bmid else 354 if y==b0 else 356)
 def patch(srcx,srcy,ww,hh,dx,dy):
  for y in range(hh):
   for x in range(ww):put(dx+x,dy+y,pallet[srcy+y][srcx+x])
 for x0,y0 in cfg['houses']:
  for y in range(y0-1,y0+7):
   for x in range(x0-1,x0+8):put(x,y,662)
  patch(4,3,7,6,x0,y0)
 fx0,fx1,frow,hrow=cfg['flowers']
 for x in range(fx0,fx1):put(x,frow,4 if x%2 else 5)
 for x in range(fx0,fx1):put(x,hrow,308 if x==fx0 else 309 if x==fx1-1 else 214)
 ox0,oy0=cfg['outpost']
 for y in range(oy0-1,oy0+7):
  for x in range(ox0-1,ox0+8):put(x,y,662)
 patch(13,9,7,6,ox0,oy0)
 for y in range(1,11):
  for x in range(66,78):put(x,y,662)
 for y,row in enumerate(gym):
  for x,t in enumerate(row):put(69+x,1+y,t)
 put(68,6,360)
 for x,y in cfg['signs']:put(x,y,3)
 for y0,y1,x0,x1 in cfg['ponds']:
  for y in range(y0,y1):
   for x in range(x0,x1):put(x,y,299 if x not in (x0,x1-1) else 298 if x==x0 else 300)
 for x,y in cfg['rocks']:
  for dy,row in enumerate([[104,105],[112,113]]):
   for dx,t in enumerate(row):put(x+dx,y+dy,t)
 plain={(x,y)for y in range(H)for x in range(W)if board[y][x]==662}
 for x,y in plain:
  u=(x,y-1)in plain;d=(x,y+1)in plain;l=(x-1,y)in plain;rr=(x+1,y)in plain
  t=653 if not u and not l else 655 if not u and not rr else 669 if not d and not l else 671 if not d and not rr else 654 if not u else 670 if not d else 661 if not l else 663 if not rr else 662
  put(x,y,t)
 out=Image.new('RGBA',(W*16,H*16))
 for y,row in enumerate(board):
  for x,t in enumerate(row):out.alpha_composite(metas[t],(x*16,y*16))
 dest=ROOT/cfg['asset'];out.convert('RGB').save(dest,lossless=True,method=6)
 out.resize((1280,512),Image.Resampling.NEAREST).save(r/cfg['preview'])
 source=json.loads((r/'sources.json').read_text())
 report={'asset':str(dest.relative_to(ROOT)),'width':W*16,'height':H*16,'format':'lossless WebP','tiles':'FireRed original 8px tiles / 16px metatiles, nearest neighbor','composition':cfg['composition'],'source':source['upstream']+'/tree/'+source['revision']+'/data/tilesets','upstream':source['upstream'],'revision':source['revision'],'ownership':'Original Pokémon FireRed graphics belong to their respective rights holders. pret is a decompilation source, not evidence of asset ownership transfer.','sourceManifest':'research/next-pass/firered/sources.json','script':'scripts/build-firered-map-wide.py','sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'nodesPercent':[[round(x/W*100,2),round(y/H*100,2)]for x,y in nodes],'limitations':['Static campaign scene only; no exploration/collision engine implied.','Original tiles are not original PULSE artwork.','No NPC or story labels baked in; actual stage controls stay in UI.','Wide 80x32 recomposition of the 80x45 original; vertical space compressed, decorative elements repositioned, route nodes rescaled.']}
 report['prompt']='Sourced FireRed game graphics from '+report['source']+'; original PULSE tile arrangement by '+report['script']+'. Source hashes: '+report['sourceManifest']+'. Not AI-generated art.'
 Path(str(dest)+'.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps(report,indent=2))
 return board
# Chapter 1: village at the start, grass route, vertical stream + wooden bridge,
# disused research outpost (Rocket), gym top-right, pond + rocky clearing.
# Nodes: original y rescaled 45->32 rows (round(y*31/45)); final node kept at
# y=7, two rows below the gym, as in the original.
build({'nodes':[(16,23),(23,21),(30,21),(37,19),(46,18),(54,19),(61,18),(66,14),(72,9),(72,7)],
 'grass':[(23,17,7,3),(34,14,6,3),(54,21,7,3),(69,21,5,3)],
 'stream':44,'bridge':(17,20,(18,19)),
 'houses':[(5,17),(7,25)],'flowers':(16,25,30,29),
 'outpost':(59,9),'signs':[(18,22),(32,19),(51,17),(70,8)],
 'ponds':[(25,30,51,59)],
 'rocks':[(69,24),(71,26),(65,27),(74,26),(67,29)],
 'asset':'public/pulse/assets/chapter-one-tiles.webp','preview':'chapter-one-wide-preview.png',
 'composition':'Original PULSE campaign arrangement, wide 80x32 recomposition (2.5:1); not a screenshot of Pallet Town. Village, grass routes, stream/bridge, disused research outpost and gym.'})
# Chapter 2: vertical river + bridge, lower-left lake, Cerulean pond, Mt. Moon
# rock formations, Rocket hideout (cave approach), two houses + Cerulean gym.
build({'nodes':[(8,26),(16,23),(24,21),(32,18),(40,15),(48,17),(56,14),(62,10),(68,7),(72,6)],
 'grass':[(8,22,6,3),(20,18,6,3),(36,12,6,3),(50,11,6,3)],
 'stream':28,'bridge':(20,23,(21,22)),
 'houses':[(56,2),(58,12)],'flowers':(50,59,10,9),
 'outpost':(43,19),'signs':[(10,25),(26,19),(42,13),(60,18)],
 'ponds':[(27,32,2,12),(24,28,60,67)],
 'rocks':[(34,16),(38,13),(44,12),(52,19),(52,15)],
 'asset':'public/pulse/assets/chapter-two-tiles.webp','preview':'chapter-two-wide-preview.png',
 'composition':'Original PULSE campaign arrangement, wide 80x32 recomposition (2.5:1); not a screenshot of Cerulean City. River, lake, Mt. Moon cave approach, Cerulean City and gym.'})
