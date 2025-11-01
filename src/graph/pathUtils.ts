import path from "node:path";
import { ModuleId } from "./types";

export function normalizeId(id: string, root: string): ModuleId {
    const absolute = path.isAbsolute(id) ? id : path.join(root, id);
    return path.posix.normalize(absolute).replace(/\\/g, "/");
}
