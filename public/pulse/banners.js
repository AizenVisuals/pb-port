import {KANTO_KEYS} from './kanto.js';
import {BASE_FORM_KEYS} from './growth.js';
// Lendários (UR) e míticos (SSS) de estágio único no catálogo — verificados no roster: só estes existem. Mew é mítico (SSS), não lendário. Sem eles a Rota não teria UR/SSS.
export const SUMMONABLE_UR=Object.freeze(['articuno','zapdos','moltres','mewtwo']);
export const SUMMONABLE_SSS=Object.freeze(['mew','marshadow']);
// Exceção mínima: estágio único que NÃO é evolução final (sem cadeia evolutiva). Sem eles o banner da Noite teria só Gastly + Marshadow e nenhum comum, o que quebra a invocação — o catálogo não tem outra forma base Fantasma/Sombrio.
export const NIGHT_SINGLE_STAGE=Object.freeze(['spiritomb','absolNM','shedinjaNM']);
export const isSummonable=key=>BASE_FORM_KEYS.has(key)||SUMMONABLE_UR.includes(key)||SUMMONABLE_SSS.includes(key)||NIGHT_SINGLE_STAGE.includes(key);
export const SUMMON_BANNERS=Object.freeze([
 {id:'route',name:'Encontros da Rota',description:'Os 59 Pokémon de Kanto, em suas formas originais.',types:null,kanto:true},
 {id:'battle',name:'Parceiros de Batalha',description:'Parceiros dos tipos Lutador, Pedra, Terra e Aço.',types:['fighting','rock','ground','steel']},
 {id:'night',name:'Ecos da Noite',description:'Parceiros dos tipos Fantasma e Sombrio.',types:['ghost','dark']},
]);
export const bannerPool=(catalog,id)=>{const banner=SUMMON_BANNERS.find(b=>b.id===id);return banner?catalog.filter(m=>isSummonable(m.key)&&(!banner.kanto||KANTO_KEYS.includes(m.key))&&(!banner.types||m.types.some(t=>banner.types.includes(t)))):null;};
