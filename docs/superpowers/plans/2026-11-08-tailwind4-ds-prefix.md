# Tailwind 4 테마 변수 충돌 — 토큰 CSS 변수 `--ds-` 접두 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `dsmith init`이 새로 만드는 토큰의 CSS 변수 이름을 모두 `--ds-` 접두(`--ds-color-blue-400`, `--ds-space-2`, `--ds-radius-sm`, `--ds-text-xs`)로 바꿔, Tailwind 4 레포에서 `tokens.css`의 비레이어 `:root`가 Tailwind 기본 테마 변수(`--color-blue-400`·`--text-xs`·`--radius-sm` …)를 덮어 기존 `bg-blue-400`·`text-xs`·`rounded-sm` 값이 레포 전체에서 바뀌던 문제를 없앤다(부록 A.1에서 실제 빌드·브라우저 계산값으로 확인). 이미 init(·migrate)을 실행한 레포는 **이름을 절대 바꾸지 않는다**(이전 형식 유지 + v4면 경고). 이전 형식에서 벗어나려면 명시적 `dsmith migrate --rename-prefix`가 코드의 `var(--…)` 참조와 토큰 파일을 함께 바꾸고 `--revert`로 되돌릴 수 있다. 덤으로 "migrate --apply 뒤 init 재실행이 이름을 다른 값에 넘김"(handoff §4)은 **적용 기록이 있으면 토큰 묶음을 보류**하는 안전장치로 막는다(이름 고정 자체는 범위 밖).

**Architecture:** 이름 규칙은 core 한 곳 — `tokens/naming.ts`(`TokenNaming = "ds" | "legacy"`, `cssVarName`, 기존 파일에서 형식 감지). `DraftToken`에 `cssVar`를 더하고 모든 방출기(`emitTokensCss`·`emitTailwindPreset`·`serializeW3c`·`draftToTokens`·init 리포트)가 `--${t.name}` 대신 `t.cssVar`를 쓴다. DTCG 토큰 **경로·이름은 그대로**(`color.blue-400`) — `tokens.json` 루트 `$extensions["dev.dsmith"].cssPrefix: "ds"`가 CSS 변수 접두를 알리고 `readW3cTokens`가 이를 반영한다(Style Dictionary `prefix: "ds"`와 같은 결과, 부록 A.3). 읽는 쪽(`loadTokens`·`loadReplacementTokens`·catalog·guard 스냅샷·MCP·ESLint·Extractor `tokenRef`)은 이미 **파일에서 읽은 `Token.name`만** 쓰므로 이름 형식을 모른다 — 형식 판단은 init(쓰는 쪽)과 rename만 한다. 형식의 근거는 **커밋되는 토큰 파일 자체**(`.dsmith/`는 gitignore될 수 있음), `.dsmith/init.json`의 `naming`은 보조 기록.

**Tech Stack:** 기존 그대로 + **devDependency 1개: `tailwindcss@4.3.3`(정확한 버전, `packages/init`)** — 의존성 0개인 순수 JS 패키지라 네이티브 바이너리 없이 `compile()`로 실제 v4 빌드를 단위 테스트에서 돌린다(부록 A.2). 4.3.5(2026-11-06 배포)는 2주가 안 돼 고정하지 않는다.

**근거 문서:** `packages/init/README.md` "알려진 제한", `docs/superpowers/handoff-2026-11-01.md` §4, Plan 4a 부록 C.2의 미확인 항목(`docs/superpowers/plans/2026-11-01-migrate-guard.md`, "v4에서 tokens.css의 `:root`가 기본 테마 변수를 덮는지 — 컨트롤러 4에서 기록"). 이 계획의 부록 A가 그 항목을 닫는다.

## 결정

| # | 질문 | 결정 | 이유 |
| --- | --- | --- | --- |
| 1 | 접두를 언제 붙이나 | **새로 init하는 모든 레포**에 `--ds-` (Tailwind 유무·버전 무관). DTCG 경로(`color.blue-400`)·`tokens.ts` 키·Tailwind 클래스 키(`ds-blue-400`)는 그대로, **CSS 변수 이름만** 바뀐다. v3 프리셋 값은 `var(--ds-…)` | (a) v3 → v4 업그레이드 때 이름이 바뀌면 코드 참조가 깨진다 — 감지값에 따라 이름을 달리하면 업그레이드가 곧 파손. (b) CSS-in-JS·일반 CSS 레포도 `--color-*`·`--radius`·`--text-*`는 shadcn·Open Props 등과 흔히 겹친다. (c) 읽는 쪽(tokenRef·guard·eslint·migrate·MCP)은 파일에서 읽은 `Token.name`을 그대로 쓰므로 바꿀 코드가 방출기뿐(코드 읽기로 확인, 부록 A.4). (d) `--space-*`는 Tailwind 4와 겹치지 않지만(`--spacing` 단일) 한 규칙이 단순하다 |
| 1a | DTCG에는 어떻게 싣나 | 경로는 그대로, 루트 `"$extensions": { "dev.dsmith": { "cssPrefix": "ds" } }`. `readW3cTokens`는 이 값이 있으면 이름을 `--ds-<경로>`로. 확장이 없는 파일(0.3.0 산출·외부 DTCG)은 지금처럼 `--<경로>` | 토큰 정체성(경로)은 형식과 무관하게 같아야 rename·결정(token-cluster key)·카탈로그가 같은 토큰을 가리킨다. Style Dictionary 5.7.1 `prefix: "ds"`가 `tokens.css`와 같은 이름을 내고, Terrazzo 2.10.0이 루트 `$extensions`를 받아들인다(부록 A.3) |
| 2 | 이미 init한 레포 | **감지한 형식을 그대로 유지**(접두 없는 형식 = `legacy`). 별칭 블록(`--color-blue-400: var(--ds-…)`)은 만들지 않는다. 벗어나는 길은 명시적 `dsmith migrate --rename-prefix`(Task 4) 하나 | 별칭은 v4에서 충돌을 그대로 되살린다. 자동 전환은 사용자가 손으로 쓴 `var(--color-…)`(migrate 기록 밖)를 깨뜨린다 — 기본값은 "아무것도 깨지 않음" |
| 2a | 형식 판정 순서 | ① `InitOptions.naming`(rename 흐름만 넘김) ② 토큰 파일: `outDir`, 다음 `init.json`의 이전 `outDir` 순으로 **init 소유**(매니페스트 엔트리가 있거나 첫 줄이 `GENERATED_NOTICE`) `tokens.json`이 있으면 루트 `cssPrefix === "ds"` → ds, 아니면 legacy; json이 없고 init 소유 `tokens.css`가 있으면 첫 `--` 선언이 `--ds-`로 시작 → ds, 아니면 legacy ③ `.dsmith/init.json`의 `naming` ④ 없으면 `"ds"` | `.dsmith/`가 gitignore된 팀원 클론에서도 커밋된 토큰 파일로 형식이 정해진다. 토큰 파일을 지웠어도 init.json이 legacy를 기억한다 |
| 2b | 상황별 동작 | 아래 "상황별 동작" 표 | — |
| 3 | v4 테마 파일 | `@theme inline { --color-ds-blue-400: var(--ds-color-blue-400); --spacing-ds-2: var(--ds-space-2); --radius-ds-sm: var(--ds-radius-sm); --text-ds-xs: var(--ds-text-xs); }`(키 규칙 불변, 값만 새 이름). 회귀 테스트는 **Tailwind 4.3.3 `compile()`을 vitest 안에서 실제로 돌리는 상시 테스트**(env 게이트 없음 — 의존성 0, 빌드 약 0.1초). 브라우저 계산값 확인은 컨트롤러 항목 | 부록 A.1·A.2: ds 형식에서 `bg-ds-blue-400`·`/50`·`p-ds-2`·`-mt-ds-2`·`text-ds-xs`·`rounded-ds-sm` 생성, 기본 `bg-blue-400`·`text-xs`·`rounded-sm`은 Tailwind 값 유지(Chrome 계산값). legacy는 셋 다 토큰 값으로 바뀜 |
| 4 | "migrate 뒤 init 재실행이 이름을 넘김" | **이름 고정은 범위 밖**(초안 병합 규칙이 필요한 별도 설계). 대신 init이 기존 init 소유 `tokens.css`를 읽어 **의미 이름(`color-blue-400`, 접두 제외) → 값**이 바뀌거나 사라지는 토큰이 있고 `.dsmith/migrations/`에 `status "applied"` 기록이 하나라도 있으면 토큰 묶음(+프리셋)을 `tokenHold: "renamed"`로 보류, `--force`로만 덮어씀. 적용 기록이 없으면 경고만 | 형식 감지(2a)가 이미 기존 파일을 읽으므로 같은 자리에서 값 비교가 자연스럽게 나온다. 적용 기록 = `var()` 참조가 코드에 있다는 증거. 접두만 바뀌는 rename은 의미 이름이 같아 보류 대상이 아니다 |
| 5 | 릴리스 | changeset `.changeset/tw4-ds-prefix.md`: `"dsmith": minor`(fixed 그룹이라 전체가 함께 오른다). README·init/migrate README의 알려진 제한 갱신. 벤치마크: 베이스 스냅샷 sha256이 바뀌어 **이전 결과(`benchmarks/results/2026-11-07-*`)와 새 실행은 `merge`가 거부**한다 — 의도된 동작, 결과 파일은 손대지 않는다. replay 합성 산출물은 새 이름으로 갱신 | 새 init의 출력이 바뀌는 동작 변경. **주의:** 대기 중인 Version PR #6(0.3.1)은 건드리지 않는다. 이 브랜치를 PR #6보다 먼저 main에 머지하면 Version PR이 0.4.0으로 바뀐다 — 0.3.1을 따로 내려면 PR #6을 먼저 머지 |

