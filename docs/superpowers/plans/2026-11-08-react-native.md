# React Native 지원 — `StyleSheet` Extractor · JS 테마 객체 토큰 · RN init · RN 벤치마크 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expo/React Native 앱에서 dsmith 전 구간(`detect → audit → init → ai → migrate → guard`)이 의미 있는 결과를 내게 한다. 지금 main(0.3.0 dist)은 실제 RN 앱(Expo SDK 57 계열, expo-router 사용)에서 프레임워크만 `react-native`로 맞히고, 스타일 사용 601개 중 599개를 dynamic으로 세며 **점수 대상(rated) 0개**(`(스타일 데이터 없음 — 참고용)`), 앱이 이미 가진 JS 테마 모듈(`src/theme.ts`의 `colors`·`spacing`·`radius`·`typography`)을 토큰으로 읽지 못해 `init`은 그 옆에 **빈 `tokens.{json,css,ts}`**를 새로 만들고, `migrate`는 `치환할 토큰이 없음`으로, `ai`는 `DS를 찾지 못함`으로 끝난다(부록 A.1). 이 계획 뒤에는 `StyleSheet.create`·스타일 배열·인라인 객체의 값이 추출되고, `colors.surface` 같은 테마 멤버 참조가 **토큰 사용**으로 세지며, `migrate`가 하드코딩 값을 `colors.surface`(필요하면 테마 import 추가)로 바꾸고, `init`은 기존 테마를 그대로 쓴다.

**Architecture:** 두 축. (1) **JS 테마 토큰** — core가 `export const colors = { … } as const` 모양 모듈을 정적으로 읽어 `Token`(`name: "colors.surface"`, `js: { module, export, path }`)을 만든다(`tokens/js-theme.ts`). Extractor는 import 바인딩에서 시작하는 멤버 식에 `StyleUsage.ref`(지정자·import 이름·경로)만 붙이고, **해석은 core 한 곳**(`buildTokenRefResolver` → `extractFileStyles`의 선택 인자)이 module 키(`moduleKeyOf`, tsconfig paths 포함)로 토큰과 맞춰 그 사용을 `source "token"`으로 바꾼다 — 인덱서·migrate 재추출·verify·ESLint·`guard --ci`·MCP `lint_snippet`·벤치마크 채점이 모두 같은 함수를 지나므로 숫자가 한 규칙으로 나온다. 이 축은 웹 레포의 JS 테마에도 그대로 적용된다(legacy-demo `src/lib/theme.ts`, 부록 A.4). (2) **RN Extractor** — 새 패키지 `@dsmith-dev/extractor-react-native`(이름·방식 `react-native-stylesheet`)가 `StyleSheet.create/compose` 인자, JSX `style`·`*Style` prop의 객체·배열·조건식 가지, 스프레드(`...typography.caption`)를 core `usagesFromStyleObject`(RN 키 분류 override)로 읽고, `tokenRef`는 **JS 표현식만**(`colors.surface`, `spacing[2]`) 낸다. 표현식 치환은 `write(usage, ref, { expression: true })`. 테마 import가 없는 파일은 migrate가 components.ts에서 떼어 낸 공용 import 편집(`imports.ts`)으로 `import { colors } from "../theme"`를 더한다.

**Tech Stack:** 기존 그대로(@babel/parser 7.29.12·@babel/traverse 7.29.12, culori, fast-glob, picomatch). **새 외부 의존성 없음**. 새 워크스페이스 패키지 1개(`packages/extractor-react-native`, fixed 그룹). 새 공개 fixture `fixtures/rn-app`(합성, 이 계획에서 처음부터 작성).

**근거:** 부록 A(이 세션에서 실제 실행 — main `dd3d488` 빌드 dist, 사용자 Expo 앱의 소스 사본, 합성 스니펫 babel 파싱). **비공개 앱의 코드·파일 내용은 이 저장소에 넣지 않는다**(부록은 집계 수치와 일반화한 경로만).

## 결정

