# @dsmith-dev/extractor-react-native

## 0.5.0

### Minor Changes

- [#7](https://github.com/project-hh-org/dsmith/pull/7) [`54762c2`](https://github.com/project-hh-org/dsmith/commit/54762c253aed6215db885420ccaa1eca3f070e26) Thanks [@dahee90522](https://github.com/dahee90522)! - React Native: read function-form `style` (`Pressable`'s `({ pressed }) => …`), Reanimated `useAnimatedStyle` return objects, conditional property values, `withTiming`/`withSpring` targets and `interpolateColor` output ranges. Token choice: when several tokens share the same value, prefer the name that fits the property's role (background → `bg`/`surface`, text → `text`/`fg`/`on`, border → `border`/`outline`).

### Patch Changes

- Updated dependencies [[`54762c2`](https://github.com/project-hh-org/dsmith/commit/54762c253aed6215db885420ccaa1eca3f070e26)]:
  - @dsmith-dev/core@0.5.0
  - @dsmith-dev/extractor-api@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies []:
  - @dsmith-dev/core@0.4.0
  - @dsmith-dev/extractor-api@0.4.0