### 상황별 동작 (결정 2b)

| 상황 | 결과 |
| --- | --- |
| 새 init — Tailwind 없음 | `tokens.css` `--ds-*`, `tokens.json` 루트 `cssPrefix: "ds"`, `tokens.ts` 불변 형식, `init.json` `naming: "ds"` |
| 새 init — Tailwind 3 | 위 + `tailwind.preset.{ts,cjs}` 값 `var(--ds-…)`(키 `ds-…` 불변). v4 경고 없음 |
| 새 init — Tailwind 4 | 위 + `tailwind.theme.css` 값 `var(--ds-…)`. **기존 "Tailwind 4 변수 충돌" 경고 없앰** |
| 재 init — legacy 레포(0.3.0 산출) | 이름·바이트가 0.3.0과 같은 형식으로 재생성(같은 입력이면 `unchanged`), `init.json`에 `naming: "legacy"` 기록. v4면 경고 `Tailwind 4: 토큰 이름이 이전 형식(--color-*·--text-*·--radius-*)이라 Tailwind 4 기본 테마 변수를 가림 — dsmith migrate --rename-prefix로 --ds- 접두로 바꾸세요`. v3·없음이면 요약에 `토큰 이름: 이전 형식(접두 없음)` 한 줄만 |
| 재 init — 값/이름이 바뀌는 토큰 + 적용 기록 있음 | 토큰 묶음·프리셋 보류(`tokenHold "renamed"`), 경고에 바뀌는 것 최대 5개(`--color-blue-400: #3b82f6 → #2563eb`, `--color-blue-500: 사라짐`) + `외 N개`, `--force` 안내. 종료 코드 0(기존 보류와 같음) |
| migrate — legacy 레포 | 변화 없음: 치환 토큰은 파일에서 읽은 이름(`--color-…`) → `var(--color-…)`·`bg-[color:var(--color-…)]`. 연결된 프리셋 키 경로도 그대로 |
| guard — legacy 레포 | `guard.json`의 `tokens[].name`이 파일 그대로라 **바이트 동일**(업그레이드만으로 stale 되지 않음). ESLint fix도 legacy 이름 |
| `migrate --rename-prefix` — legacy 레포 | 계획(기본, 아무것도 안 씀) → `--apply`: 코드의 `var(--<old>)` 참조를 `var(--ds-<old 의미 이름>)`으로 바꾸고 기록, 이어 init을 `naming: "ds"`로 실행해 토큰·프리셋 파일 재생성. `--revert <id>`는 참조를 되돌리고 init을 `naming: "legacy"`로 다시 실행 |
| `migrate --rename-prefix` — 이미 ds | `이미 --ds- 접두 형식` 출력, 종료 0, 아무것도 안 씀 |

## Global Constraints

