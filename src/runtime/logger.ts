import kleur from "kleur";
import { table, getBorderCharacters } from "table";
import type { GraphUpdateResult } from "../graph";
import { logGraphUpdate } from "../graph";

const borderless = getBorderCharacters("void");

/**
 * Shared helper that renders a minimal table with no borders.
 * Tables make diffs easier for learners to parse at a glance.
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
 * Forwards the diff to the core `logGraphUpdate` helper, providing the file label.
 * This indirection keeps the runtime free from import cycles while exposing
 * a friendly teaching API here.
 */
export function logGraphDiff(label: string, diff: GraphUpdateResult) {
    logGraphUpdate(diff, label);
}

/**
 * Prints the order in which ancestor modules should be revalidated.
 * Seeing the ranked list reinforces how dependency invalidation propagates.
 */
export function logRebuildPlan(changed: string, impacted: Set<string>) {
    const rows = [[kleur.bold("Order"), kleur.bold("Module")]];
    const ordered = [...impacted];

    ordered.forEach((id, idx) => {
        rows.push([
            idx === 0 ? kleur.yellow("source") : String(idx),
            idx === 0 ? kleur.yellow(id) : id,
        ]);
    });

    const heading = impacted.size
        ? kleur.magenta(`[rebuild] change ${kleur.bold(changed)}`)
        : kleur.gray(`[rebuild] change ${changed} (no dependants)`);

    console.log(heading);
    if (impacted.size) {
        console.log(renderTable(rows));
    }
}

export function logWatcherReady(roots: string[]) {
    console.log(
        kleur.bold().green(
            `[watcher] Listening on ${roots.map(root => kleur.white(root)).join(", ")}`
        )
    );
}

/**
 * Highlights when a module disappears from disk so you notice cascading invalidations.
 */
export function logFileRemoval(file: string) {
    console.log(kleur.red(`[unlink] ${file} removed from the dependency graph`));
}
