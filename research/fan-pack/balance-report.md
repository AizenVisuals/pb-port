# PB fan pack — balance/QA snapshot

Scope: local actual PB engine. No production matches, users or server touched. Current stat/move data read from the branch at execution time. Only Ferunoga art/assets were available; other new forms were not simulated.

## Inputs
- FOUND: public/custom/fan-pack.js, fan-pack-data.js, PB native engine and old species, baked Ferunoga assets.
- FOUND: proposed roles and budgets in research/fan-pack/DESIGN.md.
- ABSENT at run: complete Hawajaku/Kyasupada/Eereon/MegaAbsolZ assets; those combat/visual checks are NOT ASSESSED.

## Ferunoga seeded sample
Level50, bot-vs-bot1v1 in stadium, seeds7/31/71/151, no selected Mega or held items. Cap18000steps; no timed-out/incomplete battles. The same red/Ferunoga and blue/opponent seating was used, so position/side bias is not controlled.

| Opponent | Wins | Losses | Unfinished | Mean frames |
|---|---:|---:|---:|---:|
| charizard | 4 | 0 | 0 | 3722 |
| greninja | 0 | 4 | 0 | 2411 |
| gengar | 4 | 0 | 0 | 1668 |
| lucario | 0 | 4 | 0 | 1287 |
| venusaur | 1 | 3 | 0 | 2178 |

Total: 9/20 victories. Raw HP, move counts, frames, seeds and fighter levels are in balance-ferunoga.json.

## Assessment
No material overall numerical imbalance established by this sample. Outcomes show strong matchup dependence: Greninja and Lucario won all four of their games, while Ferunoga won all four against Charizard and Gengar. Venusaur unexpectedly won3/4despite the apparent Fire advantage; coverage, recovery and actual AI timing deserve a replay before attributing that result to typing alone. These results show counters rather than grounds to buff away weaknesses. Do not advertise a competitive win rate from these20fixed-seed AI duels. No stat change recommended solely from this run.

## Invariant tests
test/fan-pack.test.mjs: registration/stat budgets530forstarters and525forEereon; every default references a real canonical named PB move with matching type/power/CD; MegaAbsolZ565canonicalstats/type/Sharpness; MegaMarshadowZ700fanbudget and preservedHPbase; real Ferunoga battle; MegaMarshadowZ transforms once without healing or replacing selected moves. Four tests passed.

## Remaining checks
- New forms other than Ferunoga: actual animation/load/battle and matchup matrix pending their assets.
- MegaAbsolZ: actual transform/no-heal/render pending sprite availability.
- Human play, team synergies, switched sides, held-item variants and larger samples not assessed.
- Root owns deployment and two-client PvP test against staging; no claim of public readiness from this report.


## Additional Mega matrix
MegaMarshadowZvsnativeMega20gamescompleted:8/20wins, bothsidesMegaEvolvedexactlyonceineverygame, no unfinishedgames. Fulltable/forms/abilities/sidecontrolsandlimits: balance-mega-report.md; rawdata balance-mega-marshadow-z.json. No stat changes applied.
