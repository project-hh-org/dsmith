# legacy-demo 적용·방어 쇼케이스

`examples/legacy-demo`(가상의 쇼핑몰 어드민 "모노마켓". 브랜드와 회사는 모두 허구이며 실제 서비스와 무관)에 dsmith를 순서대로 적용하고, 마지막에 하드코딩이 다시 들어오는 PR을 `guard`가 막는 과정을 브랜치 3개로 남겼다. 아래 숫자는 모두 해당 단계의 `--json` 출력에서 가져왔다.

## 브랜치와 비교 링크

`main`에는 머지하지 않는다. 데모 앱 소스가 `main`에서 바뀌면 `audit` 52점을 고정한 e2e 스냅샷이 깨지기 때문이다. 브랜치는 `main`(204012f)에서 시작해 아래 순서로 이어진다.

| 브랜치 | 만든 주체 | 헤드 | 비교 |
| --- | --- | --- | --- |
| `showcase/legacy-demo` | 수동(`git switch -c`) | c82a645 | [main...showcase/legacy-demo](https://github.com/project-hh-org/dsmith/compare/main...showcase/legacy-demo) |
| `showcase/legacy-demo-migrate` | `dsmith migrate --apply --branch`가 생성 | 3aa6b4f | [showcase/legacy-demo...showcase/legacy-demo-migrate](https://github.com/project-hh-org/dsmith/compare/showcase/legacy-demo...showcase/legacy-demo-migrate) |
| `showcase/legacy-demo-drift` | 수동 | e46ddf6 | [showcase/legacy-demo-migrate...showcase/legacy-demo-drift](https://github.com/project-hh-org/dsmith/compare/showcase/legacy-demo-migrate...showcase/legacy-demo-drift) |

`showcase/legacy-demo-migrate`에는 커밋이 둘이다. 9462c73은 dsmith가 직접 만든 커밋(`chore(ds): 하드코딩 28건을 토큰으로, 컴포넌트 import 1건을 DS로 치환 (dsmith migrate)`)이고, 3aa6b4f는 `--close` 적용 결과를 수동으로 커밋한 것이다. `--branch`는 이미 있는 브랜치에는 쓸 수 없어서(`오류: --branch를 쓸 수 없음: 브랜치가 이미 있음`) 두 번째 단계는 같은 브랜치에서 `--branch` 없이 적용했다.

## 단계별 결과

모든 명령에 `--root examples/legacy-demo`를 붙였다. 아래 표에서는 생략한다.

| 단계 | 명령 | 핵심 숫자 |
| --- | --- | --- |
| 1 | `audit` | 건강 점수 52 · 하드코딩 비율 34.2% (하드코딩 60건) |
| 2 | `init --all` | 토큰 14(색 6 · 간격 4 · 모서리 2 · 글꼴 크기 2) · 치환 가능 58/60건(같은 값/정확 29 · 근사 29) |
| 3 | `ai` | 카탈로그: 컴포넌트 6 · 토큰 14, `AGENTS.md` DS 섹션 생성 |
| 4 | `decide --item Button --choose src/components/ui/button --map variant=primary:variant=default --map variant=secondary:variant=outline --map variant=danger:variant=destructive` | Button 결정 1건 · props 대응 3건 |
| 5 | `app/layout.tsx`에 `import "../design-system/tokens.css"` 추가 | 계획 출력의 "토큰 스타일시트가 로드되지 않음" 안내가 사라짐 |
| 6 | `guard init --ci github` | `.dsmith/guard.json`(토큰 14 · DS 컴포넌트 6) · `.github/workflows/dsmith-guard.yml` · ESLint는 `no-config`라 건너뜀 |
| 7 | `migrate --json` (계획) | 치환 28(색 23 · 간격 1 · 모서리 1 · 글꼴 크기 3) · 같은 값 26 · exact 2 · 컴포넌트 import 1 · prop 3 · close 후보 28 · 예상 52 → 64 |
| 8 | `migrate --apply --branch showcase/legacy-demo-migrate` | 치환 28 · 파일 15 · 점수 52 → 64 · 하드코딩 비율 34.2% → 19.3% · 재`audit` 64 |
| 9 | `migrate --apply --close` | 치환 28(전부 close) · 파일 16 · 점수 64 → 71 · 하드코딩 비율 19.3% → 4.3% · 재`audit` 71 |
| 10 | `guard --ci --base showcase/legacy-demo-migrate` (drift 브랜치) | 신규 하드코딩 2 · DS 밖 컴포넌트 1 · exit 1 |

`showcase/legacy-demo`(1~6단계)는 `init`이 만든 `design-system/`, `AGENTS.md`, 워크플로 파일, 강제로 추가한 `.dsmith/guard.json`(`examples/**/.dsmith/`는 gitignore)을 한 커밋에 담았다. `decisions.json` 등 나머지 `.dsmith/` 파일은 커밋하지 않는다. 따라서 4단계의 `decide`는 재현할 때 다시 실행해야 한다.

7단계의 사람용 출력은 "파일 14"로, `--json`의 `plan.files`는 15개다. 토큰 치환이 없고 컴포넌트 import 치환만 있는 `app/orders/page.tsx`가 `--json`에만 더해진다. 8단계 적용 파일 15는 `--json` 기준이다.

## guard 재유입 결과

`showcase/legacy-demo-drift`는 `showcase/legacy-demo-migrate` 위에 커밋 1개(e46ddf6)다. `app/page.tsx`에 하드코딩 색 2개(`#e11d48`, `#9f1239`)와 레거시 `Button`(`@/components/Button`) import 1개를 넣었다.

```
guard --ci --base showcase/legacy-demo-migrate --json
newHardcoded: 2 · newReplaceable: 0 · newNonDs: 1 · newDeprecated: 0 · removedHardcoded: 0
exitCode: 1
```

CLI가 만든 PR 코멘트 본문(`body`)은 다음과 같다.

````markdown
<!-- dsmith:guard -->
### dsmith guard
기준 `showcase/legacy-demo-migrate` (merge-base `3aa6b4f`) · 검사한 변경 파일 1

| 항목 | 신규 | 허용 |
| --- | --- | --- |
| 하드코딩 스타일 | 2 (토큰으로 바꿀 수 있음 0) | 0 |
| DS 밖 컴포넌트 | 1 | – |
| deprecated 컴포넌트 | 0 | 0 |

<details><summary>신규 하드코딩 2건</summary>

| 위치 | 속성 | 값 | 제안 토큰 |
| --- | --- | --- | --- |
| `app/page.tsx:44` | background-color | `#e11d48` | – |
| `app/page.tsx:44` | border-color | `#9f1239` | – |
</details>

<details><summary>신규 DS 밖 컴포넌트 1건</summary>

| 위치 | 컴포넌트 | 모듈 | 권장 |
| --- | --- | --- | --- |
| `app/page.tsx:44` | LegacyButton | `src/components/Button` | src/components/ui/button 사용 |
</details>
````

두 색은 토큰 값과 가깝지 않아 "토큰으로 바꿀 수 있음"은 0이다. 이 경우 제안 토큰 없이 신규 하드코딩으로만 센다.

## 로컬에서 재현

```bash
pnpm install && pnpm -r build
D="node packages/cli/dist/bin.js"; R="--root examples/legacy-demo"
git switch -c my-demo main

$D audit $R
$D init --all $R
$D ai $R
$D decide $R --item Button --choose src/components/ui/button \
  --map "variant=primary:variant=default" --map "variant=secondary:variant=outline" --map "variant=danger:variant=destructive"
# examples/legacy-demo/app/layout.tsx에 import "../design-system/tokens.css"; 추가
(cd examples/legacy-demo && node ../../packages/cli/dist/bin.js guard init --ci github)
git add examples/legacy-demo && git add -f examples/legacy-demo/.dsmith/guard.json
git commit -m "dsmith init·ai·decide·guard init 적용"

$D audit $R
$D migrate $R --json
$D migrate $R --apply --branch my-demo-migrate
$D audit $R --json
$D migrate $R --apply --close      # 브랜치 위에서 close 근사 치환
```

같은 상태를 바로 보려면 위 세 브랜치를 체크아웃해 `audit`·`guard --ci --base showcase/legacy-demo-migrate`를 실행하면 된다. 숫자는 `dsmith` 0.2.0 기준이다.

## 벤치마크

같은 `legacy-demo`에서 UI 생성 프롬프트 12개 × 조건 2 × 반복 3을 `claude -p`로 실측한 결과는 [benchmarks/results/2026-11-07-legacy-demo-k3.md](../../benchmarks/results/2026-11-07-legacy-demo-k3.md)에 있다. 토큰 사용률 평균은 5.9% → 69.4%(차이 +63.5%p, 95% CI [+42.0, +82.6]). 렌더링은 하지 않았고 모델·레포가 하나라는 한계는 보고서에 적혀 있다.