| # | 질문 | 결정 | 이유 |
| --- | --- | --- | --- |
| 1 | RN 스타일을 어디서 읽나 | **새 패키지 `@dsmith-dev/extractor-react-native`**, `Extractor.name`·감지 방식 이름 `react-native-stylesheet`. `signals: { dependencies: ["react-native"], code: "StyleSheet\\.create\\(" }`(내장 감지 블록을 늘리지 않고 Plan 3b의 signals 경로로 감지). `appliesTo` = JS 파일 && `/\b(?:style\|[A-Za-z]+Style)=\{\|StyleSheet\./` | inline-style을 넓히면 웹 의미(`var()` 참조, 단위 문자열)와 RN 의미(단위 없는 dp, JS 참조만, `StyleSheet` 호출)가 한 패키지에 섞인다. 실제 앱에서 `style={styles.x}` 587회·`style={[…]}` 56회·`StyleSheet.create` 44회인데 inline-style은 `style={{…}}` 5곳만 본다(부록 A.1·A.2) |
| 1a | inline-style과 겹침 | RN 방식이 감지되고 `framework.name === "react-native"`면 detect가 `inline-style`을 방식·`activeExtractors`에서 빼고, RN 방식 근거에 `supersedes: inline-style`을 남긴다. `overrides.activeExtractors`로 되돌릴 수 있다 | RN Extractor가 `style={{}}`도 읽으므로 둘 다 켜면 같은 값을 두 번 센다. 웹 프레임워크(Next+react-native-web)에서는 빼지 않는다 |
| 1b | 무엇을 사용으로 내나 | `StyleSheet.create({ k: {…} })`의 각 클래스 객체(**중첩 객체는 재귀하지 않는다** — `shadowOffset: { width, height }`·`transform` 안의 `width`·`height`·`translateY`를 레이아웃 길이로 세면 오답이다. 중첩 객체 값은 dynamic `other` 한 건. 웹 CSS-in-JS의 `nested`와 다르다), `StyleSheet.compose(a, b)`·`StyleSheet.flatten([…])` 인자 중 객체 리터럴, JSX `style`·`*Style`(`contentContainerStyle`·`labelStyle` …) 값의 객체·배열 원소·`cond && {…}`·`c ? {…} : {…}` 가지, `Platform.select({ ios: {…}, android: {…} })` 값 객체(스프레드·속성 값 모두). `style={styles.x}`·배열의 `styles.x` 원소는 지금처럼 dynamic `other` 한 건(커버리지 분모 밖). `StyleSheet.hairlineWidth`·`absoluteFill`은 dynamic | 실제 앱 분포(부록 A.2): 클래스 452개, 값 1,600여 개, 배열 원소 132개 중 객체 리터럴 18·`&&` 33. 정의 쪽(create)을 값으로 세고 참조 쪽(`styles.x`)은 한 번만 세야 이중 계산이 없다 |
| 1c | 값·속성 모델 | 단위 없는 숫자 = px(dp) — 기존 `normalizeNumber`(길이 속성만). 키 분류는 기존 `cssPropertyToStyleProperty`(camelCase → `paddingHorizontal`·`marginStart`·`borderTopLeftRadius`·`borderTopColor`가 이미 맞게 분류됨) + RN override: `shadowColor`·`textShadowColor`·`tintColor`·`overlayColor` → `color`; `elevation`·`shadowOpacity`·`shadowRadius`·`borderWidth*`·`lineHeight`·`letterSpacing` → `other`(지금과 같음). 퍼센트 문자열(`"50%"`)은 기존 분류기 그대로 | StyleProperty 모델을 늘리지 않는다. 실제 앱에서 hex 8개 중 1개가 `shadowColor`라 override 없이는 점수 밖(부록 A.2) |
| 1d | `tokenRef`·`write` | `tokenRef(token, usage, ctx)` = `token.js`가 있으면 `jsTokenExpression(token, ctx.jsLocal?.[token.js.export])`, 없으면 **null**(RN에는 CSS 변수가 없다). extractor-api `Extractor.write(usage, ref, opts?: WriteOptions)` — `opts.expression`이면 숫자 노드는 노드 전체, 문자열 리터럴은 **값 전체가 한 색일 때만** 따옴표 포함 노드 전체(`StyleObjectPatch.literal`)를 식으로 바꾼다. 문자열 일부(`"1px solid #000"`)는 null → migrate 사유 `js-ref-in-string`. inline-style도 같은 규칙을 얻는다(JS 토큰이면 식, 아니면 지금의 `var()`) | `literal` 구간은 mui-sx용으로 이미 있다(object-style.ts). 템플릿 리터럴 변환은 범위 밖 |
| 2 | JS 테마를 토큰으로 읽는 규칙 | core `readJsThemeTokens(code, file, { module, resolveImport })`: 최상위 `export const X = <객체>`(`as const`·`satisfies` 벗김), `const X = {…}; export { X }`, `export default {…}`(export `"default"`). 잎 → 토큰: 문자열이 `normalizeColor`로 풀리면 color, 숫자는 조상 키(X 포함) 정규식으로 spacing(`/^(spacing\|space\|spaces\|gap\|gaps\|sizes?)$/i`)·radius(`/^(radius\|radii\|rounded\|corners?)$/i`), 잎 키가 `fontSize`이거나 조상이 `/^(fontSizes?\|textSizes?)$/i`면 font-size. 색은 조상 이름과 무관하게 받는다(`theme.primary`). 이름 = export + 경로를 `.`로(`colors.surface`, `typography.caption.fontSize`), 값 = 원문(`"#fff"`, 숫자는 `"8"`) | 이름 휴리스틱만으로는 웹 차트 설정 등을 토큰으로 오인한다 → 근거 2(사용 증거)와 묶는다. 실제 앱 테마는 잎 32개(색 15·간격 6·모서리 4·글꼴 크기 7)를 이 규칙으로 모두 읽는다(부록 A.3) |
| 2a | 후보 모듈과 사용 증거 | detect `ds.jsThemes: { file, module, exports, importers }[]`. 후보 = 기존 `TOKEN_FILES` 중 `.ts/.js/.mjs` ∪ `**/{theme,tokens,colors,Colors,palette}.{ts,js,mjs}` ∪ `**/constants/{Colors,Theme,theme}.{ts,js}` ∪ `**/theme/index.{ts,js}`, 그중 (a) `readJsThemeTokens` 토큰 ≥ 2 **그리고** (b) 다른 소스 파일 ≥ 1개가 그 module을 import(`moduleKeyOf`로 해석)할 때만. init 산출 `tokens.ts`(옆에 `tokens.json`)는 지금처럼 제외 | (b)가 "쓰이는 테마" 증거. 사용처 멤버 식 수는 audit 리포트에 `JS 테마 참조 N개`로 보인다(인덱스에서 계산) |
| 2b | 값이 다른 모듈 상수일 때 | 같은 파일의 `const` 객체 식별자와 **상대 경로 named import 한 단계**까지 따라간다(`resolveImport`). 그 밖(함수 호출, 계산 키, 두 단계 이상)은 그 잎을 건너뛰고 경고 `JS 테마 값을 해석하지 못함: colors.<키> (src/theme.ts)` | 실제 테마의 색 키 하나가 다른 모듈의 `Record<…, string>` 상수다(부록 A.3). 그 사용 10곳은 `colors.<키>[x]` 계산 접근이라 어차피 dynamic |
| 2c | 모드(light/dark) | 객체의 `light`·`dark`가 **둘 다 객체이고 키가 하나 이상 겹치면** 그 두 가지 아래 토큰에 `js.mode`를 붙인다(형제 키 `primary` 등은 모드가 아니고, 잎이 문자열인 `light: "#fff"`·`dark: "#000"`은 일반 토큰). 참조 해석(audit 토큰 사용)은 하되 **치환 후보에서는 뺀다** | Expo 기본 템플릿 `constants/Colors.ts`가 이 모양. `#fff`를 `Colors.light.background`로 바꾸면 다크 모드가 깨진다 |
| 2d | 웹 레포에서 JS 토큰의 역할 | **참조 해석은 항상**(audit·guard·벤치마크가 `theme.muted`를 토큰 사용으로 셈). **치환 대상**(migrate·ESLint fix·MCP `lint_snippet` 제안)은 core `replacementCandidates(tokens, { framework })`: 프레임워크가 RN이거나 비-JS 토큰이 하나도 없을 때만 JS 토큰 포함, 그 밖에는 CSS·DTCG 토큰만. 추가로 usage별로 `extractor.tokenRef(token, usage, ctx) !== null`인 토큰 중에서 최선을 고른다 | legacy-demo(웹, init 산출 `tokens.css` + `src/lib/theme.ts`)의 migrate 계획 28건(identical 26·exact 2)이 그대로여야 한다(부록 A.4). CSS Extractor는 JS 토큰 참조 형식이 없어 섞이면 `no-token-ref`만 늘어난다 |
| 2e | 토큰 사용 판정 위치 | Extractor는 `StyleUsage.ref = { specifier, imported, path, spread? }`만 붙인다(named import → `imported` = 원 이름, namespace import → `"*"`이고 `path[0]`이 export, default → `"default"`). core `buildTokenRefResolver(tokens, { tsPaths, moduleContext })`가 `extractFileStyles(ctx, matchers, { resolveRef })`에서 usage 객체를 **제자리 수정**(source `token`, normalized = 토큰 값; WeakMap 키 보존). 스프레드 `...typography.caption`은 `path + ["fontSize"]` 토큰이 있으면 property `font-size` 토큰 사용 1건, 없으면 사용 없음 | Extractor는 상태 파일을 읽지 않는다는 기존 경계(3b) 유지. `moduleKeyOf`가 이미 컴포넌트 import를 같은 규칙으로 푼다(legacy-demo `@/lib/theme` → `src/lib/theme`) |
| 2f | `typography` 복합 토큰 | **새 토큰 종류를 만들지 않는다.** 잎 `typography.caption.fontSize`만 font-size 토큰. `fontWeight`·`lineHeight`·`letterSpacing`은 토큰이 아님(무시). DTCG `typography` 복합 타입 방출은 범위 밖 | Token.category 4종 모델을 지킨다. 실제 앱의 글꼴 크기 사용은 대부분 스프레드(225회)라 잎 하나로 충분히 셈이 맞는다 |
| 2g | 표현 방식(guard·ESLint·MCP·AGENTS) | `Token.js?: { module, export, path, mode? }` / extractor-api `TokenLike.js?` 같은 모양. guard 스냅샷 `tokens[]`에 `js` 필드(있을 때만 — 없는 레포 바이트 불변). ESLint: JS 토큰 fix는 그 파일이 이미 그 module의 그 export를 import했을 때만 exact면 autofix, 아니면 메시지에 `(import 필요: import { colors } from "../theme")`를 붙인 제안 **없는** 보고. MCP `resolve_token`: 입력 `colors.surface`(알려진 JS 토큰 이름)도 받고, 응답 `token.ref = { kind: "css", expression: "var(--…)" } \| { kind: "js", expression: "colors.surface", import: { module, name } }`(추가 필드). AGENTS.md DS 섹션 토큰 줄: `- 토큰: \`src/theme.ts\`의 JS 객체 \`colors\`·\`spacing\`·\`radius\`·\`typography\` — 스타일 값은 이 객체를 import해 참조(예 \`colors.<이름>\`), hex·숫자 직접 쓰지 않음` | ESLint는 동기·단일 파일이라 import 삽입을 안전하게 못 한다(import 편집은 migrate만). 응답 필드는 추가만 해 기존 소비자를 깨지 않는다 |
| 3 | DS 컴포넌트 감지(파일 형태) | `LOCAL_DS_DIRS` 다음에 `LOCAL_DS_FILES = ["components/ui", "src/components/ui", "src/ui"] × {tsx,ts,jsx,js}`. 찾으면 `{ kind: "local", dir: "<확장자 뺀 module 키>", entry: "<파일>" }` — `dir`은 `isDsSpecifier`가 그대로 맞히고(`s === dir`), 디렉터리로 glob하던 곳(catalog `catalogFromDir`·examples)은 `entry`가 있으면 그 파일 하나만 본다 | 실제 앱 `src/components/ui.tsx`의 UI 컴포넌트 여섯 개가 각각 수십~백수십 회 쓰이는데 `kind: "none"`, `dsImportShare 0`(부록 A.1). `ds.dir` 소비처 17곳은 `git grep -n "ds\.dir"`로 전부 확인(Review Focus 4) |
| 4 | `init` — RN | 아래 "상황별 동작" 표. 요점: RN이면 `tokens.css`·`tokens.json`·Tailwind 프리셋·웹 스캐폴드를 쓰지 않는다. JS 테마가 있으면 **토큰 파일을 하나도 만들지 않고** 그 테마로 커버리지를 계산, 없으면 `design-system/tokens.ts`(RN 형식: `export const colors/spacing/radius/fontSize = {…} as const`, 숫자 단위 없음)만 | 평행 토큰 파일은 "어느 쪽이 정본인가"를 흐린다. RN 형식 `tokens.ts`는 `readJsThemeTokens`가 다시 읽는 모양(왕복 테스트) |
| 5 | 벤치마크 | `--repo knowing-saju`(외부 경로: `--repo-path <dir>` 또는 env `DSMITH_BENCH_REPO_PATH`, 모노레포 밖이어야 함) + 공개 합성 `--repo rn-app`(`fixtures/rn-app`, CI에서 파이프라인 검증용). 프롬프트 세트 `benchmarks/prompts-rn/` 12개(한국어, `이 앱 스타일로 `로 시작, 산출 경로 `src/components/…` 9개·`app/bench-*.tsx` 3개). 독립 채점기에 RN 문맥(StyleSheet 인자·`*Style` prop·배열·스프레드)과 종류 `themeRef`를 더한다(dsmith import 없음) | 웹 프롬프트(`이 레포 스타일로`, Next 경로)는 RN 앱에서 뜻이 없다. 공개 fixture가 있어야 비공개 레포 없이 하네스를 테스트할 수 있다 |
| 5a | 비공개 레포 결과 정책 | 외부 레포 실행은 `--out`·`--record`가 **필수이며 모노레포 밖**이어야 한다(안이면 종료 2). 커밋하는 것은 `bench:report --redact`가 만든 `benchmarks/results/<date>-knowing-saju.md`와 `.summary.json` 둘뿐: 프롬프트 id × 조건 × 반복의 수치 지표와 집계·통계만. 파일 경로는 프롬프트의 `file`(공개)만 남기고 그 밖은 `기타 파일 N개`, 토큰 이름·`undefinedVars`·finding 메시지·코드 발췌·에이전트 출력·레포 커밋 sha 없음(스냅샷 sha256은 남김 — 내용을 드러내지 않고 merge 동일성 확인에 필요) | 공개 저장소에 비공개 앱의 구조·이름이 새지 않게 한다. 리댁션은 테스트로 고정(경로 모양 문자열·`colors.` 접두가 산출에 없음) |
| 6 | 릴리스 | changeset `.changeset/react-native.md` `"dsmith": minor`(fixed 그룹 — 새 패키지도 같은 버전으로 오른다). 새 패키지 `package.json`은 `extractor-inline-style`을 본떠 `version: "0.3.0"`(그룹 현재 값), `publishConfig.access: public`, `repository.directory`. **첫 게시 주의**: `docs/release.md` 27행대로 새 패키지 첫 게시에는 `NPM_TOKEN`이 org "All packages" 권한이어야 하고, trusted publishing은 첫 게시 뒤에만 등록 가능 — release.md에 한 단락 추가. npm에 이 이름이 아직 없음을 확인(부록 A.6) | 대기 중인 changeset(`real-repo-bugs.md`·`tw4-ds-prefix.md`)과 함께 다음 minor에 실린다 |

