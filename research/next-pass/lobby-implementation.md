# FireRed lobby scene — finish review fix1

Replaced asset candidate for the rejected generated terrace: `public/pulse/assets/lobby-tiles.webp`,1280×720 lossless WebP, built offline by `scripts/build-firered-lobby.py`. Source provenance and SHA256 are in its JSON sidecar; source revision remains `ce6406d8c2eaf46d543c8a2606de0c3cb1951982`.

Own scene arrangement with authentic FireRed house, gym, research building, trees, fences, flowers and stone paving. Authored at640×360 then enlarged exactly2× by nearest-neighbor. The central and right floor are deliberately quiet for the animated favorite and campaign controls. No fake Pokémon, UI labels, logos or hand-drawn SVG scenery. Graphics remain sourced Pokémon FireRed art, not original PULSE pixel art.

Correctly decoded canonical metatile449 supplies the uninterrupted plaza floor; edge tiles440/441/442/448/450/456/457/458 frame it. The asset shares the campaign map's exact tile/palette language rather than a separate generated art style.

Verification: complete output visually inspected at1280×720; output dimensions, lossless render and SHA256 readback checked. All recorded source input hashes are verified by the composer. No network is needed for rebuild. Used isolated Pillow environment `/tmp/pulse-map-venv`, not a global package installation.

Integration belongs to ROOT/UI worker: replace the lobby background CSS URL with `/pulse/assets/lobby-tiles.webp`; preserve pixelated rendering. No CSS/HTML/controller changes by this worker. Static backdrop only; no traversal/collision features are implied.
