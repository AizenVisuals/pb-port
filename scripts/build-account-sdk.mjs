import {build} from 'esbuild';
const root=new URL('../',import.meta.url);
await build({entryPoints:[new URL('scripts/account-sdk-entry.mjs',root).pathname],outfile:new URL('public/pulse/vendor/account-sdk.js',root).pathname,bundle:true,format:'esm',minify:true,legalComments:'eof',target:'es2022'});
console.log('Firebase Auth SDK bundled locally (no remote script imports).');
