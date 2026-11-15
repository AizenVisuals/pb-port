/** Inventory the preserved PB snapshot without replacing customized files. */
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url), publicRoot=new URL('public/',root);
const readJSON=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const manifest=await readJSON('research/assets-manifest.json');
const resources=[];
for(const [path,record] of Object.entries(manifest.resources)){
 try{
  const bytes=await readFile(new URL(path,publicRoot));
  const sha256=createHash('sha256').update(bytes).digest('hex');
  resources.push({path,status:sha256===record.sha256?'matches-snapshot':'locally-modified',bytes:bytes.length,sha256,source:record.url});
 }catch(error){if(error.code!=='ENOENT')throw error;resources.push({path,status:'absent',source:record.url,sourceStatus:record.status});}
}
async function count(directory){
 let total=0;for(const entry of await readdir(new URL(directory,publicRoot),{withFileTypes:true})){
  if(entry.isDirectory())total+=await count(directory+'/'+entry.name);else total++;
 }return total;
}
const categories={};
for(const directory of ['assets/sprites','assets/portraits','assets/trainers','assets/npcs','assets/arena','assets/fx','audio/sfx','audio/music'])categories[directory]=await count(directory);
const report={generatedAt:new Date().toISOString(),source:manifest.source,scope:'Preserved public PB snapshot. A file inventory does not prove every dynamic asset is enumerated or every feature is integrated.',
 summary:{enumerated:resources.length,present:resources.filter(r=>r.status!=='absent').length,modified:resources.filter(r=>r.status==='locally-modified').length,absent:resources.filter(r=>r.status==='absent').length},categories,
 integration:{reused:['PB simulation and battle renderer','PB move implementations and effects','PB battle audio','PB arenas and species animation sheets'],pulseSpecific:['journey and stage progression','wild capture and acquisition economy','gacha and shiny shop','landscape lobby and touch controller'],requiresOwnBackend:['Google identity and save sync','friends and public teams','online matchmaking and private rooms']},resources};
const path=new URL('research/pb-reuse-audit.json',root);await writeFile(path,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({summary:report.summary,categories,missing:resources.filter(r=>r.status==='absent')}));
