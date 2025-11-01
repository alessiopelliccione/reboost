import * as path from "node:path";
import * as fs from "node:fs";

const extensions = [".ts", ".tsx", ".js", ".jsx"];

/**
 * Resolves relative specifiers (`./foo`, `../bar`) to absolute file paths.
 * This mirrors the minimal behaviour shared by many dev servers and keeps the focus
 * on dependency-graph mechanics rather than bundler-specific resolution rules.
 */
export function resolveRelative(spec: string, importer: string): string | null {
    if (!spec.startsWith(".")) return null; // Bail out on bare imports (handled externally).
    const base = path.resolve(path.dirname(importer), spec);

    if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;

    // Try resolving by appending supported extensions.
    for (const ext of extensions) {
        if (fs.existsSync(base + ext)) return base + ext;
    }

    // Fall back to an index file inside the target directory.
    for (const ext of extensions) {
        const idx = path.join(base, "index" + ext);
        if (fs.existsSync(idx)) return idx;
    }

    return null;
}
