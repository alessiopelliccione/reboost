/**
 * Canonical identifier for a module on disk or virtually generated.
 * The runtime normalises IDs so that they can be compared and cached reliably.
 */
export type ModuleId = string;

/**
 * Snapshot of a single module inside the dependency graph.
 * Each node keeps track of who it imports and who imports it,
 * allowing fast upward/downward traversals during invalidation.
 */
export interface DependencyNode {
    id: ModuleId;
    importees: Set<ModuleId>;
    importers: Set<ModuleId>;
}

/**
 * Minimal API a dependency graph implementation must satisfy.
 * Reboost ships with an in-memory Map, but you can swap in a persistent store
 * or even a distributed graph as long as it adheres to these contracts.
 */
export interface DependencyGraph {
    getNode(id: ModuleId): DependencyNode | undefined;
    ensureNode(id: ModuleId): DependencyNode;
    link(importer: ModuleId, importee: ModuleId): void;
    unlink(importer: ModuleId, importee: ModuleId): void;
    replaceImportees(id: ModuleId, nextImportees: Set<ModuleId>): void;
    remove(id: ModuleId): void;
    importersOf(id: ModuleId): Set<ModuleId>;
    importeesOf(id: ModuleId): Set<ModuleId>;
    ancestorsOf(id: ModuleId): Set<ModuleId>;
    descendantsOf(id: ModuleId): Set<ModuleId>;
}

/**
 * Raw import specifiers discovered while parsing a module.
 * They are stored as-is, before resolution to absolute IDs.
 */
export interface ParseResult {
    importees: Set<ModuleId>;
}

/**
 * Resolves an import specifier (e.g. "./foo") relative to the importer.
 * Returning null signals that the specifier could not be resolved by this strategy.
 */
export type ResolveFn = (specifier: string, importer: ModuleId) => ModuleId | null;

/**
 * Summary emitted after each graph update.
 * Added/removed edges power the logging layer and incremental rebuild decisions.
 */
export interface GraphUpdateResult {
    addedEdges: Array<[ModuleId, ModuleId]>;
    removedEdges: Array<[ModuleId, ModuleId]>;
    previousImporteesCount: number;
    nextImporteesCount: number;
}
