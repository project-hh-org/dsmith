---
"dsmith": minor
"@dsmith-dev/agent-skill": minor
---

`dsmith install`의 기본을 AGENTS.md DS 섹션만으로 바꿈. MCP 서버 등록(`.mcp.json` 등)과 슬래시 명령(`.claude/skills` 등)은 `--mcp`·`--skills`로 따로 켠다(`--mcp-command`는 `--mcp`를 함께 켠다).

- 근거: 같은 날 12개 프롬프트 × 3회 벤치마크에서 토큰 사용률 평균이 AGENTS.md DS 섹션만 있을 때 90.5%, MCP 서버를 더하면 78.0%(−12.5%p), 슬래시 명령까지 더하면 61.9%(−16.1%p)였다. MCP 도구 호출은 36회 실행 중 2~4회뿐이었고 줄어든 몫은 Tailwind 기본 스케일 클래스로 갔다. 자세한 것은 `benchmarks/results/2026-11-08-legacy-demo-sameday.md`.
- 기본 `install`은 `dsmith ai`와 같은 경로로 AGENTS.md DS 섹션을 만든다. 분석 결과(`audit`)가 없으면 쓰지 못하고 "할 일"에 사유를 남긴다.
- 이미 설치한 MCP·스킬 파일은 플래그 없이 다시 실행해도 지우지 않는다.
- `--json` 출력에 `surfaces`(설치한 표면)와 `ds`(DS 섹션 결과)가 추가됐다. 기본 설치의 `outcomes`는 비어 있을 수 있다.
- 설치한 경우 MCP 서버 `instructions`와 모든 도구 설명, `/ds`·`/ds-check`·`/ds-migrate` 본문이 "새 UI 코드는 AGENTS.md의 DS 규칙을 따른다"로 시작한다. 도구·명령 이름은 그대로다.
- `dsmith ai`는 MCP 미등록 안내를 더 이상 출력하지 않고, 렌더러 `RenderContext`에 설치할 표면을 고르는 `include`가 생겼다.
