import './build-account-sdk.mjs';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
const root = new URL('../', import.meta.url);
const source = new URL('public/', root);
const target = new URL('dist-android/', root);
const entry = await readFile(new URL('pulse.html', source), 'utf8');
// Refuse a shell-only build while the app/controller is still being developed.
await readFile(new URL('pulse/app.js', source), 'utf8');
await readFile(new URL('pulse/battle.js', source), 'utf8');
await readFile(new URL('pulse/progression.js', source), 'utf8');
if (!entry.includes('PULSE')) throw new Error('PULSE ARENA entry is missing');
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
await build({ entryPoints: [new URL('scripts/android-native-entry.mjs', root).pathname], outfile: new URL('pulse/native.js', target).pathname, bundle: true, format: 'esm', minify: true });
await writeFile(new URL('index.html', target), entry.replace('</head>', '<script type="module" src="./pulse/native.js"></script></head>'));
console.log('Packaged local PULSE ARENA assets in dist-android (no server runtime).');
