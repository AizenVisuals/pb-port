const startup=import('./app.js');
const unavailable = ['towerBtn','ticketsBtn','friendBtn','cupBtn','gridBtn','friendsBtn','voteBtn','myStatsBtn','trophyBtn','usageBtn','reportBtn','royaleBtn','discordBtn','endShareBtn','endReplayBtn'];
for (const id of unavailable) {
  const el=document.getElementById(id);
  if(!el)continue;
  el.hidden=true;
  el.dataset.portUnavailable='true';
}
const hideUnavailable=()=>{
  for(const el of document.querySelectorAll('[data-port-unavailable]:not([hidden])'))el.hidden=true;
};
new MutationObserver(hideUnavailable).observe(document.body,{subtree:true,attributes:true,attributeFilter:['hidden']});
const loading=document.getElementById('loadingText');
setTimeout(()=>{if((!document.body.dataset.screen||document.body.dataset.screen==='loading')&&loading){loading.textContent='Não foi possível conectar ao servidor. Confira se ele está em execução e recarregue a página.';}},15000);
const toast=document.getElementById('toast');if(toast){toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');}

startup.catch(error=>{console.error('Client startup failed',error);if(loading){loading.textContent='Não foi possível carregar o jogo. Recarregue a página para tentar novamente.';const retry=document.createElement('button');retry.textContent='Recarregar';retry.onclick=()=>location.reload();loading.after(retry);}});
