# Game UI implementation — 15/11/2026

Ownership: `public/pulse.html`, `public/pulse/rpg.css`, `public/pulse/management-ui.js`. No engine, progression, save, app.js or map asset code edited by this agent. Parallel changes retained.

## Decisions

- Lobby is the navigation hub: six framed game destination controls, no redundant home button. Management screens use their contextual Back and own the full viewport, reclaiming70px on a landscape phone.
- Favorite stays dominant in the world. Campaign is the primary command. Training options move into a compact tune control beside training, rather than a permanently exposed web form. The actual format/difficulty selects and battle-start ID remain.
- Formation uses six ordered positions, legible names, contextual actions and a scrolling owned roster. The larger task viewport also exposes complete partner attributes/actions, evolution requirements/help and inventory equip controls.
- Text shortened to commands and exact states; no new fake quests, rewards, battle bonuses or stats. `Bônus` remains rewards rather than inventing missions. Game dock and selected slots retain warm ivory, graphite structure, cyan and coral, with immediate focus/press feedback. No UI animation dependency added.
- TMs are inventory items: acquired through1ticket, stored in slots, compatible/notknown owners selected explicitly, teachTM consumes one machine. Eligibility matches move name across PB implementation IDs, exactly like ROOT teachTM. Draw does not teach immediately.

## Validation

- `node --check public/pulse/management-ui.js` and scoped `git diff --check` passed.
- Isolated Chromium fresh profiles844×390 and1280×720, ten views each, captured under `research/validation/game-ui/`. Navigation uses actual Back→lobby→destination clicks. `result.json` records overflow/errors.
- `tm-functional.json`: ticket draw creates machine, no immediate learning, inventory owner selection, one-use teach, learned move survives reload. No existing user save changed.
- Scripts preserved in `research/validation/game-ui/scripts/`; Playwright dependency/executable are existing host tools under`/tmp/pulse-qa` and browser cache.
- Native performance, physical gamepad and full chapter balance not assessed here. Root performs integrated review and final APK validation.

## Integration notes

- Existing scripts clicking main-nav from secondary screens must use contextual Back or explicitly go home; the dock is intentionally hidden outside the lobby.
- TM result content remains ROOT-owned app.js; both result actions should have distinct wording (current close text says bag but only closes dialog). This agent did not edit app.js.
- Authentic FireRed tile composition integrated at `/pulse/assets/chapter-one-tiles.webp`; node coordinates updated exactly to map-agent positions. Original campaign logic/IDs retained.

## Independent finish review — correction batch

1. Generated lobby background replaced by original FireRed tile composition at`lobby-tiles.webp` provided by map agent.
2. Rewards now a game prize screen:150coins+2TMtickets, dominant real claim action, compact recruiting/backup secondary area. Runtime-written metrics/progressIDs retained hidden, not visual scaffold.
3. Useful map/reward/XP/invocation text raised to12–13px phone; locked map nodes retain contrast and clear disabledmaterial instead of globalopacity.
4. Disabled formation actions expose visible reasons (already initial / only partner) and titles. ROOTowns training reason; #training-reason added.
5. Favorite, partnerinfo and odds summary touchareas48px.

No extra visual hunt; same20screens recaptured and TMflow rerun afterthisbatch.
