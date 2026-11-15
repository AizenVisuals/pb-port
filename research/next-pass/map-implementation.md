# Campaign tile composition — 2026-11-15

Implemented `scripts/build-firered-map.py` and `public/pulse/assets/chapter-one-tiles.webp` with source sidecar. This is an authored PULSE campaign arrangement made of genuine FireRed graphics; it is neither AI-generated scenery nor a screenshot of an existing map.

The corrected upstream paths are `data/layouts/PalletTown/map.bin` and the matching entry in `data/layouts/layouts.json`. `PalletTown_Layout` is a label, not a directory. Upstream revision `ce6406d8c2eaf46d543c8a2606de0c3cb1951982`, all original files/hashes recorded in `research/next-pass/firered/sources.json`. Primary General plus secondary Pallet Town supply 8px indexed tiles, sixteen palettes and 16px metatiles. Renderer honors palette banks, horizontal/vertical flips and transparent upper tile layers. It verifies every recorded input hash before rendering. It needs Pillow; used isolated `/tmp/pulse-map-venv`, no global package changes.

Output:1280×720, lossless WebP, nearest-neighbor pixel composition. Composition is a two-house starting village, grass encounter clearings, forest, stream and wooden bridge, disused research outpost for the Rocket encounter, rocky training area and genuine FireRed gym building. Markers, trainers, stage names and buttons remain UI; none are baked into art.

Use these stage positions in percentages, in order:
`[[20,75.56],[28.75,66.67],[37.5,66.67],[46.25,60],[57.5,57.78],[67.5,62.22],[76.25,57.78],[82.5,44.44],[90,28.89],[90,15.56]]`.

ROOT integrates the CSS background path and marker positions. No CSS, HTML, controller or progression files were edited by this worker.

Verification: inspected canonical Pallet Town decode, whole metatile contact sheet and composed map at native size; output dimensions and SHA-256 sidecar verified. Offline rebuild completes successfully with no input hash mismatches. Research images: `firered/pallet-probe.png`, `metatile-atlas.png`, `chapter-one-preview.png`; composition grid recorded in `composition.json`.

Limits: this is a static stage-selection scene; it does not implement walking, collisions or animated water. Pokémon FireRed graphics retain their original rights holders; pret's decompilation repository does not transfer ownership. The asset is explicitly sourced, not original PULSE artwork. No ROM was downloaded or required. Route art connects the ten nodes; gameplay encounter logic remains the existing campaign controller.
