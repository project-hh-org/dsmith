# dsmith-benchmarks (비공개)

같은 UI 생성 프롬프트 12개를 같은 에이전트에 두 조건으로 돌려, 만들어진 파일을 제품과 같은 규칙 엔진(`@dsmith-dev/core`의 `evaluateFile`)으로 채점한다.

- `baseline`: dsmith 연결 없음(`.dsmith/`·AGENTS.md DS 섹션·MCP·슬래시 명령 없음)
- `dsmith`: `install` + `ai` 완료 상태
- 두 조건 모두 `init --all`이 만든 `design-system/`(토큰·프리셋·Badge 스캐폴드, 파일 머리에 "dsmith init이 생성")를 갖고 있다. 의도된 설계이며 두 조건의 차이는 AGENTS.md DS 섹션·`.mcp.json`·`.dsmith/`·`.claude/skills`뿐이다. 스캐폴드 Badge 사용도 `dsComponentUses`로 센다.

이 패키지는 `private: true`이며 npm에 배포하지 않는다. 이름에 `@dsmith-dev/` 스코프를 쓰지 않아 changeset `fixed` 글롭에도 걸리지 않는다.

## 격리 (중요)

`benchmarks/`는 **에이전트가 보는 복사본에 들어가면 안 된다.** 채점 코드·프롬프트 정답 기준이 에이전트에 노출되면 결과가 오염된다. 실행기(Task 2)는 `examples/legacy-demo`·`fixtures/with-ds-app` 원본만 `os.tmpdir()` 아래(모노레포 밖)로 복사하며, 복사본에 `benchmarks/`가 없다는 것을 강제한다.

## 채점 기준(스냅샷)

`buildGuardSnapshot`은 DS 컴포넌트·DS module을 `.dsmith/catalog.json`에서 읽는다. `init --all`만 거친 베이스는 catalog가 없어 `ds.components`가 비고 `prefer-ds-component`가 늘 0이 된다. 그래서 채점용 스냅샷은 `audit → init --all → ai`를 거친 베이스에서 만든다(legacy-demo: 토큰 14, DS module 4, 컴포넌트 6). 테스트(`test/helpers.ts`의 `prepareDemoBase`)가 이 절차를 고정한다.

## 구성

- `prompts/*.md` — frontmatter(`id`, `file`) + 본문. 모두 `이 레포 스타일로 `로 시작한다.
- `src/score.ts` — 순수 채점 함수(파일시스템·프로세스 없음). 새로 생긴 사용·finding만 센다(추가 파일은 전부, 수정 파일은 base 대비 다중집합 차 — `guard --ci`와 같은 방식).
  - 토큰 준수율 = `token / (token + hardcoded)` (rated 사용, tailwind-default·dynamic 제외). 보고서·README 줄은 `12.5% (1/8)`처럼 분자/분모를 함께 쓴다. 변수·상수에 담은 className(`className={fieldClass}`)은 dynamic으로만 세며 분모에 들어가지 않는다 — dynamic이 많은 실행은 분모가 작아 준수율이 부풀려 보일 수 있으니 dynamic 열을 같이 본다
  - 토큰 사용률 = `token / (token + hardcoded + tailwindDefault)`
  - `knownToken`: 베이스의 토큰 이름·프리셋 키를 실제로 가리키는 token 사용
  - `nonDs`(prefer-ds-component), `deprecated`, `dsComponentUses`, `parseFailed`
- `src/report.ts` — 결과 JSON(`BenchResult`)을 결정적 마크다운(`renderReport`)과 README 한 줄(`readmeLine`)로 바꾼다. 숫자는 결과 JSON 값만 쓴다.

## 사용법

저장소 루트에서 실행한다(`pnpm -r build` 먼저).

```
pnpm bench --repo legacy-demo --agent "<에이전트 명령>"      # 실측: 프롬프트 × 조건 × 반복을 순차 실행 (--dry-run만 붙이면 계획만 출력)
pnpm bench:replay                                             # 산출물 재채점(합성 세트, 네트워크 없음)
pnpm bench --repo legacy-demo --replay benchmarks/results/<날짜>-legacy-demo/outputs   # 실측 산출물 재채점
pnpm bench:report --in benchmarks/results/<날짜>-legacy-demo.json   # 보고서 .md를 쓰고 README 줄을 출력
```

- `pnpm bench -- --repo …`처럼 `--`를 붙여도 같다(루트 스크립트가 끝에 `--`를 붙이므로 `-- --`로 들어오는데, 하네스가 `--`를 모두 무시한다).
- `--out`·`--record`·`--replay`·`bench:report --in/--out`의 상대 경로는 **명령을 실행한 폴더** 기준이다. pnpm이 cwd를 `benchmarks/`로 옮기므로 pnpm이 알려 주는 `INIT_CWD`를 쓴다(없으면 `process.cwd()`). `--replay-set <이름>`은 `benchmarks/replay/<이름>`을 가리킨다(`bench:replay`가 쓴다).
- 없는 `--replay` 폴더, 선택한 조건 폴더가 하나도 없는 폴더는 종료 코드 2와 메시지로 끝난다(전부 `missing`인 빈 보고서를 만들지 않는다).
- 중단 기준: `--max-total-usd <n>`(기본 8)을 넘거나 `--max-failures <n>`(기본 6)에 닿으면 새 실행을 시작하지 않고 `status: "aborted"` + `abortReason`으로 저장하고 종료 코드 1로 끝난다. 결과 JSON은 실행마다 임시 파일에 쓴 뒤 rename으로 갱신하며(중간 저장본도 `aborted`), 정상 종료하면 `complete`로 덮어쓴다. 중단된 결과는 보고서에 경고를 쓰고 README 줄을 만들지 않는다. 하네스가 한 실행을 처리하다 던진 예외는 그 실행을 `harness-error`(`error`에 메시지)로 기록하고 다음 실행을 계속한다.
- `bench:report`는 `--in`과 같은 이름의 `.md`를 쓴다(`--out`으로 바꿀 수 있다). README 줄은 stdout으로 나오고, 진행 메시지는 stderr로 나온다.
- README 줄은 baseline·dsmith 두 조건이 다 있고 `complete`인 `agent` 실행 결과에서만 만든다. `replay` 결과, 중단된 결과, 조건이 하나뿐인 결과는 보고서만 쓰고 줄을 만들지 않는다. 실제 실행의 결과 JSON을 나중에 다시 렌더링하는 것은 `agent` 모드 그대로라 줄이 나온다.
- 에이전트는 stdin으로 프롬프트를 받는 명령이면 된다. 두 조건에 같은 명령을 쓴다. 에이전트에는 PATH에서 모노레포 아래 항목(`benchmarks/node_modules/.bin`, 루트 `node_modules/.bin` 등)을 뺀 환경을 준다 — baseline에서 `dsmith`가 실행되지 않는다. `dsmith` 조건의 MCP 서버는 `.mcp.json`의 `node <절대 경로>/packages/cli/dist/bin.js`로 뜬다.
- stream-json이면 실행마다 `mcp__*` 도구 호출 수(`mcpToolCalls`)와 `permission_denials` 수를 세어 결과 JSON(`agentMeta`·`aggregate`)과 보고서(요약 행, 프롬프트별 `MCP/거부` 열)에 넣는다. dsmith 조건의 MCP 호출이 0이면 개선은 MCP 도구가 아니라 AGENTS.md와 탐색에서 나온 것이다.

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
