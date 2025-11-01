import * as fs from "node:fs";
import { createHash } from "node:crypto";

/**
 * Tiny content-addressable cache used by the watcher.
 * Every time a file event fires, we compute its SHA-1 hash; if the hash matches
 * the previous run we can safely skip expensive graph updates.
 */
export class HashCache {
    private map = new Map<string, string>();

    /**
     * Reads a file from disk and returns its SHA-1 fingerprint.
     * In production you might swap this for a faster hashing algorithm,
     * but SHA-1 keeps the example deterministic and easy to reason about.
     */
    hashOf(id: string) {
        const buf = fs.readFileSync(id);
        return createHash("sha1").update(buf).digest("hex");
    }

    /**
     * Returns true if the file's content hash differs from the cached value.
     * The cache is updated regardless of the outcome so future comparisons
     * always operate on the most recent state.
     */
    hasChanged(id: string) {
        const next = this.hashOf(id);
        const prev = this.map.get(id);
        this.map.set(id, next);
        return prev !== next;
    }
}
