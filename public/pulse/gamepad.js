/** Standard Gamepad mapping, including DualSense over Bluetooth. */
export function gamepadFrame(pad,previous=[],previousDirection=0){
 const pressed=i=>!!pad.buttons[i]?.pressed,edge=i=>pressed(i)&&!previous[i],commands=[];
 const x=Number(pad.axes[0])||0,y=Number(pad.axes[1])||0;
 const dx=pressed(15)?1:pressed(14)?-1:x,dy=pressed(13)?1:pressed(12)?-1:y;
 const direction=Math.hypot(dx,dy)<.22?0:1+((Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8);
 if(direction!==previousDirection)commands.push({kind:'steer',dir:direction});
 for(let i=0;i<4;i++)if(edge(i))commands.push({kind:'move',index:i});
 for(const [index,kind]of [[4,'guard'],[5,'dodge'],[7,'mega'],[9,'pause'],[8,'manual']])if(edge(index))commands.push({kind});
 if(edge(6))commands.push({kind:'reserve'});
 return{commands,direction,pressed:pad.buttons.map(b=>!!b.pressed)};
}
function menuControls(pad,prior,now,last){
 const down=i=>!!pad.buttons[i]?.pressed,edge=i=>down(i)&&!prior[i],x=down(15)?1:down(14)?-1:pad.axes[0]||0,y=down(13)?1:down(12)?-1:pad.axes[1]||0;
 const dx=Math.abs(x)>.5?Math.sign(x):0,dy=Math.abs(y)>.5?Math.sign(y):0,dir=dx+','+dy;
 const scope=document.querySelector('dialog[open]')||document;
 const choices=[...scope.querySelectorAll('button,input:not([type=file]),select,summary')].filter(e=>{const r=e.getBoundingClientRect();return !e.disabled&&r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'});
 if(!choices.length)return last;
 let current=choices.includes(document.activeElement)?document.activeElement:null;
 if((dx||dy)&&(dir!==last.dir||now>=last.at)){
  if(!current)current=choices.find(e=>e.classList.contains('primary-button'))||choices[0];
  else if(current.tagName==='SELECT'&&dx&&!dy){current.selectedIndex=Math.max(0,Math.min(current.options.length-1,current.selectedIndex+dx));current.dispatchEvent(new Event('change',{bubbles:true}));}
  else {const a=current.getBoundingClientRect(),ax=a.x+a.width/2,ay=a.y+a.height/2;let best=null,score=Infinity;
   for(const e of choices){if(e===current)continue;const b=e.getBoundingClientRect(),vx=b.x+b.width/2-ax,vy=b.y+b.height/2-ay,forward=vx*dx+vy*dy;if(forward<=1)continue;const cross=Math.abs(vx*dy-vy*dx),value=forward+cross*3;if(value<score){score=value;best=e;}}
   current=best||current;
  }
  current.focus();current.scrollIntoView({block:'nearest',inline:'nearest'});last={dir,at:now+(dir===last.dir?140:300)};
 }else if(!dx&&!dy)last={dir:'0,0',at:0};
 if(edge(0)){current||=choices.find(e=>e.classList.contains('primary-button'))||choices[0];current.focus();current.click();}
 if(edge(1))window.dispatchEvent(new Event('pulse-native-back'));
 return last;
}
export function bindGamepad({getSnapshot,command,pause,getPads=()=>navigator.getGamepads?.()||[],raf=requestAnimationFrame,cancel=cancelAnimationFrame}){
 let frame,prior=[],direction=0,activeIndex=null,running=false,menu={dir:'0,0',at:0};
 const release=()=>{if(direction)command({kind:'steer',dir:0});direction=0;};
 const loop=now=>{const s=getSnapshot(),pad=[...getPads()].find(p=>p?.connected&&p.mapping==='standard');
  if(document.hidden||!pad){release();prior=[];activeIndex=null;running=false;frame=raf(loop);return;}
  if(activeIndex!==pad.index){prior=pad.buttons.map(b=>!!b.pressed);activeIndex=pad.index;}
  if(s?.state!=='running'||document.querySelector('dialog[open]')){release();running=false;menu=menuControls(pad,prior,now,menu);prior=pad.buttons.map(b=>!!b.pressed);frame=raf(loop);return;}
  if(!running){prior=pad.buttons.map(b=>!!b.pressed);running=true;}
  const next=gamepadFrame(pad,prior,direction);prior=next.pressed;direction=next.direction;
  for(const action of next.commands){
   if(action.kind==='pause'){pause();continue;}
   if(action.kind==='reserve'){const reserve=s.bench?.find(x=>!x.active&&!x.fainted);if(reserve)command({kind:'switch',to:reserve.index});continue;}
   if(action.kind==='steer'&&!s.manual){if(action.dir)command({kind:'manual',on:true});else continue;}
   command(action);
  }
  frame=raf(loop);
 };frame=raf(loop);return()=>{cancel(frame);release();};
}
