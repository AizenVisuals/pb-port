from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
moves=json.loads((root/'research/fan-pack/native-moves.json').read_text())
specs=[('ferunoga','Ferunoga',['fire','dark'],[88,72,85,117,85,83],'Blaze',95,['Flamethrower','Dark Pulse','Fire Fang','Dragon Pulse']),('hawajaku','Hawajaku',['grass','flying'],[85,75,82,105,103,80],'Overgrow',42,['Giga Drain','Air Slash','Leech Seed','Energy Ball']),('kyasupada','Kyasupada',['water','steel'],[76,108,90,70,82,104],'Torrent',46,['Aqua Jet','Iron Head','Sacred Sword','Swords Dance']),('eereon','Eereon',['ghost'],[95,60,75,105,110,80],'Levitate',24,['Shadow Ball','Will-O-Wisp','Hex','Moonlight'])]
extras={'ferunoga': ['Ember', 'Fire Blast', 'Heat Wave', 'Crunch', 'Bite', 'Dragon Breath', 'Sludge Bomb', 'Protect', 'Sunny Day'], 'hawajaku': ['Leaf Blade', 'Razor Leaf', 'Hurricane', 'Aerial Ace', 'Tailwind', 'Roost', 'Calm Mind', 'Synthesis', 'Protect', 'Sunny Day'], 'kyasupada': ['Water Pulse', 'Hydro Pump', 'Surf', 'Aqua Tail', 'Iron Tail', 'Metal Claw', 'Slash', 'Night Slash', 'Ice Beam', 'Agility', 'Protect', 'Quick Attack'], 'eereon': ['Shadow Sneak', 'Curse', 'Confuse Ray', 'Psychic', 'Dark Pulse', 'Calm Mind', 'Protect', 'Substitute', 'Quick Attack', 'Swift']}
entries=[]
for i,(key,name,types,stats,ability,weight,kit)in enumerate(specs):
 pool=[]
 for n in kit+extras[key]:
  if n not in moves:continue
  if n not in moves:raise ValueError(n)
  m=dict(moves[n]);m['source']=m['id'];m['id']=key+':'+n;pool.append(m)
 entries.append(dict(key=key,name=name,num=20001+i,gen=0,dex='fan_'+key,types=types,mega=None,defaults=[m['id']for m in pool[:4]],stats=dict(zip(['hp','atk','def','spa','spd','spe'],stats)),idleH=64,idleVis=56,weight=weight,faces=['Normal'],ability=ability,abilityDesc='',fanMade=True,icon=dict(file='assets/sprites/fan_'+key+'/Idle-Anim.png',w=64,h=64),pool=pool))
(root/'public/custom/fan-pack-data.js').write_text('export const FAN_PACK='+json.dumps(entries)+';\n')
print('Registered data',len(entries))
