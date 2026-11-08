---
"dsmith": minor
---

`dsmith init`이 새로 만드는 토큰의 CSS 변수 이름에 `--ds-` 접두를 붙인다(`--ds-color-blue-400`·`--ds-space-2`·`--ds-radius-sm`·`--ds-text-xs`).

- **이유**: Tailwind 4 레포에서 접두 없는 `tokens.css`의 비레이어 `:root`가 Tailwind 기본 테마 변수(`--color-*`·`--text-*`·`--radius-*`)를 덮어, 기존 `bg-blue-400`·`text-xs`·`rounded-sm`의 값이 레포 전체에서 바뀌었다. Tailwind 4.3.3을 실제로 빌드하고 브라우저 계산값으로 확인했고, 접두가 있으면 기본 클래스가 Tailwind 값을 그대로 유지한다. 이 회귀는 실제 `compile()`을 도는 상시 테스트로 고정했다.
- **DTCG 경로는 그대로**: `tokens.json`의 `color.blue-400` 경로, `tokens.ts` 키, Tailwind 클래스 키(`bg-ds-blue-400`)는 바뀌지 않고 CSS 변수 이름만 바뀐다. 루트 `$extensions["dev.dsmith"].cssPrefix: "ds"`가 접두를 알리고 `readW3cTokens`가 이를 반영한다. Tailwind 3 프리셋 값과 4 `@theme` 값은 새 이름을 가리킨다.
- **이미 init한 레포는 그대로**: 커밋된 토큰 파일로 이름 형식을 판정해 이전 형식(접두 없음)을 유지하고, 같은 입력이면 바이트까지 같은 파일로 다시 만든다. Tailwind 4 레포가 이전 형식이면 기존 경고를 그 경우에만 낸다. migrate·guard·ESLint·MCP는 파일에서 읽은 이름을 그대로 쓰므로 이전 형식 레포의 동작이 바뀌지 않는다.
- **`dsmith migrate --rename-prefix`**: 이전 형식에서 옮기는 명시적 명령. 기본은 계획만 출력하고, `--apply`가 코드의 `var(--color-…)` 참조(CSS·인라인 스타일·styled/emotion·sx·Tailwind 임의값)와 토큰·프리셋 파일을 함께 바꾸며(`--branch`·`--with-tokens` 지원), `--revert <id>`로 둘 다 되돌린다.
- **재 init 보류**: migrate 적용 기록이 있는데 init 재실행으로 토큰의 값이 바뀌거나 사라지면(코드가 그 이름을 `var()`로 쓰는 경우) 토큰 묶음과 프리셋을 보류하고 `--force`로만 덮어쓴다. 접두만 바꾸는 rename은 대상이 아니다.
- **글꼴 크기 판정**: `--ds-text-*`를 font-size로 읽는다.
- 벤치마크: 베이스 스냅샷 sha256이 바뀌어 이전 결과와 새 실행은 `bench:report`의 병합이 거부한다(의도된 동작).
