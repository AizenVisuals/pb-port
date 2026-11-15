# PB tactical AI and approved portraits

PB now shares the APK tactical move planner through custom/tactical-ai.js and tactical-hook.js. Exported stepRanked calls advice before the native engine step on both browser and server, every36ticks, for bot teams only, outside actions/cinematics. Uses visible state: effectiveness, physical/special stats, STAB, range, cooldown, remaining uses, HP for healing and defensive buffs. No player input inspection or extra damage.

Validated: full68-test suite passed; separate tactical hook test passed and leaves human plan untouched. Two identical seeded native-engine battles maintained equal state hashes for2500frames. Browser confirmed Mega Absol Z, Sharpness and Eereon rendering. Initial screenshot attempt timed out; repeat passed. Native head portraits exported at128px from approved source crops with no additional pixel filter. Absol preserves the light. Mega portrait faces metadata corrected from empty to Normal.

Original APK files and build untouched. Other feature parity gaps remain in PARITY.md; not represented as complete.
