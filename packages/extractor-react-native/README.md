# @dsmith-dev/extractor-react-native

dsmith extractor for React Native styles: `StyleSheet.create` / `compose` / `flatten`, `style` and `*Style` props (objects, arrays, conditional branches), spreads and `Platform.select`.

Style values that reference an imported theme object (`colors.surface`) are reported with a `ref`; core resolves them against JS theme tokens. Replacements are written as JS expressions.

Docs: https://github.com/project-hh-org/dsmith#readme
