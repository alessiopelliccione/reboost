# Reboost – Smart Rebuild Primer

Read the full article explaining the design:
👉 [Medium post](https://medium.com/@alessiopelliccione/how-modern-dev-servers-decide-what-to-rebuild-a-minimal-engine-254f3c746419)

Reboost is a teaching-oriented engine that mirrors the inner loop of modern dev servers (Vite, esbuild, rspack). It watches your files, maintains an incremental dependency graph, and tells you exactly which modules to refresh after every edit. The codebase is deliberately small so you can read through it in one sitting and adapt the pieces to your own experiments.

## Quick Start

```bash
npm install
npm run dev -- src/index.ts src
```

- The first argument is the entry module; Reboost performs a depth-first scan starting there.
- Additional arguments are watch roots. If you omit them, the entry’s directory is watched.
- Edit a file under the chosen roots to see colourised graph diffs, rebuild plans, and watcher notices.

Embedding Reboost in another script is just as simple:

```ts
import { InMemoryDependencyGraph, initialScan, startWatcher } from "reboost";

const graph = new InMemoryDependencyGraph();
await initialScan(graph, "src/index.ts");
startWatcher(graph, ["src"]);
```

## Architecture Tour

- **Dependency Graph (`src/graph/`)**  
  `InMemoryDependencyGraph` stores import relationships as adjacency sets. `updateGraphForFile` parses a module (stub parser today), resolves specifiers, applies the diff, and prints a summarised table with `kleur` + `table`.
- **Caching (`src/cache/hashCache.ts`)**  
  A tiny SHA-1 cache detects real content changes and short-circuits noisy file-system events.
- **Resolution (`src/resolver/relative.ts`)**  
  Resolves `./` and `../` specifiers by checking the raw path, known extensions, and `index.*` files. Swap this for bundler-specific logic when needed.
- **Runtime (`src/runtime/`)**  
  `initialScan.ts` builds the first snapshot; `watcher.ts` wires chokidar, the cache, and graph diffing; `logger.ts` renders rebuild plans and watcher lifecycle messages. The `scripts/dev.ts` runner wraps everything in `ora` spinners for a friendlier CLI.

## Extending the Prototype

- Plug in a real parser (esbuild’s scanner, Acorn) inside `src/graph/importParser.ts` to collect actual import specifiers.
- Trigger your bundler in `startWatcher` where the `TODO` placeholder sits.
- Persist the cache to disk, or record transform outputs alongside module IDs.
- Add focused tests under `tests/` (graph diffs, cache invalidation) and wire them into `npm run test`.

## Directory Map

```
src/
  cache/      # content hashing primitives
  graph/      # dependency graph + diff logging
  resolver/   # import resolution helpers
  runtime/    # initial scan, watcher, logger
scripts/      # dev runner invoked by `npm run dev`
```

Use this repository to explore hot reload mechanics without wading through production-sized code.
