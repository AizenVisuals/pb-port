import {test} from 'node:test';
import assert from 'node:assert/strict';
import '../server/engine.mjs';
const {createCanvas,Image}=await import('@napi-rs/canvas');
test('native image augmented with getContext remains an image when drawn',async()=>{
 const image=new globalThis.Image;
 await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src='baked2/0131/Attack.png';});
 const prototype=Object.getPrototypeOf(image);
 const cv=createCanvas(88,88);
 Object.defineProperty(image,'getContext',{value:()=>cv.getContext('2d')});
 cv.getContext('2d').drawImage(image,0,0,88,88,0,0,88,88);
 assert.equal(Object.getPrototypeOf(image),prototype);
 assert.ok(image instanceof Image);
 assert.ok(cv.getContext('2d').getImageData(0,0,88,88).data.some(x=>x>0));
});