### 상황별 동작 — `init` (결정 4)

| 상황 | 결과 |
| --- | --- |
| RN + JS 테마 있음(`ds.jsThemes` 비지 않음) | 토큰 파일 쓰기 0개. `InitResult.tokenSource = { kind: "js-theme", files: ["src/theme.ts"] }`, 토큰 수·커버리지는 그 테마(`replacementCandidates`, 모드 토큰 제외) 기준. 요약 `토큰: 기존 JS 테마 사용 — src/theme.ts (색 15 · 간격 6 · 모서리 4 · 글꼴 크기 7)`. 스캐폴드는 `skippedScaffolds`에 `react-native: 웹 스캐폴드 템플릿이라 만들지 않음`. 프리셋 null |
| RN + 테마 없음 | `design-system/tokens.ts`만(GENERATED_NOTICE 머리, RN 형식, 키는 식별자로: `blue-400` → `blue400`, 숫자 키는 그대로 `spacing[2]`로 참조). `tokens.json`·`tokens.css` 없음. 매니페스트·보류(modified/invalid) 규칙은 tokens.ts 한 파일에 그대로 적용. `loadReplacementTokens`는 init 디렉터리의 `tokens.ts`를 옆에 `tokens.json`이 없으면 JS로 읽는다 |
| RN + 이전 init 산출(`tokens.css`·`tokens.json`이 이미 있음) | 지우지 않고 다시 쓰지도 않음. 경고 `react-native 레포에서는 design-system/tokens.css·tokens.json을 쓰지 않음 — 필요 없으면 지워도 됨`. 테마 있음/없음 규칙은 위와 같음 |
| 웹 + JS 테마 | **지금과 같음**(tokens.css·json·ts·프리셋). JS 토큰은 참조 해석에만(결정 2d). legacy-demo init 산출 바이트 불변 |
| `--dry-run` | 위와 같은 판단, 쓰기 없음 |

## Global Constraints

- Plan 4a·tw4 계획의 Global Constraints 그대로: 스코프 `@dsmith-dev/*`, ESM only, `tsconfig.base.json` 상속, 한국어 conventional commit, **Co-Authored-By·Claude 트레일러 없음**, author `Dahee Hwang <dahee@project-hh.com>`(`git -c user.name="Dahee Hwang" -c user.email="dahee@project-hh.com" commit`), **각 커밋에서 루트 `pnpm -r build && pnpm test && pnpm typecheck` 녹색**, 테스트는 fixture를 임시 디렉터리로 복사(원본 `fixtures/`·`examples/legacy-demo` 불변)
- 파일 편집은 에디터 도구로만(Python·sed·heredoc 스크립트로 소스를 고치지 않는다)
- **비공개 앱 보호:** 사용자 앱(knowing-saju)의 코드·파일 내용·토큰 이름·값·파일 목록을 커밋에 넣지 않는다 — 테스트 fixture·스냅샷·문서·결과 파일 모두. 테스트는 `fixtures/rn-app`(이 계획에서 새로 쓰는 합성 앱)과 인라인 합성 스니펫만 쓴다. 실제 앱 확인은 컨트롤러 항목이며 그 결과는 부록 형식(집계·일반화 경로)으로만 남긴다
- **의존 방향 불변:** `extractor-api` ← `core` ← extractor 7종 ← `detect` ← `migrate`/`guard` ← `cli`. 새 Extractor는 `core`·`extractor-api`만 의존. `eslint-plugin`·`benchmarks`는 내장 이름표에 `react-native-stylesheet`를 더한다(cli `registry.test.ts`가 키 일치를 고정 — 키 7개로 갱신)
- **해석은 한 곳:** JS 토큰 참조 판정은 core `buildTokenRefResolver`만. Extractor·migrate·ESLint·MCP에 module 경로 비교 코드를 따로 두지 않는다. 치환 대상 선택은 core `replacementCandidates`만
- **웹 레포 불변(결정 2d):** legacy-demo `audit → init --all → migrate` 계획 28건(identical 26·exact 2·건너뜀 translucent 1·multi-value 1, 14파일)과 init 산출 바이트가 main과 같다. 바뀌는 것은 audit의 토큰 사용 수뿐(부록 A.4 예측: rated 187 → 190, hardcodedShare 0.3422 → 0.3368, 점수 52 유지)
- 기존 e2e 스냅샷 `packages/cli/test/__snapshots__/e2e.test.ts.snap`: **`examples/legacy-demo` audit 항목만** 위 예측대로 바뀔 수 있다(theme 직접 참조 3건 dynamic → token, 조건식 1건은 dynamic 유지). 그 밖의 항목이 바뀌거나 숫자가 예측과 다르면 원인을 적고 멈춤
- 기존 테스트 기대값이 **추가 필드**(`StyleUsage.ref`, `Token.js`, `DsDetection.entry`·`jsThemes`, `InitResult.tokenSource`, MCP `token.ref`)만으로 깨지면 갱신하고 보고서에 파일·테스트 이름을 적는다
- 결정적 출력: 새 필드는 있을 때만 쓰고 키 순서 고정. guard 스냅샷은 JS 토큰이 없는 레포에서 바이트 동일
- `.changeset/real-repo-bugs.md`·`tw4-ds-prefix.md`와 원격 `changeset-release/main`은 건드리지 않는다

## Review Focus

1. **이중 계산 없음** — RN 레포에서 inline-style이 꺼지고, `style={styles.x}`는 dynamic 한 건, 정의(create)의 값만 rated → Task 2·3
2. **해석 한 곳** — `resolveRef`가 인덱서·plan 재추출·verify·ESLint analyze·guard ci·lint_snippet·벤치 score 7곳에 같은 resolver로 들어가는가(`git grep -n "extractFileStyles("` 전수) → Task 1·3·4·6
3. **웹 불변** — legacy-demo migrate 계획·init 산출 바이트, e2e 스냅샷 차이가 결정 범위 안인가 → Task 3·4
4. **`ds.dir` 소비처** — `entry`가 있을 때 디렉터리 glob이 파일 하나로 바뀌었는가, `isDsSpecifier`가 `src/components/ui`를 DS로 보는가 → Task 3
5. **import 편집 안전** — 로컬 이름 충돌, 타입 전용 import, namespace import, 기존 import 병합, `--revert` 왕복 해시 → Task 4
6. **비공개 데이터 누출 없음** — 커밋 diff에 사용자 앱 이름 외의 내용이 없는가, 리댁션 테스트 → Task 6·7

---

## File Structure

```
packages/extractor-api/src/extractor.ts        StyleUsage.ref, TokenLike.js, WriteOptions, TokenRefContext.jsLocal, jsTokenExpression
packages/extractor-api/src/conformance.ts      WriteCase.writeOptions, ctx.jsLocal 전달
packages/core/src/model/token.ts               Token.js
packages/core/src/tokens/js-theme.ts           readJsThemeTokens, JS_THEME_CANDIDATES, jsKeyOf(새)
packages/core/src/tokens/ref-resolver.ts       buildTokenRefResolver, replacementCandidates(새)
packages/core/src/tokens/load.ts               .ts/.js 토큰 파일을 JS 테마로 읽음(init 쌍 tokens.ts 제외 유지)
packages/core/src/tokens/replacement-tokens.ts init 디렉터리 RN tokens.ts
packages/core/src/tokens/emit.ts               emitTokensTsRn
packages/core/src/index/extract-file.ts        opts.resolveRef
packages/core/src/index/indexer.ts             IndexOptions.resolveRef
packages/core/src/parse/object-style.ts        (변경 없음 — RN은 classify override로)
packages/extractor-inline-style/src/{extract,write}.ts  ref 붙이기, JS 토큰 식 치환
packages/extractor-react-native/**             새 패키지(extract.ts, write.ts, rn-properties.ts, index.ts, test/)
packages/detect/src/{detect-ds,detect-styling,index}.ts  jsThemes, LOCAL_DS_FILES/entry, inline-style 대체
packages/cli/src/{registry.ts,commands/audit.ts,report/*}  RN 등록, resolver 연결, 리포트 JS 테마 줄
packages/catalog/src/{local,build,agents-section,run}.ts   entry 단일 파일, JS 토큰 카탈로그·섹션 문구, 토큰만 있는 ai
packages/migrate/src/imports.ts                components.ts의 import 편집을 옮긴 공용 모듈(새)
packages/migrate/src/{plan,apply,verify,components}.ts     JS 토큰 치환 + import 추가, 사유 js-ref-in-string·js-binding-conflict
packages/guard/src/snapshot.ts, packages/core/src/guard/snapshot.ts  tokens[].js
packages/eslint-plugin/src/{registry,analyze,rules/no-hardcoded-style}.ts
packages/mcp-server/src/tools/{resolve-token,lint-snippet}.ts
packages/init/src/{run,report}.ts              RN 분기(결정 4)
fixtures/rn-app/**                             합성 Expo 앱(새)
benchmarks/prompts-rn/*.md (12), benchmarks/src/{base,run,prompts,extractors,redact,report}.ts, benchmarks/src/independent/{rn,scan,score,types}.ts
README.md, packages/extractor-react-native/README.md, docs/release.md, .changeset/react-native.md
```

**순서·의존:** T1 → T2 → T3 → T4 → T5 → T6 → T7. T5(init)는 T3의 `jsThemes`가, T6(벤치)는 T2·T3·T4가 필요하다.

---

### Task 1: core·extractor-api — JS 테마 토큰 읽기, `StyleUsage.ref`, 참조 해석기, 표현식 치환 계약

