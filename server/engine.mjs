import { createCanvas, ImageData, GlobalFonts, Image } from '@napi-rs/canvas';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('../public/', import.meta.url)));
// Browser adapters are restricted to local files. Server simulation never fetches the original service.
const localPath = value => {
  const path = resolve(root, String(value).replace(/^\//, ''));
  if (!path.startsWith(root + sep)) throw new Error('Invalid asset path');
  return path;
};
globalThis.document = {
  createElement(kind) { if (kind !== 'canvas') throw new Error(`Unsupported element ${kind}`); return createCanvas(1, 1); },
  fonts: { add() {} },
};
globalThis.ImageData = ImageData;
globalThis.FontFace = class { constructor(name, url) { this.name = name; this.url = url; } async load() { const path = this.url.match(/url\((.*?)\)/)?.[1]; if (path) GlobalFonts.registerFromPath(localPath(path), this.name); return this; } };
globalThis.Image = class extends Image { set src(path) { readFile(localPath(path)).then(bytes => { super.src = bytes; }).catch(e => this.onerror?.(e)); } };
globalThis.fetch = async path => { const bytes = await readFile(localPath(path)); return { ok: true, json: async () => JSON.parse(bytes), text: async () => bytes.toString(), arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }; };
export const engine = await import('../public/engine.bundle.js');
export async function createSimulation(seed, teams, arena) {
  await Promise.all([engine.loadRankedAssets(teams.flatMap(t => t.mons)), engine.loadTrainers(teams.map(t => t.trainer)), engine.loadArena(arena)]);
  return engine.makeHeadless(engine.createBattle(await engine.loadRankedAssets([]), seed, teams, arena));
}
