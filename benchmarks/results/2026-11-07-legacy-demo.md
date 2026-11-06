# 벤치마크 결과 — legacy-demo (2026-11-07)

| 항목 | 값 |
| --- | --- |
| 모드 | agent |
| 프롬프트 수 N | 12 |
| 조건 | baseline, dsmith |
| 반복 | 1 |
| 에이전트 명령 | `claude -p --output-format stream-json --verbose --model sonnet --max-turns 20 --max-budget-usd 0.5 --permission-mode acceptEdits --allowedTools mcp__dsmith --setting-sources project --no-session-persistence` |
| 에이전트 버전 | 2.1.318 (Claude Code) |
| 관측 모델 | claude-sonnet-5-5 |
| dsmith 버전·커밋 | 0.1.0 · d0c51de |
| 베이스 토큰 수 | 14 |
| 베이스 DS 컴포넌트 수 | 6 |
| 스냅샷 sha256 | 2094d703f68d |
| 실행 수 | 총 24 · 성공 24 · 실패 0 · timeout 0 · missing 0 |
| 상태 | complete |
| 총비용(USD) | 1.79 |
| harnessPathSeen 실행 수 | 0 |

## 요약

| 지표 | baseline | dsmith |
| --- | --- | --- |
| 토큰 준수율 | 80.0% (8/10) | 100.0% (75/75) |
| 토큰 사용률 | 4.0% (8/199) | 72.1% (75/104) |
| token(known) | 8 (0) | 75 (75) |
| hardcoded(대체 가능) | 2 (1) | 0 (0) |
| Tailwind 기본 스케일 | 189 | 29 |
| dynamic | 6 | 15 |
| DS 외 컴포넌트 | 5 | 0 |
| DS 컴포넌트 사용 | 5 | 15 |
| deprecated | 0 | 0 |
| 파싱 실패 | 0 | 0 |
| 기대 파일 없음 | 0 | 0 |
| MCP 도구 호출 | 0 | 3 |
| permission denial | 1 | 0 |

## 프롬프트별

| id | 파일 | baseline 준수율 | baseline token/hardcoded/기본 | baseline dynamic | baseline DS 외 | baseline MCP/거부 | dsmith 준수율 | dsmith token/hardcoded/기본 | dsmith dynamic | dsmith DS 외 | dsmith MCP/거부 | 판정 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01-form | src/components/ProductForm.tsx | 0.0% (0/1) | 0/1/8 | 0 | 2 | 0/0 | 100.0% (6/6) | 6/0/7 | 0 | 0 | 0/0 | 개선 |
| 02-modal | src/components/DeleteConfirmModal.tsx | — (0/0) | 0/0/5 | 0 | 0 | 0/0 | — (0/0) | 0/0/5 | 0 | 0 | 0/0 | 비교 불가 |
| 03-list | src/components/RecentOrderList.tsx | — (0/0) | 0/0/12 | 0 | 0 | 0/0 | 100.0% (9/9) | 9/0/4 | 2 | 0 | 0/0 | 비교 불가 |
| 04-card | src/components/CustomerSummaryCard.tsx | — (0/0) | 0/0/17 | 0 | 0 | 0/0 | 100.0% (14/14) | 14/0/0 | 0 | 0 | 0/0 | 비교 불가 |
| 05-table | src/components/InventoryTable.tsx | — (0/0) | 0/0/30 | 0 | 0 | 0/0 | 100.0% (2/2) | 2/0/0 | 5 | 0 | 0/0 | 비교 불가 |
| 06-badge | src/components/StockStatusBadge.tsx | 0.0% (0/1) | 0/1/9 | 0 | 0 | 0/0 | 100.0% (3/3) | 3/0/0 | 2 | 0 | 0/0 | 개선 |
| 07-tabs | src/components/OrderStatusTabs.tsx | 100.0% (2/2) | 2/0/8 | 1 | 0 | 0/0 | — (0/0) | 0/0/1 | 1 | 0 | 0/0 | 비교 불가 |
| 08-toast | src/components/SaveToast.tsx | — (0/0) | 0/0/13 | 1 | 0 | 0/0 | — (0/0) | 0/0/0 | 1 | 0 | 1/0 | 비교 불가 |
| 09-sidebar | src/components/FilterSidebar.tsx | 100.0% (3/3) | 3/0/37 | 0 | 1 | 0/1 | 100.0% (21/21) | 21/0/1 | 2 | 0 | 0/0 | 같음 |
| 10-settings | src/components/NotificationSettingsPage.tsx | 100.0% (1/1) | 1/0/19 | 0 | 1 | 0/0 | 100.0% (13/13) | 13/0/5 | 0 | 0 | 2/0 | 같음 |
| 11-empty | src/components/NoSearchResults.tsx | — (0/0) | 0/0/9 | 1 | 1 | 0/0 | 100.0% (7/7) | 7/0/3 | 1 | 0 | 0/0 | 비교 불가 |
| 12-pagination | src/components/Pagination.tsx | 100.0% (2/2) | 2/0/22 | 3 | 0 | 0/0 | — (0/0) | 0/0/3 | 1 | 0 | 0/0 | 비교 불가 |

개선 2 · 같음 2 · 악화 0 · 비교 불가 8

## 해석 한계

- 프롬프트 12개·반복 1회의 단일 측정이며 에이전트 출력은 비결정적이다.
- 유의성 검정을 하지 않았다.
- 준수율 분모에서 Tailwind 기본 스케일 클래스는 뺐다(별도 행).
- 변수·상수에 담은 className은 dynamic으로만 세며 준수율 분모에 들어가지 않음.
- 렌더링·타입 검사는 하지 않았다. `tokens.css` 로드·프리셋 연결 여부는 측정 밖이다.
- 채점은 dsmith 자신의 규칙 엔진이고 dsmith 조건의 에이전트는 같은 엔진(`lint_snippet`)을 쓸 수 있다. 같은 기준에 맞추도록 돕는 효과를 잰 것이지 독립 평가가 아니다.
- 산출물은 `benchmarks/results/2026-11-07-legacy-demo/outputs`에 있고 저장소 루트에서 `pnpm bench --repo legacy-demo --replay benchmarks/results/2026-11-07-legacy-demo/outputs`로 같은 채점을 다시 낼 수 있다.