**Files:**
- Create: `packages/core/src/tokens/js-theme.ts`, `packages/core/src/tokens/ref-resolver.ts`, `packages/core/test/{js-theme,ref-resolver}.test.ts`
- Modify: `packages/extractor-api/src/{extractor,conformance}.ts`, `packages/core/src/model/token.ts`, `packages/core/src/tokens/{load,replacement-tokens}.ts`, `packages/core/src/index/{extract-file,indexer}.ts`, `packages/core/src/index.ts`, `packages/extractor-inline-style/src/{extract,write}.ts`, `packages/extractor-inline-style/test/*`

**Interfaces:**
- Consumes: `parseTsx`, `traverse`, `normalizeColor`, `moduleKeyOf`, `TsPaths`, `ModuleContext`, `StyleObjectPatch.literal`
- Produces:
  ```ts
  // extractor-api/src/extractor.ts (추가만)
  export interface StyleUsage { /* 기존 */
    /** import 바인딩에서 시작하는 멤버 식 값(`colors.surface`, `theme.space[2]`, 스프레드 `...typography.caption`). 해석은 core가 한다 */
    ref?: { specifier: string; imported: string; path: string[]; spread?: true };
  }
  export interface TokenLike { /* 기존 */ js?: { module: string; export: string; path: string[]; mode?: "light" | "dark" } }
  export interface WriteOptions { /** tokenRef가 JS 식이다 — 따옴표로 감싸지 않고 값 노드 전체를 바꾼다 */ expression?: boolean }
  export interface TokenRefContext { preset?: TailwindPreset; /** JS 토큰 export 이름 → 이 파일의 로컬 이름(migrate가 채움). 없으면 export 이름 */ jsLocal?: Record<string, string> }
  /** ("colors", ["surface"]) → "colors.surface", ["brand","500"] → "colors.brand[500]", 식별자 아닌 키 → `["a-b"]`. token.js 없으면 null */
  export function jsTokenExpression(token: TokenLike, local?: string): string | null;
  // Extractor.write(usage, tokenRef, opts?: WriteOptions): WritePatch | null   ← 세 번째 인자 추가(기존 구현은 무시해도 됨)

  // core/src/model/token.ts
  export interface Token { /* 기존 */ js?: { module: string; export: string; path: string[]; mode?: "light" | "dark" } }

  // core/src/tokens/js-theme.ts (fs 없음 — resolveImport는 호출자가 준다)
  export interface JsThemeRead { tokens: Token[]; exports: string[]; warnings: string[] }
  export function readJsThemeTokens(code: string, file: string, opts: {
    module: string;                                    // root 상대 확장자 뺀 module 키 "src/theme"
    resolveImport?: (specifier: string) => { code: string; file: string } | null;   // 상대 경로 한 단계(결정 2b)
  }): JsThemeRead;
  export const JS_THEME_CANDIDATES: readonly string[];   // 결정 2a의 glob
  /** "blue-400" → "blue400", "2" → "2"(숫자 키), "gray-50" → "gray50" — RN tokens.ts 키 */
  export function jsKeyOf(key: string): string;

  // core/src/tokens/ref-resolver.ts
  export type RefResolver = (file: string, usage: StyleUsage) => Token | null;
  export function buildTokenRefResolver(tokens: Token[], env: { tsPaths: TsPaths | null; moduleContext: ModuleContext }): RefResolver;
  /** 결정 2d. framework는 detect.framework.name */
  export function replacementCandidates<T extends Token>(tokens: T[], opts: { framework: string }): T[];

  // core/src/index/extract-file.ts
  export function extractFileStyles(ctx: ExtractContext, matchers: ExtractorMatcher[], opts?: { resolveRef?: RefResolver }): FileStyles;
  // 해석된 usage는 제자리 수정: source "token", normalized = token.normalized, 스프레드면 property "font-size". ref는 남긴다
  // IndexOptions.resolveRef?: RefResolver → indexRepo가 그대로 넘김
  ```
  - `loadTokens`: CSS → JSON → **JS(.ts/.js/.mjs)** 순. JS 파일은 `readJsThemeTokens`(resolveImport = 상대 경로 파일 읽기, `.ts/.tsx/.js/index.ts` 순 시도), 토큰 0개면 지금처럼 `ignored`. init 쌍 `tokens.ts`(옆 `tokens.json`) 제외 규칙 유지. 같은 이름 충돌은 먼저 나온 것이 이긴다(경고)
  - inline-style: 멤버 식 값에 `ref`(파일 import 표에서 루트 식별자를 찾을 때만), `tokenRef`는 `token.js`면 `jsTokenExpression`, 아니면 `cssVarRef`. `write(..., { expression: true })` 규칙은 결정 1d
- [ ] **Step 1: 실패하는 테스트**
  - js-theme: 합성 테마(`as const`·`satisfies`·`export { X }`·`export default`·중첩·숫자 키·`fontSize` 잎·`light/dark`) → 이름·category·normalized·`js.path`·`mode` 단언; 다른 모듈 상수 한 단계 해석과 두 단계에서 경고; `createTheme({...})` 호출 → 토큰 0; 웹 차트 설정 모양(`export const chartConfig = { series: [...] }`) → 토큰 0
  - ref-resolver: named·alias(`import { colors as c }`)·namespace(`import * as t` → `t.colors.x`)·default·tsconfig `@/*` 별칭·상대 경로·다른 module의 같은 이름(미해석)·계산 접근(`colors.mode[x]` → 미해석)·스프레드(fontSize 있음/없음)
  - `replacementCandidates`: 웹 + CSS 토큰 있음 → JS 제외, 웹 + JS뿐 → 포함, RN → 포함, `mode` 토큰은 항상 제외
  - `extractFileStyles` 제자리 수정 후 `write`가 여전히 패치를 만든다(WeakMap 보존)
  - `loadTokens`: legacy-demo 모양(`src/lib/theme.ts` + `design-system/tokens.css`) → CSS 토큰이 앞, JS 토큰 `theme.primary`… 뒤, `ignored`에서 theme.ts 빠짐
  - conformance(inline-style): `import { colors } from "./theme"` 있는 코드에서 `color: "#fff"`를 JS 토큰으로 → `ref "colors.surface"`, `writeOptions { expression: true }`, 출력 `color: colors.surface`, 재추출 `{ source: "dynamic", ref: { imported: "colors", path: ["surface"] } }`; 숫자 `padding: 8` → `padding: spacing.sm`; `border: "1px solid #000"` → write null
- [ ] **Step 2: 실패 확인 → 구현 → 통과** — 루트 전 구간 녹색(e2e 스냅샷은 이 Task에서 바뀌면 안 된다 — audit이 아직 resolver를 넘기지 않으므로)
- [ ] **Step 3: Commit** — `feat(core,extractor-api): JS 테마 객체를 토큰으로 읽고 멤버 참조를 한 곳에서 해석(StyleUsage.ref, 표현식 치환)`

---

### Task 2: `@dsmith-dev/extractor-react-native` — StyleSheet·style 배열·Platform.select

**Files:**
- Create: `packages/extractor-react-native/{package.json,tsconfig.json,README.md,src/{index,extract,write,rn-properties}.ts,test/{extract,conformance}.test.ts}`, `fixtures/rn-app/**`(합성 Expo 앱: `package.json`(expo·react-native·expo-router 범위만, 설치 안 함), `tsconfig.json`(`@/*` 별칭), `src/theme.ts`, `src/components/ui.tsx`, 화면 4–6개 — StyleSheet·배열·조건식·스프레드·인라인·hex·숫자·`Platform.select`·`StyleSheet.compose`·`hairlineWidth`·`colors.mode[x]`를 각 1회 이상)
- Modify: 루트 `tsconfig.json` references, `packages/cli/{package.json,src/registry.ts}`, `packages/eslint-plugin/{package.json,src/registry.ts}`, `benchmarks/{package.json,src/extractors.ts}`, `packages/cli/test/registry.test.ts`·`benchmarks/test/prompts.test.ts`(키 7개)

**Interfaces:**
- Consumes: `parseTsx`, `traverse`, `usagesFromStyleObject`(classify override), `isRatedUsage`, `jsTokenExpression`, `StyleUsage.ref`
- Produces:
  ```ts
  export const EXTRACTOR_NAME = "react-native-stylesheet";
  export const reactNativeExtractor: Extractor;   // name, files: JS_FILES, parses "tsx", signals(결정 1), appliesTo(결정 1)
  /** RN 키 분류 override(결정 1c). 없으면 undefined → 기본 분류 */
  export function classifyRnKey(key: string): StyleProperty | undefined;
  ```
  - 사용 생성(결정 1b): 객체 리터럴은 `usagesFromStyleObject(obj, { classify })`(`nested` 없음 — 결정 1b). 스프레드는 `SpreadElement`를 따로 처리(인자가 멤버 식이면 `ref.spread`를 단 `other` dynamic 1건, `Platform.select(...)` 호출이면 그 값 객체들을 재귀, 그 밖 무시). 멤버 식 값에는 inline-style과 같은 import 표로 `ref`
  - `tokenRef`는 결정 1d(JS 토큰만), `write`는 inline-style과 같은 WeakMap 패치 + `expression` 규칙
- [ ] **Step 1: 실패하는 테스트**
  - extract: 합성 스니펫마다 (property, raw, source, normalized) 단언 — `paddingHorizontal: 16` → padding 16px hardcoded, `marginStart: -4` → margin -4px, `borderTopLeftRadius: 6` → border-radius, `shadowColor: "#000"` → color, `elevation: 2`·`fontWeight: "700"`·`flex: 1` → other(unrated), `color: colors.text` → dynamic + `ref`, `...typography.caption` → other dynamic + `ref.spread`, `style={[styles.a, { gap: 4 }, on && { opacity: 0.5 }]}` → `styles.a` dynamic 1 + gap 4px + opacity other, `style={styles.a}` → dynamic other 1, `contentContainerStyle={{ padding: 12 }}` → padding, `Platform.select({ ios: { shadowColor: "#111" }, android: { elevation: 3 } })` 스프레드 → color 1, `StyleSheet.compose(styles.a, { margin: 2 })` → margin, `StyleSheet.hairlineWidth` → dynamic, `transform: [{ translateY: 4 }]` → other(재귀 안 함)
  - conformance(`runConformance`): 위 케이스 + write 왕복(숫자→`spacing.sm`, hex→`colors.surface`, 배열 안 객체, `Platform.select` 안 값), `"1px solid #000"` → ref 있음·write null 케이스는 `ref: null`이 아닌 별도 단위 테스트로
  - fixture `rn-app` 전체 extract 집계 스냅샷(합성이라 커밋 가능)
