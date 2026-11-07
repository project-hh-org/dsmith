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

## 대응 비교

프롬프트마다 반복 평균을 구해 (dsmith − baseline)을 대응시킨다. 토큰 사용률의 분모가 0인 쪽은 그 프롬프트를 사용률 비교에서 뺀다(—).

| id | baseline 사용률 | dsmith 사용률 | 사용률 차이 | baseline DS 외 | dsmith DS 외 | DS 외 차이 |
| --- | --- | --- | --- | --- | --- | --- |
| 01-form | 0.0% | 46.2% | +46.2%p | 2.0 | 0.0 | -2.0 |
| 02-modal | 0.0% | 0.0% | +0.0%p | 0.0 | 0.0 | +0.0 |
| 03-list | 0.0% | 69.2% | +69.2%p | 0.0 | 0.0 | +0.0 |
| 04-card | 0.0% | 100.0% | +100.0%p | 0.0 | 0.0 | +0.0 |
| 05-table | 0.0% | 100.0% | +100.0%p | 0.0 | 0.0 | +0.0 |
| 06-badge | 0.0% | 100.0% | +100.0%p | 0.0 | 0.0 | +0.0 |
| 07-tabs | 20.0% | 0.0% | -20.0%p | 0.0 | 0.0 | +0.0 |
| 08-toast | 0.0% | — | — | 0.0 | 0.0 | +0.0 |
| 09-sidebar | 7.5% | 95.5% | +88.0%p | 1.0 | 0.0 | -1.0 |
| 10-settings | 5.0% | 72.2% | +67.2%p | 1.0 | 0.0 | -1.0 |
| 11-empty | 0.0% | 70.0% | +70.0%p | 1.0 | 0.0 | -1.0 |
| 12-pagination | 8.3% | 0.0% | -8.3%p | 0.0 | 0.0 | +0.0 |

- 토큰 사용률: 평균 3.7% → 59.4%, 평균 차이 +55.7%p, 95% 부트스트랩 CI [+29.1, +79.6] (프롬프트 11개 복원추출 10,000회, 시드 20261107), 95% t 구간 [+25.3, +86.1] (자유도 10, 비교용). 부호 검정(0 차이 1개 제외, n=10): 증가 8 · 감소 2, 양쪽 정확 p=0.1094.
- DS 외 컴포넌트: 평균 0.42 → 0.00, 평균 차이 -0.42. 부호 검정(0 차이 8개 제외, n=4): 증가 0 · 감소 4, 양쪽 정확 p=0.1250.
- DS 컴포넌트 사용: 평균 0.42 → 1.25, 평균 차이 +0.83. 부호 검정(0 차이 5개 제외, n=7): 증가 7 · 감소 0, 양쪽 정확 p=0.0156.

## 해석 한계

**이번 보고서에서 다룬 것**
- 반복 1회의 단일 측정이다. `## 대응 비교`의 부호 검정은 프롬프트 12개 사이의 방향 일관성만 보고, 같은 프롬프트를 다시 돌렸을 때의 변동(에이전트의 비결정성)은 재지 못한다. `--repeat 3` 이상으로 돌려야 반복 통계가 생긴다.
- 표본 단위는 프롬프트다. 프롬프트 수가 작아(N=12) 검정력이 낮고, 프롬프트는 이 하네스에 들어 있는 UI 생성 요청이라 "일반 UI 생성"으로 확장하지 못한다.
- 독립 채점기 기록이 없는 결과(이전 형식)다. 채점은 dsmith 자신의 규칙 엔진뿐이고 dsmith 조건의 에이전트는 같은 엔진(`lint_snippet`)을 쓸 수 있어, 같은 기준에 맞추도록 돕는 효과를 잰 것이지 독립 평가가 아니다.
- 타입 검사·토큰 정의 검사 기록이 없는 결과(이전 형식)다.

**남은 한계**
- 렌더링하지 않았다. 화면에서 어떻게 보이는지(색 대비·레이아웃 깨짐)와 `tokens.css`가 실제로 로드되는지는 측정 밖이다 — 정의된 var 참조는 "CSS 어딘가에 선언돼 있다"까지만 확인한다.
- 타입 검사는 의존성 타입 없이 했다(복사본에 node_modules 없음). react 등 외부 패키지 API 사용과 JSX 내장 요소 속성의 타입 오류는 검사 밖이다.
- 모델 하나·에이전트 하나(관측 모델: claude-sonnet-5-5), 레포 하나(legacy-demo)다. 다른 모델·에이전트·코드베이스로 일반화하지 못한다.
- dsmith 조건의 개선이 AGENTS.md DS 섹션 때문인지 MCP 도구(`lint_snippet` 등) 때문인지 분리하지 않았다(AGENTS.md DS 섹션·`.mcp.json`·`.dsmith/`·`.claude/skills`가 함께 켜진 조건 하나뿐). MCP 호출 수를 요약에 싣지만 그것만으로 원인을 가르지 못한다.
- 대응 비교에서 지표 3개(토큰 사용률·DS 외 컴포넌트·DS 컴포넌트 사용)를 각각 검정했고 다중 비교 보정은 하지 않았다. 참고로 Bonferroni(×3)를 적용하면 토큰 사용률 p=0.3281, DS 외 컴포넌트 p=0.3750다.
- 95% CI는 프롬프트 12개의 백분위 부트스트랩이라 표본이 작으면 실제 포함 확률이 95%보다 낮을 수 있다. 그래서 같은 차이의 t 구간을 `## 대응 비교`에 함께 적었다(정규 근사를 가정한 비교용 값).
- 토큰 사용률이 dsmith 쪽에서 오히려 낮아진 프롬프트: `07-tabs`(20.0% → 0.0%, dsmith DS 컴포넌트 사용 평균 1.0), `12-pagination`(8.3% → 0.0%, dsmith DS 컴포넌트 사용 평균 3.0). 사용률은 직접 쓴 스타일 값 중 토큰 참조의 비율이라, DS 컴포넌트로 조립하고 레이아웃용 기본 스케일 클래스만 몇 개 직접 쓰면 분자가 0이 돼 0%가 된다. 이는 지표의 한계이며 이런 프롬프트의 DS 활용은 `DS 컴포넌트 사용` 행에서 따로 본다.
- 준수율 분모에서 Tailwind 기본 스케일 클래스는 뺐다(별도 행).
- 변수·상수에 담은 className은 dynamic으로만 세며 준수율 분모에 들어가지 않음.
- 산출물은 `benchmarks/results/2026-11-07-legacy-demo/outputs`에 있고 저장소 루트에서 `pnpm bench --repo legacy-demo --replay benchmarks/results/2026-11-07-legacy-demo/outputs`로 같은 채점을 다시 낼 수 있다.
