# 실제 레포 전 구간 기록 — audit → init → ai → decide → migrate → guard → revert

- 날짜: 2026-11-07
- 대상: 2026-11-01 재측정과 같은 비공개 사내 어드민의 **새 복사본**. 추적 파일 1,326개, 스캔 1,143개(NUL 바이트 플레이스홀더 137개 건너뜀). Next.js(pages 라우터), JS 비중이 높고 TS가 일부 섞여 있다. 스타일은 styled 템플릿 리터럴 CSS-in-JS 60.6% · MUI `sx` 20.7% · 인라인 스타일 16.9% · CSS 1.1% · Tailwind 0.7%(보관 디렉터리의 미리보기 전용) · emotion 0.03%. DS로 감지된 것은 `@mui/material`(npm). ESLint 설정 없음, `node_modules` 없음. 레포·회사 이름과 경로는 기록하지 않는다.
- 측정 방법: 원본은 건드리지 않고 복사본에서 이전 실행 산출물(`.dsmith/`·`design-system/`·`.claude/`·`.mcp.json`·`AGENTS.md`·`.ds-cli/`)과 `.git`을 지운 뒤 `git init`, 전체를 `base` 커밋(`main`). CLI는 `feat/benchmark` `70149c5`에서 빌드한 `packages/cli/dist/bin.js`(제품 패키지는 main과 같음). 컨테이너, Node v22.23.4, 2 vCPU. 시간은 명령 하나의 벽시계 시간. 모든 숫자는 각 명령의 `--json` 출력에서 옮겼다.

## 요약 3줄

1. **하드코딩 색 3,336개 → 색 토큰 139개.** 20파일 한정 적용 기준: 색 30건(토큰 10개)을 포함해 98건 치환, 색 잔여 3,336 → 3,306, 점수 16 → 17(예상 = 실측). 계획 전체 기준: 색 2,218건을 포함해 5,953건 치환 예정, 색 잔여 3,336 → 1,118, 점수 16 → 35(예상치, 적용 안 함).
2. **중복 `Button` 출처 6개 → `@mui/material` 1개로 결정(결정 5건 중).** 계획 전체 기준 `Button` import 치환 14파일, 보류 1건(spread-props). 20파일 한정 적용 범위에는 `Button` 치환이 없어서(그 범위의 컴포넌트 치환 7건은 `Container` 4 · `Table` 3) 적용 뒤 audit의 duplicateCount는 128 그대로다.
3. **재유입 PR 검사: 토큰만 쓴 변경 신규 0건(exit 0) → 합성 재유입 1건 탐지(exit 1, 제안 토큰 exact).**

## 단계별 표