- [ ] **Step 2: 실패 확인 → 구현 → 통과**, `pnpm --filter @dsmith-dev/extractor-react-native test`, 루트 녹색. `pnpm pack --dry-run`(새 패키지)로 `dist`만 담기는지 확인
- [ ] **Step 3: Commit** — `feat(extractor-react-native): StyleSheet.create·style 배열·Platform.select를 읽는 RN Extractor(JS 토큰 식으로 치환)`

---

### Task 3: detect·audit·ai — RN 방식·JS 테마 감지, 토큰 사용 해석 연결, 파일형 로컬 DS

**Files:**
- Modify: `packages/detect/src/{detect-ds,detect-styling,index,store}.ts`, `packages/cli/src/commands/{audit,ai}.ts`, `packages/cli/src/report/*`(audit 리포트), `packages/catalog/src/{local,build,run,agents-section}.ts`, `packages/core/src/catalog/tokens.ts`(JS 토큰 파일 읽기)
- Test: `packages/detect/test/*`, `packages/cli/test/{audit,e2e}.test.ts`(+ `fixtures/rn-app` describe 추가), `packages/catalog/test/*`

**Interfaces:**
- Consumes: T1 `readJsThemeTokens`·`buildTokenRefResolver`·`JS_THEME_CANDIDATES`, T2 메타(signals), `moduleKeyOf`, `collectModuleContext`
- Produces:
  ```ts
  // detect
  export interface DsDetection { /* 기존 */
    /** 파일형 로컬 DS(`src/components/ui.tsx`). 있으면 dir = 확장자 뺀 module 키 */
    entry?: string;
    /** 결정 2a를 통과한 JS 테마 모듈(파일 경로순) */
    jsThemes?: { file: string; module: string; exports: string[]; importers: number }[];
  }
  // detect가 RN 방식 + framework react-native면 inline-style 제거, RN 방식 evidence에 "supersedes: inline-style"
  // audit: loadTokens(JS 포함) → buildTokenRefResolver → indexRepo({ resolveRef }) — 토큰 읽기를 인덱싱 앞으로(JS·CSS·JSON 토큰은 styles에 의존하지 않음, 제안 토큰 채움만 뒤에)
  // audit 리포트·JSON: `jsThemeRefs: number`(해석된 JS 토큰 사용 수), 리포트 한 줄 `JS 테마 참조: N개 (src/theme.ts)`
  // catalog: ds.entry면 그 파일만 컴포넌트 후보, readCatalogTokens가 JS 토큰 파일도 읽음(CatalogToken.js), 섹션 토큰 줄(결정 2g)
  // ai: ds none이어도 jsThemes가 있으면 토큰만 있는 카탈로그로 진행(오류 대신)
  ```
- [ ] **Step 1: 실패하는 테스트**
  - detect(`fixtures/rn-app` 복사): `framework react-native`, 방식 `react-native-stylesheet`만(inline-style 없음, evidence에 `supersedes: inline-style`), `activeExtractors ["react-native-stylesheet"]`, `ds { kind: "local", dir: "src/components/ui", entry: "src/components/ui.tsx", jsThemes: [{ file: "src/theme.ts", module: "src/theme", exports: [...], importers: ≥1 }] }`
  - 사용 증거: import되지 않은 `src/colors.ts`(토큰 모양) → jsThemes에 없음; `export const chartConfig` 모양 → 없음
  - 웹: `fixtures/inline-app` 등 7개 fixture의 detect 결과 불변(기존 테스트 무수정). legacy-demo detect에 `jsThemes [src/lib/theme.ts]`가 **추가**됨(필드 추가만)
  - audit(rn-app): rated > 0, `theme` 직접 참조가 token, `colors.mode[x]` dynamic, 스프레드는 font-size token, `style={styles.x}` dynamic other, health에 `(스타일 데이터 없음` 문구 없음, `dsImportShare > 0`
  - audit(legacy-demo, e2e 스냅샷): 결정 범위 안 차이만(Global Constraints 예측 수치와 일치)
  - ai(rn-app): 카탈로그 소스 `ds-local`(entry 파일의 PascalCase export만, `styles`·`colors` 같은 값 export 제외), 토큰 `colors.*` 등 `js` 필드, AGENTS.md DS 섹션 토큰 줄 문구(결정 2g), `SECTION_MAX_LINES` 이내
  - `git grep -n "ds\.dir"` 각 소비처에 entry 단위 테스트 1개 이상(Review Focus 4)
- [ ] **Step 2: 실패 확인 → 구현 → 통과** — 루트 녹색
- [ ] **Step 3: Commit** — 두 개: `feat(detect): react-native-stylesheet 방식·JS 테마 모듈(사용 증거)·파일형 로컬 DS 감지, RN에서 inline-style 대체` / `feat(cli,catalog): audit이 JS 테마 참조를 토큰 사용으로 세고, ai가 JS 토큰과 단일 파일 DS를 카탈로그에 싣음`

---

### Task 4: migrate·guard·ESLint·MCP — JS 토큰 치환과 import 추가, 표면 표현

**Files:**
- Create: `packages/migrate/src/imports.ts`, `packages/migrate/test/{imports,js-tokens}.test.ts`
- Modify: `packages/migrate/src/{components,plan,apply,verify,report}.ts`, `packages/core/src/guard/snapshot.ts`, `packages/guard/src/{snapshot,ci}.ts`, `packages/eslint-plugin/src/{analyze,rules/no-hardcoded-style}.ts`, `packages/mcp-server/src/tools/{resolve-token,lint-snippet}.ts`, `packages/mcp-server/src/workspace.ts`
- Test: 각 패키지 기존 테스트 + `packages/cli/test/e2e-migrate-guard.test.ts`에 rn-app 경로

**Interfaces:**
- Consumes: T1 `replacementCandidates`·`buildTokenRefResolver`·`jsTokenExpression`, `specifierForModule`, `loadModuleEnv`, core `patch/`
- Produces:
  ```ts
  // migrate/src/imports.ts — components.ts의 importLine·mergeTarget·지정자 계산을 옮김(컴포넌트 편집 동작·기존 테스트 불변)
  export interface ImportNeed { module: string; name: string; isPath: true }
  export type ImportPlan =
    | { kind: "present"; local: string }                       // 이미 값 import(별칭 포함)
    | { kind: "add"; local: string; patch: TextPatch }         // 기존 같은 module 선언에 합치거나 새 줄(마지막 import 뒤)
    | { kind: "conflict"; reason: string };                    // 같은 로컬 이름이 다른 바인딩
  export function planNamedImport(ctx: { file: string; code: string; tsPaths: TsPaths | null; moduleContext: ModuleContext }, need: ImportNeed): ImportPlan;

  // plan.ts
  export type TokenSkipReason = /* 기존 */ | "js-ref-in-string" | "js-binding-conflict";
  // 후보 토큰 = replacementCandidates(tokens, { framework: detect.framework.name }), usage마다 tokenRef !== null인 것 중 bestReplacement
  // JS 토큰 치환이 있는 파일: export별로 planNamedImport 한 번 → jsLocal 표 → tokenRef(ctx.jsLocal) → write(..., { expression: true })
  // FilePlan.imports: { module: string; name: string; local: string }[] (추가한 것만) — 요약 `import 추가 N개`
  // verify: 재추출에 같은 resolver(적용 뒤 import 포함)를 넘겨, 치환된 사용이 source "token"이 됐는지 확인
  // guard 스냅샷 tokens[].js(있을 때만), ESLint fixOf는 결정 2g, lint_snippet 제안은 replacementCandidates
  // MCP resolve_token: 입력이 알려진 JS 토큰 이름이면 그 토큰(거리 0), 응답 token.ref(결정 2g)
  ```
- [ ] **Step 1: 실패하는 테스트**
  - imports: 기존 named 선언에 합침(`import { spacing } from "../theme"` → `{ spacing, colors }`, 따옴표·세미콜론 보존), 새 줄 추가(마지막 import 뒤), 별칭 import 재사용(`colors as c` → `c.surface`), `import type { colors }`(또는 인라인 `type colors`)는 값 아님 → 그 import를 값 import로 바꾼다(선언의 `type`을 떼고 다른 지정자는 인라인 `type`으로 남김; 두 번째 선언을 더하지 않는다), 같은 이름 지역 변수 → conflict, namespace import(`import * as t`)가 있으면 `t.colors.surface`, tsconfig `@/*` 별칭 우선
  - migrate(rn-app 복사): 계획 → `planned > 0`, 치환 `ref`가 `colors.*`·`spacing.*`, 테마를 import하지 않던 파일에 import 1줄, `border` 축약 문자열은 `js-ref-in-string`, 모드 토큰 미사용; `--apply` → 재 audit에서 그 사용들이 token, 타입 검사 대신 `parseTsx` 무오류; `--revert` → 트리 해시(`.dsmith/` 제외) 동일
  - **웹 불변**: legacy-demo `audit → init --all → migrate` 계획이 main과 같은 28건(identical 26·exact 2), 치환 `ref` 전부 `var(--ds-…)`, import 편집 0
  - components.ts 기존 테스트 무수정 통과(이동 리팩터 검증)
  - ESLint(RuleTester): RN 파일에 hex → import 있으면 autofix `colors.surface`, 없으면 fix·suggest 없음 + 메시지에 import 안내; JS 토큰 없는 웹 스냅샷 동작 불변
  - guard: JS 토큰 없는 fixture의 `guard.json` 바이트 동일, rn-app은 `js` 필드 포함·두 번째 실행 바이트 동일
  - MCP: `resolve_token({ raw: "colors.surface" })` → 거리 0·`ref.kind "js"`·`import.module "src/theme"`, `resolve_token({ raw: "#ffffff" })`(rn-app) → JS 토큰 + ref; 웹 fixture 응답은 `ref.kind "css"`만 추가
