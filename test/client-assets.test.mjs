import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile,access} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
const root=resolve('public');
test('delivered client includes every static module dependency and stylesheet font',async()=>{
 const files=(await readdir(root)).filter(f=>f.endsWith('.js'));
 for(const file of files){
  const text=await readFile(resolve(root,file),'utf8');
  for(const match of text.matchAll(/(?:from|import)\s*["']([^"']+\.js)["']/g)){
   if(!match[1].startsWith('/')&&!match[1].startsWith('.'))continue;
   const path=match[1].startsWith('/')?resolve(root,match[1].slice(1)):resolve(dirname(resolve(root,file)),match[1]);
   await assert.doesNotReject(access(path),`${file} requires ${match[1]}`);
  }
 }
 for(const css of ['style.css',...(await readdir(resolve(root,'looks'))).map(f=>'looks/'+f)]){
  const text=await readFile(resolve(root,css),'utf8');
  for(const match of text.matchAll(/url\(["']?(\/fonts\/[^)"']+)["']?\)/g))await assert.doesNotReject(access(resolve(root,match[1].slice(1))),match[1]);
 }
});
