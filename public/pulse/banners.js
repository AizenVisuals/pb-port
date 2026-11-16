import {KANTO_KEYS} from './kanto.js';
import {LEGACY_BASE_KEYS} from './legacy-summon-keys.js';
import {NATIONAL_BASE_KEYS} from './expansion-rules.js';
import {BASE_FORM_KEYS} from './growth.js';
// Lendários (UR) e míticos (SSS) de estágio único no catálogo — verificados no roster: só estes existem. Mew é mítico (SSS), não lendário. Sem eles a Rota não teria UR/SSS.
export const SUMMONABLE_UR=Object.freeze(['articuno','zapdos','moltres','mewtwo']);
export const SUMMONABLE_SSS=Object.freeze(['mew','marshadow']);
// Exceção mínima: estágio único que NÃO é evolução final (sem cadeia evolutiva). Sem eles o banner da Noite teria só Gastly + Marshadow e nenhum comum, o que quebra a invocação — o catálogo não tem outra forma base Fantasma/Sombrio.
export const NIGHT_SINGLE_STAGE=Object.freeze(['spiritomb','absolNM','shedinjaNM']);
// Exceção mínima (só do banner Batalha): estágio único que NÃO é evolução final. Sem eles o C da Batalha teria só o Geodude (70% dos giros) após a reclassificação por meta+anime. Escopada ao banner — a Rota continua com as 59 formas base de Kanto aprovadas.
export const BATTLE_SINGLE_STAGE=Object.freeze(['onix','hitmonlee','hitmonchan','aerodactyl']);
export const isSummonable=key=>NATIONAL_BASE_KEYS.has(key)||BASE_FORM_KEYS.has(key)||SUMMONABLE_UR.includes(key)||SUMMONABLE_SSS.includes(key)||NIGHT_SINGLE_STAGE.includes(key);
export const SUMMON_BANNERS=Object.freeze([
 {id:'national',name:'Horizontes Pokémon',description:'Parceiros de todas as regiões disponíveis. Somente formas base e espécies de estágio único.',types:null,national:true},
 {id:'route',name:'Encontros da Rota',description:'Os 59 Pokémon de Kanto, em suas formas originais.',types:null,kanto:true},
 {id:'battle',name:'Parceiros de Batalha',description:'Parceiros dos tipos Lutador, Pedra, Terra e Aço.',types:['fighting','rock','ground','steel'],singleStage:BATTLE_SINGLE_STAGE},
 {id:'night',name:'Ecos da Noite',description:'Banner premium: sem comuns — só SR e SSS. Custa 2 tickets por giro.',types:['ghost','dark'],premium:true,ticketCost:2,diamondCost:400,rates:{SR:.85,SSS:.15}},
]);
export const bannerPool=(catalog,id)=>{const banner=SUMMON_BANNERS.find(b=>b.id===id);return banner?catalog.filter(m=>((banner.national?NATIONAL_BASE_KEYS.has(m.key):LEGACY_BASE_KEYS.has(m.key)||SUMMONABLE_UR.includes(m.key)||SUMMONABLE_SSS.includes(m.key)||NIGHT_SINGLE_STAGE.includes(m.key))||(banner.singleStage||[]).includes(m.key))&&(!banner.national||NATIONAL_BASE_KEYS.has(m.key))&&(!banner.kanto||KANTO_KEYS.includes(m.key))&&(!banner.types||m.types.some(t=>banner.types.includes(t)))):null;};