| # | 명령 | 핵심 숫자 | 시간 |
| --- | --- | --- | ---: |
| 1 | `audit --json` | 점수 16, hardcodedShare 0.9109, dsImportShare 0.391, duplicateCount 128, 스타일 사용 35,533, 컴포넌트 사용 13,043, 동적 값 3,886. 하드코딩 색 3,336건(서로 다른 값 382개, 클러스터 139) | 12.1s |
| 2 | `init --dry-run --json` | 토큰 166(color 139 · spacing 15 · radius 4 · font-size 8, 합쳐진 값 422). 커버리지 11,006 / 11,325 = 0.9718(exact 6,631 · close 4,375). 0·음수 604, 범위 밖(unknown 182 · 토큰 대상 아닌 속성 4,674) | 1.2s |
| 3 | `init --all --json` | 토큰 파일 3개(json·css·ts) + Tailwind v3 프리셋(연결 안 됨) + 스캐폴드 2개(나머지 8개는 "이미 DS에 있음"으로 건너뜀). 결정 항목 추가 60, 대기 520. 알파 버린 색 73종. `tokensLoaded.css: false`(근거 없음), `catalog: needs-ai` | 2.1s |
| 4 | `ai --json` | 소스 2개(DS npm + init 산출), 컴포넌트 2, props 추출 0/2, 토큰 166, `AGENTS.md` DS 섹션 생성. 경고 "`node_modules/@mui/material` 없음" | 0.5s |
| 5 | `decide --list --json --status pending` | 대기 520 = duplicate 128 · local-definition 372 · token-cluster 20 | 0.6s |
| 6 | `decide --explain` ×15 → `--choose` ×5 | 상위 duplicate 15건 모두 추천 있음. 상위 5건(`Button`·`TextField`·`Container`·`Table`·`Chip`) 추천 = `@mui/material`(규칙 `ds-module`, confidence high). `--map` 없이 기록 | 각 0.5s |
| 7 | `migrate --json`(계획) | 대상 파일 743, 후보 11,006(= init 커버리지 replaceable). planned 5,953(identical 5,858 · exact 95) / 573파일, close 3,845(기본 제외), 건너뜀 multi-value 1,076 · translucent-color 132. 범위 밖: far 319 · dynamic 2,208 · 0·음수 604. 카테고리별 planned: color 2,218 · spacing 1,912 · radius 616 · font-size 1,207. 컴포넌트: 결정 5건 → 71파일 import 검사 73, 편집 패치 128, props 0, 보류 spread-props 2 · decision-pending 2,351(미결정 495항목), mapping-missing 0. `tokens.loaded.css: false` → "토큰 스타일시트가 로드되지 않음" 안내 출력. 예상 16 → 35 | 24.6s |
| 8 | init·ai·decide 산출 커밋 | `design-system/`(토큰 3 · 프리셋 · 스캐폴드 2), `.dsmith/`, `AGENTS.md` — 적용 직전 커밋 | — |
| 9 | `migrate --apply --max-files 20 --branch ds/migrate-sample --with-tokens --json` | 20파일 모두 applied, 치환 98(color 30 · spacing 46 · radius 13 · font-size 9, 토큰 27종), 컴포넌트 import 7(Container 4 · Table 3), props 0, 롤백 0, 건너뜀 0. 브랜치 커밋 1개(20파일 +99 −103). 토큰 파일은 이미 커밋돼 `--with-tokens`가 더할 것이 없었다 | 34.3s |
| 10 | `audit --json`(적용 뒤) | 점수 16 → 17, hardcodedShare 0.9109 → 0.9049, dsImportShare 0.391 → 0.3916, 색 잔여 3,336 → 3,306. 스캔 1,143 → 1,148(생성된 `design-system/` 5개 파일이 스캔에 들어옴, rated 16,247은 같음). 바뀐 20파일 `parseTsx` 치명 오류 0 → 0, 복구 오류 0 → 0 | 10.8s |
| — | `tsc --noEmit` | 건너뜀 — `node_modules`가 없고 설치하지 않았다 | — |
| 11 | `guard init --json` | 스냅샷 토큰 166 · DS 컴포넌트 2 · deprecated 0 · preferred 5. ESLint `no-config`(설정이 없어 즉시 검사는 건너뜀, 고치지 않음). migrate 브랜치에 커밋 | 0.9s |
| 12a | `guard --ci --base ds/migrate-sample --json`(토큰만 쓰는 styled 블록 추가) | newHardcoded 0 · newReplaceable 0 · newNonDs 0, exit 0 | 0.4s |
| 12b | 같은 명령(하드코딩 색 1개 재유입) | newHardcoded 1 · newReplaceable 1(exact 토큰 제안), exit 1 | 0.4s |
| 13 | `migrate --revert <id> --json` | 20파일 모두 reverted. `git diff --stat <적용 직전> -- . ':!.dsmith'` 빈 결과, `.dsmith/` 제외 `ls-tree` 해시 동일 | 11.7s |

## 보류·건너뜀 사유 상위

토큰 후보 11,006건 = planned 5,953 + close 3,845 + 건너뜀 1,208. 색만 보면 3,336 = planned 2,218 + close 986 + translucent 132.

| 사유 | 건수 | 내용 |
| --- | ---: | --- |
| close(기본 제외) | 3,845 | font-size 1,728 · color 986 · spacing 857 · radius 274. 예: `gap: 0.8rem`(12.8px) → `--space-3`(12px), 거리 0.8px. `--close`로만 포함 |
| multi-value | 1,076 | 축약형 여러 값. padding 956 · margin 101 · border-radius 10 · gap 9. styled 779 · 인라인 198 · sx 98 · css 1 |
| translucent-color | 132 | 알파가 있는 색. init이 알파를 버리고 불투명 토큰을 만들었으므로 치환하지 않음(init 기준 73종) |
| 컴포넌트 decision-pending | 2,351 호출 | 결정하지 않은 495항목의 사용처 |
| 컴포넌트 spread-props | 2 | `{...props}`가 있어 prop 대응을 확인할 수 없음 |
| 컴포넌트 mapping-missing | 0 | 아래 사례 1 참고 — 보류돼야 할 곳이 보류되지 않았다 |

## 실제 사례 3개 (일반화)

**사례 1 — 다른 컴포넌트가 import만 바뀐다(보류 0).** `Table` 결정이 `@mui/material`이 되자 서드파티 데이터 그리드의 `Table`과 사내 목록 `Table`도 import만 MUI로 바뀌었다. 호출부 props는 MUI `Table`에 없는 것들인데 mapping-missing으로 보류되지 않았다. 20파일 적용에서도 3파일이 이렇게 바뀌었다.

