# dsmith-benchmarks (비공개)

같은 UI 생성 프롬프트 12개를 같은 에이전트에 조건별로 돌려, 만들어진 파일을 제품과 같은 규칙 엔진(`@dsmith-dev/core`의 `evaluateFile`)으로 채점한다. 기본은 `baseline`·`dsmith` 두 조건이고, `--conditions`로 AGENTS.md와 MCP의 효과를 따로 보는 2×2 분리 조건(`agents-only`·`mcp-only`)을 더할 수 있다.

## 조건

모든 조건은 `audit → init --all → ai`를 거친 같은 베이스에서 나온다. 조건별 복사본의 차이는 아래 네 경로뿐이고 나머지 파일은 네 복사본이 바이트까지 같다(`test/prepare.test.ts`가 파일 집합을 고정한다).

| 조건 | AGENTS.md DS 섹션 | `.mcp.json` (MCP 서버 `dsmith`) | `.claude/skills` (`/ds-*` 슬래시 명령·스킬) | `.dsmith/` (카탈로그·결정) |
| --- | --- | --- | --- | --- |
| `baseline` | 없음(섹션뿐이라 AGENTS.md 파일째 없음) | 없음 | 없음 | 없음 |
| `agents-only` | 있음 | 없음 | 없음 | 있음 |
| `mcp-only` | 없음(섹션뿐이라 AGENTS.md 파일째 없음) | 있음 | 없음 | 있음 |
| `agents-mcp` | 있음 | 있음 | 없음 | 있음 |
| `dsmith` | 있음 | 있음 | 있음 | 있음 |

- 만드는 법: `baseline`은 베이스에서 `.dsmith/`·`.mcp.json`·AGENTS.md의 dsmith 마커 블록을 지운다. `dsmith`는 베이스에 `install --tool <도구> --mcp --skills --mcp-command "node <CLI_BIN>"`을 한다(AGENTS.md DS 섹션은 베이스의 `ai`가 쓰고, `install`은 `--mcp`·`--skills`로 `.mcp.json`과 `.claude/skills`를 더한다. `install`의 기본은 AGENTS.md DS 섹션뿐이라 `dsmith` 조건은 두 플래그를 명시한다). `agents-only`와 `mcp-only`는 같은 `dsmith` 복사본에서 각각 `.mcp.json`·`.claude/skills`, 또는 AGENTS.md 섹션·`.claude/skills`를 지운 것이다(`.claude/`가 비면 그것도 지운다).
- `.dsmith/`는 AGENTS.md 섹션이 가리키는 곳이고 MCP 서버가 읽는 곳이라 `agents-only`·`mcp-only` 모두에 남긴다. `baseline`에는 없다.
- `.claude/skills`는 `dsmith`에만 있다. 그래서 `dsmith`와 단일 요소 조건의 차이(`dsmith − agents-only`, `dsmith − mcp-only`)에는 스킬이 섞인다. 스킬까지 따로 분리한 조건은 없다.
- 에이전트 명령은 네 조건이 같다(`--allowedTools mcp__dsmith` 포함 — 서버가 없으면 아무 일도 하지 않는다). `agents-only`의 AGENTS.md 섹션은 MCP 도구(`resolve_token`·`lint_snippet` 등)를 언급하지만 서버는 등록되지 않았다. `mcp-only`는 AGENTS.md 안내 없이 서버가 노출하는 도구 설명만 본다. 요약의 `MCP 도구 호출`로 확인한다: `agents-only`는 0이어야 한다.
- 모든 조건이 `init --all`이 만든 `design-system/`(토큰·프리셋·Badge 스캐폴드, 파일 머리에 "dsmith init이 생성")를 갖고 있다. 의도된 설계이며 스캐폴드 Badge 사용도 `dsComponentUses`로 센다.

이 패키지는 `private: true`이며 npm에 배포하지 않는다. 이름에 `@dsmith-dev/` 스코프를 쓰지 않아 changeset `fixed` 글롭에도 걸리지 않는다.

## 격리 (중요)