- [ ] **Step 2: 실패 확인 → 구현 → 통과** — 루트 녹색
- [ ] **Step 3: Commit** — 두 개: `refactor(migrate): 컴포넌트 import 편집을 imports.ts로 분리(동작 불변)` / `feat(migrate,guard,eslint-plugin,mcp-server): JS 테마 토큰으로 치환(필요하면 import 추가)과 각 표면의 JS 토큰 표현`

---

### Task 5: init RN 분기 + 문서·changeset·릴리스 준비

**Files:**
- Modify: `packages/init/src/{run,report}.ts`, `packages/core/src/tokens/emit.ts`(`emitTokensTsRn`), `packages/cli/src/commands/init.ts`(요약 문구), `README.md`("지원하는 스타일링 방식" 표 행 + 패키지 목록 + RN 절), `packages/{init,migrate,detect}/README.md`, `packages/agent-skill/commands/{ds-init,ds-migrate}.md`(한 줄씩), `docs/release.md`(첫 게시 단락)
- Create: `.changeset/react-native.md`, `packages/init/test/react-native.test.ts`

**Interfaces:**
- Consumes: T3 `ds.jsThemes`, `detect.framework`, T1 `jsKeyOf`·`readJsThemeTokens`·`replacementCandidates`
- Produces:
  ```ts
  export interface InitResult { /* 기존 */
    /** 토큰의 출처. js-theme이면 토큰 파일을 쓰지 않았다 */
    tokenSource: { kind: "init-files" | "js-theme"; files: string[] };
  }
  // core emit.ts: RN 형식. 그룹 color→colors, space→spacing, radius→radius, text→fontSize, 숫자 값은 단위 없는 number
  export function emitTokensTsRn(draft: TokenDraft): string;
  ```
  - 동작은 "상황별 동작 — init" 표 그대로. `InitResult.tokens`·`coverage`는 js-theme일 때 그 테마 토큰으로 계산
- [ ] **Step 1: 실패하는 테스트**
  - rn-app(테마 있음) `init --all`: outcomes에 토큰 파일 없음, `tokenSource js-theme`, 스캐폴드 0 + 사유, 프리셋 null, 두 번째 실행도 쓰기 0
  - rn-app에서 `src/theme.ts`를 지운 사본: `design-system/tokens.ts`만, `readJsThemeTokens`로 다시 읽으면 초안과 (category, normalized) 집합 동일, 숫자 값이 number 리터럴, 이어서 `migrate` 계획이 그 토큰을 `ref "spacing[2]"`·`"colors.blue400"`로 씀
  - 이전 산출이 있는 RN 사본: `tokens.css` 그대로·경고 1개
  - 웹 fixture·legacy-demo init 산출 바이트 불변(기존 스냅샷)
- [ ] **Step 2: 문서** — README 표에 행 `| React Native | \`react-native-stylesheet\` | \`JS_FILES\` | \`StyleSheet.create\`·\`compose\`·\`flatten\` 인자, JSX \`style\`·\`*Style\`의 객체·배열·조건 가지, \`Platform.select\` 값 | 감지: \`react-native\` 의존성 또는 \`StyleSheet.create(\`. RN 프레임워크에서는 inline-style을 대신한다. 단위 없는 숫자 = dp(px), 치환은 JS 테마 참조(\`colors.surface\`)로만 |`, 그리고 "JS 테마 객체" 절(결정 2·2a·2d 요약, 웹에도 적용). init README "React Native" 절. changeset 본문: RN Extractor, JS 테마 토큰(웹 포함), RN init 동작, legacy-demo audit 수치 변화 한 줄, 새 패키지 이름. `pnpm changeset status`로 fixed 그룹 확인
- [ ] **Step 3: 전 구간** — `pnpm -r build && pnpm test && pnpm typecheck`
- [ ] **Step 4: Commit** — 두 개: `feat(init): React Native에서는 기존 JS 테마를 그대로 쓰고, 없으면 RN 형식 tokens.ts만 생성` / `docs,chore: React Native·JS 테마 토큰 안내, changeset, 새 패키지 첫 게시 절차`

---

### Task 6: 벤치마크 — `--repo knowing-saju`(외부)·`rn-app`, RN 프롬프트 12개, RN 독립 채점, 리댁션

**Files:**
- Create: `benchmarks/prompts-rn/{01-settings-list,02-confirm-sheet,03-history-list,04-summary-card,05-profile-form,06-status-badge,07-segmented-tabs,08-toast,09-empty-view,10-settings-screen,11-detail-screen,12-search-screen}.md`, `benchmarks/src/redact.ts`, `benchmarks/src/independent/rn.ts`, `benchmarks/test/{redact,independent-rn,external-repo}.test.ts`
- Modify: `benchmarks/src/{base,run,prompts,report,model,score}.ts`, `benchmarks/src/independent/{scan,score,types}.ts`, `benchmarks/README.md`, `benchmarks/.gitignore`(또는 루트 — 외부 레포 기본 산출 경로가 저장소 안에 생기지 않음을 문서화)

**Interfaces:**
- Consumes: T2 Extractor(이름표), T1 resolver(채점: 스냅샷 tokens + moduleContext로 `buildTokenRefResolver`), 기존 `prepareBase`·`prepareCondition`·`merge`
- Produces:
  ```ts
  // base.ts
  export const REPOS = {
    "legacy-demo": { kind: "builtin", dir: "examples/legacy-demo", prompts: "prompts" },
    "with-ds-app": { kind: "builtin", dir: "fixtures/with-ds-app", prompts: "prompts" },
    "rn-app": { kind: "builtin", dir: "fixtures/rn-app", prompts: "prompts-rn" },
    "knowing-saju": { kind: "external", env: "DSMITH_BENCH_REPO_PATH", prompts: "prompts-rn" },
  } as const;
  /** 외부 레포 복사 필터: node_modules, .git, ios, android, .expo, dist, build, .env*(.envrc 포함), *.p8|*.p12|*.keystore|*.jks|*.mobileprovision|*.pem|*.key, google-services.json, GoogleService-Info.plist, .dsmith */
  export function externalCopyFilter(src: string): boolean;
  // run.ts: --repo-path <dir>(env보다 우선). external이면 경로가 모노레포 밖·디렉터리·package.json 존재 확인, --out·--record 필수·모노레포 밖(아니면 종료 2)

  // redact.ts
  export interface RedactedResult { repo: string; date: string; mode: string; conditions: string[]; repeat: number; snapshotSha256: string;
    prompts: { id: string; file: string }[]; runs: { condition: string; prompt: string; rep: number; metrics: Record<string, number | null>; otherFiles: number }[];
    summary: unknown /* 기존 집계·통계 그대로(수치만) */ }
  export function redactResult(result: BenchResult): RedactedResult;
  // bench:report --redact --in <local.json> --out <md> [--summary-json <json>]

  // independent/types.ts: OccKind에 "themeRef", IndepCounts.themeRefs(웹은 0 — 기존 결과 수치 불변)
  // independent/rn.ts: 스타일 문맥 = StyleSheet.create/compose/flatten 인자, style·*Style 속성 값(객체·배열·조건·논리), 그 안의 스프레드·Platform.select
  //   (a) 색 문자열, (b) RN 길이 키(웹 목록 + paddingHorizontal/Vertical·marginHorizontal/Vertical·padding/margin Start/End/Top/…·borderRadius 변형·rowGap·columnGap)의 숫자, (f) themeRef
  //   themeRef = 로컬 module(상대·paths 별칭)에서 import한 바인딩으로 시작하는 멤버 식(계산 접근 포함)·스프레드, 단 그 module 파일이 객체 리터럴 export를 가질 때(독립 판정, 스냅샷 안 씀)
  //   indepUsage = (varDefined + themeRefs) / (varDefined + varUndefined + colorLiterals + lengthLiterals + tailwindPalette + themeRefs)
  ```
  - 프롬프트(모두 `이 앱 스타일로 `로 시작, 본문에 `file` 그대로, "다른 파일은 고치지 말고 그 파일 하나만 만드세요. 패키지 설치나 빌드·테스트 실행은 하지 마세요."로 끝남 — 웹 세트와 같은 꼬리):
    | id | file | 요청 |
    | --- | --- | --- |
    | 01-settings-list | `src/components/SettingsList.tsx` | 제목·설명·오른쪽 스위치 또는 화살표가 있는 설정 행 목록 |
    | 02-confirm-sheet | `src/components/ConfirmSheet.tsx` | 제목·본문·확인/취소 버튼이 있는 하단 확인 시트(Modal) |
    | 03-history-list | `src/components/HistoryList.tsx` | 아이콘·제목·부제·오른쪽 날짜가 있는 기록 목록(FlatList) |
    | 04-summary-card | `src/components/SummaryCard.tsx` | 제목·본문 두 줄·태그 칩 3개가 있는 요약 카드 |
    | 05-profile-form | `src/components/ProfileForm.tsx` | 이름·생년월일·시간 입력란과 저장 버튼이 있는 프로필 폼 |
    | 06-status-badge | `src/components/StatusBadge.tsx` | 성공·경고·위험·기본 네 가지 상태 배지 |
    | 07-segmented-tabs | `src/components/SegmentedTabs.tsx` | 선택 상태가 보이는 3칸 세그먼트 탭 |
    | 08-toast | `src/components/Toast.tsx` | 화면 아래에 뜨는 성공/오류 토스트 |
    | 09-empty-view | `src/components/EmptyView.tsx` | 아이콘·안내 문구·다시 시도 버튼이 있는 빈 상태 |
    | 10-settings-screen | `app/bench-settings.tsx` | 섹션 제목 2개와 설정 행들로 된 설정 화면 |
    | 11-detail-screen | `app/bench-detail.tsx` | 헤더·본문 카드·하단 고정 버튼이 있는 상세 화면 |
    | 12-search-screen | `app/bench-search.tsx` | 검색 입력과 결과 목록이 있는 검색 화면 |
