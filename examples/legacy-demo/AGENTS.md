<!-- dsmith:ds:start -->
## 이 레포의 디자인 시스템 (dsmith ai가 생성 — 직접 고치면 다음 ai가 덮어쓰지 않음)

- DS 위치: `src/components/ui` (로컬) · `design-system/` (dsmith init 초안)
- 토큰 파일: `design-system/tokens.css` (토큰 14개)
- 컴포넌트 5개(props 추출 1) — 많이 쓰는 순: Button, Dialog, DialogContent, DialogTitle, DialogTrigger
- 골격(구현 전) — 새 UI에 쓰지 말 것: Badge

### 규칙
1. 색·간격·모서리·글꼴 크기 값을 하드코딩하지 않는다. 토큰 파일의 변수를 쓴다.
2. 값이 필요하면 MCP `resolve_token`으로 가장 가까운 토큰을 찾는다.
3. 새 UI는 위 컴포넌트를 먼저 쓴다. 고르기 전에 `search_component`·`get_component`로 props를 확인한다.
4. deprecated 컴포넌트·props는 쓰지 않는다.
5. 끝나면 `/ds-check`(또는 MCP `lint_snippet`)로 검사한다.

MCP 서버 `dsmith` 도구: resolve_token, lint_snippet, search_component, get_component, explain_decision, list_decisions — 등록은 `npx dsmith install`.
<!-- dsmith:ds:end -->