`benchmarks/`는 **에이전트가 보는 복사본에 들어가면 안 된다.** 채점 코드·프롬프트 정답 기준이 에이전트에 노출되면 결과가 오염된다. 실행기(`src/base.ts`·`src/run.ts`)는 `examples/legacy-demo`·`fixtures/with-ds-app` 원본만 `os.tmpdir()` 아래(모노레포 밖)로 복사하며, 복사본에 `benchmarks/`가 없다는 것을 강제한다.

## 채점 기준(스냅샷)

`buildGuardSnapshot`은 DS 컴포넌트·DS module을 `.dsmith/catalog.json`에서 읽는다. `init --all`만 거친 베이스는 catalog가 없어 `ds.components`가 비고 `prefer-ds-component`가 늘 0이 된다. 그래서 채점용 스냅샷은 `audit → init --all → ai`를 거친 베이스에서 만든다(legacy-demo: 토큰 14, DS module 4, 컴포넌트 6). 테스트(`test/helpers.ts`의 `prepareDemoBase`)가 이 절차를 고정한다.

## 구성

- `prompts/*.md` — frontmatter(`id`, `file`) + 본문. 모두 `이 레포 스타일로 `로 시작한다.
- `src/score.ts` — 순수 채점 함수(파일시스템·프로세스 없음). 새로 생긴 사용·finding만 센다(추가 파일은 전부, 수정 파일은 base 대비 다중집합 차 — `guard --ci`와 같은 방식).
  - 토큰 준수율 = `token / (token + hardcoded)` (rated 사용, tailwind-default·dynamic 제외). 보고서·README 줄은 `12.5% (1/8)`처럼 분자/분모를 함께 쓴다. 변수·상수에 담은 className(`className={fieldClass}`)은 dynamic으로만 세며 분모에 들어가지 않는다 — dynamic이 많은 실행은 분모가 작아 준수율이 부풀려 보일 수 있으니 dynamic 열을 같이 본다
  - 토큰 사용률 = `token / (token + hardcoded + tailwindDefault)`
  - `knownToken`: 베이스의 토큰 이름·프리셋 키를 실제로 가리키는 token 사용
  - `nonDs`(prefer-ds-component), `deprecated`, `dsComponentUses`, `parseFailed`
- `src/report.ts` — 결과 JSON(`BenchResult`)을 결정적 마크다운(`renderReport`)과 README 한 줄(`readmeLine`)로 바꾼다. 숫자는 결과 JSON 값만 쓴다. 반복·대응 비교·독립 채점 절은 `src/sections.ts`, 그 계산은 `src/analysis.ts`(순수 함수), 수치 함수는 `src/stats.ts`.
- `src/merge.ts` — 서로 다른 실행의 결과 JSON을 병합(`mergeResults`): 같은 레포·스냅샷·프롬프트·에이전트 명령일 때만, 입력별 출처를 `merged`에 남긴다.
- `src/stats.ts` — 평균·최소·최대, 양쪽 정확 이항 부호 검정(0 차이는 버림), 평균 차이의 95% 부트스트랩 CI(프롬프트 단위 복원추출 10,000회, `mulberry32` 시드 20261107 고정 → 결정적), 스피어만 ρ. 손으로 계산한 값으로 테스트한다(`test/stats.test.ts`).
- `src/independent/` — **dsmith와 독립인 채점기와 타입 검사.** `@dsmith-dev/*`도 이 저장소의 다른 워크스페이스 코드도 import하지 않는다(`test/independent-isolation.test.ts`가 import 지정자를 검사). 쓰는 것은 `@babel/parser`·`postcss`·`typescript`뿐이고 `.dsmith/guard.json`의 `ds.modules`는 일반 JSON 데이터로만 읽는다(하네스는 스냅샷의 같은 값을 넘긴다).

### 반복·통계 (`--repeat k`)

