export type {
  ExtractContext,
  Extractor,
  ExtractorMeta,
  ExtractorSignals,
  StyleProperty,
  StyleSource,
  StyleUsage,
  TailwindPreset,
  TokenLike,
  TokenRefContext,
  WriteOptions,
  WritePatch,
} from "./extractor.js";
export { JS_FILES, TAILWIND_PRESET_PREFIX, cssVarRef, jsTokenExpression, metaOf } from "./extractor.js";
export { runConformance } from "./conformance.js";
export type { ConformanceCase, ConformanceReport, WriteCase } from "./conformance.js";
