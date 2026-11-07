/**
 * 서버 instructions와, 붙여 넣을 값을 돌려주는 도구(resolve_token·search_component·get_component) 설명의 첫 줄.
 * 벤치마크에서 AGENTS.md DS 섹션만 있을 때 토큰 사용률이 가장 높았고 MCP를 더하면 낮아졌다 — 이 도구들이 AGENTS.md의
 * 규칙을 대체하는 안내로 읽히지 않게, 규칙은 AGENTS.md가 정하고 도구는 그 규칙에 맞는 값을 찾는 용도라고 밝힌다.
 * 문구는 스타일링 방식(CSS 변수·Tailwind 프리셋 등)을 가리지 않는다 — 생성되는 AGENTS.md 섹션이 모든 레포에서 말하는 것만 적는다.
 */
export const DS_RULE_LINE =
  "새 UI 코드는 AGENTS.md의 DS 규칙(디자인 토큰·DS 컴포넌트)을 따른다. 이 도구는 그 규칙에 맞는 토큰·컴포넌트를 찾을 때 쓴다.";
