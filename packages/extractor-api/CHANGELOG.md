# @dsmith-dev/extractor-api

## 0.6.0

### Minor Changes

- [#9](https://github.com/project-hh-org/dsmith/pull/9) [`9c14fe7`](https://github.com/project-hh-org/dsmith/commit/9c14fe7e59205d02d32cc6002e43d83b276735b0) Thanks [@dahee90522](https://github.com/dahee90522)! - Accuracy fixes. Translucent colors: normalized colors now carry `alpha` (only when < 1), so a translucent token such as `rgba(0,0,0,.5)` is no longer matched or suggested for an opaque value like `#000`, and translucent usages no longer inflate opaque color counts or leak into drafted tokens; W3C color tokens honor `alpha`. Multi-value shorthands: `padding: 8px 16px`, `margin: 0 16px` and similar now report every length operand (new `classifyDeclarationAll`; `classifyDeclaration` is unchanged), while migrate still skips them as `multi-value`. CSS Modules: new `css-modules` extractor analyzes `*.module.{css,scss}` with the same rules as plain CSS.

## 0.5.0

No changes in this release.

## 0.4.0

No changes in this release.

## 0.3.0

No changes in this release.

## 0.2.1

No changes in this release.

## 0.2.0

### Minor Changes

- [`fe33b86`](https://github.com/project-hh-org/dsmith/commit/fe33b8669a0e11ca5275e507f4a683e78901219c) Thanks [@dahee90522](https://github.com/dahee90522)! - 적용·방어: `dsmith migrate`(토큰·결정 기반 컴포넌트 치환, 되돌리기, 브랜치 커밋), `dsmith guard`(ESLint 플러그인·PR 드리프트 검사), 규칙 엔진 공유.

## 0.1.0

### Minor Changes

- [#1](https://github.com/project-hh-org/dsmith/pull/1) [`c012770`](https://github.com/project-hh-org/dsmith/commit/c012770cbec9c8ea0f42d1895307abbc741dc2d1) Thanks [@dahee90522](https://github.com/dahee90522)! - 첫 공개 배포: detect·audit, Extractor 6종
