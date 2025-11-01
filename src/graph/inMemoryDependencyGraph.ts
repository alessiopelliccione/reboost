import { DependencyGraph, DependencyNode, ModuleId } from "./types";

/**
 * Straightforward in-memory graph backed by a `Map`.
 * Ideal for tutorials and local tooling where the graph fits comfortably in RAM.
 * The implementation favours clarity over micro-optimisations so readers can
 * follow each mutation step-by-step.
 */
export class InMemoryDependencyGraph implements DependencyGraph {
    private nodes = new Map<ModuleId, DependencyNode>();

    /**
     * Returns the node for a given module ID if it exists.
     */
    getNode(id: ModuleId) {
        return this.nodes.get(id);
    }

    /**
     * Ensures that a node exists for the provided ID and returns it.
     * This pattern keeps edge creation concise by creating nodes on demand.
     */
    ensureNode(id: ModuleId): DependencyNode {
        let node = this.nodes.get(id);
        if (!node) {
            node = {
                id,
                importees: new Set(),
                importers: new Set(),
            };
            this.nodes.set(id, node);
        }
        return node;
    }

    /**
     * Creates a directional edge from importer -> importee.
     * Both nodes are created automatically if they are not already present.
     */
    link(importer: ModuleId, importee: ModuleId): void {
        const importerNode = this.ensureNode(importer);
        const importeeNode = this.ensureNode(importee);

        if (!importerNode.importees.has(importeeNode.id)) {
            importerNode.importees.add(importeeNode.id);
        }

        if (!importeeNode.importers.has(importerNode.id)) {
            importeeNode.importers.add(importerNode.id);
        }
    }

    /**
     * Removes the edge importer -> importee if both nodes exist.
     */
    unlink(importer: ModuleId, importee: ModuleId): void {
        const importerNode = this.nodes.get(importer);
        const importeeNode = this.nodes.get(importee);
        if (!importerNode || !importeeNode) {
            return;
        }
        importerNode.importees.delete(importeeNode.id);
        importeeNode.importers.delete(importerNode.id);
    }

    /**
     * Replaces the set of importees for a given module, unlinking stale edges
     * and linking any new connections. This keeps the graph resilient to edits
     * where a module drastically changes its imports.
     */
    replaceImportees(id: ModuleId, nextImportees: Set<ModuleId>) {
        const node = this.ensureNode(id);

        for (const oldImportee of node.importees) {
            if (!nextImportees.has(oldImportee)) {
                this.unlink(id, oldImportee);
            }
        }

        for (const newImportee of nextImportees) {
            if (!node.importees.has(newImportee)) {
                this.link(id, newImportee);
            }
        }
    }

    /**
     * Removes a node from the graph and cleans up both incoming and outgoing edges.
     */
    remove(id: ModuleId) {
        const node = this.nodes.get(id);
        if (!node) {
            return;
        }

        for (const importer of node.importers) {
            this.unlink(importer, id);
        }

        for (const importee of node.importees) {
            this.unlink(id, importee);
        }

        this.nodes.delete(id);
    }

    /**
     * Returns a copy of the modules that import the provided ID.
     */
    importersOf(id: ModuleId) {
        return new Set(this.nodes.get(id)?.importers ?? []);
    }

    /**
     * Returns a copy of the modules imported by the provided ID.
     */
    importeesOf(id: ModuleId) {
        return new Set(this.nodes.get(id)?.importees ?? []);
    }

    /**
     * Walks up the graph collecting every ancestor (direct and transitive importer).
     * This is the foundational operation for deciding which modules to invalidate.
     */
    ancestorsOf(id: ModuleId) {
        const seen = new Set<ModuleId>();
        const stack = [...(this.nodes.get(id)?.importers ?? [])];

        while (stack.length) {
            const current = stack.pop()!;
            if (seen.has(current)) {
                continue;
            }

            seen.add(current);
            for (const upstream of this.nodes.get(current)?.importers ?? []) {
                stack.push(upstream);
            }
        }

        return seen;
    }

    /**
     * Walks down the graph collecting every descendant (modules imported by the ID).
     * Handy for debugging or for bundlers that need to know downstream consumers.
     */
    descendantsOf(id: ModuleId) {
        const seen = new Set<ModuleId>();
        const stack = [...(this.nodes.get(id)?.importees ?? [])];

        while (stack.length) {
            const current = stack.pop()!;
            if (seen.has(current)) {
                continue;
            }

            seen.add(current);
            for (const downstream of this.nodes.get(current)?.importees ?? []) {
                stack.push(downstream);
            }
        }

        return seen;
    }
}
