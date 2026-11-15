# PB creature pack — delivered

Scope: PB combat website only. No APK, main or Render updates. User corrected Mega Marshadow Z; no change remains to existing Marshadow/Mega.

Live release: /home/bloody/.local/share/pb-selfhost/releases/20261115-fan-pack-v2 on port3015. Existing Cloudflare tunnel preserved. Public URL: https://exclusion-raise-antarctica-statement.trycloudflare.com/ . Profiles preserved in external DATA_DIR; private backups and previous releases retained outside Git.

Playable: Ferunoga, Hawajaku, Kyasupada, Eereon; Mega Absol Z through Absol + Mega gimmick. Four final forms, not all earlier evolution stages. New cards grouped as Convidados / Fan-made; concepts credited in credits.html.

After user rejected stiff locomotion, all five received dedicated Walk sheets: Absol and Umbreon gait references for quadrupeds, Arbok for serpent, Blaziken for peacock, Gallade for swordsman. Four phases in eight directions; serpent six phases. Idle/attack sheets remain separate. Other action aliases still share poses; do not claim41 uniquely drawn animations.

Verification:
- Full suite67 passed before locomotion-only asset revision.
-7 creature/Marshadow tests passed after new locomotion assets, including actual Mega ability Sharpness, typing, HP and selected moves retained.
-4 isolated server tests passed: original client HTTP, profiles/invalid teams, practice, two clients with new species sharing seed/commands/result.
- Browser selected all four new cards with loaded portraits and rendered practice battle, no page errors.
- Browser rendered Mega Absol Z and Eereon; confirmed Sharpness and Dark/Ghost. Repeated through public tunnel.
- Native runtime steering activates Walk and moves all four new species. Mega Absol Z checked separately after full transformation.
- Seeded bot sample: Ferunoga20; other three finals and Mega Absol Z8 each,52 total, none unfinished. Preliminary regression sample, not human competitive balance proof. Absol rerun after Sharpness registration fix.
- Native-size and enlarged pose previews inspected. walk-cycles.gif is a uniform-timing preview of actual Walk drawings, not gameplay recording.

Reproduction: node scripts/package-pb-fan.mjs ORIGINAL_PB_RELEASE NEW_RELEASE . This overlays only fan pack onto original combat release, avoiding PULSE growth and UI. Do not copy root PULSE engine bundle to public combat server. deploy-local.py refuses a restart while clients/matches are present and retains rollback path.

Source branch: fan-pack-public. See DESIGN.md, RESEARCH.md, art-manifest.json, balance-finals.json and balance-ferunoga.json.
