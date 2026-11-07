# 벤치마크 결과 — legacy-demo (2026-11-08)

| 항목 | 값 |
| --- | --- |
| 모드 | agent |
| 프롬프트 수 N | 12 |
| 조건 | dsmith |
| 반복 | 3 |
| 에이전트 명령 | `claude -p --output-format stream-json --verbose --model sonnet --max-turns 20 --max-budget-usd 0.5 --permission-mode acceptEdits --allowedTools mcp__dsmith --setting-sources project --no-session-persistence` |
| 에이전트 버전 | 2.1.319 (Claude Code) |
| 관측 모델 | claude-sonnet-5-5 |
| dsmith 버전·커밋 | 0.2.1 · 522eea9 |
| 베이스 토큰 수 | 14 |
| 베이스 DS 컴포넌트 수 | 6 |
| 스냅샷 sha256 | 2094d703f68d |
| 실행 수 | 총 36 · 성공 36 · 실패 0 · timeout 0 · missing 0 |
| 상태 | complete |
| 총비용(USD) | 2.69 |
| harnessPathSeen 실행 수 | 0 |

## 요약

| 지표 | baseline | dsmith |
| --- | --- | --- |
| 토큰 준수율 | — | 100.0% (262/262) |
| 토큰 사용률 | — | 73.6% (262/356) |
| token(known) | — | 262 (260) |
| hardcoded(대체 가능) | — | 0 (0) |
| Tailwind 기본 스케일 | — | 94 |
| dynamic | — | 70 |
| DS 외 컴포넌트 | — | 0 |
| DS 컴포넌트 사용 | — | 44 |
| deprecated | — | 0 |
| 파싱 실패 | — | 0 |
| 기대 파일 없음 | — | 0 |
| MCP 도구 호출 | — | 2 |
| permission denial | — | 0 |

## 프롬프트별

| id | 파일 | baseline 준수율 | baseline token/hardcoded/기본 | baseline dynamic | baseline DS 외 | baseline MCP/거부 | dsmith 준수율 | dsmith token/hardcoded/기본 | dsmith dynamic | dsmith DS 외 | dsmith MCP/거부 | 판정 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01-form | src/components/ProductForm.tsx | — | — | — | — | — | 100.0% (4/4) | 4/0/31 | 4 | 0 | 0/0 | 비교 불가 |
| 02-modal | src/components/DeleteConfirmModal.tsx | — | — | — | — | — | — (0/0) | 0/0/15 | 0 | 0 | 0/0 | 비교 불가 |
| 03-list | src/components/RecentOrderList.tsx | — | — | — | — | — | 100.0% (41/41) | 41/0/7 | 0 | 0 | 1/0 | 비교 불가 |
| 04-card | src/components/CustomerSummaryCard.tsx | — | — | — | — | — | 100.0% (21/21) | 21/0/1 | 19 | 0 | 0/0 | 비교 불가 |
| 05-table | src/components/InventoryTable.tsx | — | — | — | — | — | 100.0% (73/73) | 73/0/4 | 0 | 0 | 0/0 | 비교 불가 |
| 06-badge | src/components/StockStatusBadge.tsx | — | — | — | — | — | 100.0% (9/9) | 9/0/0 | 6 | 0 | 0/0 | 비교 불가 |
| 07-tabs | src/components/OrderStatusTabs.tsx | — | — | — | — | — | 100.0% (2/2) | 2/0/9 | 2 | 0 | 0/0 | 비교 불가 |
| 08-toast | src/components/SaveToast.tsx | — | — | — | — | — | 100.0% (21/21) | 21/0/2 | 7 | 0 | 0/0 | 비교 불가 |
| 09-sidebar | src/components/FilterSidebar.tsx | — | — | — | — | — | 100.0% (29/29) | 29/0/2 | 18 | 0 | 1/0 | 비교 불가 |
| 10-settings | src/components/NotificationSettingsPage.tsx | — | — | — | — | — | 100.0% (45/45) | 45/0/5 | 4 | 0 | 0/0 | 비교 불가 |
| 11-empty | src/components/NoSearchResults.tsx | — | — | — | — | — | 100.0% (17/17) | 17/0/7 | 7 | 0 | 0/0 | 비교 불가 |
| 12-pagination | src/components/Pagination.tsx | — | — | — | — | — | — (0/0) | 0/0/11 | 3 | 0 | 0/0 | 비교 불가 |

개선 0 · 같음 0 · 악화 0 · 비교 불가 12

## 반복 통계

반복 3회. 값은 평균 (최소–최대). 조건 표는 같은 반복 번호의 프롬프트 합계로 비율을 다시 계산한 뒤 반복 사이의 평균·최소·최대이고, 프롬프트별 표는 그 프롬프트의 반복별 값(분모 0인 반복은 제외)의 평균·최소·최대다.

| 지표 | baseline | dsmith |
| --- | --- | --- |
| 토큰 준수율 | — | 100.0% (100.0%–100.0%) |
| 토큰 사용률 | — | 73.4% (69.5%–79.7%) |
| DS 외 컴포넌트 | — | 0.0 (0–0) |
| DS 컴포넌트 사용 | — | 14.7 (14–15) |
| 독립 사용률 | — | 70.9% (65.1%–77.8%) |
| 타입 오류 | — | 0.0 (0–0) |

