# Station Spark

Kids' (5–10) learning adventure set in a tiny fire department. React Native / Expo SDK 57 / TypeScript strict.

Read first: `docs/ARCHITECTURE.md` (contracts, folder map, rules), `docs/ART_DIRECTION.md` (palette, shapes, motion, safety) and `docs/CHARACTERS.md` (the cast, the art pipeline, the rig).
Reference art: `SPARK STATION REF ART/`. Authored character/logo art: `SVG ART/` — that art IS the shipped drawing, never redraw it.

Commands: `npm run typecheck`, `npm run lint`, `npm test`, `npm run export:web`, `npm run sfx:build`, `npm run art:build`, `npm run art:verify`.

Rules that are easy to forget: all text via `@/ui` `<Text>`; red is never "wrong"; tap targets ≥ 56 px; every tactile action = motion + sfx + haptic; no `any`; a child can always finish a mini-game; `src/characters/art/*Art.ts` is generated — edit the SVG, not the output; the cast is Bea, Rookie and the neighbours (there is no robot and no dog).
