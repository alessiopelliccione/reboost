import {
    DependencyGraph,
    GraphUpdateResult,
    ModuleId,
    ResolveFn,
} from "./types";
import { buildImporteeSet } from "./importeeSet";
import kleur from "kleur";
import { table, getBorderCharacters } from "table";

const borderless = getBorderCharacters("void");

/**
 * Renders a tiny table used by `logGraphUpdate`.
 * Extracted to keep the logging logic approachable for students.
 */
function renderTable(rows: string[][]) {
    return table(rows, {
        border: borderless,
        columnDefault: {
            paddingLeft: 1,
            paddingRight: 1,
        },
    })
        .trimEnd()
        .split("\n")
        .map(line => `  ${line}`)
        .join("\n");
}

/**
 * Re-parses a module, reconciles its import edges, and returns a summary diff.
 * This is the heart of incremental HMR: every edit funnels through this function.
 */
export async function updateGraphForFile(
    graph: DependencyGraph,
    fileId: ModuleId,
    fileCode: string,
    resolve: ResolveFn
): Promise<GraphUpdateResult> {
    const previousImportees = graph.importeesOf(fileId);
    const nextImportees = await buildImporteeSet(fileCode, fileId, resolve);

    const removed = [...previousImportees].filter(
        importee => !nextImportees.has(importee)
    );
    const added = [...nextImportees].filter(
        importee => !previousImportees.has(importee)
    );

    graph.replaceImportees(fileId, nextImportees);

    return {
        addedEdges: added.map(importee => [fileId, importee]),
        removedEdges: removed.map(importee => [fileId, importee]),
        previousImporteesCount: previousImportees.size,
        nextImporteesCount: nextImportees.size,
    };
}

/**
 * Walks the graph upwards to figure out which modules depend (directly or indirectly)
 * on a changed file. Bundlers use this set to decide which modules must be invalidated.
 */
export function affectedImporters(
    graph: DependencyGraph,
    changed: ModuleId
): Set<ModuleId> {
    const impacted = graph.ancestorsOf(changed);
    impacted.add(changed);
    return impacted;
}

/**
 * Pretty-prints the diff returned by `updateGraphForFile`.
 * The colourful output is intentionally pedagogical: it helps visualise
 * how edits ripple through the dependency graph.
 */
export function logGraphUpdate(res: GraphUpdateResult, label?: string) {
    if (!res.addedEdges.length && !res.removedEdges.length) {
        return;
    }

    const rows = [[kleur.bold("Change"), kleur.bold("Edge")]];

    for (const [from, to] of res.addedEdges) {
        rows.push([kleur.green("+"), `${from} -> ${to}`]);
    }

    for (const [from, to] of res.removedEdges) {
        rows.push([kleur.red("-"), `${from} -> ${to}`]);
    }

    const heading = label
        ? `[graph] ${label}`
        : `[graph] diff (${res.previousImporteesCount} -> ${res.nextImporteesCount})`;

    console.log(kleur.cyan().bold(heading));
    console.log(renderTable(rows));
}