- 한 줄 요약: 프롬프트(N=12)를 단위로, 프롬프트마다 반복 평균을 낸 뒤 (dsmith − baseline)을 대응시킨다.
- 실행 하나의 지표: 준수율·토큰 사용률·독립 사용률(합계 비율, 분모 0이면 값 없음), `nonDs`, DS 컴포넌트 사용, 타입 오류.
- 프롬프트 × 조건: 반복별 값의 평균·최소–최대(값 없는 반복은 뺀다). 조건 × 반복: 같은 반복 번호의 프롬프트 합계로 비율을 다시 구한 뒤 반복 사이의 평균·최소–최대.
- 대응 비교: 토큰 사용률·`nonDs`·DS 사용·독립 사용률에 부호 검정(양쪽 정확 p, 0 차이 제외), 토큰 사용률·독립 사용률에는 평균 차이의 95% 부트스트랩 CI. 어느 한쪽이 분모 0인 프롬프트는 사용률 비교에서 뺀다.
- README 줄: 반복이 2회 이상이면 `토큰 사용률 평균 X% → Y% (차이 +Z%p, 95% CI [a, b], 부호 검정 p=…)`, 1회면 기존 형식 그대로.
- 12개 프롬프트의 부호 검정은 프롬프트 사이의 일관성을, 반복은 에이전트의 실행 간 변동을 본다. 둘은 다른 불확실성이라 반복을 늘려도 프롬프트 수(N)가 늘지는 않는다.

### 독립 채점 (`src/independent/`)

바뀐 `.tsx/.ts/.jsx/.js/.css`(추가·수정)만, **에이전트가 새로 만든 등장만** 센다. 수정 파일은 before와 after에서 같은 방식으로 뽑은 등장의 (종류, 값) 다중집합을 비교한다(위치는 보지 않음; before가 없거나 파싱 안 되면 등장 없음). `design-system/`(init 스캐폴드)과 `node_modules`·`.git`·`.dsmith`·`.claude`·`.next`·`dist`는 채점하지 않는다.

| 종류 | 세는 것 | 어디서 |
| --- | --- | --- |
| (a) 색 리터럴 | hex 3·4·6·8자리, `rgb()·rgba()·hsl()·hsla()·oklch()`, CSS 이름 색 147개 | 스타일 문맥의 문자열, 클래스의 임의 값(`bg-[#fff]`), CSS-in-JS 템플릿, `.css` 선언, SVG 색 속성 |
| (b) 길이 리터럴 | `px`·`rem`(0 제외), 스타일 객체의 숫자 길이 속성(`padding: 16` → 16px) | 같음 |
| (c) Tailwind 팔레트·스케일 | `bg-blue-500`, `p-4`, `text-sm`, `rounded-md`, `shadow-md`, `border-2` … 고정 정규식 11종(`src/independent/tailwind.ts`의 `PALETTE_PATTERNS`) | 클래스 문맥 |
| (d) `var(--name)` | 복사본의 모든 `.css`가 `--name:`을 선언했으면 defined, 아니면 undefined. 프리셋·설정의 `키: "var(--x)"`로 풀리는 테마 키 클래스(`gap-ds-4`)도 var 참조로 센다 | 스타일·클래스 문맥, `.css` 값 |
| (e) 컴포넌트 | JSX 요소의 import가 DS 모듈(스냅샷 `ds.modules`)로 풀리면 DS, 다른 로컬 경로(상대·`paths` 별칭)로 풀리면 other-local | JSX |

- 어느 문자열을 보는가: 클래스 문맥(`className`/`class` 속성, `clsx`·`cn`·`cva` 등의 인자, `className`에 식별자로 쓰인 변수의 초기값), 스타일 문맥(`style`/`sx` 속성, `style`에 쓰인 변수의 초기값, `css()` 인자), CSS 템플릿(`styled.x`·`css`·`keyframes`). 사용자 문구("Order #123")는 보지 않는다.
- 독립 사용률 = `defined var / (defined var + undefined var + 색 + 길이 + Tailwind 팔레트)`. 분모 0이면 값 없음.
- `--custom: 값;` 선언의 값은 리터럴로 세지 않는다(토큰 정의라서). 에이전트가 자기 CSS에서 새로 선언한 변수는 defined가 된다.
- 알려진 빈틈: 정규식·AST 휴리스틱이라 문맥을 못 잡는 문자열(함수가 반환하는 클래스 문자열 등)은 놓친다. dsmith 점수와 어긋나는 곳이 곧 오류는 아니다 — 보고서의 `### 일치도`가 방향 일치(프롬프트별)와 스피어만 ρ(실행별)를 밝힌다.

