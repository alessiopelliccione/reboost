import path from "node:path";
import ora from "ora";
import kleur from "kleur";
import {
    InMemoryDependencyGraph,
    initialScan,
    startWatcher,
} from "../src";

/**
 * Educational CLI that demonstrates the typical HMR boot sequence:
 * 1. create a dependency graph
 * 2. run an initial scan to populate it
 * 3. start watching the filesystem for incremental updates
 */
async function main() {
    const entry = path.resolve(process.argv[2] ?? "src/index.ts");
    const entryLabel = path.relative(process.cwd(), entry) || entry;
    const graph = new InMemoryDependencyGraph();

    const scanSpinner = ora(
        `Scanning ${kleur.cyan().bold(entryLabel)} for initial dependency graph...`
    ).start();

    try {
        const scan = await initialScan(graph, entry);
        scanSpinner.succeed(
            `Scanned ${kleur.bold(String(scan.modules))} modules from ${kleur.cyan(
                entryLabel
            )}`
        );
    } catch (error) {
        scanSpinner.fail(`Failed to scan ${entryLabel}`);
        throw error;
    }

    const suppliedRoots = process.argv.slice(3);
    const watchRoots = (suppliedRoots.length ? suppliedRoots : [path.dirname(entry)]).map(
        root => path.resolve(root)
    );
    const watchLabel = watchRoots
        .map(root => path.relative(process.cwd(), root) || root)
        .map(root => kleur.green(root))
        .join(", ");

    const watchSpinner = ora(`Starting watcher on ${watchLabel}...`).start();
    const watcher = startWatcher(graph, watchRoots);
    watcher.on("ready", () => {
        watchSpinner.succeed(`Watching ${watchLabel}`);
        console.log(kleur.dim("Press Ctrl+C to exit."));
    });
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
