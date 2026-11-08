import path from "node:path";
import type { Rule } from "eslint";
import { eligibleFindings, moduleContextOf, moduleKeyOf, parseTsx, type Finding, type GuardSnapshot } from "@dsmith-dev/core";
import { analyze, withStaleNotice, type Analysis } from "../analyze.js";
import { BUILTIN_EXTRACTORS } from "../registry.js";

interface Options {
  reportIneligible?: boolean;
}

interface Fixable {
  start: number;
  end: number;
  replacement: string;
  token: string;
  confidence: "exact" | "close";
}

/** JS 테마 토큰인데 이 파일이 그 export를 값으로 import하지 않았다 — ESLint 규칙은 단일 파일·동기라 import를 넣지 않는다(import 편집은 migrate만) */
interface NeedsImport {
  needsImport: string;
}

/** 파일이 `token.js`의 export를 값으로 import한 로컬 식(`colors`, 별칭 `c`, 네임스페이스 `t.colors`). 없으면 null */
function importedLocal(a: Analysis, code: string, js: NonNullable<GuardSnapshot["tokens"][number]["js"]>): string | null {
  let body;
  try {
    body = parseTsx(code, a.file).program.body;
  } catch {
    return null;
  }
  const mc = moduleContextOf(a.snapshot);
  for (const stmt of body) {
    if (stmt.type !== "ImportDeclaration" || stmt.importKind === "type" || stmt.importKind === "typeof") continue;
    if (moduleKeyOf(a.file, stmt.source.value, a.snapshot.moduleContext.tsPaths, mc) !== js.module) continue;
    for (const s of stmt.specifiers) {
      if ("importKind" in s && (s.importKind === "type" || s.importKind === "typeof")) continue;
      if (s.type === "ImportNamespaceSpecifier") return `${s.local.name}.${js.export}`;
      if (s.type === "ImportDefaultSpecifier" && js.export === "default") return s.local.name;
      if (s.type === "ImportSpecifier") {
        const imported = s.imported.type === "Identifier" ? s.imported.name : s.imported.value;
        if (imported === js.export) return s.local.name;
      }
    }
  }
  return null;
}

/** 필요한 import 문 안내(상대 경로 기준) */
function importHint(a: Analysis, js: NonNullable<GuardSnapshot["tokens"][number]["js"]>): string {
  const rel = path.posix.relative(path.posix.dirname(a.file), js.module);
  const spec = rel.startsWith(".") ? rel : `./${rel}`;
  return js.export === "default" ? `import theme from "${spec}"` : `import { ${js.export} } from "${spec}"`;
}

/** finding의 원 usage를 같은 Extractor의 tokenRef·write로 치환 구간으로 바꾼다. 참조 형식이 없으면 null */
function fixOf(a: Analysis, f: Finding, code: string): Fixable | NeedsImport | null {
  const replacement = f.style?.replacement;
  if (f.usageIndex === undefined || replacement == null) return null;
  const usage = a.usages[f.usageIndex];
  const token = a.snapshot.tokens[replacement.tokenIndex];
  if (usage === undefined || token === undefined) return null;
  const extractor = Object.hasOwn(BUILTIN_EXTRACTORS, usage.extractor) ? BUILTIN_EXTRACTORS[usage.extractor] : undefined;
  if (extractor?.tokenRef === undefined) return null;
  const preset = a.snapshot.preset;
  const js = token.js;
  let jsLocal: Record<string, string> | undefined;
  if (js !== undefined) {
    if (extractor.tokenRef(token, usage, {}) === null) return null;
    const local = importedLocal(a, code, js);
    if (local === null) return { needsImport: importHint(a, js) };
    jsLocal = { [js.export]: local };
  }
  const ref = extractor.tokenRef(token, usage, { ...(preset?.linked === true ? { preset } : {}), ...(jsLocal === undefined ? {} : { jsLocal }) });
  if (ref === null) return null;
  const patch = extractor.write(usage, ref, js === undefined ? undefined : { expression: true });
  if (patch === null) return null;
  return { start: patch.start, end: patch.end, replacement: patch.replacement, token: replacement.token, confidence: replacement.confidence };
}

export const noHardcodedStyle: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: { description: "Disallow hardcoded style values that have a design token" },
    fixable: "code",
    hasSuggestions: true,
    schema: [
      {
        type: "object",
        properties: { reportIneligible: { type: "boolean" } },
        additionalProperties: false,
      },
    ],
    messages: {
      finding: "{{message}}",
      replace: "{{token}}로 바꾸기",
      replaceStale: "{{token}}로 바꾸기 (guard.json이 낡아 자동 수정하지 않음 — 토큰이 바뀌었는지 확인)",
    },
  },
  create(context) {
    const options = (context.options[0] ?? {}) as Options;
    const sourceCode = context.sourceCode;
    return {
      Program() {
        const a = analyze(context);
        if (a === null) return;
        const findings = a.styleFindings.filter((f) => f.rule === "no-hardcoded-style");
        const stale = a.stale.length > 0;
        for (const f of options.reportIneligible === true ? findings : eligibleFindings(findings)) {
          const data = { message: withStaleNotice(a, f.message) };
          const fix = fixOf(a, f, sourceCode.text);
          if (fix === null) {
            context.report({ loc: { line: f.line, column: f.column }, messageId: "finding", data });
            continue;
          }
          if ("needsImport" in fix) {
            // 고칠 값은 알지만 import가 없다 — fix·suggest 없이 안내만(import 삽입은 `dsmith migrate`가 한다)
            context.report({ loc: { line: f.line, column: f.column }, messageId: "finding", data: { message: `${data.message} (import 필요: ${fix.needsImport})` } });
            continue;
          }
          const loc = { start: sourceCode.getLocFromIndex(fix.start), end: sourceCode.getLocFromIndex(fix.end) };
          const edit = (fixer: Rule.RuleFixer): Rule.Fix => fixer.replaceTextRange([fix.start, fix.end], fix.replacement);
          // 스냅샷이 낡았으면 토큰이 바뀌었거나 없어졌을 수 있다 — exact여도 자동 수정(--fix) 대신 제안으로만 낸다.
          if (fix.confidence === "exact" && !stale) context.report({ loc, messageId: "finding", data, fix: edit });
          else context.report({ loc, messageId: "finding", data, suggest: [{ messageId: stale ? "replaceStale" : "replace", data: { token: fix.token }, fix: edit }] });
        }
      },
    };
  },
};
