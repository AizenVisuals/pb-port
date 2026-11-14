# PULSE ARENA visual system

Direction pinned by the accepted project proposal: graphite / warm white / cyan, coral primary commands, animated favorite-led lobby. First viewport is a mobile game lobby: trainer at top, actual earned coin balance, favorite creature on an arena stage, prominent battle action, compact team strip and familiar bottom navigation. This replaces the hosted PB presentation in the new app only.

## Palette roles

- Graphite background #10141e; raised surface #1a2232; deep blue surface #131c2d.
- Warm white #f6f3eb foreground; blue-tinted secondary #aebed0.
- Cyan #57e1dd for selection, focus and energy signature.
- Coral #ff795f for primary battle action, dark foreground #23140e for readable filled buttons.
- Amber #ffcc66 for earned coins; green #88e0ad success; #ff9c95 errors.
- Rarity colors are acquisition cues with visible text, not power claims.

## Typography

Self-host Barlow for body and controls; Barlow Condensed or Archivo Black for the game wordmark and important display labels. Real copy in pt-BR. Body about 16px, secondary 14px, responsive heading hierarchy. No tiny pseudo-technical labels or unexplained meters. Tabular numerals for coins, counters and cooldowns.

## Composition and interaction

Compact phone navigation bar becomes rail on wide/tablet viewports. Every control at least 48px, safe-area padding on all edges. The app stays landscape throughout, including menus and battle, following the user correction "Vertical não por favor". Health sits above the arena, movement at left and four moves at right; bench and defensive actions have separate usable finger space. Controls remain native-like buttons and selects, not decorative cockpit replicas. Show cooldown/reach/disabled state explicitly. Battle UI honors game readability over visual experimentation.

The signature motion is a short cyan pulse from the arena stage during selection, battle start and invocation reveal. Actual sprite animation is the artifact in the lobby. Remove-motion mode replaces pulses/reveal travel with immediate transitions. No gradient type, decorative glass, grid wallpaper or copied PB header. Arena geometry may use circles/ellipses as arena content, not background pattern.

## Surface modes

Lobby and invocation reveal: Experience with clear actions. Team/collection/rewards: Operate. Help and probability explanations: Read. Maintain the same identity across all screens.

## QA contract

Verify actual browser rendering at landscape phone widths and larger responsive viewports, narrow text, focus, buttons, menu navigation, collection lock handling, save restore, reward and pity behavior, control cancellation, pause/resume and one full battle with network access disabled beyond local packaged resources. Build the Android APK, inspect package and resources. Native device behavior and performance remain unverified until emulator/device evidence exists; do not call browser screenshots Android screenshots.
