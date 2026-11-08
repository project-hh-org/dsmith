# @dsmith-dev/extractor-react-native

dsmith extractor for React Native styles: `StyleSheet.create` / `compose` / `flatten`, `style` and `*Style` props (objects, arrays, conditional branches, function-form `style={({ pressed }) => …}`), spreads, `Platform.select`, and Reanimated `useAnimatedStyle(() => ({ … }))` return objects. Inside a style object, conditional values (`pressed ? "#eee" : "#fff"`), `withTiming`/`withSpring` targets, and `interpolateColor` output ranges are read per branch/element under the property's key.

Style values that reference an imported theme object (`colors.surface`) are reported with a `ref`; core resolves them against JS theme tokens. Replacements are written as JS expressions.

Not read (known limitations): nested objects inside a style object (`shadowOffset`, `transform`) are not recursed and count as one dynamic `other` usage. Other Reanimated helpers (`interpolate`, `withSequence`, `useAnimatedProps`) are counted as dynamic.

Docs: https://github.com/project-hh-org/dsmith#readme
