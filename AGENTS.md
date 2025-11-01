# Repository Guidelines

## Project Structure & Module Organization
- Source lives in `src/`, split by concern: dependency graph utilities in `src/graph`, cache primitives in `src/cache`, runtime orchestration in `src/runtime`, and resolution helpers in `src/resolver`.
- `src/index.ts` re-exports the public surface. Prefer importing from the root entry (`import { InMemoryDependencyGraph } from "reboost";`) to keep module boundaries consistent.
- Keep experimental code outside this repo; consumer projects should wire Reboost into their own dev servers.

## Build, Test, and Development Commands
- `npm run build` compiles TypeScript to `dist/` via `tsc -p tsconfig.json`. Run before publishing or consuming from plain Node.
- `npm run test` currently outputs a placeholder message. Replace it with real checks when suites are added.
- Consumers integrate runtime features (e.g., `startWatcher`) from their own scripts; this repo does not ship a CLI.

## Coding Style & Naming Conventions
- Use two-space indentation and TypeScript modules with `NodeNext` semantics. Keep files ASCII unless a dependency requires otherwise.
- Functions and variables use `camelCase`; classes and exported types use `PascalCase`.
- Group shared exports through barrel files (`src/graph/index.ts`, `src/index.ts`) and avoid deep relative imports from outside a package boundary.

## Testing Guidelines
- Adopt lightweight unit tests under `tests/` (e.g., `tests/graph/updateGraph.test.ts`) when behaviour stabilises. Aim to cover graph diffing, cache invalidation, and watcher side effects.
- Mock filesystem access (`fs`) and chokidar events to keep tests deterministic.
- Update `npm run test` to execute the suite once tests exist; ensure it runs as part of CI.

## Commit & Pull Request Guidelines
- Write imperative commit subjects (`Refactor graph diff`, `Add cache invalidation hook`) capped at ~72 characters.
- Keep commits scoped and self-contained; avoid bundling unrelated refactors with feature work.
- Pull requests should describe the change, list validation steps (`npm run build`), and call out any follow-up work (e.g., TODOs for real parser integration).
- Reference linked issues or RFCs when available, and include regression details if the PR fixes a bug.
