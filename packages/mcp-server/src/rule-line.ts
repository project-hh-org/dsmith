/**
 * 서버 instructions와 모든 도구 설명의 첫 줄. 벤치마크에서 AGENTS.md DS 섹션만 있을 때 토큰 사용률이 가장 높았고
 * MCP를 더하면 낮아졌다 — 이 도구들이 AGENTS.md의 규칙을 대체하는 안내로 읽히지 않게, 규칙은 AGENTS.md가 정하고
 * 도구는 그 규칙에 맞는 값을 찾는 용도라고 먼저 밝힌다.
 */
export const DS_RULE_LINE =
  "새 UI 코드는 AGENTS.md의 DS 규칙(토큰 var(--…)/Tailwind ds- 클래스, DS 컴포넌트)을 따른다. 이 도구는 그 규칙에 맞는 값을 찾을 때 쓴다.";