| id | 지표 | baseline | dsmith |
| --- | --- | --- | --- |
| 01-form | 준수율 | — | 100.0% (100.0%–100.0%) |
| 01-form | 사용률 | — | 11.1% (0.0%–33.3%) |
| 01-form | DS 외 | — | 0.0 (0–0) |
| 01-form | DS 사용 | — | 2.0 (2–2) |
| 02-modal | 준수율 | — | — |
| 02-modal | 사용률 | — | 0.0% (0.0%–0.0%) |
| 02-modal | DS 외 | — | 0.0 (0–0) |
| 02-modal | DS 사용 | — | 5.0 (5–5) |
| 03-list | 준수율 | — | 100.0% (100.0%–100.0%) |
| 03-list | 사용률 | — | 84.1% (66.7%–100.0%) |
| 03-list | DS 외 | — | 0.0 (0–0) |
| 03-list | DS 사용 | — | 0.0 (0–0) |
| 04-card | 준수율 | — | 100.0% (100.0%–100.0%) |
| 04-card | 사용률 | — | 95.5% (95.5%–95.5%) |
| 04-card | DS 외 | — | 0.0 (0–0) |
| 04-card | DS 사용 | — | 0.0 (0–0) |
| 05-table | 준수율 | — | 100.0% (100.0%–100.0%) |
| 05-table | 사용률 | — | 95.2% (89.7%–100.0%) |
| 05-table | DS 외 | — | 0.0 (0–0) |
| 05-table | DS 사용 | — | 0.0 (0–0) |
| 06-badge | 준수율 | — | 100.0% (100.0%–100.0%) |
| 06-badge | 사용률 | — | 100.0% (100.0%–100.0%) |
| 06-badge | DS 외 | — | 0.0 (0–0) |
| 06-badge | DS 사용 | — | 0.0 (0–0) |
| 07-tabs | 준수율 | — | 100.0% (100.0%–100.0%) |
| 07-tabs | 사용률 | — | 10.0% (0.0%–20.0%) |
| 07-tabs | DS 외 | — | 0.0 (0–0) |
| 07-tabs | DS 사용 | — | 0.7 (0–1) |
| 08-toast | 준수율 | — | 100.0% (100.0%–100.0%) |
| 08-toast | 사용률 | — | 92.6% (77.8%–100.0%) |
| 08-toast | DS 외 | — | 0.0 (0–0) |
| 08-toast | DS 사용 | — | 1.0 (1–1) |
| 09-sidebar | 준수율 | — | 100.0% (100.0%–100.0%) |
| 09-sidebar | 사용률 | — | 93.5% (93.3%–93.8%) |
| 09-sidebar | DS 외 | — | 0.0 (0–0) |
| 09-sidebar | DS 사용 | — | 1.0 (1–1) |
| 10-settings | 준수율 | — | 100.0% (100.0%–100.0%) |
| 10-settings | 사용률 | — | 90.6% (81.8%–100.0%) |
| 10-settings | DS 외 | — | 0.0 (0–0) |
| 10-settings | DS 사용 | — | 1.0 (1–1) |
| 11-empty | 준수율 | — | 100.0% (100.0%–100.0%) |
| 11-empty | 사용률 | — | 69.6% (54.5%–84.6%) |
| 11-empty | DS 외 | — | 0.0 (0–0) |
| 11-empty | DS 사용 | — | 1.0 (1–1) |
| 12-pagination | 준수율 | — | — |
| 12-pagination | 사용률 | — | 0.0% (0.0%–0.0%) |
| 12-pagination | DS 외 | — | 0.0 (0–0) |
| 12-pagination | DS 사용 | — | 3.0 (3–3) |

## 독립 채점

dsmith의 규칙 엔진·`@dsmith-dev/*` 코드를 쓰지 않는 별도 채점기(`benchmarks/src/independent/`)가 같은 산출물에서 센 값이다. 에이전트가 새로 만든 등장만 센다(수정 파일은 before 대비 다중집합 차). 독립 사용률 = 정의된 var 참조 / (정의된 var + 정의 없는 var + 색 리터럴 + px·rem 길이 리터럴 + Tailwind 기본 팔레트·스케일).

| 지표 | baseline | dsmith |
| --- | --- | --- |
| 독립 사용률 | — | 71.0% (428/603) |
| 정의된 var 참조 | — | 428 |
| 정의 없는 var 참조 | — | 0 |
| 색 리터럴 | — | 1 |
| 길이 리터럴(px·rem) | — | 12 |
| Tailwind 기본 팔레트·스케일 | — | 162 |
| DS 모듈 컴포넌트(JSX) | — | 44 |
| 그 밖의 로컬 컴포넌트(JSX) | — | 6 |
| 파싱 실패 | — | 0 |
| 정의 없는 var 이름 | — | — |
| 타입 오류(바뀐 파일) | — | 0 |
| 타입 오류가 있는 실행 | — | 0/36 |
| 검사 방식 | — | 구문·의미 검사(의존성 타입 없이) |
| 독립 사용률 (반복 평균, 최소–최대) | — | 70.9% (65.1%–77.8%) |
| 타입 오류 (반복당 평균, 최소–최대) | — | 0.0 (0–0) |

