import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import type { ResolverConfig } from "./resolve.js";
import { scoreIndependent, type IndepChange } from "./score.js";
import { readThemeVarKeys } from "./tailwind.js";
import { typeCheckChanged } from "./typecheck.js";
import type { IndependentScore, TypeCheckRecord } from "./types.js";

export { scoreIndependent, multisetNew, definedVars, indepRatio } from "./score.js";
export type { IndepChange, IndependentInput } from "./score.js";
export { typeCheckChanged, MODE_FULL, MODE_NO_DEPS } from "./typecheck.js";
export { classStringOccurrences, cssTextOccurrences, declarationOccurrences, scanScript } from "./scan.js";
export { scanCss, declaredCustomProperties } from "./css.js";
export { scanColors, scanLengths, scanVarRefs, NAMED_COLORS } from "./colors.js";
export { PALETTE_PATTERNS } from "./tailwind.js";
export { resolveLocal, isDsModule } from "./resolve.js";
export type { ResolverConfig } from "./resolve.js";
export type { IndepCounts, IndependentScore, TypeCheckRecord } from "./types.js";

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", ".dsmith", ".claude"]);
const MAX_BYTES = 1024 * 1024;

/** root 아래 모든 .css 파일(root 상대 POSIX → 내용). 읽을 수 없거나 1MB를 넘는 파일은 건너뛴다 */
export function readCssFiles(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (rel: string): void => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(path.join(root, rel), { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const r = rel === "" ? e.name : `${rel}/${e.name}`;
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) walk(r);
      } else if (e.isFile() && e.name.endsWith(".css")) {
        try {
          const abs = path.join(root, r);
          if (fs.statSync(abs).size <= MAX_BYTES) out[r] = fs.readFileSync(abs, "utf-8");
        } catch {
          // 건너뜀
        }
      }
    }
  };
  walk("");
  return out;
}

/** tsconfig.json의 baseUrl·paths를 일반 데이터로 읽는다(extends는 따라가지 않는다). 없으면 baseUrl "" · paths {} */
export function readResolverConfig(root: string): ResolverConfig {
  const file = path.join(root, "tsconfig.json");
  try {
    const read = ts.readConfigFile(file, ts.sys.readFile);
    const options: unknown = read.config === undefined ? undefined : (read.config as { compilerOptions?: unknown }).compilerOptions;
    if (typeof options !== "object" || options === null) return { baseUrl: "", paths: {} };
    const o = options as { baseUrl?: unknown; paths?: unknown };
    const baseUrl = typeof o.baseUrl === "string" ? path.posix.normalize(o.baseUrl).replace(/^\.$/, "").replace(/^\.\//, "") : "";
    const paths: Record<string, string[]> = {};
    if (typeof o.paths === "object" && o.paths !== null) {
      for (const [k, v] of Object.entries(o.paths)) if (Array.isArray(v)) paths[k] = v.filter((x): x is string => typeof x === "string");
    }
    return { baseUrl, paths };
  } catch {
    return { baseUrl: "", paths: {} };
  }
}

/** tailwind 설정·프리셋(root의 tailwind.config.* 와 design-system/ 아래 tailwind.preset.*)에서 `키 → --var 이름`을 읽는다 */
export function readThemeVars(root: string): Map<string, string> {
  const out = new Map<string, string>();
  const read = (file: string): void => {
    try {
      for (const [k, v] of readThemeVarKeys(fs.readFileSync(file, "utf-8"))) out.set(k, v);
    } catch {
      // 파일 없음
    }
  };
  for (const ext of ["ts", "js", "mjs", "cjs"]) read(path.join(root, `tailwind.config.${ext}`));
  for (const dir of ["design-system", "."]) {
    try {
      for (const e of fs.readdirSync(path.join(root, dir))) if (/^tailwind\.preset\./.test(e)) read(path.join(root, dir, e));
    } catch {
      // 폴더 없음
    }
  }
  return out;
}

/** `.dsmith/guard.json` 스냅샷의 `ds.modules`를 일반 JSON으로 읽는다. 없거나 모양이 다르면 [] */
export function readDsModules(root: string): string[] {
  try {
    const v: unknown = JSON.parse(fs.readFileSync(path.join(root, ".dsmith", "guard.json"), "utf-8"));
    const ds = typeof v === "object" && v !== null ? (v as { ds?: unknown }).ds : undefined;
    const modules = typeof ds === "object" && ds !== null ? (ds as { modules?: unknown }).modules : undefined;
    return Array.isArray(modules) ? modules.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export interface EvaluateInput {
  /** 복사본(또는 replay 베이스) 절대 경로 — 실행이 끝난 상태. 바뀐 파일은 changes가 우선한다 */
  root: string;
  changes: readonly IndepChange[];
  /** 스냅샷의 ds.modules. 없으면 root/.dsmith/guard.json에서 읽는다 */
  dsModules?: readonly string[];
}

/** 바뀐 파일을 독립 채점하고 타입 검사한다. 던지지 않는다(타입 검사 실패는 TypeCheckRecord.error) */
export function evaluateIndependent(input: EvaluateInput): { independent: IndependentScore; typeCheck: TypeCheckRecord } {
  const { root, changes } = input;
  const cssFiles = readCssFiles(root);
  const overlay = new Map<string, string>();
  for (const c of changes) {
    if (c.status === "deleted") {
      delete cssFiles[c.file];
      continue;
    }
    if (c.after === null) continue;
    overlay.set(c.file, c.after);
    if (c.file.endsWith(".css")) cssFiles[c.file] = c.after;
  }
  const independent = scoreIndependent({
    changes,
    cssFiles,
    dsModules: input.dsModules ?? readDsModules(root),
    resolver: readResolverConfig(root),
    themeVars: readThemeVars(root),
  });
  const typeCheck = typeCheckChanged({ root, overlay, files: independent.files.map((f) => f.file) });
  return { independent, typeCheck };
}
