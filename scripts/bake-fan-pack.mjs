import{createCanvas,loadImage}from'@napi-rs/canvas';import{readFile,writeFile,mkdir}from'node:fs/promises';
const manifest=JSON.parse(await readFile('research/fan-pack/art-manifest.json')),metadata=JSON.parse(await readFile('public/assets/sprites/anims.json'));const template=metadata['0802'];
for(const asset of manifest.assets){
 const dex='fan_'+asset.key,image=await loadImage(asset.path),frames=[],walk=[];let maxWidth=0,maxHeight=0;
 for(let row=0;row<8;row++){frames[row]=[];for(let col=0;col<4;col++){
  const x=Math.round(col*image.width/4),y=Math.round(row*image.height/8),w=Math.round((col+1)*image.width/4)-x,h=Math.round((row+1)*image.height/8)-y;
  const canvas=createCanvas(w,h),ctx=canvas.getContext('2d');ctx.drawImage(image,x,y,w,h,0,0,w,h);const pixels=ctx.getImageData(0,0,w,h).data;let left=w,top=h,right=-1,bottom=-1;
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(pixels[(yy*w+xx)*4+3]>64){left=Math.min(left,xx);right=Math.max(right,xx);top=Math.min(top,yy);bottom=Math.max(bottom,yy);}
  if(right<left)throw Error('Empty atlas cell '+asset.key+':'+row+':'+col);
  maxWidth=Math.max(maxWidth,right-left+1);maxHeight=Math.max(maxHeight,bottom-top+1);frames[row][col]={canvas,left,top,width:right-left+1,height:bottom-top+1};
 }}
 if(asset.walk){const image=await loadImage(asset.walk.path),columns=asset.walk.columns;for(let row=0;row<8;row++){walk[row]=[];for(let col=0;col<columns;col++){const x=Math.round(col*image.width/columns),y=Math.round(row*image.height/8),w=Math.round((col+1)*image.width/columns)-x,h=Math.round((row+1)*image.height/8)-y,canvas=createCanvas(w,h),ctx=canvas.getContext('2d');ctx.drawImage(image,x,y,w,h,0,0,w,h);const pixels=ctx.getImageData(0,0,w,h).data;let left=w,top=h,right=-1,bottom=-1;for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(pixels[(yy*w+xx)*4+3]>64){left=Math.min(left,xx);right=Math.max(right,xx);top=Math.min(top,yy);bottom=Math.max(bottom,yy);}if(right<left)throw Error('Empty walk cell '+asset.key+':'+row+':'+col);maxWidth=Math.max(maxWidth,right-left+1);maxHeight=Math.max(maxHeight,bottom-top+1);walk[row][col]={canvas,left,top,width:right-left+1,height:bottom-top+1};}}}
 const scale=Math.min(56/maxWidth,55/maxHeight),anims={},baked={};await mkdir('public/baked2/'+dex,{recursive:true});await mkdir('public/assets/sprites/'+dex,{recursive:true});
 for(const[name,base]of Object.entries(template.anims)){
  const moving=name==='Walk'&&asset.walk,animation=moving?{...base,durations:asset.walk.durations}:base,count=animation.durations.length,sheet=createCanvas(64*count,64*8),ctx=sheet.getContext('2d');ctx.imageSmoothingEnabled=false;const offs=[],shad=[];const attack=/Attack|Strike|Shoot|Swing|Double|LeapForth/.test(name);
  for(let row=0;row<8;row++){offs[row]=[];shad[row]=[];for(let col=0;col<count;col++){
   const pose=attack?(col<count*.4?2:col<count*.8?3:0):col%2,frame=moving?walk[row][col]:frames[row][pose],w=Math.round(frame.width*scale),h=Math.round(frame.height*scale);
   ctx.save();if(/Faint|LostBalance/.test(name))ctx.globalAlpha=Math.max(0,1-col/count);ctx.drawImage(frame.canvas,frame.left,frame.top,frame.width,frame.height,col*64+32-Math.floor(w/2),row*64+58-h,w,h);ctx.restore();
   offs[row][col]={head:{x:32,y:24},center:{x:32,y:40},lh:{x:22,y:40},rh:{x:42,y:40},centroid:{x:32,y:40}};shad[row][col]={centroid:{x:32,y:58},center:{x:32,y:58}};
  }}
  const stem=name;anims[name]={...animation,w:64,h:64,file:stem+'-Anim.png'};baked[stem]={offs,shad};const bytes=sheet.toBuffer('image/png');await writeFile('public/baked2/'+dex+'/'+stem+'.png',bytes);await writeFile('public/assets/sprites/'+dex+'/'+stem+'-Anim.png',bytes);
  if(name==='Idle'){const portrait=createCanvas(40,40),pc=portrait.getContext('2d');pc.imageSmoothingEnabled=false;pc.drawImage(sheet,0,0,64,64,0,0,40,40);await writeFile('public/assets/portraits/'+dex+'_Normal.png',portrait.toBuffer('image/png'));}
 }
 metadata[dex]={shadowSize:1,anims};await writeFile('public/baked2/'+dex+'.json',JSON.stringify(baked));console.log('Baked',asset.key,Object.keys(anims).length,'animations');
}
await writeFile('public/assets/sprites/anims.json',JSON.stringify(metadata));
