import { ModuleId, ParseResult } from "./types";

/**
 * Parses a module's source code to locate import specifiers.
 * This placeholder keeps the API shape intact so the rest of the pipeline
 * can be studied before wiring a real parser (esbuild scan, Acorn, SWC, etc.).
 */
export async function parseImportSpecifiers(
    code: string,
    fromId: ModuleId
): Promise<ParseResult> {
    // TODO: implement a real parser (esbuild scan, Acorn, etc.).
    // Placeholder keeps behaviour stable until parsing is wired in.
    void code;
    void fromId;
    return { importees: new Set() };
}
