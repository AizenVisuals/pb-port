const MARKER='pulse-arena.google-session';
export function accountError(error) {
  const messages={
    'auth/popup-closed-by-user':'Entrada cancelada. Você pode continuar jogando offline.',
    'auth/cancelled-popup-request':'A janela anterior foi substituída. Conclua a entrada na janela aberta.',
    'auth/popup-blocked':'Seu navegador bloqueou a janela do Google. Permita pop-ups para este site e tente novamente.',
    'auth/network-request-failed':'Sem conexão com o Google. Seu progresso continua salvo no aparelho.',
    'auth/unauthorized-domain':'Este endereço ainda não foi autorizado para entrar com Google. Use o endereço oficial do PULSE.',
    'auth/operation-not-allowed':'O login Google ainda não está disponível neste projeto.',
    'auth/web-storage-unsupported':'O navegador bloqueou o armazenamento da conta. Permita os dados deste site.',
  };
  return messages[error?.code]||'Não foi possível conectar sua conta Google. Tente novamente; seu progresso local foi mantido.';
}

/** Account identity is independent of progression. Signing in/out never replaces a save. */
export function mountAccount({document:doc=document,storage:providedStorage,load=async()=>{
  const [sdk,response]=await Promise.all([import('./vendor/account-sdk.js'),fetch('/pulse/firebase-config.json')]);
  if(!response.ok)throw new Error('Configuração da conta indisponível.');
  return sdk.initializeAccount(await response.json());
}}={}) {
  const login=doc.getElementById('google-login'),logout=doc.getElementById('google-logout');
  const status=doc.getElementById('google-status'),header=doc.getElementById('account-summary');
  let sdk,user=null,busy=false,initializing=false,ready,storage;
  try{storage=providedStorage??globalThis.localStorage;}catch{}
  const marker=value=>{try{if(value)storage?.setItem(MARKER,'1');else storage?.removeItem(MARKER);}catch{}};
  const render=()=>{
    login.hidden=!!user;logout.hidden=!user;
    login.disabled=busy||initializing;logout.disabled=busy||!sdk;
    login.textContent=initializing?'Preparando…':busy?'Conectando…':'Entrar com Google';
    logout.textContent=busy?'Saindo…':'Desconectar Google';
    header.textContent=user?'Conta Google conectada':'Seu progresso, no aparelho';
  };
  const prepare=()=>ready ||= (async()=>{
    initializing=true;render();
    status.textContent='Preparando conexão com Google…';
    try{
      sdk=await load();
      status.textContent='Conecte sua conta Google. Você também pode continuar offline.';
      sdk.subscribe(value=>{
        user=value;marker(!!value);
        status.textContent=value?`Conectado como ${value.name}${value.email?' · '+value.email:''}. O progresso continua salvo neste aparelho.`:'Conecte sua conta Google. Você também pode continuar offline.';
        render();
      });
      render();
      return sdk;
    }catch(error){status.textContent=accountError(error);ready=null;return null;}
    finally{initializing=false;render();}
  })();
  login.onclick=async()=>{
    if(busy)return;
    if(!sdk){await prepare();return;}
    busy=true;render();status.textContent='Conclua a entrada na janela do Google.';
    try{await sdk.signIn();}catch(error){status.textContent=accountError(error);}
    finally{busy=false;render();}
  };
  logout.onclick=async()=>{
    if(busy||!sdk)return;
    busy=true;render();
    try{await sdk.signOut();}catch(error){status.textContent=accountError(error);}
    finally{busy=false;render();}
  };
  render();
  try{if(storage?.getItem(MARKER))prepare();}catch{}
  return {prepare};
}
