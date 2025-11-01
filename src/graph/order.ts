import { DependencyGraph } from "./types";

/**
 * Produces an approximate rebuild order by walking importer chains breadth-first.
 * The closer an ancestor is to the changed module, the sooner it appears in the list.
 * This mirrors what a dev server would do when deciding which modules to re-evaluate.
 */
export function topoOrderUp(graph: DependencyGraph, changed: Set<string>): string[] {
    const dist = new Map<string, number>();
    const queue = [...changed].map(id => (dist.set(id, 0), id));
    while (queue.length) {
        const x = queue.shift()!;
        const d = dist.get(x)!;
        for (const up of graph.importersOf(x)) {
            if (!dist.has(up)) {
                dist.set(up, d + 1);
                queue.push(up);
            }
        }
    }
    return [...dist.entries()].sort((a, b) => a[1] - b[1]).map(([id]) => id);
}
