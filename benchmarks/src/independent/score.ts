import { declaredCustomProperties, scanCss } from "./css.js";
import type { ResolverConfig } from "./resolve.js";
import { scanScript, type ScriptScanContext } from "./scan.js";
import { emptyIndepCounts, occKey, type IndepCounts, type IndepFileScore, type IndependentScore, type Occurrence } from "./types.js";

/**
 * dsmith와 독립인 채점. @dsmith-dev/* 패키지도, 이 저장소의 다른 워크스페이스 코드도 import하지 않는다(test/independent-isolation.test.ts가 강제).
 * 입력은 전부 일반 데이터(문자열·JSON)다.
 *
 * 세는 것(새로 생긴 등장만 — 아래 "차분" 참고):
 *   (a) 색 리터럴, (b) px·rem 길이 리터럴, (c) Tailwind 기본 팔레트·스케일 유틸리티,
 *   (d) var(--name) 참조 — CSS(복사본의 모든 .css)에 `--name:`이 선언돼 있으면 defined, 없으면 undefined,
 *   (e) JSX 요소 — import가 DS 모듈 디렉터리로 풀리면 DS, 다른 로컬 경로(상대·별칭)로 풀리면 other-local.
 * indepUsage = varDefined / (varDefined + varUndefined + colorLiterals + lengthLiterals + tailwindPalette).
 *
 * 차분: 추가된 파일은 모든 등장을 센다. 수정된 파일은 before의 등장과 after의 등장을 각각 같은 방식으로 뽑아
 * (kind, 값) 키의 다중집합으로 비교해 "after에만 있는 만큼"을 센다(before에 N개, after에 M개면 max(M−N, 0)개).
 * 줄 위치는 보지 않으므로 코드를 옮기기만 한 편집은 0이다. before가 없거나 파싱되지 않으면 등장 없음으로 본다.
 */

export interface IndepChange {
  file: string;
  status: "added" | "modified" | "deleted";
  before: string | null;
  after: string | null;
}

export interface IndependentInput {
  changes: readonly IndepChange[];
  /** 실행이 끝난 복사본 전체의 .css 파일(root 상대 → 내용). var 선언을 찾는 데 쓴다 */
  cssFiles: Readonly<Record<string, string>>;
  /** .dsmith/guard.json 스냅샷의 ds.modules (root 상대, 확장자 없음) — 일반 데이터로 읽은 값 */
  dsModules: readonly string[];
  resolver: ResolverConfig;
  /** 프리셋·tailwind 설정의 `키 → --var 이름` */
  themeVars: ReadonlyMap<string, string>;
  /** root 상대 모듈 경로(확장자·index 없음)의 파일이 객체 리터럴 export를 갖는가(RN themeRef 판정). 없으면 themeRef는 0 */
  isThemeModule?: (moduleKey: string) => boolean;
  /** 채점하지 않을 경로 접두사. 기본 ["design-system/"](init이 만든 스캐폴드 — 토큰 정의가 사는 곳) */
  excludePrefixes?: readonly string[];
}

const SCRIPT = /\.(?:tsx|ts|jsx|js)$/;
const CSS = /\.css$/;
const HARNESS = /(?:^|\/)(?:node_modules|\.git|\.dsmith|\.claude|\.next|dist)\//;
const byCodeUnit = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** 소수 4자리 반올림, 분모 0이면 null */
export function indepRatio(num: number, den: number): number | null {
  return den === 0 ? null : Math.round((num / den) * 10_000) / 10_000;
}

/** after 중 before에 짝이 없는 것(다중집합 차, after 순서 유지) */
export function multisetNew(after: readonly Occurrence[], before: readonly Occurrence[]): Occurrence[] {
  const left = new Map<string, number>();
  for (const b of before) left.set(occKey(b), (left.get(occKey(b)) ?? 0) + 1);
  const out: Occurrence[] = [];
  for (const a of after) {
    const k = occKey(a);
    const n = left.get(k) ?? 0;
    if (n > 0) left.set(k, n - 1);
    else out.push(a);
  }
  return out;
}

