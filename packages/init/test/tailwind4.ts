/**
 * Tailwind 4 `compile()` 테스트 헬퍼(패키지 밖으로 export하지 않음).
 * 계획 부록 A.2의 프로브와 같은 방식: loadStylesheet가 "tailwindcss" → tailwindcss/index.css, 그 밖은 base 기준 상대 경로.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { compile } from "tailwindcss";

const require = createRequire(import.meta.url);

/** 설치된 tailwindcss 버전(실패 메시지용) */
export function tailwindVersion(): string {
  return (JSON.parse(fs.readFileSync(require.resolve("tailwindcss/package.json"), "utf-8")) as { version: string }).version;
}

export async function buildTw4(entryCss: string, base: string, candidates: string[]): Promise<string> {
  const loadStylesheet = async (id: string, from: string): Promise<{ path: string; base: string; content: string }> => {
    const file = id === "tailwindcss" ? require.resolve("tailwindcss/index.css") : path.resolve(from, id);
    return { path: file, base: path.dirname(file), content: fs.readFileSync(file, "utf-8") };
  };
  const compiled = await compile(entryCss, { base, loadStylesheet });
  return compiled.build(candidates);
}

/** tailwindcss/theme.css의 `--이름:` 선언 집합(4.3.3에서 419개) */
export function tailwindThemeVariables(): Set<string> {
  const css = fs.readFileSync(require.resolve("tailwindcss/theme.css"), "utf-8");
  return new Set([...css.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)].map((m) => m[1] as string));
}

interface Block {
  preamble: string;
  body: string;
}

/** 최상위(depth 0) 블록들: 머리말 + 본문 */
function topLevelBlocks(css: string): Block[] {
  const blocks: Block[] = [];
  let depth = 0;
  let start = 0;
  let preamble = "";
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === "{") {
      if (depth === 0) {
        preamble = css.slice(start, i).trim();
        start = i + 1;
      }
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        blocks.push({ preamble, body: css.slice(start, i) });
        start = i + 1;
      }
    } else if (ch === ";" && depth === 0) {
      start = i + 1;
    }
  }
  return blocks;
}

const declaredVariables = (text: string): string[] => [...text.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)].map((m) => m[1] as string);

/** CSS 텍스트에서 `@layer` 밖 `:root { … }` 블록의 `--이름` 집합 */
export function unlayeredRootVariables(css: string): Set<string> {
  const out = new Set<string>();
  for (const b of topLevelBlocks(css)) {
    if (/^:root(?:\s|,|$)/.test(b.preamble) && !b.preamble.startsWith("@")) for (const v of declaredVariables(b.body)) out.add(v);
  }
  return out;
}

/** 출력의 `@layer theme { … }` 안 `--이름` 선언 집합 */
export function layerThemeVariables(css: string): Set<string> {
  const out = new Set<string>();
  for (const b of topLevelBlocks(css)) {
    if (/^@layer\s+theme$/.test(b.preamble)) for (const v of declaredVariables(b.body)) out.add(v);
  }
  return out;
}

/** 공백을 한 칸으로 줄인다(규칙 문자열 비교용) */
export const squash = (css: string): string => css.replace(/\s+/g, " ").trim();