| id | baseline 독립 사용률 | dsmith 독립 사용률 | baseline 정의 없는 var | dsmith 정의 없는 var | baseline 타입 오류 | dsmith 타입 오류 |
| --- | --- | --- | --- | --- | --- | --- |
| 01-form | — | 8.3% | 0 | 0 | — | 0 |
| 02-modal | — | 0.0% | 0 | 0 | — | 0 |
| 03-list | — | 82.5% | 0 | 0 | — | 0 |
| 04-card | — | 90.5% | 0 | 0 | — | 0 |
| 05-table | — | 80.7% | 0 | 0 | — | 0 |
| 06-badge | — | 91.3% | 0 | 0 | — | 0 |
| 07-tabs | — | 8.3% | 0 | 0 | — | 0 |
| 08-toast | — | 84.6% | 0 | 0 | — | 0 |
| 09-sidebar | — | 88.2% | 0 | 0 | — | 0 |
| 10-settings | — | 69.5% | 0 | 0 | — | 0 |
| 11-empty | — | 77.5% | 0 | 0 | — | 0 |
| 12-pagination | — | 0.0% | 0 | 0 | — | 0 |

프롬프트별 값은 그 프롬프트의 모든 반복을 합산했다.

**타입 검사**(구문·의미 검사(의존성 타입 없이)): 에이전트가 바꾼 ts·tsx·js·jsx 파일의 구문·의미 진단 중 그 파일 안에 있는 오류만 센다. 외부 패키지(react 등)의 타입은 복사본에 설치돼 있지 않아 풀지 못하고 any로 취급한다 — 외부 API 오용, JSX 내장 요소 속성 오타, `React.FC<P>`로 선언한 컴포넌트의 props는 못 잡고, 없는 로컬 모듈·없는 export·함수 선언 로컬 컴포넌트의 props 불일치·타입 불일치·구문 오류는 잡는다.

## 해석 한계

**이번 보고서에서 다룬 것**
- 반복 3회: 프롬프트·조건별 평균과 최소–최대를 `## 반복 통계`에 싣고, `## 대응 비교`에서 프롬프트 12개를 단위로 부호 검정(양쪽 정확 p)과 평균 차이의 95% 부트스트랩 CI(시드 고정)를 낸다. 에이전트 출력의 실행 간 변동은 반복 범위 안에서만 본 것이다.
- 채점 독립성: dsmith 엔진과 코드를 공유하지 않는 별도 채점기가 같은 산출물을 다시 셌고(`## 독립 채점`), dsmith 점수와의 방향 일치도를 `### 일치도`에 밝혔다. 다만 독립 채점기도 같은 저자가 쓴 정규식·AST 휴리스틱이라 완전한 제3자 평가는 아니고, 베이스의 토큰·프리셋 정의는 같은 것을 읽고, DS 모듈 목록도 dsmith 스냅샷(`ds.modules`)에서 받는다.
- 타입 검사: 바뀐 파일을 TypeScript 컴파일러로 검사했다(위 "타입 검사" 문단에 방식과 못 잡는 것을 적었다). 토큰 정의 확인은 정의 없는 var 참조 수(`undefinedVars`)로 한다.

**남은 한계**
- 렌더링하지 않았다. 화면에서 어떻게 보이는지(색 대비·레이아웃 깨짐)와 `tokens.css`가 실제로 로드되는지는 측정 밖이다 — 정의된 var 참조는 "CSS 어딘가에 선언돼 있다"까지만 확인한다.
- 타입 검사는 의존성 타입 없이 했다(복사본에 node_modules 없음). react 등 외부 패키지 API 사용과 JSX 내장 요소 속성의 타입 오류는 검사 밖이다.
- 모델 하나·에이전트 하나(관측 모델: claude-sonnet-5-5), 레포 하나(legacy-demo)다. 다른 모델·에이전트·코드베이스로 일반화하지 못한다.
- dsmith 조건의 개선이 AGENTS.md DS 섹션 때문인지 MCP 도구(`lint_snippet` 등) 때문인지 분리하지 않았다(AGENTS.md DS 섹션·`.mcp.json`·`.dsmith/`·`.claude/skills`가 함께 켜진 조건 하나뿐). MCP 호출 수를 요약에 싣지만 그것만으로 원인을 가르지 못한다.
- 준수율 분모에서 Tailwind 기본 스케일 클래스는 뺐다(별도 행).
- 변수·상수에 담은 className은 dynamic으로만 세며 준수율 분모에 들어가지 않음.
- 산출물은 `benchmarks/results/2026-11-08-legacy-demo-dsmith-rerun/outputs`에 있고 저장소 루트에서 `pnpm bench --repo legacy-demo --replay benchmarks/results/2026-11-08-legacy-demo-dsmith-rerun/outputs`로 같은 채점을 다시 낼 수 있다.
