# @dsmith-dev/agent-skill

## 0.4.0

### Patch Changes

- Updated dependencies []:
  - @dsmith-dev/core@0.4.0

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

- Updated dependencies []:
  - @dsmith-dev/core@0.3.0

## 0.2.1

### Patch Changes

- Updated dependencies []:
  - @dsmith-dev/core@0.2.1

## 0.2.0

### Minor Changes

- [`2d716ee`](https://github.com/project-hh-org/dsmith/commit/2d716ee7c08e8f17e58509652041bb36499b48f5) Thanks [@dahee90522](https://github.com/dahee90522)! - AI 표면 추가: `dsmith install`(AI 도구 감지 → 슬래시 명령 8개와 MCP 서버 등록을 레포에 내려쓰기, `--dry-run`·`--force`·`--global`, 사용자가 고친 파일 보존), `dsmith mcp`(stdio MCP 서버), `dsmith decide`(중복·지역 재정의 컴포넌트 결정 카드와 기록). MCP 도구 6개: `resolve_token`, `lint_snippet`, `search_component`, `get_component`, `explain_decision`, `list_decisions`.

- [`f067062`](https://github.com/project-hh-org/dsmith/commit/f0670624f77e27da3e6947fb92b2f2b09d9f87be) Thanks [@dahee90522](https://github.com/dahee90522)! - DS 초안: `dsmith init`(W3C 토큰 초안·스캐폴드·커버리지), `dsmith ai`(컴포넌트 카탈로그·AGENTS.md DS 섹션), MCP가 카탈로그를 우선 사용.

- [`fe33b86`](https://github.com/project-hh-org/dsmith/commit/fe33b8669a0e11ca5275e507f4a683e78901219c) Thanks [@dahee90522](https://github.com/dahee90522)! - 적용·방어: `dsmith migrate`(토큰·결정 기반 컴포넌트 치환, 되돌리기, 브랜치 커밋), `dsmith guard`(ESLint 플러그인·PR 드리프트 검사), 규칙 엔진 공유.

### Patch Changes

- Updated dependencies [[`2d716ee`](https://github.com/project-hh-org/dsmith/commit/2d716ee7c08e8f17e58509652041bb36499b48f5), [`f067062`](https://github.com/project-hh-org/dsmith/commit/f0670624f77e27da3e6947fb92b2f2b09d9f87be), [`fe33b86`](https://github.com/project-hh-org/dsmith/commit/fe33b8669a0e11ca5275e507f4a683e78901219c)]:
  - @dsmith-dev/core@0.2.0
