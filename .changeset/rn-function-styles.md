---
"@dsmith-dev/extractor-react-native": minor
"@dsmith-dev/core": minor
---

React Native: read function-form `style` (`Pressable`'s `({ pressed }) => …`), Reanimated `useAnimatedStyle` return objects, conditional property values, `withTiming`/`withSpring` targets and `interpolateColor` output ranges. Token choice: when several tokens share the same value, prefer the name that fits the property's role (background → `bg`/`surface`, text → `text`/`fg`/`on`, border → `border`/`outline`).
