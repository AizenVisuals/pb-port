# PULSE ARENA — interface de jogo organizada

## Authority
User rejected the prior flat dark menus on 2026-11-15 and supplied https://www.x7game.com/game/app/17168 (Pokémon: Champion) as the interface reference. User explicitly confirmed light panels with game frames, larger collection cards, a stage map and separate formation/training/inventory/summon screens. Palette remains graphite/cyan/coral. Pixel Pokémon and PB real-time combat remain. Build code-first from this pinned reference; there is no generated UI comp.

## Direction contract
- FIRST VIEWPORT: landscape game lobby, artwork in the world area, animated favorite dominant, compact earned currencies/profile on top, illustrated destination controls below and one clear campaign action. UI must read as a mobile collection RPG, not a web admin panel.
- Light warm ivory surfaces, navy text and structural frames, coral primary buttons with visible depth, cyan selection. Saturation belongs to creature cards, items and world art; no giant flat gray surfaces.
- Collection: dense readable portrait cards with type, level and owned state. Clicking owned Pokémon opens a full partner screen, not a giant generic dialog.
- Partner: large animated sprite; tabs for attributes, moves, evolution and held item. Exactly one task at a time, legal locked states and one primary action. Evolution eligibility and how to evolve in real-time battle are explicit.
- Formation: six ordered visual slots on a field and a horizontal owned roster. Order determines lead/reserve, not a fabricated turn-based front/back bonus. Add, replace, swap and remove are real operations.
- Inventory: item slot grid and a selected-item detail/equip panel. Purchasing belongs to shop; drawing techniques belongs to summoning. No long mixed stack of shops/draws/equip forms.
- Summoning: distinct Pokémon and techniques sections. Three banners, real costs/chances/pity, compatible technique pool and ticket counter.
- Campaign: ten selectable numbered nodes on original route art, with locked/current/cleared states and a selected-stage opponent/reward/launch panel. No fake additional chapters or rewards.
- Navigation: contextual title/back on secondary screens; bottom hub destinations; context persists when returning from partner/equip operations. Every presented command works or exposes its exact disabled reason.
- 48px controls, safe areas, landscape phone 844x390 plus 1280x720. Animation restrained to sprites, authored reveal and purposeful panel transition; reduced motion supported.
- Battle HUD stays real time with simultaneous pointer controls. No main/Render changes.

## Reference evidence
Five original promotional screenshots are preserved under research/ui-reference/x7 with source URLs in sources.json; these are research evidence, not game art. Relevant structures: collection grid, numbered route, visual formation, illustrated hub. Do not copy the promotional phone frame, huge cutout characters, monetization clutter or Chinese labels into the game.

## Process scope
Exact user-supplied game reference and explicit light-panel approval pinned this code-led replacement. No catalog roll, QUALITY BAR card or independently verified FORM seed was recorded; reference evidence is limited to the five source captures. This process gap is disclosed, not retroactively represented as a performed choice.
