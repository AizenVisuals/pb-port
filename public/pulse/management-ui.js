import {animatePartner} from './sprites.js';
import {ITEMS,EVOLUTIONS,STONES,STONE_EVOLUTIONS,SPECIAL_EVOLUTIONS,MINTS,xpAt,specialPool,moveRequirement,displayStats,natureLabel,natureName,STAT_KEYS} from './growth.js';
import {ivRerollCost,ECONOMY} from './progression.js';
import {LEARNSETS} from './learnsets.js';
import {CHAPTER_ONE,CHAPTER_TWO,ALL_STAGES} from './campaign.js';
import {icon} from './icons.js';
export function createManagementUI({p,save,mon,portrait,tags,types,esc,navigate,notify,apply,movePicker,launchStage,drawTechnique,goBack}){
 const $=id=>document.getElementById(id);
 const panels={};
 for(const [id,title] of [['formation-detail','Formação'],['inventory-detail','Mochila'],['stage-detail','Preparar batalha']]){
  const panel=$(id),sheet=document.createElement('dialog');sheet.className='sheet-dialog management-sheet';sheet.id=id+'-sheet';
  const header=document.createElement('header');header.className='dialog-heading';header.innerHTML=`<h2>${title}</h2><button class="icon-button" aria-label="Fechar">×</button>`;
  header.querySelector('button').onclick=()=>sheet.close();sheet.append(header,panel);document.body.append(sheet);panels[id]=sheet;
 }
 const openPanel=id=>{for(const dialog of Object.values(panels))if(dialog.open)dialog.close();panels[id].showModal();};
 const closePanels=()=>{for(const dialog of Object.values(panels))if(dialog.open)dialog.close();};
 let partner=null,tab='attributes',slot=0,bagItem='oranberry',selectedStage=null,selectedChapter=1,stops=[],partnerStop,worldToken=0,invocation='pokemon',mapHintShown=false;
 // Re-roll de IVs: travas por Pokémon (só vivem na sessão — não vão pro save).
 const ivLocksByMon={};
 const ivLocksFor=key=>ivLocksByMon[key]||(ivLocksByMon[key]={});
 // Aba "IVs" na tela do parceiro, ao lado de Atributos/Golpes/Evolução/Item.
 const partnerTabs=document.querySelector('.partner-tabs');
 if(partnerTabs&&!partnerTabs.querySelector('[data-partner-tab="iv-reroll"]')){const ivTab=document.createElement('button');ivTab.dataset.partnerTab='iv-reroll';ivTab.setAttribute('role','tab');ivTab.setAttribute('aria-selected','false');ivTab.textContent='IVs';partnerTabs.append(ivTab);}
 // Pílulas de tipo da folha 696 (Pokédex, 19 linhas de 32px) para a tela do
 // parceiro. Linha 9 é um tipo não usado (marcador); não há pílula para ela.
 const TYPE_PILL_696={normal:0,fighting:1,flying:2,poison:3,ground:4,rock:5,bug:6,ghost:7,steel:8,fire:10,water:11,grass:12,electric:13,psychic:14,ice:15,dragon:16,dark:17,fairy:18};
 const typePills696=m=>m.types.map(t=>`<span class="type-pill-696" style="background-position:0 ${-(TYPE_PILL_696[t]??0)*32}px" role="img" aria-label="${esc(types?.[t]||t)}"></span>`).join('');
 // Hexágono de stats no estilo oficial (ordem horária a partir do topo:
 // HP, Atq., Def., Vel., Def. Esp., Atq. Esp.). O polígono usa os stats no
 // nível atual, cada eixo proporcional ao maior stat do Pokémon; os rótulos
 // trazem o valor do stat e o IV (ex.: "HP 132" / "IV 31"). Não há EVs no
 // jogo — o hexágono mostra stats + IVs, como o oficial mostra a
 // distribuição dos stats.
 const IV_ORDER=['hp','atk','def','spe','spd','spa'];
 const IV_PT={hp:'HP',atk:'Atq.',def:'Def.',spa:'Atq. Esp.',spd:'Def. Esp.',spe:'Vel.'};
 const ivRadar=(stats,ivs)=>{
  const max=Math.max(1,...Object.values(stats)),cx=130,cy=100,R=68;
  const pt=(i,r)=>{const a=(i*60-90)*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)];};
  const ring=f=>IV_ORDER.map((_,i)=>pt(i,R*f).map(v=>v.toFixed(1)).join(',')).join(' ');
  const poly=IV_ORDER.map((s,i)=>pt(i,R*(stats[s]/max)).map(v=>v.toFixed(1)).join(',')).join(' ');
  const axes=IV_ORDER.map((_,i)=>{const [x,y]=pt(i,R);return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;}).join('');
  const dots=IV_ORDER.map((s,i)=>{const [x,y]=pt(i,R*(stats[s]/max));return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5"/>`;}).join('');
  const labels=IV_ORDER.map((s,i)=>{const [x,y]=pt(i,R+16);return `<text x="${x.toFixed(1)}" y="${(y-3).toFixed(1)}" text-anchor="middle" class="iv-radar-label">${IV_PT[s]} ${stats[s]}</text><text x="${x.toFixed(1)}" y="${(y+10).toFixed(1)}" text-anchor="middle" class="iv-radar-iv">IV ${ivs[s]??31}</text>`;}).join('');
  return `<svg class="iv-radar" viewBox="0 0 260 200" role="img" aria-label="Hexágono de stats e IVs">${[1,.75,.5,.25].map(f=>`<polygon points="${ring(f)}" class="iv-radar-ring"/>`).join('')}${axes}<polygon points="${poly}" class="iv-radar-poly"/>${dots}${labels}</svg>`;
 };
 const stopSprites=()=>{worldToken++;for(const stop of stops)stop?.();stops=[];partnerStop?.();partnerStop=null;};
 const animate=async(canvas,key)=>{const token=worldToken;try{const stop=await animatePartner(canvas,mon(key),{reduced:matchMedia('(prefers-reduced-motion:reduce)').matches});if(canvas.isConnected&&token===worldToken)stops.push(stop);else stop();}catch{}};
 const openPartner=(key,section='attributes')=>{partner=key;tab=section;navigate('partner');};
 function renderTeam(){
  stopSprites();const s=save(),team=p.getTeam();slot=Math.min(slot,team.mons.length<6?team.mons.length:5);
  $('team-count').textContent=`${team.mons.length} / 6 parceiros`;
  $('team-list').innerHTML=Array.from({length:6},(_,i)=>{const key=team.mons[i],m=key&&mon(key);return `<button class="formation-slot ${m?'team-member':'empty-slot'} ${i===slot?'selected':''}" data-formation-slot="${i}" aria-label="${m?esc(m.name):'Adicionar parceiro'}, posição ${i+1}" aria-pressed="${i===slot}"><span class="slot-number">${i===0?'Inicial':`Reserva ${i}`}</span>${m?`<canvas id="formation-sprite-${i}" width="160" height="140" aria-hidden="true"></canvas><b>${esc(m.name)}</b><small>Nv. ${m.level}${m.heldItem?' · Item equipado':''}</small>`:`<span class="empty-slot-mark">${icon('team')}</span><b>Adicionar</b>`}</button>`;}).join('');
  const key=team.mons[slot],m=key&&mon(key);
  $('formation-detail').innerHTML=m?`<div class="formation-selected">${portrait(m)}<div><h2>${esc(m.name)}</h2><span class="type-list">${tags(m)}</span><p>Nível ${m.level} · ${slot===0?'Abre a batalha':'Entra como reserva'}</p></div></div><div class="formation-command-list"><button data-partner="${key}" class="primary-button">Ver Pokémon</button><button data-formation-lead="${slot}" class="secondary-button" ${slot===0?'disabled title="Já abre a batalha"':''}>Liderar${slot===0?'<small>Já é o inicial</small>':''}</button><button data-formation-remove="${slot}" class="text-button" ${team.mons.length===1?'disabled title="A equipe precisa de ao menos um Pokémon"':''}>Retirar${team.mons.length===1?'<small>Único parceiro</small>':''}</button></div><button id="formation-swap" class="secondary-button">Escolher outro parceiro</button>`:'<h2>Posição livre</h2><p>Toque em um Pokémon da reserva abaixo.</p>';
  $('formation-roster').innerHTML=s.unlocked.map(key=>{const m=mon(key),position=team.mons.indexOf(key);return `<button class="roster-thumb ${position>=0?'in-team':''}" data-roster-add="${key}" aria-label="Selecionar ${esc(m.name)}">${portrait(m)}<span>${esc(m.name)}</span><small>Nv. ${m.level}${position>=0?' · Na equipe':''}</small></button>`;}).join('');
  team.mons.forEach((key,i)=>animate($('formation-sprite-'+i),key));
 }
 function renderPartner(){
  partner||=save().favorite;const m=mon(partner);if(!m){navigate('collection');return;}
  $('partner-name').textContent=m.name;$('partner-level').textContent=`Nv. ${m.level}`;$('partner-types').innerHTML=typePills696(m);
  const value=(m.xp??0)-xpAt(m.level),max=Math.max(1,xpAt(Math.min(100,m.level+1))-xpAt(m.level));
  $('partner-xp').innerHTML=`<progress max="${max}" value="${m.level===100?1:value}" aria-label="Experiência de ${esc(m.name)}"></progress><span>${m.level===100?'Nível máximo':`${value} / ${max} XP para o próximo nível`}</span>`;
  document.querySelectorAll('[data-partner-tab]').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.partnerTab===tab)));
  const box=$('partner-panel');
  if(tab==='attributes')box.innerHTML=`<h2>Atributos base</h2><div class="partner-stats">${Object.entries(m.stats).map(([key,value])=>`<div><span>${{hp:'HP base',atk:'Ataque',def:'Defesa',spa:'Atq. especial',spd:'Def. especial',spe:'Velocidade'}[key]}</span><b>${value}</b><i style="--stat:${Math.min(100,value/180*100)}%"></i></div>`).join('')}</div><h2>No nível ${m.level}</h2><div class="partner-stats">${Object.entries(displayStats(m.stats, m.level, {ivs:m.ivs,nature:m.effectiveNature})).map(([key,value])=>`<div><span>${{hp:'HP',atk:'Ataque',def:'Defesa',spa:'Atq. especial',spd:'Def. especial',spe:'Velocidade'}[key]}</span><b>${value}</b><i style="--stat:${Math.min(100,value/180*100)}%"></i></div>`).join('')}</div>${m.nature?`<p>Nature: <b>${esc(natureLabel(m.effectiveNature||m.nature))}</b>${m.mintNature?` · Mint ${esc(natureName(m.mintNature))} em efeito — nature original: ${esc(natureName(m.nature))}`:''}</p><p>IVs: ${['hp','atk','def','spa','spd','spe'].map(s=>`${{hp:'HP',atk:'Atq.',def:'Def.',spa:'Atq. Esp.',spd:'Def. Esp.',spe:'Vel.'}[s]} ${m.ivs?.[s]??31}`).join(' · ')}</p>`:''}${m.mega?`<label class="mega-label"><input type="checkbox" data-mega="${save().team.mons.indexOf(m.key)}" ${save().team.gimmick?.mon===save().team.mons.indexOf(m.key)?'checked':''} ${save().team.mons.includes(m.key)?'':'disabled'}>Selecionar Mega para a batalha${save().team.mons.includes(m.key)?'':' · adicione à formação'}</label>`:''}<div class="partner-actions"><button data-favorite="${m.key}" class="secondary-button">${save().favorite===m.key?'Favorito no início':'Destacar no início'}</button><button data-route="team" class="primary-button">Ver formação</button>${m.nature?`<button data-iv-reroll-tab="${m.key}" class="secondary-button">Re-rolar IVs</button>`:''}</div>`;
  if(tab==='moves'){
   const selected=p.getTeam().moves[m.key]||p.getMoves(m.key).slice(0,4).map(m=>m.id),learned=new Set(m.learned);
   const row=move=>`<label class="move-option"><input type="checkbox" name="move" value="${esc(move.id)}" ${selected.includes(move.id)?'checked':''} ${learned.has(move.id)?'':'disabled'}><span><b>${esc(move.name)}</b><small>${learned.has(move.id)?`${move.power?`Poder ${move.power}`:'Efeito'} · ${(move.cd/60).toFixed(1)}s`:esc(moveRequirement(m.key,move.id))}</small></span><span class="type-tag">${esc(move.type)}</span></label>`;
   box.innerHTML=`<div class="partner-panel-heading"><h2>Golpes de ${esc(m.name)}</h2><button data-technique-for="${m.key}" class="text-button">Obter TM</button></div><p>Equipe até quatro golpes.</p><form id="moves-form" data-mon="${m.key}"><div class="move-list">${m.pool.filter(move=>learned.has(move.id)).map(row).join('')}</div><details class="locked-moves"><summary>Golpes por aprender (${m.pool.filter(move=>!learned.has(move.id)).length})</summary>${m.pool.filter(move=>!learned.has(move.id)).map(row).join('')}</details><div class="move-save"><button class="primary-button">Salvar golpes</button></div></form>`;
  }
  if(tab==='evolution'){
   const edge=EVOLUTIONS[m.key],target=edge&&mon(edge[0]),plan=p.previewEvolution(m.key);
   const stones=Object.entries(STONE_EVOLUTIONS[m.key]||{}),specials=SPECIAL_EVOLUTIONS[m.key]||[],catalysts=save().growth.stoneInventory?.['evolution-catalyst']||0;
   const stoneHtml=stones.map(([stone,to])=>{const t=mon(to),owned=(save().growth.stoneInventory||{})[stone]||0;return `<div class="evolution-path"><div>${portrait(m)}<b>${esc(m.name)}</b></div><span>${icon('dash')}</span><div>${portrait(t)}<b>${esc(t.name)}</b></div></div><p class="evolution-condition ${owned?'ready':''}">${owned?`${STONES[stone].name} na mochila — pronto para usar.`:`Precisa de ${STONES[stone].name} · ${STONES[stone].price} moedas na loja.`}</p><button class="evolution-go primary-button" data-use-stone="${stone}:${m.key}" ${owned<1?'disabled':''}>Usar ${STONES[stone].name}</button><p class="support-copy">A pedra é consumida ao usar. A evolução é permanente e mantém a experiência e os golpes compatíveis.</p>`;}).join('');
   const specialHtml=specials.map(route=>{const t=mon(route.target);return t?`<div class="special-evolution"><div class="evolution-path"><div>${portrait(m)}<b>${esc(m.name)}</b></div><span>${icon('dash')}</span><div>${portrait(t)}<b>${esc(t.name)}</b></div></div><p class="evolution-condition ${catalysts?'ready':''}"><b>Condição original:</b> ${esc(route.condition)}<br><span>Adaptação PULSE: 1 Catalisador Evolutivo.</span></p><button class="evolution-go primary-button" data-use-catalyst="${m.key}:${route.target}" ${catalysts<1?'disabled':''}>Evoluir com catalisador</button></div>`:'';}).join('');
   box.innerHTML=(target?`<h2>Evolução</h2><p class="evolution-condition ${plan?'ready':''}">${plan?'Pronto para evoluir em batalha!':`Requer nível ${edge[1]} · faltam ${Math.max(0,edge[1]-m.level)} níveis.`}</p><div class="evolution-path"><div>${portrait(m)}<b>${esc(m.name)}</b></div><span>${icon('dash')}</span><div>${portrait(target)}<b>${esc(target.name)}</b></div></div><details class="evolution-help"><summary>Como funciona a evolução?</summary><p>Ao atingir o nível da evolução, ela acontece sozinha, na hora — sem botão e sem espera. A evolução é permanente e mantém a experiência e os golpes compatíveis.</p></details><button class="evolution-go primary-button" data-route="campaign">Ir para a campanha</button>`:'<h2>Evolução</h2>'+(!stones.length&&!specials.length?'<div class="evolution-final">'+portrait(m)+'<p>Este parceiro já está na última evolução disponível.</p></div>':''))+stoneHtml+specialHtml;
  }
  if(tab==='item'){
   const held=m.heldItem,item=held&&ITEMS[held];box.innerHTML=`<h2>Item equipado</h2>${item?`<div class="partner-held"><img src="/pulse/assets/items/${held}.png" alt=""><div><h3>${item.name}</h3><p>${item.description}</p></div></div><button data-unequip="${m.key}" class="secondary-button">Devolver à mochila</button>`:'<p>Nenhum item equipado. Uma berry pode ajudar no próximo duelo.</p>'}<button data-bag-for="${m.key}" class="primary-button">Escolher item</button>`;
  }
  if(tab==='iv-reroll'){
   const s=save(),locks=ivLocksFor(partner),lockedCount=Object.values(locks).filter(Boolean).length;
   const cost=ivRerollCost(lockedCount),affordable=(s.diamonds||0)>=cost,allLocked=lockedCount>=6;
   if(!m.ivs){box.innerHTML=`<h2>Re-rolar IVs</h2><p>Inicie a jornada para sortear os IVs deste parceiro.</p><div class="partner-actions"><button data-partner-tab="attributes" class="secondary-button">Voltar aos atributos</button></div>`;}
   else{
    const stats=displayStats(m.stats,m.level,{ivs:m.ivs,nature:m.effectiveNature});
    const totalIV=Object.values(m.ivs).reduce((a,b)=>a+b,0);
    box.innerHTML=`<h2>Re-rolar IVs</h2><p>O hexágono mostra os stats no nível ${m.level} — cada eixo vai até o maior stat atual. Toque no cadeado para travar um IV: ele mantém o valor e só os destravados são sorteados de novo (0–31).</p><div class="iv-reroll">${ivRadar(stats,m.ivs)}<div class="iv-lock-list">${STAT_KEYS.map(stat=>`<div class="iv-lock-row ${locks[stat]?'locked':''}"><span class="iv-lock-name">${IV_PT[stat]}</span><span class="iv-lock-values"><b>${stats[stat]}</b> · IV <b>${m.ivs[stat]??31}</b></span><button data-iv-lock="${stat}" class="iv-lock-button" aria-pressed="${!!locks[stat]}" aria-label="${locks[stat]?'Destravar':'Travar'} IV de ${IV_PT[stat]}">${icon(locks[stat]?'lock':'unlock')}</button></div>`).join('')}</div></div><p class="iv-reroll-cost">Custo: <b>${cost} diamantes</b> · ${ECONOMY.ivReroll.base} base + ${ECONOMY.ivReroll.perLock} por IV travado (${lockedCount} travado${lockedCount===1?'':'s'}) · Saldo: <b>${(s.diamonds||0).toLocaleString('pt-BR')}</b> diamantes · Total de IVs: <b>${totalIV}/186</b></p>${allLocked?'<p class="iv-reroll-warning">Trave no máximo 5 IVs — com todos travados não há nada para sortear.</p>':''}${!allLocked&&!affordable?'<p class="iv-reroll-warning">Diamantes insuficientes — consiga mais com duplicatas nas invocações.</p>':''}<div class="partner-actions"><button data-iv-reroll-go="${m.key}" class="primary-button" ${allLocked||!affordable?'disabled':''}>Re-rolar IVs · ${cost} ${icon('diamond')}</button><button data-partner-tab="attributes" class="secondary-button">Voltar aos atributos</button></div><p class="support-copy">Os IVs travados mantêm o valor. Os demais são sorteados de novo e os stats são recalculados na hora — valem na próxima batalha. A evolução mantém os IVs.</p>`;
   }
  }
  stopSprites();animate($('partner-sprite'),m.key);
 }
 function renderBag(){
  const s=save(),g=s.growth;if(!g)return;
  $('bag-balls').textContent=`${s.journey?.inventory.pokeball||0} Poké Balls`;
  const entries=[['pokeball',{name:'Poké Ball'}],['moveTicket',{name:'Ticket de TM'}],...Object.entries(ITEMS),...Object.entries(g.tmInventory||{}).filter(([,count])=>count>0).map(([id,count])=>['tm:'+id,{name:'TM '+(p.getCatalog().flatMap(m=>m.pool).find(m=>m.id===id)?.name||id),count}]),...Object.entries(g.stoneInventory||{}).filter(([,count])=>count>0).map(([id,count])=>['stone:'+id,{name:STONES[id].name,count}]),...Object.entries(g.mintInventory||{}).filter(([,count])=>count>0).map(([id,count])=>['mint:'+id,{name:MINTS[id].name,count}])];
  $('bag-items').innerHTML=entries.map(([id,item])=>`<button class="inventory-slot ${bagItem===id?'selected':''}" data-inventory-item="${esc(id)}" aria-pressed="${bagItem===id}">${id.startsWith('tm:')?`<img src="/pulse/assets/ui-tm-disc.svg" alt="">`:id.startsWith('mint:')?`<span class="inventory-symbol" aria-hidden="true">🌿</span>`:ITEMS[id]||id.startsWith('stone:')?`<img src="${STONES[id.replace('stone:','')]?.asset||`/pulse/assets/items/${id.replace('stone:','')}.png`}" alt="">`:`<span class="inventory-symbol">${icon(id==='moveTicket'?'ticket':'pokeball')}</span>`}<b>${esc(item.name)}</b><small>× ${id.startsWith('tm:')||id.startsWith('stone:')||id.startsWith('mint:')?item.count:id==='pokeball'?s.journey?.inventory.pokeball||0:g.inventory[id]||0}</small></button>`).join('');
  const detail=$('inventory-detail');
  if(bagItem.startsWith('mint:')){
   const id=bagItem.slice(5),mint=MINTS[id],count=g.mintInventory?.[id]||0;
   detail.innerHTML=`<div class="inventory-item-hero" aria-hidden="true">🌿</div><h2>${mint.name}</h2><p>${mint.description}</p><p class="inventory-count">${count} na mochila · uso único</p><label class="inventory-owner-label">Usar em<select id="mint-owner">${s.unlocked.map(key=>`<option value="${esc(key)}" ${key===partner?'selected':''}>${esc(mon(key).name)} · Nv. ${mon(key).level}</option>`).join('')}</select></label><button id="mint-use" class="primary-button" ${count<1?'disabled':''}>Usar mint</button><p class="support-copy">A mint muda só o efeito da nature nos stats. A nature original é preservada — outra mint substitui o efeito.</p>`;
   if($('mint-use'))$('mint-use').onclick=()=>{const owner=$('mint-owner').value;if(apply(p.useMint(owner,id))){notify(`${mon(owner).name} agora tem efeito de nature ${natureName(mint.nature)}!`);if(!save().growth.mintInventory?.[id])bagItem='moveTicket';renderBag();}};
   return;
  }
  if(bagItem.startsWith('stone:')){
   const id=bagItem.slice(6),stone=STONES[id],count=g.stoneInventory?.[id]||0;
   const eligible=s.unlocked.filter(key=>STONE_EVOLUTIONS[key]?.[id]);
   detail.innerHTML=`<img class="inventory-item-hero" src="${stone.asset||`/pulse/assets/items/${id}.png`}" alt=""><h2>${stone.name}</h2><p>${stone.description}</p><p class="inventory-count">${count} na mochila · uso único</p>${id==='evolution-catalyst'?'<p>Abra um parceiro e entre em <b>Evolução</b> para escolher o destino especial.</p>':eligible.length?`<label class="inventory-owner-label">Usar em<select id="stone-owner">${eligible.map(key=>`<option value="${esc(key)}" ${key===partner?'selected':''}>${esc(mon(key).name)} · Nv. ${mon(key).level}</option>`).join('')}</select></label><button id="stone-use" class="primary-button" ${count<1?'disabled':''}>Usar pedra</button>`:'<p class="tm-unavailable">Nenhum parceiro evolui com esta pedra.</p>'}`;
   if($('stone-use'))$('stone-use').onclick=()=>{const owner=$('stone-owner').value;const target=STONE_EVOLUTIONS[owner][id];if(apply(p.useStone(owner,id))){notify(`${mon(owner).name} evoluiu para ${mon(target).name}!`);if(!save().growth.stoneInventory?.[id])bagItem='moveTicket';renderBag();}};
   return;
  }
  if(bagItem.startsWith('tm:')){
   const id=bagItem.slice(3),move=p.getCatalog().flatMap(m=>m.pool).find(m=>m.id===id),count=g.tmInventory?.[id]||0;
   const eligible=s.unlocked.filter(key=>{const m=mon(key),target=m.pool.find(x=>x.name===move?.name&&LEARNSETS[key]?.specialMoves.includes(x.id));return target&&!m.pool.some(x=>x.name===target.name&&m.learned.includes(x.id));});
  detail.innerHTML=`<img class="inventory-item-hero tm-disc-hero" src="/pulse/assets/ui-tm-disc.svg" alt="Disco de TM"><h2>TM ${esc(move?.name||id)}</h2><p>${count} na mochila · uso único</p><p>Ensina o golpe somente a um Pokémon compatível.</p>${eligible.length?`<label class="inventory-owner-label">Ensinar para<select id="tm-owner">${eligible.map(key=>`<option value="${esc(key)}" ${key===partner?'selected':''}>${esc(mon(key).name)} · Nv. ${mon(key).level}</option>`).join('')}</select></label><button id="tm-teach" class="primary-button" ${count<1?'disabled':''}>Usar TM</button>`:'<p class="tm-unavailable">Nenhum parceiro pode aprender esta TM agora.</p>'}`;
   if($('tm-teach'))$('tm-teach').onclick=()=>{const owner=$('tm-owner').value;if(apply(p.teachTM(owner,id))){notify(`${mon(owner).name} aprendeu ${move.name}!`);if(!save().growth.tmInventory?.[id])bagItem='moveTicket';renderBag();}};
   return;
  }
  if(bagItem==='moveTicket'){detail.innerHTML=`<div class="inventory-item-hero">${icon('ticket')}</div><h2>Ticket de TM</h2><p>Troque 1 ticket por uma TM compatível. Depois, use a máquina na mochila para ensinar o golpe.</p><p class="inventory-count">${g.inventory.moveTicket} disponíveis</p><button data-technique-for="${partner||s.favorite}" class="primary-button">Obter uma TM</button>`;return;}
  if(bagItem==='pokeball'){detail.innerHTML=`<div class="inventory-item-hero">${icon('pokeball')}</div><h2>Poké Ball</h2><p>Use em encontros selvagens da campanha. Enfraquecer o Pokémon aumenta a chance de captura.</p><p class="inventory-count">${s.journey?.inventory.pokeball||0} disponíveis</p><button data-route="shop" class="primary-button">Comprar na loja</button>`;return;}
  const item=ITEMS[bagItem],owner=partner&&s.unlocked.includes(partner)?partner:s.team.mons[0];
  detail.innerHTML=`<img class="inventory-item-hero" src="/pulse/assets/items/${bagItem}.png" alt=""><h2>${item.name}</h2><p>${item.description}</p><p class="inventory-count">${g.inventory[bagItem]} na mochila</p><label class="inventory-owner-label">Equipar em<select id="inventory-owner">${s.unlocked.map(key=>`<option value="${key}" ${key===owner?'selected':''}>${esc(mon(key).name)} · Nv. ${mon(key).level}</option>`).join('')}</select></label><button id="inventory-equip" class="primary-button" ${g.inventory[bagItem]<1?'disabled':''}>Equipar item</button><button data-route="shop" class="text-button">Obter mais itens na loja</button>`;
  $('inventory-equip').onclick=()=>{if(apply(p.equipItem($('inventory-owner').value,bagItem))){notify('Item equipado.');renderBag();}};
 }
 // Nós (% do mapa wide 1280×512, 80×32 metatiles — gerados por
 // scripts/build-firered-map-wide.py; ver os .json ao lado dos .webp).
 const positionsOne=[[20,71.88],[28.75,65.62],[37.5,65.62],[46.25,59.38],[57.5,56.25],[67.5,59.38],[76.25,56.25],[82.5,43.75],[90,28.12],[90,21.88]];
 const positionsTwo=[[10,81.25],[20,71.88],[30,65.62],[40,56.25],[50,46.88],[60,53.12],[70,43.75],[77.5,31.25],[85,21.88],[90,18.75]];
 function renderCampaign(){
  const s=save(),j=s.journey;selectedStage||=j?.active?.stage||ALL_STAGES[Math.min(j?.cleared.length||0,19)].id;
  selectedChapter=selectedStage.startsWith('2-')?2:1;
  const stages=selectedChapter===2?CHAPTER_TWO:CHAPTER_ONE,positions=selectedChapter===2?positionsTwo:positionsOne,list=$('chapter-list');
  list.className='chapter-map'+(selectedChapter===2?' chapter-two':'');
  $('campaign-subtitle').textContent=selectedChapter===2?'Capítulo 2 · Caminho para Cerulean':'Capítulo 1';
  // Abas de capítulo embutidas na linha do título (não mais acima do mapa).
  const title=document.querySelector('#screen-campaign .screen-title');
  let tabs=document.getElementById('chapter-tabs');
  if(!tabs){tabs=document.createElement('div');tabs.id='chapter-tabs';tabs.className='chapter-tabs';tabs.innerHTML='<button data-chapter="1">Capítulo 1</button><button data-chapter="2">Capítulo 2</button>';}
  if(title)title.appendChild(tabs);
  tabs.querySelectorAll('[data-chapter]').forEach(b=>{const ch=Number(b.dataset.chapter);b.setAttribute('aria-selected',String(ch===selectedChapter));b.disabled=ch===2&&!j?.cleared.includes('1-10');if(ch===2)b.textContent=b.disabled?'🔒 Capítulo 2':'Capítulo 2';});
  // Toast de primeira vez: "Arraste para explorar" aparece uma única vez
  // (nunca mais, nem em outro carregamento) e some sozinho ou no 1º arrastar.
  if(!mapHintShown){
    mapHintShown=true;
    const hint=$('campaign-hint');
    if(hint&&!localStorage.getItem('pulse-arena.mapHintSeen')){
      localStorage.setItem('pulse-arena.mapHintSeen','1');
      hint.hidden=false;
      hint.classList.add('campaign-hint-show');
      const hide=()=>{hint.hidden=true;hint.classList.remove('campaign-hint-show');};
      const view=list.parentElement;
      view.addEventListener('pointerdown',hide,{once:true});
      setTimeout(hide,3500);
    }
  }
  list.innerHTML=stages.map((stage,i)=>{const cleared=j?.cleared.includes(stage.id),locked=!j?.starter||ALL_STAGES.indexOf(stage)>j.cleared.length;return `<button class="map-stage ${stage.badge?'gym-node':''} ${cleared?'cleared':''} ${locked?'locked':''} ${selectedStage===stage.id?'selected':''}" style="--x:${positions[i][0]}%;--y:${positions[i][1]}%" data-map-stage="${stage.id}" ${locked?'disabled':''} aria-label="Fase ${stage.id}, ${cleared?'concluída':locked?'bloqueada':stage.title}"><span>${stage.badge?`<img src="/pulse/assets/badges/${stage.badge==='cascade'?'kanto-2':'kanto-1'}.png" alt="Insígnia ${stage.badge==='cascade'?'Cascata':'Rocha'}" width="22" height="22">`:cleared?icon('check'):stage.id}</span><b>${stage.id}</b></button>`;}).join('');
  requestAnimationFrame(()=>{const node=$('chapter-list').querySelector('.map-stage.selected'),view=$('chapter-list').parentElement;if(node){view.scrollLeft=node.offsetLeft-view.clientWidth/2;view.scrollTop=node.offsetTop-view.clientHeight/2;}});
  const stage=ALL_STAGES.find(x=>x.id===selectedStage),gi=ALL_STAGES.indexOf(stage);$('campaign-progress').textContent=`${j?.cleared.length||0} / 20 fases concluídas`;
  $('stage-detail').innerHTML=`<div class="stage-summary"><div class="stage-trainer"><img src="/pulse/assets/trainers/${stage.trainer}.png" alt=""><span>Fase ${stage.id}</span></div><h2>${stage.title}</h2><div class="stage-reward">${j?.cleared.includes(stage.id)?'Repetição: XP de treinador e progresso para tickets':`${stage.firstClearCoins} moedas · 1 ticket · ${300+gi*180} XP de treinador`}</div><div class="stage-opponents">${stage.opponents.map(key=>portrait(mon(key))).join('')}</div><p>Adversários · Nv. ${5+gi*2}${stage.wild?' · Encontro selvagem no caminho':''}</p>${stage.badge?`<p>Primeira vitória: Insígnia ${stage.badge==='cascade'?'Cascata':'Rocha'}.</p>`:''}</div><button id="campaign-enter" class="primary-button">${j?.active?.stage===stage.id?'Retomar fase':j?.cleared.includes(stage.id)?'Jogar novamente':'Entrar na fase'} ${icon('dash')}</button>`;
  $('campaign-enter').onclick=()=>launchStage(stage.id);
 }
 function renderTechniques(){
  const s=save(),g=s.growth;if(!g)return;
  const select=$('technique-mon'),previous=select.value||partner||s.favorite;
  select.innerHTML=s.unlocked.map(key=>`<option value="${key}">${esc(mon(key).name)} · Nv. ${mon(key).level}</option>`).join('');if(s.unlocked.includes(previous))select.value=previous;
  const key=select.value,pool=key?specialPool(s,key,mon(key)):[];
  $('ticket-budget').textContent=`${g.inventory.moveTicket} tickets · ${g.ticketWins}/3 vitórias para o próximo`;
  $('technique-spin').disabled=!pool.length||!g.inventory.moveTicket;
  $('technique-pool').textContent=pool.length?`${pool.map(id=>mon(key).pool.find(m=>m.id===id).name).join(', ')}. Chance de cada TM: ${(100/pool.length).toFixed(2)}%.`:'Nenhuma TM nova disponível para este parceiro.';
  $('technique-partner').innerHTML=key?portrait(mon(key)):'';
 }
 function setInvocation(mode){invocation=mode;$('pokemon-invocation').hidden=mode!=='pokemon';$('technique-invocation').hidden=mode!=='techniques';document.querySelectorAll('[data-invocation-mode]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.invocationMode===mode)));if(mode==='techniques')renderTechniques();}
 document.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.route)closePanels();
  if(b.id==='formation-swap'){closePanels();$('formation-roster').scrollIntoView({block:'nearest'});}
  if(b.dataset.menuBack){goBack();return;}
  if(b.dataset.partner){closePanels();openPartner(b.dataset.partner);return;}
  if(b.dataset.partnerTab){tab=b.dataset.partnerTab;renderPartner();}
  if(b.dataset.ivRerollTab){tab='iv-reroll';renderPartner();}
  if(b.dataset.ivLock){const locks=ivLocksFor(partner);locks[b.dataset.ivLock]=!locks[b.dataset.ivLock];renderPartner();}
  if(b.dataset.ivRerollGo){const key=partner,result=p.rerollIVs(key,ivLocksFor(key));if(apply(result)){const total=Object.values(result.after).reduce((a,v)=>a+v,0);notify(`${mon(key).name}: IVs sorteados de novo por ${result.cost} diamantes — total ${total}/186.`);renderPartner();}}
  if(b.dataset.useCatalyst){const [from,target]=b.dataset.useCatalyst.split(':');if(apply(p.useEvolutionCatalyst(from,target))){notify(`${mon(from).name} evoluiu para ${mon(target).name}!`);partner=target;renderPartner();}}
  if(b.dataset.inventoryItem){bagItem=b.dataset.inventoryItem;renderBag();openPanel('inventory-detail');}
  if(b.dataset.bagFor){partner=b.dataset.bagFor;navigate('bag');}
  if(b.dataset.techniqueFor){closePanels();partner=b.dataset.techniqueFor;navigate('summon');setInvocation('techniques');$('technique-mon').value=partner;renderTechniques();}
  if(b.dataset.invocationMode)setInvocation(b.dataset.invocationMode);
  if(b.dataset.mapStage){selectedStage=b.dataset.mapStage;renderCampaign();openPanel('stage-detail');}
  if(b.dataset.chapter){const ch=Number(b.dataset.chapter);if(ch===2&&!save().journey?.cleared.includes('1-10'))return;const chStages=ch===2?CHAPTER_TWO:CHAPTER_ONE,j=save().journey;selectedChapter=ch;selectedStage=j?.active?.stage&&j.active.stage.startsWith(ch+'-')?j.active.stage:chStages[Math.max(0,Math.min((j?.cleared.length||0)-(ch===2?10:0),9))].id;renderCampaign();}
  if(b.dataset.formationSlot!==undefined){const i=Number(b.dataset.formationSlot);slot=Math.min(i,save().team.mons.length);renderTeam();if(save().team.mons[slot])openPanel('formation-detail');else $('formation-roster').scrollIntoView({block:'nearest'});}
  if(b.dataset.rosterAdd){const team=p.getTeam(),key=b.dataset.rosterAdd,prior=team.mons.indexOf(key);if(prior>=0&&slot<team.mons.length)[team.mons[slot],team.mons[prior]]=[team.mons[prior],team.mons[slot]];else if(prior<0){if(slot<team.mons.length)team.mons[slot]=key;else if(team.mons.length<6)team.mons.push(key);}team.gimmick=null;apply(p.setTeam(team));}
  if(b.dataset.formationLead!==undefined){const team=p.getTeam(),i=Number(b.dataset.formationLead);[team.mons[0],team.mons[i]]=[team.mons[i],team.mons[0]];team.gimmick=null;slot=0;apply(p.setTeam(team));}
  if(b.dataset.formationRemove!==undefined){closePanels();const team=p.getTeam();if(team.mons.length>1){team.mons.splice(Number(b.dataset.formationRemove),1);team.gimmick=null;apply(p.setTeam(team));}}
 });
 return {addSlot(){slot=Math.min(5,save().team.mons.length);renderTeam();$('formation-roster').scrollIntoView({block:'nearest'});},renderTeam,renderPartner,renderBag,renderCampaign,renderTechniques,openPartner,setInvocation,stopSprites,partner:()=>partner};
}
