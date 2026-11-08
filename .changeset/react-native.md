---
"dsmith": minor
---

React Native(Expo) 앱에서 `detect → audit → init → ai → migrate → guard` 전 구간이 의미 있는 결과를 내게 한다. 새 패키지 `@dsmith-dev/extractor-react-native`(방식 이름 `react-native-stylesheet`)가 추가된다.

- **RN Extractor**: `StyleSheet.create`·`compose`·`flatten` 인자, JSX `style`·`*Style`(`contentContainerStyle` 등)의 객체·배열 원소·`&&`/삼항 가지, `Platform.select` 값을 읽는다. 단위 없는 숫자는 dp(px)로 센다. `style={styles.x}`는 동적 값 한 건이고 정의(`create`)의 값만 점수에 들어가 이중 계산이 없다. 프레임워크가 React Native이면 `detect`가 `inline-style`을 대신 빼고(`overrides.activeExtractors`로 되돌릴 수 있음), `components/ui.tsx` 같은 파일 하나짜리 로컬 DS도 감지한다.
- **JS 테마 토큰(웹 포함)**: 앱이 이미 가진 `export const colors = { … } as const` 모양의 JS 모듈(후보 파일 중 토큰 2개 이상이고 다른 파일이 import하는 것)을 토큰으로 읽는다(`ds.jsThemes`). `colors.surface`·`spacing.md`·`...typography.caption` 같은 테마 멤버 참조를 `audit`·`guard`·ESLint·MCP·벤치마크가 한 규칙으로 토큰 사용으로 센다. `migrate`는 React Native 레포에서 하드코딩 값을 `colors.surface`·`spacing[2]` 같은 테마 참조로 바꾸고 파일에 import가 없으면 더하며(`--revert`가 import까지 되돌림), 웹 레포는 CSS·W3C 토큰이 있으면 JS 테마 토큰을 참조 해석에만 쓴다. `light`/`dark` 모드 객체 아래 토큰은 치환 후보가 아니다. ESLint는 이미 그 export를 import한 파일에서만 자동 수정하고, MCP `resolve_token`은 `colors.surface`도 받아 `token.ref`(`css` | `js`)를 돌려준다.
- **init (React Native)**: 쓰이는 JS 테마가 있으면 토큰 파일을 하나도 만들지 않고 그 테마로 토큰 수와 커버리지를 계산한다(`InitResult.tokenSource`가 `js-theme`). 테마가 없으면 RN 형식 `design-system/tokens.ts`(`export const colors/spacing/radius/fontSize = {…} as const`, 단위 없는 숫자)만 만든다. `tokens.css`·`tokens.json`·Tailwind 프리셋·웹 스캐폴드는 만들지 않으며, 이전 산출이 있으면 그대로 두고 경고한다. 웹 레포의 `init` 산출은 바이트까지 이전과 같다.
- **audit 수치 변화(`examples/legacy-demo`)**: 웹 레포의 JS 테마(`src/lib/theme.ts`) 직접 참조 3건이 동적 값에서 토큰 사용으로 바뀌어 동적 값 13 → 10, hardcodedShare 0.3422 → 0.3368이 된다(점수 52 유지). `migrate` 계획 28건과 `init` 산출은 그대로다.
- **새 패키지 첫 게시**: `@dsmith-dev/extractor-react-native`는 npm에 처음 올라가므로 `NPM_TOKEN`에 "All packages" 권한이 필요하다(`docs/release.md`의 "새 패키지의 첫 게시").
