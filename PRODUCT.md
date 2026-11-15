# PULSE ARENA

<!-- impeccable:product-schema 1 -->

## Platform

android

## Stack

Existing HTML/CSS/JavaScript battle engine retained; Capacitor Android wrapper selected under the user's delegated implementation authority. Menus must not import the simulation engine before a battle. Mobile-first landscape game. Button press, navigation transitions and summon reveals must feel immediate and fluid. Browser QA validates the shared WebView UI, but Android evidence is required for native performance claims.

## Users

The owner plays on an Android phone and wants a polished, purpose-built mobile battle game. They enjoyed the existing Marshadow and fan-made Mega Marshadow. First delivery prioritizes the mobile game and fluid UI; online multiplayer and hosting are deferred.

## Product Purpose

A mobile real-time creature battle game with team building, collection and meaningful progression beyond a leaderboard. Core loop: choose an initial partner, prepare a team, clear campaign stages 1-1 through 1-10 with trainers, wild encounters, Rocket and a gym leader, receive XP and rewards, capture or summon Pokémon and adjust the formation.

## Operating Context

Landscape orientation throughout, including menus and combat. The user explicitly corrected their previous portrait request: "Vertical não por favor". Arena and touch controls must fit phones held horizontally. No server or account is required. Game resources must be bundled in the APK and operate without internet. Backgrounding pauses the battle. Device Back must dismiss dialogs or pause/return through the app, never silently discard combat.

## Capabilities and Constraints

Preserve the existing engine's Auto/manual control, guard, dodge, switching, up tofour learned moves and five difficulty settings; training supports teams of1–6. StandardGamepad/DualSense mapping supports menus and combat, pending physicalBluetoothverification. Keep Marshadow and its fan-made Mega with expanded moves. Local saved trainer profile, coins, owned collection, favorite, teams and results. Provide rewards, direct unlock and gacha with visible odds, pity and useful duplicates. No paid currency or purchases. Duplicates award diamonds, used for specific Pokémon in the shop and shiny cosmetic versions. Acquisition rarity must not directly increase battle stats. New trainers choose one of six Kanto/Johto starters at level 5. Marshadow remains obtainable in the collection, not a free starting teammate. Kanto/Johto evolutions are permanent and triggered during real-time battle at their canonical level. Moves unlock by level. Earned tickets draw compatible TM items into the inventory; an explicit use teaches the move only to an eligible owned creature. Same-version machine compatibility excludes egg and tutor moves. The Kanto banner includes each of the151 canonical species once. Held berries activate in battle, show their icon and play a short original sound. Precise reward values are implementation choices delegated by the user and must be documented/tested. Export/import is included to protect local progress across test versions.

## Brand Commitments

User chose PULSE ARENA. They approved the direction: “grafite, branco quente e ciano, com coral nos comandos principais”, “lobby com seu favorito em destaque”, short navigation and an app that feels like a finished mobile game. The latest pinned interface reference is Pokémon: Champion at https://www.x7game.com/game/app/17168. The user explicitly approved light game panels, large collection cards, spatial formation, a numbered campaign map and separate partner, inventory, shop and invocation tasks. References establish composition and craft, not permission to copy promotional art. Latest user rejected website-style persistent navigation and generated terrace art: lobby-only destinations, contextualBack and authored scenes composed from authenticFireRed tiles replace them. This approval supplies both visual identity and opening experience; no new direction interview is needed.

## Evidence on Hand

Working browser combat and Node backend live in the original pb-port main branch. All public resources have provenance records. Normal Marshadow sprites: Dejais; portraits: Top_Kec; SpriteCollab CC BY-NC 4.0. Mega Marshadow uses generated art based on a user-supplied reference, identified as fan-made. Other Pokémon assets retain their original ownership; PULSE ARENA remains a fangame. No claim of official affiliation, commercial asset ownership or measured Android performance may be invented.

## Product Principles

- Battle mechanics and readable controls come before decoration.
- Collection expands tactical choices rather than selling stronger attributes.
- Complete offline play and reliable local saves come before future online services.
- Preserve the working hosted game while building the Android migration separately.
- Validate shared UI in the browser and verify Android when tools are available; distinguish browser QA from actual device evidence.

## Accessibility & Inclusion

Portuguese UI, large touch targets, clear contrast, non-color status labels, reduced-motion support, no accidental text selection on controls, editable text fields retain normal behavior.