- Plan 4a Global Constraints 그대로: 스코프 `@dsmith-dev/*`, ESM only, `tsconfig.base.json` 상속, 한국어 conventional commit, **Co-Authored-By·Claude 트레일러 없음**, author `Dahee Hwang <dahee@project-hh.com>`(`git -c user.name="Dahee Hwang" -c user.email="dahee@project-hh.com" commit`), **각 커밋에서 루트 `pnpm -r build && pnpm test && pnpm typecheck` 녹색**, 테스트는 fixture를 임시 디렉터리로 복사(원본 `fixtures/`·`examples/legacy-demo` 불변)
- 파일 편집은 에디터 도구로만(Python·sed 스크립트로 소스를 고치지 않는다)
- **legacy 바이트 호환:** `naming: "legacy"`로 만든 `tokens.css`·`tokens.json`·`tokens.ts`·프리셋 3형식은 이 계획 이전(main `cc7090c`)과 **바이트 동일**. 기존 스냅샷 `packages/core/test/__snapshots__/tailwind-preset.test.ts.snap`은 legacy 케이스로 남고 무수정 통과해야 한다. ds 케이스는 새 스냅샷
- **읽는 쪽은 이름 형식을 모른다:** `loadTokens`·`loadReplacementTokens`·catalog·`guard/snapshot`·`rules/`·MCP·ESLint 플러그인·Extractor `tokenRef`에 `ds-`·접두 판단 코드를 넣지 않는다. 예외 둘: `readW3cTokens`(루트 확장 해석)와 `css-variables.ts`의 글꼴 크기 이름 판정(`--ds-text-*`)
- 기존 e2e 스냅샷 `packages/cli/test/__snapshots__/e2e.test.ts.snap`(audit 7·install 1)은 바뀌면 안 된다(토큰 이름이 들어 있지 않음 — 바뀌면 원인을 적고 멈춤)
- 기존 테스트 기대값이 **새 init의 `--ds-` 이름 때문에만** 깨지면 기대값을 갱신하고 보고서에 파일·테스트 이름을 적는다. 사용자 토큰 fixture(`fixtures/with-ds-app` 등)의 `--color-*`를 읽는 테스트가 깨지면 멈춘다(읽는 쪽 불변 위반)
- `.changeset/real-repo-bugs.md`와 원격 `changeset-release/main`(PR #6)은 건드리지 않는다
- 결정적 출력: 새 필드(`naming`, 루트 `$extensions`)도 키 순서 고정, 두 번째 실행 바이트 동일

## Review Focus

1. **legacy가 정말 그대로인가** — legacy 재 init 바이트 동일, legacy 레포 guard.json 바이트 동일, migrate 계획 동일 → Task 1·2
2. **이름 출처가 하나인가** — `DraftToken.cssVar`만이 CSS 변수 이름의 출처. `tokens.css`·`tokens.json`(→ `readW3cTokens`)·프리셋·리포트·`draftToTokens`가 같은 이름을 내는가(왕복 테스트) → Task 1
3. **`--ds-text-xs`가 font-size로 읽히는가** — 지금 core는 spacing으로 읽는다(부록 A.4) → Task 1
4. **v4 충돌이 실제로 사라졌는가** — `compile()` 출력과 Tailwind `theme.css` 변수 집합의 교집합 0, ds 클래스 생성, legacy는 교집합이 있음을 같은 테스트가 보여 줌 → Task 3
5. **형식 판정이 커밋된 파일 기준인가** — `.dsmith/` 없이 토큰 파일만 있는 클론에서 legacy 유지 → Task 2
6. **rename의 안전** — 계획은 무쓰기, 사전 init dry-run이 보류면 아무것도 안 씀, 참조 패치는 기존 해시 비교·검증·기록 경로, 남은 옛 참조가 있으면 종료 1, `--revert` 왕복 후 트리 해시(`.dsmith/` 제외) 동일 → Task 4

---

## File Structure

```
packages/core/src/tokens/naming.ts            TokenNaming, DS_CSS_PREFIX, cssVarName, semanticNameOf, detectNamingFromFiles
packages/core/src/tokens/draft.ts             DraftToken.cssVar, TokenDraft.naming, DraftOptions.naming, draftToTokens(cssVar)
packages/core/src/tokens/emit.ts              emitTokensCss(cssVar)
packages/core/src/tokens/w3c.ts               draftToW3c 루트 $extensions(cssPrefix), readW3cTokens 접두 반영
packages/core/src/tokens/tailwind-preset.ts   값 var(${cssVar}), 주석 갱신
packages/core/src/tokens/css-variables.ts     FONT_SIZE_NAME에 --ds- 허용
packages/core/src/index.ts                    export
packages/init/src/run.ts                      형식 판정·기록, v4 경고 교체, renamed 보류, InitOptions.naming, InitResult.naming
packages/init/src/report.ts                   리포트 변수 열 = cssVar, 형식 한 줄
packages/init/test/tailwind4-build.test.ts    Tailwind 4.3.3 compile 회귀 테스트(새)
packages/init/package.json                    devDependencies.tailwindcss "4.3.3"
packages/core/src/migrations/model.ts         MigrationRecord.kind?: "rename-prefix"
packages/migrate/src/rename-prefix.ts         planPrefixRename, applyPrefixRename, leftoverRefs(새)
packages/cli/src/commands/migrate.ts          --rename-prefix (+ --apply/--branch/--json), --revert 분기
README.md, packages/{init,migrate}/README.md, packages/agent-skill/commands/ds-migrate.md(옵션 한 줄)
benchmarks/replay/legacy-demo/dsmith/**       var(--color-…) → var(--ds-color-…)
.changeset/tw4-ds-prefix.md
```

**순서·의존:** T1 → T2 → T3(T2의 init 산출로 빌드) → T4(T2의 `naming` 옵션) → T5 → T6. 모든 커밋은 단독 출시 가능.

---

### Task 1: core 이름 규칙 — `naming.ts`, `DraftToken.cssVar`, 방출기, DTCG 루트 확장, 글꼴 크기 판정

**Files:**
- Create: `packages/core/src/tokens/naming.ts`, `packages/core/test/token-naming.test.ts`
- Modify: `packages/core/src/tokens/{draft,emit,w3c,tailwind-preset,css-variables}.ts`, `packages/core/src/index.ts`
- Test: `packages/core/test/{token-draft,tokens-w3c,tokens,tailwind-preset}.test.ts`(추가), `__snapshots__/tailwind-preset.test.ts.snap`(ds 케이스 추가만)

**Interfaces:**
- Consumes: `DraftGroup`, `GENERATED_NOTICE`, `DSMITH_EXTENSION`, `readCssVariableTokens`
- Produces:
  ```ts
  // tokens/naming.ts (순수, fs 없음)
  export type TokenNaming = "ds" | "legacy";
  export const DS_CSS_PREFIX = "ds";
  export const DEFAULT_TOKEN_NAMING: TokenNaming = "ds";
  /** ("color","blue-400","ds") → "--ds-color-blue-400", legacy → "--color-blue-400" */
  export function cssVarName(group: DraftGroup, key: string, naming: TokenNaming): string;
  /** "--ds-color-blue-400" | "--color-blue-400" → "color-blue-400"(접두·"--" 제거). init 보류 비교·rename 대응표에 쓴다 */
  export function semanticNameOf(cssVar: string): string;
  /**
   * init 소유 토큰 파일 텍스트로 형식 판정. json(있으면 우선): 루트 $extensions["dev.dsmith"].cssPrefix === "ds" → "ds", 파싱되면 그 밖은 "legacy".
   * css: 첫 `--` 선언 이름이 "--ds-"로 시작 → "ds", 선언이 있으면 "legacy". 둘 다 판정 불가면 null
   */
  export function detectNamingFromFiles(files: { json: string | null; css: string | null }): TokenNaming | null;

  // tokens/draft.ts
  export interface DraftToken { /* 기존 필드 */ /** CSS 변수 이름 — 유일한 출처. `--ds-color-blue-400` | legacy `--color-blue-400` */ cssVar: string }
  export interface TokenDraft { tokens; mappings; naming: TokenNaming }
  export interface DraftOptions { /* 기존 */ naming?: TokenNaming }   // 기본 DEFAULT_TOKEN_NAMING
  // name(= `${group}-${key}`)·ScaleMapping.token·scaleName은 의미 이름 그대로(접두 없음)
  // draftToTokens: name = t.cssVar

  // tokens/w3c.ts
  // draftToW3c: naming "ds"면 { $description, $extensions: { "dev.dsmith": { cssPrefix: "ds" } }, color…, space…, … } (키 순서 고정). legacy면 지금과 바이트 동일
  // readW3cTokens: 루트 $extensions["dev.dsmith"].cssPrefix가 /^[a-z][a-z0-9]*$/면 name = `--${prefix}-${path.join("-")}`, path는 그대로 "color.blue-400".
  //   문자열이지만 형식이 틀리면 경고 `토큰 CSS 접두를 읽을 수 없음: <값> (<file>)` 후 접두 없이
  ```
  - `emitTokensCss`: `  ${t.cssVar}: ${t.value};`
  - `emitTailwindPreset`: v4 `  --${ns}-ds-<key>: var(${t.cssVar});`, v3 `"ds-<key>": "var(${t.cssVar})"`. 파일 머리 주석의 예시 이름은 바꾸지 않는다(legacy 바이트 호환) — 머리 주석(`tailwind-preset.ts` 상단 JSDoc)만 갱신
  - `css-variables.ts`: `FONT_SIZE_NAME = /^--(?:ds-)?(?:font-size|text|fs)-/i`(다른 접두는 넓히지 않는다 — 사용자 변수 오분류 방지)
- [ ] **Step 1: 실패하는 테스트**
  - naming: `cssVarName` 4그룹 × 2형식, `radius`/`full`; `semanticNameOf` 왕복; `detectNamingFromFiles` — json ds / json 확장 없음 → legacy / json 깨짐 + css `--ds-` → ds / 둘 다 null → null
  - draft: 같은 styles로 `naming` 생략 → 모든 `cssVar`가 `--ds-${name}`, `naming:"legacy"` → `--${name}`; `name`·`key`·`mappings` 두 형식에서 동일; `draftToTokens(...).map(t=>t.name)` = cssVar
  - 왕복(Review Focus 2): ds 초안 → `emitTokensCss`를 `readCssVariableTokens`로, `serializeW3c`를 `readW3cTokens`로 읽으면 두 결과의 (name, category, normalized) 집합이 같고 W3C 쪽 `path`는 `color.blue-400` 형식. legacy 초안도 같은 성질
  - `--ds-text-xs: 13px` → category `font-size`(지금은 `spacing` — 부록 A.4), `--ds-radius-sm` → radius, `--ds-space-2` → spacing, `--foo-text-xs` → spacing(넓히지 않음)
  - legacy 바이트 호환: 기존 `tailwind-preset.test.ts` 스냅샷이 `naming:"legacy"` 초안으로 무수정 통과; `serializeW3c`·`emitTokensCss`·`emitTokensTs` legacy 출력이 main 산출과 같음(테스트에 main 기준 문자열 고정)
  - ds 스냅샷: v4 `--color-ds-blue-400: var(--ds-color-blue-400);`, v3 `"ds-blue-400": "var(--ds-color-blue-400)"`
  - `loadTokens`: init 산출 쌍(ds `tokens.css` + `tokens.json`)에서 CSS 토큰에 W3C `path`가 실린다(이름이 같아서 — 기존 병합 규칙이 그대로 동작)
- [ ] **Step 2: 실패 확인 → 구현 → 통과** — `pnpm -r build && pnpm test && pnpm typecheck`. 이 커밋에서 init·cli·migrate 테스트 중 **새 init 이름 때문에** 깨지는 기대값(`var(--color-…)` → `var(--ds-color-…)`)을 갱신하고 목록을 보고서에 적는다(T2 전이라 init은 기본 `ds`를 그대로 받는다)
- [ ] **Step 3: Commit** — `feat(core): 토큰 CSS 변수 이름에 --ds- 접두(DTCG 경로는 그대로, tokens.json 루트 cssPrefix)와 --ds-text-* 글꼴 크기 판정`

---

### Task 2: init — 형식 판정·기록, v4 경고 교체, 값이 바뀌는 재 init 보류

**Files:**
- Modify: `packages/init/src/run.ts`, `packages/init/src/report.ts`, `packages/cli/src/commands/init.ts`(요약 문구만)
- Test: `packages/init/test/run.test.ts`, `packages/init/test/naming.test.ts`(새), `packages/cli/test/init.test.ts`(요약 문구)

**Interfaces:**
- Consumes: `detectNamingFromFiles`, `semanticNameOf`, `readCssVariableTokens`, `listMigrations`, `GENERATED_NOTICE`, 기존 `readInitManifest`
- Produces:
  ```ts
  export interface InitOptions { /* 기존 */ /** 내부용(rename 흐름) — 감지보다 우선. CLI 플래그로 노출하지 않는다 */ naming?: TokenNaming }
  export interface InitResult {
    /* 기존 */
    naming: { value: TokenNaming; source: "explicit" | "token-files" | "manifest" | "default" };
    tokenHold: "modified" | "invalid" | "renamed" | null;
    /** renamed 보류(또는 적용 기록 없을 때 경고)의 근거: 의미 이름 기준 바뀐 토큰 */
    renamedTokens: { name: string; from: string; to: string | null }[];   // name = 이전 cssVar, to null = 사라짐
  }
  // .dsmith/init.json: recordInitDir가 { …, outDir, updatedAt, naming } — naming이 바뀌어도 updatedAt 규칙은 기존과 같음(naming만 바뀌면 다시 씀)
  ```
  - 판정(결정 2a): `resolveNaming(root, outDir, prevManifest, opts.naming)`. "init 소유"는 매니페스트 `hashes`에 그 파일 키가 있거나 파일 첫 줄에 `GENERATED_NOTICE`가 있음. 사용자 자신의 `design-system/tokens.css`(소유 아님)는 판정에 쓰지 않는다
  - `buildTokenDraft(..., { naming })`
  - 보류(결정 4): 이전 init 소유 `tokens.css`(같은 판정 디렉터리)를 `readCssVariableTokens`로 읽어 `semanticNameOf(name) → normalized`. 새 초안의 `name → normalized`와 비교해 값이 다르거나 없어진 것을 `renamedTokens`로(이전 파일 순서). 비어 있지 않으면: `listMigrations(root)`에 `status "applied"`가 있고 `!force` → 토큰 3파일 + 프리셋 write를 기존 `held` 경로로 `skipped-modified` 처리, 사유 `토큰 N개의 값이 바뀌거나 사라져 함께 보류 — migrate로 적용한 var() 참조가 다른 값을 가리키게 됨, 덮어쓰려면 --force`, `tokenHold "renamed"`. 적용 기록이 없으면 경고 `init 재실행으로 토큰 N개의 값이 바뀌거나 사라짐: <최대 5개> — 이 이름을 직접 쓴 코드가 있으면 확인`만. 접두만 다른 경우(의미 이름 같음)는 대상 아님
  - v4 경고: 기존 문자열 삭제. `naming.value === "legacy"`이고 `tailwindVersion === 4`일 때만 `Tailwind 4: 토큰 이름이 이전 형식(--color-*·--text-*·--radius-*)이라 Tailwind 4 기본 테마 변수를 가림 — dsmith migrate --rename-prefix로 --ds- 접두로 바꾸세요`
  - 요약·리포트: legacy면 `토큰 이름: 이전 형식(접두 없음) — dsmith migrate --rename-prefix로 바꿀 수 있음` 한 줄. 리포트 표의 변수 열은 `t.cssVar`
- [ ] **Step 1: 실패하는 테스트**
  - 새 init(tailwind 없음 / v3 / v4 각각): `naming {value:"ds", source:"default"}`, `tokens.css` 모든 선언 `--ds-`, `tokens.json` 루트 `cssPrefix`, 프리셋 값 `var(--ds-`, `init.json.naming "ds"`, v4 경고 없음(기존 테스트의 `shadow` 단언을 "경고 없음"으로 교체)
  - legacy 재 init: main 형식 `tokens.{css,json,ts}`(테스트가 `naming:"legacy"`로 한 번 만든 뒤 `init.json`의 `naming` 키를 지워 0.3.0 매니페스트를 흉내) → 다시 실행 → 모든 토큰 파일 `unchanged`, `naming {legacy, token-files}`, v4 fixture면 새 경고 1개
  - **`.dsmith/` 없는 클론**: legacy 산출 디렉터리만 복사하고 `.dsmith/` 삭제 → audit → init → legacy 유지(GENERATED_NOTICE로 소유 판정), 파일 `unchanged`
  - 사용자 소유 `design-system/tokens.css`(notice 없음, 매니페스트 없음) → `default` ds
  - `--out other`로 바꿈 + 이전 outDir가 legacy → legacy
  - 보류: legacy/ds 각각 init → 손으로 `.dsmith/migrations/<id>.json`(`status "applied"`) 작성 → index styles를 바꿔 `color-blue-400` 값이 달라지게 audit → init → `tokenHold "renamed"`, 세 파일+프리셋 `skipped-modified`, `renamedTokens[0]` 단언, 요약에 `--force`; `--force` → `updated`. 적용 기록 없으면 쓰기는 되고 경고 1개
  - guard 바이트 동일(Review Focus 1): legacy 산출 레포에서 `buildGuardSnapshot` 결과 JSON이 이 Task 전후 같은 이름(`--color-…`)을 담는다(guard 패키지 helpers 재사용)
- [ ] **Step 2: 실패 확인 → 구현 → 통과** — 전 구간 녹색. cli `init.test.ts`·`e2e-migrate-guard.test.ts`의 이름 기대값 변화는 T1에서 이미 반영돼 있어야 함(여기서 새로 깨지면 원인 보고)
- [ ] **Step 3: Commit** — 두 개: `feat(init): 토큰 이름 형식을 커밋된 토큰 파일로 판정해 이전 형식을 유지하고, v4 충돌 경고를 이전 형식에만` / `feat(init): migrate 적용 기록이 있는데 토큰 값이 바뀌는 재실행은 토큰 묶음을 보류(--force로 덮어씀)`

---

### Task 3: 실제 Tailwind 4 빌드 회귀 테스트

**Files:**
- Create: `packages/init/test/tailwind4-build.test.ts`, `packages/init/test/tailwind4.ts`(compile 헬퍼)
- Modify: `packages/init/package.json`(`devDependencies.tailwindcss: "4.3.3"`), `pnpm-lock.yaml`

**Interfaces:**
- Consumes: `runInit`, 기존 `copyFixture`·`auditFixture`·`forceStateZero` 헬퍼, `tailwindcss`의 `compile`
- Produces (테스트 헬퍼, 패키지 밖으로 export하지 않음):
  ```ts
  /** 부록 A.2의 프로브와 같은 방식: loadStylesheet가 "tailwindcss" → require.resolve("tailwindcss/index.css"), 그 밖은 base 기준 상대 경로 */
  export async function buildTw4(entryCss: string, base: string, candidates: string[]): Promise<string>;
  /** require.resolve("tailwindcss/theme.css")의 `--이름:` 선언 집합(4.3.3에서 419개) */
  export function tailwindThemeVariables(): Set<string>;
  /** CSS 텍스트에서 `@layer` 밖 `:root { … }` 블록의 `--이름` 집합 */
  export function unlayeredRootVariables(css: string): Set<string>;
  ```
- [ ] **Step 1: 테스트**(env 게이트 없음 — 의존성 0개 순수 JS, compile ≈0.1초. 실패 시 메시지에 버전 출력)
  - v4 fixture(기존 `run.test.ts`의 tw4 구성) → `runInit({ all: true })` → 진입 CSS `@import "tailwindcss"; @import "../design-system/tailwind.theme.css"; @import "../design-system/tokens.css";`
  - 후보 = 테마 파일에서 파싱한 키로 만든 `bg-ds-<색>`·`bg-ds-<색>/50`·`p-ds-<간격>`·`-mt-ds-<간격>`·`rounded-ds-<모서리>`·`text-ds-<글꼴>` + 기본 `bg-blue-400`·`text-xs`·`rounded-sm`·`p-2`
  - ds 단언: (1) `tokens.css` 변수 ∩ `tailwindThemeVariables()` = ∅, 그리고 출력의 `unlayeredRootVariables` ∩ 출력 `@layer theme` 선언 = ∅ (2) `.bg-ds-<c>{background-color:var(--ds-color-<c>)}` 등 6종 규칙이 출력에 있음(공백 정규화 후), `/50`은 `color-mix(in oklab, var(--ds-color-<c>) 50%, transparent)` (3) `.text-xs`는 `var(--text-xs)`, `.bg-blue-400`은 `var(--color-blue-400)` 그대로이고 그 변수를 정의하는 곳이 `@layer theme` 하나뿐
  - legacy 대조(같은 fixture, `naming:"legacy"`): 교집합이 비어 있지 않고 `--color-*`·(`text`/`radius` 토큰이 있으면) 그 이름을 포함 — "이 테스트가 충돌을 잡는다"는 증명. 또 legacy 출력의 `.bg-ds-<c>/50` 대체값이 Tailwind 기본 색(`oklch(`)으로 풀리는지 기록 단언(부록 A.1 관찰 3)
  - 계산값(브라우저)은 단위 테스트에서 하지 않는다 → 컨트롤러 항목 2
- [ ] **Step 2: 통과 확인** — `pnpm --filter @dsmith-dev/init test`, 루트 전 구간 녹색. lockfile에 `tailwindcss@4.3.3` 한 항목만 추가됐는지 확인(`git diff --stat pnpm-lock.yaml`)
- [ ] **Step 3: Commit** — `test(init): Tailwind 4.3.3 실제 compile로 --ds- 토큰이 기본 테마 변수와 겹치지 않음을 고정`

---

### Task 4: `dsmith migrate --rename-prefix` — 이전 형식 → `--ds-`(참조·토큰 파일 함께, 되돌리기 가능)

**Files:**
- Create: `packages/migrate/src/rename-prefix.ts`, `packages/migrate/test/rename-prefix.test.ts`, `packages/cli/test/rename-prefix.test.ts`
- Modify: `packages/core/src/migrations/model.ts`(`kind?`), `packages/migrate/src/index.ts`, `packages/cli/src/commands/migrate.ts`, `packages/cli/src/program.ts`(옵션 등록), `packages/migrate/src/report.ts`(요약 문구)

**Interfaces:**
- Consumes: `findInitDir`, `semanticNameOf`, `cssVarName`, `detectNamingFromFiles`, `readCssVariableTokens`, core `patch/`(`partitionPatches`·`applyPatches`·`validateEdit`·`writePatchedFile`·`sha256Text`), `newMigrationId`·`writeMigration`, 기존 `revertMigration`·`checkBranch`·`createBranch`·`commitFiles`, `runInit`(CLI만)
- Produces:
  ```ts
  // core migrations/model.ts — 없으면 기존 토큰·컴포넌트 마이그레이션
  export interface MigrationRecord { /* 기존 */ kind?: "rename-prefix" }

  // migrate/src/rename-prefix.ts (init을 모른다 — init 실행은 CLI가 한다)
  export interface PrefixRename { from: string; to: string }   // "--color-blue-400" → "--ds-color-blue-400"
  export interface RenamePlan {
    naming: TokenNaming;                 // 현재 init 산출 형식. "ds"면 renames·files 비어 있음
    initDir: string | null;
    renames: PrefixRename[];             // init 소유 tokens.css 선언 순서
    files: { file: string; sha256: string; patches: TextPatch[]; refs: number }[];   // 파일 경로순
    /** var() 밖 언급(문자열 "--color-blue-400", 사용자 CSS의 같은 이름 정의 등) — 바꾸지 않고 알림 */
    mentions: { file: string; line: number; name: string }[];
  }
  /**
   * 대상 파일 = tokens-loaded.ts의 SOURCE_GLOB(css·scss·sass·less·html·js·jsx·ts·tsx·mjs·cjs·mts·cts·vue·svelte·astro·mdx),
   * DEFAULT_EXCLUDE + detect overrides exclude + initDir + `.dsmith/` 제외. 패치 = `var(` 뒤 공백 허용, 이름 정확 일치 후 `\s*[,)]`
   * (`var(--color-blue-400-2)`가 `--color-blue-400`으로 잡히지 않게). Tailwind 임의값 `bg-[color:var(--color-blue-400)]`도 같은 규칙.
   * 아무것도 쓰지 않는다.
   */
  export function planPrefixRename(root: string, opts: { exclude: string[] }): Promise<RenamePlan>;
  /** 기록(kind "rename-prefix")을 먼저 쓰고 파일마다 validateEdit → writePatchedFile. apply.ts와 같은 상태 전이·사유 */
  export function applyPrefixRename(root: string, plan: RenamePlan, opts: { version: string; now?: Date }): Promise<{ id: string; files: ApplyFileResult[] }>;
  /** 옛 이름의 var() 참조가 남은 곳(적용 뒤 확인) */
  export function leftoverRefs(root: string, renames: PrefixRename[], opts: { exclude: string[] }): Promise<{ file: string; line: number; name: string }[]>;
  ```
  - CLI `dsmith migrate --rename-prefix [--apply] [--branch <name>] [--json]`. `--files`·`--category`·`--only`·`--close`·`--max-files`·`--with-tokens`와 함께 쓰면 오류(`--rename-prefix는 … 와 함께 쓸 수 없음`)
  - 기본(계획): `토큰 이름 바꾸기: N개 · 참조 R개 · 파일 F개 · var() 밖 언급 M개(바꾸지 않음)`, 파일 상위 10개, 쓰기 없음(`.dsmith/` 포함)
  - `--apply` 순서: ① naming이 ds → 안내 후 0 ② `runInit({ dryRun: true, naming: "ds" })`의 `tokenHold !== null` → `오류: 토큰 파일이 보류돼 이름을 바꿀 수 없음 (<사유>)`, 아무것도 안 씀, 1 ③ `--branch`면 기존 `checkBranch`·`createBranch` ④ `applyPrefixRename` ⑤ `runInit({ naming: "ds" })` ⑥ `leftoverRefs` > 0 → 목록과 함께 종료 1 ⑦ `--branch`면 바뀐 소스 + init 산출 토큰·프리셋 파일을 `commitFiles`(메시지 `refactor: 토큰 CSS 변수에 --ds- 접두 (dsmith migrate --rename-prefix)`, `.dsmith/` 제외) ⑧ `.dsmith/guard.json`이 있으면 `다음: dsmith guard init으로 스냅샷 갱신`
  - `--revert <id>`가 `kind "rename-prefix"` 기록이면: 기존 `revertMigration` → `runInit({ naming: "legacy" })` → 결과 출력. 일부 파일 `skipped-modified`면 init은 실행하지 않고 종료 1(`참조가 일부 남아 토큰 파일을 이전 형식으로 되돌리지 않음`)
  - init의 renamed 보류(T2)는 의미 이름이 같아 rename에 걸리지 않는다(테스트로 고정)
- [ ] **Step 1: 실패하는 테스트**
  - plan: legacy 산출 + `src/a.css`(`color: var(--color-blue-400);`, `var( --space-2 , 8px)`), `src/b.tsx`(`style={{ color: "var(--color-blue-400)" }}`, `className="bg-[color:var(--color-blue-400)]"`, `el.style.setProperty("--color-blue-400", x)`), `src/c.css`(`var(--color-blue-400-2)` — 다른 토큰) → refs·mentions 정확, `design-system/` 안 파일 미포함, 트리 해시 불변
  - apply(CLI): 위 레포 → `--apply` → 소스 참조 전부 `--ds-`, `design-system/tokens.css` `--ds-*`, `tokens.json` 루트 `cssPrefix`, `init.json.naming "ds"`, 기록 `kind "rename-prefix"`, 재 audit에서 해당 사용 `source "token"` 수 전후 동일, 종료 0
  - 사전 보류: `tokens.css`를 사용자가 고침 → `--apply` → 종료 1, 트리 해시(`.dsmith/` 포함) 불변
  - 남은 참조: 계획 뒤 `src/a.css`를 고쳐 해시가 달라짐 → 그 파일 `skipped-modified`, leftover > 0 → 종료 1, 메시지에 파일
  - revert 왕복: apply → `--revert <id>` → 트리 해시(`.dsmith/` 제외)가 apply 전과 동일(legacy 토큰 파일 바이트 포함)
  - 이미 ds → 계획·apply 모두 쓰기 없음, 종료 0
  - `--branch`: 임시 git 레포에서 브랜치·커밋 1개, 커밋 파일 목록에 토큰 파일 포함, `.dsmith/` 미포함
  - 옵션 충돌 오류 문구
- [ ] **Step 2: 실패 확인 → 구현 → 통과**
- [ ] **Step 3: Commit** — 두 개: `feat(core,migrate): 이전 형식 토큰 이름을 --ds- 접두로 바꾸는 계획·적용(var() 참조, 기록 kind rename-prefix)` / `feat(cli): migrate --rename-prefix(init 재생성 포함)와 그 기록의 --revert`

---

### Task 5: 문서·changeset·e2e·벤치마크 replay

**Files:**
- Modify: `packages/init/README.md`("알려진 제한" → "토큰 이름" 절), `packages/migrate/README.md`(알려진 한계 문장 교체 + `--rename-prefix` 절), `README.md`(98행 알려진 한계 교체, 94행 예시 `var(--ds-color-blue-400)`), `packages/agent-skill/commands/ds-migrate.md`(옵션 한 줄), `packages/extractor-tailwind/src/write.ts`(JSDoc 예시 이름만), `benchmarks/replay/legacy-demo/dsmith/**/files/**`(`var(--color-…)`·`var(--space-…)` → `--ds-`, 지어낸 `var(--color-brand)` → `var(--ds-color-brand)`), `benchmarks/replay/README.md`(예시 이름), `packages/cli/test/e2e-migrate-guard.test.ts`(필요 시)
- Create: `.changeset/tw4-ds-prefix.md`
- [ ] **Step 1: 문서**
  - init README "토큰 이름": 새 init은 `--ds-` 접두, DTCG 경로 불변·루트 `cssPrefix`, 이전 형식 유지 규칙(결정 2a 순서 요약), `--rename-prefix` 안내, v4 충돌은 이전 형식에서만 남는다는 문장, 값이 바뀌는 재 init 보류(결정 4) 한 단락. "외부 도구 검증"에 Style Dictionary는 `prefix: "ds"`로 같은 출력이라는 문장 추가(부록 A.3)
  - 알려진 한계에서 Tailwind 4 항목 삭제, 남는 것: "migrate 뒤 재 init의 이름 이동은 보류로 막을 뿐 이름을 고정하지 않음"
  - changeset `.changeset/tw4-ds-prefix.md`: `"dsmith": minor` 한 줄(fixed 그룹). 본문: 새 init의 CSS 변수 `--ds-` 접두와 이유(Tailwind 4 기본 테마 변수 가림, 실제 빌드로 확인), 이미 init한 레포는 그대로 + `dsmith migrate --rename-prefix`, 재 init 보류, `--ds-text-*` 글꼴 크기 판정. 버전 숫자 없음. `pnpm changeset status`로 fixed 그룹 확인(`.changeset/real-repo-bugs.md`는 그대로)
- [ ] **Step 2: replay·e2e** — `pnpm --filter dsmith-benchmarks test`: `replay-e2e.test.ts`의 `knownToken`·`token` 기대값이 **이름 갱신 후 무수정 통과**해야 한다(베이스 스냅샷이 `--ds-` 이름이므로). `ablation.test.ts`의 고정 sha(`2094d703…`)는 합성 fixture 값이라 그대로. `packages/cli/test/__snapshots__/e2e.test.ts.snap` 불변 확인. 실제 벤치마크 재실행은 하지 않는다(결과 파일 불변 — 새 실행은 이전 결과와 merge 거부됨을 `benchmarks/README.md`의 결과 합치기 설명 옆에 한 줄)
- [ ] **Step 3: 전 구간** — `pnpm -r build && pnpm test && pnpm typecheck`, `git grep -n "\-\-ds- 접두 적용 예정\|Plan 4b에서 한다"` 결과 0
- [ ] **Step 4: Commit** — `docs,chore: --ds- 접두 토큰 이름 안내·changeset, replay 산출물 이름 갱신`

---

### Task 6: 최종 리뷰

- [ ] **Step 1: 리뷰어(새 세션)** — `git diff main...feat/tw4-ds-prefix` 전체를 Review Focus 1–6과 결정 표에 대조. 특히: 읽는 쪽 패키지(`core/src/{rules,guard,catalog}`, `eslint-plugin`, `mcp-server`, `extractor-*`)의 diff가 JSDoc 외에 없는지(`git diff --stat`), legacy 바이트 호환 테스트가 main 산출 문자열을 실제로 고정하는지, `FONT_SIZE_NAME` 확장이 `--ds-`만인지, rename 패턴이 `-2` 접미 토큰을 잘못 잡지 않는지, init 보류가 `force`·dry-run에서 맞게 동작하는지
- [ ] **Step 2: 지적 반영** — 리뷰 기록 `.superpowers/sdd/tw4-ds-prefix/final-review.md`, 수정은 fix 커밋으로(리뷰 기록 파일은 커밋하지 않음 — 기존 관례대로 `.superpowers/`)
- [ ] **Step 3: 완료 기준 확인** 아래 전부

## 이 계획에서 하지 않는 것

- 재 init 시 토큰 이름 고정(이전 `tokens.json`을 잠금 파일로 쓰는 초안 병합) — 보류 안전장치만
- 접두를 사용자 지정(`--prefix acme`)하는 옵션 — `cssPrefix`는 읽을 때 임의 소문자 접두를 받지만 init은 `ds`만 쓴다
- Tailwind 4 `--text-*--line-height` 짝 변수 방출(`text-ds-xs`에 line-height 없음 — 기존과 같음, 부록 A.1 관찰 2)
- `color-mix` 미지원 브라우저용 `/50` 대체값 보정(부록 A.1 관찰 1)
- MCP에 rename 도구 추가, 레거시 별칭 블록

## 완료 기준

1. 새 init(없음·v3·v4) 산출의 모든 CSS 변수가 `--ds-`, `readW3cTokens`·`readCssVariableTokens` 왕복 일치, `--ds-text-*`가 font-size
2. legacy 재 init·migrate 계획·guard 스냅샷이 main과 같은 이름·바이트
3. `tailwind4-build.test.ts`가 상시 실행되며 ds 교집합 0, legacy 교집합 > 0
4. `migrate --rename-prefix` 계획 무쓰기, apply 후 남은 옛 참조 0, `--revert` 트리 해시 왕복
5. 적용 기록 + 값 변경 재 init이 보류, `--force`로 덮어씀
6. 문서의 "Tailwind 4 변수 충돌" 한계 문구 제거, changeset minor, e2e 스냅샷 불변, 각 커밋 녹색

## 컨트롤러 확인 항목 (최종 리뷰 뒤 오케스트레이터가 직접)

1. **실제 CLI 경로**: 스크래치 v4 앱(부록 A.1 구성 + `dsmith audit`·`init --all`) → `@tailwindcss/cli@4.3.3` 빌드 → headless Chrome 계산값이 부록 A.1 ds 표와 같은지
2. **legacy → rename**: 같은 앱을 main(0.3.0) dist로 init·`migrate --apply` → 이 브랜치 dist로 `init`(legacy 유지·v4 경고) → `migrate --rename-prefix --apply` → Chrome에서 `bg-blue-400`·`text-xs`·`rounded-sm`이 Tailwind 값으로 돌아오고 migrate가 바꾼 요소 값은 그대로인지 → `--revert`로 이전 상태 바이트 복원
3. legacy-demo(v3) `audit → init --all → migrate --apply` 후 `npx tailwindcss@3.4.19` 빌드에 `var(--ds-…)` 규칙이 나오는지

---

## 부록 A. 확인 기록 (2026-11-08, 이 세션에서 실제 실행)

환경: Node v22.23.4, npm 10.9.9, Google Chrome for Testing 153.0.8010.12(headless), 스크래치 `/tmp/claude-0/-home-claude/48ab8a64-f3a3-512a-8202-cd7fbe4943c6/scratchpad/{tw4,tw435,sd}`. npm dist-tags(2026-11-08): `tailwindcss` `latest 4.3.5`(2026-11-06 배포), `v3-lts 3.4.19`; `@tailwindcss/cli` `latest 4.3.5`. 고정 버전은 4.3.3(2026-07-16 배포).

### A.1 Tailwind 4 빌드 + 브라우저 계산값 — 확인

구성(두 형식 공통): 진입 CSS
```css
@import "tailwindcss";
@import "./tailwind.theme.css";
@import "./tokens.css";
@source "./index.html";
```
legacy `tokens.css` = `:root { --color-blue-400: #123456; --space-2: 8px; --radius-sm: 6px; --text-xs: 13px; }`, 테마 `@theme inline { --color-ds-blue-400: var(--color-blue-400); --spacing-ds-2: var(--space-2); --radius-ds-sm: var(--radius-sm); --text-ds-xs: var(--text-xs); }`.
ds `tokens.css` = `:root { --ds-color-blue-400: #123456; --ds-space-2: 8px; --ds-radius-sm: 6px; --ds-text-xs: 13px; }`, 테마 `@theme inline { --color-ds-blue-400: var(--ds-color-blue-400); --spacing-ds-2: var(--ds-space-2); --radius-ds-sm: var(--ds-radius-sm); --text-ds-xs: var(--ds-text-xs); }`.
명령 `npx @tailwindcss/cli -i in.css -o out.css`(4.3.3 → `Done in 53ms`/`70ms`), 계산값은 `google-chrome --headless=new --dump-dom`으로 `getComputedStyle`을 DOM에 써서 읽음.

출력(두 형식 공통): `@layer theme { :root, :host { … --color-blue-400: oklch(70.7% 0.165 254.624); --spacing: 0.25rem; --text-xs: 0.75rem; --text-xs--line-height: calc(1 / 0.75); --radius-sm: 0.25rem; … } }`, `tokens.css`는 `@layer` 밖 `:root`로 파일 끝에 인라인.

ds 출력 utilities(발췌, 그대로):
```css
.-mt-ds-2 { margin-top: calc(var(--ds-space-2) * -1); }
.rounded-ds-sm { border-radius: var(--ds-radius-sm); }
.rounded-sm { border-radius: var(--radius-sm); }
.bg-blue-400 { background-color: var(--color-blue-400); }
.bg-ds-blue-400 { background-color: var(--ds-color-blue-400); }
.bg-ds-blue-400\/50 {
  background-color: var(--ds-color-blue-400);
  @supports (color: color-mix(in lab, red, red)) {
    background-color: color-mix(in oklab, var(--ds-color-blue-400) 50%, transparent);
  }
}
.p-2 { padding: calc(var(--spacing) * 2); }
.p-ds-2 { padding: var(--ds-space-2); }
.text-xs { font-size: var(--text-xs); line-height: var(--tw-leading, var(--text-xs--line-height)); }
.text-ds-xs { font-size: var(--ds-text-xs); }
```
legacy 출력은 같은 규칙에서 `--ds-…` 대신 `--color-blue-400`·`--space-2`·`--radius-sm`·`--text-xs`, 단 `.bg-ds-blue-400\/50`의 첫 줄이 `background-color: color-mix(in srgb, oklch(70.7% 0.165 254.624) 50%, transparent);`(인라인 테마가 `var(--color-blue-400)`를 **Tailwind 기본값으로** 풀어 넣음).

Chrome 계산값:

| 클래스 | legacy | ds |
| --- | --- | --- |
| `bg-blue-400` | `rgb(18, 52, 86)` ← 토큰 값으로 **바뀜** | `oklch(0.707 0.165 254.624)` (Tailwind 기본) |
| `text-xs` | `13px` ← **바뀜** | `12px` |
| `rounded-sm` | `6px` ← **바뀜** | `4px` |
| `p-2` | `8px` | `8px` (`--space-*`는 Tailwind `--spacing`과 겹치지 않음) |
| `bg-ds-blue-400` | `rgb(18, 52, 86)` | `rgb(18, 52, 86)` |
| `bg-ds-blue-400/50` | `oklab(0.319161 -0.0233746 -0.0685691 / 0.5)` | 같음 |
| `p-ds-2` / `-mt-ds-2` | `8px` / `-8px` | 같음 |
| `text-ds-xs` / `rounded-ds-sm` | `13px` / `6px` | 같음 |

4.3.5(`tw435`)로 같은 두 구성을 다시 빌드: utilities 구간이 4.3.3과 `diff` 없음, 계산값 같음.

관찰: (1) ds `/50`의 `color-mix` 미지원 대체값은 불투명 `var(--ds-color-blue-400)` — 범위 밖. (2) `text-ds-xs`에는 line-height가 없다(`--text-ds-xs--line-height` 미방출, 기존과 같음). (3) legacy에서는 ds 클래스조차 대체값 경로에서 Tailwind 기본 색을 쓴다 — 충돌이 기본 클래스만의 문제가 아니라는 근거.

### A.2 Tailwind 4 `compile()` 단위 테스트 가능성 — 확인

- `npm view tailwindcss@4.3.3 dependencies optionalDependencies` → 출력 없음(의존성 0). 패키지 파일: `LICENSE README.md dist index.css package.json preflight.css theme.css utilities.css`
- `exports` 키: `. ./plugin ./plugin.js ./defaultTheme ./defaultTheme.js ./colors ./colors.js ./lib/util/flattenColorPalette ./lib/util/flattenColorPalette.js ./package.json ./index.css ./index ./preflight.css ./preflight ./theme.css ./theme ./utilities.css ./utilities` — `createRequire(...).resolve("tailwindcss/theme.css")`·`"tailwindcss/index.css"` 동작
- 프로브(ESM, 그대로):
  ```js
  import { compile } from "tailwindcss";
  const loadStylesheet = async (id, base) => {
    const file = id === "tailwindcss" ? path.resolve("node_modules/tailwindcss/index.css") : path.resolve(base, id);
    return { path: file, base: path.dirname(file), content: fs.readFileSync(file, "utf8") };
  };
  const c = await compile(`@import "tailwindcss";\n@import "./tailwind.theme.css";\n@import "./tokens.css";\n`, { base: dir, loadStylesheet });
  const out = c.build(["bg-blue-400", "text-xs", "rounded-sm", "bg-ds-blue-400", "bg-ds-blue-400/50", "p-ds-2", "text-ds-xs", "rounded-ds-sm", "-mt-ds-2"]);
  ```
  → utilities 구간이 CLI 출력과 같음(후보에 없는 `p-2`만 빠짐), `real 0m0.095s`
- `theme.css`의 `--이름` 선언 419개, 그중 `--ds-` 0개. dsmith 이름과 겹치는 기본 변수: `--color-black --color-white`, 모든 `--color-<팔레트>-<단계>`, `--radius-{xs,sm,md,lg,xl,2xl,3xl,4xl}`, `--text-{xs,sm,base,lg,xl,2xl…9xl}`(+ `--text-shadow`). `--space-*`·`--radius-full`은 없음, 간격은 `--spacing: 0.25rem` 하나

### A.3 DTCG 루트 확장과 외부 도구 — 확인

- `tokens.json` 루트에 `"$extensions": { "dev.dsmith": { "cssPrefix": "ds" } }` + `color.blue-400`·`space.2`·`text.xs`
- Style Dictionary 5.7.1, platform `{ transformGroup: "css", prefix: "ds", files: [{ format: "css/variables" }] }` → `:root { --ds-color-blue-400: #123456; --ds-space-2: 8px; --ds-text-xs: 13px; }`(init `tokens.css`와 같은 이름)
- Terrazzo `@terrazzo/parser` 2.10.0 `parse()` → 예외 없음, 토큰 `color.blue-400,space.2,text.xs`(경로 불변)

### A.4 현재 코드 동작 — 확인(main `cc7090c` dist 실행·코드 읽기)

- `readCssVariableTokens(":root{--ds-color-blue-400:#123456;--ds-space-2:8px;--ds-radius-sm:6px;--ds-text-xs:13px;--color-blue-400:#123456;--text-xs:13px;}")` → `--ds-color-blue-400 color`, `--ds-space-2 spacing`, `--ds-radius-sm radius`, **`--ds-text-xs spacing`**(틀림), `--color-blue-400 color`, `--text-xs font-size`. 원인: `css-variables.ts` `FONT_SIZE_NAME = /^--(?:font-size|text|fs)-/i`
- `readW3cTokens`(확장 없음) `color.blue-400` → name `--color-blue-400`, path `color.blue-400`(`w3c.ts` `name = \`--${entry.path.join("-")}\``)
- CSS 변수 이름을 만드는 곳(소스 grep): `tokens/draft.ts` `draftToTokens`(`--${t.name}`), `tokens/emit.ts` `emitTokensCss`, `tokens/tailwind-preset.ts`(v4·v3 값), `tokens/w3c.ts` 읽기, `init/src/report.ts` 표. 그 밖은 읽은 `Token.name`을 그대로 씀: Extractor `tokenRef`(`cssVarRef(token)` = `var(${token.name})`, tailwind는 `ctx.preset.keys[token.name]`), `parsePresetKeys`(정규식이 `var(--[A-Za-z0-9_-]+)` — 접두 무관), `guard/snapshot.ts`·`packages/guard/src/snapshot.ts`(`loadReplacementTokens` 결과), catalog(`readCatalogTokens` → `readW3cTokens`), migrate·eslint-plugin(소스에 토큰 이름 리터럴 없음)
- 벤치마크: `benchmarks/src/base.ts` `snapshotSha256 = sha256Text(JSON.stringify(snapshot))`(init 산출 토큰 이름 포함) → 새 이름으로 바뀜, `merge.ts`가 sha 다르면 거부. `benchmarks/replay/legacy-demo/dsmith/{01-form,06-badge,12-pagination}` 산출물이 `var(--color-…)`를 씀(README "지어낸 `var(--color-brand)`")
- 현재 v4 경고 문자열(`init/src/run.ts`)과 이를 단언하는 테스트(`init/test/run.test.ts` "v4 레포는 tailwind.theme.css…")
