# @dsmith-dev/detect

Repository detection for dsmith: styling approach, design system, framework, Storybook and lint.

## React Native

- 프레임워크: `react-native` 또는 `expo` 의존성이면 `framework.name`이 `react-native`다.
- 스타일링 방식 `react-native-stylesheet`: `react-native` 의존성 또는 소스의 `StyleSheet.create(`. 프레임워크가 React Native이면 `inline-style`을 방식과 `activeExtractors`에서 빼고(RN Extractor가 `style={{ … }}`도 읽어 같은 값을 두 번 세지 않게), 근거에 `supersedes: inline-style`을 남긴다. `overrides.activeExtractors`로 되돌릴 수 있다. 웹 프레임워크(Next + react-native-web)에서는 빼지 않는다.
- 파일 하나로 된 로컬 DS: `components/ui`·`src/components/ui`·`src/ui`의 `.tsx`·`.ts`·`.jsx`·`.js` 파일이 있으면 `ds`가 `{ kind: "local", dir, entry }`이다(`dir`은 확장자를 뗀 module 키).

## JS 테마 모듈

`export const colors = { … } as const` 모양의 모듈이 쓰이면 `ds.jsThemes: { file, module, exports, importers }[]`로 보고하고 그 파일을 `ds.tokenFiles`에 넣는다(웹·React Native 공통). 후보 파일 중 core `readJsThemeTokens`로 읽은 토큰이 2개 이상이고, 다른 소스 파일이 그 module을 1개 이상 import하는 것만 테마로 본다. init이 만든 `tokens.ts`(옆에 `tokens.json`)는 후보가 아니다.

Docs: https://github.com/project-hh-org/dsmith#readme
