import {animatePartner} from './sprites.js';
import {ITEMS,EVOLUTIONS,xpAt,specialPool,moveRequirement} from './growth.js';
import {CHAPTER_ONE} from './campaign.js';
import {icon} from './icons.js';
export function createManagementUI({p,save,mon,portrait,tags,esc,navigate,notify,apply,movePicker,launchStage,drawTechnique,goBack}){
 const $=id=>document.getElementById(id);
 let partner=null,tab='attributes',slot=0,bagItem='oranberry',selectedStage=null,stops=[],partnerStop,worldToken=0,invocation='pokemon';
 const stopSprites=()=>{worldToken++;for(const stop of stops)stop?.();stops=[];partnerStop?.();partnerStop=null;};
 const animate=async(canvas,key)=>{const token=worldToken;try{const stop=await animatePartner(canvas,mon(key),{reduced:matchMedia('(prefers-reduced-motion:reduce)').matches});if(canvas.isConnected&&token===worldToken)stops.push(stop);else stop();}catch{}};
 const openPartner=(key,section='attributes')=>{partner=key;tab=section;navigate('partner');};
 function renderTeam(){
  stopSprites();const s=save(),team=p.getTeam();slot=Math.min(slot,team.mons.length<6?team.mons.length:5);
  $('team-count').textContent=`${team.mons.length} / 6 parceiros`;
  $('team-list').innerHTML=Array.from({length:6},(_,i)=>{const key=team.mons[i],m=key&&mon(key);return `<button class="formation-slot ${m?'team-member':'empty-slot'} ${i===slot?'selected':''}" data-formation-slot="${i}" aria-label="${m?esc(m.name):'Adicionar parceiro'}, posição ${i+1}" aria-pressed="${i===slot}"><span class="slot-number">${i===0?'Inicial':`Reserva ${i}`}</span>${m?`<canvas id="formation-sprite-${i}" width="160" height="140" aria-hidden="true"></canvas><b>${esc(m.name)}</b><small>Nv. ${m.level}${m.heldItem?' · Item equipado':''}</small>`:`<span class="empty-slot-mark">${icon('team')}</span><b>Adicionar</b>`}</button>`;}).join('');
  const key=team.mons[slot],m=key&&mon(key);
  $('formation-detail').innerHTML=m?`<div class="formation-selected">${portrait(m)}<div><h2>${esc(m.name)}</h2><span class="type-list">${tags(m)}</span><p>Nível ${m.level} · ${slot===0?'Abre a batalha':'Entra como reserva'}</p></div></div><div class="formation-command-list"><button data-partner="${key}" class="primary-button">Treinar e ver golpes</button><button data-formation-lead="${slot}" class="secondary-button" ${slot===0?'disabled':''}>Colocar como inicial</button><button data-formation-remove="${slot}" class="text-button" ${team.mons.length===1?'disabled':''}>Retirar da formação</button></div><p class="support-copy">Selecione um parceiro abaixo para trocar esta posição.</p>`:'<h2>Complete sua equipe</h2><p>Escolha um parceiro da coleção abaixo.</p>';
  $('formation-roster').innerHTML=s.unlocked.map(key=>{const m=mon(key),position=team.mons.indexOf(key);return `<button class="roster-thumb ${position>=0?'in-team':''}" data-roster-add="${key}" aria-label="Selecionar ${esc(m.name)}">${portrait(m)}<span>${esc(m.name)}</span><small>Nv. ${m.level}${position>=0?' · Na equipe':''}</small></button>`;}).join('');
  team.mons.forEach((key,i)=>animate($('formation-sprite-'+i),key));
 }
 function renderPartner(){
  partner||=save().favorite;const m=mon(partner);if(!m){navigate('collection');return;}
  $('partner-name').textContent=m.name;$('partner-level').textContent=`Nv. ${m.level}`;$('partner-types').innerHTML=tags(m);
  const value=(m.xp??0)-xpAt(m.level),max=Math.max(1,xpAt(Math.min(100,m.level+1))-xpAt(m.level));
  $('partner-xp').innerHTML=`<progress max="${max}" value="${m.level===100?1:value}" aria-label="Experiência de ${esc(m.name)}"></progress><span>${m.level===100?'Nível máximo':`${value} / ${max} XP para o próximo nível`}</span>`;
  document.querySelectorAll('[data-partner-tab]').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.partnerTab===tab)));
  const box=$('partner-panel');
  if(tab==='attributes')box.innerHTML=`<h2>Seu parceiro</h2><p>Os atributos crescem com o nível. Batalhas e campanha rendem experiência.</p><div class="partner-stats">${Object.entries(m.stats).map(([key,value])=>`<div><span>${{hp:'HP base',atk:'Ataque',def:'Defesa',spa:'Atq. especial',spd:'Def. especial',spe:'Velocidade'}[key]}</span><b>${value}</b><i style="--stat:${Math.min(100,value/180*100)}%"></i></div>`).join('')}</div>${m.mega?`<label class="mega-label"><input type="checkbox" data-mega="${save().team.mons.indexOf(m.key)}" ${save().team.gimmick?.mon===save().team.mons.indexOf(m.key)?'checked':''} ${save().team.mons.includes(m.key)?'':'disabled'}>Selecionar Mega para a batalha${save().team.mons.includes(m.key)?'':' · adicione à formação'}</label>`:''}<div class="partner-actions"><button data-favorite="${m.key}" class="secondary-button">${save().favorite===m.key?'Favorito no início':'Destacar no início'}</button><button data-route="team" class="primary-button">Ver formação</button></div>`;
  if(tab==='moves'){
   const selected=p.getTeam().moves[m.key]||p.getMoves(m.key).slice(0,4).map(m=>m.id),learned=new Set(m.learned);
   const row=move=>`<label class="move-option"><input type="checkbox" name="move" value="${esc(move.id)}" ${selected.includes(move.id)?'checked':''} ${learned.has(move.id)?'':'disabled'}><span><b>${esc(move.name)}</b><small>${learned.has(move.id)?`${move.power?`Poder ${move.power}`:'Efeito'} · ${(move.cd/60).toFixed(1)}s`:esc(moveRequirement(m.key,move.id))}</small></span><span class="type-tag">${esc(move.type)}</span></label>`;
   box.innerHTML=`<div class="partner-panel-heading"><h2>Golpes de ${esc(m.name)}</h2><button data-technique-for="${m.key}" class="text-button">Invocar técnica</button></div><p>Escolha até quatro golpes aprendidos.</p><form id="moves-form" data-mon="${m.key}"><div class="move-list">${m.pool.filter(move=>learned.has(move.id)).map(row).join('')}</div><details class="locked-moves"><summary>Próximos golpes e técnicas (${m.pool.filter(move=>!learned.has(move.id)).length})</summary>${m.pool.filter(move=>!learned.has(move.id)).map(row).join('')}</details><div class="move-save"><button class="primary-button">Salvar golpes</button></div></form>`;
  }
  if(tab==='evolution'){
   const edge=EVOLUTIONS[m.key],target=edge&&mon(edge[0]),plan=p.previewEvolution(m.key);
   box.innerHTML=target?`<h2>Evolução</h2><p class="evolution-condition ${plan?'ready':''}">${plan?'Pronto para evoluir em batalha!':`Requer nível ${edge[1]} · faltam ${Math.max(0,edge[1]-m.level)} níveis.`}</p><div class="evolution-path"><div>${portrait(m)}<b>${esc(m.name)}</b></div><span>${icon('dash')}</span><div>${portrait(target)}<b>${esc(target.name)}</b></div></div><details class="evolution-help"><summary>Como funciona a evolução?</summary><p>Ao atingir o nível, entre em batalha e toque em <strong>EVOLUIR</strong>. A evolução é permanente e mantém a experiência e os golpes compatíveis.</p></details><button class="evolution-go primary-button" data-route="campaign">Ir para a campanha</button>`:'<h2>Evolução</h2><div class="evolution-final">'+portrait(m)+'<p>Este parceiro já está na última evolução disponível.</p></div>';
  }
  if(tab==='item'){
   const held=m.heldItem,item=held&&ITEMS[held];box.innerHTML=`<h2>Item equipado</h2>${item?`<div class="partner-held"><img src="/pulse/assets/items/${held}.png" alt=""><div><h3>${item.name}</h3><p>${item.description}</p></div></div><button data-unequip="${m.key}" class="secondary-button">Devolver à mochila</button>`:'<p>Nenhum item equipado. Uma berry pode ajudar no próximo duelo.</p>'}<button data-bag-for="${m.key}" class="primary-button">Abrir mochila para ${esc(m.name)}</button>`;
  }
  stopSprites();animate($('partner-sprite'),m.key);
 }
 function renderBag(){
  const s=save(),g=s.growth;if(!g)return;
  $('bag-balls').textContent=`${s.journey?.inventory.pokeball||0} Poké Balls`;
  const entries=[['pokeball',{name:'Poké Ball'}],['moveTicket',{name:'Ticket de técnica'}],...Object.entries(ITEMS)];
  $('bag-items').innerHTML=entries.map(([id,item])=>`<button class="inventory-slot ${bagItem===id?'selected':''}" data-inventory-item="${id}" aria-pressed="${bagItem===id}">${ITEMS[id]?`<img src="/pulse/assets/items/${id}.png" alt="">`:`<span class="inventory-symbol">${icon(id==='moveTicket'?'ticket':'pokeball')}</span>`}<b>${item.name}</b><small>× ${id==='pokeball'?s.journey?.inventory.pokeball||0:g.inventory[id]||0}</small></button>`).join('');
  const detail=$('inventory-detail');
  if(bagItem==='moveTicket'){detail.innerHTML=`<div class="inventory-item-hero">${icon('ticket')}</div><h2>Ticket de técnica</h2><p>Aprenda uma técnica especial compatível com um parceiro. Cada invocação consome 1 ticket e não repete golpes já conhecidos.</p><p class="inventory-count">${g.inventory.moveTicket} disponíveis</p><button data-technique-for="${partner||s.favorite}" class="primary-button">Ir para invocação de técnicas</button>`;return;}
  if(bagItem==='pokeball'){detail.innerHTML=`<div class="inventory-item-hero">${icon('pokeball')}</div><h2>Poké Ball</h2><p>Use em encontros selvagens da campanha. Enfraquecer o Pokémon aumenta a chance de captura.</p><p class="inventory-count">${s.journey?.inventory.pokeball||0} disponíveis</p><button data-route="shop" class="primary-button">Comprar na loja</button>`;return;}
  const item=ITEMS[bagItem],owner=partner&&s.unlocked.includes(partner)?partner:s.team.mons[0];
  detail.innerHTML=`<img class="inventory-item-hero" src="/pulse/assets/items/${bagItem}.png" alt=""><h2>${item.name}</h2><p>${item.description}</p><p class="inventory-count">${g.inventory[bagItem]} na mochila</p><label class="inventory-owner-label">Equipar em<select id="inventory-owner">${s.unlocked.map(key=>`<option value="${key}" ${key===owner?'selected':''}>${esc(mon(key).name)} · Nv. ${mon(key).level}</option>`).join('')}</select></label><button id="inventory-equip" class="primary-button" ${g.inventory[bagItem]<1?'disabled':''}>Equipar item</button><button data-route="shop" class="text-button">Obter mais itens na loja</button>`;
  $('inventory-equip').onclick=()=>{if(apply(p.equipItem($('inventory-owner').value,bagItem))){notify('Item equipado.');renderBag();}};
 }
 const positions=[[20,76],[29,66],[38,66],[46,61],[57,58],[67,62],[76,57],[82,45],[90,30],[90,12]];
 function renderCampaign(){
  const s=save(),j=s.journey;selectedStage||=j?.active?.stage||CHAPTER_ONE[Math.min(j?.cleared.length||0,9)].id;
  $('chapter-list').innerHTML=CHAPTER_ONE.map((stage,i)=>{const cleared=j?.cleared.includes(stage.id),locked=!j?.starter||i>j.cleared.length;return `<button class="map-stage ${cleared?'cleared':''} ${locked?'locked':''} ${selectedStage===stage.id?'selected':''}" style="--x:${positions[i][0]}%;--y:${positions[i][1]}%" data-map-stage="${stage.id}" ${locked?'disabled':''} aria-label="Fase ${stage.id}, ${cleared?'concluída':locked?'bloqueada':stage.title}"><span>${stage.badge?icon('badge'):cleared?icon('check'):stage.id}</span><b>${stage.id}</b></button>`;}).join('');
  requestAnimationFrame(()=>{const node=$('chapter-list').querySelector('.map-stage.selected'),view=$('chapter-list').parentElement;if(node){view.scrollLeft=node.offsetLeft-view.clientWidth/2;view.scrollTop=node.offsetTop-view.clientHeight/2;}});
  const stage=CHAPTER_ONE.find(x=>x.id===selectedStage);$('campaign-progress').textContent=`${j?.cleared.length||0} / 10 fases concluídas`;
  $('stage-detail').innerHTML=`<div class="stage-summary"><div class="stage-trainer"><img src="/pulse/assets/trainers/${stage.trainer}.png" alt=""><span>Fase ${stage.id}</span></div><h2>${stage.title}</h2><div class="stage-reward">${j?.cleared.includes(stage.id)?'Repetição: XP e progresso para tickets':`${stage.firstClearCoins} moedas · 1 ticket · ${300+CHAPTER_ONE.indexOf(stage)*180} XP`}</div><div class="stage-opponents">${stage.opponents.map(key=>portrait(mon(key))).join('')}</div><p>Adversários · Nv. ${5+CHAPTER_ONE.indexOf(stage)*2}${stage.wild?' · Encontro selvagem no caminho':''}</p>${stage.badge?'<p>Primeira vitória: Insígnia Rocha.</p>':''}</div><button id="campaign-enter" class="primary-button">${j?.active?.stage===stage.id?'Retomar fase':j?.cleared.includes(stage.id)?'Jogar novamente':'Entrar na fase'} ${icon('dash')}</button>`;
  $('campaign-enter').onclick=()=>launchStage(stage.id);
 }
 function renderTechniques(){
  const s=save(),g=s.growth;if(!g)return;
  const select=$('technique-mon'),previous=select.value||partner||s.favorite;
  select.innerHTML=s.unlocked.map(key=>`<option value="${key}">${esc(mon(key).name)} · Nv. ${mon(key).level}</option>`).join('');if(s.unlocked.includes(previous))select.value=previous;
  const key=select.value,pool=key?specialPool(s,key,mon(key)):[];
  $('ticket-budget').textContent=`${g.inventory.moveTicket} tickets · ${g.ticketWins}/3 vitórias para o próximo`;
  $('technique-spin').disabled=!pool.length||!g.inventory.moveTicket;
  $('technique-pool').textContent=pool.length?`${pool.map(id=>mon(key).pool.find(m=>m.id===id).name).join(', ')}. Chance de cada golpe: ${(100/pool.length).toFixed(2)}%.`:'Todas as técnicas especiais disponíveis já foram aprendidas.';
  $('technique-partner').innerHTML=key?portrait(mon(key)):'';
 }
 function setInvocation(mode){invocation=mode;$('pokemon-invocation').hidden=mode!=='pokemon';$('technique-invocation').hidden=mode!=='techniques';document.querySelectorAll('[data-invocation-mode]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.invocationMode===mode)));if(mode==='techniques')renderTechniques();}
 document.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.menuBack){goBack();return;}
  if(b.dataset.partner){openPartner(b.dataset.partner);return;}
  if(b.dataset.partnerTab){tab=b.dataset.partnerTab;renderPartner();}
  if(b.dataset.inventoryItem){bagItem=b.dataset.inventoryItem;renderBag();}
  if(b.dataset.bagFor){partner=b.dataset.bagFor;navigate('bag');}
  if(b.dataset.techniqueFor){partner=b.dataset.techniqueFor;navigate('summon');setInvocation('techniques');$('technique-mon').value=partner;renderTechniques();}
  if(b.dataset.invocationMode)setInvocation(b.dataset.invocationMode);
  if(b.dataset.mapStage){selectedStage=b.dataset.mapStage;renderCampaign();}
  if(b.dataset.formationSlot!==undefined){const i=Number(b.dataset.formationSlot);slot=Math.min(i,save().team.mons.length);renderTeam();}
  if(b.dataset.rosterAdd){const team=p.getTeam(),key=b.dataset.rosterAdd,prior=team.mons.indexOf(key);if(prior>=0&&slot<team.mons.length)[team.mons[slot],team.mons[prior]]=[team.mons[prior],team.mons[slot]];else if(prior<0){if(slot<team.mons.length)team.mons[slot]=key;else if(team.mons.length<6)team.mons.push(key);}team.gimmick=null;apply(p.setTeam(team));}
  if(b.dataset.formationLead!==undefined){const team=p.getTeam(),i=Number(b.dataset.formationLead);[team.mons[0],team.mons[i]]=[team.mons[i],team.mons[0]];team.gimmick=null;slot=0;apply(p.setTeam(team));}
  if(b.dataset.formationRemove!==undefined){const team=p.getTeam();if(team.mons.length>1){team.mons.splice(Number(b.dataset.formationRemove),1);team.gimmick=null;apply(p.setTeam(team));}}
 });
 return {addSlot(){slot=Math.min(5,save().team.mons.length);renderTeam();$('formation-roster').scrollIntoView({block:'nearest'});},renderTeam,renderPartner,renderBag,renderCampaign,renderTechniques,openPartner,setInvocation,stopSprites,partner:()=>partner};
}
