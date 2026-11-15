export const SUMMON_BANNERS=Object.freeze([
 {id:'route',name:'Encontros da Rota',description:'Todos os parceiros disponíveis nesta edição.',types:null},
 {id:'battle',name:'Parceiros de Batalha',description:'Parceiros dos tipos Lutador, Pedra, Terra e Aço.',types:['fighting','rock','ground','steel']},
 {id:'night',name:'Ecos da Noite',description:'Parceiros dos tipos Fantasma e Sombrio.',types:['ghost','dark']},
]);
export const bannerPool=(catalog,id)=>{const banner=SUMMON_BANNERS.find(b=>b.id===id);return banner?catalog.filter(m=>!banner.types||m.types.some(t=>banner.types.includes(t))):null;};
