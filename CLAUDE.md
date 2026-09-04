# Station Spark

Kids' (5–10) learning adventure set in a tiny fire department. React Native / Expo SDK 57 / TypeScript strict.

Read first: `docs/ARCHITECTURE.md` (contracts, folder map, rules) and `docs/ART_DIRECTION.md` (palette, shapes, characters, motion, safety).
Reference art: `SPARK STATION REF ART/`.

Commands: `npm run typecheck`, `npm run lint`, `npm test`, `npm run export:web`, `npm run sfx:build`.

Rules that are easy to forget: all text via `@/ui` `<Text>`; red is never "wrong"; tap targets ≥ 56 px; every tactile action = motion + sfx + haptic; no `any`; a child can always finish a mini-game.
