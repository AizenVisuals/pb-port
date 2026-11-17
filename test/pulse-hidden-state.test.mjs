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
