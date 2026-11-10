# dsmith

## 0.6.0

### Minor Changes

- [#9](https://github.com/project-hh-org/dsmith/pull/9) [`9c14fe7`](https://github.com/project-hh-org/dsmith/commit/9c14fe7e59205d02d32cc6002e43d83b276735b0) Thanks [@dahee90522](https://github.com/dahee90522)! - Accuracy fixes. Translucent colors: normalized colors now carry `alpha` (only when < 1), so a translucent token such as `rgba(0,0,0,.5)` is no longer matched or suggested for an opaque value like `#000`, and translucent usages no longer inflate opaque color counts or leak into drafted tokens; W3C color tokens honor `alpha`. Multi-value shorthands: `padding: 8px 16px`, `margin: 0 16px` and similar now report every length operand (new `classifyDeclarationAll`; `classifyDeclaration` is unchanged), while migrate still skips them as `multi-value`. CSS Modules: new `css-modules` extractor analyzes `*.module.{css,scss}` with the same rules as plain CSS.

### Patch Changes

- Updated dependencies [[`9c14fe7`](https://github.com/project-hh-org/dsmith/commit/9c14fe7e59205d02d32cc6002e43d83b276735b0)]:
  - @dsmith-dev/extractor-api@0.6.0
  - @dsmith-dev/core@0.6.0
  - @dsmith-dev/extractor-css@0.6.0
  - @dsmith-dev/extractor-styled@0.6.0
  - @dsmith-dev/migrate@0.6.0
  - @dsmith-dev/catalog@0.6.0
  - @dsmith-dev/detect@0.6.0
  - @dsmith-dev/extractor-emotion@0.6.0
  - @dsmith-dev/extractor-inline-style@0.6.0
  - @dsmith-dev/extractor-mui-sx@0.6.0
  - @dsmith-dev/extractor-react-native@0.6.0
  - @dsmith-dev/extractor-tailwind@0.6.0
  - @dsmith-dev/guard@0.6.0
  - @dsmith-dev/init@0.6.0
  - @dsmith-dev/mcp-server@0.6.0
  - @dsmith-dev/agent-skill@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [[`54762c2`](https://github.com/project-hh-org/dsmith/commit/54762c253aed6215db885420ccaa1eca3f070e26)]:
  - @dsmith-dev/extractor-react-native@0.5.0
  - @dsmith-dev/core@0.5.0
  - @dsmith-dev/init@0.5.0
  - @dsmith-dev/agent-skill@0.5.0
  - @dsmith-dev/catalog@0.5.0
  - @dsmith-dev/detect@0.5.0
  - @dsmith-dev/extractor-css@0.5.0
  - @dsmith-dev/extractor-inline-style@0.5.0
  - @dsmith-dev/extractor-mui-sx@0.5.0
  - @dsmith-dev/extractor-styled@0.5.0
  - @dsmith-dev/extractor-tailwind@0.5.0
  - @dsmith-dev/guard@0.5.0
  - @dsmith-dev/mcp-server@0.5.0
  - @dsmith-dev/migrate@0.5.0
  - @dsmith-dev/extractor-emotion@0.5.0
  - @dsmith-dev/extractor-api@0.5.0

## 0.4.0

### Minor Changes

- [`d799040`](https://github.com/project-hh-org/dsmith/commit/d7990409af9763f1a567612f62eacb27a2704ebe) Thanks [@dahee90522](https://github.com/dahee90522)! - React Native(Expo) 앱에서 `detect → audit → init → ai → migrate → guard` 전 구간이 의미 있는 결과를 내게 한다. 새 패키지 `@dsmith-dev/extractor-react-native`(방식 이름 `react-native-stylesheet`)가 추가된다.
  
  - **RN Extractor**: `StyleSheet.create`·`compose`·`flatten` 인자, JSX `style`·`*Style`(`contentContainerStyle` 등)의 객체·배열 원소·`&&`/삼항 가지, `Platform.select` 값을 읽는다. 단위 없는 숫자는 dp(px)로 센다. `style={styles.x}`는 동적 값 한 건이고 정의(`create`)의 값만 점수에 들어가 이중 계산이 없다. 프레임워크가 React Native이면 `detect`가 `inline-style`을 대신 빼고(`overrides.activeExtractors`로 되돌릴 수 있음), `components/ui.tsx` 같은 파일 하나짜리 로컬 DS도 감지한다.
  - **JS 테마 토큰(웹 포함)**: 앱이 이미 가진 `export const colors = { … } as const` 모양의 JS 모듈(후보 파일 중 토큰 2개 이상이고 다른 파일이 import하는 것)을 토큰으로 읽는다(`ds.jsThemes`). `colors.surface`·`spacing.md`·`...typography.caption` 같은 테마 멤버 참조를 `audit`·`guard`·ESLint·MCP·벤치마크가 한 규칙으로 토큰 사용으로 센다. `migrate`는 React Native 레포에서 하드코딩 값을 `colors.surface`·`spacing[2]` 같은 테마 참조로 바꾸고 파일에 import가 없으면 더하며(`--revert`가 import까지 되돌림), 웹 레포는 CSS·W3C 토큰이 있으면 JS 테마 토큰을 참조 해석에만 쓴다. `light`/`dark` 모드 객체 아래 토큰은 치환 후보가 아니다. ESLint는 이미 그 export를 import한 파일에서만 자동 수정하고, MCP `resolve_token`은 `colors.surface`도 받아 `token.ref`(`css` | `js`)를 돌려준다.
  - **init (React Native)**: 쓰이는 JS 테마가 있으면 토큰 파일을 하나도 만들지 않고 그 테마로 토큰 수와 커버리지를 계산한다(`InitResult.tokenSource`가 `js-theme`). 테마가 없으면 RN 형식 `design-system/tokens.ts`(`export const colors/spacing/radius/fontSize = {…} as const`, 단위 없는 숫자)만 만든다. `tokens.css`·`tokens.json`·Tailwind 프리셋·웹 스캐폴드는 만들지 않으며, 이전 산출이 있으면 그대로 두고 경고한다. 웹 레포의 `init` 산출은 바이트까지 이전과 같다.
  - **audit 수치 변화(`examples/legacy-demo`)**: 웹 레포의 JS 테마(`src/lib/theme.ts`) 직접 참조 3건이 동적 값에서 토큰 사용으로 바뀌어 동적 값 13 → 10, hardcodedShare 0.3422 → 0.3368이 된다(점수 52 유지). `migrate` 계획 28건과 `init` 산출은 그대로다.
  - **새 패키지 첫 게시**: `@dsmith-dev/extractor-react-native`는 npm에 처음 올라가므로 `NPM_TOKEN`에 "All packages" 권한이 필요하다(`docs/release.md`의 "새 패키지의 첫 게시").

- [`748c7e3`](https://github.com/project-hh-org/dsmith/commit/748c7e37194ee1aa8a1dddac4e48d5288aead162) Thanks [@dahee90522](https://github.com/dahee90522)! - `dsmith init`이 새로 만드는 토큰의 CSS 변수 이름에 `--ds-` 접두를 붙인다(`--ds-color-blue-400`·`--ds-space-2`·`--ds-radius-sm`·`--ds-text-xs`).
  
  - **이유**: Tailwind 4 레포에서 접두 없는 `tokens.css`의 비레이어 `:root`가 Tailwind 기본 테마 변수(`--color-*`·`--text-*`·`--radius-*`)를 덮어, 기존 `bg-blue-400`·`text-xs`·`rounded-sm`의 값이 레포 전체에서 바뀌었다. Tailwind 4.3.3을 실제로 빌드하고 브라우저 계산값으로 확인했고, 접두가 있으면 기본 클래스가 Tailwind 값을 그대로 유지한다. 이 회귀는 실제 `compile()`을 도는 상시 테스트로 고정했다.
  - **DTCG 경로는 그대로**: `tokens.json`의 `color.blue-400` 경로, `tokens.ts` 키, Tailwind 클래스 키(`bg-ds-blue-400`)는 바뀌지 않고 CSS 변수 이름만 바뀐다. 루트 `$extensions["dev.dsmith"].cssPrefix: "ds"`가 접두를 알리고 `readW3cTokens`가 이를 반영한다. Tailwind 3 프리셋 값과 4 `@theme` 값은 새 이름을 가리킨다.
  - **이미 init한 레포는 그대로**: 커밋된 토큰 파일로 이름 형식을 판정해 이전 형식(접두 없음)을 유지하고, 같은 입력이면 바이트까지 같은 파일로 다시 만든다. Tailwind 4 레포가 이전 형식이면 충돌 경고(`--rename-prefix` 안내)를 낸다. migrate·guard·ESLint·MCP는 파일에서 읽은 이름을 그대로 쓰므로 이전 형식 레포의 동작이 바뀌지 않는다.
  - **`dsmith migrate --rename-prefix`**: 이전 형식에서 옮기는 명시적 명령. 기본은 계획만 출력하고, `--apply`가 코드의 `var(--color-…)` 참조(CSS·인라인 스타일·styled/emotion·sx·Tailwind 임의값)와 토큰·프리셋 파일을 함께 바꾸며(`--branch`·`--with-tokens` 지원), `--revert <id>`로 둘 다 되돌린다.
  - **재 init 보류**: migrate 적용 기록이 있는데 init 재실행으로 토큰의 값이 바뀌거나 사라지면(코드가 그 이름을 `var()`로 쓰는 경우) 토큰 묶음과 프리셋을 보류하고 `--force`로만 덮어쓴다. 접두만 바꾸는 rename은 대상이 아니다.
  - **글꼴 크기 판정**: `--ds-text-*`를 font-size로 읽는다.
  - 벤치마크: 베이스 스냅샷 sha256이 바뀌어 이전 결과와 새 실행은 `bench:report`의 병합이 거부한다(의도된 동작).

### Patch Changes

- [`cb9e130`](https://github.com/project-hh-org/dsmith/commit/cb9e130569ab2580ba3dc9156453bb4b36f4f1ab) Thanks [@dahee90522](https://github.com/dahee90522)! - 실제 레포 전 구간 실행에서 드러난 문제 여섯 가지를 고쳤다.
  
  - **migrate**: 대상 컴포넌트의 props를 읽지 못할 때(npm 패키지가 설치되지 않았거나 카탈로그에 props가 없음) 호출부 prop을 확인하지 않고 import만 바꾸던 문제. 이제 `children`·`className`·`style`·`key`·`ref`·`id`·`data-*`·`aria-*` 또는 `decide --map`에 나온 prop만 쓰는 호출이 아니면 새 사유 `target-props-unknown`으로 보류하고, 확인할 수 없는 prop 목록을 detail에 싣는다. props를 아는 대상의 동작은 그대로다.
  - **decide**: 이름만 같은 컴포넌트(npm DS와 사내 구현)의 `ds-module` 추천이 항상 `high`였던 문제. 관측 props의 겹침(Jaccard)이 0.5 미만이거나 한쪽 props만 알면 `medium`으로 낮추고 "이름만 같고 props가 달라 같은 컴포넌트인지 확인 필요" 안내(`recommendation.note`)를 붙인다. 사내 구현의 사용 수가 DS의 3배 이상이면 사용 수도 안내에 적는다.
  - **init / ai**: init 스캐폴드가 `function X()`로 props를 받지 않아 `ai`가 props를 0개로 읽던 문제. 스캐폴드가 `export function X(_props: XProps)`로 props 타입을 매개변수에 달아 `ai`가 읽을 수 있게 한다(구조 분해는 `noUnusedParameters`에서 컴파일 오류가 나서 쓰지 않는다). 사용자가 고친 스캐폴드는 이전처럼 덮어쓰지 않는다.
  - **audit**: init이 만든 `design-system/`(또는 `--out`으로 정한 디렉터리)까지 스캔해, init 뒤에 스캔 파일 수가 늘던 문제. migrate와 같은 init 산출 디렉터리를 인덱싱에서 뺀다. 토큰 파일 감지에는 그대로 쓰인다.
  - **토큰 이름**: `--color-gray-50`이 `#ffffff`이고 `--color-gray-50-2`·`--color-red-500-6`처럼 접미사가 붙던 문제. 같은 계열 안에서 OKLCH 밝기가 밝을수록 작은 단계를 받는다(25…975 사다리에 한 번에 배정, 표준 단계 50·100…900·950 우선, 한 계열이 39개를 넘을 때만 접미사). 순백·순흑은 `--color-white`·`--color-black`이다. 결정적이다. gray 판정 채도 상한도 밝기에 따라 달라져 어두운 slate는 gray, 연한 파랑(blue-50)은 blue로 남는다. init을 다시 실행하면 손대지 않은(managed) 토큰 파일은 새 이름으로 다시 쓰이고, 사용자가 고친 토큰 파일은 그대로 둔다. 이전 이름을 가리키는 `var()`·token-cluster 결정은 다시 확인해야 할 수 있다.
  - **migrate / decide 보완**: `--only components`에서 컴포넌트 편집만 있을 때 "치환할 것이 없음"이라고 하던 문제를 고쳤다("파일 N (컴포넌트만 N) · 토큰 치환 없음"). 대상 props를 모를 때 값 대응(`--map variant=a:variant=b`)만 있으면 대응에 없는 값(`variant="primary"`)도 `target-props-unknown`으로 보류한다. `ds-decide` 명령은 `recommendation.note`를 보여 주라고 안내한다.
  - **migrate 출력**: 사람용 계획 요약의 파일 수(14)가 `--json`의 `plan.files`(15)와 달랐던 문제. 컴포넌트 편집만 있는 파일도 세어 "파일 15 (토큰 14 · 컴포넌트만 1)"로 보인다.
- Updated dependencies []:
  - @dsmith-dev/agent-skill@0.4.0
  - @dsmith-dev/catalog@0.4.0
  - @dsmith-dev/core@0.4.0
  - @dsmith-dev/detect@0.4.0
  - @dsmith-dev/extractor-api@0.4.0
  - @dsmith-dev/extractor-css@0.4.0
  - @dsmith-dev/extractor-emotion@0.4.0
  - @dsmith-dev/extractor-inline-style@0.4.0
  - @dsmith-dev/extractor-mui-sx@0.4.0
  - @dsmith-dev/extractor-react-native@0.4.0
  - @dsmith-dev/extractor-styled@0.4.0
  - @dsmith-dev/extractor-tailwind@0.4.0
  - @dsmith-dev/guard@0.4.0
  - @dsmith-dev/init@0.4.0
  - @dsmith-dev/mcp-server@0.4.0
  - @dsmith-dev/migrate@0.4.0

## 0.3.0

### Minor Changes

- [`7c3580f`](https://github.com/project-hh-org/dsmith/commit/7c3580f09db405e67906c88fc83b1f6886d2219d) Thanks [@dahee90522](https://github.com/dahee90522)! - `dsmith install`의 기본을 AGENTS.md DS 섹션만으로 바꿈. MCP 서버 등록(`.mcp.json` 등)과 슬래시 명령(`.claude/skills` 등)은 `--mcp`·`--skills`로 따로 켠다(`--mcp-command`는 `--mcp`를 함께 켠다).
  
  - 근거: 같은 날 12개 프롬프트 × 3회 벤치마크에서 토큰 사용률 평균이 AGENTS.md DS 섹션만 있을 때 90.5%, MCP 서버를 더하면 78.0%(−12.5%p), 슬래시 명령까지 더하면 61.9%(−16.1%p)였다. MCP 도구 호출은 36회 실행 중 2~4회뿐이었고 줄어든 몫은 Tailwind 기본 스케일 클래스로 갔다. 자세한 것은 `benchmarks/results/2026-11-08-legacy-demo-sameday.md`.
  - 기본 `install`은 `dsmith ai`와 같은 경로로 AGENTS.md DS 섹션을 만든다. 분석 결과(`audit`)가 없으면 아무것도 쓰지 않고(첫 줄에 "아무것도 쓰지 않음", 종료 코드 0) "할 일"에 사유를 남긴다.
  - **이미 설치한 MCP·스킬 파일은 플래그 없이 다시 실행해도 지우지 않지만 갱신하지도 않는다.** 새 문구(아래 규칙 줄·AGENTS.md 참조)를 받으려면 `--mcp --skills`로 다시 실행한다. 요약은 "기존 MCP·슬래시 명령 파일은 그대로 둠(갱신하지 않음)"이라고 밝히고, `--json`의 `kept`에 그 파일 목록을 담는다. `.mcp.json`의 `dsmith@0.2` 고정은 그대로 남는다.
  - 요약의 `등록:` 줄은 이번 실행이 MCP·슬래시 명령을 AI 도구에 쓴 경우에만 나온다.
  - `--json` 출력에 `surfaces`(설치한 표면), `ds`(DS 섹션 결과), `kept`(갱신하지 않고 둔 이전 설치 파일)가 추가됐다. 기본 설치의 `outcomes`는 비어 있을 수 있다.
  - AGENTS.md DS 섹션의 규칙이 설치한 표면을 따른다. 기본은 "토큰 파일에서 가장 가까운 토큰을 찾는다 / `.dsmith/catalog.json`에서 props를 확인한다"로 설치 없이 되는 안내만 쓰고, MCP를 등록하면 `resolve_token`·`search_component`·`get_component`·`lint_snippet`을, 슬래시 명령까지 설치하면 `/ds-check`도 가리킨다. `install --mcp`·`--skills`는 DS 섹션을 다시 써서 이를 반영하고, `dsmith ai`는 디스크의 설치 상태(`.mcp.json`·설치 매니페스트·`.claude/skills`)를 읽어 같은 결과를 낸다. `renderAgentsDsSection`은 세 번째 인자로 설치한 표면을 받는다(생략하면 기본 문구).
  - `--mcp`만 켜면 AGENTS.md의 `dsmith` 블록에 슬래시 명령 표를 쓰지 않는다.
  - MCP 서버 `instructions`와 값을 찾아 주는 도구(`resolve_token`·`search_component`·`get_component`) 설명, `/ds`·`/ds-check`·`/ds-migrate` 본문이 "새 UI 코드는 AGENTS.md의 DS 규칙(디자인 토큰·DS 컴포넌트)을 따른다. 이 도구는 그 규칙에 맞는 토큰·컴포넌트를 찾을 때 쓴다."로 시작한다. 모든 레포에서 참이도록 `var(--…)`·Tailwind `ds-` 클래스를 가리키지 않는다. 나머지 도구 설명에는 반복하지 않아 `tools/list` 크기가 줄었다. 도구·명령 이름은 그대로다.
  - `dsmith ai`는 MCP 미등록 안내를 더 이상 출력하지 않고, 렌더러 `RenderContext`에 설치할 표면을 고르는 `include`가 생겼다.

### Patch Changes

- Updated dependencies [[`7c3580f`](https://github.com/project-hh-org/dsmith/commit/7c3580f09db405e67906c88fc83b1f6886d2219d)]:
  - @dsmith-dev/agent-skill@0.3.0
  - @dsmith-dev/catalog@0.3.0
  - @dsmith-dev/mcp-server@0.3.0
  - @dsmith-dev/core@0.3.0
  - @dsmith-dev/detect@0.3.0
  - @dsmith-dev/extractor-api@0.3.0
  - @dsmith-dev/extractor-css@0.3.0
  - @dsmith-dev/extractor-emotion@0.3.0
  - @dsmith-dev/extractor-inline-style@0.3.0
  - @dsmith-dev/extractor-mui-sx@0.3.0
  - @dsmith-dev/extractor-styled@0.3.0
  - @dsmith-dev/extractor-tailwind@0.3.0
  - @dsmith-dev/guard@0.3.0
  - @dsmith-dev/init@0.3.0
  - @dsmith-dev/migrate@0.3.0

## 0.2.1

### Patch Changes

- [`bd6c827`](https://github.com/project-hh-org/dsmith/commit/bd6c827a68d2053d09f1c9767721c50ccd082632) Thanks [@dahee90522](https://github.com/dahee90522)! - `dsmith --version` 지원, 릴리스 태그 push
- Updated dependencies []:
  - @dsmith-dev/agent-skill@0.2.1
  - @dsmith-dev/catalog@0.2.1
  - @dsmith-dev/core@0.2.1
  - @dsmith-dev/detect@0.2.1
  - @dsmith-dev/extractor-api@0.2.1
  - @dsmith-dev/extractor-css@0.2.1
  - @dsmith-dev/extractor-emotion@0.2.1
  - @dsmith-dev/extractor-inline-style@0.2.1
  - @dsmith-dev/extractor-mui-sx@0.2.1
  - @dsmith-dev/extractor-styled@0.2.1
  - @dsmith-dev/extractor-tailwind@0.2.1
  - @dsmith-dev/guard@0.2.1
  - @dsmith-dev/init@0.2.1
  - @dsmith-dev/mcp-server@0.2.1
  - @dsmith-dev/migrate@0.2.1

## 0.2.0

### Minor Changes

- [`2d716ee`](https://github.com/project-hh-org/dsmith/commit/2d716ee7c08e8f17e58509652041bb36499b48f5) Thanks [@dahee90522](https://github.com/dahee90522)! - AI 표면 추가: `dsmith install`(AI 도구 감지 → 슬래시 명령 8개와 MCP 서버 등록을 레포에 내려쓰기, `--dry-run`·`--force`·`--global`, 사용자가 고친 파일 보존), `dsmith mcp`(stdio MCP 서버), `dsmith decide`(중복·지역 재정의 컴포넌트 결정 카드와 기록). MCP 도구 6개: `resolve_token`, `lint_snippet`, `search_component`, `get_component`, `explain_decision`, `list_decisions`.

- [`f067062`](https://github.com/project-hh-org/dsmith/commit/f0670624f77e27da3e6947fb92b2f2b09d9f87be) Thanks [@dahee90522](https://github.com/dahee90522)! - DS 초안: `dsmith init`(W3C 토큰 초안·스캐폴드·커버리지), `dsmith ai`(컴포넌트 카탈로그·AGENTS.md DS 섹션), MCP가 카탈로그를 우선 사용.

- [`fe33b86`](https://github.com/project-hh-org/dsmith/commit/fe33b8669a0e11ca5275e507f4a683e78901219c) Thanks [@dahee90522](https://github.com/dahee90522)! - 적용·방어: `dsmith migrate`(토큰·결정 기반 컴포넌트 치환, 되돌리기, 브랜치 커밋), `dsmith guard`(ESLint 플러그인·PR 드리프트 검사), 규칙 엔진 공유.

### Patch Changes

- Updated dependencies [[`2d716ee`](https://github.com/project-hh-org/dsmith/commit/2d716ee7c08e8f17e58509652041bb36499b48f5), [`f067062`](https://github.com/project-hh-org/dsmith/commit/f0670624f77e27da3e6947fb92b2f2b09d9f87be), [`fe33b86`](https://github.com/project-hh-org/dsmith/commit/fe33b8669a0e11ca5275e507f4a683e78901219c)]:
  - @dsmith-dev/core@0.2.0
  - @dsmith-dev/detect@0.2.0
  - @dsmith-dev/mcp-server@0.2.0
  - @dsmith-dev/agent-skill@0.2.0
  - @dsmith-dev/init@0.2.0
  - @dsmith-dev/catalog@0.2.0
  - @dsmith-dev/extractor-api@0.2.0
  - @dsmith-dev/extractor-css@0.2.0
  - @dsmith-dev/extractor-emotion@0.2.0
  - @dsmith-dev/extractor-inline-style@0.2.0
  - @dsmith-dev/extractor-mui-sx@0.2.0
  - @dsmith-dev/extractor-styled@0.2.0
  - @dsmith-dev/extractor-tailwind@0.2.0
  - @dsmith-dev/migrate@0.2.0
  - @dsmith-dev/guard@0.2.0

## 0.1.0

### Minor Changes

- [#1](https://github.com/project-hh-org/dsmith/pull/1) [`c012770`](https://github.com/project-hh-org/dsmith/commit/c012770cbec9c8ea0f42d1895307abbc741dc2d1) Thanks [@dahee90522](https://github.com/dahee90522)! - 첫 공개 배포: detect·audit, Extractor 6종

### Patch Changes

- Updated dependencies [[`c012770`](https://github.com/project-hh-org/dsmith/commit/c012770cbec9c8ea0f42d1895307abbc741dc2d1)]:
  - @dsmith-dev/core@0.1.0
  - @dsmith-dev/detect@0.1.0
  - @dsmith-dev/extractor-api@0.1.0
  - @dsmith-dev/extractor-css@0.1.0
  - @dsmith-dev/extractor-emotion@0.1.0
  - @dsmith-dev/extractor-inline-style@0.1.0
  - @dsmith-dev/extractor-mui-sx@0.1.0
  - @dsmith-dev/extractor-styled@0.1.0
  - @dsmith-dev/extractor-tailwind@0.1.0
