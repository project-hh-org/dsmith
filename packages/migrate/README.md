# @dsmith-dev/migrate

`dsmith migrate`의 엔진. 하드코딩된 스타일 값을 디자인 토큰 참조로 바꾸고, 되돌릴 수 있게 기록한다.

- `planMigration` / `analyzeMigration` — 파일을 쓰지 않는 계획. 후보는 core `bestReplacement`(= `replaceableToken`)가 고른 토큰이 있는 하드코딩 사용이다. 계획은 audit 인덱스가 아니라 디스크를 다시 읽고(`analyzeMigration`은 그 사용도 돌려줘 전/예상 점수를 같은 값으로 계산하게 한다), 인덱스가 낡았으면 `plan.stale`로 알린다.
- 기본 계획은 같은 값(identical)·exact 매칭만 포함한다. close(±2px·색 ΔE 임계 안)는 `plan.close`에 목록만 남기고 `close: true`(CLI `--close`)일 때만 계획한다.
- 건너뛰는 값: 반투명 색(`translucent-color`), 음수·0, SCSS 변수, 다중 값 단축 속성, UTF-8이 아닌 파일(`binary-or-non-utf8`) 등. 사유별 개수는 `plan.skipped`.
- `applyMigration` — 파일 단위로 재파싱·재추출 검증(속성까지 확인) 후 해시 비교로 쓰고, `.dsmith/migrations/<id>.json`에 기록한다(소스보다 먼저). 한 파일의 쓰기 오류는 그 파일만 `write-failed`로 두고 나머지를 계속 적용한다.
- `revertMigration` — 기록으로 되돌린다. 적용 뒤 사용자가 고친 파일은 건드리지 않는다.

- 결정(`decide`)된 중복 컴포넌트는 import를 DS 쪽으로 바꾼다. props 대응(`mapping`)이 없거나 값이 동적이면 그 사용은 보류(`mapping-missing`)하고, 대상 props를 읽지 못했을 때(npm 패키지 미설치 등)는 안전한 passthrough(`children`·`className`·`style`·`key`·`ref`·`id`·`data-*`·`aria-*`)와 `--map`에 나온 prop 말고는 `target-props-unknown`으로 보류하고, 지역 정의는 지우지 않고 주석만 단다.
- `checkBranch` / `createBranch` / `commitFiles` / `abandonBranch` — `--branch`용 git 단계. git 2.23 이상, 작성자 정보, 깨끗하고 무시되지 않는 대상 파일, 커밋된 토큰·프리셋 파일(아니면 `tokenFiles`·`withTokens` 옵션으로 함께 커밋), 없는 브랜치 이름이 사전 조건이다. push하거나 PR을 열지 않는다.

- JS 테마 토큰(`colors.surface`)으로 바꾸는 치환은 값 자리에 식을 쓴다: 숫자와 값 전체가 한 색인 문자열 리터럴은 노드 전체를 `colors.surface`·`spacing[2]`로 바꾸고, 그 파일에 테마 import가 없으면 `import { colors } from "../theme"`를 더한다(계획의 `files[].imports`, `--revert`가 import까지 되돌린다). React Native 레포는 JS 테마 토큰만 치환하고, 웹 레포는 CSS·W3C 토큰이 있으면 JS 테마 토큰을 치환하지 않는다(참조 해석에만 쓴다). 건너뛰는 경우: 문자열 일부(`"1px solid #000"`)는 `js-ref-in-string`, 같은 이름의 다른 바인딩이 이 파일에 있으면 `js-binding-conflict`, `light`/`dark` 모드 아래 토큰은 후보가 아니다.

`plan.tokens.loaded`는 init의 `tokens.css`를 어딘가에서 import하는지 알린다. 아니면 `notes`와 리포트에 안내가 나온다(적용은 막지 않는다).

CLI: `dsmith migrate [--apply] [--branch <name> [--with-tokens]] [--close] [--rename-prefix] [--revert <id>] [--list]`. 종료 코드 1: 적용하지 못한 파일(롤백·계획 뒤 변경·쓰기 실패)이 있거나, `--revert`에서 되돌리지 못한 파일(적용 뒤 수정됨·없음)이 있을 때. `--branch`의 결과는 커밋됨 / 일부 실패로 커밋 없이 남음(되돌리기 명령 출력) / 적용된 것이 없어 브랜치를 버림 중 하나다.

`dsmith migrate --rename-prefix [--apply [--branch <name> [--with-tokens]]]`: 이전 형식(접두 없는 이전 init 산출) 토큰 이름을 `--ds-` 접두로 바꾼다. 새 init의 토큰은 처음부터 `--ds-`라, Tailwind 4 기본 테마 변수(`--color-*`·`--text-*`·`--radius-*`)를 가리지 않는다. 이미 init하고 migrate한 레포가 이전 형식을 쓰고 있을 때 이 명령으로 옮긴다.
- 기본은 계획만 출력한다(`.dsmith/` 포함 아무것도 쓰지 않음): `토큰 이름 바꾸기: N개 · 참조 R개 · 파일 F개 · var() 밖 언급 M개(바꾸지 않음)`.
- `--apply`는 코드의 `var(--old)` 참조(CSS, 인라인 스타일, styled·emotion 템플릿, sx 문자열, Tailwind 임의값 `[var(--old)]`·`[color:var(--old)]`)만 `var(--ds-old)`로 바꾸고, `.dsmith/migrations/`에 `kind: "rename-prefix"` 기록을 남긴 뒤 init을 `--ds-` 이름으로 다시 실행해 토큰·프리셋 파일을 만든다. 이 재실행은 이전 토큰 파일의 값을 그대로 옮기고 이름만 바꾼다(index가 달라져도 값은 그대로). 문자열 `"--color-blue-400"`·사용자 CSS의 같은 이름 정의처럼 `var()` 밖에 있는 언급은 바꾸지 않고 건수와 위치만 알린다. `var(--color-blue-400-2)`처럼 이름이 더 긴 변수는 건드리지 않는다.
- 이미 `--ds-` 형식이면 알리고 종료 코드 0, 아무것도 쓰지 않는다. 토큰 파일을 사용자가 고쳐 init이 보류하면 쓰기 전에 오류다. 적용 뒤 옛 이름 참조가 남아 있으면(쓰지 못한 파일) 목록과 함께 종료 코드 1이다.
- `--branch`는 다른 migrate 적용과 같이 동작한다: 바뀐 소스와 init이 다시 쓴 토큰·프리셋 파일을 커밋 하나로 묶고(`.dsmith/` 제외), 토큰 파일이 커밋되지 않았으면 쓰기 전에 오류이며 `--with-tokens`로 함께 커밋한다. `.dsmith/guard.json`이 있으면 `dsmith guard init`으로 스냅샷을 갱신하라고 안내한다.
- `dsmith migrate --revert <id>`는 참조를 되돌린 뒤 토큰·프리셋 파일을 이전 형식으로 다시 만든다(`.dsmith/`를 뺀 트리가 적용 전과 같다). 일부 참조를 적용 뒤에 고쳤으면 토큰 파일은 되돌리지 않고 종료 코드 1이다.
- `--files`·`--category`·`--only`·`--close`·`--max-files`·`--list`·`--revert`와는 함께 쓸 수 없다.

Docs: https://github.com/project-hh-org/dsmith#readme