### 타입 검사 (`src/independent/typecheck.ts`)

바뀐 `.ts/.tsx/.js/.jsx`만 `ts.createProgram`으로 구문·의미 검사한다(복사본 tsconfig의 옵션 + `noEmit`·`skipLibCheck`). 진단 중 위치가 바뀐 파일 안인 것만 `typeErrors`로 센다. 에이전트 실행은 `--keep` 여부와 상관없이 복사본을 지우기 **전에** 채점·검사를 끝낸다(replay는 베이스 + 산출물 덮어쓰기).

- 잡는 것: 구문 오류, 없는 로컬 모듈·없는 export, 로컬 컴포넌트(함수 선언) props 불일치, 타입 불일치, 정의되지 않은 이름.
- 못 잡는 것: 복사본에는 `node_modules`가 없어 react·next·clsx 등 외부 패키지 타입을 못 푼다. 그래서 모드가 항상 `구문·의미 검사(의존성 타입 없이)`로 기록된다. 풀리지 않는 패키지는 쓰인 이름만 any로 가짜 선언하고(`stubs.ts`; 상속하는 타입은 인덱스 시그니처), JSX 내장 요소는 `IntrinsicElements`를 any로 둔다. 외부 API 오용, JSX 내장 요소 속성 오타, `React.FC<P>`로 선언한 컴포넌트의 props는 검사 밖이다. any 때문에 생기는 `implicitly has an 'any'`(문맥 타입이 any인 콜백 매개변수)·`process` 못 찾음·any 함수의 타입 인자 진단은 세지 않는다.
- `node_modules/react`가 풀리는 환경이면 아무것도 가리지 않고 `타입 검사`로 기록한다. 아무것도 설치하지 않고, 네트워크를 쓰지 않는다.
- 토큰 정의 확인은 (d)의 undefined var 수(`undefinedVars`)다. "`tokens.css`가 실제로 로드되는가"는 렌더링을 하지 않아서 확인하지 못한다.

## 사용법

저장소 루트에서 실행한다(`pnpm -r build` 먼저).

```
pnpm bench --repo legacy-demo --agent "<에이전트 명령>"      # 실측: 프롬프트 × 조건 × 반복을 순차 실행 (--dry-run만 붙이면 계획만 출력)
pnpm bench:replay                                             # 산출물 재채점(합성 세트, 네트워크 없음)
pnpm bench --repo legacy-demo --replay benchmarks/results/<날짜>-legacy-demo/outputs   # 실측 산출물 재채점
pnpm bench:report --in benchmarks/results/<날짜>-legacy-demo.json   # 보고서 .md를 쓰고 README 줄을 출력
pnpm bench --repo legacy-demo --conditions agents-only,mcp-only --repeat 3 --agent "claude -p"   # 2×2 분리: 나머지 두 조건만 실측 (--dry-run: 72회)
pnpm bench:report --in a.json --in b.json --out benchmarks/results/<이름>.md   # 서로 다른 실행의 조건을 병합
```

