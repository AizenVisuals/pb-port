# Expanded move pools and Eereon floor alignment

User clarified amplitude means more selectable moves, not attack radius/range. Pools: Ferunoga13, Hawajaku14, Kyasupada16, Eereon14; original four defaults preserved. Absol retains existing broad pool. New options copy native PB same-name behavior, type, power, cooldown and effects, with no renamed unrelated attacks. Fan-species learnsets are PB design proposals, not official learnsets.

Eereon retains Levitate and its Ground immunity. spriteGroundOffset5 offsets the species' normal hover only in drawing, clamped to current nonnegative z so feet do not draw below floor on spawn. Physics, targeting, hitboxes, stats and other species unaffected.

Full69-test suite passed. Targeted four creature tests repeated after final clamp and pool/default assertions passed. Packaged isolated release20261115-move-pools-ground. Four additional selected kits loaded and stepped in native battle engine. No APK change.
