# Public asset inventory — PB Ranked

Source: https://ranked.pokemonbattlegrounds.com/ . Inventory started 2026-11-14.

This document reports shell/static inspection, not REA Evidence. The parent investigation runs REA separately. Public accessibility does not establish a redistribution license.

## Reproduce

`python scripts/download-assets.py --max-mb 150 --workers 6`

The downloader requests only explicit static paths from the shipped client, public JSON manifests, and sprite animation metadata. It performs no authentication, match creation, or production mutation. Existing files are reused. New downloads are capped at 150 MiB per run and one file at 16 MiB. `research/assets-manifest.json` records URLs, HTTP status, byte length and SHA-256. Failed requests remain visible rather than replaced by invented assets.

## Observations

- `roster.json` contains 153 selectable roster entries, their stats, defaults, legal move pools, cooldown values, icon paths, dex identities and forms.
- `trainers.json` contains 35 trainer keys. Their menu portraits use `faces/<key>.png`; engine sprites use `assets/trainers/<key>.png` and `<key>_face.png`.
- `assets/sprites/anims.json` enumerates original animations, sprite dimensions, filenames and frame durations.
- `engine.bundle.js` function `m3e` requests `baked2/<dex>.json`, then `baked2/<dex>/<animation>.png`. Metadata contains offsets/shadows. Pack mode optionally requests `baked2/<dex>.pack.png`; the default non-pack path does not require this file.
- Six dex identities always use original sprites and offsets instead: `0277`, `0018`, `0227`, `0373`, `0149`, `0149m`. Their client loader constructs transformed animations.
- `loadRankedAssets` initializes two fonts, red/blue trainer sprites, substitute effect, species sprites and optional portraits.
- Most arenas are drawn by code. Steven's Cave additionally loads `assets/arena/meteorfalls_tiles.png` and `.json`. Arena crowd NPCs are enumerated by the shipped loader.
- `audio/manifest.json` lists 1,410 sfx IDs. Menu and battle music are separate MP3s.

## Boundaries and remaining work

This inventory covers public static resources referenced by the downloaded build. It does not recover original authoring files, private server implementation, accounts, historical matches, or an asset license. It does not prove runtime completeness. Dynamic filenames outside identified loaders may still be absent. Run the app and inspect failed local requests before claiming full offline support.

The reproduction script prioritizes images/data and gameplay animation sheets before audio. Inspect the generated manifest for exact download failures or budget-skipped resources; optional portrait failures may be tolerated by the original client.

## Completed download check

Completed 2026-11-14: 5,505 enumerated resources; 5,495 exist locally and ten baked metadata endpoints return 404. The missing metadata files are for `0145`, `0150`, `0244`, `0249`, `0378`, `0381`, `0491`, `0649`, `0658m`, `0807`. These use the engine's documented-in-code original-sheet fallback, which was downloaded. No primary animation PNG is missing for any of the 183 dex identities exposed by roster, legends and bosses. Existing PNG files have valid PNG signatures. This is a file-availability check, not a rendering test.

The first pass downloaded 99,720,451 bytes; the incremental pass added 191,019 bytes of mega portraits, arena NPCs and dynamic FX. Both stayed within their 150 MiB per-pass cap. The most recent manifest marks already-downloaded files `cached` and records the current pass's new bytes. The local tree is larger on disk due to filesystem block allocation and other client files.
