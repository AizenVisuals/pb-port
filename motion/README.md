# PULSE ARENA motion

Editable Remotion composition for the invocation portal. The game ships only the rendered local H.264 clip; React and Remotion are development tools, not game runtime dependencies.

- Source: `src/index.jsx`, composition `PulsePortal`.
- 960 × 540, 60 fps, 72 frames / 1.2 seconds, no audio.
- Output: `../public/pulse/assets/motion/portal.mp4`.
- `npm ci`, then `npm run render`. The render script points at the verified local Chromium; change `--browser-executable` on another machine.
- Skip and reduced motion are implemented in the game controller. The gacha result is committed before the clip starts; the video never chooses the Pokémon.
