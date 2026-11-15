import {INITIAL_PARTNERS} from './campaign.js';
/** Focused first-run selection; committing it is a progression transaction. */
export async function chooseInitialPartner(progression){
 if(progression.getSave().journey?.starter)return;
 const catalog=progression.getCatalog();
 const dialog=document.createElement('dialog');dialog.className='sheet-dialog starter-dialog';dialog.setAttribute('aria-labelledby','starter-title');
 dialog.innerHTML='<h1 id="starter-title">Todo treinador começa com um parceiro.</h1><p>Conheça os seis iniciais de Kanto e Johto. Deslize para escolher seu parceiro.</p><div class="starter-options"></div><p class="starter-status" role="status"></p><button class="primary-button" disabled>Confirmar parceiro</button>';
 const descriptions={bulbasaur:'Planta e Veneno · Controle e recuperação',charmander:'Fogo · Pressão ofensiva',squirtle:'Água · Resistência e posicionamento',chikorita:'Planta · Suporte e defesa',cyndaquil:'Fogo · Ataques especiais',totodile:'Água · Ataque físico'};let selected=null,frameId;
 const sheets=[];
 for(const key of INITIAL_PARTNERS){const m=catalog.find(x=>x.key===key);if(!m)throw Error('Parceiro inicial indisponível: '+key);const button=document.createElement('button');button.type='button';button.className='starter-option';button.setAttribute('aria-pressed','false');button.innerHTML=`<canvas width="160" height="160" aria-hidden="true"></canvas><strong>${m.name}</strong><small>${descriptions[key]}</small>`;button.onclick=()=>{selected=key;for(const b of dialog.querySelectorAll('.starter-option'))b.setAttribute('aria-pressed',String(b===button));dialog.querySelector('.primary-button').disabled=false;dialog.querySelector('.primary-button').textContent='Começar com '+m.name;};dialog.querySelector('.starter-options').append(button);const image=new Image();image.src='/'+m.icon.file;sheets.push({image,canvas:button.querySelector('canvas'),m});}
 const nativeBack=()=>window.PulseNative?.exitApp();window.addEventListener('pulse-native-back',nativeBack);
 document.body.append(dialog);dialog.addEventListener('cancel',e=>e.preventDefault());dialog.showModal();
 const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const draw=t=>{for(const {image,canvas,m}of sheets){if(!image.complete||!image.naturalWidth)continue;const c=canvas.getContext('2d');c.clearRect(0,0,160,160);c.imageSmoothingEnabled=false;const {w,h}=m.icon,scale=Math.min(3,140/h),frame=reduced?0:Math.floor(t/120)%Math.floor(image.width/w);c.drawImage(image,frame*w,0,w,h,80-w*scale/2,80-h*scale/2,w*scale,h*scale);}if(dialog.open)frameId=requestAnimationFrame(draw);};frameId=requestAnimationFrame(draw);
 await new Promise(resolve=>{dialog.querySelector('.primary-button').onclick=()=>{const result=progression.chooseStarter(selected);if(!result.ok){dialog.querySelector('.starter-status').textContent=result.error;return;}cancelAnimationFrame(frameId);window.removeEventListener('pulse-native-back',nativeBack);dialog.close();dialog.remove();resolve();};});
}
