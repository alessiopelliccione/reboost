import * as fs from "node:fs";
import { DependencyGraph, updateGraphForFile } from "../graph";
import { resolveRelative } from "../resolver/relative";

/**
 * Builds the initial dependency graph starting from a single entry point.
 * Every discovered import is pushed onto a stack so we eventually visit
 * the entire reachable module graph before the watcher starts.
 */
export async function initialScan(graph: DependencyGraph, entry: string) {
    const visited = new Set<string>();
    const stack = [entry];
    while (stack.length) {
        const id = stack.pop()!;
        if (visited.has(id)) continue;
        visited.add(id);

        const code = fs.readFileSync(id, "utf8");
        const res = await updateGraphForFile(graph, id, code, resolveRelative);
        for (const [, importee] of res.addedEdges) {
            stack.push(importee);
        }
    }
    return { modules: visited.size };
}
