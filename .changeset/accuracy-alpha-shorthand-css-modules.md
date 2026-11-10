---
"@dsmith-dev/extractor-api": minor
"@dsmith-dev/core": minor
"@dsmith-dev/extractor-css": minor
"@dsmith-dev/extractor-styled": patch
"@dsmith-dev/migrate": patch
"@dsmith-dev/eslint-plugin": minor
"dsmith": minor
---

Accuracy fixes. Translucent colors: normalized colors now carry `alpha` (only when < 1), so a translucent token such as `rgba(0,0,0,.5)` is no longer matched or suggested for an opaque value like `#000`, and translucent usages no longer inflate opaque color counts or leak into drafted tokens; W3C color tokens honor `alpha`. Multi-value shorthands: `padding: 8px 16px`, `margin: 0 16px` and similar now report every length operand (new `classifyDeclarationAll`; `classifyDeclaration` is unchanged), while migrate still skips them as `multi-value`. CSS Modules: new `css-modules` extractor analyzes `*.module.{css,scss}` with the same rules as plain CSS.
