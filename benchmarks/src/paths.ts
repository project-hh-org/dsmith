import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** benchmarks/src 또는 benchmarks/dist 기준 ../.. */
export const MONOREPO_ROOT: string = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** 경로가 모노레포 안(또는 모노레포 자신)인가. 아직 없는 경로는 가장 가까운 기존 조상의 실제 경로(심볼릭 링크 해석)로 따진다 */
export function isInsideMonorepo(p: string): boolean {
  let cur = path.resolve(p);
  const rest: string[] = [];
  for (let guard = 0; guard < 64; guard += 1) {
    try {
      cur = fs.realpathSync(cur);
      break;
    } catch {
      const parent = path.dirname(cur);
      if (parent === cur) break;
      rest.unshift(path.basename(cur));
      cur = parent;
    }
  }
  const rel = path.relative(fs.realpathSync(MONOREPO_ROOT), path.join(cur, ...rest));
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}
