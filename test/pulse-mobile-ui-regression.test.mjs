import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {withCompactWaterGunVisual} from '../public/pulse/growth-battle.js';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('Water Gun uses a smaller projectile visual but retains original stats',()=>{
 const huge=()=>{},compact=()=>{};
 const move={name:'Water Gun',type:'water',power:40,cooldown:110,beam:true,run:huge};
 const mapped=withCompactWaterGunVisual(move,id=>id==='blastoiseB:Water Pulse'?{run:compact,beam:false}:null);
 assert.equal(mapped.name,'Water Gun');assert.equal(mapped.type,'water');assert.equal(mapped.power,40);assert.equal(mapped.cooldown,110);
 assert.equal(mapped.run,compact);assert.equal(mapped.beam,false);assert.equal(move.run,huge);
 assert.equal(withCompactWaterGunVisual({...move,name:'Hydro Pump'},()=>{throw Error('unexpected');}).name,'Hydro Pump');
});
test('modern mobile screens reserve scroll and a single footer',()=>{
 const css=source('public/pulse/sword-shield-theme.css'),html=source('public/pulse.html');
 assert.ok(css.includes('#app .screen > nav.ss-bottom-nav{display:none!important}'));
 assert.ok(css.includes('#screen-team>main,#screen-collection>main,#screen-bag>main,#screen-partner>main'));
 assert.ok(html.includes('grid-template-columns: minmax(0, 2fr) minmax(0, 3fr)'));
 assert.ok(html.includes('grid-template-columns: minmax(0, 1.6fr) minmax(240px, 1fr)'));
});
test('bag and screen menus retain working hookups',()=>{
 const app=source('public/pulse/app.js'),management=source('public/pulse/management-ui.js');
 assert.ok(app.includes('setCurrency("bag-coins-value", s.coins'));
 assert.ok(app.includes('setCurrency("bag-diamonds-value", s.diamonds'));
 assert.ok(app.includes("['team-menu','collection-menu','bag-menu','partner-menu']"));
 assert.ok(management.includes("id==='inventory-detail' && panel.closest('#screen-bag')"));
});
