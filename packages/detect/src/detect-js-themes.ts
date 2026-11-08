import { readFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import {
  JS_THEME_CANDIDATES,
  collectModuleContext,
  moduleKeyOf,
  readJsThemeTokens,
  readTsconfigPaths,
  stripModulePath,
} from "@dsmith-dev/core";
import { listFiles, type SourceFile } from "./fs-utils.js";

export interface JsThemeDetection {
  file: string;
  /** 확장자와 끝의 `/index`를 뗀 module 키 */
  module: string;
  /** 토큰을 하나 이상 낸 export 이름 */
  exports: string[];
  /** 이 module을 import하는 다른 소스 파일 수 */
  importers: number;
}

const MIN_TOKENS = 2;
const IMPORT_SUFFIXES = ["", ".ts", ".tsx", ".js", ".mjs", "/index.ts", "/index.tsx", "/index.js"];
const SPECIFIER =
  /\b(?:import|export)\b[^;'"]*?\bfrom\s*["']([^"']+)["']|\bimport\s*["']([^"']+)["']|\brequire\(\s*["']([^"']+)["']\s*\)|\bimport\(\s*["']([^"']+)["']\s*\)/g;

function specifiersOf(code: string): string[] {
  const out: string[] = [];
  for (const m of code.matchAll(SPECIFIER)) {
    const spec = m[1] ?? m[2] ?? m[3] ?? m[4];
    if (spec !== undefined) out.push(spec);
  }
  return out;
}

function resolveRelative(root: string, from: string, specifier: string): { code: string; file: string } | null {
  const base = path.posix.join(path.posix.dirname(from), specifier);
  for (const suffix of IMPORT_SUFFIXES) {
    const file = `${base}${suffix}`;
    if (suffix === "" && !/\.[cm]?[jt]sx?$/.test(file)) continue;
    try {
      return { code: readFileSync(path.resolve(root, file), "utf8"), file };
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * 쓰이는 JS 테마 모듈(결정 2a). 후보 파일 중 (a) `readJsThemeTokens` 토큰이 2개 이상이고
 * (b) 다른 소스 파일이 그 module을 import(`moduleKeyOf`로 해석)하는 것만, 파일 경로순으로 돌려준다.
 * init 산출 쌍(`tokens.ts` 옆에 `tokens.json`)은 후보가 아니다.
 */
export async function detectJsThemes(root: string, sources: SourceFile[], exclude: string[]): Promise<JsThemeDetection[]> {
  const candidates = (await listFiles(root, [...JS_THEME_CANDIDATES], exclude)).filter(
    (f) => !(/(^|\/)tokens\.(ts|js)$/i.test(f) && sibling(root, f, "tokens.json")),
  );
  if (candidates.length === 0) return [];

  const read: { file: string; module: string; exports: string[] }[] = [];
  for (const file of candidates) {
    let code: string;
    try {
      code = await fs.readFile(path.resolve(root, file), "utf-8");
    } catch {
      continue;
    }
    const module = stripModulePath(file);
    let result;
    try {
      result = readJsThemeTokens(code, file, { module, resolveImport: (s) => resolveRelative(root, file, s) });
    } catch {
      continue;
    }
    if (result.tokens.length >= MIN_TOKENS) read.push({ file, module, exports: result.exports });
  }
  if (read.length === 0) return [];

  const tsPaths = await readTsconfigPaths(root);
  const moduleContext = await collectModuleContext(root, tsPaths);
  const importers = new Map<string, Set<string>>(read.map((r) => [r.module, new Set<string>()]));
  for (const source of sources) {
    for (const spec of specifiersOf(source.content)) {
      const key = moduleKeyOf(source.file, spec, tsPaths, moduleContext);
      const set = importers.get(key);
      if (set !== undefined && source.file !== read.find((r) => r.module === key)?.file) set.add(source.file);
    }
  }
  return read
    .map((r) => ({ ...r, importers: importers.get(r.module)?.size ?? 0 }))
    .filter((r) => r.importers >= 1)
    .map(({ file, module, exports, importers: n }) => ({ file, module, exports, importers: n }));
}

function sibling(root: string, file: string, name: string): boolean {
  try {
    readFileSync(path.resolve(root, path.posix.dirname(file), name));
    return true;
  } catch {
    return false;
  }
}