```jsx
// before
import { Table } from "some-data-grid";
<Table virtualized autoHeight data={rows} loading={loading}>…</Table>

import { Table } from "../shared/list";
<Table columns={cols} rows={list} linkTo="/a/b" fullPage />

// after (계획·적용 모두 통과)
import { Table } from "@mui/material";
```

**사례 2 — 반투명 색은 건너뜀.** 같은 RGB의 불투명 토큰이 있어도 치환하지 않는다(translucent-color).

```js
const Card = styled.div`
  border-color: rgba(0, 0, 0, 0.3);   /* 건너뜀: translucent-color */
  color: #2b2b2b;                     /* 치환: var(--color-…) */
`;
```

**사례 3 — 축약형 여러 값은 건너뜀.** 단위가 섞인 padding 축약이 대표적이다. 같은 적용에서 단일 값은 치환됐다.

```jsx
<div style={{ padding: "4rem 12px 6rem" }}>   {/* 건너뜀: multi-value */}
<img style={{ borderRadius: 4 }} />            {/* → borderRadius: "var(--radius-sm)" */}
<Stack sx={{ padding: "16px" }} />             {/* → padding: 2 (sx 숫자 스케일) */}
```

## 발견한 제품 문제

1. **컴포넌트 치환이 대상 props를 모를 때 통과시킨다(중요).** 재현: DS가 npm 패키지이고 `node_modules`가 없는 레포에서 같은 이름의 duplicate(다른 라이브러리 또는 사내 구현)를 DS 모듈로 `--choose`(`--map` 없음) → `migrate`. 호출부에 대상에 없는 props(`virtualized`·`data`·사내 전용 대문자 props)가 있어도 mapping-missing 0, import만 바꿔 적용한다. 같은 레포의 explain 카드는 대상 옵션의 관측 props를 알고 있으므로(`aria-label`·`size`·`stickyHeader`·`sx` …) 최소한 그 집합과 대조하거나, props를 못 읽으면 `target-props-unknown`으로 보류해야 한다.
2. **`ds-module` 추천이 이름만 같은 다른 컴포넌트에도 high로 나온다.** `Container`는 사내 레이아웃 컴포넌트 35회 vs MUI 6회인데 MUI가 high 추천, `Table`도 데이터 그리드·사내 목록을 MUI `Table`과 같은 선택지로 묶는다. props 겹침이 거의 없을 때는 confidence를 낮추거나 "다른 컴포넌트일 수 있음"을 표시해야 한다.
3. **init 스캐폴드의 props를 ai가 못 읽는다.** 스캐폴드는 `interface XProps`를 쓰지만 함수가 `function X()`로 props를 받지 않아 `ai`의 props 추출이 0/2다. 스캐폴드 시그니처를 `function X(props: XProps)`로.
4. **audit이 생성된 `design-system/`을 스캔한다.** init 뒤 스캔 수가 5 늘었다(점수 분모 rated는 그대로). migrate는 이 디렉터리를 제외하는데 audit은 제외하지 않아 두 숫자의 기준이 다르다.
5. **토큰 이름이 읽기 어렵다(사소).** `--color-gray-50`이 `#ffffff`, `--color-gray-50-2`가 `#f3f4f6`, guard 제안 토큰이 `--color-red-500-6`처럼 같은 단계에 접미사가 붙는다. 회색이 많은 레포에서 단계 이름이 실제 밝기 순서와 어긋난다.

## 알려진 한계

- `tsc --noEmit`·ESLint 전후 비교를 하지 못했다(`node_modules` 없음, ESLint 설정 없음). 그래서 사례 1의 치환이 타입 오류를 내는지는 측정하지 않았다. 대신 바뀐 20파일을 `parseTsx`로 다시 읽어 구문 오류 증가가 없음만 확인했다.
- 토큰 스타일시트를 전역에서 로드하지 않은 상태로 적용했다(`tokens.loaded.css: false`, migrate가 안내만 함). 이 상태로 배포하면 치환된 `var()`가 비어 보인다.
- `--max-files 20`은 파일 순서상 앞의 20파일(pages 라우트)이라 레포 전체를 대표하지 않는다. 계획 전체 숫자는 예상치이고 적용하지 않았다.
- close 3,845 · multi-value 1,076 · translucent 132, 합계 5,053건(후보의 45.9%)은 기본 설정에서 건드리지 않는다.
- 결정은 추천을 그대로 받은 5건뿐이다. 미결정 495항목(호출 2,351)이 컴포넌트 쪽 대부분을 막고 있다.
