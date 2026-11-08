import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_DIR = "design-system";

async function isFile(abs: string): Promise<boolean> {
  try {
    return (await fs.stat(abs)).isFile();
  } catch {
    return false;
  }
}

const tokensJson = (dir: string): string => (dir === "." ? "tokens.json" : `${dir}/tokens.json`);

/**
 * init 산출 디렉터리. init 패키지를 import하지 않고 `.dsmith/init.json`만 읽는다.
 *  1. 매니페스트의 `outDir`(init이 가장 최근 실행에 기록) — `<dir>/tokens.json`이 있을 때
 *  2. 엔트리 키 중 "<dir>/tokens.json"의 dir(옛 매니페스트; 여러 개면 이름순 첫째)
 *  3. "design-system/tokens.json"이 있으면 "design-system"
 *  4. null
 */
export async function findInitDir(root: string): Promise<string | null> {
  try {
    const parsed = JSON.parse(await fs.readFile(path.join(root, ".dsmith", "init.json"), "utf-8")) as {
      entries?: Record<string, unknown>;
      outDir?: unknown;
    };
    if (typeof parsed.outDir === "string" && parsed.outDir !== "" && (await isFile(path.join(root, tokensJson(parsed.outDir))))) {
      return parsed.outDir;
    }
    const keys = Object.keys(parsed.entries ?? {}).sort();
    for (const key of keys) {
      if (key.includes("#")) continue;
      if (key === "tokens.json") return ".";
      if (key.endsWith("/tokens.json")) return key.slice(0, -"/tokens.json".length);
    }
  } catch {
    // 매니페스트 없음·깨짐 → 기본 위치 확인
  }
  return (await isFile(path.join(root, DEFAULT_DIR, "tokens.json"))) ? DEFAULT_DIR : null;
}

/**
 * init이 쓴 RN 형식 `tokens.ts`(`<dir>/tokens.json` 없이 `tokens.ts`만 있는 산출). 매니페스트 엔트리에 있고 파일이 있고
 * 옆에 `tokens.json`이 없는 것만, 경로순. 웹 init 산출(json·css·ts 한 묶음)과 사용자가 직접 둔 `tokens.ts`는 아니다.
 */
export async function findInitTokensTs(root: string): Promise<string[]> {
  let keys: string[];
  try {
    const parsed = JSON.parse(await fs.readFile(path.join(root, ".dsmith", "init.json"), "utf-8")) as {
      entries?: Record<string, unknown>;
    };
    keys = Object.keys(parsed.entries ?? {}).sort();
  } catch {
    return [];
  }
  const found: string[] = [];
  for (const key of keys) {
    if (key.includes("#") || !(key === "tokens.ts" || key.endsWith("/tokens.ts"))) continue;
    const json = `${key.slice(0, -"tokens.ts".length)}tokens.json`;
    if ((await isFile(path.join(root, key))) && !(await isFile(path.join(root, json)))) found.push(key);
  }
  return found;
}

/** `.dsmith/init.json` 엔트리의 키 → 마지막으로 쓴 내용의 sha256. 없거나 깨졌으면 빈 맵. */
export async function readInitHashes(root: string): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  try {
    const parsed = JSON.parse(await fs.readFile(path.join(root, ".dsmith", "init.json"), "utf-8")) as {
      entries?: Record<string, { sha256?: unknown } | null>;
    };
    for (const [key, entry] of Object.entries(parsed.entries ?? {})) {
      if (typeof entry?.sha256 === "string") out.set(key, entry.sha256);
    }
  } catch {
    // 매니페스트 없음·깨짐 — 골격 판정 불가
  }
  return out;
}
