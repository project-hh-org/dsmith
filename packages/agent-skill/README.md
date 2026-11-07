# @dsmith-dev/agent-skill

dsmith slash-command sources and per-AI-tool renderers (Claude Code, Codex, Cursor, Gemini CLI, AGENTS.md).

## 렌더러가 쓰는 표면

`renderers[tool].render(commands, ctx)`는 두 가지 표면을 쓴다. `ctx.include`로 고른다(생략하면 둘 다).

| 표면 | `include` | 쓰는 파일 |
| --- | --- | --- |
| 슬래시 명령·스킬 | `skills` | claude-code `.claude/skills/`, codex `.agents/skills/`, cursor `.cursor/commands/`, gemini `.gemini/commands/` |
| MCP 서버 등록 | `mcp` | claude-code `.mcp.json`, codex `.codex/config.toml`, cursor `.cursor/mcp.json`, gemini `.gemini/settings.json` |

둘 다 끄면 모든 렌더러가 쓸 파일도 note도 내지 않는다. `agents-md` 렌더러의 명령 표 블록은 둘 중 하나가 켜졌을 때만 쓰고, `mcp`가 꺼져 있으면 MCP 서버 줄과 `resolve_token` 규칙을 뺀다.

`dsmith install`은 기본으로 두 표면을 모두 끄고 AGENTS.md DS 섹션(`dsmith ai`)만 보장한다. `--skills`와 `--mcp`(또는 `--mcp-command`)가 각 표면을 켠다. 이유: 같은 날 벤치마크에서 토큰 사용률 평균이 AGENTS.md DS 섹션만 있을 때 가장 높았고 MCP 서버, 슬래시 명령을 더할수록 낮아졌다 — [benchmarks/results/2026-11-08-legacy-demo-sameday.md](https://github.com/project-hh-org/dsmith/blob/main/benchmarks/results/2026-11-08-legacy-demo-sameday.md).

## 명령 본문 규칙

`commands/*.md`는 Tailwind 기본 스케일 클래스나 하드코딩 값을 쓰라고 하지 않는다. UI 코드를 제안·변경하는 `/ds`·`/ds-check`·`/ds-migrate`는 본문 첫 줄에 "새 UI 코드는 AGENTS.md의 DS 규칙(디자인 토큰·DS 컴포넌트)을 따른다. 이 명령은 그 규칙에 맞는 토큰·컴포넌트를 찾을 때 쓴다."를 둔다(테스트가 확인). 스타일링 방식(CSS 변수·Tailwind 프리셋)을 가리지 않는 문구다.

Docs: https://github.com/project-hh-org/dsmith#readme
