/** Animate a real, bundled PB sprite without importing the battle engine. */
export async function animatePartner(canvas,mon,{reduced=false}={}){
 let stopped=false,raf=0;const image=new Image();image.src='/'+mon.icon.file;
 await image.decode();const {w,h}=mon.icon,cols=Math.floor(image.width/w),c=canvas.getContext('2d');
 const sample=document.createElement('canvas');sample.width=image.width;sample.height=h;const s=sample.getContext('2d',{willReadFrequently:true});s.drawImage(image,0,0);const d=s.getImageData(0,0,image.width,h).data;let x0=w,y0=h,x1=0,y1=0;
 for(let y=0;y<h;y++)for(let x=0;x<image.width;x++)if(d[(y*image.width+x)*4+3]>20){x0=Math.min(x0,x%w);x1=Math.max(x1,x%w);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 const bw=x1-x0+1,bh=y1-y0+1;
 const draw=t=>{if(stopped||!canvas.isConnected)return;c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;const scale=Math.min((canvas.width-24)/bw,(canvas.height-24)/bh,8),frame=reduced?0:Math.floor(t/110)%cols;c.drawImage(image,frame*w+x0,y0,bw,bh,(canvas.width-bw*scale)/2,canvas.height-12-bh*scale,bw*scale,bh*scale);if(!reduced)raf=requestAnimationFrame(draw);};raf=requestAnimationFrame(draw);return()=>{stopped=true;cancelAnimationFrame(raf);};
}
