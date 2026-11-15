/** Exact source palette substitution, scoped to this battle's asset copy. */
export function applyShinyAssets(assets, keys, roster, catalog) {
  const species = { ...assets.species },
    portraits = { ...assets.portraits };
  for (const key of keys) {
    const variant = catalog[key],
      info = roster[key];
    if (!variant || !info || !species[info.dex]) continue;
    const cache = new Map(),
      original = species[info.dex],
      anims = {};
    const recolor = (image) => {
      if (!image) return image;
      if (cache.has(image)) return cache.get(image);
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height),
        d = pixels.data;
      for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue;
        const color = variant.palette[`${d[i]},${d[i + 1]},${d[i + 2]}`];
        if (color) {
          d[i] = color[0];
          d[i + 1] = color[1];
          d[i + 2] = color[2];
        }
      }
      ctx.putImageData(pixels, 0, 0);
      cache.set(image, canvas);
      return canvas;
    };
    for (const [name, animation] of Object.entries(original.anims))
      anims[name] = { ...animation, sheet: recolor(animation.sheet) };
    species[info.dex] = { ...original, anims };
    for (const name of Object.keys(portraits))
      if (name.startsWith(info.dex + "_"))
        portraits[name] = recolor(portraits[name]);
  }
  return { ...assets, species, portraits };
}
