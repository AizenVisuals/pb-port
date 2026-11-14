# Marshadow sprite and portrait acquisition

Downloaded 14 November 2026 from the public PMDCollab/SpriteCollab repository, master branch. These are existing pixel-art animation assets, not newly generated art. The parent integration must preserve attribution and the noncommercial license conditions.

## Sources and attribution

- Repository: https://github.com/PMDCollab/SpriteCollab
- Animation source and metadata: https://github.com/PMDCollab/SpriteCollab/tree/master/sprite/0802
- Portrait source: https://github.com/PMDCollab/SpriteCollab/tree/master/portrait/0802
- Sprite author: **Dejais**, Discord ID `375676609283358722`, as mapped by the repository's `credit_names.txt`. Current sprite credits name `CC_BY-NC_4`; older 2022 contributions use `PMDCollab_1`.
- Portrait author: **Top_Kec**, contact `@topkec.bsky.social`, Discord ID `276369635304275968`, as mapped by `credit_names.txt`. The portrait credits specify `CC_BY-NC_4`.
- License: **Creative Commons Attribution–NonCommercial 4.0**, https://creativecommons.org/licenses/by-nc/4.0/. The repository README describes copying, redistribution and adaptation with attribution for noncommercial use. Pokémon character ownership is not transferred by this license.

Original upstream credits files are preserved as `public/assets/sprites/0802/credits.txt` and `public/assets/portraits/0802_credits.txt`.

## Delivered

- All 34 distinct original animation sheets, each with its matching offsets and shadow PNG: 102 files under `public/assets/sprites/0802/`.
- Original `AnimData.xml`.
- Normal, Determined and Pain portraits at 40×40, matching the existing game's portrait dimensions.
- A ready-to-merge `0802` metadata entry in `research/marshadow-anims.json`.
- URL, byte length and SHA-256 inventory plus animation geometry checks in `research/marshadow-assets-manifest.json`.

There are **36 named animation entries**: Walk, Attack, Strike, Shoot, Rotate, Shake, Dance, Sleep, Hurt, Idle, Swing, Double, Hop, Charge, EventSleep, Wake, Eat, Tumble, Pose, Pull, Pain, Float, DeepBreath, Nod, Sit, LookUp, Sink, Trip, Laying, LeapForth, Head, Cringe, LostBalance, TumbleBack, Faint, HitGround. Shake and Dance correctly resolve upstream CopyOf=Rotate.

Idle: 24×40 cells, seven frames with durations `[6,6,6,6,6,6,6]`, eight directions. Attack: 72×80 cells, ten frames, eight directions. The original color palette and all directional frames are retained without resizing, recoloring or synthetic replacement.

All PNG sheets were verified against metadata: dimensions are exact multiples of frame dimensions and columns match duration counts. No requested files failed. Visual inspection confirmed the Idle sheet and Normal portrait depict Marshadow consistently with the reference character.

## Integration notes

The existing loader will fall back from absent `baked2/0802.json` to these original animation sheets. No baked resources were created or needed. Parent integration should merge the metadata entry before calling loadRankedAssets for this species.

These assets have Shoot and Charge but no separately named SpAttack, RearUp, QuickStrike or Roar. If the chosen move implementation requires those names, add explicit animation aliases in metadata based on an appropriate existing sheet; do not point to nonexistent files. Attack, Strike, Swing, Double and Hop provide authored melee motion and may serve the chosen kit directly.

No engine, roster, shared anims.json or server files were changed by this asset task.
