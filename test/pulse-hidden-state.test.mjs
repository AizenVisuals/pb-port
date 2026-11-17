import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../public/pulse.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/pulse/rpg.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../public/pulse/app.js',import.meta.url),'utf8');

test('login, onboarding, and lobby honor the hidden attribute despite display flex/grid',()=>{
  // A CSS display declaration with greater specificity can override the browser's
  // normal [hidden] stylesheet rule and leave an invisible/blocked guest login.
  assert.match(css,/\[hidden\]\s*\{\s*display:\s*none\s*!important;\s*\}/);
  for(const id of ['login-screen','login-step-profile','app']){
    assert.match(html,new RegExp('id="'+id+'"[^>]*hidden'));
  }
  assert.match(app,/screen\.hidden\s*=\s*true/);
  assert.match(app,/\$\("app"\)\.hidden\s*=\s*false/);
});


test('boot handles optional controls removed by the new lobby layout',()=>{
  const required=['boot','app','type-filter','coin-icon','diamond-icon','daily-icon','summon-core','summon-back','battle-pause','rewards-summon'];
  for(const id of required)assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(app,/if \(el\) el\.innerHTML = icon\(name\)/);
  assert.match(app,/if \(button\) button\.onclick = \(\) => navigate\("summon"\)/);
});

test('management renders the new partner XP controls and receives team UI helpers',()=>{
  const management=readFileSync(new URL('../public/pulse/management-ui.js',import.meta.url),'utf8');
  for(const id of ['partner-xp-bar','partner-xp-current','partner-xp-max']){
    assert.match(html,new RegExp('id="'+id+'"'));
    assert.ok(management.includes("$('"+id+"')"),id+' must be wired');
  }
  assert.doesNotMatch(management,/\$\('partner-xp'\)/);
  for(const helper of ['rarityTier','typeIcon','trainerFace','trainerLabel']){
    assert.match(app,new RegExp('goBack,rarityTier,typeIcon,trainerFace,trainerLabel'));
    assert.match(management,new RegExp('goBack,rarityTier,typeIcon,trainerFace,trainerLabel'));
  }
});
