/** Import exact, unambiguous SpriteCollab palette pairs. Never guess a shiny hue. */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { loadImage, createCanvas } from "@napi-rs/canvas";
const root = new URL("../", import.meta.url);
const roster = JSON.parse(await readFile(new URL("public/roster.json", root)));
const revision = process.argv[2];
if (!/^[0-9a-f]{40}$/.test(revision || ""))
  throw Error("Pass the pinned SpriteCollab commit SHA.");
const base = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/${revision}/`;
const keys = [
  "marshadow",
  "lucario",
  "gengar",
  "charizard",
  "blastoise",
  "venusaur",
  "gardevoir",
  "garchomp",
  "greninja",
  "pikachu",
  "tyranitar",
  "salamence",
];
const catalog = {},
  manifest = {
    source: "https://github.com/PMDCollab/SpriteCollab",
    revision,
    method:
      "Exact pixel palette correspondence from upstream normal and shiny Idle sheets; ambiguous or geometrically different pairs excluded.",
    files: [],
    excluded: [],
  };
async function get(path, out) {
  const response = await fetch(base + path);
  if (!response.ok) throw Error(`${path}: ${response.status}`);
  const data = Buffer.from(await response.arrayBuffer());
  if (out) {
    await writeFile(new URL(out, root), data);
    manifest.files.push({
      path: out,
      url: base + path,
      sha256: createHash("sha256").update(data).digest("hex"),
      bytes: data.length,
    });
  }
  return data;
}
const pixels = async (data) => {
  const image = await loadImage(data),
    canvas = createCanvas(image.width, image.height),
    ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  return {
    w: image.width,
    h: image.height,
    data: ctx.getImageData(0, 0, image.width, image.height).data,
  };
};
for (const key of keys) {
  const m = roster.find((x) => x.key === key);
  if (!m) continue;
  const dex = m.dex,
    dir = `public/pulse/assets/shiny/${key}/`;
  await mkdir(new URL(dir, root), { recursive: true });
  try {
    const [normal, variant] = await Promise.all([
        get(`sprite/${dex}/Idle-Anim.png`),
        get(`sprite/${dex}/0000/0001/Idle-Anim.png`),
      ]),
      a = await pixels(normal),
      b = await pixels(variant);
    if (a.w !== b.w || a.h !== b.h) throw Error("Different sheet geometry");
    const palette = {};
    for (let i = 0; i < a.data.length; i += 4) {
      if (a.data[i + 3] !== b.data[i + 3]) throw Error("Different silhouette");
      if (!a.data[i + 3]) continue;
      const from = [...a.data.slice(i, i + 3)].join(","),
        to = [...b.data.slice(i, i + 3)];
      if (palette[from] && palette[from].join(",") !== to.join(","))
        throw Error("Ambiguous palette mapping");
      palette[from] = to;
    }
    const local = await pixels(
      await readFile(new URL(`public/${m.icon.file}`, root)),
    );
    if (local.w !== a.w || local.h !== a.h)
      throw Error("Local geometry differs from source");
    for (let i = 0; i < local.data.length; i++)
      if (local.data[i] !== a.data[i])
        throw Error("Local normal differs from source");
    const xml = (
      await get(`sprite/${dex}/0000/0001/AnimData.xml`, dir + "AnimData.xml")
    ).toString();
    const idle = xml.match(
      /<Anim>\s*<Name>Idle<\/Name>([\s\S]*?)<\/Anim>/,
    )?.[1];
    if (!idle) throw Error("Idle metadata missing");
    const w = Number(idle.match(/<FrameWidth>(\d+)/)?.[1]),
      h = Number(idle.match(/<FrameHeight>(\d+)/)?.[1]);
    if (w !== m.icon.w || h !== m.icon.h) throw Error("Frame size mismatch");
    await get(`sprite/${dex}/0000/0001/Idle-Anim.png`, dir + "Idle-Anim.png");
    await get(
      `sprite/${dex}/0000/0001/credits.txt`,
      dir + "sprite-credits.txt",
    );
    await get(`portrait/${dex}/0000/0001/Normal.png`, dir + "Normal.png");
    await get(
      `portrait/${dex}/0000/0001/credits.txt`,
      dir + "portrait-credits.txt",
    );
    catalog[key] = {
      idle: `pulse/assets/shiny/${key}/Idle-Anim.png`,
      portrait: `pulse/assets/shiny/${key}/Normal.png`,
      w,
      h,
      palette,
    };
    console.log("Imported", key, Object.keys(palette).length, "colors");
  } catch (error) {
    manifest.excluded.push({ key, reason: error.message });
    console.log("Excluded", key, error.message);
  }
}
await writeFile(
  new URL("public/pulse/shiny-catalog.json", root),
  JSON.stringify(catalog),
);
await get("credit_names.txt", "public/pulse/assets/shiny/credit_names.txt");
await writeFile(
  new URL("research/shiny-assets-manifest.json", root),
  JSON.stringify(manifest, null, 2),
);
console.log("Available", Object.keys(catalog).length);