/** 복사본의 .css 파일들이 선언한 모든 `--name` */
export function definedVars(cssFiles: Readonly<Record<string, string>>): Set<string> {
  const names = new Set<string>();
  for (const code of Object.values(cssFiles)) for (const n of declaredCustomProperties(code)) names.add(n);
  return names;
}

function analyze(code: string, file: string, scan: ScriptScanContext): Occurrence[] {
  return CSS.test(file) ? scanCss(code) : scanScript(code, { ...scan, file });
}

function tally(news: readonly Occurrence[], defined: ReadonlySet<string>): { counts: IndepCounts; undefinedVars: string[] } {
  const counts = emptyIndepCounts();
  const undef = new Set<string>();
  for (const o of news) {
    switch (o.kind) {
      case "color":
        counts.colorLiterals += 1;
        break;
      case "length":
        counts.lengthLiterals += 1;
        break;
      case "palette":
        counts.tailwindPalette += 1;
        break;
      case "var":
        if (defined.has(o.value)) counts.varDefined += 1;
        else {
          counts.varUndefined += 1;
          undef.add(o.value);
        }
        break;
      case "dsComp":
        counts.dsComponents += 1;
        break;
      case "localComp":
        counts.otherLocalComponents += 1;
        break;
      case "themeRef":
        counts.themeRefs += 1;
        break;
    }
  }
  return { counts, undefinedVars: [...undef].sort(byCodeUnit) };
}

export function scoreIndependent(input: IndependentInput): IndependentScore {
  const exclude = input.excludePrefixes ?? ["design-system/"];
  const defined = definedVars(input.cssFiles);
  const scan: ScriptScanContext = {
    file: "",
    resolver: input.resolver,
    dsModules: input.dsModules,
    themeVars: input.themeVars,
    ...(input.isThemeModule === undefined ? {} : { isThemeModule: input.isThemeModule }),
  };

  const files: IndepFileScore[] = [];
  const excluded: string[] = [];
  const ignored: string[] = [];
  for (const change of [...input.changes].sort((a, b) => byCodeUnit(a.file, b.file))) {
    const { file } = change;
    if (change.status === "deleted") continue;
    if (HARNESS.test(file) || exclude.some((p) => file.startsWith(p))) {
      excluded.push(file);
      continue;
    }
    if (change.after === null || !(SCRIPT.test(file) || CSS.test(file))) {
      ignored.push(file);
      continue;
    }
    let after: Occurrence[];
    try {
      after = analyze(change.after, file, scan);
    } catch {
      files.push({ file, status: change.status, parseFailed: true, counts: emptyIndepCounts(), undefinedVars: [] });
      continue;
    }
    let before: Occurrence[] = [];
    if (change.before !== null) {
      try {
        before = analyze(change.before, file, scan);
      } catch {
        // 등장 없음
      }
    }
    const { counts, undefinedVars } = tally(multisetNew(after, before), defined);
    files.push({ file, status: change.status, parseFailed: false, counts, undefinedVars });
  }

  const totals: IndependentScore["totals"] = { ...emptyIndepCounts(), parseFailed: 0, files: files.length };
  const undef = new Set<string>();
  for (const f of files) {
    if (f.parseFailed) {
      totals.parseFailed += 1;
      continue;
    }
    for (const k of Object.keys(f.counts) as (keyof IndepCounts)[]) totals[k] += f.counts[k];
    for (const n of f.undefinedVars) undef.add(n);
  }
  return {
    files,
    excluded,
    ignored,
    totals,
    indepUsage: indepRatio(
      totals.varDefined + totals.themeRefs,
      totals.varDefined + totals.varUndefined + totals.colorLiterals + totals.lengthLiterals + totals.tailwindPalette + totals.themeRefs,
    ),
    undefinedVars: [...undef].sort(byCodeUnit),
  };
}
