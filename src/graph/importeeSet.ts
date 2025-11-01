import { ModuleId, ResolveFn } from "./types";
import { parseImportSpecifiers } from "./importParser";

/**
 * Converts raw specifiers collected during parsing into concrete module IDs.
 * Resolution combines the parser + resolver so the rest of the system can work
 * entirely with normalised identifiers.
 */
export async function buildImporteeSet(
    code: string,
    importerId: ModuleId,
    resolve: ResolveFn
): Promise<Set<ModuleId>> {
    const raw = await parseImportSpecifiers(code, importerId);
    const resolved = new Set<ModuleId>();

    for (const specifier of raw.importees) {
        const id = resolve(specifier, importerId);
        if (id) {
            resolved.add(id);
        }
        // TODO: collect unresolved specifiers for diagnostics if needed.
    }

    return resolved;
}