- `pnpm bench -- --repo …`처럼 `--`를 붙여도 같다(루트 스크립트가 끝에 `--`를 붙이므로 `-- --`로 들어오는데, 하네스가 `--`를 모두 무시한다).
- `--out`·`--record`·`--replay`·`bench:report --in/--out`의 상대 경로는 **명령을 실행한 폴더** 기준이다. pnpm이 cwd를 `benchmarks/`로 옮기므로 pnpm이 알려 주는 `INIT_CWD`를 쓴다(없으면 `process.cwd()`). `--replay-set <이름>`은 `benchmarks/replay/<이름>`을 가리킨다(`bench:replay`가 쓴다).
- 없는 `--replay` 폴더, 선택한 조건 폴더가 하나도 없는 폴더는 종료 코드 2와 메시지로 끝난다(전부 `missing`인 빈 보고서를 만들지 않는다).
- 반복: `--repeat 3`이면 12 × 2 × 3 = 72회다. `--dry-run`은 `예상 비용: 실행 72회 × ~$0.075 ≈ $5.4`(24회 실측 평균 $0.075/회)와 중단 기준을 먼저 보여 준다.
- 중단 기준: `--max-total-usd <n>`을 넘거나 `--max-failures <n>`에 닿으면(기본값은 실행 수에 맞춰 늘어난다 — 비용 `max(8, ceil(추정 비용 × 1.5))`: 24회 $8·72회 $9, 실패 `max(6, ceil(실행 수 / 8))`: 24회 6·72회 9. 명시한 값은 그대로 쓴다) 새 실행을 시작하지 않고 `status: "aborted"` + `abortReason`으로 저장하고 종료 코드 1로 끝난다. 결과 JSON은 실행마다 임시 파일에 쓴 뒤 rename으로 갱신하며(중간 저장본도 `aborted`), 정상 종료하면 `complete`로 덮어쓴다. 중단된 결과는 보고서에 경고를 쓰고 README 줄을 만들지 않는다. 하네스가 한 실행을 처리하다 던진 예외는 그 실행을 `harness-error`(`error`에 메시지)로 기록하고 다음 실행을 계속한다.
- `bench:report`는 `--in`과 같은 이름의 `.md`를 쓴다(`--out`으로 바꿀 수 있다). README 줄은 stdout으로 나오고, 진행 메시지는 stderr로 나온다. 이 줄은 루트 README의 `<!-- bench:line -->` 아래 줄과 글자 그대로 같고(손으로 고치지 않고 붙여 넣는다), 링크는 모노레포 루트 기준 상대 경로다(`--out`이 모노레포 밖이면 파일 이름만 쓰고 stderr에 경고한다). 보고서의 재현 명령은 `--in` 이름에서 따온 `<이름>/outputs`를 가리킨다.
- README 줄은 baseline·dsmith 두 조건이 다 있고 `complete`인 `agent` 실행 결과에서만 만든다. `replay` 결과, 중단된 결과, 조건이 하나뿐인 결과는 보고서만 쓰고 줄을 만들지 않는다. 실제 실행의 결과 JSON을 나중에 다시 렌더링하는 것은 `agent` 모드 그대로라 줄이 나온다.
- `--conditions`의 기본은 `baseline,dsmith`다(replay도 마찬가지). 값은 `baseline`·`agents-only`·`mcp-only`·`dsmith` 중 쉼표로 고르고 표시 순서는 이 순서로 고정된다.
- 조건이 셋 이상이면 보고서의 조건 열이 조건 수만큼 늘고(요약·프롬프트별·반복 통계·독립 채점), `## 대응 비교`·`## 독립 채점`은 쌍마다 같은 통계(평균 차이·부호 검정·부트스트랩 CI·t 구간)를 낸다: `baseline` 대비 존재하는 각 조건, 그리고 `dsmith` 대비 `agents-only`·`mcp-only`(차이 = 비교 − 기준; `dsmith − agents-only`는 MCP·스킬을 더한 효과, `dsmith − mcp-only`는 AGENTS.md 섹션·스킬을 더한 효과). 조건별 MCP 도구 호출 수는 요약의 `MCP 도구 호출` 행과 프롬프트별 `MCP/거부` 열에 나온다. `baseline`·`dsmith`만 있는 결과는 형식이 바뀌지 않는다(`test/ablation.test.ts`가 커밋된 k3·k1 결과 JSON을 다시 렌더링해 커밋된 md와 글자 그대로 같은지 확인한다).
- 병합: `bench:report --in a.json --in b.json … --out <보고서.md>`(`--out` 필수)는 실행이 다른 결과를 하나의 보고서로 합친다. 같은 레포·베이스 스냅샷 sha256(과 토큰·DS 컴포넌트 수)·프롬프트 집합(id·파일·sha256)·에이전트 명령(플래그)·install 도구·반복 수여야 하고, 아니면 어떤 필드가 다른지 적은 오류로 거부한다(파일은 쓰지 않는다). 실측(`agent`)이 아니거나 중단된 입력, 같은 조건이 두 입력에 있는 경우도 거부한다. 실행마다 조건 복사본의 `setupFingerprint`(AGENTS.md DS 섹션 텍스트·`.mcp.json`(절대 경로 정규화)·`.claude/skills/**`·복사본에서 띄운 MCP 서버의 `instructions`와 `tools/list` 설명의 sha256)를 결과에 남기고, 병합은 둘 이상의 입력이 가진 부분이 서로 다르면 어느 조건·파일이 다른지 적어 거부한다(제품 문구가 바뀐 빌드의 결과를 옛 결과와 한 2×2로 합치지 않기 위해서다). 지문이 없는 옛 결과는 옛 결과끼리만 병합되고, 지문이 있는 결과와는 섞이지 않는다. 날짜·에이전트 버전·dsmith 버전과 커밋·관측 모델은 (설정 지문이 같다면) 달라도 되고, 달라지면 `## 해석 한계`에 `조건별 측정일이 다름: …`으로 입력별 값을 적는다. 병합 결과 JSON(`merged`에 입력별 출처)은 보고서 옆에 같은 이름의 `.json`으로 쓰며, 이를 `--in`으로 다시 주면 같은 보고서가 나온다.
- 병합 보고서의 README 줄은 기존 2조건 줄 대신 2×2 줄이다: `MCP·AGENTS.md 분리(…): 사용률 평균 baseline X% · agents-only Y% · mcp-only Z% · 둘 다 W%`(토큰 사용률, 프롬프트별 반복 평균의 평균). 네 조건이 모두 있는 `complete`한 agent 결과에서만 만든다. 기존 줄 생성기는 `baseline`·`dsmith` 두 조건 결과에만 쓴다.
- 에이전트는 stdin으로 프롬프트를 받는 명령이면 된다. 두 조건에 같은 명령을 쓴다. 에이전트에는 PATH에서 모노레포 아래 항목(`benchmarks/node_modules/.bin`, 루트 `node_modules/.bin` 등)을 뺀 환경을 준다 — baseline에서 `dsmith`가 실행되지 않는다. `dsmith` 조건의 MCP 서버는 `.mcp.json`의 `node <절대 경로>/packages/cli/dist/bin.js`로 뜬다.
- stream-json이면 실행마다 `mcp__*` 도구 호출 수(`mcpToolCalls`)와 `permission_denials` 수를 세어 결과 JSON(`agentMeta`·`aggregate`)과 보고서(요약 행, 프롬프트별 `MCP/거부` 열)에 넣는다. dsmith 조건의 MCP 호출이 0이면 개선은 MCP 도구가 아니라 AGENTS.md·`.claude/skills`·`.dsmith/` 파일과 탐색에서 나온 것이다.

## 결과 폴더 구조

```
results/
  <날짜>-<레포>.json            결과(BenchResult): 설정, 실행별 점수, 조건별 집계
  <날짜>-<레포>.md              bench:report가 쓴 보고서
  <날짜>-<레포>/outputs/        에이전트가 바꾼 파일 전체(replay와 같은 배치) — 커밋해서 재채점에 쓴다
    <조건>/<프롬프트 id>/<반복>/files/…, run.json
  <날짜>-<레포>/transcripts/    에이전트 출력 기록(gitignore)
```

`outputs/`를 `--replay`로 다시 채점하면 커밋된 JSON과 같은 숫자가 나와야 한다. 보고서의 숫자는 JSON에 없는 값을 쓰지 않는다. `outputs/meta.json`(`{"source": "agent", …}`)이 산출물의 출처를 기록하고, replay 보고서는 이를 읽어 "실제 에이전트 산출물의 재채점"으로 표시한다. `replay/`의 산출물은 손으로 쓴 합성(`meta.json`의 `source: "synthetic"`)이고 README 숫자에 쓰지 않는다. `meta.json`이 없는 폴더는 출처 미상으로 표시한다.