- [ ] **Step 1: 실패하는 테스트**
  - prompts: `prompts-rn` 12개 파싱, id 정규식, `이 앱 스타일로 ` 시작, `app/bench-*.tsx`·`src/components/*.tsx`만, 웹 세트 sha 불변
  - independent-rn: 합성 산출(hex 2·숫자 길이 3·`colors.x` 4·스프레드 1·계산 접근 1) 정확 집계, 테마 import 없는 파일 themeRef 0, `independent-isolation.test.ts`가 새 파일도 검사(dsmith import 없음)
  - 웹 독립 채점 회귀: 기존 replay 세트 결과 수치 불변(themeRefs 0)
  - external-repo: env 없음 → 종료 2 + 안내, 모노레포 안 경로 → 종료 2, 복사 필터가 `.env.local`·`ios/`·`android/`·`node_modules/` 제외, `--out`이 모노레포 안이면 종료 2
  - rn-app replay 합성 세트(`benchmarks/replay/rn-app/`, 공개 합성 산출) 채점: dsmith 점수의 token에 JS 참조가 들어감, `knownToken`이 JS 토큰 이름을 셈
  - redact: 산출 md·json에 `/`를 포함한 경로 모양 문자열이 프롬프트 `file` 외에 없음, `colors.`·`spacing.` 접두 없음, finding 메시지·undefinedVars 없음, 같은 입력 두 번 바이트 동일
- [ ] **Step 2: 구현 → 통과**, README "React Native 벤치마크" 절: 실행법(`DSMITH_BENCH_REPO_PATH=… pnpm bench -- --repo knowing-saju --agent "claude -p" --out ~/bench/ks.json --record ~/bench/ks-out`), 리댁션 명령, 커밋 정책(결정 5a)
- [ ] **Step 3: Commit** — `feat(benchmarks): RN 프롬프트 12개·외부 레포(--repo-path)·rn-app 세트, 독립 채점 themeRef, 비공개 레포 결과 리댁션`

---

### Task 7: 최종 리뷰

- [ ] **Step 1: 리뷰어(새 세션)** — `git diff main...feat/react-native` 전체를 결정 표·Review Focus 1–6에 대조. 특히: `git grep -n "extractFileStyles("` 7곳 모두 resolver 전달(벤치 score 포함), `git grep -n "ds\.dir"` 소비처의 entry 처리, legacy-demo 계획 28건 테스트가 실제 main 값으로 고정됐는지, e2e 스냅샷 diff가 legacy-demo audit의 예측 수치뿐인지, `replacementCandidates` 밖에서 JS 토큰을 거르는 코드가 없는지, 새 패키지 `package.json`이 inline-style과 필드 집합이 같은지(`version 0.3.0`), **커밋 전체에 비공개 앱 내용이 없는지**(`git log -p main..feat/react-native`에서 사용자 앱 고유 이름·경로 검색 — 허용: 레포 이름 `knowing-saju`, 일반 export 이름 `colors/spacing/radius/typography`)
- [ ] **Step 2: 지적 반영** — 리뷰 기록 `.superpowers/sdd/react-native/final-review.md`(커밋하지 않음), 수정은 fix 커밋
- [ ] **Step 3: 완료 기준 확인** 아래 전부

## 이 계획에서 하지 않는 것

- styled-components·emotion 템플릿 안 `${theme.x}`·`({ theme }) => …` 참조 해석과 그 치환(템플릿 리터럴 변환), 문자열 일부를 템플릿으로 바꾸는 치환(`js-ref-in-string`)
- 재-export 따라가기(`ui.tsx`의 `export { colors }`를 통한 import) — 실제 앱에서 0건(부록 A.3)
- DTCG `typography` 복합 토큰, `fontWeight`·`lineHeight`·`shadow` 토큰
- RN용 컴포넌트 스캐폴드 템플릿, NativeWind(`className` on RN) 지원, `react-native-unistyles`·Tamagui·Restyle 테마
- `useColorScheme` 기반 모드 해석(모드 토큰은 치환 후보에서 빼기만)
- 타입 검사로 RN 산출 검증(복사본에 node_modules가 없음 — 기존 벤치 타입 검사 모드 그대로)

## 완료 기준

1. rn-app에서 `detect`가 `react-native-stylesheet`·jsThemes·파일형 DS를 내고 inline-style이 꺼짐
2. rn-app audit rated > 0, JS 테마 참조가 token, `style={styles.x}` 이중 계산 없음
3. rn-app `migrate --apply`가 JS 식으로 치환·import 추가, 재 audit 반영, `--revert` 해시 왕복
4. RN init이 테마 있으면 토큰 파일 0개, 없으면 RN `tokens.ts`만 — 왕복 일치
5. legacy-demo: migrate 계획 28건·init 산출 바이트 불변, audit 차이는 예측 수치
6. 벤치 `rn-app` replay 녹색, 외부 레포 가드·리댁션 테스트 녹색, 웹 결과 수치 불변
7. README 표 행·changeset minor·release.md 첫 게시 단락, 각 커밋 녹색

## 컨트롤러 확인 항목 (최종 리뷰 뒤 오케스트레이터가 직접)

1. **실제 앱 audit·migrate 계획(쓰기 없음)** — 사용자 앱 소스 사본(스크래치, 모노레포 밖)에 이 브랜치 dist로 `detect → audit → init --all --dry-run → ai --dry-run → migrate`(계획만). 부록 A.5의 예측과 대조해 집계만 기록: 방식·activeExtractors, `ds.kind/entry/jsThemes`, rated·token·hardcoded, health, init `tokenSource js-theme`·쓰기 0, migrate planned·identical·close·import 추가 수·건너뜀 사유. 사본에서 `--apply` → `--revert` 왕복 해시만 추가 확인(사용자 원본은 건드리지 않음)
2. **실제 앱 벤치마크** — `DSMITH_BENCH_REPO_PATH=<사본>`으로 `--repo knowing-saju --conditions baseline,dsmith --repeat 1`, `--out`·`--record`는 스크래치. `bench:report --redact`로 만든 md·summary.json만 `benchmarks/results/2026-11-xx-knowing-saju.*`로 커밋(별도 커밋 `bench: knowing-saju RN 결과(리댁션)`), 커밋 전 `git diff`에서 경로·토큰 이름 검색
3. **웹 회귀** — legacy-demo 전 구간(`audit → init --all → migrate --apply → guard init`)이 main 대비 audit 수치 외 동일

---

## 부록 A. 확인 기록 (2026-11-08, 이 세션에서 실제 실행)

환경: Node v22.23.4, main `dd3d488`를 `pnpm -r build`한 dist(`dsmith --version` → `0.3.0`; 빌드 전 dist는 2026-11-01 산출이라 다시 빌드함). 대상: 사용자 Expo 앱 소스 사본(`src/`·`app/`·설정 파일, node_modules·네이티브 디렉터리·비밀 없음)을 스크래치에 한 번 더 복사해 실행. `package.json`: Expo SDK 57 계열(expo·expo-router·react-native·react 모두 해당 SDK의 짝 버전), tsconfig `extends: "expo/tsconfig.base"`(paths 없음, import는 전부 상대 경로). 아래 경로는 일반화했고 코드 발췌는 없다.

### A.1 현재 dsmith가 보는 것 — 확인(main dist 실행)

`detect --json` (종료 0):
- `framework: { name: "react-native" }` — 이미 감지(`detect-framework.ts`: `react-native` 또는 `expo` 의존성)
- `styling.methods`: `inline-style` 하나(근거 `style={{ in app/<레이아웃>`, `src/components/<파일 2개>`, share 0.0299 = 4/134), `activeExtractors: ["inline-style"]`, `provisional: true`
- `ds: { kind: "none", tokenFiles: ["src/theme.ts"] }` — `TOKEN_FILES` glob이 테마 파일을 찾지만(`theme.ts`) `src/components/ui.tsx`는 디렉터리가 아니라 `LOCAL_DS_DIRS`에 걸리지 않음
- `lint: { tool: "eslint", configFile: "eslint.config.js" }`, `state: 0`

`audit --json` (종료 0, stderr `경고: (스타일 데이터 없음 — 참고용) 건강 점수: 70`):
- 분석 파일 134, `styleCount 601`, `dynamicCount 599`, `componentCount 1448`
- 분포: `dynamic|other` 593(대부분 `style={styles.x}` 587), `dynamic|color` 2, `dynamic|height/border-radius/background-color/width` 각 1, `hardcoded|other` 2(`1`, `700` — unrated). `style={[…]}` 56곳은 **사용 0**(inline-style이 배열을 보지 않음)
- `hardcoded.colors/spacing` 빈 목록, `health { score 70, hardcodedShare 0, dsImportShare 0, duplicateCount 0, rated 0 }`
- 컴포넌트 상위: `Text`(react-native) 467, UI 컴포넌트 A 147·B 141·C 93·D 69·E 68·F 65(모두 module `src/components/ui`), `View` 121, `Stack.Screen`(expo-router) 32
- 토큰: `loadTokens`가 `.ts`를 읽지 않아 `src/theme.ts`는 `ignored`

