import { classifyDeclarationAll, lineLocator, parseCssDeclarations } from "@dsmith-dev/core";
import type { ExtractContext, Extractor, StyleUsage } from "@dsmith-dev/extractor-api";
import { registerPatchTarget, tokenRef, write } from "./write.js";

export const EXTRACTOR_NAME = "css";
export const CSS_MODULES_EXTRACTOR_NAME = "css-modules";

/** 스타일시트 선언을 StyleUsage로. `extractorName`만 다르고 규칙은 일반 CSS와 CSS Modules가 같다. */
function extractWith(extractorName: string): (ctx: ExtractContext) => StyleUsage[] {
  return (ctx) => {
    const lineOf = lineLocator(ctx.code);
    const usages: StyleUsage[] = [];

    const lineComments = /\.scss$/.test(ctx.file);
    for (const decl of parseCssDeclarations(ctx.code, 0, { lineComments })) {
      const results = classifyDeclarationAll(decl, {
        file: ctx.file,
        extractor: extractorName,
        code: ctx.code,
        lineOf,
      });
      for (const result of results) {
        if (result.patch !== null) registerPatchTarget(result.usage, { ...result.patch, file: ctx.file });
        usages.push(result.usage);
      }
    }
    return usages;
  };
}

function baseName(file: string): string {
  return file.split(/[\\/]/).pop() ?? file;
}

/** 일반 스타일시트. CSS Modules(`*.module.css`)는 `cssModulesExtractor`가 맡는다(detect가 방식을 따로 보고하므로). */
function appliesTo(ctx: ExtractContext): boolean {
  const base = baseName(ctx.file);
  return /\.(css|scss)$/.test(base) && !base.includes(".module.");
}

export const cssExtractor: Extractor = {
  name: EXTRACTOR_NAME,
  files: ["**/*.{css,scss}"],
  parses: "none",
  signals: { files: ["**/*.{css,scss}", "!**/*.module.{css,scss}"] },
  appliesTo,
  extract: extractWith(EXTRACTOR_NAME),
  write,
  tokenRef,
};

/**
 * CSS Modules(`*.module.{css,scss}`). 선언 값은 일반 CSS와 같은 규칙으로 읽고 같은 방식(`var()`)으로 치환한다 —
 * 지역화되는 건 클래스 이름뿐이고 `:root`의 CSS 변수는 그대로 보인다. 클래스와 컴포넌트의 연결(JS import)은 보지 않는다.
 */
export const cssModulesExtractor: Extractor = {
  name: CSS_MODULES_EXTRACTOR_NAME,
  files: ["**/*.module.{css,scss}"],
  parses: "none",
  signals: { files: ["**/*.module.{css,scss}"] },
  appliesTo: (ctx) => /\.module\.(css|scss)$/.test(baseName(ctx.file)),
  extract: extractWith(CSS_MODULES_EXTRACTOR_NAME),
  write,
  tokenRef,
};
