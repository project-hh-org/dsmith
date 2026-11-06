import path from "node:path";
import { fileURLToPath } from "node:url";

/** benchmarks/src 또는 benchmarks/dist 기준 ../.. */
export const MONOREPO_ROOT: string = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