`init --all --dry-run --json` (종료 0): outcomes `design-system/tokens.json:created`, `tokens.css:created`, `tokens.ts:created`, 토큰 total 0, 커버리지 분모 0(`rate null`), 스캐폴드 0, `naming { ds, default }`, 프리셋 null → **빈 평행 토큰 파일 3개**를 만들려 함
`migrate --json` (종료 1): `오류: 치환할 토큰이 없음 — 먼저 \`dsmith init\`(토큰 초안) 또는 토큰 파일을 두세요`
`ai --dry-run --json` (종료 1): `오류: DS를 찾지 못함: detect.ds가 none이고 init 산출도 없음 — 먼저 \`dsmith init\``

현재 inline-style Extractor에 합성 RN 스니펫(StyleSheet.create + 스타일 배열 + compose, A.2 합성 프로브의 `comp`)을 넣으면 `extract` 결과 `[]`.

### A.2 RN 스타일 분포 — 확인(@babel/parser 7.29.12 프로브, 집계만)

프로브: 스크래치 `probe/rn-probe*.mjs`(저장소 밖). `src/`·`app/`의 `.ts/.tsx` 131개(테마 파일 제외), `parse(..., { sourceType: "module", plugins: ["jsx","typescript"]/["typescript"], errorRecovery: true })` → **파싱 오류 0**, 전체 0.97초.

- 호출: `StyleSheet.create` 44, `StyleSheet.flatten` 1, `StyleSheet.compose` 0, `StyleSheet.hairlineWidth` 3(값), `Platform.select` 0
- create 클래스 452개(객체 아님 1). 클래스 객체 값: 테마 멤버 `colors.*` 364·`spacing.*` 125·`radius.*` 36, 스프레드 `...typography.*` 225(그 밖 스프레드 2), 숫자 207, hex 문자열 8, 그 밖 문자열 189(`"row"`·`"center"` 등), 이항식 7, 배열 2(`transform`), 식별자 4, 중첩 객체 2
- 속성별(create): hex — color 6·background-color 1·other 1(`shadowColor` → 결정 1c), 숫자 — font-size 37·width 25·height 20·gap 10·margin 3·padding 2·border-radius 1·other 110, 테마 멤버 — color 257·background-color 65·gap 56·border-color 43·padding 39·border-radius 38·margin 24·other 6·width 1
- JSX: `style={MemberExpression}` 587, `style={[…]}` 56(원소: 멤버 66·`&&` 33·객체 18·식별자 13·조건 2), `style={cond ? … : …}` 11, `style={{…}}` 5, `style={식별자}` 4; 그 밖 `*Style` prop 5(`containerStyle` 2·`contentContainerStyle` 2·`labelStyle` 1). 인라인·배열 안 객체의 값: 계산 접근 `colors.<키>[x]` 10, 숫자 1, 테마 멤버 4
- 키 상위: `color` 268, `backgroundColor` 74, `gap` 68, `flex` 52, `fontWeight` 49, `borderRadius` 40, `borderColor` 39, `fontSize` 37, `width` 32, `padding` 19, `paddingVertical` 13, `paddingHorizontal` 9, `marginVertical` 4, `shadowColor/shadowOpacity/shadowRadius/elevation` 각 2
- 소스 grep: `className=` 0, 테마 import 47파일(지정자는 전부 상대 경로 `…/theme`, `ui` 재-export 경유 0), `import * as` 5(테마 아님)

합성 스니펫 AST 모양(그대로): 테마 `export const colors = {…} as const` → `VariableDeclarator.init` `TSAsExpression` > `ObjectExpression`; `as const` 없는 객체는 `ObjectExpression`; `export default {…}` → `ExportDefaultDeclaration` > `ObjectExpression`. 스타일 객체 속성: `Spread(MemberExpression)`, `color:MemberExpression`, `padding:MemberExpression`, `margin:NumericLiteral`, `borderColor:StringLiteral`, `Spread(CallExpression:Platform.select)`. `StyleSheet.compose(styles.a, {…})` 인자 `MemberExpression,ObjectExpression`. `style={[styles.a, {…}, cond && {…}]}` → `ArrayExpression` 원소 `MemberExpression,ObjectExpression,LogicalExpression`.

### A.3 테마 모듈 모양 — 확인(집계·일반화)

- 테마 파일 1개: `export const colors = {…} as const`(문자열 hex 15 + 다른 모듈 상수를 가리키는 키 1), `spacing`(숫자 6) `as const`, `radius`(숫자 4) `as const`, `typography`(7개 항목, 각 `{ fontSize: <숫자>, fontWeight: '<숫자>' as const, (lineHeight·letterSpacing 일부) }`, `as const` 없음)
- 다른 모듈 상수: `Readonly<Record<…, string>>` 타입의 hex 5개 객체(상대 import 한 단계 — 결정 2b로 해석 가능), 사용처는 계산 접근 10곳뿐
- 결정 2 규칙으로 읽히는 잎: 색 15(+2b로 5), 간격 6, 모서리 4, 글꼴 크기 7(`typography.*.fontSize`)
- 참조 수(grep, 테마 파일 제외): `colors.` 418, `spacing.` 192, `radius.` 39, `typography.` 225(합 874)

### A.4 웹 레포의 JS 테마 — 확인(legacy-demo, main dist)

- `examples/legacy-demo/src/lib/theme.ts`: `export const theme = { primary, primaryDark, danger, text, muted: "<hex>", radius: 6 }`(공개 저장소 파일). import 4곳 모두 `@/lib/theme`(tsconfig `@/*` → `./src/*`)
- 현재 audit(복사본, `.dsmith` 제거): `ds { kind: "local", dir: "src/components/ui", tokenFiles: ["src/lib/theme.ts"] }`, activeExtractors `tailwind, inline-style, css`, `health { score 52, hardcodedShare 0.3422, dsImportShare 0.0909, duplicateCount 2, rated 187 }`, dynamic 13, styleCount 213
- 테마 참조 사용 4건: `app/customers/page.tsx:22 color theme.muted`, `app/page.tsx:17 color theme.primary`, `src/components/Topbar.tsx:22 color theme.muted` — 모두 `dynamic`; `src/components/KpiCard.tsx:21 color up ? theme.primary : "#EF4444"` — 조건식(이 계획 뒤에도 dynamic)
- **예측**(이 계획 뒤): 앞의 3건이 token → rated 190, hardcoded 64 그대로 → hardcodedShare 64/190 = 0.3368, 점수 100×(0.5×0.6632 + 0.3×0.0909 + 0.2×0.8) = 51.9 → 52
- 현재 `init --all` 뒤 `migrate --json`: `planned 28`, `confidence { identical 26, exact 2, close 0 }`, `skipped { translucent-color 1, multi-value 1 }`, `tokens { source "token-file", count 14, files ["design-system/tokens.css", "design-system/tokens.json"] }`, 파일 14 — 결정 2d로 불변이어야 함

### A.5 실제 앱 예측(컨트롤러 1에서 대조)

- 방식 `react-native-stylesheet`만, `ds { kind "local", dir "src/components/ui", entry "src/components/ui.tsx", jsThemes [src/theme.ts: colors·spacing·radius·typography] }`
- rated 하드코딩(create 안): 색 8(color 6·background-color 1·`shadowColor` 1 — 결정 1c) + 길이 숫자 98(font-size 37·width 25·height 20·gap 10·margin 3·padding 2·radius 1); 인라인 1 추가 가능
- token: 테마 멤버 523(rated 속성) + 스프레드 font-size 225(typography 항목 7개 모두 fontSize 있음) → hardcodedShare ≈ 106/(106+748) ≈ 0.12
- migrate 치환 후보(width·height 제외 `COVERAGE_PROPERTIES`): hex 8 + 숫자 53. 그중 테마 값과 **정확히 같은 것** — color 5·font-size 5·radius 1·margin 1 = 12(프로브가 테마 값 집합과 비교한 수, 값 자체는 기록하지 않음). close(±2px 등)는 실행으로 확인
- 테마를 이미 import한 파일이 47개라 import 추가는 소수일 것

### A.6 기타 — 확인

- `npm view @dsmith-dev/extractor-react-native` → `404`(이름 비어 있음). `npm view @dsmith-dev/extractor-inline-style dist-tags` → `{ latest: '0.3.0' }`. RN·Expo의 해당 SDK 버전이 npm에 있음을 확인
- `.changeset/config.json` `fixed: [["dsmith", "@dsmith-dev/*"]]` — 새 패키지 자동 포함. 모든 패키지 `version 0.3.0`(17개). 대기 changeset: `real-repo-bugs.md`, `tw4-ds-prefix.md`
- `docs/release.md` 27행: 새 패키지 첫 게시에는 `NPM_TOKEN`이 "All packages" 권한 필요, 42행: trusted publishing은 패키지가 npm에 있어야 설정 가능
- 코드 읽기: `cssPropertyToStyleProperty`가 camelCase를 kebab으로 바꿔 `paddingHorizontal`→padding, `marginStart`→margin, `borderTopLeftRadius`→border-radius, `borderTopColor`→border-color, `shadowColor`→other. `COVERAGE_PROPERTIES`는 width·height 제외. `cssVarRef`는 `--` 이름만 → JS 이름 토큰에는 지금 모든 Extractor의 `tokenRef`가 null(그래서 CSS 계열은 결정 2d 필터 없이도 JS 토큰을 쓰지 못하고 `no-token-ref`만 는다). `extractFileStyles` 호출처 7곳: core indexer, migrate `plan`·`verify`, eslint-plugin `analyze`, guard `ci`, mcp `lint-snippet`, benchmarks `score`. `Extractor.write` 패치 구간은 Extractor 모듈 WeakMap(usage 객체 키) — 해석은 제자리 수정이어야 함
