# Three.js 3D world with a 2D lite renderer on one simulation

The original spec chose PixiJS 2D cards and rejected 3D to fit the 3 MB budget. PRD v3 made an open world a P0 requirement, so we render the World in low-poly Three.js, with geometry generated in code and one CC0 character. A 2D top-down Canvas renderer reads the same world data and simulation, so devices without WebGL (including the dev Mac) keep full movement and interaction.

**Status:** accepted on 17 Oct 2026, conditional on a half-day spike on the test phone (Infinix HOT 40i): one street block, ~20 buildings, a walking character, 5 NPCs, 30+ fps with shadows off. If it fails, the World is rendered as isometric Canvas2D instead, and the simulation and world data are unchanged.

## Considered options

- **Isometric Canvas2D only**: works on the dev Mac and is lighter, but falls short of the visual bar @ikenna set (Lagos Life).
- **Building both 3D and isometric to compare**: too much for a two-person team.

## Consequences

The dev Mac cannot render WebGL even in software, so 3D changes are checked by screenshotting the phone over adb. The test phone is above the 2 GB device floor, so a low-end Android must be tested before closed beta.
