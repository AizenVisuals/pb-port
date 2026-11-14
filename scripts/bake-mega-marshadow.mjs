import {engine,createSimulation} from '../server/engine.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const b=await createSimulation(1,[{name:'A',trainer:'red',mons:['marshadow'],gimmick:{kind:'mega',mon:0}},{name:'B',trainer:'blue',mons:['lucario']}],'stadium');
const {decorateMegaSpecies}=await import('../public/custom/marshadow.js');const species=await decorateMegaSpecies(b.assets.species['0802']);const meta={};await mkdir('public/baked2/0802mega',{recursive:true});
const manifest=JSON.parse(await readFile('public/assets/sprites/anims.json','utf8'));
for(const [name,animation]of Object.entries(species.anims)){
 const stem=animation.file.replace('-Anim.png','');
 await writeFile('public/baked2/0802mega/'+stem+'.png',animation.sheet.toBuffer('image/png'));
 meta[stem]={offs:animation.offs,shad:animation.shad};
 manifest['0802mega'].anims[name]={...manifest['0802mega'].anims[name],w:64,h:64};
}
await writeFile('public/baked2/0802mega.json',JSON.stringify(meta));await writeFile('public/assets/sprites/anims.json',JSON.stringify(manifest));
console.log('Baked',Object.keys(meta).length,'sheets');
