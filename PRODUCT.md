# PULSE ARENA

<!-- impeccable:product-schema 1 -->

## Platform

android

## Stack

Existing HTML/CSS/JavaScript battle engine retained; Capacitor Android wrapper selected under the user's delegated implementation authority. Menus must not import the simulation engine before a battle. The app is a custom game UI rather than an Android productivity tool.

## Users

The owner plays on an Android phone and wants a polished, purpose-built mobile battle game. They enjoyed the existing Marshadow and fan-made Mega Marshadow. First delivery is a local playable APK against bots; online multiplayer and hosting are deferred.

## Product Purpose

A mobile real-time creature battle game with team building, collection and meaningful progression beyond a leaderboard. Core loop: prepare team, battle bot, receive earned rewards, unlock or summon collection options, adjust team.

## Operating Context

Landscape orientation throughout, including menus and combat. The user explicitly corrected their previous portrait request: "Vertical não por favor". Arena and touch controls must fit phones held horizontally. No server or account is required. Game resources must be bundled in the APK and operate without internet. Backgrounding pauses the battle. Device Back must dismiss dialogs or pause/return through the app, never silently discard combat.

## Capabilities and Constraints

Preserve the existing engine's Auto/manual control, guard, dodge, switching, four selected moves, 3v3/6v6 bot battles and five difficulty settings. Keep Marshadow and its fan-made Mega with expanded moves. Local saved trainer profile, coins, owned collection, favorite, teams and results. Provide rewards, direct unlock and gacha with visible odds, pity and useful duplicates. No paid currency or purchases. Acquisition rarity must not directly increase battle stats. Player starts with a usable team, including Marshadow. Precise reward values are implementation choices delegated by the user and must be documented/tested. Export/import is included to protect local progress across test versions.

## Brand Commitments

User chose PULSE ARENA. They approved the direction: “grafite, branco quente e ciano, com coral nos comandos principais”, “lobby com seu favorito em destaque”, short navigation and an app that feels like a finished mobile game. References to Pokémon Unite/Masters establish a craft bar and mobile organization, not permission to copy their visual assets/UI. This approval supplies both visual identity and opening experience; no new direction interview is needed.

## Evidence on Hand

Working browser combat and Node backend live in the original pb-port main branch. All public resources have provenance records. Normal Marshadow sprites: Dejais; portraits: Top_Kec; SpriteCollab CC BY-NC 4.0. Mega Marshadow uses generated art based on a user-supplied reference, identified as fan-made. Other Pokémon assets retain their original ownership; PULSE ARENA remains a fangame. No claim of official affiliation, commercial asset ownership or measured Android performance may be invented.

## Product Principles

- Battle mechanics and readable controls come before decoration.
- Collection expands tactical choices rather than selling stronger attributes.
- Complete offline play and reliable local saves come before future online services.
- Preserve the working hosted game while building the Android migration separately.
- Verify an actual APK build; distinguish browser QA from physical Android verification.

## Accessibility & Inclusion

Portuguese UI, large touch targets, clear contrast, non-color status labels, reduced-motion support, no accidental text selection on controls, editable text fields retain normal behavior.
