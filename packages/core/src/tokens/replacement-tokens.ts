import fs from "node:fs/promises";
import path from "node:path";
import { readCatalog } from "../catalog/store.js";
import { recordedTokenFiles, staleCatalogTokenFiles } from "../catalog/tokens.js";
import { findInitDir, findInitTokensTs } from "../fs/init-dir.js";
import { loadTokens, tokensFromCatalog, type LoadedToken } from "./load.js";
import { replacementCandidates } from "./ref-resolver.js";

export interface ReplacementTokens {
  source: "token-file" | "catalog" | "none";
  /** 치환 후보(`replacementCandidates`) — 제안(proposal) 토큰과 모드(light/dark) 토큰은 없다 */
  tokens: LoadedToken[];
  /** 읽은 토큰 전부(치환 후보가 아닌 JS 테마·모드 토큰 포함). `buildTokenRefResolver`에 넘겨 테마 참조를 토큰 사용으로 센다 */
  allTokens: LoadedToken[];
  /** 읽은 토큰 파일(또는 카탈로그 토큰의 file 합집합) */
  files: string[];
  /** 치환 대상에서 뺄 파일: 읽은 토큰 파일 전부 */
  excludeFiles: string[];
  /** 치환 대상에서 뺄 디렉터리: init 산출 디렉터리(`findInitDir`)가 있으면 [그것] */
  excludeDirs: string[];
  warnings: string[];
}

/**
 * JS 테마로 읽어도 되는 파일: detect가 사용 증거(다른 소스가 import)로 확인한 `ds.jsThemes` + init이 만든 RN `tokens.ts`.
 * `loadTokens`의 `jsFiles`에 넘긴다.
 */
export async function readableJsThemeFiles(root: string, ds: { jsThemes?: readonly { file: string }[] }): Promise<string[]> {
  return [...new Set([...(ds.jsThemes ?? []).map((t) => t.file), ...(await findInitTokensTs(root))])];
}

async function isFile(abs: string): Promise<boolean> {
  try {
    return (await fs.stat(abs)).isFile();
  } catch {
    return false;
  }
}

/**
 * 마이그레이션이 치환에 쓸 토큰. 토큰 파일 > 카탈로그, audit 제안 토큰은 어떤 경우에도 쓰지 않는다.
 * 1) tokenFiles = detect의 `ds.tokenFiles` ∪ (init 산출 디렉터리에 있는 `tokens.css`·`tokens.json`) — init 직후 detect.json이 낡아도 init 토큰을 찾는다
 * 2) 그중 읽은 토큰 파일의 토큰이 1개 이상이면 "token-file"
 * 3) 아니면 `.dsmith/catalog.json`의 토큰(기록된 토큰 파일 해시가 지금과 같을 때만) → "catalog"
 * 4) 아니면 "none"
 */
export async function loadReplacementTokens(
  root: string,
  detectTokenFiles: string[],
  /** framework = detect.framework.name. 없으면 웹으로 본다(JS 테마 토큰은 CSS·DTCG 토큰이 없을 때만 치환 대상) */
  opts: { framework?: string; jsThemeFiles?: readonly string[] } = {},
): Promise<ReplacementTokens> {
  const initDir = await findInitDir(root);
  const excludeDirs = initDir === null ? [] : [initDir];
  const tokenFiles = [...detectTokenFiles];
  if (initDir !== null) {
    for (const name of ["tokens.css", "tokens.json"]) {
      const rel = initDir === "." ? name : `${initDir}/${name}`;
      if (!tokenFiles.includes(rel) && (await isFile(path.resolve(root, rel)))) tokenFiles.push(rel);
    }
  }

  // RN init 산출(`tokens.json` 없이 `tokens.ts`만)은 JS 테마로 읽는다 — 웹 산출 쌍은 위 json·css가 정본이다
  const jsFiles = [...(opts.jsThemeFiles ?? [])];
  for (const rel of await findInitTokensTs(root)) {
    if (!tokenFiles.includes(rel)) tokenFiles.push(rel);
    jsFiles.push(rel);
  }

  // JS 파일은 사용 증거가 있는 테마(`jsThemeFiles` = detect `ds.jsThemes`)와 init이 만든 tokens.ts만 읽는다 — 나머지 .ts/.js는 main처럼 ignored
  const loaded = await loadTokens(root, tokenFiles, [], { jsFiles });
  // 치환 대상은 `replacementCandidates`(결정 2d): 웹 프레임워크에 CSS·DTCG 토큰이 있으면 JS 테마 토큰은 참조 해석에만 쓰이고 치환 대상이 아니다.
  // 그 경우 JS 테마 파일은 읽은 토큰 파일(files)에서도 뺀다 — 이전 동작과 바이트 단위로 같게 유지한다.
  const allFromFiles = loaded.tokens.filter((t) => t.source === "token-file");
  const fromFiles = replacementCandidates(allFromFiles, { framework: opts.framework ?? "" });
  const jsReplaceable = fromFiles.some((t) => t.js !== undefined);
  const jsTokenFiles = new Set(allFromFiles.filter((t) => t.js !== undefined && t.file !== undefined).map((t) => t.file));
  const loadedFiles = jsReplaceable ? loaded.files : loaded.files.filter((f) => !jsTokenFiles.has(f));
  if (fromFiles.length > 0) {
    return {
      source: "token-file",
      tokens: fromFiles,
      allTokens: allFromFiles,
      files: loadedFiles,
      excludeFiles: [...loadedFiles],
      excludeDirs,
      warnings: loaded.warnings,
    };
  }

  const warnings = [...loaded.warnings];
  try {
    const catalog = await readCatalog(root);
    if (catalog !== null && catalog.tokens.length > 0) {
      const stale = await staleCatalogTokenFiles(root, catalog);
      if (recordedTokenFiles(catalog).length === 0) {
        // 해시를 기록하지 않은 카탈로그는 신선도를 검증할 수 없다 — 검증 안 된 토큰은 쓰지 않는다
        warnings.push("카탈로그에 토큰 파일 해시가 없어 토큰을 쓰지 않음 (dsmith ai로 갱신)");
      } else if (stale.length === 0) {
        const fromCatalog = tokensFromCatalog(catalog.tokens, []);
        const catalogTokens = fromCatalog.tokens.filter((t) => t.source === "catalog");
        return {
          source: "catalog",
          tokens: catalogTokens,
          allTokens: catalogTokens,
          files: fromCatalog.files,
          excludeFiles: [...fromCatalog.files],
          excludeDirs,
          warnings,
        };
      } else {
        warnings.push(`카탈로그의 토큰 파일이 바뀌어 토큰을 쓰지 않음: ${stale.join(", ")} (dsmith ai로 갱신)`);
      }
    }
  } catch (err) {
    warnings.push((err as Error).message);
  }
  return { source: "none", tokens: [], allTokens: [], files: [], excludeFiles: [], excludeDirs, warnings };
}
