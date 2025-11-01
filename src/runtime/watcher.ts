import chokidar from "chokidar";
import * as fs from "node:fs";
import * as path from "node:path";
import { HashCache } from "../cache/hashCache";
import {
    updateGraphForFile,
    affectedImporters,
    DependencyGraph,
    InMemoryDependencyGraph,
} from "../graph";
import { resolveRelative } from "../resolver/relative";
import {
    logGraphDiff,
    logRebuildPlan,
    logWatcherReady,
    logFileRemoval,
} from "./logger";

const defaultRoots = [path.resolve(process.cwd(), "src")];

/**
 * Sets up a chokidar watcher that keeps the dependency graph and rebuild plan
 * in sync with edits on disk. This is the moving part that mirrors hot reload.
 *
 * @param graph - Dependency graph instance to mutate. Defaults to the in-memory graph.
 * @param roots - Directories to watch for changes. Defaults to the conventional `src/`.
 */
export function startWatcher(
    graph: DependencyGraph = new InMemoryDependencyGraph(),
    roots: string[] = defaultRoots,
) {
    const cache = new HashCache();
    const watcher = chokidar.watch(roots, { ignoreInitial: true });

    watcher.on("ready", () => logWatcherReady(roots));

    watcher.on("change", async file => {
        if (!cache.hasChanged(file)) return; // Skip when the file content hash matches the previous run.
        const code = fs.readFileSync(file, "utf8");
        const diff = await updateGraphForFile(graph, file, code, resolveRelative);
        logGraphDiff(file, diff);

        const impacted = affectedImporters(graph, file);
        logRebuildPlan(file, impacted);
        // TODO: trigger the incremental rebuild pipeline.
    });

    watcher.on("add", async file => {
        cache.hasChanged(file); // Prime the cache with the initial hash.
        if (!fs.statSync(file).isFile()) return;
        const code = fs.readFileSync(file, "utf8");
        const diff = await updateGraphForFile(graph, file, code, resolveRelative);
        logGraphDiff(file, diff);
    });

    watcher.on("unlink", file => {
        graph.remove(file);
        logFileRemoval(file);
    });

    return watcher;
}
