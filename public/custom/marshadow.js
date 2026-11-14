import {MARSHADOW} from './marshadow-data.js';
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
export function stealBoosts(battle,attacker,target,limit=2){
  let stolen=0;
  for(const stat of ['atk','def','spa','spd','spe']){
    const amount=Math.min(Math.max(0,target.stages?.[stat]||0),Math.max(0,6-(attacker.stages?.[stat]||0)),limit-stolen);
    if(amount>0){battle.changeStage(target,stat,-amount);battle.changeStage(attacker,stat,amount);stolen+=amount;}
    if(stolen>=limit)break;
  }
  return stolen;
}
function shadowFlare(battle,actor,target){
  const origin={x:actor.x,y:actor.y},end={x:target.x,y:target.y};
  battle.visual({owner:'arena',layer:'ground',life:40,draw(ctx,frame,age){
    const p=Math.min(1,age/12),fade=Math.max(0,1-age/40);
    ctx.save();ctx.globalAlpha=fade;ctx.strokeStyle='#69e8b1';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(end.x,end.y,12+18*p,5+6*p,0,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#5b417f';ctx.lineWidth=8*fade;ctx.beginPath();ctx.moveTo(origin.x,origin.y);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.restore();
  }});
  battle.fx.add({x:target.x,y:target.y-target.bodyH*.4,life:20,size:4,size1:28,stops:[[0,[170,255,210],1],[.5,[70,180,140],.7],[1,[45,20,70],0]],shape:'ring',width:2});
}
const spectralThief={
 name:'Spectral Thief',type:'ghost',cat:'phys',power:90,cooldown:480,range:[0,140],
 *run(b,a,t){
  a.face(Math.atan2(t.y-a.y,t.x-a.x));a.play('Charge',{loop:true});
  // Visible windup: the attacker remains hittable throughout the move.
  b.visual({owner:'arena',layer:'ground',life:25,draw(ctx,frame,age){ctx.save();ctx.globalAlpha=1-age/25;ctx.strokeStyle='#64dbad';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(a.x,a.y,a.radius+4+age*.45,5+age*.15,0,0,Math.PI*2);ctx.stroke();ctx.restore();}});
  for(let i=0;i<24;i++)yield;
  a.play('Strike');
  for(let i=0;i<12;i++){
    if(t.hidden||t.fainted)break;
    const dx=t.x-a.x,dy=t.y-a.y,d=Math.hypot(dx,dy),step=Math.min(6,Math.max(0,d-a.radius-t.radius-8));
    if(d>0){a.x=clamp(a.x+dx/d*step,b.bounds.minX,b.bounds.maxX);a.y=clamp(a.y+dy/d*step,b.bounds.minY,b.bounds.maxY);a.face(Math.atan2(dy,dx));}
    if(i%3===0)a.afterimage([95,235,170],9);
    yield;
  }
  if(!t.hidden&&!t.fainted&&Math.hypot(t.x-a.x,t.y-a.y)<=a.radius+t.radius+28){
    shadowFlare(b,a,t);b.sfx('slash',.7,a.x,.75);
    const damage=b.hit(a,t,this,{kb:.65,kbAng:a.ang,fx:'ghost',shake:.15,hitstop:4});
    if(damage>0){const stolen=stealBoosts(b,a,t);if(stolen){b.text(a.x,a.y-a.bodyH-12,'STOLE BOOSTS!',{kind:'status',color:'#8affbf',life:55});b.sfx('buff',.6,a.x);}}
  }else b.miss(t,this);
  for(let i=0;i<24;i++)yield;
  a.release();a.play('Idle',{loop:true});
 }
};
export function installMarshadow({species,catalog,ranked,roster,entries,faces,getMove,wrapMove}){
 if(species.marshadow)return;
 const moves=MARSHADOW.pool.map(entry=>{
  if(entry.name==='Bulk Up'){wrapMove(bulkUp);return bulkUp;}
  if(entry.name==='Spectral Thief'){wrapMove(spectralThief);return spectralThief;}
  const source=getMove(entry.source);if(!source)throw Error('Missing Marshadow move source: '+entry.source);
  const move={...source,cooldown:entry.cd,run:source.rkOrig||source.run};delete move.rkSafe;delete move.rkOrig;wrapMove(move);return move;
 });
 // Canonical base stats; power is budgeted through cooldowns and recovery windows.
 species.marshadow={dex:'0802',name:'MARSHADOW',types:[...MARSHADOW.types],color:'#77ddb0',abilityName:'TECHNICIAN',base:{...MARSHADOW.stats},radius:11,bodyH:24,scale:1,moves,mega:'marshadowMega'};
 species.marshadowMega={...species.marshadow,dex:'0802mega',name:'MEGA MARSHADOW',mega:undefined,megaForm:true,base:{...MARSHADOW.megaStats},radius:13,bodyH:30,moves};
 catalog.marshadow=MARSHADOW;ranked.marshadow=MARSHADOW;roster.push('marshadow');entries.push(MARSHADOW);faces['0802']=MARSHADOW.faces;faces['0802mega']=[];
}

// Complete generated Mega character atlases, composited into the original timing grid.
let megaAtlasPromise;
const loadSprite=path=>new Promise((resolve,reject)=>{const image=new Image;image.onload=()=>resolve(image);image.onerror=reject;image.src=path;});
const megaAtlases=()=>megaAtlasPromise||=Promise.all([loadSprite('assets/fx/custom/marshadow-mega-idle.png'),loadSprite('assets/fx/custom/marshadow-mega-attack.png')]);
export async function decorateMegaSpecies(species){
 const [idle,attack]=await megaAtlases();
 const anims={},sheetCache=new Map;
 for(const [name,animation] of Object.entries(species.anims)){
  const w=64,h=64;
  const fighting=/Attack|Strike|Shoot|Swing|Double|LeapForth/.test(name),atlas=fighting?attack:idle;
  const fades=name==='Faint'||name==='LostBalance';
  const cacheKey=[fighting,fades,animation.cols,animation.rows].join(':');
  const cached=sheetCache.get(cacheKey);
  const sheet=cached?.sheet||document.createElement('canvas');
  if(!cached){sheet.width=w*animation.cols;sheet.height=h*animation.rows;}
  const ctx=sheet.getContext('2d');ctx.imageSmoothingEnabled=false;
  const sw=atlas.width/4,sh=atlas.height/8;
  const offs=[],shad=[];
  for(let row=0;row<animation.rows;row++){
   offs[row]=[];shad[row]=[];
   for(let col=0;col<animation.cols;col++){
    const root={x:32,y:56};
    const frame=Math.min(3,Math.floor(col*4/Math.max(1,animation.cols)));
    if(!cached){ctx.save();
    if(fades)ctx.globalAlpha=Math.max(0,1-col/Math.max(1,animation.cols-1));
    ctx.drawImage(atlas,frame*sw,(row%8)*sh,sw,sh,Math.round(col*w+root.x-29),Math.round(row*h+root.y-55),58,58);
    ctx.restore();}
    shad[row][col]={centroid:root,center:root};
    offs[row][col]={head:{x:root.x,y:root.y-33},center:{x:root.x,y:root.y-19},lh:{x:root.x-12,y:root.y-17},rh:{x:root.x+12,y:root.y-17},centroid:{x:root.x,y:root.y-22}};
   }
  }
  sheetCache.set(cacheKey,{sheet});
  anims[name]={...animation,sheet,w,h,offs,shad};
 }
 return {...species,dex:'0802mega',anims};
}
const bulkUp={name:'Bulk Up',type:'fighting',cat:'status',power:0,cooldown:900,range:[0,400],utility:actor=>(actor.stages?.atk||0)>=2?0:65,
 *run(b,a){
  a.play('Charge',{loop:true});
  b.visual({owner:'arena',layer:'ground',life:60,draw(ctx,frame,age){ctx.save();ctx.globalAlpha=1-age/60;ctx.strokeStyle='#b8ed83';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(a.x,a.y,12+age*.35,5+age*.14,0,0,Math.PI*2);ctx.stroke();ctx.restore();}});
  for(let frame=0;frame<48;frame++)yield;
  b.changeStage(a,'atk',1);b.changeStage(a,'def',1);b.sfx('buff',.8,a.x);
  b.text(a.x,a.y-a.bodyH-12,'ATTACK + DEFENSE UP',{kind:'status',color:'#b8ed83',life:60});
  for(let frame=0;frame<18;frame++)yield;
  a.release();a.play('Idle',{loop:true});
 }
};
