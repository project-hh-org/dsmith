합성 산출물 — 실측 아님. 채점 파이프라인 테스트용이며 README 숫자에 쓰지 않는다.

`legacy-demo/<조건>/<프롬프트 id>/<반복>/{files/…, run.json}` — 손으로 쓴 `01-form`·`06-badge`·`12-pagination` 세 프롬프트의 baseline·dsmith 산출물이다.
`pnpm --filter dsmith-benchmarks bench:replay`가 이 디렉터리를 채점한다(네트워크·에이전트 없음). 실행기가 `--agent`로 기록하는 배치와 같은 모양이다.

- baseline: Tailwind 기본 클래스 위주, 임의값 하드코딩(`py-[3px]`, `bg-[#3b82f6]`), `01-form`에서 레거시 `@/components/Button` import
- dsmith: `var(--ds-color-…)`·`p-[var(--ds-space-…)]` 토큰, `@/components/ui/button` import, `12-pagination`에 지어낸 `var(--ds-color-brand)` 1개(`knownToken`과 `token`의 차이를 보이려고)
- `run.json`은 `{ "status": "replay" }`만 — 비용·시간 없음

`rn-app/` — 합성 Expo 앱(`fixtures/rn-app`)용 같은 모양의 세트. `04-summary-card`·`06-status-badge`·`10-settings-screen` 세 프롬프트(`benchmarks/prompts-rn`)의 baseline·dsmith 산출물이다.

- baseline: `StyleSheet.create` 안의 hex 색·숫자 길이 하드코딩
- dsmith: `src/theme.ts`의 `colors`·`spacing`·`radius`·`typography`를 `import`해서 `colors.surface`·`spacing.md`·`...typography.caption` 참조로 씀. `06-status-badge`에 테마에 없는 `colors.warning` 하나(dsmith 채점은 토큰으로 안 세고, 독립 채점은 JS 테마 참조로 세며, 타입 검사는 오류로 잡는 차이를 보이려고)

비공개 앱(`knowing-saju`)의 산출물은 이 디렉터리에 넣지 않는다.
